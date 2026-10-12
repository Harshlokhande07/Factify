"use client";

import { useState } from "react";
import { useReviewStore } from "@/store/review-store";
import { ClaimLinkType } from "@/lib/types";
import { CLAIM_LINK_TYPE_LABELS } from "@/lib/copy";
import { X } from "lucide-react";

interface AddLinkDialogProps {
  claimId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddLinkDialog({ claimId, isOpen, onClose }: AddLinkDialogProps) {
  const sources = useReviewStore((state) => state.sources);
  const claims = useReviewStore((state) => state.claims);
  const addClaimSourceLink = useReviewStore((state) => state.addClaimSourceLink);

  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [linkType, setLinkType] = useState<ClaimLinkType>("supports");
  const [notes, setNotes] = useState("");
  const [excerptRelevance, setExcerptRelevance] = useState<"addresses_claim" | "partly" | "unclear" | "not_assessed">("addresses_claim");
  const [scopeMismatch, setScopeMismatch] = useState<"none_noted" | "possible" | "not_assessed">("none_noted");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !claimId) return null;

  const currentClaim = claims.find((c) => c.id === claimId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceId) {
      setError("Please select a source to link.");
      return;
    }

    addClaimSourceLink({
      claimId,
      sourceId: selectedSourceId,
      type: linkType,
      notes: notes.trim(),
      excerptRelevance,
      scopeMismatch,
      assessedAtClaimRevision: currentClaim?.textRevision || 1,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Link Source to Statement
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 rounded bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-100">Target Statement:</span>{" "}
          &quot;{currentClaim?.text}&quot;
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {error && <p className="text-rose-600">{error}</p>}

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Select Source Record *
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">-- Choose a Source --</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.publishedAt || "undated"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Claim–Source Link Relationship *
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as ClaimLinkType)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {Object.entries(CLAIM_LINK_TYPE_LABELS).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label} — {meta.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-medium text-slate-600 dark:text-slate-400">
                Excerpt Relevance
              </label>
              <select
                value={excerptRelevance}
                onChange={(e) => setExcerptRelevance(e.target.value as any)}
                className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="addresses_claim">Addresses statement</option>
                <option value="partly">Partly addresses</option>
                <option value="unclear">Unclear</option>
                <option value="not_assessed">Not assessed</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-600 dark:text-slate-400">
                Scope Mismatch
              </label>
              <select
                value={scopeMismatch}
                onChange={(e) => setScopeMismatch(e.target.value as any)}
                className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="none_noted">None noted</option>
                <option value="possible">Possible mismatch</option>
                <option value="not_assessed">Not assessed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Review Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paragraph 3 describes the event directly."
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600"
            >
              Link to Statement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
