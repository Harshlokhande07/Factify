import { InvestigationState, Gap } from "../types";
import { isLinkRelevant } from "./helpers";
import { computeIndependence } from "./independence";

export function computeGaps(state: InvestigationState): Gap[] {
  const gaps: Gap[] = [];
  const sourceMap = new Map(state.sources.map((s) => [s.id, s]));

  for (const claim of state.claims) {
    const dismissedRuleIds = new Set(
      claim.dismissedGaps?.map((d) => `${d.ruleId}_${d.sourceId || ""}`) || []
    );

    const links = state.claimSourceLinks.filter((l) => l.claimId === claim.id);
    const relevantLinks = links.filter((l) => isLinkRelevant(l.type));

    // G1: no_source
    // Condition: no link other than unrelated/not_established
    if (relevantLinks.length === 0) {
      const gapKey = `G1_`;
      if (!dismissedRuleIds.has(gapKey)) {
        gaps.push({
          id: `${claim.id}_G1`,
          ruleId: "G1",
          claimId: claim.id,
          message: "No relevant evidence record linked to this statement.",
          nextStep: "Find a record that directly addresses this claim",
          kind: "rule",
        });
      }
    }

    // G2: no_primary
    // Condition: at least one relevant claim–source link exists, but none is marked primary by reviewer
    if (relevantLinks.length > 0) {
      const hasPrimary = relevantLinks.some((l) => {
        const src = sourceMap.get(l.sourceId);
        return src?.isPrimaryMarkedByReviewer === true;
      });

      if (!hasPrimary) {
        const gapKey = `G2_`;
        if (!dismissedRuleIds.has(gapKey)) {
          gaps.push({
            id: `${claim.id}_G2`,
            ruleId: "G2",
            claimId: claim.id,
            message: "No linked primary source record has been identified.",
            nextStep: "Locate the original statement, document, or recording.",
            kind: "rule",
          });
        }
      }
    }

    // Check per-link gaps
    for (const link of relevantLinks) {
      const src = sourceMap.get(link.sourceId);
      if (!src) continue;

      // G3: date_unknown
      if (!src.publishedAt || src.datePrecision === "unknown") {
        const gapKey = `G3_${src.id}`;
        if (!dismissedRuleIds.has(gapKey)) {
          gaps.push({
            id: `${claim.id}_${src.id}_G3`,
            ruleId: "G3",
            claimId: claim.id,
            sourceId: src.id,
            message: `Linked record "${src.title}" does not have a confirmed publication date.`,
            nextStep: "Look for a publication date or archive timestamp",
            kind: "rule",
          });
        }
      }

      // G4: excerpt_unclear
      if (link.excerptRelevance === "unclear") {
        const gapKey = `G4_${src.id}`;
        if (!dismissedRuleIds.has(gapKey)) {
          gaps.push({
            id: `${claim.id}_${src.id}_G4`,
            ruleId: "G4",
            claimId: claim.id,
            sourceId: src.id,
            message: `Excerpt relevance in "${src.title}" is flagged as unclear.`,
            nextStep: "Re-read the excerpt against the exact claim wording",
            kind: "rule",
          });
        }
      }

      // G5: scope_mismatch
      if (link.scopeMismatch === "possible") {
        const gapKey = `G5_${src.id}`;
        if (!dismissedRuleIds.has(gapKey)) {
          gaps.push({
            id: `${claim.id}_${src.id}_G5`,
            ruleId: "G5",
            claimId: claim.id,
            sourceId: src.id,
            message: `Possible scope mismatch noted between statement and "${src.title}".`,
            nextStep:
              "Check whether the source says the same thing about the same people, place and time",
            kind: "rule",
          });
        }
      }

      // G9: stale_assessment
      if (link.assessedAtClaimRevision !== claim.textRevision) {
        const gapKey = `G9_${src.id}`;
        if (!dismissedRuleIds.has(gapKey)) {
          gaps.push({
            id: `${claim.id}_${src.id}_G9`,
            ruleId: "G9",
            claimId: claim.id,
            sourceId: src.id,
            message: `Link assessment for "${src.title}" is stale because the statement was edited.`,
            nextStep: "Re-assess this link against the edited claim text",
            kind: "rule",
          });
        }
      }
    }

    // G6: independence
    // Condition: independence result is anything except reviewer_judged_independent and claim has >= 1 supporting or repeating link
    const supportOrRepeatCount = links.filter(
      (l) => l.type === "supports" || l.type === "repeats"
    ).length;

    if (supportOrRepeatCount >= 1) {
      const indep = computeIndependence(state, claim.id);
      if (indep.type !== "reviewer_judged_independent") {
        const gapKey = `G6_`;
        if (!dismissedRuleIds.has(gapKey)) {
          gaps.push({
            id: `${claim.id}_G6`,
            ruleId: "G6",
            claimId: claim.id,
            message: `Independent corroboration is unestablished (${indep.label.toLowerCase()}).`,
            nextStep: "Determine whether the reports rely on the same upstream source",
            kind: "rule",
          });
        }
      }
    }

    // G7: contradiction
    // Condition: any contradicts link
    const contradictionLink = links.find((l) => l.type === "contradicts");
    if (contradictionLink) {
      const gapKey = `G7_`;
      if (!dismissedRuleIds.has(gapKey)) {
        gaps.push({
          id: `${claim.id}_G7`,
          ruleId: "G7",
          claimId: claim.id,
          sourceId: contradictionLink.sourceId,
          message: "A linked record directly contradicts this statement.",
          nextStep: "Examine the contradicting record and reconcile or explain the difference",
          kind: "rule",
        });
      }
    }

    // G8: relationship_unknown
    // Condition: two sources on the same claim with no relationship or unknown
    if (relevantLinks.length >= 2) {
      const relevantSourceIds = relevantLinks.map((l) => l.sourceId);
      for (let i = 0; i < relevantSourceIds.length; i++) {
        for (let j = i + 1; j < relevantSourceIds.length; j++) {
          const s1 = relevantSourceIds[i];
          const s2 = relevantSourceIds[j];
          const rel = state.sourceRelationships.find(
            (r) =>
              (r.fromSourceId === s1 && r.toSourceId === s2) ||
              (r.fromSourceId === s2 && r.toSourceId === s1)
          );

          if (!rel || rel.type === "unknown") {
            const gapKey = `G8_${s1}_${s2}`;
            if (!dismissedRuleIds.has(gapKey)) {
              const src1 = sourceMap.get(s1);
              const src2 = sourceMap.get(s2);
              gaps.push({
                id: `${claim.id}_${s1}_${s2}_G8`,
                ruleId: "G8",
                claimId: claim.id,
                sourceId: s1,
                message: `Relationship between "${src1?.title || s1}" and "${src2?.title || s2}" is unknown.`,
                nextStep: "Check whether one cites or reuses the other",
                kind: "rule",
              });
            }
          }
        }
      }
    }
  }

  return gaps;
}
