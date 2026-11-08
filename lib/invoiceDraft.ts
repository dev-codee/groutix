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

type InvoiceLead = { paymentReceipt?: unknown; sourceQuoteId?: string; invoiceSentAt?: string; qboInvoiceId?: string; id: string; jobNo?: string; invoiceNumber?: string; invoiceAmount?: number; invoiceStatus?: string; invoiceDraft?: InvoiceDraft; quoteAmount?: number; service?: string; quoteScope?: string; notes?: string; message?: string; technicianNotes?: string; scopeNotes?: string; status?: string };
export function invoiceDraftForLead(lead: InvoiceLead): InvoiceDraft {
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
  if (lead.paymentReceipt && input.status === "Unpaid") throw new Error("This invoice has a payment receipt. Record a refund or credit before reopening it.");
  const total = Number(input.price), extraCharge = Number(input.extraCharge ?? 0), gstRate = Number(input.gst ?? 10);
  if (input.price == null || !Number.isFinite(total) || total <= 0 || !Number.isFinite(extraCharge) || extraCharge < 0 || extraCharge > total || !Number.isFinite(gstRate) || gstRate < 0) {
    throw new Error("Enter a valid invoice total greater than zero, a non-negative extra charge, and a valid GST rate.");
  }
  const defaults = invoiceDraftForLead(lead);
  const invoiceDraft: InvoiceDraft = {
    service: input.service ?? defaults.service, description: input.description ?? defaults.description,
    extraWork: input.extraWork ?? defaults.extraWork, extraCharge,
    basePrice: Math.round((total - extraCharge) * 100) / 100, gst: gstRate,
    bankName: input.bankName ?? defaults.bankName, accountName: input.accountName ?? defaults.accountName,
    accountNumber: invoiceAccountNumber(input.accountNumber ?? defaults.accountNumber), bsb: input.bsb ?? defaults.bsb, dueDate: input.dueDate ?? defaults.dueDate,
  };
  if (lead.sourceQuoteId || lead.invoiceSentAt || lead.qboInvoiceId) {
    const fields = ["service", "description", "extraWork", "extraCharge", "basePrice", "gst"] as const;
    if (fields.some(field => invoiceDraft[field] !== defaults[field])) throw new Error("This invoice’s commercial details are locked. Create a new accepted quote for additional work.");
    invoiceDraft.lines = defaults.lines;
  }
  return { invoiceDraft, invoiceAmount: Math.round(total * 100) / 100,
    invoiceNumber: lead.invoiceNumber || (lead.jobNo ? lead.jobNo.replace(/^(?:JOBNO|Job No)-/i, "INV-") : `INV-${lead.id.slice(-6).toUpperCase()}`),
    invoiceStatus: input.status === "Paid" ? "Paid" : "Unpaid" };
}
