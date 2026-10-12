"use client";

import { useState } from "react";
import { useReviewStore } from "@/store/review-store";
import { compareWording, computeWordDiff } from "@/lib/derive/wording";
import { Source } from "@/lib/types";
import { ArrowRight, Check, X, Eye } from "lucide-react";

interface WordingPanelProps {
  sourceA: Source;
  sourceB: Source;
}

export function WordingPanel({ sourceA, sourceB }: WordingPanelProps) {
  const wordingReviews = useReviewStore((state) => state.wordingReviews);
  const updateWordingReview = useReviewStore((state) => state.updateWordingReview);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const observations = compareWording(sourceA.excerpt, sourceB.excerpt, wordingReviews);
  const { added, removed } = computeWordDiff(sourceA.excerpt, sourceB.excerpt);

  const datesAreOrdered =
    sourceA.publishedAt &&
    sourceB.publishedAt &&
    sourceA.publishedAt !== sourceB.publishedAt;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
          Wording Shift Comparison
        </h4>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          Transparent word-level comparison between related records.
          {datesAreOrdered && (
            <span className="ml-1 text-slate-600 dark:text-slate-300">
              (Order of dates alone does not show copying.)
            </span>
          )}
        </p>
      </div>

      {/* Side-by-Side Excerpt Display */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
            <span>Wording A: {sourceA.title}</span>
            <span className="text-[10px] text-slate-500">{sourceA.publishedAt || "undated"}</span>
          </div>
          <p className="mt-2 text-xs italic leading-relaxed text-slate-800 dark:text-slate-200">
            &quot;{sourceA.excerpt}&quot;
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
            <span>Wording B: {sourceB.title}</span>
            <span className="text-[10px] text-slate-500">{sourceB.publishedAt || "undated"}</span>
          </div>
          <p className="mt-2 text-xs italic leading-relaxed text-slate-800 dark:text-slate-200">
            &quot;{sourceB.excerpt}&quot;
          </p>
        </div>
      </div>

      {/* Detected Observations */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Detected Wording Shifts ({observations.length})
        </span>

        {observations.length === 0 ? (
          <p className="italic text-slate-400">No major lexical or framing shifts detected.</p>
        ) : (
          <div className="space-y-2">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-100 px-1.5 py-0.2 font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {obs.kind.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                        obs.reviewState === "confirmed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : obs.reviewState === "dismissed"
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {obs.reviewState === "unconfirmed"
                        ? "suggested (unconfirmed)"
                        : `Reviewer: ${obs.reviewState}`}
                    </span>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      onClick={() => updateWordingReview(obs.id, "confirmed", obs.note)}
                      className="rounded px-2 py-0.5 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateWordingReview(obs.id, "dismissed", obs.note)}
                      className="rounded px-2 py-0.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {obs.explanation}
                </p>

                <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  This change may warrant review.
                </p>

                {obs.note && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Reviewer Note: {obs.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
