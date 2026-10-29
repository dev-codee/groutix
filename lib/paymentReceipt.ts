export interface PaymentReceipt {
  number: string;
  invoiceNumber: string;
  receivedAt: string;
  customerName: string;
  address: string;
  total: number;
}

export function receiptFromInvoice(lead: { id: string; invoiceNumber?: string; invoiceAmount?: number; name?: string; address?: string }): PaymentReceipt {
  if (!lead.invoiceNumber || !Number.isFinite(lead.invoiceAmount) || Number(lead.invoiceAmount) <= 0) {
    throw new Error("Please save/send an invoice with a valid total before recording full payment.");
  }
  return { number: `RCT-${lead.id.toUpperCase()}`, invoiceNumber: lead.invoiceNumber,
    receivedAt: new Date().toISOString(), customerName: lead.name || "Customer",
    address: lead.address || "", total: Number(lead.invoiceAmount) };
}
