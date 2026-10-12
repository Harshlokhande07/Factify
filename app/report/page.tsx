"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useReviewStore } from "@/store/review-store";
import { buildReportModel } from "@/lib/derive/report";
import { generateMarkdownReport } from "@/lib/export/markdown";
import {
  ArrowLeft,
  Printer,
  Download,
  FileJson,
  ShieldAlert,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import {
  DISCLAIMER_TEXT,
  LIMITATIONS_TEXT,
  CLAIM_LINK_TYPE_LABELS,
  SOURCE_REL_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  REVIEW_STATUS_LABELS,
  CHECKLIST_ITEMS,
  STATUS_MICROCOPY,
  EARLIEST_RECORD_CAVEAT,
} from "@/lib/copy";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ReportPage() {
  const mounted = useIsMounted();
  const store = useReviewStore();

  const report = useMemo(() => buildReportModel(store), [store]);

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport(report);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factify-investigation-report-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(store, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factify-investigation-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-10 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 py-8 text-slate-900 print:bg-white print:py-0 dark:bg-slate-950 dark:text-slate-100">
      {/* Print & screen watermark overlay for demo */}
      {report.isDemo && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden"
        >
          <div className="rotate-[-30deg] text-6xl sm:text-8xl font-black uppercase tracking-widest text-slate-900/[0.04] dark:text-white/[0.04] print:text-black/[0.08]">
            FICTIONAL DEMO
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Navigation & Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xs backdrop-blur-md print:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Investigation Workspace</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Report</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Markdown</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-teal-800 dark:bg-teal-600"
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* Report Document Header */}
        <div className="rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8 print:border-none print:p-0 print:shadow-none dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Factify Logo"
                className="h-full w-full object-cover scale-[1.75]"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                {report.title}
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Generated: {new Date(report.generatedAt).toLocaleString()} • Factify Misinformation Origin & Evidence Tracing Assistant
              </p>
            </div>
          </div>

          {report.hasMockData && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-center text-xs font-bold uppercase tracking-wider text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
            >
              [CONTAINS MOCK DATA] — This report contains records confirmed from mock/simulated search results.
            </div>
          )}

          {/* SECTION 1: LIMITATION + DISCLAIMER */}
          <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300">
                  1. Operating Invariant & Legal Disclaimer
                </h2>
                <p className="mt-1 font-semibold leading-relaxed">
                  {DISCLAIMER_TEXT}
                </p>
                <div className="mt-3 border-t border-teal-200/80 pt-2 text-[11px] text-teal-900/80 dark:border-teal-900/80 dark:text-teal-300/80">
                  <span className="font-bold">System Scope Limitations:</span>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {LIMITATIONS_TEXT.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FICTIONAL DEMO WATERMARK IF DEMO */}
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Dataset Integrity Status
            </h2>
            {report.isDemo ? (
              <div
                role="alert"
                className="mt-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-4 text-center dark:border-amber-900 dark:bg-amber-950/40"
              >
                <span className="inline-block rounded bg-amber-200 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  [FICTIONAL DEMO WATERMARK]
                </span>
                <p className="mt-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                  All records in this investigation are fictional, created solely for interface demonstration.
                </p>
                <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                  Port Halvren, Councillor Mara Quillon, and associated entities are fictitious 2099 test fixtures.
                </p>
              </div>
            ) : (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                User-conducted investigation. Records originate from submitted inputs in this browser session.
              </div>
            )}
          </div>

          {/* SECTION 3: ORIGINAL TEXT VERBATIM */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Original Submitted Content (Verbatim & Immutable)
            </h2>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {report.originalText || "(No original submitted text)"}
            </div>
          </div>

          {/* SECTION 4: SCOPE */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Scope of Available Evidence Records
            </h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-center dark:border-slate-800 dark:bg-slate-900">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {report.scopeSummary.totalSources}
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Total Sources Linked or Recorded</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-center dark:border-slate-800 dark:bg-slate-900">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {report.scopeSummary.datedSources}
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Dated Records</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-center dark:border-slate-800 dark:bg-slate-900">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {report.scopeSummary.undatedSources}
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Undated Records (Provisional)</p>
              </div>
            </div>
          </div>

          {/* SECTION 5: CLAIMS WITH STATUS / CHECKLIST / NOTES */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. Decomposed Statements (Status, Checklist, Notes)
            </h2>
            <div className="mt-3 space-y-4">
              {report.claimsReport.map((item, idx) => {
                const statusInfo = REVIEW_STATUS_LABELS[item.claim.status] || {
                  label: item.claim.status,
                  desc: "",
                };
                return (
                  <div
                    key={item.claim.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/40 print:break-inside-avoid"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900 dark:bg-teal-950 dark:text-teal-300">
                          {idx + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          Statement #{idx + 1}: &quot;{item.claim.text}&quot;
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Review Status: {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400">
                      {STATUS_MICROCOPY}
                    </p>

                    {/* 5-item Checklist */}
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        5-Item Evidence Review Checklist:
                      </span>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {CHECKLIST_ITEMS.map((c) => {
                          const isChecked = !!item.claim.checklist[c.key];
                          return (
                            <div
                              key={c.key}
                              className={`flex items-center gap-2 rounded p-1.5 text-[11px] ${
                                isChecked
                                  ? "bg-teal-50 text-teal-900 font-semibold dark:bg-teal-950/40 dark:text-teal-200"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {isChecked ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )}
                              <span>{c.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-3 text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Reviewer Notes: </span>
                      <span>{item.claim.notes || "(No notes entered)"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: SOURCES */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              6. Recorded Evidence Sources ({report.sources.length})
            </h2>
            {report.sources.length === 0 ? (
              <p className="mt-2 text-xs italic text-slate-400">No sources registered.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {report.sources.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900 print:break-inside-avoid"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                        {s.isPrimaryMarkedByReviewer && (
                          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            Primary (Reviewer-Marked)
                          </span>
                        )}
                        {s.origin === "search_confirmed" && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Added from search, reviewer-confirmed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium dark:bg-slate-800">
                          {SOURCE_TYPE_LABELS[s.sourceType] || s.sourceType}
                        </span>
                        <span className="text-[11px]">
                          {s.publishedAt || "Date unknown"}
                        </span>
                      </div>
                    </div>

                    {s.suggestionMeta && (
                      <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Search Metadata: </span>
                        <span>Match strength: {s.suggestionMeta.matchBucket}</span>
                        {s.suggestionMeta.matchedQueries?.length > 0 && (
                          <span> • Matched queries: {s.suggestionMeta.matchedQueries.join(", ")}</span>
                        )}
                        {s.suggestionMeta.firstArchivedAt && (
                          <span className="block mt-0.5 text-slate-500">
                            Earliest archive capture: {s.suggestionMeta.firstArchivedAt} (Wayback capture, not publication date)
                          </span>
                        )}
                      </div>
                    )}

                    {s.url && (
                      <div className="mt-1.5">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-teal-700 underline hover:text-teal-800 dark:text-teal-400"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{s.url}</span>
                        </a>
                      </div>
                    )}

                    {s.excerpt && (
                      <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 italic text-slate-600 dark:border-slate-700 dark:text-slate-400">
                        &quot;{s.excerpt}&quot;
                      </blockquote>
                    )}

                    {s.notes && (
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Notes:</strong> {s.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 7: CLAIM-SOURCE LINKS */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              7. Claim-to-Source Links
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="py-2 pr-4 font-medium">Statement</th>
                    <th className="py-2 pr-4 font-medium">Source Record</th>
                    <th className="py-2 pr-4 font-medium">Link Type</th>
                    <th className="py-2 pr-4 font-medium">Relevance Excerpt</th>
                    <th className="py-2 font-medium">Scope Mismatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.claimsReport.flatMap((c, i) =>
                    c.links.map(({ link, source }) => (
                      <tr key={link.id}>
                        <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">
                          #{i + 1}
                        </td>
                        <td className="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                          {source.title}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-slate-800">
                            {CLAIM_LINK_TYPE_LABELS[link.type]?.label || link.type}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                          {link.excerptRelevance || "(None)"}
                        </td>
                        <td className="py-2 text-slate-600 dark:text-slate-400">
                          {link.scopeMismatch || "(None)"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 8: SOURCE-SOURCE RELATIONSHIPS */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              8. Source-to-Source Relationships & Provenance
            </h2>
            {report.sourceRelationships.length === 0 ? (
              <p className="mt-2 text-xs italic text-slate-400">
                No source-to-source relationships recorded.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-xs">
                {report.sourceRelationships.map(({ relationship: r, fromSource, toSource }) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {fromSource?.title || r.fromSourceId}
                      </span>{" "}
                      <span className="text-slate-400">→</span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {toSource?.title || r.toSourceId}
                      </span>
                      {r.explanation && (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Note: {r.explanation}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        {SOURCE_REL_TYPE_LABELS[r.type]?.label || r.type}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {r.verification}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 9: WORDING CHANGES */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              9. Observable Wording Shifts
            </h2>
            {report.wordingChanges.length === 0 ? (
              <p className="mt-2 text-xs italic text-slate-400">
                No wording shifts flagged between compared records.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {report.wordingChanges.map(({ sourceA, sourceB, observations }, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Comparison: &quot;{sourceA?.title}&quot; vs &quot;{sourceB?.title}&quot;
                    </h3>
                    <div className="mt-2 space-y-2">
                      {observations.map((obs) => (
                        <div
                          key={obs.id}
                          className="rounded border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {obs.kind.replace(/_/g, " ")}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Review State: {obs.reviewState}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600 dark:text-slate-400">
                            {obs.explanation}
                          </p>
                          <p className="mt-1 text-[11px] text-teal-800 dark:text-teal-400 italic">
                            This change may warrant review.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 10: EARLIEST RECORD + INDEPENDENCE PER CLAIM */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              10. Earliest Traceable Record & Independence Per Claim
            </h2>
            <div className="mt-3 space-y-4">
              {report.claimsReport.map((item, idx) => (
                <div
                  key={item.claim.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/40 print:break-inside-avoid"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Statement #{idx + 1}: &quot;{item.claim.text}&quot;
                  </h3>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Earliest Record Card */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Earliest traceable relevant record in this investigation:
                      </span>
                      <p className="mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.earliest.type === "earliest_among_dated" ? (
                          <>
                            <strong>{item.earliest.source.title}</strong> (
                            {item.earliest.source.publishedAt || "undated"}) — {item.earliest.scope}.
                            Link type:{" "}
                            <em>{CLAIM_LINK_TYPE_LABELS[item.earliest.linkType]?.label}</em>.
                            {item.earliest.isProvisional && (
                              <span className="mt-1 block text-amber-800 dark:text-amber-400 font-semibold">
                                Treat as provisional due to undated candidates.
                              </span>
                            )}
                          </>
                        ) : (
                          item.earliest.message
                        )}
                      </p>
                      <p className="mt-2 text-[10px] text-slate-400 italic">
                        {EARLIEST_RECORD_CAVEAT}
                      </p>
                    </div>

                    {/* Independence Card */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Independence Result:
                      </span>
                      <p className="mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.independence.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 11: OPEN GAPS WITH NEXT STEPS */}
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              11. Open Review Items & Next Steps
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              These are workflow indicators, not evidence that a claim is wrong.
            </p>
            {report.allOpenGaps.length === 0 ? (
              <p className="mt-2 text-xs italic text-slate-400">
                All review items and evidence gaps are resolved or dismissed.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {report.allOpenGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {gap.ruleId}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {gap.message}
                      </span>
                      {gap.kind === "heuristic_suggestion" && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          suggested (unconfirmed)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                      Next Step: {gap.nextStep}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 12: SEARCH COVERAGE */}
          {report.searchRuns.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                12. Search Engine Retrieval Coverage ({report.searchRuns.length})
              </h2>
              <div className="mt-3 space-y-3">
                {report.searchRuns.map((run, idx) => (
                  <div
                    key={run.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900 print:break-inside-avoid"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          Search Run #{idx + 1}: Provider {run.provider.toUpperCase()}
                        </span>
                        {run.mock && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            MOCK
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(run.ranAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px]">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Queries run / failed:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {run.coverage.queriesRun} / {run.coverage.queriesFailed}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Unique URLs:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {run.coverage.uniqueUrls}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Dated / Undated:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {run.coverage.dated} / {run.coverage.undated}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Archive enrich:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {run.coverage.wayback?.requested
                            ? `Active (${run.coverage.wayback.missing} missing)`
                            : "Not requested"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400">
                      {run.coverage.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
