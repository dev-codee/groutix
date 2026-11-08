"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useAdminPageCtx } from "./AdminPageContext";
import type { Lead } from "./types";

export function SendInvoiceToQuickBooksButton({ lead, onSynced }: { lead: Lead; onSynced?: (item: Lead) => void }) {
  const { role, upsertLead } = useAdminPageCtx();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [synced, setSynced] = useState(false);
  const inFlight = useRef(false);
  if (!["finance", "manager", "super_admin"].includes(role)) return null;
  const alreadySynced = synced || Boolean(lead.qboInvoiceId);
  const saved = Boolean(lead.invoiceNumber && lead.invoiceAmount && lead.invoiceAmount > 0);

  async function send() {
    if (inFlight.current || alreadySynced) return;
    inFlight.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/invoice/quickbooks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.item?.qboInvoiceId) throw new Error(data.error || "QuickBooks sync was not confirmed. Please retry.");
      if (!lead.invoiceParentId) upsertLead(data.item);
      onSynced?.(data.item);
      setSynced(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach QuickBooks. Please retry.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return <div className="min-w-0 space-y-1">
    <button type="button" onClick={send} disabled={sending || alreadySynced || !saved}
      title={!saved ? "Open and save the invoice first." : alreadySynced ? "This invoice is already synced to QuickBooks." : "Sync the saved invoice without emailing the customer."}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2 py-2 text-xs font-semibold text-green-800 transition-colors hover:bg-green-100 disabled:cursor-default disabled:opacity-60">
      {sending ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : alreadySynced ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Send className="h-3.5 w-3.5 shrink-0" />}
      {sending ? "Sending to QuickBooks…" : "Send invoice to QuickBooks"}
    </button>
    {alreadySynced ? <p role="status" className="text-[11px] font-medium text-green-700">Synced to QuickBooks</p>
      : error || lead.qboError ? <p role="alert" className="text-[11px] text-red-600">{error || lead.qboError}</p>
      : !saved ? <p className="text-[11px] text-slate-500">Open and save the invoice first.</p> : null}
  </div>;
}
