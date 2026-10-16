/** Accepted commercial terms and signatures are immutable; invoices have their own amount. */
export const acceptedQuoteFields = [
  "quoteScope", "quoteItems", "quoteTaxMode", "quoteTaxRate", "quoteTerms", "quoteAmount", "quoteNumber", "quoteReference",
  "quoteAcceptedAt", "quoteDeclinedAt", "quoteSignedAt", "quoteSignature", "quoteSignedName", "quoteSignedIp",
] as const;

export function changesAcceptedQuote(current: Record<string, unknown>, updates: Record<string, unknown>): boolean {
  if (!current.quoteAcceptedAt && !current.quoteSignedAt) return false;
  return acceptedQuoteFields.some(key => key in updates && JSON.stringify(updates[key]) !== JSON.stringify(current[key]));
}
