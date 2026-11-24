"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useAdminPageCtx } from "./AdminPageContext";
import type { Lead } from "./types";

export function SendChecklistButton({ lead }: { lead: Lead }) {
  const { upsertLead } = useAdminPageCtx();
  const [sending, setSending] = useState(false);

  async function sendChecklist() {
    if (sending || !lead.email) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/checklist/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not send the checklist.");
        return;
      }
      if (data.item) upsertLead(data.item);
      alert(`Checklist emailed to ${lead.email}.`);
    } catch {
      alert("Network error while sending the checklist.");
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={sendChecklist}
      disabled={sending || !lead.email}
      title={lead.email ? `Email checklist form to ${lead.email}` : "No email address saved"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {sending ? "Sending checklist…" : lead.checklistSentAt ? "Resend checklist" : "Send checklist"}
    </button>
  );
}
