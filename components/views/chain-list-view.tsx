"use client";

import { useMemo } from "react";
import { useReviewStore } from "@/store/review-store";
import { FilterState, ClaimSourceLink, Source } from "@/lib/types";
import { computeIndependence } from "@/lib/derive/independence";
import { computeEarliest } from "@/lib/derive/earliest";
import { CLAIM_LINK_TYPE_LABELS, SOURCE_REL_TYPE_LABELS, VERIFICATION_LABELS } from "@/lib/copy";
import {
  ArrowRight,
} from "lucide-react";

interface ChainListViewProps {
  filters: FilterState;
  onSelectClaim: (claimId: string) => void;
  onSelectSource: (sourceId: string) => void;
}

export function ChainListView({
  filters,
  onSelectClaim,
  onSelectSource,
}: ChainListViewProps) {
  const store = useReviewStore();
  const sourceMap = useMemo(
    () => new Map<string, Source>(store.sources.map((s) => [s.id, s])),
    [store.sources]
  );

  const filteredClaims = useMemo(() => {
    return store.claims.filter((c) => {
      if (filters.claimId && c.id !== filters.claimId) return false;
      if (filters.reviewStatus && c.status !== filters.reviewStatus) return false;
      return true;
    });
  }, [store.claims, filters]);

  return (
    <div className="space-y-6">
      {filteredClaims.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
          No statements match the active filters.
        </div>
      ) : (
        filteredClaims.map((claim) => {
          const independence = computeIndependence(store, claim.id);
          const earliest = computeEarliest(store, claim.id);

          const linkedItems = store.claimSourceLinks
            .filter((l) => l.claimId === claim.id)
            .map((link) => ({ link, source: sourceMap.get(link.sourceId) }))
            .filter((item): item is { link: ClaimSourceLink; source: Source } => Boolean(item.source));

          return (
            <div
              key={claim.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Claim Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
                      {claim.order + 1}
                    </span>
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="text-left text-sm font-semibold text-slate-900 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400"
                    >
                      {claim.text}
                    </button>
                  </div>
                  {claim.notes && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Note: {claim.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Status: {claim.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Independence & Earliest Summaries */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-950/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Independence Result:
                  </span>
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {independence.description}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-950/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Earliest Traceable Record:
                  </span>
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {earliest.type === "earliest_among_dated"
                      ? `${earliest.source.title} (${earliest.source.publishedAt || "undated"}) — ${
                          earliest.isProvisional ? "Provisional (undated records exist)" : "Dated"
                        }`
                      : earliest.message}
                  </p>
                </div>
              </div>

              {/* Linked Sources Chain */}
              <div className="mt-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Linked Evidence & Provenance Chains ({linkedItems.length})
                </h5>

                {linkedItems.length === 0 ? (
                  <p className="mt-2 text-xs italic text-slate-400">
                    No source records linked to this statement yet.
                  </p>
                ) : (
                  <div className="mt-2.5 space-y-2.5">
                    {linkedItems.map(({ link, source }) => {
                      const linkTypeMeta = CLAIM_LINK_TYPE_LABELS[link.type];

                      // Upstream relationships from this source
                      const upstreamRels = store.sourceRelationships.filter(
                        (r) => r.fromSourceId === source.id
                      );

                      return (
                        <div
                          key={link.id}
                          className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onSelectSource(source.id)}
                                className="font-semibold text-slate-900 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400"
                              >
                                {source.title}
                              </button>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  link.type === "supports"
                                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
                                    : link.type === "contradicts"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                                    : link.type === "repeats"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {linkTypeMeta?.label || link.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>
                                {source.publishedAt ? `${source.publishedAt}` : "Date unknown"}
                              </span>
                              {source.publisher && <span>• {source.publisher}</span>}
                            </div>
                          </div>

                          {source.excerpt && (
                            <blockquote className="mt-1.5 border-l-2 border-slate-300 pl-2 text-[11px] italic text-slate-600 dark:border-slate-700 dark:text-slate-300">
                              &quot;{source.excerpt}&quot;
                            </blockquote>
                          )}

                          {/* Nested upstream citations/relationships */}
                          {upstreamRels.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 pl-3 dark:border-slate-800">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Upstream Chain References:
                              </span>
                              {upstreamRels.map((rel) => {
                                const upstreamSource = sourceMap.get(rel.toSourceId);
                                const relMeta = SOURCE_REL_TYPE_LABELS[rel.type];
                                return (
                                  <div
                                    key={rel.id}
                                    className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400"
                                  >
                                    <ArrowRight className="h-3 w-3 text-sky-600 shrink-0" />
                                    <span className="font-medium text-sky-800 dark:text-sky-300">
                                      {relMeta?.label || rel.type} ({VERIFICATION_LABELS[rel.verification]}):
                                    </span>
                                    <button
                                      onClick={() => onSelectSource(rel.toSourceId)}
                                      className="font-semibold text-slate-800 hover:underline dark:text-slate-200"
                                    >
                                      {upstreamSource?.title || "Upstream Record"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
