import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";
import { DEFAULT_QUOTE_CONDITIONS, GROUTIX_OFFICIAL_TERMS } from "@/lib/serviceTemplates";
import { getMatchedQuoteItemsForLead } from "@/lib/serviceMatching";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Download/preview the branded quotation PDF for a lead. Auth is enforced by
// the /api/admin middleware guard. Uses the existing quote number if one has
// been minted, otherwise labels the document DRAFT (no number is consumed).
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  let items = Array.isArray(lead.quoteItems) && lead.quoteItems.length > 0 ? lead.quoteItems : [];
  if (sp.get("items")) {
    try {
      const parsed = JSON.parse(sp.get("items")!);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } catch {}
  }
  if (items.length === 0) {
    items = getMatchedQuoteItemsForLead(lead);
  }

  const { subtotal, gst, total } = computeQuoteTotals(
    items,
    lead.quoteTaxMode,
    lead.quoteTaxRate ?? 10,
    lead.quoteAmount
  );

  const quoteNumber = lead.jobNo ? lead.jobNo.replace(/^(?:JOBNO|Job No)-/i, "QT-") : (lead.quoteNumber || "DRAFT");
  const jobDescription =
    lead.quoteScope ||
    lead.message ||
    lead.issue ||
    (items[0]?.scope || items[0]?.description || "");

  const specialNotes =
    sp.get("notes") ||
    (lead.quoteTerms && lead.quoteTerms.length < 500 && !/^Groutix terms/i.test(lead.quoteTerms)
      ? lead.quoteTerms
      : DEFAULT_QUOTE_CONDITIONS);

  const isScope = sp.get("type") === "scope";
  const docType = isScope ? ("scope" as const) : ("quote" as const);
  const filename = isScope ? `Groutix_Scope_Of_Work_${quoteNumber}.pdf` : `Groutix_Quote_${quoteNumber}.pdf`;

  const base64 = await buildQuotePdfBase64({
    quoteNumber,
    docType,
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
    specialNotes,
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

  const bytes = Buffer.from(base64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
