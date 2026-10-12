"use client";

import { useState, useRef, useMemo } from "react";
import { useReviewStore } from "@/store/review-store";
import { InvestigationSuggestion } from "@/lib/types";
import { getMatchBucket, MATCH_BUCKET_TOOLTIP, DOMAIN_HEURISTIC_TOOLTIP } from "@/lib/search/types";
import { ConfirmSuggestionDialog } from "./confirm-suggestion-dialog";
import { MOCK_DATA_BANNER_TEXT } from "@/lib/copy";
import {
  X,
  Search,
  ExternalLink,
  Check,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Loader2,
  Trash2,
} from "lucide-react";

interface SearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaimId?: string;
}

type TabType = "all" | "news" | "social" | "official" | "unknown";

export function SearchSheet({ isOpen, onClose, initialClaimId }: SearchSheetProps) {
  const claims = useReviewStore((state) => state.claims);
  const isDemo = useReviewStore((state) => state.investigation?.isDemo ?? false);
  const suggestions = useReviewStore((state) => state.suggestions);
  const searchRuns = useReviewStore((state) => state.searchRuns);
  const addSearchRun = useReviewStore((state) => state.addSearchRun);
  const confirmSuggestion = useReviewStore((state) => state.confirmSuggestion);
  const dismissSuggestion = useReviewStore((state) => state.dismissSuggestion);
  const restoreSuggestion = useReviewStore((state) => state.restoreSuggestion);
  const clearSuggestions = useReviewStore((state) => state.clearSuggestions);

  // Form setup
  const [userSelectedClaimId, setUserSelectedClaimId] = useState<string | null>(null);
  const selectedClaimId = userSelectedClaimId ?? initialClaimId ?? claims[0]?.id ?? "";
  const [includeOfficial, setIncludeOfficial] = useState(true);
  const [includeSocial, setIncludeSocial] = useState(true);
  const [enrichWayback, setEnrichWayback] = useState(false);
  const [maxQueries, setMaxQueries] = useState(8);

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<{ code: string; message: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tab & display state
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [coverageOpen, setCoverageOpen] = useState(true);
  const [dismissedOpen, setDismissedOpen] = useState(false);
  const [confirmingSuggestion, setConfirmingSuggestion] =
    useState<InvestigationSuggestion | null>(null);

  const activeClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];
  const latestRun = searchRuns[searchRuns.length - 1];

  const activeSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === "suggested"),
    [suggestions]
  );
  const dismissedSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === "dismissed"),
    [suggestions]
  );

  const filteredSuggestions = useMemo(() => {
    if (activeTab === "all") return activeSuggestions;
    if (activeTab === "news")
      return activeSuggestions.filter((s) => s.data.sourceType === "news_report");
    if (activeTab === "social")
      return activeSuggestions.filter((s) => s.data.sourceType === "social_post");
    if (activeTab === "official")
      return activeSuggestions.filter((s) => s.data.sourceType === "official_record");
    return activeSuggestions.filter((s) => s.data.sourceType === "unknown");
  }, [activeSuggestions, activeTab]);

  const handleRunSearch = async () => {
    if (!activeClaim) return;
    setIsLoading(true);
    setSearchError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: activeClaim.text,
          max_queries: maxQueries,
          include_official: includeOfficial,
          include_social: includeSocial,
          enrich_wayback: enrichWayback,
          demo: isDemo,
          provider: isDemo ? "mock" : "duckduckgo",
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        setSearchError(
          data.error || {
            code: "SEARCH_FAILED",
            message: "Unable to retrieve search results.",
          }
        );
      } else {
        addSearchRun(data, activeClaim.id);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled
      } else {
        setSearchError({
          code: "NETWORK_ERROR",
          message: "Could not reach the search service. Please check your connection.",
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Find related sources from search"
        className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity"
      >
        <div className="flex h-full w-full flex-col bg-white shadow-2xl dark:bg-slate-900 md:max-w-2xl lg:max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Find Related Sources
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Retrieve web records across news, social feeds, and official notices
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {suggestions.length > 0 && (
                <button
                  onClick={clearSuggestions}
                  title="Clear all search suggestions"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close search panel"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 sm:p-6">
            {/* Mock Data Banner */}
            {latestRun?.mock && (
              <div
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-center text-xs font-bold uppercase tracking-wider text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
              >
                {MOCK_DATA_BANNER_TEXT}
              </div>
            )}

            {/* Setup Form */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="space-y-3.5">
                {/* Statement Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Statement to Investigate:
                  </label>
                  <select
                    value={selectedClaimId}
                    onChange={(e) => setUserSelectedClaimId(e.target.value)}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {claims.map((claim, idx) => (
                      <option key={claim.id} value={claim.id}>
                        #{idx + 1}: {claim.text}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={includeOfficial}
                      onChange={(e) => setIncludeOfficial(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Official sites
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={includeSocial}
                      onChange={(e) => setIncludeSocial(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Social feeds
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={enrichWayback}
                      onChange={(e) => setEnrichWayback(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Archive dates (slower)
                    </span>
                  </label>
                </div>

                {/* Query Count Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Max Queries: <strong>{maxQueries}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Each query is one call to the search provider and may cost credits
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    value={maxQueries}
                    onChange={(e) => setMaxQueries(Number(e.target.value))}
                    disabled={isLoading}
                    className="mt-1.5 w-full accent-teal-600"
                  />
                </div>

                {/* Consent Line & Action */}
                <div className="border-t border-slate-200/80 pt-3 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    The claim text is sent to the search provider. Don&apos;t submit private or sensitive content.
                  </p>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={handleCancelSearch}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Cancel Search</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRunSearch}
                        disabled={!activeClaim}
                        className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-800 active:scale-95 disabled:opacity-50 dark:bg-teal-600"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>Run Search</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {searchError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div className="flex-1">
                  <p className="font-bold">Search error: {searchError.code}</p>
                  <p className="mt-0.5 leading-relaxed">{searchError.message}</p>
                  <button
                    onClick={handleRunSearch}
                    className="mt-2 text-[11px] font-semibold underline hover:text-rose-950"
                  >
                    Retry search
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div
                aria-live="polite"
                className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
              >
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
                <h3 className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Retrieving candidate sources...
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Generating targeted queries, classifying domain authorities, and deduplicating records.
                </p>
              </div>
            )}

            {/* Coverage Panel (Collapsible) */}
            {latestRun && !isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setCoverageOpen(!coverageOpen)}
                  className="flex w-full items-center justify-between p-3.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Search Coverage & Provider Metrics</span>
                  </div>
                  {coverageOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {coverageOpen && (
                  <div className="border-t border-slate-100 p-3.5 text-[11px] dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <span className="text-slate-500">Provider:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {latestRun.provider.toUpperCase()} {latestRun.mock ? "(MOCK)" : ""}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Queries run / failed:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {latestRun.coverage.queriesRun} / {latestRun.coverage.queriesFailed}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Unique links:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {latestRun.coverage.uniqueUrls}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Dated / Undated:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {latestRun.coverage.dated} / {latestRun.coverage.undated}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2.5 italic text-slate-500 dark:text-slate-400">
                      {latestRun.coverage.note}
                    </p>

                    {/* Failed query notice */}
                    {latestRun.queries.some((q) => q.error) && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        <span className="font-semibold">Some queries could not complete:</span>
                        <ul className="mt-1 list-inside list-disc space-y-0.5">
                          {latestRun.queries
                            .filter((q) => q.error)
                            .map((q, idx) => (
                              <li key={idx}>
                                &quot;{q.query}&quot;: {q.error}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Results Filter Tabs */}
            {activeSuggestions.length > 0 && !isLoading && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                {(["all", "news", "social", "official", "unknown"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                      activeTab === tab
                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions Stream */}
            {!isLoading && (
              <div className="space-y-3">
                {activeSuggestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {searchRuns.length === 0
                      ? "Select a statement above and click 'Run Search' to find candidate sources across the web."
                      : "No results. Try a shorter claim or different terms. This does not mean nothing exists."}
                  </div>
                ) : filteredSuggestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    No results matching the &quot;{activeTab}&quot; filter tab.
                  </div>
                ) : (
                  filteredSuggestions.map((suggestion) => {
                    const bucket = getMatchBucket(suggestion.data.matchStrength);
                    const isMockSuggestion =
                      suggestion.data.title.startsWith("[MOCK]") ||
                      searchRuns.find((r) => r.id === suggestion.runId)?.mock;
                    const canConfirm = isDemo || !isMockSuggestion;

                    return (
                      <div
                        key={suggestion.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Type badge */}
                            <span
                              title={DOMAIN_HEURISTIC_TOOLTIP}
                              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-help"
                            >
                              {suggestion.data.sourceType.replace(/_/g, " ")} • guessed
                            </span>

                            {/* Match Strength Bucket */}
                            <span
                              title={MATCH_BUCKET_TOOLTIP}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase cursor-help ${
                                bucket === "high"
                                  ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                  : bucket === "medium"
                                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              Relevance: {bucket}
                            </span>

                            {/* Query hits chip */}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Matches {suggestion.data.matchedQueries.length} query(s)
                            </span>
                          </div>

                          {/* Date badge */}
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {suggestion.data.publishedAt || "Date unknown"}
                          </span>
                        </div>

                        {/* Title & Publisher */}
                        <div className="mt-2.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {suggestion.data.title}
                          </h3>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Publisher: {suggestion.data.publisher}
                          </span>
                        </div>

                        {/* Excerpt snippet */}
                        {suggestion.data.excerpt && (
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {suggestion.data.excerpt}
                          </p>
                        )}

                        {/* Date Note / Archive Capture Note */}
                        {suggestion.data.dateNote && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {suggestion.data.dateNote}
                          </p>
                        )}
                        {suggestion.data.firstArchivedAt && (
                          <p className="mt-0.5 text-[10px] text-sky-600 dark:text-sky-400">
                            Archive capture: {suggestion.data.firstArchivedAt} (not the publication date)
                          </p>
                        )}

                        {/* Actions Toolbar */}
                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <a
                            href={suggestion.data.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline hover:text-teal-800 dark:text-teal-400"
                          >
                            <span>Open link</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => dismissSuggestion(suggestion.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              Dismiss
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmingSuggestion(suggestion)}
                              disabled={!canConfirm}
                              title={
                                !canConfirm
                                  ? "Mock data cannot be added to a real investigation."
                                  : "Review and confirm this source record"
                              }
                              className="flex items-center gap-1 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 disabled:opacity-40 dark:bg-teal-600"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Confirm…</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Collapsed Dismissed Items Section */}
            {dismissedSuggestions.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => setDismissedOpen(!dismissedOpen)}
                  className="flex w-full items-center justify-between p-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  <span>Dismissed Suggestions ({dismissedSuggestions.length})</span>
                  {dismissedOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {dismissedOpen && (
                  <div className="divide-y divide-slate-200/80 border-t border-slate-200/80 p-3 space-y-2 dark:divide-slate-800 dark:border-slate-800">
                    {dismissedSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between pt-2 text-xs"
                      >
                        <div className="truncate pr-4">
                          <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
                            {s.data.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {s.data.publisher}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => restoreSuggestion(s.id)}
                          className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Suggestion Modal */}
      {confirmingSuggestion && (
        <ConfirmSuggestionDialog
          suggestion={confirmingSuggestion}
          claims={claims}
          initialClaimId={selectedClaimId}
          isOpen={true}
          onClose={() => setConfirmingSuggestion(null)}
          onConfirm={(id, payload) => {
            confirmSuggestion(id, payload);
          }}
        />
      )}
    </>
  );
}
