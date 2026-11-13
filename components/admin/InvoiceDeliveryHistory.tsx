"use client";

import { useEffect, useState } from "react";
import { DocumentDeliveryStatus } from "./DocumentDeliveryStatus";
import type { Lead } from "./types";

export type InvoiceDelivery = Pick<Lead, "id" | "invoiceNumber" | "invoiceSentAt" | "invoiceOpenedAt">;
const DELIVERY_EVENT = "groutix-invoice-delivery";
export function notifyInvoiceDeliveryChanged(customerId: string) {
  window.dispatchEvent(new CustomEvent(DELIVERY_EVENT, { detail: customerId }));
}

export function useInvoiceDeliveries(customerId?: string) {
  const [result, setResult] = useState<{ id: string; invoices: InvoiceDelivery[]; error: string } | null>(null);
  useEffect(() => {
    if (!customerId) return;
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const response = await fetch(`/api/admin/invoice/customer/${encodeURIComponent(customerId)}?delivery=1`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.invoices)) throw new Error("Could not load invoice delivery status.");
        if (!controller.signal.aborted) setResult({ id: customerId, invoices: data.invoices, error: "" });
      } catch {
        if (!controller.signal.aborted) setResult(current => ({ id: customerId, invoices: current?.id === customerId ? current.invoices : [], error: "Could not refresh invoice delivery status." }));
      } finally { pending = false; }
    };
    const changed = (event: Event) => { if ((event as CustomEvent<string>).detail === customerId) void refresh(); };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30_000);
    window.addEventListener("focus", refresh);
    window.addEventListener(DELIVERY_EVENT, changed);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(DELIVERY_EVENT, changed);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [customerId]);
  return result?.id === customerId ? result : null;
}

export function InvoiceDeliveryList({ invoices }: { invoices: InvoiceDelivery[] }) {
  return <div className="space-y-2">
    {invoices.map(invoice => <div key={invoice.id} className="space-y-1 rounded-lg border border-slate-200 bg-white p-2">
      <p className="text-[11px] font-bold text-slate-800">{invoice.invoiceNumber || "Invoice"}</p>
      {invoice.invoiceSentAt || invoice.invoiceOpenedAt
        ? <DocumentDeliveryStatus label="Invoice" sentAt={invoice.invoiceSentAt} openedAt={invoice.invoiceOpenedAt} />
        : <p className="text-[10px] text-slate-500">Invoice not sent yet</p>}
    </div>)}
  </div>;
}

export function InvoiceDeliveryHistory({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const result = useInvoiceDeliveries(expanded && lead.customerInvoiceCount ? lead.id : undefined);
  if (!lead.customerInvoiceCount) return <DocumentDeliveryStatus label="Invoice" sentAt={lead.invoiceSentAt} openedAt={lead.invoiceOpenedAt} />;
  return <div className="space-y-1.5">
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="text-[11px] font-semibold text-blue-700 hover:underline">{expanded ? "Hide" : "View"} {lead.customerInvoiceCount} invoices</button>
    {expanded && <>
    {result ? <InvoiceDeliveryList invoices={result.invoices} /> : <p role="status" className="text-[10px] text-slate-500">Loading invoice delivery status…</p>}
    {result?.error && <p role="alert" className="text-[10px] text-amber-700">{result.error} Retrying automatically.</p>}
    </>}
  </div>;
}
