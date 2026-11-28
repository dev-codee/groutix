"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { hasSubmittedQuoteChecklist } from "@/lib/quoteJobChecklist";
import { useAdminPageCtx } from "./AdminPageContext";
import type { Lead } from "./types";

export function SendChecklistButton({ lead }: { lead: Lead }) {
  const { upsertLead } = useAdminPageCtx();
  const [sending, setSending] = useState(false);
  const submitted = hasSubmittedQuoteChecklist(lead);

  async function sendChecklist() {
    if (sending || submitted || !lead.email) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/checklist/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not send the quote request.");
        return;
      }
      if (data.item) upsertLead(data.item);
      alert(`Smart Quote Request emailed to ${lead.email}.`);
    } catch {
      alert("Network error while sending the quote request.");
    } finally {
      setSending(false);
    }
  }

  const stages = [
    ["Sent", lead.checklistSentAt],
    ["Email opened", lead.checklistOpenedAt],
    ["Started filling", lead.checklistFilledAt],
    ["Submitted", lead.checklistSubmittedAt || lead.checklist?.submittedAt],
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
    {submitted ? <span className="text-[11px] font-semibold text-emerald-700">Checklist submitted</span> : <button
      type="button"
      onClick={sendChecklist}
      disabled={sending || !lead.email}
      title={lead.email ? `Email Smart Quote Request to ${lead.email}` : "No email address saved"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {sending ? "Sending request…" : lead.checklistSentAt ? "Resend request" : "Send quote request"}
    </button>}
    <details className="group relative text-[11px] text-slate-600">
      <summary className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold hover:bg-slate-50">Quote request status</summary>
      <div className="absolute left-0 z-20 mt-1 min-w-64 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        {stages.filter(([stage, time]) => !submitted || time || stage === "Submitted").map(([stage, time]) => (
          <div key={stage} className="flex items-start gap-2">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${time || submitted ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="font-semibold text-slate-700">{stage}</span>
            <span className="ml-auto text-right text-slate-500">{time ? new Date(time).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" }) : submitted ? "Complete" : "Pending"}</span>
          </div>
        ))}
        {submitted && <p className="border-t border-slate-100 pt-2 font-semibold text-emerald-700">Customer completed the quote request.</p>}
        {!submitted && lead.checklistFilledAt && <p className="border-t border-slate-100 pt-2 text-amber-700">Customer started but has not submitted it.</p>}
      </div>
    </details>
    </div>
  );
}
