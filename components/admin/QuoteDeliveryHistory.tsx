"use client";

import { useEffect, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { CustomerQuote } from "@/lib/customerQuotes";
import { fmtDate } from "@/lib/adminHelpers";
import { quoteDeliveryTimes, quoteSendHistory } from "@/lib/quoteDelivery";
import { DocumentDeliveryStatus } from "./DocumentDeliveryStatus";
import type { Lead } from "./types";

export function SentQuoteHistory({ lead, quotes }: { lead: Lead; quotes: CustomerQuote[] }) {
  const sent = quotes.filter(quote => ["sent", "accepted", "declined"].includes(quote.state))
    .sort((a, b) => (b.values.quoteSentAt || b.createdAt).localeCompare(a.values.quoteSentAt || a.createdAt));
  const sends = quoteSendHistory(lead);
  return <div className="space-y-3">
    {sent.map(quote => <div key={quote._id} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[11px] font-bold text-slate-800">{quote.values.quoteNumber || quote.title}</span>
        <span className="text-[10px] capitalize text-slate-600">{quote.state}</span>
      </div>
      <p className="text-[10px] text-slate-500 break-words">{quote.title}</p>
      <DocumentDeliveryStatus label="Quote" sentAt={quote.values.quoteSentAt} openedAt={quote.values.quoteOpenedAt} />
      <a href={`/api/admin/quote/pdf/${lead.id}?quoteId=${encodeURIComponent(quote._id)}`} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 py-1 text-[11px] font-semibold text-blue-700 hover:underline">
        <FileText className="h-3 w-3" />View quote PDF
      </a>
    </div>)}
    {sends.length > 0 && <div className="space-y-2">
      <p className="text-[11px] font-bold text-slate-700">Send history</p>
      <ol className="space-y-2 border-l border-slate-200 pl-3">
        {sends.map(entry => <li key={`${entry.time}-${entry.detail || ""}`} className="text-[10px] text-slate-600">
          <p className="font-semibold">{fmtDate(entry.time)}</p>
          {entry.detail && <p className="break-words">{entry.detail}</p>}
        </li>)}
      </ol>
    </div>}
    {!sent.length && !sends.length && <p className="text-xs text-slate-500">No sent quotes recorded.</p>}
  </div>;
}

export function QuoteDeliveryHistory({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<{ key: string; quotes: CustomerQuote[]; error: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const times = quoteDeliveryTimes(lead);
  const key = JSON.stringify([lead.id, lead.quoteSentAt, lead.quoteOpenedAt, retry, expanded]);
  const loading = expanded && result?.key !== key;
  const quotes = result?.key === key ? result.quotes : [];
  const error = result?.key === key ? result.error : "";
  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    fetch(`/api/admin/customer-quotes/${lead.id}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error("Could not load saved quotes.");
        return data.quotes as CustomerQuote[];
      })
      .then(items => { if (!controller.signal.aborted) setResult({ key, quotes: items, error: "" }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ key, quotes: [], error: "Could not load saved quotes." }); });
    return () => controller.abort();
  }, [expanded, lead.id, key]);

  if (!times.sentAt && !times.openedAt && !lead.hasCustomerQuotes) return null;
  return <div className="space-y-1.5">
    <DocumentDeliveryStatus label="Quote" {...times} />
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50">
      <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
      {expanded ? "Hide quote history" : "View quote history"}
    </button>
    {expanded && <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
      {loading && <p role="status" className="text-xs text-slate-500">Loading saved quotes…</p>}
      {error && <div role="alert" className="text-xs text-red-700">{error} <button type="button" onClick={() => setRetry(value => value + 1)} className="font-semibold underline">Retry</button></div>}
      {(!loading || quoteSendHistory(lead).length > 0) && <SentQuoteHistory lead={lead} quotes={quotes} />}
    </div>}
  </div>;
}
