"use client";

import { CheckCircle2, X } from "lucide-react";
import { fmtDate } from "@/lib/adminHelpers";
import type { Lead } from "./types";

export function QuoteResponseBadge({ lead }: { lead: Lead }) {
  if (lead.quoteSignature || lead.quoteSignedAt) {
    return (
      <a
        href={`/api/admin/quote/pdf/${lead.id}`}
        target="_blank"
        rel="noreferrer"
        title={`Signed online by ${lead.quoteSignedName || lead.name || "customer"} • ${fmtDate(lead.quoteSignedAt || lead.quoteAcceptedAt)} (Click to view signed PDF)`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed &amp; Accepted
      </a>
    );
  }
  if (lead.quoteAcceptedAt) {
    return (
      <span
        title={`Accepted online • ${fmtDate(lead.quoteAcceptedAt)}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap"
      >
        <CheckCircle2 className="w-3 h-3" /> Accepted online
      </span>
    );
  }
  if (lead.quoteDeclinedAt) {
    return (
      <span
        title={`Declined online • ${fmtDate(lead.quoteDeclinedAt)}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap"
      >
        <X className="w-3 h-3" /> Declined online
      </span>
    );
  }
  return null;
}
