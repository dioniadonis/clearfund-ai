"""Pull summary figures out of bank statement text. Runs only on the local Mac.

Only these figures leave the machine: statement month, total deposits, count of
NSF / returned-item mentions, and whether the ending balance was negative.
No transactions, names or account numbers are returned.
"""
from __future__ import annotations

import re
from datetime import date

MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august",
     "september", "october", "november", "december"], start=1)}
for _name, _num in list(MONTHS.items()):
    MONTHS[_name[:3]] = _num
MONTHS["sept"] = 9

MONEY = re.compile(r"(\(|-)?\s?\$?\s?(\d{1,3}(?:,\d{3})+\.\d{2}|\d+\.\d{2})(\))?")
NUMERIC_DATE = re.compile(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b")
WORD_DATE = re.compile(r"\b(" + "|".join(sorted(MONTHS, key=len, reverse=True)) + r")\.?\s+(\d{1,2}),?\s+(\d{4})\b", re.I)
DEPOSIT_LABEL = re.compile(
    r"^\s*(total\s+)?(deposits?(\s*(and|&)\s*(other\s+)?(additions|credits))?|credits|additions|electronic\s+deposits)\b", re.I)
COUNT_LABEL = re.compile(r"#|count|number\s+of", re.I)
ENDING_LABEL = re.compile(r"(ending|closing|new)\s+balance", re.I)
NSF = re.compile(r"\bNSF\b|insufficient\s+funds|returned\s+item|overdraft\s+(item\s+)?fee", re.I)
PERIOD_HINT = re.compile(r"statement\s+period|period\s+ending|through|thru|ending\s+date|statement\s+date|\bto\b|-", re.I)


def _to_float(s: str) -> float:
    return float(s.replace(",", "").replace("$", "").strip())


def _dates(text: str) -> list[date]:
    found: list[date] = []
    for m in NUMERIC_DATE.finditer(text):
        mm, dd, yy = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if yy < 100:
            yy += 2000
        try:
            found.append(date(yy, mm, dd))
        except ValueError:
            continue
    for m in WORD_DATE.finditer(text):
        try:
            found.append(date(int(m.group(3)), MONTHS[m.group(1).lower().rstrip(".")], int(m.group(2))))
        except (ValueError, KeyError):
            continue
    return [d for d in found if 2015 <= d.year <= 2100]


def statement_month(text: str) -> str | None:
    """Month the statement covers, from the period end date near the top."""
    head = "\n".join(text.splitlines()[:80])
    lines = [ln for ln in head.splitlines() if PERIOD_HINT.search(ln)]
    candidates = _dates("\n".join(lines)) or _dates(head)
    if not candidates:
        return None
    end = max(candidates)
    return f"{end.year:04d}-{end.month:02d}"


def _last_money(line: str):
    matches = list(MONEY.finditer(line))
    return matches[-1] if matches else None


def total_deposits(text: str) -> float | None:
    best: float | None = None
    for line in text.splitlines():
        label = DEPOSIT_LABEL.search(line)
        if not label or COUNT_LABEL.search(line):
            continue
        m = _last_money(line)
        if not m:
            continue
        value = _to_float(m.group(2))
        if label.group(1):  # a line that says "total" wins
            return value
        if best is None:
            best = value
    return best


def negative_end(text: str) -> bool:
    for line in text.splitlines():
        if ENDING_LABEL.search(line):
            m = _last_money(line)
            if m and (m.group(1) or m.group(3)):
                return True
    return False


def parse_statement(text: str) -> dict | None:
    month = statement_month(text)
    deposits = total_deposits(text)
    if month is None or deposits is None:
        return None
    return {
        "month": month,
        "deposits": round(deposits, 2),
        "nsf": len(NSF.findall(text)),
        "negative_end": negative_end(text),
    }


_STOP = {"llc", "inc", "co", "corp", "corporation", "company", "ltd", "the", "and", "of", "dba", "pllc", "lp", "llp"}


def name_match(text: str, business_name: str | None) -> bool | None:
    """True when the main words of the business name appear in the statement header."""
    if not business_name:
        return None
    words = [w for w in re.findall(r"[a-z0-9]+", business_name.lower()) if w not in _STOP and len(w) > 1]
    if not words:
        return None
    head = re.sub(r"[^a-z0-9]+", " ", "\n".join(text.splitlines()[:60]).lower())
    hits = sum(1 for w in words if re.search(rf"\b{re.escape(w)}\b", head))
    return hits >= max(1, (len(words) + 1) // 2)
