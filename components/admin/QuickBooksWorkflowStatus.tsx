"use client";
import { Check } from "lucide-react";
import { quickbooksStatus } from "@/lib/quickbooksStatus";
import type { Lead } from "./types";

export function QuickBooksWorkflowStatus({ lead }: { lead: Lead }) {
  const { sent, total, synced } = quickbooksStatus(lead);
  return <div role="status" aria-label={sent ? "QuickBooks Sent: confirmed" : "QuickBooks Sent: pending"}
    title={total > 1 ? `${synced} of ${total} saved invoices synced to QuickBooks` : sent ? "Invoice confirmed in QuickBooks" : "Send the saved invoice to QuickBooks to complete this step"}
    className={`flex w-full min-w-0 select-none items-center justify-between rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${sent ? "border-emerald-300 bg-[#dcfce7] text-slate-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
    <span className="truncate">QuickBooks Sent{total > 1 && !sent && synced > 0 ? ` (${synced}/${total})` : ""}</span>
    {sent && <Check aria-label="Confirmed" className="ml-0.5 h-3.5 w-3.5 shrink-0 stroke-[3] text-emerald-600" />}
  </div>;
}
