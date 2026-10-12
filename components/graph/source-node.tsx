"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  FileText,
  Calendar,
  Globe,
  Radio,
  Share2,
  Newspaper,
  BookOpen,
  HelpCircle,
  Award,
} from "lucide-react";
import { Source } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/copy";

interface SourceNodeProps {
  data: {
    source: Source;
    isDemo: boolean;
    isUndated: boolean;
  };
  selected?: boolean;
}

export const SourceNode = memo(function SourceNode({ data, selected }: SourceNodeProps) {
  const { source, isDemo, isUndated } = data;

  const getTypeIcon = () => {
    switch (source.sourceType) {
      case "official_record":
      case "press_release":
        return <Award className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
      case "news_report":
        return <Newspaper className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "social_post":
      case "messaging_forward":
        return <Share2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case "blog_opinion":
      case "analysis":
        return <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div
      className={`w-72 rounded-xl border-2 bg-white p-3 shadow-md transition-all dark:bg-slate-900 ${
        source.isPrimaryMarkedByReviewer
          ? "border-blue-500/80 dark:border-blue-500/70"
          : "border-slate-300 dark:border-slate-700"
      } ${selected ? "ring-2 ring-teal-600 ring-offset-2 dark:ring-offset-slate-950" : ""}`}
    >
      {/* Input Handle from Claims or Upstream Sources */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !bg-blue-600 dark:!bg-blue-400"
      />
      {/* Output Handle to downstream citations */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !bg-blue-600 dark:!bg-blue-400"
      />

      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          {getTypeIcon()}
          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
            {SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {source.isPrimaryMarkedByReviewer && (
            <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
              Primary (reviewer-marked)
            </span>
          )}
          {isDemo && (
            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-semibold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              FICTIONAL
            </span>
          )}
        </div>
      </div>

      {/* Title & Publisher */}
      <div className="mt-2">
        <h4 className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          {source.title}
        </h4>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
          {source.publisher}
        </p>
      </div>

      {/* Date badge */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {isUndated ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Date unknown
            </span>
          ) : (
            <span>
              {source.publishedAt} ({source.datePrecision})
            </span>
          )}
        </div>

        {source.url && (
          <div className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400">
            <Globe className="h-3 w-3" />
            <span className="max-w-[70px] truncate">link</span>
          </div>
        )}
      </div>

      {/* Excerpt preview */}
      {source.excerpt && (
        <p className="mt-2 line-clamp-2 rounded bg-slate-50 p-1.5 text-[11px] italic text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
          &quot;{source.excerpt}&quot;
        </p>
      )}
    </div>
  );
});
