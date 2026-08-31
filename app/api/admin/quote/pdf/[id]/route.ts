import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Download/preview the branded quotation PDF for a lead. Auth is enforced by
// the /api/admin middleware guard. Uses the existing quote number if one has
// been minted, otherwise labels the document DRAFT (no number is consumed).
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const items = Array.isArray(lead.quoteItems) ? lead.quoteItems : [];
  const { subtotal, gst, total } = computeQuoteTotals(
    items,
    lead.quoteTaxMode,
    lead.quoteTaxRate ?? 10,
    lead.quoteAmount
  );

  const quoteNumber = lead.quoteNumber || "DRAFT";
  const base64 = await buildQuotePdfBase64({
    quoteNumber,
    date: new Date().toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    customerName: lead.name,
    address: lead.address,
    phone: lead.phone,
    email: lead.email,
    items,
    subtotal,
    gst,
    total,
    terms: lead.quoteTerms,
  });

  const bytes = Buffer.from(base64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Groutix_Quote_${quoteNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
