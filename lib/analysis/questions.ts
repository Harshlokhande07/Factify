import { Highlight, ClaimQuestion } from "../types";
import { nanoid } from "nanoid";

export function suggestQuestions(
  claimText: string,
  highlights: Highlight[]
): ClaimQuestion[] {
  const questions: ClaimQuestion[] = [];
  const seenRuleTypes = new Set<string>();

  for (const hl of highlights) {
    let questionText = "";
    const key = `${hl.kind}_${hl.text}`;

    if (seenRuleTypes.has(key)) continue;
    seenRuleTypes.add(key);

    switch (hl.kind) {
      case "number":
        questionText = "Where does this figure come from?";
        break;
      case "date":
        if (hl.ruleId === "F_DATE_AMBIGUOUS") {
          questionText = "Is this day/month or month/day? Is this the original publication date or a later re-share?";
        } else {
          questionText = "Is this the original publication date or a later re-share?";
        }
        break;
      case "quote":
        questionText = "Is the full quotation available in context?";
        break;
      case "absolute":
        questionText = "Does the cited evidence support such a broad statement?";
        break;
      case "entity":
        questionText = "Is the person or organization identified unambiguously?";
        break;
      case "allegation":
        questionText =
          "Does the source report a suspicion, an accusation, a charge, or an established finding?";
        break;
      default:
        continue;
    }

    questions.push({
      id: nanoid(),
      ruleId: hl.ruleId,
      text: questionText,
      anchorText: hl.text,
      resolved: false,
      edited: false,
    });
  }

  return questions;
}
