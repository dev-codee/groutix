import { NextRequest, NextResponse } from "next/server";
import { getSubmission, updateSubmission, appendActivity } from "@/lib/submissions";
import { verifyQuoteToken } from "@/lib/quoteToken";
import { buildBookingUrl } from "@/lib/bookingToken";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";
import { DEFAULT_QUOTE_CONDITIONS, GROUTIX_OFFICIAL_TERMS } from "@/lib/serviceTemplates";
import { sendEmail, EmailAttachment } from "@/lib/email";

export const runtime = "nodejs";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// GET: Safely fetch quote details for the customer signing screen
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id") || "";
  const token = searchParams.get("token");

  if (!id || !verifyQuoteToken(id, token)) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 401 });
  }

  const lead = await getSubmission(id);
  if (!lead) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  const quoteNumber = lead.quoteNumber || lead.jobNo || `JobNo-${lead.id.slice(-6).toUpperCase()}`;
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

  const bookingUrl = buildBookingUrl(id, "job");

  return NextResponse.json({
    ok: true,
    quote: {
      id: lead.id,
      quoteNumber,
      jobNo: lead.jobNo,
      name: lead.name || "",
      address: lead.address || "",
      phone: lead.phone || "",
      email: lead.email || "",
      service: lead.service || "Tile & Grout Restoration",
      jobDescription,
      items,
      subtotal,
      gst,
      total,
      status: lead.status,
      quoteAcceptedAt: lead.quoteAcceptedAt,
      quoteSignedAt: lead.quoteSignedAt,
      quoteSignature: lead.quoteSignature,
      quoteSignedName: lead.quoteSignedName,
      bookingUrl,
    },
  });
}

// POST: Sign, confirm, generate signed PDF, email copies, and update CRM
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, token, signatureDataUrl, signerName } = body || {};

    if (!id || !verifyQuoteToken(id, token)) {
      return NextResponse.json({ error: "Invalid or expired quote link." }, { status: 401 });
    }

    if (!signatureDataUrl || typeof signatureDataUrl !== "string") {
      return NextResponse.json({ error: "Signature is required to confirm the quote." }, { status: 400 });
    }

    const lead = await getSubmission(id);
    if (!lead) {
      return NextResponse.json({ error: "Quotation record not found." }, { status: 404 });
    }

    const quoteNumber = lead.quoteNumber || lead.jobNo || `JobNo-${lead.id.slice(-6).toUpperCase()}`;
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

    const now = new Date().toISOString();
    const clientIp = getClientIp(req);
    const resolvedSignerName = (signerName || lead.name || "Customer").trim();

    // 1. Update Lead in MongoDB
    await updateSubmission(id, {
      status: "Won",
      quoteAcceptedAt: now,
      quoteSignedAt: now,
      quoteSignature: signatureDataUrl,
      quoteSignedName: resolvedSignerName,
      quoteSignedIp: clientIp,
    });

    // 2. Log in CRM Activity Trail
    await appendActivity(id, {
      time: now,
      actor: "customer",
      action: "Quote digitally signed & accepted",
      detail: `Signed by ${resolvedSignerName} (${quoteNumber}) from IP ${clientIp}`,
    });

    // 3. Build Signed PDF with embedded signature image
    let signedPdfBase64: string | null = null;
    try {
      signedPdfBase64 = await buildQuotePdfBase64({
        quoteNumber,
        date: new Date().toLocaleDateString("en-AU", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        customerName: resolvedSignerName,
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
        customerSignatureImage: signatureDataUrl,
        customerSignedAt: new Date().toLocaleDateString("en-AU", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
    } catch (pdfErr) {
      console.error("Error generating signed quote PDF:", pdfErr);
    }

    // 4. Attachments for emails
    const attachments: EmailAttachment[] = [];
    if (signedPdfBase64) {
      attachments.push({
        name: `Groutix_Signed_Quote_${quoteNumber}.pdf`,
        content: signedPdfBase64,
        contentType: "application/pdf",
      });
    }

    const bookingUrl = buildBookingUrl(id, "job");

    // 5. Send confirmation email to Customer
    if (lead.email) {
      const customerHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;line-height:1.6;">
          <h2 style="color:#001f97;margin-bottom:8px;">Thank You for Choosing Groutix!</h2>
          <p>Hi ${resolvedSignerName},</p>
          <p>We have received your signed acceptance for quotation <strong>${quoteNumber}</strong>. A copy of your signed agreement is attached to this email for your records.</p>
          
          <div style="margin:24px 0;padding:16px 20px;background:#f8fafc;border-left:4px solid #16a34a;border-radius:6px;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">Quote Summary:</div>
            <div><strong>Job Ref:</strong> ${quoteNumber}</div>
            <div><strong>Amount:</strong> $${total.toFixed(2)} AUD (incl. GST)</div>
            <div><strong>Signed on:</strong> ${new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>

          <p style="font-weight:600;">Next Step: Select your preferred day and time for the job.</p>
          <div style="margin:24px 0;">
            <a href="${bookingUrl}" style="display:inline-block;background:#001f97;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">📅 Book My Job Day &amp; Time</a>
          </div>

          <p style="font-size:13px;color:#64748b;margin-top:32px;">If you have any questions or need to speak with our team, call us on <strong>1300 476 884</strong> or reply to this email.</p>
          <div style="font-weight:800;color:#001f97;margin-top:16px;">GROUTIX • Stay Sealed. Stay Smiling.</div>
        </div>
      `;

      sendEmail({
        toEmail: lead.email,
        subject: `Confirmed: Signed Quotation ${quoteNumber} — Groutix`,
        html: customerHtml,
        attachments,
      }).catch((e) => console.error("Customer sign email failed:", e));
    }

    // 6. Send alert email to Groutix Staff (info@groutix.com)
    const adminEmail = process.env.SMTP_USER || "info@groutix.com";
    const adminHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;line-height:1.6;">
        <h2 style="color:#16a34a;margin-bottom:8px;">🎉 Quote Signed &amp; Accepted!</h2>
        <p>Customer <strong>${resolvedSignerName}</strong> has digitally signed and accepted Quote <strong>${quoteNumber}</strong> online.</p>
        
        <div style="margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:14px;">
          <div><strong>Customer:</strong> ${resolvedSignerName}</div>
          <div><strong>Job No:</strong> ${quoteNumber}</div>
          <div><strong>Phone:</strong> ${lead.phone || "—"}</div>
          <div><strong>Email:</strong> ${lead.email || "—"}</div>
          <div><strong>Address:</strong> ${lead.address || "—"}</div>
          <div><strong>Total Value:</strong> $${total.toFixed(2)} AUD</div>
          <div><strong>Signed At:</strong> ${new Date().toLocaleString("en-AU")}</div>
          <div><strong>Signer IP:</strong> ${clientIp}</div>
        </div>

        <p>The signed agreement has been attached to this email and recorded in the Groutix CRM under <strong>Won</strong> leads.</p>
      </div>
    `;

    sendEmail({
      toEmail: adminEmail,
      subject: `🎉 Signed Quote Returned: ${quoteNumber} — ${resolvedSignerName}`,
      html: adminHtml,
      attachments,
    }).catch((e) => console.error("Admin sign notification failed:", e));

    return NextResponse.json({
      ok: true,
      quoteNumber,
      bookingUrl,
    });
  } catch (err: any) {
    console.error("Error signing quote:", err);
    return NextResponse.json({ error: err.message || "Failed to sign quote." }, { status: 500 });
  }
}
