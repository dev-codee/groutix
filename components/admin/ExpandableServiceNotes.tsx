"use client";

import { useId, useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";

export function ExpandableServiceNotes({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <button
      type="button"
      onClick={() => setExpanded((value) => !value)}
      aria-expanded={expanded}
      aria-controls={contentId}
      aria-label={expanded ? "Show less service and notes" : "Show all service and notes"}
      className="flex w-full min-w-0 items-start gap-1.5 rounded text-left text-xs font-medium text-slate-700 cursor-pointer hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1">
        <span
          id={contentId}
          className={expanded ? "block whitespace-pre-wrap break-words [overflow-wrap:anywhere]" : "block truncate"}
        >
          {text}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
          {expanded ? "Show less" : "Show all"}
          <ChevronDown className={`h-3 w-3 ${expanded ? "rotate-180" : ""}`} />
        </span>
      </span>
    </button>
  );
}
