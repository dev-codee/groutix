"use client";

import { useEffect, useState } from "react";
import type { PaymentReceipt } from "@/lib/paymentReceipt";

export function openPaymentReceipt(id: string) {
  window.dispatchEvent(new CustomEvent("groutix-payment-receipt", { detail: id }));
}

export function PaymentReceiptModal() {
  const [id, setId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const open = (event: Event) => { setId((event as CustomEvent<string>).detail); setReceipt(null); setEmail(""); setError(""); setSent(false); };
    window.addEventListener("groutix-payment-receipt", open);
    return () => window.removeEventListener("groutix-payment-receipt", open);
  }, []);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetch(`/api/admin/invoice/receipt?id=${encodeURIComponent(id)}`, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load receipt.");
      setReceipt(data.receipt); setEmail(data.email || ""); setSent(Boolean(data.sentAt));
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [id]);
  if (!id) return null;
  const pdfUrl = `/api/admin/invoice/receipt?id=${encodeURIComponent(id)}&pdf=1`;
  async function send() {
    setSending(true); setError("");
    try {
      const response = await fetch("/api/admin/invoice/receipt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not email receipt.");
      setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not email receipt."); }
    finally { setSending(false); }
  }
  return <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Payment receipt">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
      <div className="flex justify-between items-center gap-4"><h2 className="text-2xl font-bold text-slate-900">Payment receipt</h2><button autoFocus disabled={sending} onClick={() => setId(null)} className="px-3 py-2 rounded-lg border">Close</button></div>
      {error && <p role="alert" className="my-4 text-red-700">{error}</p>}
      {!receipt && !error && <p className="py-8">Loading receipt…</p>}
      {receipt && <>
        <div className="border border-cyan-800 rounded-xl my-5 p-5 space-y-4">
          <div className="flex justify-between gap-3 border-b border-amber-500 pb-4"><strong className="text-2xl text-blue-950">GROUTIX</strong><span className="text-teal-800 font-bold">PAYMENT RECEIVED</span></div>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            {[["Receipt no.", receipt.number], ["Date received", new Date(receipt.receivedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney" })], ["Invoice no.", receipt.invoiceNumber], ["Customer", receipt.customerName], ["Service address", receipt.address || "—"]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="font-semibold break-words">{value}</dd></div>)}
          </dl>
          <div className="bg-cyan-50 rounded-lg p-4"><p className="text-sm font-semibold text-cyan-900">AMOUNT RECEIVED</p><p className="text-3xl font-bold text-slate-900">AUD ${receipt.total.toFixed(2)}</p></div>
          <div className="flex justify-between text-sm"><span>Invoice total: ${receipt.total.toFixed(2)}</span><strong>Balance due: $0.00</strong></div>
          <p className="text-sm text-slate-600">This receipt confirms full payment to Groutix Pty Ltd. Thank you for choosing Groutix.</p>
        </div>
        <p className="text-sm text-slate-600 mb-4">{email ? `Email receipt to ${email}` : "Add a customer email address to send this receipt."}</p>
        {sent && <p role="status" className="text-green-700 mb-3">Receipt emailed successfully.</p>}
        <div className="flex flex-wrap gap-3"><a href={pdfUrl} target="_blank" rel="noreferrer" className="border rounded-lg px-4 py-2 font-semibold">View / download PDF</a><button disabled={sending || !email || sent} onClick={send} className="bg-blue-900 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50">{sending ? "Sending…" : sent ? "Receipt emailed" : "Email receipt"}</button></div>
      </>}
    </div>
  </div>;
}
