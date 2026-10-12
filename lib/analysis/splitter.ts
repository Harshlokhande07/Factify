import { ABBREVIATIONS, VERB_LEXICON, SUBJECT_STARTERS } from "./lexicons";
import { StatementSplit } from "../types";

export function isMostlyNonLatin(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const latinMatches = text.match(/[A-Za-z0-9]/g) || [];
  const nonLatinMatches = text.match(/[\p{L}]/gu) || [];
  if (nonLatinMatches.length === 0) return false;
  return latinMatches.length / nonLatinMatches.length < 0.4;
}

interface QuoteSpan {
  start: number;
  end: number;
}

function findQuoteSpans(text: string): QuoteSpan[] {
  const spans: QuoteSpan[] = [];
  const quotePairs = [
    { open: '"', close: '"' },
    { open: '“', close: '”' },
    { open: '«', close: '»' },
    { open: "'", close: "'" },
  ];

  for (const pair of quotePairs) {
    let i = 0;
    while (i < text.length) {
      const startIdx = text.indexOf(pair.open, i);
      if (startIdx === -1) break;
      const endIdx = text.indexOf(pair.close, startIdx + pair.open.length);
      if (endIdx === -1) break;
      spans.push({ start: startIdx, end: endIdx + pair.close.length });
      i = endIdx + pair.close.length;
    }
  }
  return spans;
}

function isInsideSpans(index: number, spans: { start: number; end: number }[]): boolean {
  return spans.some((s) => index >= s.start && index < s.end);
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function hasVerb(str: string): boolean {
  const words = str.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  return words.some((w) => VERB_LEXICON.has(w));
}

function isSubjectStarter(word: string): boolean {
  const lower = word.toLowerCase().replace(/[^\p{L}]/gu, "");
  if (SUBJECT_STARTERS.has(lower)) return true;
  // Capitalized word
  if (/^\p{Lu}/u.test(word)) return true;
  return false;
}

export function splitStatements(rawText: string): StatementSplit[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const quoteSpans = findQuoteSpans(rawText);
  const protectedSpans: { start: number; end: number }[] = [...quoteSpans];

  // Protect URLs
  const urlRegex = /https?:\/\/[^\s]+/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(rawText)) !== null) {
    protectedSpans.push({ start: urlMatch.index, end: urlMatch.index + urlMatch[0].length });
  }

  // Protect decimals like 3.5 or 12.04
  const decimalRegex = /\b\d+\.\d+\b/g;
  let decMatch;
  while ((decMatch = decimalRegex.exec(rawText)) !== null) {
    protectedSpans.push({ start: decMatch.index, end: decMatch.index + decMatch[0].length });
  }

  // Protect initials like A. B. or J.R.
  const initialRegex = /\b[A-Z]\.(?:\s*[A-Z]\.)*/g;
  let initMatch;
  while ((initMatch = initialRegex.exec(rawText)) !== null) {
    protectedSpans.push({ start: initMatch.index, end: initMatch.index + initMatch[0].length });
  }

  // Protect times like a.m. or p.m.
  const timeRegex = /\b(?:a\.m\.|p\.m\.)/gi;
  let timeMatch;
  while ((timeMatch = timeRegex.exec(rawText)) !== null) {
    protectedSpans.push({ start: timeMatch.index, end: timeMatch.index + timeMatch[0].length });
  }

  // Protect ellipses
  const ellipsisRegex = /(?:\.{3,}|…)/g;
  let ellMatch;
  while ((ellMatch = ellipsisRegex.exec(rawText)) !== null) {
    protectedSpans.push({ start: ellMatch.index, end: ellMatch.index + ellMatch[0].length });
  }

  // Protect abbreviations
  for (const abbr of ABBREVIATIONS) {
    const escaped = abbr.replace(/\./g, "\\.");
    const abbrRegex = new RegExp(`\\b${escaped}`, "gi");
    let match;
    while ((match = abbrRegex.exec(rawText)) !== null) {
      protectedSpans.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  const splitIndices: number[] = [0];

  // 1. Line breaks and bullet points
  const lineBreakRegex = /(?:\r?\n\s*[-•*]?\s*)/g;
  let lbMatch;
  while ((lbMatch = lineBreakRegex.exec(rawText)) !== null) {
    const splitPoint = lbMatch.index + lbMatch[0].length;
    if (!isInsideSpans(lbMatch.index, quoteSpans)) {
      splitIndices.push(splitPoint);
    }
  }

  // 2. Sentence boundary: . ! ? (optionally with closing quote) followed by space and uppercase letter / digit / quote
  const sentencePunctRegex = /([.!?]["”»']?)(?:\s+)(?=[\p{Lu}\d"“«'\[])/gu;
  let sentMatch;
  while ((sentMatch = sentencePunctRegex.exec(rawText)) !== null) {
    const splitPoint = sentMatch.index + sentMatch[0].length;
    // The split point (after the whitespace) must not be inside a quote or protected span
    if (!isInsideSpans(splitPoint, quoteSpans)) {
      // Also ensure we aren't splitting inside the middle of a protected span
      const tokenStart = sentMatch.index;
      const isProtectedToken = protectedSpans.some(
        (p) => tokenStart >= p.start && tokenStart < p.end && !quoteSpans.includes(p)
      );
      if (!isProtectedToken) {
        splitIndices.push(splitPoint);
      }
    }
  }

  // 3. Semicolons followed by whitespace
  const semiRegex = /;\s+/g;
  let semiMatch;
  while ((semiMatch = semiRegex.exec(rawText)) !== null) {
    if (!isInsideSpans(semiMatch.index, quoteSpans)) {
      splitIndices.push(semiMatch.index + semiMatch[0].length);
    }
  }

  // 4. Conjunction splits: ", but ", ", while ", "however, ", ", and "
  const conjRegex = /(?:,\s+(?:but|while|and)\s+|however,\s+)/gi;
  let conjMatch;
  while ((conjMatch = conjRegex.exec(rawText)) !== null) {
    const splitPoint = conjMatch.index + conjMatch[0].length;
    if (!isInsideSpans(conjMatch.index, quoteSpans)) {
      const leftPart = rawText.slice(0, conjMatch.index);
      const rightPart = rawText.slice(splitPoint);

      const leftWordCount = countWords(leftPart);
      const rightWords = rightPart.trim().split(/\s+/);
      const rightWordCount = rightWords.length;

      if (leftWordCount >= 4 && rightWordCount >= 4) {
        const firstRightWord = rightWords[0] || "";
        if (isSubjectStarter(firstRightWord) && hasVerb(leftPart) && hasVerb(rightPart)) {
          // Check for enumeration "A, B and C":
          const isEnumeration = /,\s+and\s+[a-zA-Z0-9_-]+\s*$/i.test(rawText.slice(Math.max(0, conjMatch.index - 30), splitPoint + 15));
          if (!isEnumeration) {
            splitIndices.push(splitPoint);
          }
        }
      }
    }
  }

  splitIndices.push(rawText.length);

  // Sort and deduplicate split indices
  const uniqueIndices = Array.from(new Set(splitIndices)).sort((a, b) => a - b);

  const initialFragments: StatementSplit[] = [];
  for (let i = 0; i < uniqueIndices.length - 1; i++) {
    const start = uniqueIndices[i];
    const end = uniqueIndices[i + 1];
    const fragmentText = rawText.slice(start, end).trim();
    if (fragmentText.length > 0) {
      // Find actual trimmed start and end
      const leadingSpace = rawText.slice(start, end).search(/\S/);
      const actualStart = start + (leadingSpace >= 0 ? leadingSpace : 0);
      const actualEnd = actualStart + fragmentText.length;
      initialFragments.push({
        text: fragmentText,
        start: actualStart,
        end: actualEnd,
      });
    }
  }

  if (initialFragments.length === 0) {
    return [
      {
        text: rawText.trim(),
        start: rawText.search(/\S/),
        end: rawText.search(/\S/) + rawText.trim().length,
      },
    ];
  }

  // 5. Merge fragments under 3 words into previous statement
  const merged: StatementSplit[] = [];
  for (let i = 0; i < initialFragments.length; i++) {
    const frag = initialFragments[i];
    const words = countWords(frag.text);
    if (words < 3 && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.text = rawText.slice(prev.start, frag.end).trim();
      prev.end = frag.end;
    } else {
      merged.push({ ...frag });
    }
  }

  return merged;
}
