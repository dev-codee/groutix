import { NextRequest, NextResponse } from "next/server";
import { getSubmission, getNextSequence, formatDocNumber } from "@/lib/submissions";
import { verifyQuoteToken } from "@/lib/quoteToken";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";
import { DEFAULT_QUOTE_CONDITIONS, GROUTIX_OFFICIAL_TERMS } from "@/lib/serviceTemplates";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.nextUrl.searchParams.get("token");
  const { id } = await params;
  if (!verifyQuoteToken(id, token)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const lead = await getSubmission(id);
  if (!lead) return new NextResponse("Lead not found", { status: 404 });

  const quoteNumber = lead.jobNo ? lead.jobNo.replace(/^JOBNO-/i, "QT-") : (lead.quoteNumber || formatDocNumber("GX-Q", await getNextSequence("quote")));
  const items = Array.isArray(lead.quoteItems) ? lead.quoteItems : [];
  const { subtotal, gst, total } = computeQuoteTotals(
    items,
    lead.quoteTaxMode,
    lead.quoteTaxRate ?? 10,
    lead.quoteAmount
  );

  const jobDescription =
    lead.quoteScope ||
    lead.message ||
    lead.issue ||
    (items[0]?.scope || items[0]?.description || "");

  try {
    const pdfBase64 = await buildQuotePdfBase64({
      quoteNumber,
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
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
      specialNotes:
        lead.quoteTerms && lead.quoteTerms.length < 500 && !/^Groutix terms/i.test(lead.quoteTerms)
          ? lead.quoteTerms
          : DEFAULT_QUOTE_CONDITIONS,
      terms: GROUTIX_OFFICIAL_TERMS,
      customerSignatureImage: lead.quoteSignature,
      customerSignedAt: lead.quoteSignedAt
        ? new Date(lead.quoteSignedAt).toLocaleDateString("en-AU", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : undefined,
    });

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Groutix_Quote_${quoteNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
