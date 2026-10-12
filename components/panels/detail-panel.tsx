"use client";

import { useState } from "react";
import { useReviewStore } from "@/store/review-store";
import {
  ClaimSourceLink,
  Source,
  ReviewStatus,
  ClaimLinkType,
  SourceRelType,
  Verification,
} from "@/lib/types";
import { computeIndependence } from "@/lib/derive/independence";
import { computeEarliest } from "@/lib/derive/earliest";
import {
  CHECKLIST_ITEMS,
  STATUS_MICROCOPY,
  CLAIM_LINK_TYPE_LABELS,
  SOURCE_REL_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/copy";
import { WordingPanel } from "./wording-panel";
import { GapsPanel } from "./gaps-panel";
import {
  HelpCircle,
  ExternalLink,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  X,
  FileText,
  Search,
} from "lucide-react";

interface DetailPanelProps {
  selectedItem: {
    type: "claim" | "source" | "claim_source" | "source_relationship";
    id: string;
  } | null;
  onClose: () => void;
  onOpenAddLinkDialog: (claimId: string) => void;
  onOpenAddRelDialog: (sourceId: string) => void;
  onOpenSearch?: (claimId?: string) => void;
  isSearchAvailable?: boolean;
}

export function DetailPanel({
  selectedItem,
  onClose,
  onOpenAddLinkDialog,
  onOpenAddRelDialog,
  onOpenSearch,
  isSearchAvailable = true,
}: DetailPanelProps) {
  const store = useReviewStore();
  const claims = useReviewStore((state) => state.claims);
  const sources = useReviewStore((state) => state.sources);
  const claimSourceLinks = useReviewStore((state) => state.claimSourceLinks);
  const sourceRelationships = useReviewStore((state) => state.sourceRelationships);

  const editClaimText = useReviewStore((state) => state.editClaimText);
  const toggleChecklist = useReviewStore((state) => state.toggleChecklist);
  const setClaimStatus = useReviewStore((state) => state.setClaimStatus);
  const setClaimNotes = useReviewStore((state) => state.setClaimNotes);
  const setClaimReferenceUrl = useReviewStore((state) => state.setClaimReferenceUrl);
  const promoteReferenceUrlToSource = useReviewStore(
    (state) => state.promoteReferenceUrlToSource
  );
  const editSource = useReviewStore((state) => state.editSource);
  const deleteSource = useReviewStore((state) => state.deleteSource);
  const editClaimSourceLink = useReviewStore((state) => state.editClaimSourceLink);
  const deleteClaimSourceLink = useReviewStore((state) => state.deleteClaimSourceLink);
  const editSourceRelationship = useReviewStore((state) => state.editSourceRelationship);
  const deleteSourceRelationship = useReviewStore((state) => state.deleteSourceRelationship);

  const [activeHintKey, setActiveHintKey] = useState<string | null>(null);

  if (!selectedItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
        <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700" />
        <p className="mt-2 font-medium">Select a statement, source, or link in the graph to inspect details.</p>
      </div>
    );
  }

  // 1. CLAIM DETAIL
  if (selectedItem.type === "claim") {
    const claim = claims.find((c) => c.id === selectedItem.id);
    if (!claim) return null;

    const independence = computeIndependence(store, claim.id);
    const earliest = computeEarliest(store, claim.id);
    const linkedSources = claimSourceLinks
      .filter((l) => l.claimId === claim.id)
      .map((l) => ({ link: l, source: sources.find((s) => s.id === l.sourceId) }))
      .filter((item): item is { link: ClaimSourceLink; source: Source } => Boolean(item.source));

    const checkedCount = Object.values(claim.checklist).filter(Boolean).length;

    return (
      <div className="space-y-5 p-4 text-xs sm:p-5">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              STATEMENT #{claim.order + 1}
            </span>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              Statement Evidence Review
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Statement Text Edit */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Statement Text (Revision {claim.textRevision}):
          </label>
          <textarea
            rows={3}
            value={claim.text}
            onChange={(e) => editClaimText(claim.id, e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Find Related Sources Button */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={() => onOpenSearch(claim.id)}
            disabled={!isSearchAvailable}
            title={
              !isSearchAvailable
                ? "Search backend not running. See README."
                : "Search for machine-suggested sources related to this statement"
            }
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 px-3 text-xs font-semibold shadow-xs transition ${
              !isSearchAvailable
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-600"
                : "border-teal-300 bg-teal-50/80 text-teal-900 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-200 dark:hover:bg-teal-900"
            }`}
          >
            <Search className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Find related sources for this statement</span>
          </button>
        )}

        {/* Review Status Selector with Mandatory Microcopy */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Human Review Status:
          </label>
          <select
            value={claim.status}
            onChange={(e) => setClaimStatus(claim.id, e.target.value as ReviewStatus)}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="not_checked">Not checked</option>
            <option value="evidence_found">Evidence found</option>
            <option value="needs_verification">Needs more verification</option>
          </select>
          <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {STATUS_MICROCOPY}
          </p>
        </div>

        {/* Structured Review Checklist */}
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Review Checklist ({checkedCount} / 5)
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-teal-600 transition-all"
                style={{ width: `${(checkedCount / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-2.5 space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.key} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={claim.checklist[item.key]}
                      onChange={() => toggleChecklist(claim.id, item.key)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveHintKey(activeHintKey === item.key ? null : item.key)
                    }
                    className="text-slate-400 hover:text-teal-600"
                    title="What to inspect"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>

                {activeHintKey === item.key && (
                  <p className="mt-1 rounded bg-slate-50 p-1.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {item.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conservative Independence Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>Independence Assessment:</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {independence.description}
          </p>
        </div>

        {/* Earliest Record Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Calendar className="h-4 w-4 text-sky-700 dark:text-sky-400" />
            <span>Earliest traceable relevant record in this investigation:</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {earliest.type === "earliest_among_dated" ? (
              <>
                <strong className="text-slate-900 dark:text-slate-100">
                  {earliest.source.title}
                </strong>{" "}
                ({earliest.source.publishedAt || "undated"}) — {earliest.scope}. Link type:{" "}
                <em>{CLAIM_LINK_TYPE_LABELS[earliest.linkType]?.label || earliest.linkType}</em>.
                {earliest.isProvisional && (
                  <span className="block mt-1 font-medium text-amber-700 dark:text-amber-400">
                    {earliest.undatedCount} record(s) have no date and could be earlier. Treat as provisional.
                  </span>
                )}
              </>
            ) : (
              earliest.message
            )}
            <p className="mt-1.5 text-[10px] italic text-slate-500 dark:text-slate-400">
              Oldest relevant record available here, not proof of where the claim began.
            </p>
          </div>
        </div>

        {/* Linked Sources Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Linked Sources ({linkedSources.length})
            </span>
            <button
              onClick={() => onOpenAddLinkDialog(claim.id)}
              className="flex items-center gap-1 rounded bg-teal-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
            >
              <Plus className="h-3 w-3" />
              <span>Link Source</span>
            </button>
          </div>

          <div className="space-y-2">
            {linkedSources.map(({ link, source }) => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                    {source.title}
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Type: {CLAIM_LINK_TYPE_LABELS[link.type]?.label || link.type}</span>
                    <span>• Relevance: {link.excerptRelevance}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteClaimSourceLink(link.id)}
                  className="rounded p-1 text-slate-400 hover:text-rose-600"
                  title="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reviewer Notes on Claim */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Reviewer Notes on Statement:
          </label>
          <textarea
            value={claim.notes || ""}
            onChange={(e) => setClaimNotes(claim.id, e.target.value)}
            rows={2}
            placeholder="Document notes, evidence scope, or unresolved questions..."
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Reference URL Note & Promote Action */}
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Quick Reference URL:
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="url"
              value={claim.referenceUrl || ""}
              onChange={(e) => setClaimReferenceUrl(claim.id, e.target.value)}
              placeholder="https://example.com/record"
              className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {claim.referenceUrl && (
              <button
                onClick={() => promoteReferenceUrlToSource(claim.id)}
                className="rounded bg-sky-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-sky-800"
                title="Convert this URL into a formal Source Record"
              >
                Promote
              </button>
            )}
          </div>
        </div>

        {/* Claim Gaps */}
        <GapsPanel claimId={claim.id} />
      </div>
    );
  }

  // 2. SOURCE DETAIL
  if (selectedItem.type === "source") {
    const source = sources.find((s) => s.id === selectedItem.id);
    if (!source) return null;

    return (
      <div className="space-y-5 p-4 text-xs sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              SOURCE RECORD
            </span>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              Source Metadata & Excerpt
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title & Publisher */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Record Title:
          </label>
          <input
            type="text"
            value={source.title}
            onChange={(e) => editSource(source.id, { title: e.target.value })}
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Publisher or Author:
          </label>
          <input
            type="text"
            value={source.publisher}
            onChange={(e) => editSource(source.id, { publisher: e.target.value })}
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Source Type with Heuristic Disclaimer */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Source Type:
            </label>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              Type guessed from the domain. Review.
            </span>
          </div>
          <select
            value={source.sourceType}
            onChange={(e) =>
              editSource(source.id, {
                sourceType: e.target.value as Source["sourceType"],
              })
            }
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Provenance & Metadata (when reviewer-confirmed from search) */}
        {source.origin === "search_confirmed" && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs dark:border-teal-900/60 dark:bg-teal-950/40">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-950 dark:text-teal-200">
                Search Provenance
              </span>
              <span className="rounded-full bg-teal-200/70 px-2 py-0.5 text-[10px] font-bold text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                Added from search, reviewer-confirmed
              </span>
            </div>

            {source.suggestionMeta && (
              <div className="mt-2.5 space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Query term overlap:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      source.suggestionMeta.matchBucket === "high"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : source.suggestionMeta.matchBucket === "medium"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                    title="How closely the result's text matches your claim's key terms. This is not a measure of accuracy."
                  >
                    {source.suggestionMeta.matchBucket} overlap
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    (retrieval similarity only, not accuracy)
                  </span>
                </div>

                {source.suggestionMeta.matchedQueries.length > 0 && (
                  <div>
                    <span className="text-slate-500">Matched queries: </span>
                    <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">
                      {source.suggestionMeta.matchedQueries.join(", ")}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500">Classification: </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Type guessed from the domain. Review.
                  </span>
                </div>

                {source.suggestionMeta.firstArchivedAt && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200">
                    <span className="font-semibold">Archive capture: </span>
                    <span>{source.suggestionMeta.firstArchivedAt}</span>
                    <p className="mt-0.5 text-[10px] text-amber-800 dark:text-amber-300">
                      Earliest Wayback capture date; this is NOT the publication date.
                    </p>
                  </div>
                )}

                {source.suggestionMeta.fromMockData && (
                  <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    [MOCK DATA] Derived from offline demo search result.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Primary Marked Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Mark as Primary Source
            </span>
            <p className="text-[10px] text-slate-500">
              Reviewer classification; not automatically verified authoritative.
            </p>
          </div>
          <input
            type="checkbox"
            checked={source.isPrimaryMarkedByReviewer}
            onChange={(e) =>
              editSource(source.id, { isPrimaryMarkedByReviewer: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
        </div>

        {/* Date and precision */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              Publication Date
            </label>
            <input
              type="text"
              value={source.publishedAt || ""}
              onChange={(e) =>
                editSource(source.id, { publishedAt: e.target.value || null })
              }
              placeholder="YYYY-MM-DD"
              className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              Date Precision
            </label>
            <select
              value={source.datePrecision}
              onChange={(e) =>
                editSource(source.id, {
                  datePrecision: e.target.value as Source["datePrecision"],
                })
              }
              className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {source.dateNote && (
          <p className="text-[10px] italic text-slate-500 dark:text-slate-400">
            Date note: {source.dateNote}
          </p>
        )}

        {/* Safe URL Link */}
        {source.url && (
          <div>
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              Source URL
            </label>
            <div className="mt-1 flex items-center gap-1.5">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-teal-700 underline hover:text-teal-800 dark:text-teal-400"
              >
                <span>{source.url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Excerpt */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Verbatim Excerpt from Source:
          </label>
          <textarea
            rows={3}
            value={source.excerpt}
            onChange={(e) => editSource(source.id, { excerpt: e.target.value })}
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={() => onOpenAddRelDialog(source.id)}
            className="rounded bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800"
          >
            Add Source Relationship
          </button>
          <button
            onClick={() => {
              deleteSource(source.id);
              onClose();
            }}
            className="rounded border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
          >
            Delete Source
          </button>
        </div>
      </div>
    );
  }

  // 3. SOURCE RELATIONSHIP DETAIL
  if (selectedItem.type === "source_relationship") {
    const rel = sourceRelationships.find(
      (r) => `edge-ss-${r.fromSourceId}-${r.toSourceId}` === selectedItem.id
    );
    if (!rel) return null;

    const fromSrc = sources.find((s) => s.id === rel.fromSourceId);
    const toSrc = sources.find((s) => s.id === rel.toSourceId);

    return (
      <div className="space-y-5 p-4 text-xs sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              SOURCE-TO-SOURCE RELATION
            </span>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              Provenance & Dependency Link
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-medium text-slate-500 uppercase">
            Connected Sources:
          </span>
          <div className="mt-1 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
            <span>{fromSrc?.title}</span>
            <span className="text-slate-400">→</span>
            <span>{toSrc?.title}</span>
          </div>
        </div>

        {/* Relationship Type */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Relationship Type:
          </label>
          <select
            value={rel.type}
            onChange={(e) =>
              editSourceRelationship(rel.id, {
                type: e.target.value as SourceRelType,
              })
            }
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {Object.entries(SOURCE_REL_TYPE_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Verification State */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Verification State:
          </label>
          <select
            value={rel.verification}
            onChange={(e) =>
              editSourceRelationship(rel.id, {
                verification: e.target.value as Verification,
              })
            }
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="documented">Documented</option>
            <option value="reviewer_suspected">Reviewer suspected</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Explanation */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Explanation / Reviewer Notes:
          </label>
          <textarea
            rows={2}
            value={rel.explanation}
            onChange={(e) =>
              editSourceRelationship(rel.id, { explanation: e.target.value })
            }
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Wording shift comparison if both sources have excerpts */}
        {fromSrc && toSrc && fromSrc.excerpt && toSrc.excerpt && (
          <WordingPanel sourceA={toSrc} sourceB={fromSrc} />
        )}

        <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={() => {
              deleteSourceRelationship(rel.id);
              onClose();
            }}
            className="rounded border border-rose-300 px-3 py-1 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
          >
            Delete Relationship
          </button>
        </div>
      </div>
    );
  }

  // 4. CLAIM SOURCE LINK DETAIL
  if (selectedItem.type === "claim_source") {
    const link = claimSourceLinks.find(
      (l) => `edge-cs-${l.claimId}-${l.sourceId}` === selectedItem.id
    );
    if (!link) return null;

    const claim = claims.find((c) => c.id === link.claimId);
    const source = sources.find((s) => s.id === link.sourceId);

    return (
      <div className="space-y-5 p-4 text-xs sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              CLAIM-TO-EVIDENCE LINK
            </span>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              Evaluating &quot;{claim ? claim.text.slice(0, 30) + "..." : "Statement"}&quot; ↔ &quot;{source?.title || "Source"}&quot;
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Claim–Source Link Type:
          </label>
          <select
            value={link.type}
            onChange={(e) =>
              editClaimSourceLink(link.id, {
                type: e.target.value as ClaimLinkType,
              })
            }
            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {Object.entries(CLAIM_LINK_TYPE_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              Excerpt Relevance
            </label>
            <select
              value={link.excerptRelevance}
              onChange={(e) =>
                editClaimSourceLink(link.id, {
                  excerptRelevance: e.target.value as ClaimSourceLink["excerptRelevance"],
                })
              }
              className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="addresses_claim">Addresses statement</option>
              <option value="partly">Partly addresses</option>
              <option value="unclear">Unclear</option>
              <option value="not_assessed">Not assessed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              Scope Mismatch Flag
            </label>
            <select
              value={link.scopeMismatch}
              onChange={(e) =>
                editClaimSourceLink(link.id, {
                  scopeMismatch: e.target.value as ClaimSourceLink["scopeMismatch"],
                })
              }
              className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="none_noted">None noted</option>
              <option value="possible">Possible mismatch</option>
              <option value="not_assessed">Not assessed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={() => {
              deleteClaimSourceLink(link.id);
              onClose();
            }}
            className="rounded border border-rose-300 px-3 py-1 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
          >
            Delete Link
          </button>
        </div>
      </div>
    );
  }

  return null;
}
