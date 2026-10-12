"use client";

import { useState } from "react";
import { useReviewStore } from "@/store/review-store";
import { SourceRelType, Verification } from "@/lib/types";
import { SOURCE_REL_TYPE_LABELS } from "@/lib/copy";
import { X } from "lucide-react";

interface AddRelDialogProps {
  sourceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddRelDialog({ sourceId, isOpen, onClose }: AddRelDialogProps) {
  const sources = useReviewStore((state) => state.sources);
  const addSourceRelationship = useReviewStore((state) => state.addSourceRelationship);

  const [fromSourceId, setFromSourceId] = useState(sourceId || "");
  const [toSourceId, setToSourceId] = useState("");
  const [relType, setRelType] = useState<SourceRelType>("explicitly_cites");
  const [verification, setVerification] = useState<Verification>("documented");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromSourceId || !toSourceId) {
      setError("Please select both source records.");
      return;
    }
    if (fromSourceId === toSourceId) {
      setError("A source record cannot have a relationship with itself.");
      return;
    }

    try {
      addSourceRelationship({
        fromSourceId,
        toSourceId,
        type: relType,
        verification,
        explanation: explanation.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add relationship.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Add Source-to-Source Relationship
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {error && <p className="text-rose-600">{error}</p>}

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Downstream / Referring Source (From) *
            </label>
            <select
              value={fromSourceId}
              onChange={(e) => setFromSourceId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">-- Choose From Source --</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.publishedAt || "undated"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Upstream / Cited Source (To) *
            </label>
            <select
              value={toSourceId}
              onChange={(e) => setToSourceId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">-- Choose To Source --</option>
              {sources
                .filter((s) => s.id !== fromSourceId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.publishedAt || "undated"})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Relationship Type *
            </label>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as SourceRelType)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {Object.entries(SOURCE_REL_TYPE_LABELS).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label} — {meta.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Verification State *
            </label>
            <select
              value={verification}
              onChange={(e) => setVerification(e.target.value as Verification)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="documented">Documented (Explicit link/attribution in text)</option>
              <option value="reviewer_suspected">Reviewer suspected (Phrasing similarity/temporal overlap)</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Explanation & Notes
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. Article quotes paragraph 2 of police statement."
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
              className="rounded bg-sky-700 px-3 py-1.5 font-semibold text-white hover:bg-sky-800"
            >
              Save Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
