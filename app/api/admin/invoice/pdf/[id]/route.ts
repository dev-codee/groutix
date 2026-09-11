import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Download/preview the branded Tax Invoice PDF for a lead with custom or default payment details.
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const bankName = sp.get("bankName") || "ANZ";
  const accountName = sp.get("accountName") || "Groutix Pty Ltd";
  const accountNumber = sp.get("accountNumber") || "123456789";
  const bsb = sp.get("bsb") || "013442";
  const dueDate = sp.get("dueDate") || "within 7 days of invoice date";
  const overridePrice = sp.get("price") ? parseFloat(sp.get("price")!) : undefined;
  const overrideService = sp.get("service") || undefined;
  const overrideDesc = sp.get("description") || undefined;
  const overrideStatus = sp.get("status") || lead.invoiceStatus || "Unpaid";

  const price = overridePrice !== undefined && !isNaN(overridePrice) ? overridePrice : (lead.quoteAmount || 850);
  const service = overrideService || lead.service || "Regrouting & waterproof resealing";
  const description = overrideDesc !== undefined ? overrideDesc : (lead.quoteScope || lead.message || lead.issue || "");

  const items = [{ service, description, price, qty: 1 }];
  const { subtotal, gst, total } = computeQuoteTotals(
    items,
    lead.quoteTaxMode,
    lead.quoteTaxRate ?? 10,
    price
  );

  const invoiceNumber = lead.jobNo ? lead.jobNo.replace(/^(?:JOBNO|Job No)-/i, "INV-") : (lead.invoiceNumber || lead.quoteNumber || "INV-DRAFT");
  const jobDescription = description || service;

  const base64 = await buildQuotePdfBase64({
    docType: "invoice",
    statusLabel: overrideStatus,
    quoteNumber: invoiceNumber,
    date: new Date().toLocaleDateString("en-AU", {
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
    taxName: lead.quoteTaxMode === "none" ? "No Tax" : "GST (10%)",
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
