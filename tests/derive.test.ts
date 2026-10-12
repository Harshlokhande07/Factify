import { describe, it, expect } from "vitest";
import { computeIndependence } from "../lib/derive/independence";
import { computeEarliest } from "../lib/derive/earliest";
import { computeGaps } from "../lib/derive/gaps";
import { compareWording } from "../lib/derive/wording";
import { buildReportModel } from "../lib/derive/report";
import { createDemoState } from "../data/demo";
import { InvestigationState, Claim, Source, ClaimSourceLink, SourceRelationship } from "../lib/types";

function createBaseState(): InvestigationState {
  return {
    investigation: {
      id: "inv-test",
      originalText: "Claim A. Claim B.",
      createdAt: "2099-01-01T00:00:00Z",
      updatedAt: "2099-01-01T00:00:00Z",
      isDemo: false,
      schemaVersion: 1,
    },
    claims: [
      {
        id: "c-1",
        investigationId: "inv-test",
        text: "Claim 1",
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
  };
}

describe("Derived Logic — computeIndependence", () => {
  it("outcome 1: returns no_support when no supporting links exist", () => {
    const state = createBaseState();
    const result = computeIndependence(state, "c-1");
    expect(result.type).toBe("no_support");
  });

  it("outcome 2: returns single_source when exactly 1 supporting source is linked", () => {
    const state = createBaseState();
    state.sources.push({
      id: "s-1",
      title: "Source 1",
      publisher: "P1",
      sourceType: "news_report",
      publishedAt: "2099-01-01",
      datePrecision: "day",
      excerpt: "text",
      notes: "",
      isPrimaryMarkedByReviewer: false,
    });
    state.claimSourceLinks.push({
      id: "l-1",
      claimId: "c-1",
      sourceId: "s-1",
      type: "supports",
      notes: "",
      excerptRelevance: "addresses_claim",
      scopeMismatch: "none_noted",
      assessedAtClaimRevision: 1,
    });

    const result = computeIndependence(state, "c-1");
    expect(result.type).toBe("single_source");
  });

  it("outcome 3: returns one_dependency_chain when supporting sources connect via citations or repetition", () => {
    const state = createBaseState();
    state.sources.push(
      { id: "s-1", title: "S1", publisher: "P1", sourceType: "news_report", publishedAt: "2099-01-01", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false },
      { id: "s-2", title: "S2", publisher: "P2", sourceType: "news_report", publishedAt: "2099-01-02", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false }
    );
    state.claimSourceLinks.push(
      { id: "l-1", claimId: "c-1", sourceId: "s-1", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 },
      { id: "l-2", claimId: "c-1", sourceId: "s-2", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 }
    );
    state.sourceRelationships.push({
      id: "r-1",
      fromSourceId: "s-2",
      toSourceId: "s-1",
      type: "explicitly_cites",
      verification: "documented",
      explanation: "S2 cites S1",
    });

    const result = computeIndependence(state, "c-1");
    expect(result.type).toBe("one_dependency_chain");
  });

  it("outcome 4: returns independence_unverified when supporting sources are in disconnected components but no reviewer judgment recorded", () => {
    const state = createBaseState();
    state.sources.push(
      { id: "s-1", title: "S1", publisher: "P1", sourceType: "news_report", publishedAt: "2099-01-01", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false },
      { id: "s-2", title: "S2", publisher: "P2", sourceType: "news_report", publishedAt: "2099-01-02", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false }
    );
    state.claimSourceLinks.push(
      { id: "l-1", claimId: "c-1", sourceId: "s-1", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 },
      { id: "l-2", claimId: "c-1", sourceId: "s-2", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 }
    );

    const result = computeIndependence(state, "c-1");
    expect(result.type).toBe("independence_unverified");
  });

  it("outcome 5: returns reviewer_judged_independent when reviewer explicitly marks reviewer_judged_independent across components", () => {
    const state = createBaseState();
    state.sources.push(
      { id: "s-1", title: "S1", publisher: "P1", sourceType: "news_report", publishedAt: "2099-01-01", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false },
      { id: "s-2", title: "S2", publisher: "P2", sourceType: "news_report", publishedAt: "2099-01-02", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false }
    );
    state.claimSourceLinks.push(
      { id: "l-1", claimId: "c-1", sourceId: "s-1", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 },
      { id: "l-2", claimId: "c-1", sourceId: "s-2", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 }
    );
    state.sourceRelationships.push({
      id: "r-indep",
      fromSourceId: "s-1",
      toSourceId: "s-2",
      type: "reviewer_judged_independent",
      verification: "documented",
      explanation: "Reviewer verified field reporter origins",
    });

    const result = computeIndependence(state, "c-1");
    expect(result.type).toBe("reviewer_judged_independent");
  });
});

describe("Derived Logic — computeEarliest", () => {
  it("identifies earliest dated candidate and flags provisional if undated candidate exists", () => {
    const state = createBaseState();
    state.sources.push(
      { id: "s-dated", title: "Dated Source", publisher: "P", sourceType: "press_release", publishedAt: "2099-03-01", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: true },
      { id: "s-undated", title: "Undated Forward", publisher: "P", sourceType: "messaging_forward", publishedAt: null, datePrecision: "unknown", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false }
    );
    state.claimSourceLinks.push(
      { id: "l-1", claimId: "c-1", sourceId: "s-dated", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 },
      { id: "l-2", claimId: "c-1", sourceId: "s-undated", type: "repeats", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 }
    );

    const earliest = computeEarliest(state, "c-1");
    expect(earliest.type).toBe("earliest_among_dated");
    if (earliest.type === "earliest_among_dated") {
      expect(earliest.sourceId).toBe("s-dated");
      expect(earliest.isProvisional).toBe(true);
      expect(earliest.undatedCount).toBe(1);
    }
  });

  it("handles ambiguous overlapping dates without picking a winner", () => {
    const state = createBaseState();
    state.sources.push(
      { id: "s-a", title: "Record A", publisher: "P", sourceType: "news_report", publishedAt: "2099-03-01", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false },
      { id: "s-b", title: "Record B", publisher: "P", sourceType: "news_report", publishedAt: "2099-03-01", datePrecision: "day", excerpt: "", notes: "", isPrimaryMarkedByReviewer: false }
    );
    state.claimSourceLinks.push(
      { id: "l-1", claimId: "c-1", sourceId: "s-a", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 },
      { id: "l-2", claimId: "c-1", sourceId: "s-b", type: "supports", notes: "", excerptRelevance: "addresses_claim", scopeMismatch: "none_noted", assessedAtClaimRevision: 1 }
    );

    const earliest = computeEarliest(state, "c-1");
    expect(earliest.type).toBe("ambiguous");
  });
});

describe("Derived Logic — computeGaps", () => {
  it("emits G1 when no relevant sources linked", () => {
    const state = createBaseState();
    const gaps = computeGaps(state);
    expect(gaps.some((g) => g.ruleId === "G1")).toBe(true);
  });

  it("emits G2 when relevant sources linked but none marked primary", () => {
    const state = createBaseState();
    state.sources.push({
      id: "s-1",
      title: "S1",
      publisher: "P",
      sourceType: "social_post",
      publishedAt: "2099-01-01",
      datePrecision: "day",
      excerpt: "",
      notes: "",
      isPrimaryMarkedByReviewer: false,
    });
    state.claimSourceLinks.push({
      id: "l-1",
      claimId: "c-1",
      sourceId: "s-1",
      type: "supports",
      notes: "",
      excerptRelevance: "addresses_claim",
      scopeMismatch: "none_noted",
      assessedAtClaimRevision: 1,
    });

    const gaps = computeGaps(state);
    expect(gaps.some((g) => g.ruleId === "G2")).toBe(true);
  });

  it("respects dismissed gaps with reviewer rationale", () => {
    const state = createBaseState();
    state.claims[0].dismissedGaps = [
      { ruleId: "G1", sourceId: undefined, reason: "Verified via physical archive record.", at: "2099-01-01" },
    ];
    const gaps = computeGaps(state);
    expect(gaps.some((g) => g.ruleId === "G1")).toBe(false);
  });
});

describe("Derived Logic — compareWording", () => {
  it("detects shift from hedge to assertion", () => {
    const textA = "Officials reported investigating a possible espionage allegation.";
    const textB = "Officials confirmed she was a foreign spy.";
    const observations = compareWording(textA, textB);
    expect(observations.some((o) => o.kind === "hedge_to_assertion")).toBe(true);
    expect(observations[0].explanation).toContain("This change may warrant review.");
  });

  it("detects shift from narrow to broad quantifiers", () => {
    const textA = "Some harbour workers reported missing equipment.";
    const textB = "Everyone knows the entire harbour was compromised.";
    const observations = compareWording(textA, textB);
    expect(observations.some((o) => o.kind === "narrow_to_broad")).toBe(true);
  });
});

describe("Demo Dataset & Contamination Test", () => {
  it("verifies demo state satisfies contamination rules: S1 supports A but is not_established for B", () => {
    const demo = createDemoState();
    const linkA1 = demo.claimSourceLinks.find((l) => l.claimId === "claim-a" && l.sourceId === "src-1");
    const linkB1 = demo.claimSourceLinks.find((l) => l.claimId === "claim-b" && l.sourceId === "src-1");

    expect(linkA1?.type).toBe("supports");
    expect(linkB1?.type).toBe("not_established");

    const indepB = computeIndependence(demo, "claim-b");
    // Claim B has no 'supports' links (only contextualizes and repeats)
    expect(indepB.type).toBe("no_support");

    const earliestB = computeEarliest(demo, "claim-b");
    // Earliest dated relevant record exists (S2 is 2099-03-03), but S4 is undated, so provisional must be true!
    expect(earliestB.type).toBe("earliest_among_dated");
    if (earliestB.type === "earliest_among_dated") {
      expect(earliestB.isProvisional).toBe(true);
    }

    const report = buildReportModel(demo);
    expect(report.claimsReport.length).toBe(2);
    expect(report.isDemo).toBe(true);
    expect(report.disclaimer).toContain("does not independently prove or disprove");
  });
});
