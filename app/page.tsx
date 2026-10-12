"use client";

import { useState } from "react";
import { Header } from "@/components/ui/header";
import { Step1Enter } from "@/components/steps/step1-enter";
import { Step2Breakdown } from "@/components/steps/step2-breakdown";
import { Step3Workspace } from "@/components/steps/step3-workspace";
import { useReviewStore } from "@/store/review-store";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(3);
  const investigation = useReviewStore((state) => state.investigation);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Header currentStep={currentStep} onStepChange={setCurrentStep} />

      <main className="pb-16">
        {currentStep === 1 && (
          <Step1Enter onProceed={() => setCurrentStep(2)} />
        )}

        {currentStep === 2 && (
          <Step2Breakdown
            onProceed={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && <Step3Workspace />}
      </main>

      {/* Floating Factify Badge in Bottom Right (matching reference image & replacing N 1 badge) */}
      <aside aria-label="Engine status" className="fixed bottom-5 right-5 z-40 no-print">
        <div className="glass-pill flex items-center gap-2 rounded-full p-1.5 shadow-xl transition hover:scale-105">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white shadow-2xs dark:border-white/20 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Factify"
              className="h-full w-full object-cover scale-[1.85]"
            />
          </div>
          <div className="pr-3 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
            <span>Factify Engine</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
