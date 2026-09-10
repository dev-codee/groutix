import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildWarrantyPdfBase64 } from "@/lib/warrantyPdf";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = (await getSubmission(id).catch(() => null)) || null;

  const sp = req.nextUrl.searchParams;

  const jobNo = sp.get("jobNo") || lead?.warranty?.jobNo || (lead ? `GX-${lead.id.slice(-6).toUpperCase()}` : "GX-WARRANTY");
  const completionDate = sp.get("completion") || lead?.warranty?.completionDate || new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  
  // Calculate 10-year expiry default if not given
  let defaultExpiry = lead?.warranty?.expiryDate;
  if (!defaultExpiry) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 10);
    defaultExpiry = d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  }
  const expiryDate = sp.get("expiry") || defaultExpiry;

  const customerName = sp.get("customer") || lead?.warranty?.customerName || lead?.name || "Customer";
  const address = sp.get("address") || lead?.warranty?.address || lead?.address || "";
  const authorisedBy = sp.get("authorised") || lead?.warranty?.authorisedBy || "GROUTIX PTY LTD";
  const dateIssued = sp.get("issued") || lead?.warranty?.dateIssued || new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });

  const base64 = await buildWarrantyPdfBase64({
    jobNo,
    completionDate,
    expiryDate,
    customerName,
    address,
    authorisedBy,
    dateIssued,
    phone: "70238094",
    email: "info@groutix.com",
    website: "www.groutix.com",
  });

  const bytes = Buffer.from(base64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Groutix_Warranty_${jobNo}.pdf"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
