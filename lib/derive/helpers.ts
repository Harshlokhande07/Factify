import { ClaimLinkType, PartialISODate, DatePrecision } from "../types";

export function isLinkRelevant(linkType: ClaimLinkType): boolean {
  return (
    linkType === "supports" ||
    linkType === "contradicts" ||
    linkType === "contextualizes" ||
    linkType === "repeats"
  );
}

export interface DateRange {
  startMs: number;
  endMs: number;
}

export function parseDateToInterval(
  dateStr: PartialISODate | null,
  precision: DatePrecision
): DateRange | null {
  if (!dateStr || precision === "unknown") return null;

  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length === 0 || isNaN(parts[0])) return null;

  const year = parts[0];
  if (parts.length === 1 || precision === "year") {
    // Jan 1 to Dec 31
    const startMs = Date.UTC(year, 0, 1, 0, 0, 0);
    const endMs = Date.UTC(year, 11, 31, 23, 59, 59, 999);
    return { startMs, endMs };
  }

  const month = parts[1] - 1; // 0-indexed
  if (parts.length === 2 || precision === "month") {
    const startMs = Date.UTC(year, month, 1, 0, 0, 0);
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const endMs = Date.UTC(year, month, lastDay, 23, 59, 59, 999);
    return { startMs, endMs };
  }

  const day = parts[2];
  const startMs = Date.UTC(year, month, day, 0, 0, 0);
  const endMs = Date.UTC(year, month, day, 23, 59, 59, 999);
  return { startMs, endMs };
}
