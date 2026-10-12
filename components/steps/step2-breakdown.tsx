"use client";

import { useState, useMemo } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  GitFork,
  Merge,
  HelpCircle,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import { useReviewStore } from "@/store/review-store";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { detectFeatures } from "@/lib/analysis/highlights";
import { isMostlyNonLatin } from "@/lib/analysis/splitter";
import { NON_LATIN_NOTICE } from "@/lib/copy";

interface Step2Props {
  onProceed: () => void;
  onBack: () => void;
}

export function Step2Breakdown({ onProceed, onBack }: Step2Props) {
  const originalText = useReviewStore((state) => state.investigation?.originalText || "");
  const claims = useReviewStore((state) => state.claims);
  const editClaimText = useReviewStore((state) => state.editClaimText);
  const splitClaim = useReviewStore((state) => state.splitClaim);
  const mergeClaims = useReviewStore((state) => state.mergeClaims);
  const deleteClaim = useReviewStore((state) => state.deleteClaim);
  const reorderClaims = useReviewStore((state) => state.reorderClaims);
  const addClaim = useReviewStore((state) => state.addClaim);
  const updateClaimQuestion = useReviewStore((state) => state.updateClaimQuestion);
  const refreshClaimQuestions = useReviewStore((state) => state.refreshClaimQuestions);

  const [newClaimInput, setNewClaimInput] = useState("");
  const [splitClaimId, setSplitClaimId] = useState<string | null>(null);
  const [splitIndex, setSplitIndex] = useState<number>(0);
  const [deleteConfirmClaimId, setDeleteConfirmClaimId] = useState<string | null>(null);

  const nonLatin = useMemo(() => isMostlyNonLatin(originalText), [originalText]);
  const originalHighlights = useMemo(() => detectFeatures(originalText), [originalText]);

  // Render original text with highlight spans
  const renderedOriginalSpans = useMemo(() => {
    if (!originalText) return null;
    if (originalHighlights.length === 0) return <span>{originalText}</span>;

    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    originalHighlights.forEach((hl, i) => {
      if (hl.start > lastIdx) {
        elements.push(
          <span key={`text-${lastIdx}`}>
            {originalText.slice(lastIdx, hl.start)}
          </span>
        );
      }

      let badgeBg = "bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200";
      if (hl.kind === "number") badgeBg = "bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200";
      if (hl.kind === "date") badgeBg = "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200";
      if (hl.kind === "quote") badgeBg = "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200";
      if (hl.kind === "absolute") badgeBg = "bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200";
      if (hl.kind === "allegation") badgeBg = "bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200";

      elements.push(
        <mark
          key={`hl-${i}`}
          className={`rounded-sm px-1 py-0.5 text-xs font-medium ${badgeBg}`}
          title={`${hl.kind.toUpperCase()}: ${hl.explanation || hl.text} — suggested (unconfirmed)`}
        >
          {originalText.slice(hl.start, hl.end)}
        </mark>
      );

      lastIdx = hl.end;
    });

    if (lastIdx < originalText.length) {
      elements.push(
        <span key={`text-${lastIdx}`}>{originalText.slice(lastIdx)}</span>
      );
    }

    return elements;
  }, [originalText, originalHighlights]);

  const handleOpenSplit = (claimId: string, currentText: string, cursorOffset?: number) => {
    setSplitClaimId(claimId);
    if (cursorOffset && cursorOffset > 0 && cursorOffset < currentText.length) {
      setSplitIndex(cursorOffset);
    } else {
      setSplitIndex(Math.floor(currentText.length / 2));
    }
  };

  const handleConfirmSplit = (claimId: string) => {
    if (splitIndex > 0) {
      splitClaim(claimId, splitIndex);
      setSplitClaimId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Shared Disclaimer */}
      <DisclaimerBanner />

      {/* Non-Latin notice if needed */}
      {nonLatin && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300/80 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 backdrop-blur-md dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{NON_LATIN_NOTICE}</span>
        </div>
      )}

      {/* Original Text Inspection Card with Highlights (macOS Window Style) */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl transition dark:border-white/10 sm:p-7">
        {/* macOS Traffic Lights Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-2xs" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-2xs" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-2xs" />
            <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Original Submitted Text (Verbatim & Immutable)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Rule-based cues — not truth verdicts
          </span>
        </div>

        {/* Highlight Legend */}
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="flex items-center gap-1 rounded-full bg-teal-100/90 px-2.5 py-0.5 font-medium text-teal-900 dark:bg-teal-950/70 dark:text-teal-200">
            Named Entities
          </span>
          <span className="flex items-center gap-1 rounded-full bg-blue-100/90 px-2.5 py-0.5 font-medium text-blue-900 dark:bg-blue-950/70 dark:text-blue-200">
            Numbers & Currency
          </span>
          <span className="flex items-center gap-1 rounded-full bg-indigo-100/90 px-2.5 py-0.5 font-medium text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-200">
            Dates
          </span>
          <span className="flex items-center gap-1 rounded-full bg-amber-100/90 px-2.5 py-0.5 font-medium text-amber-900 dark:bg-amber-950/70 dark:text-amber-200">
            Quotations
          </span>
          <span className="flex items-center gap-1 rounded-full bg-rose-100/90 px-2.5 py-0.5 font-medium text-rose-900 dark:bg-rose-950/70 dark:text-rose-200">
            Absolute / Certainty
          </span>
          <span className="flex items-center gap-1 rounded-full bg-purple-100/90 px-2.5 py-0.5 font-medium text-purple-900 dark:bg-purple-950/70 dark:text-purple-200">
            Allegation / Hedging
          </span>
        </div>

        {/* Text Container */}
        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm leading-relaxed text-slate-800 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/70 dark:text-slate-200">
          {renderedOriginalSpans}
        </div>
      </div>

      {/* Decomposed Statements Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Decomposed Checkable Statements ({claims.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review, edit, split, or merge statements so each represents a distinct testable assertion.
            </p>
          </div>

          <button
            onClick={onProceed}
            className="flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:scale-[1.02] hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <span>Proceed to Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Claim Cards List */}
        <div className="space-y-3">
          {claims.map((claim, idx) => (
            <div
              key={claim.id}
              className="glass-panel rounded-2xl p-4.5 shadow-sm transition hover:shadow-md dark:border-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Statement #{idx + 1}
                  </span>
                  {claim.textRevision > 1 && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Rev {claim.textRevision}
                    </span>
                  )}
                </div>

                {/* Card Ordering & Modification Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => idx > 0 && reorderClaims(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800"
                    title="Move up"
                    aria-label="Move statement up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => idx < claims.length - 1 && reorderClaims(idx, idx + 1)}
                    disabled={idx === claims.length - 1}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800"
                    title="Move down"
                    aria-label="Move statement down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Split Button */}
                  <button
                    onClick={() => handleOpenSplit(claim.id, claim.text)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Split into two statements"
                  >
                    <GitFork className="h-3 w-3" />
                    <span>Split</span>
                  </button>

                  {/* Merge with Previous */}
                  {idx > 0 && (
                    <button
                      onClick={() => mergeClaims(claims[idx - 1].id, claim.id)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      title="Merge into statement above"
                    >
                      <Merge className="h-3 w-3" />
                      <span>Merge Prev</span>
                    </button>
                  )}

                  {/* Merge with Next */}
                  {idx < claims.length - 1 && (
                    <button
                      onClick={() => mergeClaims(claim.id, claims[idx + 1].id)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      title="Merge with statement below"
                    >
                      <Merge className="h-3 w-3" />
                      <span>Merge Next</span>
                    </button>
                  )}

                  {/* Delete Button with Confirmation */}
                  {deleteConfirmClaimId === claim.id ? (
                    <div className="flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] dark:bg-rose-950/60">
                      <span className="font-semibold text-rose-700 dark:text-rose-300">Delete?</span>
                      <button
                        onClick={() => {
                          deleteClaim(claim.id);
                          setDeleteConfirmClaimId(null);
                        }}
                        className="rounded bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white hover:bg-rose-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmClaimId(null)}
                        className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmClaimId(claim.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      title="Delete statement (requires confirmation)"
                      aria-label="Delete statement"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Statement Edit Field */}
              <div className="mt-3">
                <textarea
                  rows={2}
                  value={claim.text}
                  onChange={(e) => editClaimText(claim.id, e.target.value)}
                  onSelect={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    if (target.selectionStart && target.selectionStart > 0 && target.selectionStart < claim.text.length) {
                      setSplitIndex(target.selectionStart);
                    }
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Split Interactive Slider Modal / Inline */}
              {splitClaimId === claim.id && (
                <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs dark:border-teal-900 dark:bg-teal-950/30">
                  <span className="font-semibold text-teal-900 dark:text-teal-200">
                    Split Statement at Character Offset {splitIndex}:
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={claim.text.length - 1}
                    value={splitIndex}
                    onChange={(e) => setSplitIndex(parseInt(e.target.value, 10))}
                    className="mt-2 w-full accent-teal-700"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded bg-white p-2 dark:bg-slate-900">
                      <span className="font-medium text-slate-500">Part 1:</span>{" "}
                      {claim.text.slice(0, splitIndex)}
                    </div>
                    <div className="rounded bg-white p-2 dark:bg-slate-900">
                      <span className="font-medium text-slate-500">Part 2:</span>{" "}
                      {claim.text.slice(splitIndex)}
                    </div>
                  </div>
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button
                      onClick={() => setSplitClaimId(null)}
                      className="rounded border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmSplit(claim.id)}
                      className="rounded bg-teal-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
                    >
                      Confirm Split
                    </button>
                  </div>
                </div>
              )}

              {/* Things Worth Checking (Questions) */}
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <HelpCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Things Worth Checking ({claim.questions.length})</span>
                  </div>
                  <button
                    onClick={() => refreshClaimQuestions(claim.id)}
                    className="flex items-center gap-1 text-[11px] text-teal-700 hover:underline dark:text-teal-400"
                    title="Refresh rule suggestions without overwriting existing answers"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>Refresh Suggestions</span>
                  </button>
                </div>

                {claim.questions.length === 0 ? (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    No specific feature questions suggested. You can formulate questions in the workspace.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {claim.questions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-start gap-2 rounded bg-white p-2 text-xs shadow-2xs dark:bg-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={q.resolved}
                          onChange={(e) =>
                            updateClaimQuestion(claim.id, q.id, {
                              resolved: e.target.checked,
                            })
                          }
                          className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          id={`q-${q.id}`}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`q-${q.id}`}
                            className={`cursor-pointer ${
                              q.resolved
                                ? "text-slate-400 line-through dark:text-slate-500"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {q.text}
                          </label>
                          {q.anchorText && (
                            <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.2 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              cue: &quot;{q.anchorText}&quot;
                            </span>
                          )}
                          <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            suggested (unconfirmed)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Statement Card */}
        <div className="glass-panel rounded-2xl border-dashed p-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newClaimInput}
              onChange={(e) => setNewClaimInput(e.target.value)}
              placeholder="Add another statement manually..."
              className="flex-1 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newClaimInput.trim()) {
                  addClaim(newClaimInput);
                  setNewClaimInput("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newClaimInput.trim()) {
                  addClaim(newClaimInput);
                  setNewClaimInput("");
                }
              }}
              disabled={!newClaimInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-950"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Statement</span>
            </button>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="glass-pill rounded-full px-5 py-2 text-xs font-medium text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Back to Step 1
          </button>
          <button
            onClick={onProceed}
            className="flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:scale-[1.02] hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <span>Confirm Breakdown & Open Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
