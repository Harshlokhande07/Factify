import asyncio
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

import factify_search as fs

NOW = datetime(2026, 10, 12, tzinfo=timezone.utc)
CLAIM = "Councillor Mara Quillon was arrested in Port Halvren and confirmed to be a foreign spy."


def test_canonicalize_strips_tracking_and_www():
    assert fs.canonicalize("https://www.News.example/a/?utm_source=x&b=2&a=1#frag") == "https://news.example/a?a=1&b=2"
    assert fs.canonicalize("https://news.example/") == "https://news.example/"


@pytest.mark.parametrize("text,expected", [
    ("2026-03-03T10:00:00", ("2026-03-03", "day")),
    ("2026-03", ("2026-03", "month")),
    ("2026", ("2026", "year")),
    ("March 3, 2026", ("2026-03-03", "day")),
    ("3 days ago", ("2026-10-09", "day")),
    ("2 months ago", ("2026-08", "month")),
    ("1 year ago", ("2025", "year")),
    ("2026-13-45", (None, "unknown")),
    ("recently", (None, "unknown")),
    (None, (None, "unknown")),
])
def test_parse_date(text, expected):
    assert fs.parse_date(text, now=NOW) == expected


@pytest.mark.parametrize("url,news,expected", [
    ("https://pib.gov.in/x", False, "official_record"),
    ("https://www.nasa.gov/a", False, "official_record"),
    ("https://www.who.int/a", False, "official_record"),
    ("https://reddit.com/r/x", False, "social_post"),
    ("https://t.me/chan/1", False, "social_post"),
    ("https://paper.example.com/a", True, "news_report"),
    ("https://paper.example.com/a", False, "unknown"),
    ("https://notgov.example.com", False, "unknown"),
])
def test_guess_source_type(url, news, expected):
    assert fs.guess_source_type(url, news) == expected


def test_entities_skip_sentence_starter_single_word():
    assert "Councillor Mara Quillon" in fs.extract_entities(CLAIM)
    assert fs.extract_entities("Officials said the Port Halvren harbour closed.") == ["Port Halvren"]


def test_build_queries_mix_and_limits():
    qs = fs.build_queries(CLAIM, max_queries=8)
    assert len(qs) == 8
    assert qs[0].purpose == "exact_phrase" and qs[0].text.startswith('"')
    assert any(q.kind == "news" for q in qs)
    groups = {q.group for q in qs}
    assert {"evidence", "social"} <= groups
    assert len({(q.text, q.kind) for q in qs}) == len(qs)
    assert all("site:" in q.text for q in qs if q.group != "claim")


def test_build_queries_toggles_and_fallback():
    qs = fs.build_queries(CLAIM, include_official=False, include_social=False, max_queries=16)
    assert all(q.group == "claim" for q in qs)
    short = fs.build_queries("it is so", max_queries=3)
    assert short and short[0].text


def test_run_search_mock_merges_duplicates_and_classifies():
    out = asyncio.run(fs.run_search(CLAIM, fs.MockProvider(), max_queries=8))
    assert out["mock"] is True and out["disclaimer"]
    urls = [s["url"] for s in out["suggestions"]]
    news = [s for s in out["suggestions"] if "news.example" in s["url"]]
    assert len(news) == 1  # utm + trailing-slash duplicates merged
    assert len(news[0]["matchedQueries"]) >= 2
    types = {s["sourceType"] for s in out["suggestions"]}
    assert {"official_record", "social_post", "news_report"} <= types
    strengths = [s["matchStrength"] for s in out["suggestions"]]
    assert strengths == sorted(strengths, reverse=True)
    for s in out["suggestions"]:
        assert s["origin"] == "machine_suggested"
        assert s["suggestedLinkType"] == "not_established"
        assert s["isPrimaryMarkedByReviewer"] is False
    cov = out["coverage"]
    assert cov["uniqueUrls"] == len(urls) and cov["dated"] + cov["undated"] == len(urls)


def test_one_failing_query_does_not_fail_run():
    class Flaky(fs.MockProvider):
        name = "flaky"
        async def search(self, q, count):
            if q.group == "social":
                raise fs.ProviderError("boom")
            return await super().search(q, count)
    fs._CACHE.clear()
    out = asyncio.run(fs.run_search(CLAIM, Flaky(), max_queries=8))
    assert out["coverage"]["queriesFailed"] > 0
    assert out["suggestions"]
    assert any(q["error"] for q in out["queries"])


def test_wayback_enrichment(monkeypatch):
    async def fake(client, url):
        return "2099-02-01" if "news" in url else None
    monkeypatch.setattr(fs, "first_capture", fake)
    fs._CACHE.clear()
    out = asyncio.run(fs.run_search(CLAIM, fs.MockProvider(), enrich_wayback=True, client=object()))
    got = [s for s in out["suggestions"] if "firstArchivedAt" in s]
    assert got and any(s["firstArchivedAt"] == "2099-02-01" for s in got)
    assert out["coverage"]["wayback"]["missing"] >= 1


def test_api_endpoint(monkeypatch):
    monkeypatch.delenv("BRAVE_API_KEY", raising=False)
    monkeypatch.delenv("SERPER_API_KEY", raising=False)
    c = TestClient(fs.app)
    assert c.get("/health").json()["ok"] is True
    r = c.post("/search", json={"claim": CLAIM})
    assert r.status_code == 200 and r.json()["mock"] is True
    assert c.post("/search", json={"claim": "short"}).status_code == 422
    r = c.post("/search", json={"claim": CLAIM, "provider": "brave"})
    assert r.status_code == 400 and "BRAVE_API_KEY" in r.json()["detail"]
    r = c.post("/search", json={"claim": CLAIM, "max_queries": 99})
    assert r.status_code == 422


def _client(handler):
    import httpx
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_brave_parsing_and_errors():
    import httpx
    seen = {}
    def handler(req):
        seen["url"], seen["tok"] = str(req.url), req.headers.get("x-subscription-token")
        if "news" in req.url.path:
            return httpx.Response(200, json={"results": [{"title": "<b>N</b>", "url": "https://a.example/n", "description": "d", "age": "3 days ago"}]})
        return httpx.Response(200, json={"web": {"results": [{"title": "W", "url": "https://a.example/w", "description": "<strong>x</strong> y", "page_age": "2026-03-03T00:00:00"}, {"title": "no url"}]}})
    async def go():
        async with _client(handler) as c:
            p = fs.BraveProvider("KEY", c)
            web = await p.search(fs.Query("q", "x"), 5)
            news = await p.search(fs.Query("q", "x", kind="news"), 5)
            return web, news
    web, news = asyncio.run(go())
    assert seen["tok"] == "KEY"
    assert len(web) == 1 and web[0].snippet == "x y" and web[0].date_text.startswith("2026-03-03")
    assert news[0].title == "N" and news[0].date_text == "3 days ago"

    def bad(req):
        return httpx.Response(429, text="rate limited")
    async def go2():
        async with _client(bad) as c:
            await fs.BraveProvider("K", c).search(fs.Query("q", "x"), 5)
    with pytest.raises(fs.ProviderError):
        asyncio.run(go2())


def test_serper_parsing():
    import httpx, json
    def handler(req):
        body = json.loads(req.content)
        assert body["q"] == "q" and req.headers["x-api-key"] == "K"
        key = "news" if req.url.path.endswith("/news") else "organic"
        return httpx.Response(200, json={key: [{"title": "T", "link": "https://b.example/1", "snippet": "s", "date": "Mar 3, 2026", "position": 2}]})
    async def go():
        async with _client(handler) as c:
            p = fs.SerperProvider("K", c)
            return await p.search(fs.Query("q", "x"), 5), await p.search(fs.Query("q", "x", kind="news"), 5)
    a, b = asyncio.run(go())
    assert a[0].url == "https://b.example/1" and a[0].position == 2 and b[0].title == "T"
