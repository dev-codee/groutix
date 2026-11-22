export function invoiceBalance(invoice: { invoiceAmount?: number; invoiceStatus?: string; amountPaid?: number; paymentReceipt?: { total?: number } }) {
  const totalCents = Math.round(Number(invoice.invoiceAmount || 0) * 100);
  // A receipt records an earlier payment, not automatic settlement of later add-ons.
  const paid = invoice.invoiceStatus === "Paid" ? invoice.invoiceAmount : invoice.amountPaid ?? invoice.paymentReceipt?.total ?? 0;
  const paidCents = Math.round(Number(paid || 0) * 100);
  return { totalCents, paidCents, remainingCents: Math.max(0, totalCents - paidCents) };
}

export type InvoicePaymentStatus = "paid" | "partial" | "pending" | "unsent";
export function invoicePaymentStatus(invoice: {
  invoiceAmount?: number; invoiceStatus?: string; amountPaid?: number;
  paymentReceipt?: { total?: number }; invoiceSentAt?: string;
}): InvoicePaymentStatus {
  const balance = invoiceBalance(invoice);
  if (balance.totalCents > 0 && balance.remainingCents === 0) return "paid";
  if (balance.paidCents > 0) return "partial";
  return invoice.invoiceSentAt ? "pending" : "unsent";
}
