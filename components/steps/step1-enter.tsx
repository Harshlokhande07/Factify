"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Sparkles,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useReviewStore } from "@/store/review-store";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { PRIVACY_NOTE, SOURCE_TYPE_LABELS } from "@/lib/copy";
import { SourceType } from "@/lib/types";

interface Step1Props {
  onProceed: () => void;
}

const SAMPLE_CLAIMS = [
  {
    title: "Port Halvren: Councillor Arrest (2099)",
    subtitle: "Harbour-permit charge & foreign espionage rumor",
    text: "Councillor Quillon was arrested on a harbour-permit charge yesterday in Port Halvren. Online forwards claim Councillor Quillon is a foreign spy working against the district.",
    source: {
      title: "Viral Chat Forward #892",
      publisher: "Unknown Forwarder",
      url: "",
      sourceType: "messaging_forward" as SourceType,
      publishedAt: "",
    },
  },
  {
    title: "Harbour Dredging Fund Diversion (2099)",
    subtitle: "Maritime Authority 45M credits allocation",
    text: "The Port Halvren Maritime Authority allocated 45 million credits for deepwater dredging. Anonymous reports allege over 12 million credits were secretly diverted to private shipping companies without council oversight.",
    source: {
      title: "Maritime Watch Blog",
      publisher: "Civic Transparency Forum",
      url: "https://transparency.port-halvren.fictional/posts/dredging-funds",
      sourceType: "blog_opinion" as SourceType,
      publishedAt: "2099-04-12",
    },
  },
  {
    title: "Beacon Substation Emergency Shutdown (2099)",
    subtitle: "Blackout affecting 80,000 residents",
    text: "Beacon Grid Substation 4 suffered a sudden blackout affecting 80,000 residents. Social media posts claim the failure was triggered by cyber warfare, but the utility company reported equipment failure caused by unseasonal storms.",
    source: {
      title: "Halvren Grid Incident Notice",
      publisher: "Halvren Electric Authority",
      url: "https://grid.port-halvren.fictional/advisories/incident-sub4",
      sourceType: "official_record" as SourceType,
      publishedAt: "2099-05-02",
    },
  },
];

export function Step1Enter({ onProceed }: Step1Props) {
  const createInvestigation = useReviewStore((state) => state.createInvestigation);
  const existingInvestigation = useReviewStore((state) => state.investigation);

  const [text, setText] = useState(existingInvestigation?.originalText || "");
  const [showSourceFields, setShowSourceFields] = useState(false);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourcePublisher, setSourcePublisher] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("other");
  const [publishedAt, setPublishedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoPopup, setInfoPopup] = useState<string | null>(null);

  const handleLoadSample = (sample: typeof SAMPLE_CLAIMS[0]) => {
    setText(sample.text);
    setSourceTitle(sample.source.title);
    setSourcePublisher(sample.source.publisher);
    setSourceUrl(sample.source.url);
    setSourceType(sample.source.sourceType);
    setPublishedAt(sample.source.publishedAt);
    setShowSourceFields(true);
    setError(null);
  };

  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (val: string): boolean => {
    if (!val.trim()) {
      setUrlError(null);
      return true;
    }
    try {
      const parsed = new URL(val.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setUrlError("Source URL must start with http:// or https:// (e.g. https://example.com)");
        return false;
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError("Please enter a valid URL beginning with http:// or https://");
      return false;
    }
  };

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please enter a claim or excerpt to investigate.");
      return;
    }
    if (trimmed.length > 5000) {
      setError("Text exceeds the 5,000 character maximum for a single investigation.");
      return;
    }

    if (sourceUrl.trim() && !validateUrl(sourceUrl)) {
      setShowSourceFields(true);
      return;
    }

    createInvestigation({
      originalText: trimmed,
      initialSource:
        sourceTitle || sourceUrl
          ? {
              title: sourceTitle,
              publisher: sourcePublisher,
              url: sourceUrl.trim() || undefined,
              sourceType,
              publishedAt: publishedAt || undefined,
            }
          : undefined,
    });

    onProceed();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Shared Invariant Disclaimer Banner */}
      <div className="mb-8">
        <DisclaimerBanner />
      </div>

      {/* Main Hero Split View (matching reference image) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Headline, Typography, Quick Demos */}
        <div className="flex flex-col justify-center space-y-6 lg:col-span-5 lg:pt-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur-md dark:bg-white/10 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Evidence & Provenance Tracing
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.15] dark:text-white">
              Deconstruct Claims. <br />
              Trace Origins on Your Terms.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Decompose viral claims into verifiable statements, map citing vs independent
              chains, detect subtle wording drift, and surface critical verification gaps.
            </p>
          </div>

          {/* Quick Demo Pill Actions */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Try Fictional 2099 Case Studies:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CLAIMS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="glass-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-slate-800 transition hover:scale-[1.02] hover:bg-white hover:shadow-md dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span className="line-clamp-1">{sample.title}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Client-Side Guarantee Tag */}
          <div className="flex items-center gap-2 pt-4 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>{PRIVACY_NOTE} Works 100% offline in your browser.</span>
          </div>
        </div>

        {/* Right Column: macOS-Style Window Container (matches screenshot) */}
        <div className="lg:col-span-7">
          <div className="glass-panel relative rounded-3xl p-6 shadow-2xl transition sm:p-8 dark:border-white/10">
            {/* macOS Window Controls (Traffic Lights) */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-2xs" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-2xs" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-2xs" />
                <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  Step 1 — Enter Claim or Message
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {text.length}/5,000 characters
              </span>
            </div>

            {/* Conversation-style Prompt Bubble */}
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/80 p-4 text-xs leading-relaxed text-slate-700 shadow-xs backdrop-blur-md dark:bg-slate-800/80 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Paste the claim, viral forward, or article excerpt you want to investigate:
                </p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  Factify will break it down sentence by sentence into distinct factual statements,
                  detecting key numbers, absolute language, and dates.
                </p>
              </div>

              {/* Interactive Help & Demo Pill Chips */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() => setInfoPopup("Factify operates on 10 strict invariants: no automated verdicts, conservative independence, and pure client-side tracing.")}
                  className="rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  What does Factify do?
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample(SAMPLE_CLAIMS[0])}
                  className="rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Load 2099 Port Halvren Sample
                </button>
                <button
                  type="button"
                  onClick={() => setShowSourceFields(!showSourceFields)}
                  className="glass-pill rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white dark:text-slate-300"
                >
                  {showSourceFields ? "Hide Initial Source" : "+ Initial Source Record"}
                </button>
              </div>

              {infoPopup && (
                <div className="flex items-center justify-between rounded-xl bg-teal-50/90 p-3 text-xs text-teal-900 backdrop-blur-xs dark:bg-teal-950/80 dark:text-teal-200">
                  <span>{infoPopup}</span>
                  <button
                    onClick={() => setInfoPopup(null)}
                    className="font-bold hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Input Form with Textarea & Action Pills */}
            <form onSubmit={handleStart} className="mt-4 space-y-4">
              <div className="relative">
                <textarea
                  id="claim-text"
                  rows={4}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste headline, forwarded message, article excerpt, or social post..."
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/50 dark:border-slate-700/80 dark:bg-slate-950/90 dark:text-slate-100 dark:placeholder:text-slate-600"
                />

                {error && (
                  <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}
              </div>

              {/* Optional Initial Source Metadata Panel */}
              {showSourceFields && (
                <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Initial Source Record (Optional)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Where was this first observed?
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Source Title / Outlet
                      </label>
                      <input
                        type="text"
                        value={sourceTitle}
                        onChange={(e) => setSourceTitle(e.target.value)}
                        placeholder="e.g. Halvren Harbour Gazette"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Author or Publisher
                      </label>
                      <input
                        type="text"
                        value={sourcePublisher}
                        onChange={(e) => setSourcePublisher(e.target.value)}
                        placeholder="e.g. Police Dept / Channel Name"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="source-url" className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Source Web URL
                      </label>
                      <input
                        id="source-url"
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => {
                          setSourceUrl(e.target.value);
                          validateUrl(e.target.value);
                        }}
                        placeholder="https://example.com/record"
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 ${
                          urlError
                            ? "border-rose-500 focus:border-rose-600"
                            : "border-slate-200 focus:border-slate-400 dark:border-slate-700"
                        }`}
                      />
                      {urlError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          {urlError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Source Type
                      </label>
                      <select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value as SourceType)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Publication Date (YYYY-MM-DD or YYYY)
                      </label>
                      <input
                        type="text"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        placeholder="2099-03-03"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span>Client-side decomposition</span>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:scale-[1.02] hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <span>Break Down Statements</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Bottom Provenance Bar (matching reference image) */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/40 p-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => onProceed()}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-xs transition hover:bg-slate-50 dark:bg-slate-800 dark:text-white"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Workspace</span>
          </button>

          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Guarantees:
          </span>

          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800/70 dark:text-slate-300">
            100% In-Browser Local Memory
          </span>

          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800/70 dark:text-slate-300">
            No Automated Truth Verdicts
          </span>

          <span className="hidden sm:inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800/70 dark:text-slate-300">
            Conservative Independence
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Offline Ready</span>
        </div>
      </div>
    </div>
  );
}
