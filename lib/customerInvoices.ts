import { getDb } from "./mongodb";
import { getSubmission, updateSubmission, appendActivity, getNextSequence, formatDocNumber, type SubmissionJSON, type SubmissionDoc, type ActivityEntry } from "./submissions";
import { listCustomerQuotes } from "./customerQuotes";
import { invoiceDraftForLead, invoiceChanges } from "./invoiceDraft";
import { computeQuoteTotals } from "./quotePdf";
import { receiptFromInvoice } from "./paymentReceipt";

// References keep existing invoice endpoints compatible without confusing a quote
// reference with an invoice reference. Mongo's unique _id makes creation idempotent.
export const invoiceLeadId = (id: string) => id.split("~invoice~")[0];
export const isCustomerInvoice = (id: string) => id.includes("~invoice~");
interface CustomerInvoice {
  _id: string;
  leadId: string;
  sourceQuoteId: string;
  sourceQuoteNumber?: string;
  sourceQuoteSnapshot: Record<string, unknown>;
  values: Partial<SubmissionDoc>;
  createdAt: string;
}
async function collection() { return (await getDb()).collection<CustomerInvoice>("customer_invoices"); }
const invoiceFields = ["invoiceDraft", "invoiceAmount", "invoiceNumber", "invoiceSentAt", "invoiceOpenedAt", "invoiceStatus", "qboInvoiceId", "qboSyncedAt", "qboError", "qboErrorAt", "paymentReceipt", "receiptSentAt", "amountPaid", "paymentType", "invoicePayments", "invoicePaymentVersion"] as const;

function invoiceView(lead: SubmissionJSON, doc: CustomerInvoice): SubmissionJSON {
  const base = { ...lead };
  for (const field of invoiceFields) delete base[field];
  const invoice = { ...base, ...doc.values, id: doc._id, sourceQuoteId: doc.sourceQuoteId, sourceQuoteNumber: doc.sourceQuoteNumber,
    invoiceParentId: doc.leadId, createdAt: lead.createdAt, status: doc.values.invoiceStatus === "Paid" || doc.values.paymentReceipt ? "Payment Received"
      : Number(doc.values.amountPaid) > 0 ? "Payment Pending" : doc.values.invoiceSentAt ? "Invoice Sent" : "Job Done" };
  if (invoice.invoiceDraft) invoice.invoiceDraft = invoiceDraftForLead(invoice);
  return invoice;
}
export async function getInvoiceSubmission(id: string): Promise<SubmissionJSON | null> {
  if (!isCustomerInvoice(id)) return getSubmission(id);
  const lead = await getSubmission(invoiceLeadId(id));
  if (!lead) return null;
  const doc = await (await collection()).findOne({ _id: id, leadId: lead.id });
  return doc ? invoiceView(lead, doc) : null;
}
export async function listCustomerInvoices(leadId: string) {
  const lead = await getSubmission(leadId);
  if (!lead) return null;
  const docs = await (await collection()).find({ leadId }).sort({ createdAt: 1, _id: 1 }).toArray();
  const legacy = { ...lead, invoiceStatus: lead.invoiceStatus || (lead.paymentReceipt || lead.paymentType === "full" || lead.status === "Payment Received" ? "Paid" : "Unpaid") };
  return [...(lead.invoiceNumber ? [legacy] : []), ...docs.map(doc => invoiceView(lead, doc))];
}
export async function createQuoteInvoice(leadId: string, quoteId: string): Promise<SubmissionJSON> {
  const lead = await getSubmission(leadId);
  if (!lead) throw new Error("Customer not found.");
  const quotes = await listCustomerQuotes(leadId);
  const quote = quotes?.find(item => item._id === quoteId);
  if (!quote) throw new Error("Quote not found for this customer.");
  // Recover an existing invoice even if the source quote has since been archived.
  const id = `${leadId}~invoice~${quoteId.slice(leadId.length + 1)}`;
  const col = await collection();
  const existing = await col.findOne({ _id: id, leadId });
  if (existing) return invoiceView(lead, existing);
  if (lead.invoiceNumber && (lead.quoteReference === quoteId || (!lead.quoteReference && quoteId === `${leadId}~original`))) return lead;
  if (quote.state !== "accepted") throw new Error("Only an accepted quote can be invoiced. Alternative and draft quotes must not be billed.");
  const source = quote.values;
  const rate = source.quoteTaxMode === "none" ? 0 : source.quoteTaxRate ?? 10;
  if (!Number.isFinite(rate) || rate < 0) throw new Error("The accepted quote has an invalid GST rate.");
  const items = source.quoteItems || [];
  const { total } = computeQuoteTotals(items, source.quoteTaxMode, rate, source.quoteAmount);
  if (!Number.isFinite(total) || total <= 0 || items.some(item => !Number.isFinite(Number(item.price || 0)) || Number(item.price || 0) < 0 || (item.qty !== undefined && (!Number.isFinite(item.qty) || item.qty <= 0)))) throw new Error("The accepted quote has invalid invoice amounts.");
  const draft = invoiceDraftForLead({ id, service: source.service, quoteScope: source.quoteScope, quoteAmount: total });
  draft.extraWork = ""; draft.extraCharge = 0; draft.gst = rate;
  // Allocate quoted rounding across the lines so PDF, email and QBO total agree.
  const rawTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  let allocated = 0, cumulativeRaw = 0;
  draft.lines = rawTotal > 0 ? items.map((item, index) => {
    cumulativeRaw += Number(item.price || 0) * Number(item.qty || 1);
    const target = index === items.length - 1 ? Math.round(total * 100) : Math.round(total * 100 * cumulativeRaw / rawTotal);
    const cents = target - allocated;
    allocated = target;
    return { description: [item.service || item.code, item.description || item.scope, `Quantity: ${item.qty || 1}`].filter(Boolean).join(" — "), amount: cents / 100 };
  }) : [{ description: source.quoteScope || source.service || "Quoted work", amount: total }];
  draft.description = "";
  const doc: CustomerInvoice = { _id: id, leadId, sourceQuoteId: quoteId, sourceQuoteNumber: source.quoteNumber,
    sourceQuoteSnapshot: { ...source }, createdAt: new Date().toISOString(), values: {
      invoiceDraft: draft, invoiceAmount: total, invoiceStatus: "Unpaid", invoiceNumber: formatDocNumber("GX-I", await getNextSequence("invoice")),
    } };
  try { await col.updateOne({ _id: id }, { $setOnInsert: doc }, { upsert: true }); }
  catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  const saved = await col.findOne({ _id: id, leadId });
  if (!saved) throw new Error("Could not create the invoice.");
  await refreshInvoiceSummary(leadId);
  return invoiceView(lead, saved);
}
export async function updateInvoiceSubmission(id: string, updates: Partial<SubmissionDoc>): Promise<boolean> {
  // Delivery and payment update the customer pipeline from all saved invoices.
  // Draft edits, open tracking and accounting sync must not advance it.
  const sent = updates.invoiceSentAt || (updates.invoiceDraft && (await getInvoiceSubmission(id))?.invoiceSentAt);
  const stage = updates.invoiceStatus === "Paid" || updates.invoiceStatus === "Partially Paid" ? true : sent ? "sent" as const : false;
  if (!isCustomerInvoice(id)) {
    const saved = await updateSubmission(id, updates);
    if (saved && (stage || (await getSubmission(id))?.customerInvoiceCount)) await refreshInvoiceSummary(id, stage);
    return saved;
  }
  const col = await collection();
  const doc = await col.findOne({ _id: id, leadId: invoiceLeadId(id) });
  if (!doc) return false;
  if (updates.invoiceDraft && updates.invoiceAmount !== undefined) {
    const current = await getInvoiceSubmission(id);
    if (!current) return false;
    invoiceChanges(current, { ...updates.invoiceDraft, price: updates.invoiceAmount, status: updates.invoiceStatus });
  }
  const set: Record<string, unknown> = {};
  for (const field of invoiceFields) if (updates[field] !== undefined) set[`values.${field}`] = updates[field];
  if (updates.invoiceStatus === "Paid" && !doc.values.paymentReceipt) {
    const lead = await getInvoiceSubmission(id);
    if (!lead) return false;
    set["values.paymentReceipt"] = receiptFromInvoice({ ...lead, ...updates });
  }
  // A recorded receipt is an immutable payment snapshot; reopening needs a credit workflow.
  if (updates.invoiceStatus && updates.invoiceStatus !== "Paid" && doc.values.paymentReceipt) throw new Error("This invoice has a payment receipt. Record a refund or credit before reopening it.");
  if (!Object.keys(set).length) return true;
  const result = await col.updateOne({ _id: id, leadId: doc.leadId,
    ...(updates.invoiceStatus && updates.invoiceStatus !== "Paid" ? { "values.paymentReceipt": { $exists: false } } : {}),
    ...(updates.invoiceDraft ? {
      "values.invoicePaymentVersion": doc.values.invoicePaymentVersion === undefined ? { $exists: false } : doc.values.invoicePaymentVersion,
      "values.invoiceSentAt": doc.values.invoiceSentAt === undefined ? { $exists: false } : doc.values.invoiceSentAt,
      "values.qboInvoiceId": doc.values.qboInvoiceId === undefined ? { $exists: false } : doc.values.qboInvoiceId,
    } : {}),
  }, { $set: set });
  if (result.matchedCount > 0) await refreshInvoiceSummary(doc.leadId, stage);
  return result.matchedCount > 0;
}
export async function appendInvoiceActivity(id: string, entry: ActivityEntry) {
  return appendActivity(invoiceLeadId(id), { ...entry, detail: `${isCustomerInvoice(id) ? `${id}: ` : ""}${entry.detail || ""}` });
}

export async function saveInvoiceCustomerId(id: string, qboCustomerId: string) {
  if (!await updateSubmission(invoiceLeadId(id), { qboCustomerId })) throw new Error("Could not save the QuickBooks customer link. Retry invoice sync.");
}

export async function refreshInvoiceSummary(leadId: string, updatePaymentStage: boolean | "sent" = false) {
  const invoices = await listCustomerInvoices(leadId);
  if (!invoices) return;
  const cents = (amount?: number) => Math.round(Number(amount || 0) * 100);
  const paid = (item: SubmissionJSON) => item.invoiceStatus === "Paid" || item.paymentReceipt ? cents(item.invoiceAmount) : cents(item.amountPaid);
  const outstanding = invoices.reduce((sum, item) => sum + Math.max(0, cents(item.invoiceAmount) - paid(item)), 0) / 100;
  const lead = updatePaymentStage ? await getSubmission(leadId) : null;
  const pending = updatePaymentStage === true || ["Payment Pending", "Payment Request", "Partial Payment"].includes(lead?.status || "")
    || invoices.some(item => paid(item) > 0 && paid(item) < cents(item.invoiceAmount));
  const saved = await updateSubmission(leadId, {
    ...(lead && invoices.length && !["Completed", "Warranty Sent", "Cancelled", "Lost"].includes(lead.status)
      ? { status: outstanding > 0 ? pending ? "Payment Pending" : "Invoice Sent" : "Payment Received" } : {}),
    customerInvoiceCount: invoices.length,
    customerInvoiceSyncedCount: invoices.filter(item => Boolean(item.qboInvoiceId)).length,
    customerInvoiceTotal: invoices.reduce((sum, item) => sum + cents(item.invoiceAmount), 0) / 100,
    customerInvoiceOutstanding: outstanding,
  });
  if (!saved) throw new Error("Could not save the customer's invoice status. Refresh and retry saving the invoice.");
}
