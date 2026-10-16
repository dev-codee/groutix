import { changesAcceptedQuote } from "./quoteIntegrity";
import { randomUUID } from "node:crypto";
import { getDb } from "./mongodb";
import { getSubmission, updateSubmission, appendActivity, getNextSequence, formatDocNumber, type SubmissionDoc, type SubmissionJSON } from "./submissions";
import { quoteDeliveryTimes } from "./quoteDelivery";

const valueFields = ["quoteScope", "quoteItems", "quoteTaxMode", "quoteTaxRate", "quoteTerms", "quoteAmount", "quoteUpdated",
  "name", "phone", "email", "address", "customerType", "agency", "tenants", "service",
  "quoteNumber", "quoteSentAt", "quoteOpenedAt", "quoteAcceptedAt", "quoteDeclinedAt", "quoteSignedAt", "quoteSignature", "quoteSignedName", "quoteSignedIp"] as const;
type QuoteValues = Partial<Pick<SubmissionDoc, typeof valueFields[number]>>;
export interface CustomerQuote {
  _id: string;
  leadId: string;
  title: string;
  state: "draft" | "sending" | "sent" | "accepted" | "declined" | "deleted";
  values: QuoteValues;
  createdAt: string;
  updatedAt: string;
  sendStartedAt?: string;
  deletedAt?: string;
}

function valuesFrom(source: QuoteValues): QuoteValues {
  const values: Record<string, unknown> = {};
  for (const field of valueFields) if (source[field] !== undefined) values[field] = source[field];
  return values as QuoteValues;
}
export const quoteLeadId = (reference: string) => reference.split("~")[0];
const originalReference = (id: string) => `${id}~original`;
async function collection() { return (await getDb()).collection<CustomerQuote>("customer_quotes"); }

/** Preserve the existing quote once, including all links already sent to it. */
export async function listCustomerQuotes(leadId: string): Promise<CustomerQuote[] | null> {
  const lead = await getSubmission(leadId);
  if (!lead) return null;
  const col = await collection();
  const now = new Date().toISOString();
  const sentAt = quoteDeliveryTimes(lead).sentAt;
  await col.updateOne({ _id: originalReference(leadId) }, { $setOnInsert: {
    leadId, title: "Original quote", state: lead.quoteSignedAt || lead.quoteAcceptedAt ? "accepted" : lead.quoteDeclinedAt ? "declined" : sentAt || ["Quote Sent", "Negotiation"].includes(lead.status || "") ? "sent" : "draft",
    values: { ...valuesFrom(lead), ...(sentAt ? { quoteSentAt: sentAt } : {}), quoteNumber: lead.quoteNumber || (lead.jobNo ? lead.jobNo.replace(/^(?:JOBNO|Job No)-/i, "QT-") : undefined) },
    createdAt: now, updatedAt: now,
  } }, { upsert: true });
  return col.find({ leadId, state: { $ne: "deleted" } }).sort({ createdAt: 1, _id: 1 }).toArray();
}

export async function createCustomerQuote(leadId: string, copyId?: string): Promise<CustomerQuote | null> {
  const list = await listCustomerQuotes(leadId);
  if (!list) return null;
  const lead = await getSubmission(leadId);
  if (!lead) return null;
  const copy = copyId ? list.find(quote => quote._id === copyId) : undefined;
  if (copyId && !copy) throw new Error("Quote not found for this customer.");
  const source = copy?.values || valuesFrom(lead);
  const values = valuesFrom(source);
  for (const field of ["quoteSentAt", "quoteOpenedAt", "quoteAcceptedAt", "quoteDeclinedAt", "quoteSignedAt", "quoteSignature", "quoteSignedName", "quoteSignedIp"] as const) delete values[field];
  if (!copy) {
    values.quoteItems = []; values.quoteScope = ""; values.quoteAmount = 0;
    values.quoteTerms = ""; values.quoteTaxMode = "inclusive"; values.quoteTaxRate = 10;
  }
  values.quoteNumber = formatDocNumber("GX-Q", await getNextSequence("quote"));
  const now = new Date().toISOString();
  const quote: CustomerQuote = { _id: `${leadId}~${randomUUID()}`, leadId,
    title: copy ? `${copy.title} (copy)`.slice(0, 120) : `Quote ${list.length + 1}`, state: "draft", values, createdAt: now, updatedAt: now };
  await (await collection()).insertOne(quote);
  await updateSubmission(leadId, { hasCustomerQuotes: true });
  return quote;
}

export async function saveCustomerQuote(leadId: string, reference: string, updates: Partial<SubmissionDoc>, title?: string): Promise<boolean> {
  const col = await collection();
  const quote = await col.findOne({ _id: reference, leadId });
  if (!quote || quote.state !== "draft") return false;
  // Delivery and signature state is managed exclusively by the send/sign routes.
  const values = valuesFrom(updates);
  for (const field of ["quoteNumber", "quoteSentAt", "quoteOpenedAt", "quoteAcceptedAt", "quoteDeclinedAt", "quoteSignedAt", "quoteSignature", "quoteSignedName", "quoteSignedIp"] as const) delete values[field];
  const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [field, value] of Object.entries(values)) set[`values.${field}`] = value;
  if (title !== undefined) set.title = title.trim().slice(0, 120) || "Untitled quote";
  const result = await col.updateOne({ _id: reference, leadId, state: "draft" }, { $set: set });
  if (result.matchedCount) await updateSubmission(leadId, { hasCustomerQuotes: true });
  return result.matchedCount > 0;
}

/** Keep a tombstone so legacy quote links cannot resolve or be imported again. */
export async function deleteCustomerQuote(leadId: string, reference: string): Promise<boolean> {
  const col = await collection();
  const result = await col.updateOne({ _id: reference, leadId, state: { $in: ["draft", "sent", "accepted", "declined"] } },
    { $set: { state: "deleted", deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
  if (!result.matchedCount) return false;
  const remaining = await col.countDocuments({ leadId, state: { $ne: "deleted" } });
  await updateSubmission(leadId, { hasCustomerQuotes: remaining > 0 });
  await appendActivity(leadId, { time: new Date().toISOString(), actor: "staff", action: "Quote deleted", detail: reference });
  return true;
}

export async function getQuoteSubmission(reference: string, allowDraft = false): Promise<SubmissionJSON | null> {
  const leadId = quoteLeadId(reference);
  const lead = await getSubmission(leadId);
  if (!lead) return null;
  const quote = await (await collection()).findOne({ _id: reference.includes("~") ? reference : originalReference(leadId), leadId });
  if (!quote) return reference.includes("~") ? null : lead;
  if (quote.state === "deleted") return null;
  if (!allowDraft && (quote.state === "draft" || quote.state === "sending")) return null;
  // Never inherit a signature, total or response belonging to a different quote.
  const base = { ...lead };
  for (const field of valueFields) delete base[field];
  return { ...base, ...quote.values, id: reference, status: quote.state === "accepted" ? "Won" : quote.state === "declined" ? "Lost" : "Quote Sent" };
}

export async function updateQuoteSubmission(reference: string, updates: Partial<SubmissionDoc>): Promise<boolean> {
  const leadId = quoteLeadId(reference);
  const col = await collection();
  const quote = await col.findOne({ _id: reference.includes("~") ? reference : originalReference(leadId), leadId });
  if (!quote) return reference.includes("~") ? false : updateSubmission(leadId, updates);
  if (quote.state === "deleted") return false;
  if (quote.state === "accepted" && (updates.quoteAcceptedAt || updates.quoteSignedAt)) return true;
  if (quote.state === "accepted" && updates.quoteDeclinedAt) return false;
  if (!updates.quoteSentAt && changesAcceptedQuote(quote.values, updates as Record<string, unknown>)) return false;
  const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [field, value] of Object.entries(valuesFrom(updates))) {
    // Sending again updates delivery metadata, never the saved commercial terms.
    if (updates.quoteSentAt && ["sent", "accepted", "declined"].includes(quote.state) && !["quoteSentAt", "quoteUpdated"].includes(field)) continue;
    set[`values.${field}`] = value;
  }
  if (updates.quoteSignedAt || updates.quoteAcceptedAt) set.state = "accepted";
  else if (updates.quoteDeclinedAt) set.state = "declined";
  else if (updates.quoteSentAt && quote.state !== "accepted" && quote.state !== "declined") set.state = "sent";
  const result = await col.updateOne({ _id: quote._id, leadId, state: quote.state }, { $set: set });
  if (!result.matchedCount) return false;
  // Publish quote state separately; preserve an already accepted working quote.
  if (updates.quoteSentAt || updates.quoteAcceptedAt || updates.quoteSignedAt) {
    if (updates.quoteSentAt && (quote.state === "accepted" || quote.state === "declined")) return true;
    const workingLead = await getSubmission(leadId);
    // Sending/accepting another option cannot silently replace the agreed job quote.
    if (workingLead?.quoteAcceptedAt || workingLead?.quoteSignedAt) return true;
    return updateSubmission(leadId, { quoteOpenedAt: "", quoteAcceptedAt: "", quoteDeclinedAt: "", quoteSignedAt: "", quoteSignature: "", quoteSignedName: "", quoteSignedIp: "",
      ...quote.values, ...updates, quoteReference: quote._id });
  }
  if (updates.quoteDeclinedAt) {
    // Declining one option does not close the customer's other quotes or job.
    const alternatives = await col.countDocuments({ leadId, _id: { $ne: quote._id }, state: { $in: ["sent", "accepted"] } });
    if (!alternatives) return updateSubmission(leadId, updates);
  }
  if (updates.quoteOpenedAt) {
    const lead = await getSubmission(leadId);
    if (lead?.quoteReference === quote._id || !reference.includes("~") && !lead?.quoteReference) await updateSubmission(leadId, { quoteOpenedAt: updates.quoteOpenedAt });
  }
  return true;
}

/** Freeze the document while email/PDF generation is in progress. */
export async function reserveCustomerQuoteSend(reference: string): Promise<boolean> {
  const col = await collection();
  const id = reference.includes("~") ? reference : originalReference(reference);
  const quote = await col.findOne({ _id: id });
  if (!quote || quote.state === "deleted") return false;
  if (quote.state === "sending" && (!quote.sendStartedAt || Date.parse(quote.sendStartedAt) > Date.now() - 5 * 60_000)) return false;
  if (quote.state !== "draft" && quote.state !== "sending") return true;
  const result = await col.updateOne({ _id: id, state: quote.state, ...(quote.state === "sending" ? { sendStartedAt: quote.sendStartedAt } : {}) }, { $set: { state: "sending", sendStartedAt: new Date().toISOString() } });
  return result.matchedCount > 0;
}

export async function releaseCustomerQuoteSend(reference: string) {
  await (await collection()).updateOne({ _id: reference.includes("~") ? reference : originalReference(reference), state: "sending" }, { $set: { state: "draft" } });
}

export async function appendQuoteActivity(reference: string, entry: Parameters<typeof appendActivity>[1]) {
  return appendActivity(quoteLeadId(reference), entry);
}
