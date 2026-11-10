import type { SubmissionJSON } from "./submissions";

export function invoiceBalance(invoice: Pick<SubmissionJSON, "invoiceAmount" | "invoiceStatus" | "amountPaid" | "paymentReceipt">) {
  const totalCents = Math.round(Number(invoice.invoiceAmount || 0) * 100);
  const paidCents = invoice.invoiceStatus === "Paid" || invoice.paymentReceipt ? totalCents : Math.round(Number(invoice.amountPaid || 0) * 100);
  return { totalCents, paidCents, remainingCents: Math.max(0, totalCents - paidCents) };
}
