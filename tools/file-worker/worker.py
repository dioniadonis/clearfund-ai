#!/usr/bin/env python3
"""ClearFund file worker. Runs on the Mac mini every 10 minutes (launchd).

1. Emails the application + private upload link to newly qualified owners (from Zoho).
2. Sends document reminders on day 1, 3 and 7.
3. Downloads uploaded bank statements, reads them locally (pdftotext, OCR fallback,
   optional local Ollama model), writes back summary figures only, deletes the copies.

Nothing about statement contents is printed or logged. Standard library only.
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import shutil
import smtplib
import ssl
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

from statement_parser import name_match, parse_statement

HOME = Path(os.environ.get("CLEARFUND_HOME", Path.home() / "clearfund"))
ENV_FILE = HOME / "file-worker.env"
STATE_FILE = HOME / "file-worker-state.json"
MAILING_ADDRESS = "ClearFund AI, 650 Ponce De Leon Ave, Ste 300 #1571, Atlanta, GA 30308"


def log(msg: str) -> None:
    print(f"[file-worker] {msg}", flush=True)


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    env.update({k: v for k, v in os.environ.items() if k.startswith(("CF_", "SUPABASE_", "ZOHO_"))})
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_ANON_KEY", "CF_WORKER_EMAIL", "CF_WORKER_PASSWORD", "ZOHO_USER", "ZOHO_APP_PASSWORD") if not env.get(k)]
    if missing:
        log("missing settings: " + ", ".join(missing))
        sys.exit(2)
    return env


class Api:
    def __init__(self, env: dict[str, str]):
        self.url = env["SUPABASE_URL"].rstrip("/")
        self.anon = env["SUPABASE_ANON_KEY"]
        token = self._request("POST", "/auth/v1/token?grant_type=password",
                              {"email": env["CF_WORKER_EMAIL"], "password": env["CF_WORKER_PASSWORD"]}, auth=False)
        self.jwt = token["access_token"]

    def _request(self, method: str, path: str, body=None, auth: bool = True, raw: bool = False):
        headers = {"apikey": self.anon, "Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = f"Bearer {self.jwt}"
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.url + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                payload = res.read()
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            raise RuntimeError(f"{method} {path.split('?')[0]} failed {e.code}: {detail}") from None
        if raw:
            return payload
        return json.loads(payload) if payload else None

    def rpc(self, name: str, args: dict | None = None):
        return self._request("POST", f"/rest/v1/rpc/{name}", args or {})

    def download(self, bucket: str, path: str) -> bytes:
        return self._request("GET", f"/storage/v1/object/authenticated/{bucket}/{urllib.parse.quote(path)}", raw=True)


class Mailer:
    def __init__(self, env: dict[str, str]):
        self.user = env["ZOHO_USER"]
        self.password = env["ZOHO_APP_PASSWORD"]
        self.sender_name = env.get("CF_SENDER_NAME", "Mark")
        self.host = env.get("ZOHO_SMTP_HOST", "smtp.zoho.com")
        self.cap = int(env.get("CF_DAILY_EMAIL_CAP", "20"))
        self.state = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
        self.today = date.today().isoformat()
        self.sent_today = int(self.state.get("sent", {}).get(self.today, 0))
        self._smtp = None

    @property
    def room(self) -> int:
        return max(0, self.cap - self.sent_today)

    def send(self, to: str, subject: str, text: str) -> None:
        if self.room <= 0:
            raise RuntimeError("daily email cap reached")
        if self._smtp is None:
            self._smtp = smtplib.SMTP_SSL(self.host, 465, context=ssl.create_default_context(), timeout=60)
            self._smtp.login(self.user, self.password)
        msg = EmailMessage()
        msg["From"] = formataddr((f"{self.sender_name} at ClearFund", self.user))
        msg["To"] = to
        msg["Subject"] = subject
        msg["Message-ID"] = make_msgid(domain=self.user.split("@")[-1])
        msg.set_content(text)
        self._smtp.send_message(msg)
        self.sent_today += 1
        self.state["sent"] = {self.today: self.sent_today}
        STATE_FILE.write_text(json.dumps(self.state))

    def close(self) -> None:
        if self._smtp is not None:
            try:
                self._smtp.quit()
            except Exception:
                pass


def first_name(owner: str | None) -> str:
    return (owner or "").strip().split(" ")[0] if owner and owner.strip() else "there"


def new_link(env: dict[str, str]) -> tuple[str, str]:
    token = secrets.token_hex(24)  # 48 hex characters, matches the upload page
    base = env.get("CF_APP_URL", "https://clearfundai.com").rstrip("/")
    return f"{base}/merchant-resume?token={token}", hashlib.sha256(token.encode()).hexdigest()


def app_email(job: dict, link: str, sender: str) -> tuple[str, str]:
    biz = job.get("business_name") or "your business"
    body = f"""Hi {first_name(job.get('owner_name'))},

Thanks for speaking with us today. Here is the private link to sign the application for {biz} and upload your last 3 to 4 months of business bank statements. PDFs downloaded from your bank's website work best.

{link}

It only takes a few minutes. The link is just for your business, so please don't forward it. If you have any questions, reply to this email.

{sender}
ClearFund

{MAILING_ADDRESS}
If you'd rather not hear from us, reply and let me know.
"""
    return f"Your ClearFund application for {biz}", body


def reminder_email(job: dict, link: str, sender: str) -> tuple[str, str]:
    n = int(job.get("reminder_number", 1))
    biz = job.get("business_name") or "your business"
    opener = {
        1: "Just a quick reminder about your application.",
        2: "Following up on your application.",
        3: "This is my last reminder about your application.",
    }.get(n, "Following up on your application.")
    body = f"""Hi {first_name(job.get('owner_name'))},

{opener} To keep things moving for {biz}, sign the application and upload your last 3 to 4 months of business bank statements here:

{link}

If now isn't a good time, just reply and tell me when to check back.

{sender}
ClearFund

{MAILING_ADDRESS}
If you'd rather not hear from us, reply and let me know.
"""
    return f"Reminder: your ClearFund application for {biz}", body


def pdf_text(pdf: Path, work: Path) -> tuple[str, str]:
    """Text from a PDF: pdftotext first, OCR when the PDF is a scan."""
    out = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, timeout=120)
    text = out.stdout.decode(errors="replace") if out.returncode == 0 else ""
    if len(text.strip()) >= 200:
        return text, "text"
    if not shutil.which("tesseract") or not shutil.which("pdftoppm"):
        return text, "text"
    prefix = work / "page"
    subprocess.run(["pdftoppm", "-r", "300", "-png", "-l", "6", str(pdf), str(prefix)], capture_output=True, timeout=300)
    pages = []
    for img in sorted(work.glob("page*.png")):
        r = subprocess.run(["tesseract", str(img), "-", "--psm", "6"], capture_output=True, timeout=300)
        pages.append(r.stdout.decode(errors="replace"))
        img.unlink(missing_ok=True)
    return "\n".join(pages), "ocr"


def ollama_parse(text: str, env: dict[str, str]) -> dict | None:
    """Last resort: ask a local model (never a hosted one) for the two figures."""
    model = env.get("CF_OLLAMA_MODEL")
    if not model:
        return None
    prompt = ("From this bank statement text, return JSON with keys statement_end_date (YYYY-MM-DD) and "
              "total_deposits (number, the statement's total deposits/credits for the period). Use null if unknown.\n\n"
              + text[:8000])
    req = urllib.request.Request("http://127.0.0.1:11434/api/generate",
                                 data=json.dumps({"model": model, "prompt": prompt, "format": "json", "stream": False}).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as res:
            out = json.loads(json.loads(res.read())["response"])
        end = str(out.get("statement_end_date") or "")
        dep = out.get("total_deposits")
        if len(end) >= 7 and end[:4].isdigit() and isinstance(dep, (int, float)) and dep >= 0:
            return {"month": end[:7], "deposits": round(float(dep), 2), "nsf": 0, "negative_end": False}
    except Exception:
        return None
    return None


def read_file_job(api: Api, job: dict, env: dict[str, str]) -> None:
    statements, unreadable, methods, matches = [], [], set(), []
    work = Path(tempfile.mkdtemp(prefix="cf-", dir=HOME / "tmp"))
    try:
        os.chmod(work, 0o700)
        for i, doc in enumerate(job.get("documents") or []):
            pdf = work / f"s{i}.pdf"
            pdf.write_bytes(api.download("va-documents", doc["file_path"]))
            text, method = pdf_text(pdf, work)
            row = parse_statement(text)
            if row is None:
                row = ollama_parse(text, env)
                method = "local_model" if row else method
            pdf.unlink(missing_ok=True)
            if row is None:
                unreadable.append(i + 1)
                continue
            methods.add(method)
            statements.append(row)
            m = name_match(text, job.get("business_name"))
            if m is not None:
                matches.append(m)
            del text
    finally:
        shutil.rmtree(work, ignore_errors=True)
    summary = {
        "method": "+".join(sorted(methods)) or "none",
        "statements": statements,
        "name_match": (any(matches) if matches else None),
        "unreadable_files": unreadable,
    }
    result = api.rpc("fw_save_summary", {"_lead_id": job["lead_id"], "_summary": summary})
    log(f"read {job['lead_id']}: {len(statements)} statements, eligible={result.get('eligible')}")


def main() -> int:
    env = load_env()
    (HOME / "tmp").mkdir(parents=True, exist_ok=True)
    api = Api(env)
    jobs = api.rpc("fw_jobs")
    mailer = Mailer(env)
    sender = env.get("CF_SENDER_NAME", "Mark")
    failures = 0
    try:
        for job in jobs.get("send_app", []):
            if mailer.room <= 0:
                log("daily email cap reached; the rest wait for tomorrow")
                break
            link, token_hash = new_link(env)
            subject, body = app_email(job, link, sender)
            try:
                mailer.send(job["email"], subject, body)
                api.rpc("fw_app_sent", {"_lead_id": job["lead_id"], "_token_hash": token_hash})
                log(f"application sent for {job['lead_id']}")
            except Exception as e:
                failures += 1
                log(f"application for {job['lead_id']} failed: {e}")
        for job in jobs.get("remind", []):
            if mailer.room <= 0:
                break
            link, token_hash = new_link(env)
            subject, body = reminder_email(job, link, sender)
            try:
                mailer.send(job["email"], subject, body)
                api.rpc("fw_reminder_sent", {"_lead_id": job["lead_id"], "_token_hash": token_hash})
                log(f"reminder {job.get('reminder_number')} sent for {job['lead_id']}")
            except Exception as e:
                failures += 1
                log(f"reminder for {job['lead_id']} failed: {e}")
    finally:
        mailer.close()
    for job in jobs.get("read", []):
        try:
            read_file_job(api, job, env)
        except Exception as e:
            failures += 1
            log(f"reading files for {job['lead_id']} failed: {str(e)[:200]}")
    log(f"done: {len(jobs.get('send_app', []))} new, {len(jobs.get('remind', []))} reminders, {len(jobs.get('read', []))} files, {failures} failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
