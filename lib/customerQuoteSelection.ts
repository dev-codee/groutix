import type { CustomerQuote } from "./customerQuotes";
import type { Lead } from "@/components/admin/types";

export function preferredCustomerQuote(quotes: CustomerQuote[], reference?: string): CustomerQuote | undefined {
  const selected = quotes.find(quote => quote._id === reference);
  return (selected?.state === "accepted" ? selected : undefined)
    || quotes.find(quote => quote.state === "accepted" && quote._id.endsWith("~original"))
    || quotes.find(quote => quote.state === "accepted")
    || selected || quotes.filter(quote => quote.state === "draft").at(-1) || quotes.at(-1);
}

export function customerQuoteLead(lead: Lead, quote: CustomerQuote): Lead {
  const base = { ...lead };
  // A draft must not inherit the original's signature, acceptance or total.
  for (const key of Object.keys(base)) if (key.startsWith("quote")) delete (base as unknown as Record<string, unknown>)[key];
  return { ...base, ...quote.values, id: lead.id } as Lead;
}
