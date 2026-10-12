import { WordingObservation } from "../types";
import { detectFeatures } from "../analysis/highlights";

// Word-level LCS tokenizer
export function tokenizeWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function computeWordDiff(
  textA: string,
  textB: string
): { added: string[]; removed: string[] } {
  const wordsA = tokenizeWords(textA.toLowerCase().replace(/[^\p{L}\d\s]/gu, ""));
  const wordsB = tokenizeWords(textB.toLowerCase().replace(/[^\p{L}\d\s]/gu, ""));

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  const removed = wordsA.filter((w) => !setB.has(w));
  const added = wordsB.filter((w) => !setA.has(w));

  return { added, removed };
}

export function compareWording(
  textA: string,
  textB: string,
  existingReviews?: Record<string, { reviewState: "unconfirmed" | "confirmed" | "dismissed"; note?: string }>
): WordingObservation[] {
  const observations: WordingObservation[] = [];
  const lowerA = textA.toLowerCase();
  const lowerB = textB.toLowerCase();

  const { added, removed } = computeWordDiff(textA, textB);

  // 1. Hedge -> Assertion
  const hedgeTokens = ["possible", "alleged", "allegedly", "suspected", "suspicion", "reportedly", "investigating", "may", "claims", "unconfirmed"];
  const assertionTokens = ["is", "was", "confirmed", "proven", "definitely", "guilty", "spy"];

  const hasHedgeInA = hedgeTokens.some((t) => lowerA.includes(t));
  const hasHedgeInB = hedgeTokens.some((t) => lowerB.includes(t));
  const hasAssertionInB = assertionTokens.some((t) => lowerB.includes(t));
  const hasAssertionInA = assertionTokens.some((t) => lowerA.includes(t));

  if (hasHedgeInA && !hasHedgeInB && hasAssertionInB) {
    const id = `hedge_to_assertion`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "hedge_to_assertion",
      aText: hedgeTokens.filter((t) => lowerA.includes(t)).join(", "),
      bText: assertionTokens.filter((t) => lowerB.includes(t)).join(", "),
      explanation: "Hedged or qualified language in Wording A is replaced by definitive assertion in Wording B. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  } else if (!hasHedgeInA && hasAssertionInA && hasHedgeInB && !hasAssertionInB) {
    const id = `assertion_to_hedge`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "assertion_to_hedge",
      aText: assertionTokens.filter((t) => lowerA.includes(t)).join(", "),
      bText: hedgeTokens.filter((t) => lowerB.includes(t)).join(", "),
      explanation: "Definitive assertion in Wording A is qualified with hedging language in Wording B. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  }

  // 2. Narrow -> Broad (Generalization)
  const narrowTokens = ["some", "several", "few", "partly", "individual"];
  const broadTokens = ["many", "all", "every", "everyone", "always", "entire", "widespread"];

  const hasNarrowInA = narrowTokens.some((t) => lowerA.includes(t));
  const hasBroadInB = broadTokens.some((t) => lowerB.includes(t));

  if (hasNarrowInA && hasBroadInB) {
    const id = `narrow_to_broad`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "narrow_to_broad",
      aText: narrowTokens.filter((t) => lowerA.includes(t)).join(", "),
      bText: broadTokens.filter((t) => lowerB.includes(t)).join(", "),
      explanation: "Narrowly scoped quantifiers in Wording A appear expanded to broader general terms in Wording B. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  }

  // 3. Negation added or removed
  const negations = ["not", "never", "no", "neither", "nor", "none", "denied", "denies"];
  const negA = negations.filter((n) => lowerA.includes(n));
  const negB = negations.filter((n) => lowerB.includes(n));

  if (negA.length > 0 && negB.length === 0) {
    const id = `negation_removed`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "negation_removed",
      aText: negA.join(", "),
      bText: "(absent)",
      explanation: "Negation marker present in Wording A is absent from Wording B. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  } else if (negA.length === 0 && negB.length > 0) {
    const id = `negation_added`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "negation_added",
      aText: "(absent)",
      bText: negB.join(", "),
      explanation: "Negation marker introduced in Wording B that was absent in Wording A. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  }

  // 4. Attribution dropped
  const attributionPhrases = ["according to", "spokesperson said", "sources reported", "stated that", "said that"];
  const attrA = attributionPhrases.filter((p) => lowerA.includes(p));
  const attrB = attributionPhrases.filter((p) => lowerB.includes(p));

  if (attrA.length > 0 && attrB.length === 0) {
    const id = `attribution_dropped`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "attribution_dropped",
      aText: attrA.join(", "),
      bText: "(direct assertion without attribution)",
      explanation: "Attribution qualifier in Wording A was omitted in Wording B. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  }

  // 5. Feature changes (numbers, dates, entities)
  const featuresA = detectFeatures(textA);
  const featuresB = detectFeatures(textB);

  const entitiesA = new Set(featuresA.filter((f) => f.kind === "entity").map((f) => f.text.toLowerCase()));
  const entitiesB = new Set(featuresB.filter((f) => f.kind === "entity").map((f) => f.text.toLowerCase()));

  const addedEntities = [...entitiesB].filter((e) => !entitiesA.has(e));
  const removedEntities = [...entitiesA].filter((e) => !entitiesB.has(e));

  if (addedEntities.length > 0 || removedEntities.length > 0) {
    const id = `entities_changed`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "entities_changed",
      aText: removedEntities.join(", ") || "(none)",
      bText: addedEntities.join(", ") || "(none)",
      explanation: "Entities or names present in one version differ from the other. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  }

  const numbersA = new Set(featuresA.filter((f) => f.kind === "number").map((f) => f.text));
  const numbersB = new Set(featuresB.filter((f) => f.kind === "number").map((f) => f.text));

  const addedNumbers = [...numbersB].filter((n) => !numbersA.has(n));
  const removedNumbers = [...numbersA].filter((n) => !numbersB.has(n));

  if (addedNumbers.length > 0 || removedNumbers.length > 0) {
    const id = `numbers_changed`;
    const review = existingReviews?.[id];
    observations.push({
      id,
      kind: "numbers_changed",
      aText: removedNumbers.join(", ") || "(none)",
      bText: addedNumbers.join(", ") || "(none)",
      explanation: "Numeric figures, metrics, or quantities differ between versions. This change may warrant review.",
      reviewState: review?.reviewState || "unconfirmed",
      note: review?.note,
    });
  }

  return observations;
}
