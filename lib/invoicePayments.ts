import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { getInvoiceSubmission, isCustomerInvoice, invoiceLeadId, refreshInvoiceSummary, appendInvoiceActivity } from "./customerInvoices";
import { receiptFromInvoice } from "./paymentReceipt";
import { invoiceBalance } from "./invoiceBalance";

export interface InvoicePaymentRecord { requestId: string; type: "full" | "partial"; amountCents: number; requestedAmount?: number; receivedAt: string; actor: string }
export class InvoicePaymentError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function recordInvoicePayment(id: string, input: { type: "full" | "partial"; amount?: number; requestId: string; expectedPaidCents: number }, actor: string) {
  if (!id || !["full", "partial"].includes(input.type) || !/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId || "") || !Number.isSafeInteger(input.expectedPaidCents) || input.expectedPaidCents < 0) throw new InvoicePaymentError("Invalid payment request.");
  if (!isCustomerInvoice(id) && !ObjectId.isValid(id)) throw new InvoicePaymentError("Invalid invoice reference.");
  const invoice = await getInvoiceSubmission(id);
  if (!invoice?.invoiceNumber || !Number.isFinite(invoice.invoiceAmount) || Number(invoice.invoiceAmount) <= 0) throw new InvoicePaymentError("Save an invoice with a valid total before recording payment.");
  const existing = invoice.invoicePayments?.find(payment => payment.requestId === input.requestId);
  if (existing) {
    if (existing.type !== input.type || existing.requestedAmount !== input.amount) throw new InvoicePaymentError("This payment request was already used with different details.", 409);
    await refreshInvoiceSummary(invoiceLeadId(id), true);
    return { item: invoice, alreadyRecorded: true };
  }
  const { totalCents, paidCents, remainingCents } = invoiceBalance(invoice);
  if (!Number.isSafeInteger(totalCents) || !Number.isSafeInteger(paidCents) || paidCents < 0 || paidCents > totalCents) throw new InvoicePaymentError("The saved invoice balance is invalid. Check the invoice before recording payment.");
  if (paidCents !== input.expectedPaidCents) throw new InvoicePaymentError("The invoice balance changed. Refresh and check the remaining balance before recording payment.", 409);
  if (!remainingCents) throw new InvoicePaymentError("This invoice is already paid in full.", 409);
  const amountCents = input.type === "full" ? remainingCents : Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(input.amount ?? 0) || (input.type === "partial" && Math.abs(Number(input.amount) * 100 - amountCents) > 0.000001) || !Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > remainingCents) throw new InvoicePaymentError("Enter a payment greater than zero and no more than the outstanding balance, with up to two decimal places.");
  const now = new Date().toISOString(), nextPaid = paidCents + amountCents, settled = nextPaid === totalCents;
  const updates = { amountPaid: nextPaid / 100, paymentType: settled ? "full" : "partial", invoiceStatus: settled ? "Paid" : "Partially Paid", invoicePaymentVersion: (invoice.invoicePaymentVersion || 0) + 1,
    ...(settled ? { paymentReceipt: invoice.paymentReceipt || receiptFromInvoice(invoice) } : {}) };
  const record: InvoicePaymentRecord = { requestId: input.requestId, type: input.type, amountCents, ...(input.amount !== undefined ? { requestedAmount: input.amount } : {}), receivedAt: now, actor };
  const separate = isCustomerInvoice(id), prefix = separate ? "values." : "";
  const filter: Record<string, unknown> = { _id: separate ? id : new ObjectId(id) };
  for (const key of ["invoicePaymentVersion", "amountPaid", "invoiceStatus", "invoiceAmount"] as const) filter[`${prefix}${key}`] = invoice[key] === undefined ? { $exists: false } : invoice[key];
  const set = Object.fromEntries(Object.entries(updates).map(([key, value]) => [`${prefix}${key}`, value]));
  const db = await getDb();
  const saved = await db.collection(separate ? "customer_invoices" : "submissions").updateOne(filter, { $set: set, $push: { [`${prefix}invoicePayments`]: record } } as import("mongodb").UpdateFilter<import("mongodb").Document>);
  if (!saved.matchedCount) throw new InvoicePaymentError("The invoice balance changed. Refresh before recording payment again.", 409);
  await refreshInvoiceSummary(invoiceLeadId(id), true);
  await appendInvoiceActivity(id, { time: now, actor, action: settled ? "Invoice paid in full" : "Partial invoice payment received", detail: `${invoice.invoiceNumber}: AUD $${(amountCents / 100).toFixed(2)} received; AUD $${((totalCents - nextPaid) / 100).toFixed(2)} outstanding` });
  return { item: await getInvoiceSubmission(id), alreadyRecorded: false };
}
