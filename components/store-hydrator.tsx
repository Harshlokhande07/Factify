"use client";

import { useSyncExternalStore, useEffect } from "react";
import { useReviewStore } from "@/store/review-store";

export function useHasHydrated() {
  return useSyncExternalStore(
    (callback) => {
      const unsub = useReviewStore.persist.onFinishHydration(callback);
      return unsub;
    },
    () => useReviewStore.persist.hasHydrated(),
    () => false
  );
}

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (!useReviewStore.persist.hasHydrated()) {
      useReviewStore.persist.rehydrate();
    }
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      const state = useReviewStore.getState();
      if (!state.investigation) {
        state.loadDemo();
      }
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-transparent p-4 sm:p-6" aria-busy="true" aria-label="Loading workspace">
        {/* Header Skeleton */}
        <div className="mx-auto max-w-7xl">
          <div className="glass-pill flex h-14 w-full animate-pulse items-center justify-between rounded-full px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-4 w-24 rounded bg-slate-200/80 dark:bg-slate-800" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-full bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-8 w-20 rounded-full bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-8 w-20 rounded-full bg-slate-200/80 dark:bg-slate-800" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-8 w-24 rounded-full bg-slate-200/80 dark:bg-slate-800" />
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="glass-panel h-[520px] w-full animate-pulse rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-4 dark:border-slate-800">
                  <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="ml-4 h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-8 space-y-4">
                  <div className="h-24 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-24 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-24 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="glass-panel h-[520px] w-full animate-pulse rounded-3xl p-6 shadow-lg">
                <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-4 space-y-3">
                  <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-40 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
