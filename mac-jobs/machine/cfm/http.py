"""Polite HTTP fetching: robots.txt check, fixed delay, identifying user agent, on-disk cache.

Every watcher goes through fetch() so the rules live in one place:
- a URL that robots.txt disallows is skipped and logged, never fetched another way
- one request per `delay` seconds per host
- nothing here signs in, solves CAPTCHAs or follows a login wall
"""
from __future__ import annotations

import hashlib
import json
import time
import urllib.robotparser
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "config" / "sources.json").read_text())
CACHE_DIR = ROOT / "data" / "raw"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

UA = CONFIG.get("user_agent", "ClearFundAI-agenda-watcher/0.1")
DELAY = float(CONFIG.get("request_delay_seconds", 2.0))

_session = requests.Session()
_session.headers.update({"User-Agent": UA, "Accept": "application/json, text/html, application/pdf;q=0.9, */*;q=0.5"})
_robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
_last_hit: dict[str, float] = {}


class Blocked(Exception):
    """Raised when robots.txt disallows a URL or the server refuses it. Do not route around it."""


def _robots_for(url: str) -> urllib.robotparser.RobotFileParser | None:
    host = urlparse(url).netloc
    if host not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        robots_url = f"{urlparse(url).scheme}://{host}/robots.txt"
        try:
            r = _session.get(robots_url, timeout=20)
            if r.status_code >= 400:
                _robots[host] = None  # no robots.txt => allowed
            else:
                rp.parse(r.text.splitlines())
                _robots[host] = rp
        except requests.RequestException:
            _robots[host] = None
    return _robots[host]


def allowed(url: str) -> bool:
    rp = _robots_for(url)
    return True if rp is None else rp.can_fetch(UA, url)


def _throttle(url: str) -> None:
    host = urlparse(url).netloc
    wait = _last_hit.get(host, 0) + DELAY - time.time()
    if wait > 0:
        time.sleep(wait)
    _last_hit[host] = time.time()


def fetch(url: str, *, use_cache: bool = True, binary: bool = False, timeout: int = 60):
    """Return text (or bytes if binary=True). Raises Blocked on robots disallow or 401/403/429."""
    if not allowed(url):
        raise Blocked(f"robots.txt disallows {url}")
    key = hashlib.sha1(url.encode()).hexdigest()
    path = CACHE_DIR / (key + (".bin" if binary else ".txt"))
    if use_cache and path.exists():
        return path.read_bytes() if binary else path.read_text(encoding="utf-8", errors="replace")
    _throttle(url)
    r = _session.get(url, timeout=timeout)
    if r.status_code in (401, 403, 429):
        raise Blocked(f"HTTP {r.status_code} from {url}")
    r.raise_for_status()
    if binary:
        path.write_bytes(r.content)
        return r.content
    path.write_text(r.text, encoding="utf-8")
    return r.text


def fetch_json(url: str, **kw):
    return json.loads(fetch(url, **kw))
