import { z } from "zod";

export const SearchQueryInfoSchema = z.object({
  query: z.string(),
  purpose: z.string(),
  group: z.enum(["claim", "evidence", "social"]),
  kind: z.enum(["web", "news"]),
  results: z.number().int().nonnegative(),
  error: z.string().nullable(),
});

export type SearchQueryInfo = z.infer<typeof SearchQueryInfoSchema>;

export const SearchSuggestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  sourceType: z.enum(["official_record", "social_post", "news_report", "unknown"]),
  url: z.string().url(),
  publishedAt: z.string().nullable(),
  datePrecision: z.enum(["day", "month", "year", "unknown"]),
  dateNote: z.string(),
  excerpt: z.string(),
  isPrimaryMarkedByReviewer: z.literal(false),
  origin: z.literal("machine_suggested"),
  classificationMethod: z.literal("domain_heuristic"),
  suggestedLinkType: z.literal("not_established"),
  matchStrength: z.number(),
  matchedQueries: z.array(z.string()),
  firstArchivedAt: z.string().nullable().optional(),
});

export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;

export const SearchCoverageSchema = z.object({
  queriesRun: z.number().int().nonnegative(),
  queriesFailed: z.number().int().nonnegative(),
  uniqueUrls: z.number().int().nonnegative(),
  bySourceType: z.record(z.string(), z.number()),
  dated: z.number().int().nonnegative(),
  undated: z.number().int().nonnegative(),
  wayback: z.object({
    requested: z.boolean(),
    missing: z.number().int().nonnegative(),
  }),
  note: z.string(),
});

export type SearchCoverage = z.infer<typeof SearchCoverageSchema>;

export const SearchResponseSchema = z.object({
  claim: z.string(),
  provider: z.enum(["mock", "brave", "serper", "duckduckgo"]),
  mock: z.boolean(),
  queries: z.array(SearchQueryInfoSchema),
  suggestions: z.array(SearchSuggestionSchema),
  coverage: SearchCoverageSchema,
  disclaimer: z.string(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const SearchRequestInputSchema = z.object({
  claim: z.string().min(10).max(2000),
  provider: z.enum(["mock", "brave", "serper", "duckduckgo"]).optional(),
  max_queries: z.number().int().min(1).max(16).default(8),
  results_per_query: z.number().int().min(1).max(20).default(10),
  include_official: z.boolean().default(true),
  include_social: z.boolean().default(true),
  official_domains: z.array(z.string()).optional(),
  enrich_wayback: z.boolean().default(false),
  demo: z.boolean().optional(),
});

export type SearchRequestInput = z.infer<typeof SearchRequestInputSchema>;

export type MatchBucket = "high" | "medium" | "low";

export function getMatchBucket(strength: number): MatchBucket {
  if (strength >= 0.5) return "high";
  if (strength >= 0.3) return "medium";
  return "low";
}

export const MATCH_BUCKET_TOOLTIP =
  "How closely the result's text matches your claim's key terms. This is not a measure of accuracy.";

export const DOMAIN_HEURISTIC_TOOLTIP =
  "Type guessed from the domain. Review.";
