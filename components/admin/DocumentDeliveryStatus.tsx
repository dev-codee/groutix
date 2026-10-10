"use client";
import { CheckCircle2, Eye } from "lucide-react";
import { fmtDate } from "@/lib/adminHelpers";

export function DocumentDeliveryStatus({ label, sentAt, openedAt }: { label: "Quote" | "Invoice"; sentAt?: string; openedAt?: string }) {
  if (!sentAt && !openedAt) return null;
  return <div className="space-y-1.5">
    {sentAt && <div className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-50/80 text-blue-700 border border-blue-200/80 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3 shrink-0" /><span>{label} Sent — {fmtDate(sentAt)}</span>
    </div>}
    <div className={`text-[10px] px-2 py-1 rounded-lg border flex flex-wrap items-center justify-between gap-1 ${openedAt ? "font-bold bg-emerald-50 text-emerald-800 border-emerald-300" : "font-medium bg-slate-50 text-slate-500 border-slate-200"}`}>
      <span className="flex items-center gap-1"><Eye className={`w-3 h-3 shrink-0 ${openedAt ? "text-emerald-600" : "text-slate-400 opacity-40"}`} />{label} Opened</span>
      <span className={openedAt ? "text-[9.5px] font-black text-emerald-700" : "text-[9px] text-amber-600 font-semibold"}>{openedAt ? fmtDate(openedAt) : "Not opened yet"}</span>
    </div>
  </div>;
}
