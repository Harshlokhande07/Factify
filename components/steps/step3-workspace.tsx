"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useReviewStore } from "@/store/review-store";
import { FilterState, SourceType, ClaimLinkType, ReviewStatus } from "@/lib/types";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { ChainListView } from "@/components/views/chain-list-view";
import { TimelineView } from "@/components/views/timeline-view";
import { DetailPanel } from "@/components/panels/detail-panel";
import { GapsPanel } from "@/components/panels/gaps-panel";
import { AddSourceDialog } from "@/components/dialogs/add-source-dialog";
import { AddLinkDialog } from "@/components/dialogs/add-link-dialog";
import { AddRelDialog } from "@/components/dialogs/add-rel-dialog";
import { SearchSheet } from "@/components/search/search-sheet";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { SOURCE_TYPE_LABELS, CLAIM_LINK_TYPE_LABELS } from "@/lib/copy";
import {
  Network,
  ListTree,
  Calendar,
  Plus,
  Filter,
  FileText,
  AlertCircle,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  Search,
} from "lucide-react";

export function Step3Workspace() {
  const claims = useReviewStore((state) => state.claims);
  const sources = useReviewStore((state) => state.sources);
  const claimSourceLinks = useReviewStore((state) => state.claimSourceLinks);

  // View state: 'graph' | 'chain' | 'timeline' | 'gaps' (mobile defaults to chain list)
  const [activeView, setActiveView] = useState<"graph" | "chain" | "timeline" | "gaps">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "chain";
    }
    return "graph";
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Selection state
  const [selectedItem, setSelectedItem] = useState<{
    type: "claim" | "source" | "claim_source" | "source_relationship";
    id: string;
  } | null>(claims.length > 0 ? { type: "claim", id: claims[0].id } : null);

  // Dialog states
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [addLinkClaimId, setAddLinkClaimId] = useState<string | null>(null);
  const [addRelSourceId, setAddRelSourceId] = useState<string | null>(null);

  // Search state
  const suggestions = useReviewStore((state) => state.suggestions);
  const unconfirmedSuggestionsCount = suggestions.filter((s) => s.status === "suggested").length;
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [searchInitialClaimId, setSearchInitialClaimId] = useState<string | undefined>(undefined);
  const [isSearchAvailable, setIsSearchAvailable] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/search/health")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setIsSearchAvailable(Boolean(data?.available));
      })
      .catch(() => {
        if (mounted) setIsSearchAvailable(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Full Page Graph View state
  const [isGraphFullScreen, setIsGraphFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsGraphFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const hiddenCount = useMemo(() => {
    if (activeFiltersCount === 0) return 0;
    let matchedSources = sources;
    let matchedClaims = claims;
    if (filters.claimId) {
      matchedClaims = matchedClaims.filter((c) => c.id === filters.claimId);
      const linkedSourceIds = new Set(
        claimSourceLinks
          .filter((l) => l.claimId === filters.claimId)
          .map((l) => l.sourceId)
      );
      matchedSources = matchedSources.filter((s) => linkedSourceIds.has(s.id));
    }
    if (filters.sourceType) {
      matchedSources = matchedSources.filter((s) => s.sourceType === filters.sourceType);
    }
    if (filters.reviewStatus) {
      matchedClaims = matchedClaims.filter((c) => c.status === filters.reviewStatus);
    }
    if (filters.claimLinkType) {
      const linkSourceIds = new Set(
        claimSourceLinks
          .filter((l) => l.type === filters.claimLinkType)
          .map((l) => l.sourceId)
      );
      matchedSources = matchedSources.filter((s) => linkSourceIds.has(s.id));
    }
    const hiddenSources = Math.max(0, sources.length - matchedSources.length);
    const hiddenClaims = Math.max(0, claims.length - matchedClaims.length);
    return hiddenSources + hiddenClaims;
  }, [claims, sources, claimSourceLinks, filters, activeFiltersCount]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Shared Disclaimer */}
      <div className="mb-4">
        <DisclaimerBanner />
      </div>

      {/* Top Workspace Toolbar (macOS Glass Style) */}
      <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl p-3.5 shadow-xl transition dark:border-white/10 sm:p-4">
        {/* macOS Traffic Lights + View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 pl-1 pr-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-2xs" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-2xs" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-2xs" />
          </div>

          <div className="flex items-center gap-1 rounded-full bg-slate-100/90 p-1 backdrop-blur-md dark:bg-slate-800/90">
            <button
              onClick={() => setActiveView("graph")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeView === "graph"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Graph View</span>
            </button>

            <button
              onClick={() => setActiveView("chain")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeView === "chain"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              <span>Chain List</span>
            </button>

            <button
              onClick={() => setActiveView("timeline")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeView === "timeline"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveView("gaps")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeView === "gaps"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Open review items</span>
            </button>
          </div>
        </div>

        {/* Global Toolbar Action Buttons (Pill Capsule Style) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`glass-pill flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition hover:bg-white dark:hover:bg-slate-800 ${
              activeFiltersCount > 0
                ? "border-teal-500 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                : "text-slate-700 dark:text-slate-300"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-slate-900 px-1.5 py-0.2 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Hidden by Filters Chip */}
          {hiddenCount > 0 && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/70 dark:text-amber-300"
            >
              <span>{hiddenCount} hidden by filters</span>
              <button
                onClick={() => setFilters({})}
                className="ml-1 text-[11px] underline hover:text-amber-950 dark:hover:text-amber-100"
                title="Clear filters"
              >
                Clear
              </button>
            </span>
          )}

          {/* Full Page Graph Button */}
          {activeView === "graph" && (
            <button
              onClick={() => setIsGraphFullScreen(true)}
              className="glass-pill flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
              title="Expand Graph View to Full Page"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Page ⤢</span>
            </button>
          )}

          {/* Find Related Sources Button */}
          <button
            onClick={() => {
              setSearchInitialClaimId(undefined);
              setIsSearchSheetOpen(true);
            }}
            disabled={!isSearchAvailable}
            title={
              !isSearchAvailable
                ? "Search backend not running. See README."
                : "Find machine-suggested web sources for claims"
            }
            className={`glass-pill flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              !isSearchAvailable
                ? "cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-500"
                : "text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Search className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Find related sources</span>
            {unconfirmedSuggestionsCount > 0 && (
              <span className="rounded-full bg-teal-600 px-1.5 py-0.2 text-[10px] font-bold text-white dark:bg-teal-500">
                {unconfirmedSuggestionsCount} suggested
              </span>
            )}
          </button>

          {/* Add Source Record Button */}
          <button
            onClick={() => setIsAddSourceOpen(true)}
            className="glass-pill flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Source</span>
          </button>

          {/* Add Relationship Button */}
          <button
            onClick={() => setAddRelSourceId(sources[0]?.id || null)}
            disabled={sources.length < 2}
            className="glass-pill flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Add Relation</span>
          </button>

          {/* Generate Report Button (Black Pill with Arrow ↗) */}
          <Link
            href="/report"
            className="flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition hover:scale-[1.02] hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Report ↗</span>
          </Link>
        </div>
      </div>

      {/* Filter Options Bar */}
      {showFilterDrawer && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Filter Investigation Records
            </span>
            <button
              onClick={() => setFilters({})}
              className="text-[11px] text-teal-700 hover:underline dark:text-teal-400"
            >
              Clear All Filters
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Filter by Statement:
              </label>
              <select
                value={filters.claimId || ""}
                onChange={(e) =>
                  setFilters({ ...filters, claimId: e.target.value || undefined })
                }
                className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Statements</option>
                {claims.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    #{i + 1}: {c.text.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Filter by Source Type:
              </label>
              <select
                value={filters.sourceType || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sourceType: (e.target.value as SourceType) || undefined,
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Types</option>
                {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Filter by Link Type:
              </label>
              <select
                value={filters.claimLinkType || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    claimLinkType: (e.target.value as ClaimLinkType) || undefined,
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Link Types</option>
                {Object.entries(CLAIM_LINK_TYPE_LABELS).map(([k, meta]) => (
                  <option key={k} value={k}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Filter by Human Status:
              </label>
              <select
                value={filters.reviewStatus || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    reviewStatus: (e.target.value as ReviewStatus) || undefined,
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Statuses</option>
                <option value="not_checked">Not checked</option>
                <option value="evidence_found">Evidence found</option>
                <option value="needs_verification">Needs more verification</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Graph or View Stream) */}
        <div className="lg:col-span-8">
          {activeView === "graph" && (
            <GraphCanvas
              filters={filters}
              selectedId={selectedItem?.id || null}
              onSelect={(item) => setSelectedItem(item)}
              isFullScreen={false}
              onToggleFullScreen={() => setIsGraphFullScreen(true)}
              onSwitchToList={() => setActiveView("chain")}
            />
          )}

          {activeView === "chain" && (
            <ChainListView
              filters={filters}
              onSelectClaim={(id) => setSelectedItem({ type: "claim", id })}
              onSelectSource={(id) => setSelectedItem({ type: "source", id })}
            />
          )}

          {activeView === "timeline" && (
            <TimelineView
              onSelectSource={(id) => setSelectedItem({ type: "source", id })}
            />
          )}

          {activeView === "gaps" && <GapsPanel />}
        </div>

        {/* Right Column (Detail & Inspection Panel in Glass Window for Desktop >=1024px) */}
        <div className="hidden lg:col-span-4 lg:block">
          <div className="glass-panel overflow-hidden rounded-3xl shadow-xl dark:border-white/10">
            <DetailPanel
              selectedItem={selectedItem}
              onClose={() => setSelectedItem(null)}
              onOpenAddLinkDialog={(claimId) => setAddLinkClaimId(claimId)}
              onOpenAddRelDialog={(sourceId) => setAddRelSourceId(sourceId)}
              onOpenSearch={(claimId) => {
                setSearchInitialClaimId(claimId);
                setIsSearchSheetOpen(true);
              }}
              isSearchAvailable={isSearchAvailable}
            />
          </div>
        </div>
      </div>

      {/* Bottom Sheet for Mobile & Tablet (<1024px) when item is selected */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-xs lg:hidden">
          <div className="glass-panel max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/60 p-4 shadow-2xl dark:border-white/10 sm:p-5">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            <DetailPanel
              selectedItem={selectedItem}
              onClose={() => setSelectedItem(null)}
              onOpenAddLinkDialog={(claimId) => setAddLinkClaimId(claimId)}
              onOpenAddRelDialog={(sourceId) => setAddRelSourceId(sourceId)}
              onOpenSearch={(claimId) => {
                setSearchInitialClaimId(claimId);
                setIsSearchSheetOpen(true);
              }}
              isSearchAvailable={isSearchAvailable}
            />
          </div>
        </div>
      )}

      {/* Floating Bottom Provenance Bar (matching reference image) */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/40 p-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link
            href="/report"
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-xs transition hover:bg-slate-50 dark:bg-slate-800 dark:text-white"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>View Full Report</span>
          </Link>

          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Invariants:
          </span>

          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800/70 dark:text-slate-300">
            No Automated Truth Verdicts
          </span>

          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800/70 dark:text-slate-300">
            Conservative Independence
          </span>

          <span className="hidden sm:inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800/70 dark:text-slate-300">
            100% In-Browser Memory
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Engine Active</span>
        </div>
      </div>

      {/* Full Page Graph View Overlay */}
      {isGraphFullScreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100/95 p-3 backdrop-blur-md dark:bg-slate-950/95 sm:p-4">
          {/* Full Page Header Bar */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Full Page Claim–Evidence Graph
              </span>
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                Full Page Mode
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddSourceOpen(true)}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Source</span>
              </button>

              <button
                onClick={() => setAddRelSourceId(sources[0]?.id || null)}
                disabled={sources.length < 2}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Add Relation</span>
              </button>

              <button
                onClick={() => setIsGraphFullScreen(false)}
                className="flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 dark:bg-teal-600"
                title="Exit full page graph (or press Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Full Page (Esc)</span>
              </button>
            </div>
          </div>

          {/* Full Page Body with Canvas and Slide-over Inspector */}
          <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
            <GraphCanvas
              filters={filters}
              selectedId={selectedItem?.id || null}
              onSelect={(item) => setSelectedItem(item)}
              isFullScreen={true}
              onToggleFullScreen={() => setIsGraphFullScreen(false)}
            />

            {/* Slide-over Inspector Drawer if item selected */}
            {selectedItem && (
              <div className="absolute right-3 top-3 bottom-3 z-30 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white/98 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/98 sm:w-96">
                <DetailPanel
                  selectedItem={selectedItem}
                  onClose={() => setSelectedItem(null)}
                  onOpenAddLinkDialog={(claimId) => setAddLinkClaimId(claimId)}
                  onOpenAddRelDialog={(sourceId) => setAddRelSourceId(sourceId)}
                  onOpenSearch={(claimId) => {
                    setSearchInitialClaimId(claimId);
                    setIsSearchSheetOpen(true);
                  }}
                  isSearchAvailable={isSearchAvailable}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Sheet */}
      <SearchSheet
        isOpen={isSearchSheetOpen}
        onClose={() => setIsSearchSheetOpen(false)}
        initialClaimId={searchInitialClaimId}
      />

      {/* Dialog Modals */}
      <AddSourceDialog
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
      />

      <AddLinkDialog
        claimId={addLinkClaimId}
        isOpen={Boolean(addLinkClaimId)}
        onClose={() => setAddLinkClaimId(null)}
      />

      <AddRelDialog
        sourceId={addRelSourceId}
        isOpen={Boolean(addRelSourceId)}
        onClose={() => setAddRelSourceId(null)}
      />
    </div>
  );
}
