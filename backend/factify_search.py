"""
Factify search prototype.

Takes a claim, builds several search queries, runs them through a pluggable
search provider (Brave, Serper/Google results, or an offline mock), merges and
de-duplicates the links, classifies them (news / social / official) with simple
domain heuristics, and returns *machine-suggested* source records in a shape
close to Factify's Source model.

It does NOT decide whether a claim is true, and it does NOT scrape google.com.
Run:  uvicorn factify_search:app --reload --port 8000
"""
from __future__ import annotations

import asyncio
import hashlib
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from itertools import zip_longest
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DISCLAIMER = (
    "Machine-suggested records from search-engine results. Match strength shows "
    "retrieval similarity only. It does not show that a claim is supported, "
    "contradicted, copied or original. Reviewer confirmation is required."
)
COVERAGE_NOTE = (
    "Search engines return a limited sample of the web per query. Missing results "
    "are not evidence that nothing exists. Dates are search-engine estimates."
)

# ----------------------------------------------------------------------------
# Claim -> queries
# ----------------------------------------------------------------------------
STOP = set(
    "a an the and or but is are was were be been being of to in on at for with by "
    "from that this it its as he she they we you i not no has have had will would "
    "can could should may might do does did into over under after before about".split()
)
DEFAULT_OFFICIAL = ["gov.in", "nic.in", "who.int", "gov.uk", "europa.eu", "un.org", "gov"]
DEFAULT_SOCIAL = ["reddit.com", "bsky.app", "t.me", "x.com", "youtube.com"]


@dataclass(frozen=True)
class Query:
    text: str
    purpose: str
    kind: str = "web"  # web | news
    group: str = "claim"  # claim | evidence | social


def extract_quotes(claim: str) -> list[str]:
    return [m.strip() for m in re.findall(r'["\u201c\u00ab](.{4,}?)["\u201d\u00bb]', claim)]


def extract_entities(claim: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(r"\b[A-Z0-9]{2,}\b|[A-Z][A-Za-z'\u2019\-]+(?:\s+[A-Z][A-Za-z'\u2019\-]+)*", claim):
        text = m.group(0)
        is_acronym = bool(re.match(r"^[A-Z0-9]{2,}$", text))
        at_start = m.start() == 0 or re.search(r"[.!?]\s+$", claim[: m.start()]) is not None
        if len(text.split()) == 1 and not is_acronym and (at_start or text.lower() in STOP):
            continue
        if text.lower() in STOP:
            continue
        if text not in out:
            out.append(text)
    return out


def extract_keywords(claim: str) -> list[str]:
    seen: list[str] = []
    for w in re.findall(r"\b[A-Z0-9]{2,}\b|[A-Za-z][A-Za-z'\u2019\-]{2,}|\d[\d,.]*%?", claim):
        lw = w.lower()
        if lw not in STOP and lw not in seen:
            seen.append(lw)
    return seen


def claim_terms(text: str) -> set[str]:
    return set(extract_keywords(text))


def build_queries(
    claim: str,
    *,
    include_official: bool = True,
    include_social: bool = True,
    official_domains: list[str] | None = None,
    social_sites: list[str] | None = None,
    max_queries: int = 8,
) -> list[Query]:
    claim = " ".join(claim.split())
    quotes = extract_quotes(claim)
    ents = extract_entities(claim)
    ent_words = " ".join(ents[:3])
    ent_lower = set(ent_words.lower().split())
    kws = [k for k in extract_keywords(claim) if k not in ent_lower]
    base = f"{ent_words} {' '.join(kws[:4])}".strip() or claim[:120]

    words = claim.split()
    phrase = quotes[0] if quotes else " ".join(words[:12])
    first: list[Query] = []
    if len(phrase.split()) >= 4:
        first.append(Query(f'"{phrase}"', "exact_phrase"))
    first.append(Query(base, "entities_keywords"))
    first.append(Query(base, "news_search", kind="news"))
    kw_only = " ".join(extract_keywords(claim)[:6])
    if kw_only and kw_only != base.lower():
        first.append(Query(kw_only, "keywords_only"))

    evidence = (
        [Query(f"{base} site:{d}", "official_site", group="evidence")
         for d in (official_domains or DEFAULT_OFFICIAL)]
        if include_official else []
    )
    social = (
        [Query(f"{base} site:{s}", "social_site", group="social")
         for s in (social_sites or DEFAULT_SOCIAL)]
        if include_social else []
    )
    # Interleave so truncation keeps a mix of official and social queries.
    mixed = [q for pair in zip_longest(evidence, social) for q in pair if q]
    out: list[Query] = []
    for q in first + mixed:
        if all(q.text != o.text or q.kind != o.kind for o in out):
            out.append(q)
    return out[: max(1, max_queries)]


# ----------------------------------------------------------------------------
# URL / date / source-type helpers
# ----------------------------------------------------------------------------
TRACKING = {"fbclid", "gclid", "igshid", "ref", "ref_src", "mc_cid", "mc_eid", "si", "feature"}
OFFICIAL_DOMAINS = {"who.int", "un.org", "europa.eu", "worldbank.org"}
SOCIAL_DOMAINS = {
    "x.com", "twitter.com", "reddit.com", "bsky.app", "t.me", "facebook.com",
    "instagram.com", "threads.net", "tiktok.com", "youtube.com", "youtu.be",
}


def host_of(url: str) -> str:
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def canonicalize(url: str) -> str:
    p = urlsplit(url.strip())
    q = [(k, v) for k, v in parse_qsl(p.query) if not k.lower().startswith("utm_") and k.lower() not in TRACKING]
    path = p.path.rstrip("/") or "/"
    return urlunsplit((p.scheme.lower(), host_of(url), path, urlencode(sorted(q)), ""))


def _is_domain(host: str, d: str) -> bool:
    return host == d or host.endswith("." + d)


def guess_source_type(url: str, from_news: bool = False) -> str:
    """Heuristic only: a government-looking domain is not proof of anything."""
    host = host_of(url)
    labels = host.split(".")
    if any(_is_domain(host, d) for d in OFFICIAL_DOMAINS) or (
        len(labels) >= 2
        and (labels[-1] in {"gov", "mil"} or any(l in {"gov", "nic", "mil"} for l in labels[:-1]))
    ):
        return "official_record"
    if any(_is_domain(host, d) for d in SOCIAL_DOMAINS):
        return "social_post"
    return "news_report" if from_news else "unknown"


_REL = re.compile(r"(\d+)\s*(hour|day|week|month|year)s?\s+ago", re.I)
_FORMATS = ["%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y", "%b %d %Y"]


def parse_date(text: str | None, now: datetime | None = None) -> tuple[str | None, str]:
    """Return (partial ISO date, precision). Best effort, never raises."""
    if not text:
        return None, "unknown"
    s = text.strip()
    m = re.match(r"^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?:[T ].*)?$", s)
    if m:
        y, mo, d = m.group(1), m.group(2), m.group(3)
        try:
            if d:
                datetime(int(y), int(mo), int(d))
                return f"{y}-{mo}-{d}", "day"
            if mo and 1 <= int(mo) <= 12:
                return f"{y}-{mo}", "month"
            if not mo:
                return y, "year"
        except ValueError:
            return None, "unknown"
    for fmt in _FORMATS:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d"), "day"
        except ValueError:
            pass
    rfc = re.search(r"(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})", s)
    if rfc:
        try:
            return datetime.strptime(f"{rfc.group(1)} {rfc.group(2)} {rfc.group(3)}", "%d %b %Y").strftime("%Y-%m-%d"), "day"
        except ValueError:
            pass
    r = _REL.search(s)
    if r:
        now = now or datetime.now(timezone.utc)
        n, unit = int(r.group(1)), r.group(2).lower()
        if unit in ("hour", "day", "week"):
            days = n * {"hour": 0, "day": 1, "week": 7}[unit]
            return (now - timedelta(days=days)).strftime("%Y-%m-%d"), "day"
        if unit == "month":
            return (now - timedelta(days=30 * n)).strftime("%Y-%m"), "month"
        return str(now.year - n), "year"
    return None, "unknown"


def strip_tags(s: str | None) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


# ----------------------------------------------------------------------------
# Providers
# ----------------------------------------------------------------------------
class ProviderError(Exception):
    pass


@dataclass
class RawResult:
    title: str
    url: str
    snippet: str
    date_text: str | None
    position: int


class MockProvider:
    """Offline fake results so the whole flow can be demoed without any API key."""

    name = "mock"

    async def search(self, q: Query, count: int) -> list[RawResult]:
        site = re.search(r"site:(\S+)", q.text)
        stripped = re.sub(r"site:\S+", "", q.text).strip()
        snippet = "[MOCK] " + stripped
        if q.group == "evidence":
            d = site.group(1) if site else "gov.example"
            return [RawResult("[MOCK] Official notice", f"https://ministry.gov.example/{d}/notice", snippet, "2099-03-03", 1)]
        if q.group == "social":
            d = site.group(1) if site else "social.example"
            return [RawResult("[MOCK] Social post", f"https://{d}/mock/post-1", snippet, "2099-03-04", 1)]
        return [
            RawResult("[MOCK] News story", "https://www.news.example/story-1?utm_source=feed", snippet, "2099-03-03", 1),
            RawResult("[MOCK] News story (duplicate)", "https://news.example/story-1/", snippet, "2099-03-03", 2),
            RawResult("[MOCK] Opinion blog", "https://blog.example.org/post", snippet, "March 5, 2099", 3),
        ][:count]


class BraveProvider:
    name = "brave"

    def __init__(self, key: str, client: httpx.AsyncClient):
        self.key, self.client = key, client

    async def search(self, q: Query, count: int) -> list[RawResult]:
        news = q.kind == "news"
        url = "https://api.search.brave.com/res/v1/" + ("news/search" if news else "web/search")
        r = await self.client.get(
            url,
            params={"q": q.text, "count": min(count, 20)},
            headers={"X-Subscription-Token": self.key, "Accept": "application/json"},
        )
        if r.status_code != 200:
            raise ProviderError(f"brave {r.status_code}: {r.text[:200]}")
        data = r.json()
        items = data.get("results", []) if news else data.get("web", {}).get("results", [])
        return [
            RawResult(strip_tags(i.get("title")), i["url"], strip_tags(i.get("description")),
                      i.get("page_age") or i.get("age"), n + 1)
            for n, i in enumerate(items) if i.get("url")
        ]


class SerperProvider:
    """Google results via the third-party Serper API (paid, not Google's own API)."""

    name = "serper"

    def __init__(self, key: str, client: httpx.AsyncClient):
        self.key, self.client = key, client

    async def search(self, q: Query, count: int) -> list[RawResult]:
        news = q.kind == "news"
        url = "https://google.serper.dev/" + ("news" if news else "search")
        r = await self.client.post(url, json={"q": q.text, "num": min(count, 20)}, headers={"X-API-KEY": self.key})
        if r.status_code != 200:
            raise ProviderError(f"serper {r.status_code}: {r.text[:200]}")
        items = r.json().get("news" if news else "organic", [])
        return [
            RawResult(strip_tags(i.get("title")), i["link"], strip_tags(i.get("snippet")),
                      i.get("date"), i.get("position", n + 1))
            for n, i in enumerate(items) if i.get("link")
        ]


class DuckDuckGoProvider:
    """Live web search provider querying live news and search feeds without requiring API keys."""

    name = "duckduckgo"

    def __init__(self, client: httpx.AsyncClient):
        self.client = client

    async def search(self, q: Query, count: int) -> list[RawResult]:
        out: list[RawResult] = []
        # 1. Query Google News RSS
        try:
            r = await self.client.get(
                "https://news.google.com/rss/search",
                params={"q": q.text, "hl": "en-IN", "gl": "IN", "ceid": "IN:en"},
                timeout=12,
            )
            if r.status_code == 200:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(r.text)
                for n, item in enumerate(root.findall(".//item")[:count]):
                    t = (item.find("title").text or "").strip()
                    l = (item.find("link").text or "").strip()
                    d_elem = item.find("description")
                    desc = re.sub(r"<[^>]+>", " ", d_elem.text or "").strip() if d_elem is not None else ""
                    p_elem = item.find("pubDate")
                    pub = p_elem.text if p_elem is not None else None
                    if l.startswith("http"):
                        out.append(RawResult(t, l, desc, pub, n + 1))
        except Exception:
            pass

        # 2. If need more results, query Bing News RSS
        if len(out) < count:
            try:
                r_bing = await self.client.get(
                    "https://www.bing.com/news/search",
                    params={"q": q.text, "format": "rss"},
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                    timeout=10,
                )
                if r_bing.status_code == 200:
                    import xml.etree.ElementTree as ET
                    root_b = ET.fromstring(r_bing.text)
                    for n, item in enumerate(root_b.findall(".//item")):
                        t = (item.find("title").text or "").strip()
                        l = (item.find("link").text or "").strip()
                        if "url=" in l:
                            from urllib.parse import parse_qs, urlparse
                            qs = parse_qs(urlparse(l).query)
                            if "url" in qs and qs["url"][0].startswith("http"):
                                l = qs["url"][0]
                        d_elem = item.find("description")
                        desc = re.sub(r"<[^>]+>", " ", d_elem.text or "").strip() if d_elem is not None else ""
                        p_elem = item.find("pubDate")
                        pub = p_elem.text if p_elem is not None else None
                        if l.startswith("http") and all(x.url != l for x in out):
                            out.append(RawResult(t, l, desc, pub, len(out) + 1))
                        if len(out) >= count:
                            break
            except Exception:
                pass

        return out[:count]


def make_provider(name: str, client: httpx.AsyncClient):
    if name == "mock":
        return MockProvider()
    if name == "duckduckgo":
        return DuckDuckGoProvider(client)
    if name == "brave":
        key = os.getenv("BRAVE_API_KEY")
        if not key:
            raise ProviderError("BRAVE_API_KEY is not set")
        return BraveProvider(key, client)
    if name == "serper":
        key = os.getenv("SERPER_API_KEY")
        if not key:
            raise ProviderError("SERPER_API_KEY is not set")
        return SerperProvider(key, client)
    raise ProviderError(f"unknown provider '{name}'")


# ----------------------------------------------------------------------------
# Pipeline
# ----------------------------------------------------------------------------
_CACHE: dict[tuple, tuple[float, list[RawResult]]] = {}
CACHE_TTL = 3600


async def cached_search(provider, q: Query, count: int) -> list[RawResult]:
    key = (provider.name, q.text, q.kind, count)
    hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL:
        return hit[1]
    res = await provider.search(q, count)
    _CACHE[key] = (time.time(), res)
    return res


async def first_capture(client: httpx.AsyncClient, url: str) -> str | None:
    """Earliest Wayback capture date. This is NOT the publication date."""
    try:
        r = await client.get(
            "https://web.archive.org/cdx/search/cdx",
            params={"url": url, "output": "json", "limit": 1, "fl": "timestamp", "filter": "statuscode:200"},
        )
        rows = r.json() if r.status_code == 200 else []
        if len(rows) >= 2:
            ts = rows[1][0]
            return f"{ts[0:4]}-{ts[4:6]}-{ts[6:8]}"
    except Exception:
        return None
    return None


@dataclass
class Candidate:
    canonical: str
    url: str
    title: str
    snippet: str
    source_type: str
    date_text: str | None
    best_position: int
    hits: list[str] = field(default_factory=list)


async def run_search(
    claim: str,
    provider,
    *,
    max_queries: int = 8,
    per_query: int = 10,
    include_official: bool = True,
    include_social: bool = True,
    official_domains: list[str] | None = None,
    enrich_wayback: bool = False,
    wayback_top: int = 10,
    client: httpx.AsyncClient | None = None,
    concurrency: int = 4,
) -> dict:
    queries = build_queries(
        claim, include_official=include_official, include_social=include_social,
        official_domains=official_domains, max_queries=max_queries,
    )
    sem = asyncio.Semaphore(concurrency)

    async def one(q: Query):
        async with sem:
            try:
                return q, await cached_search(provider, q, per_query), None
            except Exception as e:  # one failing query must not fail the run
                return q, [], f"{type(e).__name__}: {e}"

    outcomes = await asyncio.gather(*(one(q) for q in queries))

    cands: dict[str, Candidate] = {}
    log = []
    for q, results, err in outcomes:
        log.append({"query": q.text, "purpose": q.purpose, "group": q.group,
                    "kind": q.kind, "results": len(results), "error": err})
        for r in results:
            if not r.url.lower().startswith(("http://", "https://")):
                continue
            canon = canonicalize(r.url)
            c = cands.get(canon)
            if c is None:
                c = cands[canon] = Candidate(
                    canon, r.url, r.title, r.snippet,
                    guess_source_type(r.url, from_news=(q.kind == "news")),
                    r.date_text, r.position,
                )
            else:
                c.best_position = min(c.best_position, r.position)
                if c.source_type == "unknown":
                    c.source_type = guess_source_type(r.url, from_news=(q.kind == "news"))
                c.date_text = c.date_text or r.date_text
                c.snippet = c.snippet or r.snippet
            if q.purpose not in c.hits:
                c.hits.append(q.purpose)

    terms = claim_terms(claim)
    ok_queries = max(1, sum(1 for o in log if not o["error"]))
    suggestions = []
    for c in cands.values():
        overlap = len(terms & claim_terms(f"{c.title} {c.snippet}")) / max(1, len(terms))
        strength = round(0.6 * overlap + 0.3 * min(1, len(c.hits) / ok_queries) + 0.1 / c.best_position, 3)
        date, precision = parse_date(c.date_text)
        suggestions.append({
            "id": "src_" + hashlib.sha1(c.canonical.encode()).hexdigest()[:10],
            "title": c.title or c.canonical,
            "publisher": host_of(c.url),
            "sourceType": c.source_type,
            "url": c.url,
            "publishedAt": date,
            "datePrecision": precision,
            "dateNote": "Reported by the search engine; unverified." if date else "",
            "excerpt": c.snippet,
            "isPrimaryMarkedByReviewer": False,
            "origin": "machine_suggested",
            "classificationMethod": "domain_heuristic",
            "suggestedLinkType": "not_established",
            "matchStrength": strength,
            "matchedQueries": c.hits,
        })
    suggestions.sort(key=lambda s: s["matchStrength"], reverse=True)

    wayback_failed = 0
    if enrich_wayback and client is not None:
        top = suggestions[:wayback_top]
        caps = await asyncio.gather(*(first_capture(client, s["url"]) for s in top))
        for s, cap in zip(top, caps):
            s["firstArchivedAt"] = cap
            if cap is None:
                wayback_failed += 1

    types: dict[str, int] = {}
    for s in suggestions:
        types[s["sourceType"]] = types.get(s["sourceType"], 0) + 1
    dated = sum(1 for s in suggestions if s["publishedAt"])
    return {
        "claim": claim,
        "provider": provider.name,
        "mock": provider.name == "mock",
        "queries": log,
        "suggestions": suggestions,
        "coverage": {
            "queriesRun": len(log),
            "queriesFailed": sum(1 for o in log if o["error"]),
            "uniqueUrls": len(suggestions),
            "bySourceType": types,
            "dated": dated,
            "undated": len(suggestions) - dated,
            "wayback": {"requested": enrich_wayback, "missing": wayback_failed},
            "note": COVERAGE_NOTE,
        },
        "disclaimer": DISCLAIMER,
    }


# ----------------------------------------------------------------------------
# API
# ----------------------------------------------------------------------------
class SearchRequest(BaseModel):
    claim: str = Field(min_length=10, max_length=2000)
    provider: Literal["brave", "serper", "mock", "duckduckgo"] | None = None
    max_queries: int = Field(default=8, ge=1, le=16)
    results_per_query: int = Field(default=10, ge=1, le=20)
    include_official: bool = True
    include_social: bool = True
    official_domains: list[str] | None = None
    enrich_wayback: bool = False


app = FastAPI(title="Factify search prototype")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "defaultProvider": os.getenv("SEARCH_PROVIDER", "mock")}


@app.post("/search")
async def search(req: SearchRequest):
    name = req.provider or os.getenv("SEARCH_PROVIDER", "mock")
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            provider = make_provider(name, client)
        except ProviderError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return await run_search(
            req.claim, provider,
            max_queries=req.max_queries, per_query=req.results_per_query,
            include_official=req.include_official, include_social=req.include_social,
            official_domains=req.official_domains,
            enrich_wayback=req.enrich_wayback, client=client,
        )
