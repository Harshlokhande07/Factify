"use client";

import { AlertCircle, ShieldAlert } from "lucide-react";
import { DISCLAIMER_TEXT, DEMO_BANNER_TEXT } from "@/lib/copy";
import { useReviewStore } from "@/store/review-store";

export function DisclaimerBanner({ showDemoWarning = true }: { showDemoWarning?: boolean }) {
  const isDemo = useReviewStore((state) => state.investigation?.isDemo);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {isDemo && showDemoWarning && (
        <div
          role="alert"
          aria-label="Demo investigation notice"
          className="glass-pill flex items-center gap-2 rounded-full bg-amber-50/95 px-4 py-2 text-xs font-semibold text-amber-950 shadow-xs dark:bg-amber-950/90 dark:text-amber-200"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span>{DEMO_BANNER_TEXT}</span>
        </div>
      )}

      <div
        role="alert"
        aria-label="Factify operating invariant disclaimer"
        className="glass-pill flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs dark:bg-slate-900/95 dark:text-slate-100"
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
        <span>{DISCLAIMER_TEXT}</span>
      </div>
    </div>
  );
}
