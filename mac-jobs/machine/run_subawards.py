#!/usr/bin/env python3
"""Subcontractor reader: small firms just named as subcontractors on federal contracts.

Why: a sub on a new federal job buys materials and runs payroll weeks before the prime pays it.
Built Nov 15 2026 in place of the state DOT DBE reader: USDOT's Oct 3 2025 DBE rule (final Sept 25
2026) suspends DBE contract goals until each state finishes recertification (deadline Dec 24 2026),
so new DOT award notices no longer list DBE subs. Re-check DOT notices after that date.

Source: USAspending public API (free, no key), first-tier subcontracts reported by primes.
Contact: SBA Small Business Search (free, public). A hit there also confirms the firm is small.

  python3 run_subawards.py              # last 14 days, writes ../leads/subaward_leads.csv
  python3 run_subawards.py --days 90    # backfill

Only rows with a public email or phone are written. Nothing goes to the CRM from here.
Dedupe is against the newest CRM export in ../exports/ and earlier runs (data/state/seen.sqlite).
Not scheduled. Runs on the Mac (the cloud sandbox can't reach either API).
"""
from __future__ import annotations

import argparse
import csv
import re
import sqlite3
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from cfm import emails, http, states  # noqa: E402

LEADS = HERE.parent / "leads"
OUT = LEADS / "subaward_leads.csv"
SEEN = HERE / "data" / "state" / "seen.sqlite"
URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
FIELDS = ["Sub-Award ID", "Sub-Awardee Name", "Sub-Award Date", "Sub-Award Amount", "Awarding Agency",
          "Prime Recipient Name", "Prime Award ID", "Sub-Recipient Location", "Sub-Award Description"]
LO, HI = 30_000, 500_000
MAX_SUBS_IN_WINDOW, MAX_TOTAL = 4, 1_500_000   # more than this in the window = not a small firm
SKIP = re.compile(r"\b(UNIVERSITY|COLLEGE|HOSPITAL|INSTITUTE|FOUNDATION|LABORATOR|ALLIANCE|SCHOOL DISTRICT)\b", re.I)
OUT_COLS = ["lead_id", "firm", "state", "city", "subaward_amount", "subaward_date", "prime", "agency", "work",
            "contact_name", "email", "phone", "website", "year_established", "in_crm", "source_url"]


def key(name: str) -> str:
    s = re.sub(r"[^A-Z0-9 ]", "", (name or "").upper())
    s = re.sub(r"\b(LLC|INC|CORP|CORPORATION|CO|COMPANY|LTD|LP|THE)\b", "", s)
    return " ".join(s.split())


def pull(days: int, log=print):
    end, start = date.today(), date.today() - timedelta(days=days)
    filters = {"award_type_codes": ["A", "B", "C", "D"],
               "time_period": [{"start_date": f"{start}", "end_date": f"{end}"}]}
    page, rows = 1, []
    while page <= 100:  # API stops at 10,000 rows
        http._throttle(URL)
        r = http._session.post(URL, json={"subawards": True, "filters": filters, "fields": FIELDS, "limit": 100,
                                          "page": page, "sort": "Sub-Award Date", "order": "desc"}, timeout=90)
        if r.status_code in (401, 403, 429):
            raise http.Blocked(f"USAspending answered {r.status_code}")
        r.raise_for_status()
        j = r.json()
        rows += j.get("results", [])
        if not j.get("page_metadata", {}).get("hasNext"):
            break
        page += 1
    log(f"usaspending subawards {start} to {end}: {len(rows)} rows")
    return rows


def pick(rows):
    agg: dict[str, dict] = {}
    for x in rows:
        loc = x.get("Sub-Recipient Location") or {}
        k, amt = key(x.get("Sub-Awardee Name")), x.get("Sub-Award Amount") or 0
        if not k:
            continue
        a = agg.setdefault(k, {"n": 0, "tot": 0, "best": None, "name": x["Sub-Awardee Name"], "loc": loc})
        a["n"] += 1
        a["tot"] += amt
        if LO <= amt <= HI and (not a["best"] or a["best"]["Sub-Award Date"] < x["Sub-Award Date"]):
            a["best"], a["loc"] = x, loc
    for k, a in agg.items():
        st = (a["loc"].get("state_code") or "").upper()
        if (not a["best"] or a["loc"].get("location_country_code") != "USA" or not states.allowed(st)
                or a["n"] > MAX_SUBS_IN_WINDOW or a["tot"] > MAX_TOTAL or SKIP.search(a["name"])):
            continue
        yield k, st, a


def crm_keys() -> set[str]:
    ex = sorted((HERE.parent / "exports").glob("clearfund_all_leads_*.csv"))
    if not ex:
        return set()
    with open(ex[-1], newline="", encoding="utf-8-sig") as f:
        return {key(r.get("firm", "")) for r in csv.DictReader(f)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--limit", type=int, default=0, help="stop after this many SBA lookups (sample runs)")
    args = ap.parse_args()
    SEEN.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(SEEN)
    db.execute("create table if not exists seen (key text primary key, first_seen text)")
    crm = crm_keys()
    out, looked = [], 0
    cands = sorted(pick(pull(args.days)), key=lambda t: t[2]["best"]["Sub-Award Date"], reverse=True)
    for k, st, a in cands:
        if db.execute("select 1 from seen where key=?", (f"sub:{k}",)).fetchone():
            continue
        if args.limit and looked >= args.limit:
            break
        looked += 1
        try:
            hit = emails.sbs_lookup(a["name"], st)
        except (http.Blocked, Exception) as e:  # stop politely, never route around a refusal
            print(f"SBA search stopped: {e.__class__.__name__}")
            break
        db.execute("insert or ignore into seen values (?, ?)", (f"sub:{k}", date.today().isoformat()))
        if not hit or not (hit.get("email") or hit.get("phone")):
            continue
        b = a["best"]
        out.append({"firm": a["name"], "state": st, "city": a["loc"].get("city_name", ""),
                    "subaward_amount": round(b["Sub-Award Amount"]), "subaward_date": b["Sub-Award Date"],
                    "prime": b.get("Prime Recipient Name", ""), "agency": b.get("Awarding Agency", ""),
                    "work": (b.get("Sub-Award Description") or "")[:120], "contact_name": hit.get("email_contact", ""),
                    "email": hit.get("email", ""), "phone": hit.get("phone", ""), "website": hit.get("website", ""),
                    "year_established": hit.get("year_established", ""), "in_crm": "Y" if k in crm else "N",
                    "source_url": f"https://www.usaspending.gov/search (subaward {b.get('Sub-Award ID', '')})"})
    db.commit()
    # newer firms first: the cash gap is sharpest under 10 years
    yr = date.today().year
    out.sort(key=lambda r: r["subaward_date"], reverse=True)
    out.sort(key=lambda r: (r["in_crm"] == "Y", not (str(r["year_established"]).isdigit()
                                                     and yr - int(r["year_established"]) < 10)))
    for i, r in enumerate(out, 1):
        r["lead_id"] = f"SUB-{date.today():%Y%m%d}-{i:04d}"
    LEADS.mkdir(parents=True, exist_ok=True)
    new_file = not OUT.exists()
    with open(OUT, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=OUT_COLS)
        if new_file:
            w.writeheader()
        w.writerows(out)
    print(f"{len(cands)} small subs in allowed states, {looked} looked up, {len(out)} contactable "
          f"({sum(r['in_crm'] == 'N' for r in out)} not in CRM) -> {OUT.name}")


if __name__ == "__main__":
    main()
