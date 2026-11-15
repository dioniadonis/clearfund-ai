"""Which states we work leads in, and which products we may pitch there.

Owner rule (Nov 11 2026): nothing that needs an extra broker registration, license or fee.
The list comes from compliance/state_broker_rules.md section 6 ("Usable now") and lives in
config/sources.json "states", so it can change without touching code. Every runner and the merged
sheet use allowed() so an excluded state never reaches a lead file.
"""
import json
from pathlib import Path

_CFG = json.loads((Path(__file__).resolve().parent.parent / "config" / "sources.json").read_text()).get("states", {})
USABLE = {s.upper() for s in _CFG.get("usable", [])}
EXCLUDED = {s.upper() for s in _CFG.get("excluded", [])}
PRODUCTS = {k.upper(): v for k, v in _CFG.get("product_overrides", {}).items()}
DEFAULT_PRODUCT = _CFG.get("default_product", "working capital / MCA")

_NAMES = {"GEORGIA": "GA", "FLORIDA": "FL", "TEXAS": "TX", "VIRGINIA": "VA", "CALIFORNIA": "CA",
          "CONNECTICUT": "CT", "MISSOURI": "MO", "VERMONT": "VT", "NORTH DAKOTA": "ND", "NORTH CAROLINA": "NC"}


def code(st: str) -> str:
    s = (st or "").strip().upper()
    return _NAMES.get(s, s)


def allowed(st: str) -> bool:
    s = code(st)
    if s in EXCLUDED:
        return False
    return not USABLE or s in USABLE


def product(st: str, default: str | None = None) -> str:
    return PRODUCTS.get(code(st), default or DEFAULT_PRODUCT)
