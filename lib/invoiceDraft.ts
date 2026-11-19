import { invoiceBalance } from "./invoiceBalance";
import { invoiceNumberForJob } from "./documentNumbers";
import { invoiceAccountNumber } from "./invoicePayment";

export interface InvoiceDraft {
  lines?: { description: string; amount: number }[];
  service: string;
  description: string;
  extraWork: string;
  extraCharge: number;
  basePrice: number;
  gst: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bsb: string;
  dueDate: string;
}

type InvoiceLead = { amountPaid?: number; sourceQuoteNumber?: string; paymentReceipt?: { total?: number }; sourceQuoteId?: string; invoiceSentAt?: string; qboInvoiceId?: string; id: string; jobNo?: string; invoiceNumber?: string; invoiceAmount?: number; invoiceStatus?: string; invoiceDraft?: InvoiceDraft; quoteAmount?: number; service?: string; quoteScope?: string; notes?: string; message?: string; technicianNotes?: string; scopeNotes?: string; status?: string };
export function invoiceDraftForLead(lead: InvoiceLead): InvoiceDraft {
  // Older quote invoices stored the entire scope here. Present a short summary
  // for those too; the source snapshot and allocated lines stay available internally.
  if (lead.invoiceDraft && lead.sourceQuoteId) return {
    ...lead.invoiceDraft, description: "",
  };
  return lead.invoiceDraft ?? {
    service: lead.service || "Complete Shower Regrouting & Waterproof Resealing",
    description: lead.quoteScope || lead.notes || lead.message || "• Full removal of failed grout\n• Chemical cleaning and substrate prep\n• Regrouting with commercial epoxy grout\n• Sanitary mould-resistant silicone joints",
    extraWork: lead.technicianNotes || lead.scopeNotes || "", extraCharge: 0,
    basePrice: lead.invoiceAmount ?? lead.quoteAmount ?? 850, gst: 10,
    bankName: "ANZ", accountName: "Groutix Pty Ltd", accountNumber: invoiceAccountNumber(), bsb: "013442", dueDate: "Within 7 days of invoice date",
  };
}

export interface InvoiceInput {
  service?: string; description?: string; extraWork?: string; extraCharge?: number;
  price?: number; gst?: number; status?: string; bankName?: string; accountName?: string;
  accountNumber?: string; bsb?: string; dueDate?: string;
}

/** The entered invoice total includes GST and any additional work. */
export function invoiceChanges(lead: InvoiceLead, input: InvoiceInput) {
  const desiredStatus = input.status ?? lead.invoiceStatus ?? "Unpaid";
  const defaults = invoiceDraftForLead(lead);
  const total = Number(input.price), extraCharge = Number(input.extraCharge ?? defaults.extraCharge), gstRate = Number(input.gst ?? defaults.gst);
  if (input.price == null || !Number.isFinite(total) || total <= 0 || !Number.isFinite(extraCharge) || extraCharge < 0 || extraCharge > total || !Number.isFinite(gstRate) || gstRate < 0) {
    throw new Error("Enter a valid invoice total greater than zero, a non-negative extra charge, and a valid GST rate.");
  }
  const invoiceDraft: InvoiceDraft = {
    service: input.service ?? defaults.service, description: input.description ?? defaults.description,
    extraWork: input.extraWork ?? defaults.extraWork, extraCharge,
    basePrice: Math.round((total - extraCharge) * 100) / 100, gst: gstRate,
    bankName: input.bankName ?? defaults.bankName, accountName: input.accountName ?? defaults.accountName,
    accountNumber: invoiceAccountNumber(input.accountNumber ?? defaults.accountNumber), bsb: input.bsb ?? defaults.bsb, dueDate: input.dueDate ?? defaults.dueDate,
  };
  if (lead.sourceQuoteId || lead.invoiceSentAt || lead.qboInvoiceId || lead.paymentReceipt || lead.invoiceStatus === "Paid" || Number(lead.amountPaid || 0) > 0) {
    const fields: (keyof InvoiceDraft)[] = ["service", "description", "basePrice", "gst"];
    if (lead.qboInvoiceId) fields.push("extraCharge");
    if (fields.some(field => invoiceDraft[field] !== defaults[field])) throw new Error("This invoice’s commercial details are locked. Create a new accepted quote for additional work.");
    invoiceDraft.lines = defaults.lines;
  }
  const { paidCents } = invoiceBalance(lead);
  const totalCents = Math.round(total * 100);
  if (paidCents > totalCents) throw new Error("The invoice total cannot be less than payments already received. Record a refund or credit first.");
  if (lead.paymentReceipt && desiredStatus === "Unpaid") throw new Error("This invoice has a payment receipt. Record a refund or credit before reopening it.");
  const preservePayments = !!lead.paymentReceipt || (paidCents > 0 && totalCents !== Math.round(Number(lead.invoiceAmount || 0) * 100));
  return { ...(preservePayments ? { amountPaid: paidCents / 100, paymentType: paidCents >= totalCents ? "full" as const : "partial" as const } : {}), invoiceDraft, invoiceAmount: Math.round(total * 100) / 100,
    invoiceNumber: invoiceNumberForJob(lead),
    invoiceStatus: preservePayments ? paidCents >= totalCents ? "Paid" : "Partially Paid" : desiredStatus === "Paid" ? "Paid" : paidCents > 0 ? "Partially Paid" : "Unpaid" };
}
