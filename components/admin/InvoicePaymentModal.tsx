"use client";
import { useEffect, useRef, useState } from "react";
import type { Lead } from "./types";
import { invoiceBalance } from "@/lib/invoiceBalance";
import { openPaymentReceipt } from "./PaymentReceiptModal";
const EVENT = "groutix-record-invoice-payment";
export function openInvoicePayment(customerId: string, type: "full" | "partial" = "full", invoiceId?: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { customerId, type, invoiceId } }));
}
const money = (cents: number) => `AUD $${(cents / 100).toFixed(2)}`;
export function InvoicePaymentModal({ onChanged }: { onChanged: (parent?: Lead) => void }) {
  const [request, setRequest] = useState<{ customerId: string; invoiceId?: string } | null>(null);
  const [invoices, setInvoices] = useState<Lead[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [type, setType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const pending = useRef(false), paymentRequest = useRef<{ signature: string; id: string } | null>(null);
  useEffect(() => {
    const open = (event: Event) => {
      if (pending.current) return;
      const detail = (event as CustomEvent<{ customerId: string; type: "full" | "partial"; invoiceId?: string }>).detail;
      setLoading(true); setRequest(detail); setType(detail.type); setInvoiceId(""); setAmount(""); setInvoices([]); setError(""); setNotice(""); paymentRequest.current = null;
    };
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    fetch(`/api/admin/invoice/customer/${encodeURIComponent(request.customerId)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load invoices."); return data.invoices as Lead[]; })
      .then(items => {
        if (controller.signal.aborted) return;
        setInvoices(items);
        const outstanding = items.filter(item => invoiceBalance(item).remainingCents > 0);
        setInvoiceId(request.invoiceId || (outstanding.length === 1 ? outstanding[0].id : ""));
      }).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [request]);
  const selected = invoices.find(invoice => invoice.id === invoiceId);
  const balance = selected ? invoiceBalance(selected) : null;
  async function save() {
    if (!selected || !balance || pending.current || !balance.remainingCents) return;
    const additional = type === "partial" ? Number(amount) : undefined;
    if (type === "partial" && (!Number.isFinite(additional) || !additional || additional <= 0 || Math.round(additional * 100) > balance.remainingCents)) { setError("Enter the amount received, up to the remaining balance."); return; }
    const body = { id: selected.id, type, ...(additional !== undefined ? { amount: additional } : {}), expectedPaidCents: balance.paidCents };
    const signature = JSON.stringify(body);
    if (paymentRequest.current?.signature !== signature) paymentRequest.current = { signature, id: crypto.randomUUID() };
    pending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/invoice/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, requestId: paymentRequest.current.id }) });
      const data = await response.json();
      if (!response.ok || !data.item) throw new Error(data.error || "Could not record payment.");
      setInvoices(current => current.map(invoice => invoice.id === data.item.id ? data.item : invoice));
      setAmount(""); paymentRequest.current = null; onChanged(data.parent);
      if (data.item.invoiceStatus === "Paid") { setRequest(null); openPaymentReceipt(data.item.id); }
      else setNotice(`Payment recorded. ${money(invoiceBalance(data.item).remainingCents)} remains on ${data.item.invoiceNumber}.`);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not record payment. Retry with the same payment details."); }
    finally { pending.current = false; setBusy(false); }
  }
  if (!request) return null;
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Receive invoice payment">
    <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Receive payment</h2><button type="button" disabled={busy} onClick={() => setRequest(null)} className="rounded-lg border px-3 py-2">Close</button></div>
      {loading ? <p role="status">Loading invoice balances…</p> : <>
        <label className="block space-y-1 text-sm font-semibold">Invoice<select className="w-full rounded-lg border p-2" value={invoiceId} disabled={busy} onChange={event => { setInvoiceId(event.target.value); setAmount(""); setError(""); setNotice(""); }}>
          <option value="">Select the invoice being paid</option>
          {invoices.map(invoice => <option key={invoice.id} value={invoice.id} disabled={!invoiceBalance(invoice).remainingCents}>{invoice.invoiceNumber} — {money(invoiceBalance(invoice).remainingCents)} outstanding</option>)}
        </select></label>
        {!invoices.length && <p>No saved invoices are available for this customer.</p>}
        {selected && balance && <>
          <p className="text-sm">{selected.name} · Total {money(balance.totalCents)} · Received {money(balance.paidCents)} · Remaining <strong>{money(balance.remainingCents)}</strong></p>
          <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => setType("full")} className={`rounded-lg border px-3 py-2 ${type === "full" ? "bg-teal-700 text-white" : ""}`}>Full / pay remaining</button><button type="button" disabled={busy} onClick={() => setType("partial")} className={`rounded-lg border px-3 py-2 ${type === "partial" ? "bg-teal-700 text-white" : ""}`}>Partial payment</button></div>
          {type === "partial" && <label className="block space-y-1 text-sm font-semibold">Amount received now (AUD)<input className="w-full rounded-lg border p-2" type="number" min="0.01" max={balance.remainingCents / 100} step="0.01" value={amount} disabled={busy} onChange={event => setAmount(event.target.value)} /></label>}
          <button type="button" onClick={() => void save()} disabled={busy || !balance.remainingCents || (type === "partial" && !amount)} className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Recording payment…" : type === "full" ? `Record ${money(balance.remainingCents)} received` : "Record partial payment"}</button>
        </>}
      </>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {error && <div role="alert" className="space-y-2 text-sm text-red-700"><p>{error}</p><button type="button" disabled={busy} onClick={() => { setError(""); setLoading(true); setRequest({ ...request, invoiceId }); }} className="font-semibold underline">Refresh invoice balances</button></div>}
    </div>
  </div>;
}
