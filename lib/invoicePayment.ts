/** Shared fallback for invoice previews, emails, and PDFs. */
export const DEFAULT_INVOICE_ACCOUNT_NUMBER = "669909988";

export function invoiceAccountNumber(value?: string | null): string {
  return value?.replace(/\s+/g, "") || DEFAULT_INVOICE_ACCOUNT_NUMBER;
}
