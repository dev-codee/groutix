/** Quote acceptance survives later booking, payment and completion stages. */
export const QUOTE_ACCEPTED_FILTER = "Quote Accepted";
export const QUOTE_WAITING_FILTER = "Quote waiting for approval";

type QuoteLead = {
  status?: string;
  quoteAcceptedAt?: string;
  quoteSignedAt?: string;
  quoteSignature?: string;
  acceptedCustomerQuoteCount?: number;
};

export function hasAcceptedQuote(lead: QuoteLead): boolean {
  return Boolean(lead.quoteAcceptedAt || lead.quoteSignedAt || lead.quoteSignature
    || (lead.acceptedCustomerQuoteCount || 0) > 0
    || ["won", "quote accepted"].includes(lead.status?.trim().toLowerCase() || ""));
}

export function isQuoteWaiting(lead: QuoteLead): boolean {
  return ["Quote Sent", "Negotiation"].includes(lead.status || "") && !hasAcceptedQuote(lead);
}

/** Used by both dashboard cards and their destination lead list. */
export function matchesQuoteStatusFilter(lead: QuoteLead, filter: string): boolean {
  return filter.split("|").some(status => status === QUOTE_ACCEPTED_FILTER ? hasAcceptedQuote(lead)
    : status === QUOTE_WAITING_FILTER ? isQuoteWaiting(lead) : lead.status === status);
}
