import { invoiceChanges, invoiceDraftForLead } from "@/lib/invoiceDraft";
import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildQuotePdfBase64 } from "@/lib/quotePdf";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Download/preview the branded Tax Invoice PDF for a lead with custom or default payment details.
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const stored = invoiceDraftForLead({ ...lead, id });
  let invoice;
  try {
    invoice = invoiceChanges({ ...lead, id }, {
      service: sp.get("service") ?? stored.service, description: sp.get("description") ?? stored.description,
      extraWork: sp.get("extraWork") ?? stored.extraWork, extraCharge: Number(sp.get("extraCharge") ?? stored.extraCharge),
      price: Number(sp.get("price") ?? lead.invoiceAmount ?? (stored.basePrice + stored.extraCharge)),
      gst: Number(sp.get("gst") ?? stored.gst), status: sp.get("status") ?? lead.invoiceStatus,
      bankName: sp.get("bankName") ?? stored.bankName, accountName: sp.get("accountName") ?? stored.accountName,
      accountNumber: sp.get("accountNumber") ?? stored.accountNumber, bsb: sp.get("bsb") ?? stored.bsb, dueDate: sp.get("dueDate") ?? stored.dueDate,
    });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
  const { service, description, extraWork, extraCharge, bankName, accountName, accountNumber, bsb, dueDate } = invoice.invoiceDraft;
  const items = [{ service, description, price: invoice.invoiceDraft.basePrice, qty: 1 },
    ...(extraWork || extraCharge > 0 ? [{ service: "Additional Work", description: extraWork, price: extraCharge, qty: 1 }] : [])];
  const total = invoice.invoiceAmount;
  const subtotal = total / (1 + invoice.invoiceDraft.gst / 100);
  const gst = total - subtotal;
  const invoiceNumber = invoice.invoiceNumber;
  const jobDescription = description || service;

  const base64 = await buildQuotePdfBase64({
    docType: "invoice",
    statusLabel: invoice.invoiceStatus,
    quoteNumber: invoiceNumber,
    date: new Date().toLocaleDateString("en-AU", {
      timeZone: "Australia/Sydney",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    customerName: lead.name,
    address: lead.address,
    phone: lead.phone,
    email: lead.email,
    jobDescription,
    items,
    subtotal,
    gst,
    total,
    taxName: `GST (${invoice.invoiceDraft.gst}%)`,
    bankName,
    accountName,
    accountNumber,
    bsb,
    dueDate,
  });

  const bytes = Buffer.from(base64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Groutix_Invoice_${invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
