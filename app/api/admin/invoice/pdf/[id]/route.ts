import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Download/preview the branded Tax Invoice PDF for a lead.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const items = Array.isArray(lead.quoteItems) && lead.quoteItems.length > 0
    ? lead.quoteItems
    : [{ service: lead.service || "Regrouting & waterproof resealing", description: "", price: lead.quoteAmount || 0, qty: 1 }];

  const { subtotal, gst, total } = computeQuoteTotals(
    items,
    lead.quoteTaxMode,
    lead.quoteTaxRate ?? 10,
    lead.quoteAmount
  );

  const invoiceNumber = lead.invoiceNumber || lead.quoteNumber || "INV-DRAFT";
  const jobDescription =
    lead.quoteScope ||
    lead.message ||
    lead.issue ||
    (items[0]?.scope || items[0]?.description || "");

  const base64 = await buildQuotePdfBase64({
    docType: "invoice",
    statusLabel: lead.invoiceStatus || "Unpaid",
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
