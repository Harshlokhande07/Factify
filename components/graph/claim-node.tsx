"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Quote, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Claim } from "@/lib/types";

interface ClaimNodeProps {
  data: {
    claim: Claim;
    openGapsCount: number;
  };
  selected?: boolean;
}

export const ClaimNode = memo(function ClaimNode({ data, selected }: ClaimNodeProps) {
  const { claim, openGapsCount } = data;

  const statusColor =
    claim.status === "evidence_found"
      ? "border-teal-500 bg-teal-50/70 text-teal-900 dark:border-teal-500/60 dark:bg-teal-950/40 dark:text-teal-200"
      : claim.status === "needs_verification"
      ? "border-amber-400 bg-amber-50/70 text-amber-900 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-200"
      : "border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <div
      className={`w-72 rounded-xl border-2 p-3 shadow-md transition-all ${statusColor} ${
        selected ? "ring-2 ring-teal-600 ring-offset-2 dark:ring-offset-slate-950" : ""
      }`}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !bg-teal-600 dark:!bg-teal-400"
      />

      <div className="flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Quote className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
          <span>Statement #{claim.order + 1}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {openGapsCount > 0 && (
            <span
              className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              title={`${openGapsCount} open review items`}
            >
              {openGapsCount} open item{openGapsCount > 1 ? "s" : ""}
            </span>
          )}

          <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize">
            {claim.status === "evidence_found" && (
              <CheckCircle2 className="h-3 w-3 text-teal-600" />
            )}
            {claim.status === "needs_verification" && (
              <AlertCircle className="h-3 w-3 text-amber-600" />
            )}
            {claim.status === "not_checked" && (
              <Clock className="h-3 w-3 text-slate-500" />
            )}
            {claim.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <p className="mt-2 line-clamp-3 text-xs leading-snug">
        {claim.text}
      </p>

      {claim.notes && (
        <div className="mt-2 truncate text-[10px] text-slate-500 dark:text-slate-400">
          Note: {claim.notes}
        </div>
      )}
    </div>
  );
});
