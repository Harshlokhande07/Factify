"use client";

import { useMemo } from "react";
import { useReviewStore } from "@/store/review-store";
import { parseDateToInterval } from "@/lib/derive/helpers";
import { Source } from "@/lib/types";
import { TIMELINE_CAVEAT, SOURCE_TYPE_LABELS } from "@/lib/copy";
import { Calendar, Clock } from "lucide-react";

interface TimelineViewProps {
  onSelectSource: (sourceId: string) => void;
}

export function TimelineView({ onSelectSource }: TimelineViewProps) {
  const sources = useReviewStore((state) => state.sources);

  const { datedSources, undatedSources } = useMemo(() => {
    const dated: { source: Source; startMs: number; endMs: number }[] = [];
    const undated: Source[] = [];

    sources.forEach((s) => {
      const interval = parseDateToInterval(s.publishedAt, s.datePrecision);
      if (interval) {
        dated.push({ source: s, startMs: interval.startMs, endMs: interval.endMs });
      } else {
        undated.push(s);
      }
    });

    dated.sort((a, b) => a.startMs - b.startMs);
    return { datedSources: dated, undatedSources: undated };
  }, [sources]);

  return (
    <div className="space-y-6">
      {/* Required Timeline Caveat */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <Clock className="h-4 w-4 shrink-0 text-slate-500" />
        <span>{TIMELINE_CAVEAT}</span>
      </div>

      {/* Chronological Stream */}
      <div className="relative pl-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Dated Records ({datedSources.length})
        </h4>

        {datedSources.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No dated records found.</p>
        ) : (
          <div className="space-y-4">
            {datedSources.map(({ source }) => (
              <div key={source.id} className="relative">
                {/* Timeline node marker */}
                <div className="absolute -left-[27px] top-3.5 h-3 w-3 rounded-full border-2 border-teal-600 bg-white dark:bg-slate-900" />

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-bold text-teal-800 dark:text-teal-300">
                        <Calendar className="h-3.5 w-3.5" />
                        {source.publishedAt}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        precision: {source.datePrecision}
                      </span>
                      {source.isPrimaryMarkedByReviewer && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                          PRIMARY
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <button
                      onClick={() => onSelectSource(source.id)}
                      className="text-left text-sm font-semibold text-slate-900 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400"
                    >
                      {source.title}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Publisher: {source.publisher}
                    </p>
                  </div>

                  {source.excerpt && (
                    <blockquote className="mt-2 border-l-2 border-slate-200 pl-2.5 text-xs italic text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      &quot;{source.excerpt}&quot;
                    </blockquote>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Undated Lane */}
        <div className="mt-8">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Undated Records ({undatedSources.length})
          </h4>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Records without reliable publication timestamps could have originated earlier or later. Treat as provisional in any chronological assessment.
          </p>

          <div className="space-y-3">
            {undatedSources.map((source) => (
              <div
                key={source.id}
                className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-4 dark:border-amber-900/60 dark:bg-amber-950/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectSource(source.id)}
                    className="text-left text-xs font-semibold text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {source.title}
                  </button>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Date Unknown
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {source.publisher} • {SOURCE_TYPE_LABELS[source.sourceType]}
                </p>
                {source.dateNote && (
                  <p className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                    Note: {source.dateNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
