import { InvestigationState, EarliestResult, Source, SourceRelationship } from "../types";
import { isLinkRelevant, parseDateToInterval } from "./helpers";

export function computeEarliest(
  state: InvestigationState,
  claimId: string
): EarliestResult {
  const relevantLinks = state.claimSourceLinks.filter(
    (l) => l.claimId === claimId && isLinkRelevant(l.type)
  );

  if (relevantLinks.length === 0) {
    return {
      type: "none",
      message: "Earliest relevant record not established: no relevant source records linked to this claim.",
      scope: "0 relevant linked records",
    };
  }

  const sourceMap = new Map<string, Source>(state.sources.map((s) => [s.id, s]));

  interface DatedCandidate {
    source: Source;
    linkType: typeof relevantLinks[0]["type"];
    interval: { startMs: number; endMs: number };
  }

  const datedCandidates: DatedCandidate[] = [];
  const undatedCandidates: Source[] = [];

  for (const link of relevantLinks) {
    const src = sourceMap.get(link.sourceId);
    if (!src) continue;

    const interval = parseDateToInterval(src.publishedAt, src.datePrecision);
    if (interval && !src.dateNote?.toLowerCase().includes("conflict")) {
      datedCandidates.push({
        source: src,
        linkType: link.type,
        interval,
      });
    } else {
      undatedCandidates.push(src);
    }
  }

  const totalRelevant = relevantLinks.length;
  const totalDated = datedCandidates.length;
  const scopeStr = `among ${totalRelevant} relevant linked records, ${totalDated} dated`;

  if (datedCandidates.length === 0) {
    return {
      type: "none",
      message:
        "Earliest relevant record not established: all linked records are undated or have conflicting date notes.",
      scope: scopeStr,
    };
  }

  // Sort dated candidates by startMs ascending
  datedCandidates.sort((a, b) => a.interval.startMs - b.interval.startMs);

  const first = datedCandidates[0];

  // Check if there are overlapping candidates with the first candidate
  const overlapping = datedCandidates.filter(
    (c, idx) =>
      idx > 0 &&
      // Overlap condition: intervals overlap
      Math.max(first.interval.startMs, c.interval.startMs) <=
        Math.min(first.interval.endMs, c.interval.endMs)
  );

  if (overlapping.length > 0) {
    const tied = [first.source, ...overlapping.map((o) => o.source)];
    return {
      type: "ambiguous",
      tiedSourceIds: tied.map((s) => s.id),
      tiedSources: tied,
      message: `Multiple records have overlapping date intervals (${tied.map((t) => t.title).join(", ")}). Cannot determine a single earliest record.`,
      scope: scopeStr,
    };
  }

  // Find upstream documented chain for first candidate if available
  const upstreamChain: { rel: SourceRelationship; upstreamSource: Source }[] = [];
  const upstreamRels = state.sourceRelationships.filter(
    (r) =>
      r.fromSourceId === first.source.id &&
      (r.type === "explicitly_cites" || r.type === "quotes") &&
      r.verification === "documented"
  );

  for (const rel of upstreamRels) {
    const upSrc = sourceMap.get(rel.toSourceId);
    if (upSrc) {
      upstreamChain.push({ rel, upstreamSource: upSrc });
    }
  }

  return {
    type: "earliest_among_dated",
    sourceId: first.source.id,
    source: first.source,
    linkType: first.linkType,
    scope: scopeStr,
    isProvisional: undatedCandidates.length > 0,
    undatedCount: undatedCandidates.length,
    upstreamChain: upstreamChain.length > 0 ? upstreamChain : undefined,
  };
}
