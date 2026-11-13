import type { Lead } from "@/components/admin/types";
import { preferredCustomerQuote } from "./customerQuoteSelection";
import type { CustomerQuote } from "./customerQuotes";

const PAGE_SIZE = 500;
const CONCURRENCY = 3;

/** Load a complete dashboard snapshot without one oversized request or partial totals. */
export async function loadCrmLeads(signal: AbortSignal, view: "dashboard" | "inbox" = "dashboard"): Promise<Lead[]> {
  // Validate the complete result below: concurrent insertions/deletions must
  // never silently turn a partial page set into dashboard totals.
  const readPage = async (page: number) => {
    const params = new URLSearchParams({ view, page: String(page), pageSize: String(PAGE_SIZE) });
    const response = await fetch(`/api/admin/submissions?${params}`, { cache: "no-store", signal });
    if (response.status === 401) throw new Error("Your session has expired. Sign in again to load the CRM.");
    if (!response.ok) throw new Error("Could not load leads. Please retry.");
    const data = await response.json();
    if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total) || data.total < 0) {
      throw new Error("The CRM returned an incomplete response. Please retry.");
    }
    return data as { items: Lead[]; total: number };
  };
  const first = await readPage(1);
  const pageCount = Math.ceil(first.total / PAGE_SIZE);
  const pages: Lead[][] = [first.items];
  let nextPage = 2;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, Math.max(0, pageCount - 1)) }, async () => {
    while (!signal.aborted && nextPage <= pageCount) {
      const page = nextPage++;
      pages[page - 1] = (await readPage(page)).items;
    }
  }));
  signal.throwIfAborted();
  const items = pages.flat();
  if (items.length !== first.total || new Set(items.map(item => item.id)).size !== first.total) {
    throw new Error("Leads changed while loading. Please retry to refresh the complete dashboard.");
  }
  return items;
}

/** Used before opening an editor; dashboard summaries must never become saved documents. */
export async function loadLeadDetails(lead: Lead): Promise<Lead> {
  if (!lead.dashboardSummary) return lead;
  const response = await fetch(`/api/admin/submissions/${encodeURIComponent(lead.id)}`, {
    cache: "no-store", signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Sign in again." : "Could not load the lead details. Please retry.");
  const data = await response.json();
  if (!data.item || data.item.id !== lead.id) throw new Error("Could not load the lead details. Please retry.");
  return { ...data.item, ...(lead.activeBooking ? { activeBooking: lead.activeBooking } : {}) };
}

/** Fetch document text only after its panel is opened. */
export async function loadLeadScope(lead: Lead, preferCustomerQuote = false): Promise<Pick<Lead, "quoteItems" | "quoteScope" | "quoteTerms">> {
  const full = await loadLeadDetails(lead);
  if (preferCustomerQuote && lead.hasCustomerQuotes) {
    const response = await fetch(`/api/admin/customer-quotes/${encodeURIComponent(lead.id)}`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error("Could not load the saved scope. Please retry.");
    const data = await response.json();
    const quote = preferredCustomerQuote(data.quotes as CustomerQuote[], lead.quoteReference);
    if (quote) return { quoteItems: quote.values.quoteItems, quoteScope: quote.values.quoteScope, quoteTerms: quote.values.quoteTerms };
  }
  return { quoteItems: full.quoteItems, quoteScope: full.quoteScope, quoteTerms: full.quoteTerms };
}
