"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";
import { useReviewStore, useSaveIndicator } from "@/store/review-store";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
}

export function Header({ currentStep, onStepChange }: HeaderProps) {
  const isDemo = useReviewStore((state) => state.investigation?.isDemo);
  const investigation = useReviewStore((state) => state.investigation);
  const loadDemo = useReviewStore((state) => state.loadDemo);
  const resetInvestigation = useReviewStore((state) => state.resetInvestigation);

  const lastSavedAt = useSaveIndicator((state) => state.lastSavedAt);
  const saveError = useSaveIndicator((state) => state.saveError);

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <header className="sticky top-4 z-40 mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Floating Capsule Nav (matching reference design) */}
        <div className="glass-pill flex items-center gap-2 rounded-full px-2 py-1.5 shadow-md">
          {/* Logo Capsule Badge */}
          <div className="flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center overflow-hidden rounded-full border border-slate-200/90 bg-white shadow-xs dark:border-white/20 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Factify"
              className="h-full w-full object-cover scale-[1.85]"
            />
          </div>

          <span className="hidden font-bold tracking-tight text-slate-900 sm:inline-block dark:text-white pl-1 pr-2 text-sm">
            Factify
          </span>

          {/* Stepper Navigation Pills */}
          <nav aria-label="Investigation Steps" className="flex items-center gap-1">
            <button
              onClick={() => onStepChange(1)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                currentStep === 1
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
              }`}
            >
              1. Enter Text
            </button>

            <button
              onClick={() => onStepChange(2)}
              disabled={!investigation}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-30 ${
                currentStep === 2
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
              }`}
            >
              2. Break Down
            </button>

            <button
              onClick={() => onStepChange(3)}
              disabled={!investigation}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-30 ${
                currentStep === 3
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
              }`}
            >
              3. Workspace
            </button>

            <Link
              href="/report"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100/60 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
            >
              Report
            </Link>
          </nav>

          {isDemo && (
            <span className="hidden md:inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
              DEMO 2099
            </span>
          )}
        </div>

        {/* Right Floating Actions Capsule */}
        <div className="flex items-center gap-2">
          {/* Saved Status Indicator */}
          <div className="glass-pill hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-600 sm:flex dark:text-slate-300">
            {saveError ? (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Save failed
              </span>
            ) : lastSavedAt ? (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            ) : (
              <span>Ready</span>
            )}
          </div>

          {/* Load Demo Capsule */}
          <button
            onClick={() => setShowDemoModal(true)}
            className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
            title="Load fictional demonstration investigation"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Demo</span>
          </button>

          {/* Main Action Capsule (like Get Started ↗ button in reference image) */}
          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <span>Start New</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="glass-pill inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label="How to use Factify"
            title="How to use Factify"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Theme Toggle */}
          <div className="glass-pill rounded-full p-0.5">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Load Demo */}
      {showDemoModal && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="demo-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 id="demo-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Load Fictional Demo?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {investigation && !investigation.isDemo
                ? "Warning: Loading the demo will overwrite your current active investigation records. Are you sure you want to replace them with the fictional 2099 Port Halvren case study?"
                : "This loads the fictional 2099 Port Halvren case study showing documented arrest records, social repeat chains, wording shifts, and uncorroborated allegations."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="min-h-[44px] rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDemo();
                  setShowDemoModal(false);
                  onStepChange(3);
                }}
                className="min-h-[44px] rounded-full bg-slate-950 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none dark:bg-white dark:text-slate-950"
              >
                Load Demo Dataset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Start New */}
      {showResetModal && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="reset-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 id="reset-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Start a New Investigation?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              This will clear the current workspace and let you paste a new claim or text excerpt from scratch. Any unsaved data will be replaced.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="min-h-[44px] rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={() => {
                  resetInvestigation();
                  setShowResetModal(false);
                  onStepChange(1);
                }}
                className="min-h-[44px] rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:outline-none"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Use & Limitations Modal */}
      {showHelpModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="help-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="glass-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-800">
              <h3 id="help-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                How Factify Works & Limitations
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none dark:hover:bg-slate-800"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  1. Deconstruct Claims
                </h4>
                <p className="mt-0.5">
                  Paste any claim, viral post, or message. Factify uses transparent rule-based processing to separate multi-clause sentences into individual testable statements without automated bias.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  2. Map Claims to Evidence Records
                </h4>
                <p className="mt-0.5">
                  Add source records (press releases, reports, posts) and link them to individual statements as supporting, contradicting, contextualizing, or merely repeating.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  3. Trace Provenance & Dependencies
                </h4>
                <p className="mt-0.5">
                  Link sources to each other (explicit citations, quotes, apparent repetition). Factify evaluates whether corroboration is truly independent or merely an echo chamber citing the same single root source.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  4. Track Wording Shifts & Evidence Gaps
                </h4>
                <p className="mt-0.5">
                  Identify shifts from hedged suspicions (&quot;investigating possible...&quot;) to absolute assertions (&quot;confirmed spy!&quot;). Act on explicit evidence gaps like missing dates, absence of primary records, or scope mismatches.
                </p>
              </div>

              {/* Collapsible/Boxed Limitations Section */}
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-xs text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                <h4 className="font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
                  System Limitations
                </h4>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>Cannot crawl the live web or access external URLs automatically.</li>
                  <li>Cannot access or monitor private messaging chats.</li>
                  <li>Only works with user-entered text or fictional demo records.</li>
                  <li>Heuristic rules are tuned for English language text.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-3 text-xs text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                <strong>Core Invariant:</strong> Factify never issues automated findings or score ratings. It is a human-in-the-loop investigation organizer.
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="min-h-[44px] rounded-full bg-slate-950 px-6 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:outline-none dark:bg-white dark:text-slate-950"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
