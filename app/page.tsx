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

      {/* Floating Factify Badge in Bottom Right with subtle float, glow, and live indicator */}
      <aside aria-label="Engine status" className="fixed bottom-5 right-5 z-40 no-print select-none">
        <div className="relative group animate-float-badge">
          {/* Subtle Ambient Pulsing Glow Aura */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-500/25 via-sky-500/20 to-indigo-500/25 blur-md animate-pulse-ring" />

          {/* Main Glass Pill Container */}
          <div className="relative glass-pill flex items-center gap-2 rounded-full p-1.5 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl overflow-hidden cursor-default border border-white/80 dark:border-white/15">
            {/* Shimmer Light Sweep on Hover */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute -inset-y-full w-12 bg-gradient-to-r from-transparent via-white/40 dark:via-white/15 to-transparent animate-shimmer-sweep" />
            </div>

            {/* Logo Container with micro-rotation and scale */}
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white shadow-2xs transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 dark:border-white/20 dark:bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Factify"
                className="h-full w-full object-cover scale-[1.85]"
              />
            </div>

            {/* Title & Live Active Pulse Ping */}
            <div className="flex items-center gap-2 pr-3.5 pl-0.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
              <span>Factify Engine</span>
              <span className="relative flex h-2 w-2" title="Engine active">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
