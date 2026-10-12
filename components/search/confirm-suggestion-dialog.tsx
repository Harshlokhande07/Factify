"use client";

import { useState } from "react";
import { Claim, ClaimLinkType, InvestigationSuggestion } from "@/lib/types";
import { CLAIM_LINK_TYPE_LABELS } from "@/lib/copy";
import { X, CheckCircle2 } from "lucide-react";

interface ConfirmSuggestionDialogProps {
  suggestion: InvestigationSuggestion | null;
  claims: Claim[];
  initialClaimId?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    suggestionId: string,
    payload: { claimIds: string[]; linkType: ClaimLinkType; notes?: string }
  ) => void;
}

export function ConfirmSuggestionDialog({
  suggestion,
  claims,
  initialClaimId,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmSuggestionDialogProps) {
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>(() =>
    initialClaimId ? [initialClaimId] : claims.length > 0 ? [claims[0].id] : []
  );
  const [linkType, setLinkType] = useState<ClaimLinkType>("not_established");
  const [notes, setNotes] = useState("");

  if (!isOpen || !suggestion) return null;

  const toggleClaim = (id: string) => {
    setSelectedClaimIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedClaimIds.length === 0) return;
    onConfirm(suggestion.id, {
      claimIds: selectedClaimIds,
      linkType,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-suggestion-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            CONFIRM SOURCE RECORD
          </span>
          <h2
            id="confirm-suggestion-title"
            className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100"
          >
            Add &quot;{suggestion.data.title.slice(0, 50)}...&quot;
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Confirming creates an official Source record and links it to selected statements.
          </p>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Target Claims */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Link to Statements (select one or more):
            </label>
            <div className="mt-2 max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/50">
              {claims.map((claim, idx) => {
                const isChecked = selectedClaimIds.includes(claim.id);
                return (
                  <label
                    key={claim.id}
                    className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-white dark:hover:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleClaim(claim.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200">
                      <strong>#{idx + 1}</strong>: {claim.text}
                    </span>
                  </label>
                );
              })}
            </div>
            {selectedClaimIds.length === 0 && (
              <p className="mt-1 text-[11px] text-rose-600">Please select at least one statement.</p>
            )}
          </div>

          {/* Link Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Claim–Source Link Type:
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as ClaimLinkType)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {Object.entries(CLAIM_LINK_TYPE_LABELS).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label} — {meta.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Reviewer Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Reviewer Notes (optional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discovered via automated search query; confirmed relevance."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Invariant Summary Line */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-400" />
              <p className="text-[11px] font-medium leading-relaxed">
                This adds a source record. It does not mark the claim as supported.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedClaimIds.length === 0}
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600"
          >
            Confirm and Add Source
          </button>
        </div>
      </div>
    </div>
  );
}
