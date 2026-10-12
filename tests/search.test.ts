import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { canonicalizeUrl } from "../lib/search/canonicalize";
import {
  SearchResponseSchema,
  SearchRequestInputSchema,
  getMatchBucket,
  SearchResponse,
} from "../lib/search/types";
import { useReviewStore, migratePersistedState } from "../store/review-store";
import { buildReportModel } from "../lib/derive/report";
import { GET as healthHandler } from "../app/api/search/health/route";
import { POST as searchHandler } from "../app/api/search/route";
import { NextRequest } from "next/server";

function resetStoreForTest() {
  useReviewStore.setState({
    investigation: {
      id: "inv-test",
      originalText: "Claim text statement for testing.",
      createdAt: "2099-01-01T00:00:00Z",
      updatedAt: "2099-01-01T00:00:00Z",
      isDemo: true, // Demo investigation allows confirming mock data
      schemaVersion: 1,
    },
    claims: [
      {
        id: "c-1",
        investigationId: "inv-test",
        text: "Claim statement 1",
        order: 0,
        textRevision: 1,
        status: "not_checked",
        statusHistory: [],
        checklist: { source: false, date: false, evidence: false, context: false, corroboration: false },
        notes: "",
        questions: [],
        dismissedGaps: [],
      },
    ],
    sources: [],
    claimSourceLinks: [],
    sourceRelationships: [],
    wordingReviews: {},
    suggestions: [],
    searchRuns: [],
    ui: { nodePositions: {} },
  });
}

describe("URL Canonicalization", () => {
  it("strips www., lowers hostname, and trims trailing slash", () => {
    expect(canonicalizeUrl("https://www.News.example/a/")).toBe("https://news.example/a");
    expect(canonicalizeUrl("http://WWW.EXAMPLE.COM/")).toBe("http://example.com/");
    expect(canonicalizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("strips tracking parameters and sorts query params", () => {
    const input = "https://www.News.example/a/?utm_source=x&b=2&a=1#frag";
    expect(canonicalizeUrl(input)).toBe("https://news.example/a?a=1&b=2");
  });

  it("strips common ad and social tracking keys", () => {
    const input = "https://example.org/post?fbclid=xyz&si=123&gclid=abc&q=search&ref=feed";
    expect(canonicalizeUrl(input)).toBe("https://example.org/post?q=search");
  });
});

describe("Zod Validation & Match Bucket Thresholds", () => {
  it("maps matchStrength to correct bucket thresholds", () => {
    expect(getMatchBucket(0.85)).toBe("high");
    expect(getMatchBucket(0.5)).toBe("high");
    expect(getMatchBucket(0.499)).toBe("medium");
    expect(getMatchBucket(0.3)).toBe("medium");
    expect(getMatchBucket(0.29)).toBe("low");
    expect(getMatchBucket(0.0)).toBe("low");
  });

  it("validates request inputs with length and bounds checks", () => {
    expect(() => SearchRequestInputSchema.parse({ claim: "too short" })).toThrow();
    expect(() => SearchRequestInputSchema.parse({ claim: "Valid length claim text", max_queries: 99 })).toThrow();
    expect(
      SearchRequestInputSchema.parse({
        claim: "Valid length claim text with sufficient length",
        max_queries: 4,
        results_per_query: 5,
        include_official: true,
      })
    ).toBeDefined();
  });

  it("accepts valid search response and rejects malformed response", () => {
    const valid: SearchResponse = {
      claim: "Councillor Mara Quillon was arrested in Port Halvren",
      provider: "mock",
      mock: true,
      queries: [
        {
          query: "Councillor Mara Quillon",
          purpose: "entities_keywords",
          group: "claim",
          kind: "web",
          results: 2,
          error: null,
        },
      ],
      suggestions: [
        {
          id: "src_test123",
          title: "Official Record",
          publisher: "gov.example",
          sourceType: "official_record",
          url: "https://gov.example/record",
          publishedAt: "2099-01-01",
          datePrecision: "day",
          dateNote: "Reported by search engine",
          excerpt: "Excerpt text",
          isPrimaryMarkedByReviewer: false,
          origin: "machine_suggested",
          classificationMethod: "domain_heuristic",
          suggestedLinkType: "not_established",
          matchStrength: 0.65,
          matchedQueries: ["entities_keywords"],
        },
      ],
      coverage: {
        queriesRun: 1,
        queriesFailed: 0,
        uniqueUrls: 1,
        bySourceType: { official_record: 1 },
        dated: 1,
        undated: 0,
        wayback: { requested: false, missing: 0 },
        note: "Coverage note",
      },
      disclaimer: "Disclaimer text",
    };

    expect(SearchResponseSchema.parse(valid)).toBeDefined();

    // Missing required suggestions property
    const invalid = { ...valid, suggestions: undefined };
    expect(() => SearchResponseSchema.parse(invalid)).toThrow();
  });
});

describe("Store Migration v1 -> v2", () => {
  it("adds empty suggestions and searchRuns to v1 state", () => {
    const v1State = {
      investigation: { id: "inv-1", originalText: "claim" },
      claims: [],
      sources: [],
    };
    const migrated = migratePersistedState(v1State, 1);
    expect(migrated.suggestions).toEqual([]);
    expect(migrated.searchRuns).toEqual([]);
  });

  it("leaves v2 state intact", () => {
    const v2State = {
      investigation: { id: "inv-2" },
      suggestions: [{ id: "s-1" }],
      searchRuns: [{ id: "r-1" }],
    };
    const migrated = migratePersistedState(v2State, 2);
    expect(migrated).toEqual(v2State);
  });
});

describe("Review Store — Search Integration & Invariants", () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  const mockResponse: SearchResponse = {
    claim: "Claim statement 1",
    provider: "mock",
    mock: true,
    queries: [{ query: "q1", purpose: "kw", group: "claim", kind: "web", results: 1, error: null }],
    suggestions: [
      {
        id: "sug-1",
        title: "News story 1",
        publisher: "news.example",
        sourceType: "news_report",
        url: "https://www.news.example/story-1?utm_medium=email",
        publishedAt: "2099-02-01",
        datePrecision: "day",
        dateNote: "Search date estimate",
        excerpt: "News snippet text",
        isPrimaryMarkedByReviewer: false,
        origin: "machine_suggested",
        classificationMethod: "domain_heuristic",
        suggestedLinkType: "not_established",
        matchStrength: 0.72,
        matchedQueries: ["kw"],
        firstArchivedAt: "2099-01-15",
      },
    ],
    coverage: {
      queriesRun: 1,
      queriesFailed: 0,
      uniqueUrls: 1,
      bySourceType: { news_report: 1 },
      dated: 1,
      undated: 0,
      wayback: { requested: true, missing: 0 },
      note: "Coverage note",
    },
    disclaimer: "Disclaimer",
  };

  it("addSearchRun adds suggestions and records the search run", () => {
    useReviewStore.getState().addSearchRun(mockResponse, "c-1");

    const state = useReviewStore.getState();
    expect(state.searchRuns.length).toBe(1);
    expect(state.suggestions.length).toBe(1);
    expect(state.suggestions[0].canonicalUrl).toBe("https://news.example/story-1");
    expect(state.suggestions[0].status).toBe("suggested");
  });

  it("addSearchRun de-duplicates against existing sources and suggestions", () => {
    useReviewStore.getState().addSearchRun(mockResponse, "c-1");
    expect(useReviewStore.getState().suggestions.length).toBe(1);

    // Re-running search with same URL does not duplicate suggestion
    useReviewStore.getState().addSearchRun(mockResponse, "c-1");
    expect(useReviewStore.getState().suggestions.length).toBe(1);
    expect(useReviewStore.getState().searchRuns.length).toBe(2);
  });

  it("confirmSuggestion creates exactly 1 Source + links without changing claim status or checklist", () => {
    useReviewStore.getState().addSearchRun(mockResponse, "c-1");
    const suggestionId = useReviewStore.getState().suggestions[0].id;

    const sourceId = useReviewStore.getState().confirmSuggestion(suggestionId, {
      claimIds: ["c-1"],
      linkType: "supports",
      notes: "Confirmed by human reviewer",
    });

    expect(sourceId).toBeTruthy();
    const state = useReviewStore.getState();

    // Source created
    expect(state.sources.length).toBe(1);
    const source = state.sources[0];
    expect(source.title).toBe("News story 1");
    expect(source.publishedAt).toBe("2099-02-01");
    expect(source.dateNote).toBe("Search date estimate");
    expect(source.origin).toBe("search_confirmed");
    expect(source.suggestionMeta?.matchBucket).toBe("high");
    expect(source.suggestionMeta?.firstArchivedAt).toBe("2099-01-15");
    expect(source.isPrimaryMarkedByReviewer).toBe(false);

    // Link created
    expect(state.claimSourceLinks.length).toBe(1);
    expect(state.claimSourceLinks[0].sourceId).toBe(source.id);
    expect(state.claimSourceLinks[0].claimId).toBe("c-1");
    expect(state.claimSourceLinks[0].type).toBe("supports");

    // Invariant: claim status and checklist MUST NOT change automatically
    const claim = state.claims[0];
    expect(claim.status).toBe("not_checked");
    expect(claim.checklist.source).toBe(false);

    // Suggestion status marked confirmed
    const sug = state.suggestions.find((s) => s.id === suggestionId);
    expect(sug?.status).toBe("confirmed");
  });

  it("mock data cannot be confirmed in a non-demo investigation", () => {
    // Set investigation to real (not demo)
    useReviewStore.setState((prev) => ({
      ...prev,
      investigation: prev.investigation ? { ...prev.investigation, isDemo: false } : null,
    }));

    useReviewStore.getState().addSearchRun(mockResponse, "c-1");
    const suggestionId = useReviewStore.getState().suggestions[0].id;

    // Attempting to confirm mock suggestion in non-demo mode throws
    expect(() => {
      useReviewStore.getState().confirmSuggestion(suggestionId, {
        claimIds: ["c-1"],
        linkType: "not_established",
      });
    }).toThrow(/Mock data cannot be added to a real investigation/);

    expect(useReviewStore.getState().sources.length).toBe(0);
  });

  it("dismiss and restore suggestions works as expected", () => {
    useReviewStore.getState().addSearchRun(mockResponse, "c-1");
    const suggestionId = useReviewStore.getState().suggestions[0].id;

    useReviewStore.getState().dismissSuggestion(suggestionId);
    expect(useReviewStore.getState().suggestions[0].status).toBe("dismissed");

    useReviewStore.getState().restoreSuggestion(suggestionId);
    expect(useReviewStore.getState().suggestions[0].status).toBe("suggested");
  });
});

describe("Derive & Report Model — Suggestions vs Confirmed Sources", () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  it("unconfirmed suggestions never appear in report model; confirmed ones do", () => {
    const store = useReviewStore.getState();
    const reportBefore = buildReportModel(store);
    expect(reportBefore.sources.length).toBe(0);
    expect(reportBefore.searchRuns.length).toBe(0);

    // Add search run with unconfirmed suggestion
    const mockResp: SearchResponse = {
      claim: "Claim statement",
      provider: "mock",
      mock: true,
      queries: [{ query: "q", purpose: "kw", group: "claim", kind: "web", results: 1, error: null }],
      suggestions: [
        {
          id: "sug-2",
          title: "Unconfirmed result",
          publisher: "test.example",
          sourceType: "news_report",
          url: "https://test.example/news",
          publishedAt: "2099-03-01",
          datePrecision: "day",
          dateNote: "",
          excerpt: "",
          isPrimaryMarkedByReviewer: false,
          origin: "machine_suggested",
          classificationMethod: "domain_heuristic",
          suggestedLinkType: "not_established",
          matchStrength: 0.6,
          matchedQueries: ["kw"],
        },
      ],
      coverage: {
        queriesRun: 1,
        queriesFailed: 0,
        uniqueUrls: 1,
        bySourceType: { news_report: 1 },
        dated: 1,
        undated: 0,
        wayback: { requested: false, missing: 0 },
        note: "Note",
      },
      disclaimer: "Disclaimer",
    };

    useReviewStore.getState().addSearchRun(mockResp);

    const reportWithRun = buildReportModel(useReviewStore.getState());
    // Search runs are in report coverage
    expect(reportWithRun.searchRuns.length).toBe(1);
    // But sources are still 0 because suggestion is unconfirmed
    expect(reportWithRun.sources.length).toBe(0);
    expect(reportWithRun.hasMockData).toBe(false);

    // Confirm suggestion
    const sugId = useReviewStore.getState().suggestions[0].id;
    useReviewStore.getState().confirmSuggestion(sugId, {
      claimIds: ["c-1"],
      linkType: "supports",
    });

    const reportAfterConfirm = buildReportModel(useReviewStore.getState());
    expect(reportAfterConfirm.sources.length).toBe(1);
    expect(reportAfterConfirm.sources[0].origin).toBe("search_confirmed");
    expect(reportAfterConfirm.hasMockData).toBe(true);
  });
});

describe("Server Route Handlers", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("GET /api/search/health returns available: true when backend is reachable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, defaultProvider: "mock" }),
    });

    const res = await healthHandler();
    const data = await res.json();
    expect(data.available).toBe(true);
    expect(data.provider).toBe("mock");
  });

  it("GET /api/search/health returns available: false when backend fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection error"));

    const res = await healthHandler();
    const data = await res.json();
    expect(data.available).toBe(false);
  });

  it("POST /api/search maps timeout to BACKEND_TIMEOUT (504)", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("AbortError");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    const req = new NextRequest("http://localhost:3000/api/search", {
      method: "POST",
      body: JSON.stringify({ claim: "Valid claim for testing timeout" }),
    });

    const res = await searchHandler(req);
    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.error.code).toBe("BACKEND_TIMEOUT");
    expect(data.error.message).not.toContain("localhost");
  });

  it("POST /api/search maps backend 400 with missing key to PROVIDER_NOT_CONFIGURED", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: "BRAVE_API_KEY is not set" }),
    });

    const req = new NextRequest("http://localhost:3000/api/search", {
      method: "POST",
      body: JSON.stringify({ claim: "Valid claim for testing provider error", provider: "brave" }),
    });

    const res = await searchHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("PROVIDER_NOT_CONFIGURED");
    // Ensure raw key name is never leaked in the user-facing message
    expect(data.error.message).not.toContain("BRAVE_API_KEY");
  });

  it("POST /api/search maps malformed backend response to BAD_RESPONSE", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ invalid: "payload missing suggestions and coverage" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = new NextRequest("http://localhost:3000/api/search", {
      method: "POST",
      body: JSON.stringify({ claim: "Valid claim for testing bad response" }),
    });

    const res = await searchHandler(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error.code).toBe("BAD_RESPONSE");
  });

  it("POST /api/search enforces demo=true forces provider: mock", async () => {
    let capturedBody: string | undefined;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = init.body;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            claim: "Valid claim text",
            provider: "mock",
            mock: true,
            queries: [],
            suggestions: [],
            coverage: {
              queriesRun: 0,
              queriesFailed: 0,
              uniqueUrls: 0,
              bySourceType: {},
              dated: 0,
              undated: 0,
              wayback: { requested: false, missing: 0 },
              note: "note",
            },
            disclaimer: "disclaimer",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    const req = new NextRequest("http://localhost:3000/api/search", {
      method: "POST",
      body: JSON.stringify({
        claim: "Valid claim text for demo check",
        provider: "brave",
        demo: true,
      }),
    });

    const res = await searchHandler(req);
    expect(res.status).toBe(200);
    expect(capturedBody).toBeDefined();
    const parsed = JSON.parse(capturedBody!);
    expect(parsed.provider).toBe("mock");
  });
});
