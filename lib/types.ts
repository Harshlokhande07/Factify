export type PartialISODate = string; // 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD'
export type DatePrecision = "day" | "month" | "year" | "unknown";
export type ReviewStatus = "not_checked" | "evidence_found" | "needs_verification";
export type SourceType =
  | "official_record"
  | "press_release"
  | "news_report"
  | "social_post"
  | "messaging_forward"
  | "blog_opinion"
  | "analysis"
  | "other"
  | "unknown";

export type ClaimLinkType =
  | "supports"
  | "contradicts"
  | "contextualizes"
  | "repeats"
  | "unrelated"
  | "not_established";

export type SourceRelType =
  | "explicitly_cites"
  | "quotes"
  | "appears_to_repeat"
  | "possible_shared_origin"
  | "reviewer_judged_independent"
  | "unknown";

export type Verification = "documented" | "reviewer_suspected" | "unknown";

export interface Investigation {
  id: string;
  originalText: string;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
  schemaVersion: 1;
}

export interface ClaimQuestion {
  id: string;
  ruleId: string;
  text: string;
  anchorText?: string;
  resolved: boolean;
  edited: boolean;
}

export interface DismissedGap {
  ruleId: string;
  sourceId?: string;
  reason: string;
  at: string;
}

export interface Claim {
  id: string;
  investigationId: string;
  text: string;
  order: number;
  textRevision: number;
  originSpan?: { start: number; end: number } | null;
  status: ReviewStatus;
  statusHistory: { status: ReviewStatus; at: string }[];
  checklist: {
    source: boolean;
    date: boolean;
    evidence: boolean;
    context: boolean;
    corroboration: boolean;
  };
  notes: string;
  referenceUrl?: string;
  questions: ClaimQuestion[];
  dismissedGaps: DismissedGap[];
}

export interface SourceObservations {
  authorIdentified?: boolean | null;
  primaryLinked?: boolean | null;
  dateAvailable?: boolean | null;
  citationsPresent?: boolean | null;
  sensationalWording?: boolean | null;
  independenceEstablished?: boolean | null;
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  sourceType: SourceType;
  url?: string;
  publishedAt: PartialISODate | null;
  datePrecision: DatePrecision;
  dateNote?: string;
  accessedAt?: string;
  excerpt: string;
  notes: string;
  isPrimaryMarkedByReviewer: boolean;
  observations?: SourceObservations;
  suggestionMeta?: {
    matchedQueries: string[];
    matchBucket: "high" | "medium" | "low";
    classificationMethod: string;
    firstArchivedAt?: string | null;
    fromMockData: boolean;
  };
  origin?: "manual" | "search_confirmed";
}

export interface ClaimSourceLink {
  id: string;
  claimId: string;
  sourceId: string;
  type: ClaimLinkType;
  notes: string;
  excerptRelevance: "addresses_claim" | "partly" | "unclear" | "not_assessed";
  scopeMismatch: "none_noted" | "possible" | "not_assessed";
  assessedAtClaimRevision: number;
}

export interface SourceRelationship {
  id: string;
  fromSourceId: string;
  toSourceId: string;
  type: SourceRelType;
  verification: Verification;
  explanation: string;
}

export interface WordingObservation {
  id: string;
  kind: string;
  aText: string;
  bText: string;
  explanation: string;
  reviewState: "unconfirmed" | "confirmed" | "dismissed";
  note?: string;
}

export type IndependenceType =
  | "no_support"
  | "single_source"
  | "one_dependency_chain"
  | "independence_unverified"
  | "reviewer_judged_independent";

export interface IndependenceResult {
  type: IndependenceType;
  label: string;
  description: string;
  supportingSourceCount: number;
  componentCount: number;
}

export type EarliestResult =
  | {
      type: "none";
      message: string;
      scope: string;
    }
  | {
      type: "earliest_among_dated";
      sourceId: string;
      source: Source;
      linkType: ClaimLinkType;
      scope: string;
      isProvisional: boolean;
      undatedCount: number;
      upstreamChain?: { rel: SourceRelationship; upstreamSource: Source }[];
    }
  | {
      type: "ambiguous";
      tiedSourceIds: string[];
      tiedSources: Source[];
      message: string;
      scope: string;
    };

export interface Gap {
  id: string;
  ruleId: string; // 'G1' | 'G2' | ...
  claimId: string;
  sourceId?: string;
  message: string;
  nextStep: string;
  kind: "rule" | "heuristic_suggestion";
}

export interface Highlight {
  kind: "number" | "date" | "quote" | "entity" | "absolute" | "allegation";
  start: number;
  end: number;
  text: string;
  ruleId: string;
  explanation?: string;
}

export interface StatementSplit {
  text: string;
  start: number;
  end: number;
}

export interface InvestigationSuggestion {
  id: string;
  canonicalUrl: string;
  data: import("./search/types").SearchSuggestion;
  status: "suggested" | "confirmed" | "dismissed";
  runId: string;
}

export interface InvestigationSearchRun {
  id: string;
  ranAt: string;
  claimId?: string;
  provider: string;
  mock: boolean;
  coverage: import("./search/types").SearchCoverage;
  queries: import("./search/types").SearchQueryInfo[];
}

export interface InvestigationState {
  investigation: Investigation | null;
  claims: Claim[];
  sources: Source[];
  claimSourceLinks: ClaimSourceLink[];
  sourceRelationships: SourceRelationship[];
  wordingReviews: Record<string, { reviewState: "unconfirmed" | "confirmed" | "dismissed"; note?: string }>;
  suggestions: InvestigationSuggestion[];
  searchRuns: InvestigationSearchRun[];
  ui: {
    nodePositions: Record<string, { x: number; y: number }>;
  };
}

export interface FilterState {
  claimId?: string;
  sourceType?: SourceType;
  claimLinkType?: ClaimLinkType;
  sourceRelType?: SourceRelType;
  reviewStatus?: ReviewStatus;
}
