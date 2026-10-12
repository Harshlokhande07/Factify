import {
  InvestigationState,
  Claim,
  Source,
  ClaimSourceLink,
  SourceRelationship,
  IndependenceResult,
  EarliestResult,
  Gap,
  WordingObservation,
} from "../types";
import { computeIndependence } from "./independence";
import { computeEarliest } from "./earliest";
import { computeGaps } from "./gaps";
import { compareWording } from "./wording";
import { DISCLAIMER_TEXT } from "../copy";

export interface ClaimReportItem {
  claim: Claim;
  independence: IndependenceResult;
  earliest: EarliestResult;
  links: { link: ClaimSourceLink; source: Source }[];
  gaps: Gap[];
}

export interface ReportModel {
  title: string;
  generatedAt: string;
  isDemo: boolean;
  disclaimer: string;
  originalText: string;
  scopeSummary: {
    totalSources: number;
    datedSources: number;
    undatedSources: number;
  };
  claimsReport: ClaimReportItem[];
  sources: Source[];
  sourceRelationships: {
    relationship: SourceRelationship;
    fromSource?: Source;
    toSource?: Source;
  }[];
  wordingChanges: {
    sourceA?: Source;
    sourceB?: Source;
    observations: WordingObservation[];
  }[];
  allOpenGaps: Gap[];
  searchRuns: import("../types").InvestigationSearchRun[];
  hasMockData: boolean;
}

export function buildReportModel(state: InvestigationState): ReportModel {
  const sourceMap = new Map<string, Source>(state.sources.map((s) => [s.id, s]));
  const allGaps = computeGaps(state);

  let datedSourcesCount = 0;
  let undatedSourcesCount = 0;

  for (const s of state.sources) {
    if (s.publishedAt && s.datePrecision !== "unknown") {
      datedSourcesCount++;
    } else {
      undatedSourcesCount++;
    }
  }

  const claimsReport: ClaimReportItem[] = state.claims.map((claim) => {
    const claimLinks = state.claimSourceLinks
      .filter((l) => l.claimId === claim.id)
      .map((l) => ({ link: l, source: sourceMap.get(l.sourceId)! }))
      .filter((item) => Boolean(item.source));

    const claimGaps = allGaps.filter((g) => g.claimId === claim.id);
    const independence = computeIndependence(state, claim.id);
    const earliest = computeEarliest(state, claim.id);

    return {
      claim,
      independence,
      earliest,
      links: claimLinks,
      gaps: claimGaps,
    };
  });

  const sourceRelationships = state.sourceRelationships.map((r) => ({
    relationship: r,
    fromSource: sourceMap.get(r.fromSourceId),
    toSource: sourceMap.get(r.toSourceId),
  }));

  // Wording changes for related sources
  const wordingChanges: ReportModel["wordingChanges"] = [];
  for (const rel of state.sourceRelationships) {
    const srcA = sourceMap.get(rel.toSourceId);
    const srcB = sourceMap.get(rel.fromSourceId);
    if (srcA && srcB && srcA.excerpt && srcB.excerpt) {
      const obs = compareWording(srcA.excerpt, srcB.excerpt, state.wordingReviews);
      if (obs.length > 0) {
        wordingChanges.push({
          sourceA: srcA,
          sourceB: srcB,
          observations: obs,
        });
      }
    }
  }

  return {
    title: "Factify Evidence Tracing & Provenance Review Report",
    generatedAt: new Date().toISOString(),
    isDemo: state.investigation?.isDemo || false,
    disclaimer: DISCLAIMER_TEXT,
    originalText: state.investigation?.originalText || "",
    scopeSummary: {
      totalSources: state.sources.length,
      datedSources: datedSourcesCount,
      undatedSources: undatedSourcesCount,
    },
    claimsReport,
    sources: state.sources,
    sourceRelationships,
    wordingChanges,
    allOpenGaps: allGaps,
    searchRuns: state.searchRuns || [],
    hasMockData: state.sources.some((s) => s.suggestionMeta?.fromMockData),
  };
}
