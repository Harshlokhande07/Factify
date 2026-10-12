import { MONTH_NAMES, WEEKDAY_NAMES, ABSOLUTE_TERMS, ALLEGATION_TERMS } from "./lexicons";
import { Highlight } from "../types";

const PRIORITY_ORDER: Record<Highlight["kind"], number> = {
  quote: 1,
  date: 2,
  number: 3,
  absolute: 4,
  allegation: 5,
  entity: 6,
};

export function detectFeatures(text: string): Highlight[] {
  if (!text) return [];

  const rawHighlights: Highlight[] = [];

  // 1. Quoted text
  const quoteRegex = /(?:"[^"]{2,}"|“[^”]{2,}”|«[^»]{2,}»)/g;
  let qMatch;
  while ((qMatch = quoteRegex.exec(text)) !== null) {
    rawHighlights.push({
      kind: "quote",
      start: qMatch.index,
      end: qMatch.index + qMatch[0].length,
      text: qMatch[0],
      ruleId: "F_QUOTE",
      explanation: "Direct quote span",
    });
  }

  // 2. Dates
  // Ambiguous slash dates e.g. 12/03/2031 or 03/12/2031
  const ambiguousSlashDateRegex = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g;
  let ambMatch;
  while ((ambMatch = ambiguousSlashDateRegex.exec(text)) !== null) {
    const d1 = parseInt(ambMatch[1], 10);
    const d2 = parseInt(ambMatch[2], 10);
    const isAmbiguous = d1 <= 12 && d2 <= 12;
    rawHighlights.push({
      kind: "date",
      start: ambMatch.index,
      end: ambMatch.index + ambMatch[0].length,
      text: ambMatch[0],
      ruleId: isAmbiguous ? "F_DATE_AMBIGUOUS" : "F_DATE_SLASH",
      explanation: isAmbiguous ? "Ambiguous numeric date (could be DD/MM or MM/DD)" : "Numeric date",
    });
  }

  // ISO Dates (YYYY-MM-DD or YYYY-MM)
  const isoDateRegex = /\b\d{4}-\d{2}(?:-\d{2})?\b/g;
  let isoMatch;
  while ((isoMatch = isoDateRegex.exec(text)) !== null) {
    rawHighlights.push({
      kind: "date",
      start: isoMatch.index,
      end: isoMatch.index + isoMatch[0].length,
      text: isoMatch[0],
      ruleId: "F_DATE_ISO",
      explanation: "ISO date format",
    });
  }

  // Written dates: "12 March 2099", "March 12, 2099", "12 March", "March 2099"
  const monthPattern = MONTH_NAMES.join("|");
  const writtenDateRegex = new RegExp(
    `\\b(?:(?:\\d{1,2}(?:st|nd|rd|th)?\\s+)?(?:${monthPattern})(?:\\s+\\d{1,2}(?:st|nd|rd|th)?)?(?:,?\\s+\\d{4})?|\\d{4})\\b`,
    "gi"
  );
  let wMatch;
  while ((wMatch = writtenDateRegex.exec(text)) !== null) {
    // Avoid standalone numbers if they don't look like years (1900-2100)
    const matchText = wMatch[0].trim();
    if (/^\d{4}$/.test(matchText)) {
      const year = parseInt(matchText, 10);
      if (year < 1800 || year > 2150) continue;
    }
    rawHighlights.push({
      kind: "date",
      start: wMatch.index,
      end: wMatch.index + wMatch[0].length,
      text: wMatch[0],
      ruleId: "F_DATE_WRITTEN",
      explanation: "Identified calendar date / year",
    });
  }

  // 3. Numbers, Currency, Percentages, Quantities
  // Currency with symbols and prefixes ($ € £ ₹ Rs INR USD), lakh, crore, million, billion
  const currencyAndQuantityRegex =
    /(?:[\$€£₹]|Rs\.?|INR|USD)\s*\d+(?:[.,]\d+)*(?:\s*(?:million|billion|trillion|lakh|crore))?|\b\d+(?:[.,]\d+)*\s*(?:%|percent|percentage|million|billion|trillion|lakh|crore)\b|\b\d+(?:[.,]\d+)*\b/gi;
  let numMatch;
  while ((numMatch = currencyAndQuantityRegex.exec(text)) !== null) {
    rawHighlights.push({
      kind: "number",
      start: numMatch.index,
      end: numMatch.index + numMatch[0].length,
      text: numMatch[0],
      ruleId: "F_NUMBER_STAT",
      explanation: "Quantitative figure or financial metric",
    });
  }

  // 4. Absolute & Sensational wording
  for (const term of ABSOLUTE_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const termRegex = new RegExp(`\\b${escaped}\\b`, "gi");
    let match;
    while ((match = termRegex.exec(text)) !== null) {
      rawHighlights.push({
        kind: "absolute",
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        ruleId: "F_ABSOLUTE",
        explanation: "Absolute or high-certainty cue",
      });
    }
  }

  // Repeated exclamation marks or ALL-CAPS words (>=3 chars)
  const allCapsRegex = /\b[A-Z]{3,}\b/g;
  let capMatch;
  while ((capMatch = allCapsRegex.exec(text)) !== null) {
    // Avoid common acronyms like USA, BBC if not sensational, but ALL CAPS often indicates virality
    rawHighlights.push({
      kind: "absolute",
      start: capMatch.index,
      end: capMatch.index + capMatch[0].length,
      text: capMatch[0],
      ruleId: "F_ALL_CAPS",
      explanation: "Capitalized emphasis",
    });
  }

  const exclamRegex = /!{2,}/g;
  let exMatch;
  while ((exMatch = exclamRegex.exec(text)) !== null) {
    rawHighlights.push({
      kind: "absolute",
      start: exMatch.index,
      end: exMatch.index + exMatch[0].length,
      text: exMatch[0],
      ruleId: "F_PUNCT_EMPHASIS",
      explanation: "Multiple exclamation emphasis",
    });
  }

  // 5. Allegation and hedging cues
  for (const term of ALLEGATION_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const termRegex = new RegExp(`\\b${escaped}\\b`, "gi");
    let match;
    while ((match = termRegex.exec(text)) !== null) {
      rawHighlights.push({
        kind: "allegation",
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        ruleId: "F_ALLEGATION",
        explanation: "Allegation, suspicion, or hedging cue",
      });
    }
  }

  // 6. Named entities / organizations / places
  // Multi-word capitalized sequences or 2-5 letter acronyms
  const entityRegex = /\b(?:\p{Lu}[\p{Ll}]+(?:\s+(?:of|for|the|de|and)\s+)?){2,}\b|\b\p{Lu}[\p{Ll}]+\b/gu;
  let entMatch;
  while ((entMatch = entityRegex.exec(text)) !== null) {
    const matchedStr = entMatch[0].trim();
    // Exclude days of week and month names
    const words = matchedStr.split(/\s+/);
    if (words.length === 1) {
      if (MONTH_NAMES.includes(matchedStr) || WEEKDAY_NAMES.includes(matchedStr)) {
        continue;
      }
      // Skip single capitalized word at sentence start (offset 0 or following . ! ?)
      const isStart =
        entMatch.index === 0 ||
        /[.!?]\s+$/.test(text.slice(Math.max(0, entMatch.index - 5), entMatch.index));
      if (isStart) {
        continue;
      }
    }

    rawHighlights.push({
      kind: "entity",
      start: entMatch.index,
      end: entMatch.index + entMatch[0].length,
      text: entMatch[0],
      ruleId: "F_ENTITY",
      explanation: "Possible named person, institution, or location",
    });
  }

  // Overlap resolution priority: quote > date > number > absolute > allegation > entity
  // Sort raw highlights by priority (lower number = higher priority), then longest span
  rawHighlights.sort((a, b) => {
    const pA = PRIORITY_ORDER[a.kind];
    const pB = PRIORITY_ORDER[b.kind];
    if (pA !== pB) return pA - pB;
    return b.end - b.start - (a.end - a.start);
  });

  const resolved: Highlight[] = [];
  for (const candidate of rawHighlights) {
    const overlaps = resolved.some(
      (r) => Math.max(candidate.start, r.start) < Math.min(candidate.end, r.end)
    );
    if (!overlaps) {
      resolved.push(candidate);
    }
  }

  // Sort by start offset
  return resolved.sort((a, b) => a.start - b.start);
}
