"use client";

import { useState } from "react";
import { useReviewStore } from "@/store/review-store";
import { computeGaps } from "@/lib/derive/gaps";
import { Gap } from "@/lib/types";
import { AlertCircle, CheckCircle, ArrowRight, XCircle } from "lucide-react";

interface GapsPanelProps {
  claimId?: string;
}

export function GapsPanel({ claimId }: GapsPanelProps) {
  const store = useReviewStore();
  const dismissGap = useReviewStore((state) => state.dismissGap);

  const [dismissingGapId, setDismissingGapId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const allGaps = computeGaps(store);
  const visibleGaps = claimId ? allGaps.filter((g) => g.claimId === claimId) : allGaps;

  const handleConfirmDismiss = (gap: Gap) => {
    if (!dismissReason.trim()) return;
    dismissGap(gap.claimId, gap.ruleId, gap.sourceId, dismissReason.trim());
    setDismissingGapId(null);
    setDismissReason("");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Open Evidence Gaps & Review Items ({visibleGaps.length})
          </h4>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          These are workflow indicators, not evidence that a claim is wrong.
        </p>
      </div>

      {visibleGaps.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          No open workflow gaps for this scope.
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleGaps.map((gap) => (
            <div
              key={gap.id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    {gap.ruleId}
                  </span>
                  {gap.kind === "heuristic_suggestion" && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      suggested (unconfirmed)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setDismissingGapId(gap.id)}
                  className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Dismiss with reviewer rationale"
                >
                  Dismiss
                </button>
              </div>

              <p className="mt-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                {gap.message}
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-teal-800 dark:text-teal-300">
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span>Next step: {gap.nextStep}</span>
              </div>

              {/* Dismiss Rationale Input */}
              {dismissingGapId === gap.id && (
                <div className="mt-2.5 rounded border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                  <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    Reviewer Rationale for Dismissal:
                  </label>
                  <input
                    type="text"
                    value={dismissReason}
                    onChange={(e) => setDismissReason(e.target.value)}
                    placeholder="e.g. Verified through archived court transcript..."
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <div className="mt-2 flex justify-end gap-1.5">
                    <button
                      onClick={() => setDismissingGapId(null)}
                      className="rounded px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmDismiss(gap)}
                      disabled={!dismissReason.trim()}
                      className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-medium text-white disabled:opacity-40"
                    >
                      Save Dismissal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
