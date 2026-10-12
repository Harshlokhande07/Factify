"use client";

import { useState } from "react";
import { useReviewStore } from "@/store/review-store";
import { SourceType, DatePrecision } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/copy";
import { X } from "lucide-react";

interface AddSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSourceDialog({ isOpen, onClose }: AddSourceDialogProps) {
  const addSource = useReviewStore((state) => state.addSource);

  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("news_report");
  const [publishedAt, setPublishedAt] = useState("");
  const [datePrecision, setDatePrecision] = useState<DatePrecision>("day");
  const [excerpt, setExcerpt] = useState("");
  const [notes, setNotes] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Source title is required.");
      return;
    }

    if (url.trim()) {
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setError("Source URL must start with http:// or https:// (e.g. https://example.com)");
          return;
        }
      } catch {
        setError("Please enter a valid URL beginning with http:// or https://");
        return;
      }
    }

    try {
      addSource({
        title: title.trim(),
        publisher: publisher.trim() || "Unspecified Publisher",
        url: url.trim() || undefined,
        sourceType,
        publishedAt: publishedAt.trim() || null,
        datePrecision: publishedAt.trim() ? datePrecision : "unknown",
        excerpt: excerpt.trim(),
        notes: notes.trim(),
        isPrimaryMarkedByReviewer: isPrimary,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add source record.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Add Evidence Source Record
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {error && (
            <p className="rounded bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </p>
          )}

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Title or Outlet Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Police Dept Press Release"
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Publisher</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g. Gazette"
                className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Publication Date
              </label>
              <input
                type="text"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Date Precision</label>
              <select
                value={datePrecision}
                onChange={(e) => setDatePrecision(e.target.value as DatePrecision)}
                className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Web URL (http/https only)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/record"
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Relevant Text Excerpt
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Paste exact passage from source..."
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is-primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="is-primary" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              Mark as Primary Source (e.g. original document or official record)
            </label>
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
              Save Source Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
