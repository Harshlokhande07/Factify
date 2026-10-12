import { InvestigationState, IndependenceResult } from "../types";

export function computeIndependence(
  state: InvestigationState,
  claimId: string
): IndependenceResult {
  // S = sources linked to the claim with type 'supports'
  const supportingLinks = state.claimSourceLinks.filter(
    (l) => l.claimId === claimId && l.type === "supports"
  );
  const supportingSourceIds = new Set(supportingLinks.map((l) => l.sourceId));

  if (supportingSourceIds.size === 0) {
    return {
      type: "no_support",
      label: "No supporting records",
      description: "No records linked with 'supports' type.",
      supportingSourceCount: 0,
      componentCount: 0,
    };
  }

  if (supportingSourceIds.size === 1) {
    return {
      type: "single_source",
      label: "Single source",
      description: "Only one supporting source record is currently linked.",
      supportingSourceCount: 1,
      componentCount: 1,
    };
  }

  // Build undirected dependency graph over ALL sources using dependency relationships
  // whose verification is 'documented' or 'reviewer_suspected'
  const adj = new Map<string, Set<string>>();
  for (const s of state.sources) {
    adj.set(s.id, new Set<string>());
  }

  const dependencyTypes = new Set([
    "explicitly_cites",
    "quotes",
    "appears_to_repeat",
    "possible_shared_origin",
  ]);

  for (const rel of state.sourceRelationships) {
    if (
      dependencyTypes.has(rel.type) &&
      (rel.verification === "documented" || rel.verification === "reviewer_suspected")
    ) {
      if (!adj.has(rel.fromSourceId)) adj.set(rel.fromSourceId, new Set());
      if (!adj.has(rel.toSourceId)) adj.set(rel.toSourceId, new Set());
      adj.get(rel.fromSourceId)!.add(rel.toSourceId);
      adj.get(rel.toSourceId)!.add(rel.fromSourceId);
    }
  }

  // Find connected components across all sources
  const visited = new Set<string>();
  const componentMap = new Map<string, number>(); // sourceId -> componentId
  let currentComponentId = 0;

  for (const s of state.sources) {
    if (!visited.has(s.id)) {
      const queue = [s.id];
      visited.add(s.id);
      componentMap.set(s.id, currentComponentId);

      while (queue.length > 0) {
        const u = queue.shift()!;
        const neighbors = adj.get(u) || new Set();
        for (const v of neighbors) {
          if (!visited.has(v)) {
            visited.add(v);
            componentMap.set(v, currentComponentId);
            queue.push(v);
          }
        }
      }
      currentComponentId++;
    }
  }

  // Determine components present among S (supporting sources)
  const supportingComponents = new Set<number>();
  const componentToSupportingSources = new Map<number, string[]>();
  for (const sId of supportingSourceIds) {
    const cId = componentMap.get(sId) ?? currentComponentId++;
    supportingComponents.add(cId);
    if (!componentToSupportingSources.has(cId)) {
      componentToSupportingSources.set(cId, []);
    }
    componentToSupportingSources.get(cId)!.push(sId);
  }

  if (supportingComponents.size === 1) {
    return {
      type: "one_dependency_chain",
      label: "One dependency chain",
      description:
        "Corroboration has not been established independently; the supporting records are connected by citation, repetition, or suspected shared origin.",
      supportingSourceCount: supportingSourceIds.size,
      componentCount: 1,
    };
  }

  // Check if reviewer has explicitly recorded a reviewer_judged_independent relationship
  // between sources across different supporting components
  const hasReviewerJudgedIndependent = state.sourceRelationships.some((rel) => {
    if (rel.type !== "reviewer_judged_independent") return false;
    const cFrom = componentMap.get(rel.fromSourceId);
    const cTo = componentMap.get(rel.toSourceId);
    if (cFrom === undefined || cTo === undefined) return false;
    return (
      cFrom !== cTo &&
      supportingComponents.has(cFrom) &&
      supportingComponents.has(cTo)
    );
  });

  if (hasReviewerJudgedIndependent) {
    return {
      type: "reviewer_judged_independent",
      label: "Independence judged by reviewer",
      description:
        "Independence judged by reviewer; Factify has not verified it.",
      supportingSourceCount: supportingSourceIds.size,
      componentCount: supportingComponents.size,
    };
  }

  return {
    type: "independence_unverified",
    label: "Independence not established",
    description:
      "Supporting sources span separate branches, but reviewer has not verified independent origination.",
    supportingSourceCount: supportingSourceIds.size,
    componentCount: supportingComponents.size,
  };
}
