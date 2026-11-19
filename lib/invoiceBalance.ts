export function invoiceBalance(invoice: { invoiceAmount?: number; invoiceStatus?: string; amountPaid?: number; paymentReceipt?: { total?: number } }) {
  const totalCents = Math.round(Number(invoice.invoiceAmount || 0) * 100);
  // A receipt records an earlier payment, not automatic settlement of later add-ons.
  const paid = invoice.invoiceStatus === "Paid" ? invoice.invoiceAmount : invoice.amountPaid ?? invoice.paymentReceipt?.total ?? 0;
  const paidCents = Math.round(Number(paid || 0) * 100);
  return { totalCents, paidCents, remainingCents: Math.max(0, totalCents - paidCents) };
}
