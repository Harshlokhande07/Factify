import { InvestigationState, FilterState } from "../types";
import { computeGaps } from "./gaps";
import { parseDateToInterval } from "./helpers";
import { CLAIM_LINK_TYPE_LABELS, SOURCE_REL_TYPE_LABELS } from "../copy";
import { Node, Edge, MarkerType } from "@xyflow/react";

export interface GraphBuildResult {
  nodes: Node[];
  edges: Edge[];
  hiddenCount: number;
}

export function buildGraph(
  state: InvestigationState,
  filters: FilterState = {},
  positions: Record<string, { x: number; y: number }> = {}
): GraphBuildResult {
  const allGaps = computeGaps(state);
  const gapsByClaim = new Map<string, number>();
  for (const g of allGaps) {
    gapsByClaim.set(g.claimId, (gapsByClaim.get(g.claimId) || 0) + 1);
  }

  const totalItemsCount = state.claims.length + state.sources.length;
  const visibleClaimIds = new Set<string>();
  let visibleSourceIds = new Set<string>();

  // Filter claims
  const filteredClaims = state.claims.filter((c) => {
    if (filters.claimId && c.id !== filters.claimId) return false;
    if (filters.reviewStatus && c.status !== filters.reviewStatus) return false;
    return true;
  });

  for (const c of filteredClaims) visibleClaimIds.add(c.id);

  // Filter sources
  const filteredSources = state.sources.filter((s) => {
    if (filters.sourceType && s.sourceType !== filters.sourceType) return false;
    return true;
  });

  for (const s of filteredSources) visibleSourceIds.add(s.id);

  // If claimId filter is active, only show sources linked to this claim
  if (filters.claimId) {
    const linkedSourceIds = new Set(
      state.claimSourceLinks
        .filter((l) => l.claimId === filters.claimId)
        .map((l) => l.sourceId)
    );
    visibleSourceIds = new Set(
      [...visibleSourceIds].filter((id) => linkedSourceIds.has(id))
    );
  }

  // Nodes array
  const nodes: Node[] = [];

  // 1. Claim Nodes (Left column)
  filteredClaims.forEach((claim, idx) => {
    const nodeId = `claim-${claim.id}`;
    const defaultPos = { x: 40, y: 60 + idx * 220 };
    const pos = positions[nodeId] || defaultPos;

    nodes.push({
      id: nodeId,
      type: "claimNode",
      position: pos,
      data: {
        claim,
        openGapsCount: gapsByClaim.get(claim.id) || 0,
      },
    });
  });

  // 2. Source Nodes (Right region, sorted by date)
  // Sort sources: dated first by dateMs, then undated
  const sortedSources = [...filteredSources].sort((a, b) => {
    const intA = parseDateToInterval(a.publishedAt, a.datePrecision);
    const intB = parseDateToInterval(b.publishedAt, b.datePrecision);
    if (intA && intB) return intA.startMs - intB.startMs;
    if (intA && !intB) return -1;
    if (!intA && intB) return 1;
    return a.title.localeCompare(b.title);
  });

  sortedSources.forEach((source, idx) => {
    if (!visibleSourceIds.has(source.id)) return;
    const nodeId = `source-${source.id}`;
    const isUndated = !source.publishedAt || source.datePrecision === "unknown";
    const defaultX = isUndated ? 680 : 420;
    const defaultPos = { x: defaultX, y: 60 + idx * 200 };
    const pos = positions[nodeId] || defaultPos;

    nodes.push({
      id: nodeId,
      type: "sourceNode",
      position: pos,
      data: {
        source,
        isDemo: state.investigation?.isDemo || false,
        isUndated,
      },
    });
  });

  // Edges
  const edges: Edge[] = [];

  // 1. Claim-Source Edges
  for (const link of state.claimSourceLinks) {
    if (!visibleClaimIds.has(link.claimId) || !visibleSourceIds.has(link.sourceId)) {
      continue;
    }
    if (filters.claimLinkType && link.type !== filters.claimLinkType) {
      continue;
    }

    const edgeId = `edge-cs-${link.claimId}-${link.sourceId}`;
    const linkInfo = CLAIM_LINK_TYPE_LABELS[link.type] || { label: link.type };

    edges.push({
      id: edgeId,
      source: `claim-${link.claimId}`,
      target: `source-${link.sourceId}`,
      type: "smoothstep",
      label: linkInfo.label,
      ariaLabel: `Claim linked to source with relation ${linkInfo.label}`,
      interactionWidth: 28,
      style: {
        strokeWidth: 2,
        stroke:
          link.type === "supports"
            ? "#0d9488"
            : link.type === "contradicts"
            ? "#e11d48"
            : link.type === "repeats"
            ? "#d97706"
            : "#64748b",
        strokeDasharray:
          link.type === "repeats"
            ? "5 5"
            : link.type === "not_established"
            ? "2 3"
            : undefined,
      },
      data: {
        link,
        kind: "claim_source",
      },
    });
  }

  // 2. Source-Source Edges
  for (const rel of state.sourceRelationships) {
    if (!visibleSourceIds.has(rel.fromSourceId) || !visibleSourceIds.has(rel.toSourceId)) {
      continue;
    }
    if (filters.sourceRelType && rel.type !== filters.sourceRelType) {
      continue;
    }

    const edgeId = `edge-ss-${rel.fromSourceId}-${rel.toSourceId}`;
    const relInfo = SOURCE_REL_TYPE_LABELS[rel.type] || { label: rel.type };

    const strokeDash =
      rel.verification === "documented"
        ? undefined
        : rel.verification === "reviewer_suspected"
        ? "6 4"
        : "2 3";

    edges.push({
      id: edgeId,
      source: `source-${rel.fromSourceId}`,
      target: `source-${rel.toSourceId}`,
      type: "smoothstep",
      label: `${relInfo.label} • ${rel.verification}`,
      ariaLabel: `Source ${rel.fromSourceId} relates to ${rel.toSourceId} as ${relInfo.label} (${rel.verification})`,
      interactionWidth: 28,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: "#0284c7",
      },
      style: {
        strokeWidth: 2,
        stroke: "#0284c7",
        strokeDasharray: strokeDash,
      },
      data: {
        relationship: rel,
        kind: "source_relationship",
      },
    });
  }

  const hiddenCount = totalItemsCount - nodes.length;

  return {
    nodes,
    edges,
    hiddenCount: Math.max(0, hiddenCount),
  };
}
