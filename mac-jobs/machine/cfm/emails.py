"""Find email addresses for leads, free first. Never sends an email, never signs up for anything.

Order of methods (each only runs if the earlier ones found nothing):
  1. sba_sbs  - SBA Small Business Search (search.certifications.sba.gov), the public directory that replaced
                DSBS. Every SAM-registered small business has a profile with a contact person, email, phone and
                website that the OWNER chose to publish. Free, no login, no key. Lookup is by UEI (federal leads)
                or by exact company name + state. Rows where the owner hid the email (display_email=false) are
                skipped and never used. Covers federal awardees well; local and brand-new firms only if they
                registered in SAM.
  2. website  - the lead's own website (from the lead row or from its SBS profile): home page and contact/about
                pages, mailto links, plain-text and Cloudflare-obfuscated addresses. Goes through cfm.http.fetch,
                so robots.txt and the per-host delay apply.
  3. guess    - OFF by default (--guess). first.last@ / first@ / flast@ patterns from an officer name + the domain.
                A guess is never send-ready unless an SMTP check (--smtp) or an outside verifier says it is valid.

Checks (no message is ever sent). Every email ends up valid, invalid or risky; only "valid" reaches the sender.
  - MyEmailVerifier (free plan, 100 checks a day, the owner's own account). The API key is read ONLY from the
    environment variable MYEMAILVERIFIER_API_KEY, never from a file, and is never printed. The script stops at
    95 checks a day (MEV_DAILY_LIMIT can lower it), waits 2 seconds between checks, caches every answer in
    machine/data/email_checks/ so no address is paid for twice, and picks up tomorrow where it stopped.
  - Free fallback when no key is set: domain lookup (MX). No mail server = invalid; otherwise risky, because a
    domain lookup can't tell whether the mailbox exists.
  - --smtp: RCPT check on port 25, quits before DATA. Home internet blocks port 25, so leave it off on the Mac.
  - import-verify: read a results CSV exported from any verifier and set email_verified.

Columns added to the file: email (only filled if empty), email_source, email_contact, email_verified
(valid / invalid / risky), email_check (what was checked), website (if empty), sbs_uei.

Usage (run from machine/):
  python3 -m cfm.emails enrich ../leads/contract_award_leads.csv            # name column auto-detected
  python3 -m cfm.emails enrich ../leads/federal_leads.csv --limit 500        # uses the uei column
  python3 -m cfm.emails sbs-list --naics 236,237,238,561720 --out ../leads/cold/sbs_contacts.csv
  python3 -m cfm.emails verify ../leads/contract_award_leads.csv ../leads/partners_national.csv
  python3 -m cfm.emails send-ready ../leads/*.csv --out ../outreach/send_ready.csv   # valid emails only
  python3 -m cfm.emails import-verify ../leads/contract_award_leads.csv verifier_results.csv
  python3 -m cfm.emails selftest                                              # offline parser tests
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import random
import re
import shutil
import socket
import string
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

from . import http as H
from . import states as STATES

SBS = "https://search.certifications.sba.gov"
SBS_SEARCH = SBS + "/_api/v2/search"
SBS_DELAY = 1.5  # seconds between SBS requests; the site has no robots.txt and no stated limit, so stay gentle
CONTACT_PATHS = ["", "contact", "contact-us", "contactus", "contact.html", "about", "about-us"]
WEBMAIL = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com", "msn.com",
           "comcast.net", "att.net", "bellsouth.net", "live.com", "me.com", "verizon.net", "sbcglobal.net"}
BAD_LOCAL = re.compile(r"^(no-?reply|donotreply|privacy|abuse|postmaster|webmaster|example|test|email|user|name|"
                       r"yourname|your|sentry|wordpress|admin@wix)", re.I)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}")
SUFFIX = re.compile(r"\b(LLC|L L C|INC|INCORPORATED|CORP|CORPORATION|CO|COMPANY|LTD|LP|LLP|PLLC|PC|PA|THE|DBA)\b")
OUT_COLS = ["email", "email_source", "email_contact", "email_verified", "email_check", "website", "sbs_uei"]
STATE_NAMES = {"AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
               "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida",
               "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
               "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
               "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
               "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
               "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
               "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
               "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
               "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"}
STATE_CODES = {v.upper(): k for k, v in STATE_NAMES.items()}


# ---------- names ----------
def norm(name: str) -> str:
    s = (name or "").upper().replace("&", " AND ")
    s = re.sub(r"\bD/?B/?A\b.*$", " ", s)  # drop "dba ..." tails
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    s = SUFFIX.sub(" ", s)
    return " ".join(s.split())


def core_name(name: str) -> str:
    """Search phrase: the name without legal suffixes or punctuation, in normal case."""
    s = re.sub(r"\(.*?\)", " ", name or "")
    s = re.sub(r",?\s*\b(d/?b/?a)\b.*$", " ", s, flags=re.I)
    s = re.sub(r"[^A-Za-z0-9&' -]", " ", s)
    s = SUFFIX.sub(" ", s.upper())
    return " ".join(s.split()).title()


def state_code(s: str) -> str:
    s = (s or "").strip().upper()
    return STATE_CODES.get(s, s if len(s) == 2 else "")


def domain_of(url_or_email: str) -> str:
    s = (url_or_email or "").strip().lower()
    if "@" in s and "/" not in s:
        return s.split("@", 1)[1]
    if s and "://" not in s:
        s = "http://" + s
    host = urlparse(s).netloc.split(":")[0]
    return host[4:] if host.startswith("www.") else host


# ---------- 1. SBA Small Business Search ----------
_sbs_last = 0.0
_session = requests.Session()
_session.headers.update({"User-Agent": H.UA, "Content-Type": "application/json", "Accept": "application/json"})


def _sbs_body(term: str = "", naics: list[str] | None = None) -> dict:
    # Same body the site's own search page sends (seen on the public page, Nov 2026).
    return {"searchProfiles": {"searchTerm": term},
            "location": {"states": [], "zipCodes": [], "counties": [], "districts": [], "msas": []},
            "sbaCertifications": {"activeCerts": [], "isPreviousCert": False, "operatorType": "Or"},
            "naics": {"codes": [{"value": c, "label": c} for c in (naics or [])], "isPrimary": False,
                      "operatorType": "Or"},
            "selfCertifications": {"certifications": [], "operatorType": "Or"},
            "keywords": {"list": [], "operatorType": "Or"},
            "lastUpdated": {"date": {"label": "Anytime", "value": "anytime"}},
            "samStatus": {"isActiveSAM": False}, "qualityAssuranceStandards": {"qas": []},
            "bondingLevels": {"constructionIndividual": "", "constructionAggregate": "", "serviceIndividual": "",
                              "serviceAggregate": ""},
            "businessSize": {"relationOperator": "at-least", "numberOfEmployees": ""},
            "annualRevenue": {"relationOperator": "at-least", "annualGrossRevenue": ""}, "entityDetailId": ""}


def sbs_search(term: str = "", naics: list[str] | None = None, timeout: int = 120) -> list[dict]:
    global _sbs_last
    if not H.allowed(SBS_SEARCH):
        raise H.Blocked("robots.txt disallows the SBS search")
    wait = _sbs_last + SBS_DELAY - time.time()
    if wait > 0:
        time.sleep(wait)
    _sbs_last = time.time()
    r = _session.post(SBS_SEARCH, json=_sbs_body(term, naics), timeout=timeout)
    if r.status_code in (401, 403, 429):
        raise H.Blocked(f"SBS answered {r.status_code}; stop and try later, don't route around it")
    r.raise_for_status()
    return r.json().get("results") or []


def sbs_contact(rec: dict) -> dict | None:
    """Public contact from one SBS record, or None if the owner hid the email or the profile isn't public."""
    if rec.get("public_display") is False or rec.get("display_email") is False:
        return None
    email = (rec.get("email") or "").strip()
    if not EMAIL_RE.fullmatch(email):
        return None
    site = (rec.get("website") or "").strip()
    if "@" in site:  # some owners typed an email in the website box
        site = ""
    return {"email": email.lower(), "email_contact": (rec.get("contact_person") or "").title(),
            "website": site, "sbs_uei": rec.get("uei", ""), "phone": rec.get("phone") if rec.get("display_phone") else "",
            "state": state_code(rec.get("state", "")), "year_established": rec.get("year_established") or "",
            "name": rec.get("legal_business_name") or ""}


def sbs_match(results: list[dict], name: str = "", state: str = "", uei: str = "") -> dict | None:
    """Pick the record that is really this lead: same UEI, or same normalized name (legal or DBA) and same state."""
    want, st = norm(name), state_code(state)
    for rec in results:
        if uei and rec.get("uei", "").upper() == uei.upper():
            return rec
    if not want:
        return None
    for rec in results:
        names = {norm(rec.get("legal_business_name", "")), norm(rec.get("dba_name", ""))}
        if want in names and (not st or state_code(rec.get("state", "")) == st):
            return rec
    return None


def sbs_lookup(name: str = "", state: str = "", uei: str = "", search=sbs_search) -> dict | None:
    if uei:
        rec = sbs_match(search(uei), uei=uei)
        if rec:
            return sbs_contact(rec)
    cn = core_name(name)
    if len(cn) < 4:
        return None
    rec = sbs_match(search(f'"{cn}"'), name=name, state=state)
    return sbs_contact(rec) if rec else None


# ---------- 2. the lead's own website ----------
def _cf_decode(hexstr: str) -> str:
    try:
        key = int(hexstr[:2], 16)
        return "".join(chr(int(hexstr[i:i + 2], 16) ^ key) for i in range(2, len(hexstr), 2))
    except ValueError:
        return ""


def extract_emails(html: str) -> list[str]:
    found = []
    for m in re.finditer(r'data-cfemail="([0-9a-fA-F]+)"', html):
        found.append(_cf_decode(m.group(1)))
    for m in re.finditer(r'mailto:([^"\'?>\s]+)', html, re.I):
        found.append(requests.utils.unquote(m.group(1)))
    text = re.sub(r"\s*(\[at\]|\(at\)| at )\s*", "@", html, flags=re.I)
    text = re.sub(r"\s*(\[dot\]|\(dot\))\s*", ".", text, flags=re.I)
    found += EMAIL_RE.findall(text)
    out = []
    for e in found:
        e = e.strip().strip(".").lower()
        if not EMAIL_RE.fullmatch(e) or BAD_LOCAL.match(e.split("@")[0]):
            continue
        if re.search(r"\.(png|jpe?g|gif|svg|webp|css|js)$", e) or "sentry" in e or "wixpress" in e:
            continue
        if e not in out:
            out.append(e)
    return out


def rank_emails(emails: list[str], site_domain: str, people: list[str]) -> list[str]:
    """Same-domain first, a named person over a role box, info@/office@ over other roles; webmail last."""
    last_names = [p.split()[-1].lower() for p in people if p.split()]

    def score(e):
        local, dom = e.split("@")
        s = 0
        if dom == site_domain or dom.endswith("." + site_domain):
            s += 10
        elif dom in WEBMAIL:
            s += 3
        else:
            s -= 5  # someone else's domain (web designer, partner)
        if any(n and n in local for n in last_names):
            s += 4
        if local in ("info", "office", "contact", "hello", "admin", "sales"):
            s += 2
        if local in ("careers", "jobs", "hr", "billing", "accounting", "support"):
            s -= 2
        return -s
    return sorted(emails, key=score)


def website_emails(site: str, people: list[str] | None = None, fetch=H.fetch) -> list[str]:
    dom = domain_of(site)
    if not dom:
        return []
    base = site if "://" in site else "https://" + site.strip("/")
    seen, found = set(), []
    for p in CONTACT_PATHS:
        url = urljoin(base.rstrip("/") + "/", p)
        if url in seen:
            continue
        seen.add(url)
        try:
            html = fetch(url, timeout=20)
        except (H.Blocked, requests.RequestException):
            continue
        found += [e for e in extract_emails(html) if e not in found]
        same = [e for e in found if e.endswith("@" + dom) or e.endswith("." + dom)]
        if same and p:  # good enough once a contact page gave a same-domain address
            break
    good = [e for e in found if e.split("@")[1] == dom or e.split("@")[1].endswith("." + dom)
            or e.split("@")[1] in WEBMAIL]
    return rank_emails(good, dom, people or [])


# ---------- 3. guesses ----------
def guesses(person: str, dom: str) -> list[str]:
    parts = [re.sub(r"[^a-z]", "", w) for w in (person or "").lower().split()]
    parts = [w for w in parts if w and w not in ("jr", "sr", "ii", "iii", "mr", "mrs", "ms", "dr")]
    if len(parts) < 2 or not dom:
        return []
    f, l = parts[0], parts[-1]
    return [f"{f}@{dom}", f"{f}.{l}@{dom}", f"{f[0]}{l}@{dom}", f"{f}{l}@{dom}", f"{f}{l[0]}@{dom}"]


# ---------- checks (nothing is ever sent) ----------
_mx_cache: dict[str, list[str] | None] = {}


def mx_hosts(dom: str) -> list[str] | None:
    """MX hosts, [] if the domain takes no mail, None if DNS couldn't be asked."""
    if dom in _mx_cache:
        return _mx_cache[dom]
    hosts = None
    try:
        import dns.resolver  # type: ignore
        try:
            ans = dns.resolver.resolve(dom, "MX", lifetime=10)
            hosts = [str(r.exchange).rstrip(".") for r in sorted(ans, key=lambda r: r.preference)]
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
            hosts = []
        except Exception:
            hosts = None
    except ImportError:
        if shutil.which("dig"):
            try:
                out = subprocess.run(["dig", "+short", "MX", dom], capture_output=True, text=True, timeout=15).stdout
                rows = sorted((int(a), b.rstrip(".")) for a, b in (ln.split() for ln in out.splitlines() if ln.strip()
                                                                   and len(ln.split()) == 2 and ln.split()[0].isdigit()))
                hosts = [h for _, h in rows]
            except (subprocess.SubprocessError, ValueError):
                hosts = None
    _mx_cache[dom] = hosts
    return hosts


def smtp_check(email: str, helo: str = "localhost") -> str:
    """'Y' accepted, 'N' rejected, 'catch-all', or 'unknown'. Stops before DATA: no message is sent."""
    import smtplib
    dom = email.split("@")[1]
    hosts = mx_hosts(dom)
    if not hosts:
        return "N" if hosts == [] else "unknown"
    probe = "".join(random.choices(string.ascii_lowercase, k=14)) + "@" + dom
    try:
        with smtplib.SMTP(hosts[0], 25, timeout=15) as s:
            s.helo(helo)
            s.mail("")
            code, _ = s.rcpt(email)
            code2, _ = s.rcpt(probe)
            s.rset()
    except (OSError, smtplib.SMTPException):
        return "unknown"  # port 25 blocked, greylisting, or the server hung up
    if code in (250, 251):
        return "catch-all" if code2 in (250, 251) else "Y"
    if 500 <= code < 600:
        return "N"
    return "unknown"


def check(email: str, use_smtp: bool) -> tuple[str, str]:
    """Free check with no account. Returns (valid|invalid|risky, why). Only an SMTP 'accepted' counts as valid."""
    dom = email.split("@")[1]
    hosts = mx_hosts(dom)
    if hosts == []:
        return "invalid", "domain has no mail server (no MX record)"
    if hosts is None:
        return "risky", "domain not checked (no DNS tool on this machine)"
    if use_smtp:
        v = smtp_check(email)
        if v == "Y":
            return "valid", "smtp RCPT accepted (no message sent)"
        if v == "N":
            return "invalid", "smtp RCPT rejected (no message sent)"
        if v == "catch-all":
            return "risky", "domain accepts every address (catch-all)"
    return "risky", "domain takes mail; mailbox not checked"


# ---------- MyEmailVerifier (free plan: 100 checks a day, needs the owner's own account) ----------
# The API key is read ONLY from the environment variable below, never from a file, never printed or logged.
MEV_ENV = "MYEMAILVERIFIER_API_KEY"
MEV_URL = "https://api.myemailverifier.com/api/validate_single.php"  # from MyEmailVerifier's public API readme
MEV_DAILY_MAX = 95      # free plan gives 100 a day; stay a little under in case their day resets on another clock
MEV_GAP = 2.1           # seconds between calls; their default limit is 30 a minute
STATE_DIR = Path(__file__).resolve().parents[1] / "data" / "email_checks"
_mev_last = 0.0


class QuotaReached(Exception):
    pass


def _state(name: str) -> dict:
    p = STATE_DIR / name
    try:
        return json.loads(p.read_text())
    except (OSError, ValueError):
        return {}


def _save_state(name: str, data: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATE_DIR / (name + ".tmp")
    tmp.write_text(json.dumps(data, indent=0, sort_keys=True))
    tmp.replace(STATE_DIR / name)


def mev_used_today() -> int:
    return int(_state("mev_usage.json").get(time.strftime("%Y-%m-%d"), 0))


def mev_map(res: dict) -> tuple[str, str]:
    """MyEmailVerifier answer -> (valid|invalid|risky, why)."""
    status = str(res.get("Status", "")).strip().lower().replace("_", "-")
    yes = lambda k: str(res.get(k, "")).strip().lower() == "true"  # noqa: E731
    diag = str(res.get("Diagnosis", "")).strip()[:80]
    if yes("Disposable_Domain"):
        return "invalid", "disposable address"
    if status == "valid" and not yes("catch_all") and not yes("Greylisted"):
        note = "MyEmailVerifier: valid" + (" (shared inbox like info@)" if yes("Role_Based") else "")
        return "valid", note
    if status == "invalid":
        return "invalid", "MyEmailVerifier: invalid" + (f" ({diag})" if diag else "")
    return "risky", f"MyEmailVerifier: {status or 'no status'}" + (f" ({diag})" if diag else "")


def mev_verify(email: str, key: str, session=None) -> tuple[str, str]:
    """One check against MyEmailVerifier. Raises QuotaReached at the daily cap. Never exposes the key."""
    global _mev_last
    usage = _state("mev_usage.json")
    today = time.strftime("%Y-%m-%d")
    cap = min(int(os.environ.get("MEV_DAILY_LIMIT", MEV_DAILY_MAX)), 100)
    if int(usage.get(today, 0)) >= cap:
        raise QuotaReached(f"used {usage.get(today, 0)} of {cap} free checks today")
    wait = _mev_last + MEV_GAP - time.time()
    if wait > 0:
        time.sleep(wait)
    _mev_last = time.time()
    usage = {today: int(usage.get(today, 0)) + 1}  # count before the call: a failed call may still use a credit
    _save_state("mev_usage.json", usage)
    try:
        r = (session or requests).get(MEV_URL, params={"apikey": key, "email": email}, timeout=30,
                                      headers={"User-Agent": H.UA})
    except requests.RequestException as e:  # the error text holds the URL with the key in it: don't show it
        return "risky", f"verifier not reached ({e.__class__.__name__})"
    if r.status_code in (401, 403):
        raise QuotaReached("MyEmailVerifier refused the key or the account is out of credits")
    if r.status_code == 429:
        raise QuotaReached("MyEmailVerifier says too many requests; try again later")
    try:
        res = r.json()
    except ValueError:
        return "risky", f"verifier answered {r.status_code} without data"
    if isinstance(res, list) and res:
        res = res[0]
    if not isinstance(res, dict) or "Status" not in res:
        msg = str(res.get("message") or res.get("error") or "") if isinstance(res, dict) else ""
        if re.search(r"credit|limit|quota", msg, re.I):
            raise QuotaReached("MyEmailVerifier says the credits are used up")
        return "risky", "verifier gave no status"
    return mev_map(res)


def verify_file(path: Path, limit: int = 0, recheck_risky: bool = False, use_smtp: bool = False) -> dict:
    """Mark every email in a lead file valid / invalid / risky. Uses MyEmailVerifier when its key is set,
    else the free domain lookup. Results are cached per address so nothing is checked twice."""
    key = os.environ.get(MEV_ENV, "").strip()
    cache = _state("results.json")
    with open(path, newline="", encoding="utf-8-sig") as f:
        rd = csv.DictReader(f)
        fields, rows = list(rd.fieldnames or []), list(rd)
    for c in OUT_COLS:
        if c not in fields:
            fields.append(c)
    stats = {"method": "MyEmailVerifier" if key else "domain lookup only (no key set)", "checked": 0,
             "from_cache": 0, "valid": 0, "invalid": 0, "risky": 0, "left_for_tomorrow": 0}
    stop = None
    for r in rows:
        e = (r.get("email") or "").strip().lower()
        if not e or "@" not in e:
            continue
        done = r.get("email_verified") in ("valid", "invalid") or (r.get("email_verified") == "risky"
                                                                   and not recheck_risky)
        if done and r.get("email_check", "").startswith(("MyEmailVerifier", "outside verifier", "smtp")):
            continue
        c = cache.get(e)
        if c and (c["v"] != "risky" or not recheck_risky) and (c["by"] == "mev" or not key):
            r["email_verified"], r["email_check"] = c["v"], c["why"]
            stats["from_cache"] += 1
            stats[c["v"]] += 1
            continue
        if stop or (limit and stats["checked"] >= limit):
            stats["left_for_tomorrow"] += 1
            continue
        v, why = check(e, use_smtp)  # free first: a domain with no mail server never costs a credit
        by = "free"
        if key and v != "invalid":
            try:
                v, why = mev_verify(e, key)
                by = "mev"
            except QuotaReached as q:
                stop = str(q)
                stats["left_for_tomorrow"] += 1
                r["email_verified"], r["email_check"] = "risky", "waiting for tomorrow's free checks"
                continue
        r["email_verified"], r["email_check"] = v, why
        cache[e] = {"v": v, "why": why, "by": by, "on": time.strftime("%Y-%m-%d")}
        stats["checked"] += 1
        stats[v] += 1
    _save_state("results.json", cache)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    tmp.replace(path)
    if stop:
        stats["stopped"] = stop
    stats["used_today"] = mev_used_today()
    return stats


def send_ready(paths: list[Path], out: Path) -> int:
    """Copy only rows whose email is verified valid into one file for the sender. Everything else stays out."""
    keep, fields = [], []
    for p in paths:
        with open(p, newline="", encoding="utf-8-sig") as f:
            rd = csv.DictReader(f)
            for r in rd:
                if r.get("email_verified") == "valid" and (r.get("email") or "").strip() \
                        and (r.get("outreach_status") or "").lower() not in ("unsubscribed", "opted out", "bounced"):
                    r["lead_file"] = p.name
                    keep.append(r)
            for c in (rd.fieldnames or []):
                if c not in fields:
                    fields.append(c)
    fields.append("lead_file")
    seen, uniq = set(), []
    for r in keep:
        e = r["email"].strip().lower()
        if e not in seen:
            seen.add(e)
            uniq.append(r)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(uniq)
    return len(uniq)


# ---------- driving a lead file ----------
NAME_COLS = ["vendor", "company", "name", "business_name", "legal_business_name"]
PEOPLE_COLS = ["owner_name", "contact", "contact_name", "sos_officers", "officers"]


def _people(row: dict) -> list[str]:
    out = []
    for c in PEOPLE_COLS:
        for p in re.split(r"[;|]", row.get(c) or ""):
            p = re.sub(r"\(.*?\)", "", p).strip()
            if p and "none listed" not in p.lower() and len(p.split()) >= 2:
                out.append(p)
    return out


def enrich_row(row: dict, *, use_sbs=True, use_web=True, use_guess=False, use_smtp=False,
               search=sbs_search, fetch=H.fetch) -> dict:
    """Fill the OUT_COLS for one lead. Returns the updates (empty dict if the row already had an email)."""
    if (row.get("email") or "").strip():
        return {}
    name = next((row[c] for c in NAME_COLS if row.get(c)), "")
    state = row.get("state") or ("GA" if row.get("body") else "")
    uei = (row.get("uei") or row.get("sbs_uei") or "").strip()
    site = (row.get("website") or "").strip()
    upd: dict = {}
    if use_sbs and (uei or name):
        try:
            hit = sbs_lookup(name, state, uei, search=search)
        except (H.Blocked, requests.RequestException) as e:
            hit = None
            upd["email_check"] = f"SBS not reached: {e.__class__.__name__}"
        if hit:
            upd.update(email=hit["email"], email_source="sba_sbs", email_contact=hit["email_contact"],
                       sbs_uei=hit["sbs_uei"])
            site = site or hit["website"]
            if site and not row.get("website"):
                upd["website"] = site
    if "email" not in upd and use_web and site:
        found = website_emails(site, _people(row), fetch=fetch)
        if found:
            upd.update(email=found[0], email_source="website")
    if "email" not in upd and use_guess and site:
        for person in _people(row)[:2]:
            for g in guesses(person, domain_of(site)):
                v, why = check(g, use_smtp)
                if v == "valid":
                    upd.update(email=g, email_source="guess", email_contact=person, email_verified=v, email_check=why)
                    break
            if "email" in upd:
                break
    if upd.get("email") and "email_verified" not in upd:
        upd["email_verified"], upd["email_check"] = check(upd["email"], use_smtp)
    return upd


def enrich_file(path: Path, limit: int = 0, **kw) -> dict:
    with open(path, newline="", encoding="utf-8-sig") as f:
        rd = csv.DictReader(f)
        fields = list(rd.fieldnames or [])
        rows = list(rd)
    for c in OUT_COLS:
        if c not in fields:
            fields.append(c)
    stats = {"rows": len(rows), "had_email": 0, "tried": 0, "found": 0, "sba_sbs": 0, "website": 0, "guess": 0,
             "skipped_state": 0}
    for row in rows:
        if (row.get("email") or "").strip():
            stats["had_email"] += 1
            continue
        st = row.get("state") or ("GA" if row.get("body") else "")
        if st and not STATES.allowed(st):
            stats["skipped_state"] += 1
            continue
        if limit and stats["tried"] >= limit:
            break
        stats["tried"] += 1
        upd = enrich_row(row, **kw)
        row.update(upd)
        if upd.get("email"):
            stats["found"] += 1
            stats[upd["email_source"]] += 1
            print(f'  {upd["email_source"]:8} {upd["email"]:40} {next((row[c] for c in NAME_COLS if row.get(c)), "")}')
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    tmp.replace(path)
    return stats


def sbs_list(naics: list[str], out: Path, states: list[str] | None = None, min_year_age: int = 1) -> int:
    """Cold list: every small business in these NAICS codes with a public email, in allowed states."""
    want = {s.upper() for s in states} if states else None
    this_year = time.gmtime().tm_year
    rows, seen = [], set()
    for code in naics:
        for rec in sbs_search("", [code], timeout=300):
            c = sbs_contact(rec)
            if not c or c["sbs_uei"] in seen:
                continue
            st = c["state"]
            if not STATES.allowed(st) or (want and st not in want):
                continue
            y = str(c["year_established"])
            if y.isdigit() and this_year - int(y) < min_year_age:
                continue  # needs 4+ months of revenue; same-year firms get checked by hand
            seen.add(c["sbs_uei"])
            rows.append({"source": "sba_sbs", "company": c["name"].title(), "state": st, "naics": code,
                         "contact": c["email_contact"], "email": c["email"], "phone": c["phone"],
                         "website": c["website"], "uei": c["sbs_uei"], "year_established": y,
                         "product": STATES.product(st), "outreach_status": "not contacted"})
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else ["source"])
        w.writeheader()
        w.writerows(rows)
    return len(rows)


def import_verify(path: Path, results: Path) -> int:
    """Read a verifier's export (columns like email + status/result) and set email_verified on the lead file."""
    status = {}
    with open(results, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            low = {k.lower().strip(): (v or "").strip() for k, v in r.items() if k}
            e = (low.get("email") or low.get("email address") or "").lower()
            s = (low.get("status") or low.get("result") or low.get("quality") or "").lower()
            if e:
                status[e] = ("valid" if s in ("valid", "ok", "deliverable", "safe") else
                             "invalid" if s in ("invalid", "bad", "undeliverable", "disposable", "spamtrap",
                                                "spam trap") else "risky")
    with open(path, newline="", encoding="utf-8-sig") as f:
        rd = csv.DictReader(f)
        fields, rows = list(rd.fieldnames or []), list(rd)
    n = 0
    for r in rows:
        e = (r.get("email") or "").lower()
        if e in status:
            r["email_verified"], r["email_check"] = status[e], f"outside verifier: {status[e]}"
            n += 1
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return n


def selftest() -> None:
    html = ('<a href="mailto:Info@AcmeBuild.com?subject=hi">Email</a> <span class="__cf_email__" '
            'data-cfemail="5a3b3e373433741a3b39373f383f3f37343a3d743935377a">x</span> john [at] acmebuild [dot] com '
            'logo@2x.png noreply@acmebuild.com webdesign@agency.com')
    em = extract_emails(html)
    assert "info@acmebuild.com" in em and "john@acmebuild.com" in em, em
    assert not any(e.endswith(".png") or e.startswith("noreply") for e in em), em
    r = rank_emails(em + ["jsmith@acmebuild.com"], "acmebuild.com", ["John Smith"])
    assert r[0] == "jsmith@acmebuild.com", r
    assert norm("A& B Mechanical Builders, Inc.") == norm("A AND B MECHANICAL BUILDERS INC")
    assert core_name("Acme Security Professionals, LLC.") == "Acme Security Professionals"
    assert core_name("Example Enterprises, Inc., dba EXCOMM") == "Example Enterprises"
    rec = {"uei": "TESTUEI00001", "legal_business_name": "ACME SECURITY PROFESSIONALS LLC", "dba_name": "",
           "state": "Georgia", "email": "owner@acmesecurity.example", "display_email": True, "public_display": True,
           "contact_person": "JANE DOE", "website": "owner@acmesecurity.example", "display_phone": True, "phone": "1"}
    other = dict(rec, uei="X", state="Florida")
    hidden = dict(rec, display_email=False)
    fake = lambda term, naics=None: [other, rec]  # noqa: E731
    hit = sbs_lookup("Acme Security Professionals, LLC.", "GA", search=fake)
    assert hit and hit["email"] == "owner@acmesecurity.example" and hit["website"] == "", hit
    assert sbs_lookup("Acme Security Professionals", "TX", search=fake) is None
    assert sbs_lookup("x", "GA", uei="TESTUEI00001", search=lambda t, naics=None: [hidden]) is None
    assert guesses("Pat K. Example", "example.com")[1] == "pat.example@example.com"
    assert mev_map({"Status": "Valid", "catch_all": "false", "Disposable_Domain": "false"})[0] == "valid"
    assert mev_map({"Status": "Valid", "catch_all": "true"})[0] == "risky"
    assert mev_map({"Status": "Invalid"})[0] == "invalid"
    assert mev_map({"Status": "Catch-all"})[0] == "risky"
    assert mev_map({"Status": "Unknown"})[0] == "risky"
    assert mev_map({"Status": "Valid", "Disposable_Domain": "true"})[0] == "invalid"
    assert mev_map({"Status": "Valid", "Role_Based": "true"})[0] == "valid"
    print("selftest ok")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("enrich")
    e.add_argument("csv", type=Path)
    e.add_argument("--limit", type=int, default=0)
    e.add_argument("--no-sbs", action="store_true")
    e.add_argument("--no-web", action="store_true")
    e.add_argument("--guess", action="store_true", help="try name patterns (only kept if --smtp says Y)")
    e.add_argument("--smtp", action="store_true", help="RCPT check on port 25, no message sent; needs a server")
    s = sub.add_parser("sbs-list")
    s.add_argument("--naics", required=True, help="comma list of 6-digit codes")
    s.add_argument("--states", default="", help="comma list of 2-letter codes (default: all allowed)")
    s.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[2] / "leads" / "cold" / "sbs_contacts.csv")
    v = sub.add_parser("import-verify")
    v.add_argument("csv", type=Path)
    v.add_argument("results", type=Path)
    vf = sub.add_parser("verify", help="mark emails valid/invalid/risky (MyEmailVerifier if its key is set)")
    vf.add_argument("csv", type=Path, nargs="+")
    vf.add_argument("--limit", type=int, default=0, help="most new checks this run (daily cap still applies)")
    vf.add_argument("--recheck-risky", action="store_true")
    vf.add_argument("--smtp", action="store_true", help="RCPT check on port 25; needs a server, not home internet")
    sr = sub.add_parser("send-ready", help="write only verified-valid emails to one file for the sender")
    sr.add_argument("csv", type=Path, nargs="+")
    sr.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[2] / "outreach" / "send_ready.csv")
    sub.add_parser("selftest")
    a = ap.parse_args(argv)
    if a.cmd == "selftest":
        selftest()
    elif a.cmd == "enrich":
        st = enrich_file(a.csv, a.limit, use_sbs=not a.no_sbs, use_web=not a.no_web, use_guess=a.guess,
                         use_smtp=a.smtp)
        print(json.dumps(st))
    elif a.cmd == "sbs-list":
        n = sbs_list([c.strip() for c in a.naics.split(",") if c.strip()], a.out,
                     [x.strip() for x in a.states.split(",") if x.strip()] or None)
        print(f"{n} contacts -> {a.out}")
    elif a.cmd == "import-verify":
        print(f"{import_verify(a.csv, a.results)} rows updated")
    elif a.cmd == "verify":
        if not os.environ.get(MEV_ENV, "").strip():
            print(f"{MEV_ENV} is not set: using the free domain lookup only (nothing will be marked valid).")
        for p in a.csv:
            print(p.name, json.dumps(verify_file(p, a.limit, a.recheck_risky, a.smtp)))
    elif a.cmd == "send-ready":
        print(f"{send_ready(a.csv, a.out)} verified-valid emails -> {a.out}")


if __name__ == "__main__":
    sys.exit(main())
