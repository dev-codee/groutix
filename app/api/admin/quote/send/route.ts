import { NextRequest, NextResponse } from "next/server";
import {
  getSubmission,
  updateSubmission,
  appendActivity,
  getNextSequence,
  formatDocNumber,
} from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { sendEmail, isEmailConfigured, wrapEmailHtml, getEmailLogoUrl, type EmailAttachment } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";
import { buildQuoteResponseUrl, buildQuoteSignUrl, buildQuoteSmsUrl, siteBaseUrl, signQuoteToken } from "@/lib/quoteToken";
import { DEFAULT_QUOTE_CONDITIONS, GROUTIX_OFFICIAL_TERMS } from "@/lib/serviceTemplates";

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";
// How long to wait before the first follow-up is due (days).
const FOLLOWUP_DAYS = Number(process.env.FOLLOWUP_DAYS || 2);

function esc(v: string) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const actor = session?.username || "staff";

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const lead = await getSubmission(body.id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "This lead has no email address." }, { status: 400 });

  // Automatic step: mint a sequential quote number the first time it's sent.
  const quoteNumber = lead.jobNo ? lead.jobNo.replace(/^(?:JOBNO|Job No)-/i, "QT-") : (lead.quoteNumber || formatDocNumber("GX-Q", await getNextSequence("quote")));

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

  const itemRows =
    items.length > 0
      ? items
          .map(
            (it) => `<tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;">
                <div style="font-weight:600;">${esc(it.service || it.description || "Service")}</div>
                ${it.scope && it.scope !== it.service ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">${esc(it.scope).replace(/\n/g, "<br/>")}</div>` : ""}
              </td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;text-align:center;">${it.qty || 1}</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;text-align:right;">$${Number(it.price || 0).toFixed(2)}</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;text-align:right;font-weight:600;">$${(Number(it.price || 0) * Number(it.qty || 1)).toFixed(2)}</td>
            </tr>`
          )
          .join("")
      : `<tr>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;">${esc(lead.service || "Regrouting & waterproof resealing")}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:center;">1</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;">$${total.toFixed(2)}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:600;">$${total.toFixed(2)}</td>
        </tr>`;

  // Public, HMAC-signed link to review and digitally sign the quote online
  const signUrl = buildQuoteSignUrl(body.id);
  const acceptUrl = buildQuoteResponseUrl(body.id, "accept");

  const html = `
    <p style="margin:0 0 24px;font-size:15px;color:#334155;">Hi ${esc(lead.name?.split(" ")[0] || "there")},</p>

    <p style="margin:0 0 32px;font-size:15px;color:#334155;">Please find your Groutix quotation <strong>${esc(quoteNumber)}</strong> attached to this email.</p>

    <!-- Tagline -->
    <div style="margin:0 0 32px;padding:24px;background:#001f97;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.3;">Don&apos;t Let It Cost You More.<br/>Get It Sorted Now!</p>
    </div>

    <!-- Review and sign button -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${signUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">Review &amp; Sign Quote</a>
        </td>
        <td>
          <a href="${siteBaseUrl()}/api/quote/pdf/${body.id}?token=${signQuoteToken(body.id)}" style="display:inline-block;background:#f8fafc;color:#001f97;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:10px;border:1px solid #001f97;">Download PDF</a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#64748b;">
      Questions about your quote? Call us on <a href="tel:70238094" style="color:#001f97;font-weight:700;text-decoration:none;">7023 8094</a>, visit <a href="https://groutix.com" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">groutix.com</a>, or simply reply to this email.
    </p>`;

  // Automatic step: generate a branded PDF quotation and attach it.
  const attachments: EmailAttachment[] = [];
  try {
    const pdfBase64 = await buildQuotePdfBase64({
      quoteNumber,
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
      taxName: lead.quoteTaxMode === "none" ? "No Tax" : "GST (10%)",
      specialNotes:
        lead.quoteTerms && lead.quoteTerms.length < 500 && !/^Groutix terms/i.test(lead.quoteTerms)
          ? lead.quoteTerms
          : DEFAULT_QUOTE_CONDITIONS,
      terms: GROUTIX_OFFICIAL_TERMS,
    });
    attachments.push({
      name: `Groutix_Quote_${quoteNumber}.pdf`,
      content: pdfBase64,
      contentType: "application/pdf",
    });
  } catch (err) {
    // A PDF failure must not block the quote email; send without it.
    console.error("quote PDF generation failed (sending without attachment):", err);
  }

  const logoUrl = await getEmailLogoUrl();
  try {
    await sendEmail({
      toEmail: lead.email,
      fromName: FROM_NAME,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Your Groutix Quotation ${quoteNumber} — AUD $${total.toFixed(2)}`,
      html: wrapEmailHtml(html, `Your Groutix quotation ${quoteNumber} is ready.`, logoUrl),
      attachments: attachments.length ? attachments : undefined,
    });
  } catch (err) {
    console.error("quote send failed:", err);
    return NextResponse.json({ error: "Could not send the quote email." }, { status: 502 });
  }

  // Automatic steps: record the send, set status, and start the follow-up clock.
  const now = new Date();
  const followUpNext = new Date(now.getTime() + FOLLOWUP_DAYS * 86400000).toISOString();
  await updateSubmission(body.id, {
    status: "Quote Sent",
    quoteNumber,
    quoteAmount: total,
    quoteUpdated: now.toISOString(),
    followUpStage: 0,
    followUpNext,
  });
  await appendActivity(body.id, {
    time: now.toISOString(),
    actor,
    action: "Quote emailed",
    detail: `${quoteNumber} to ${lead.email}`,
  });

  // Text customer that their quote is ready, with a short link straight to
  // the online accept page (strictly 1 credit GSM-7 — see buildQuoteSmsUrl).
  if (lead.phone) {
    const firstName = (lead.name || "there").trim().split(/\s+/)[0];
    const smsUrl = buildQuoteSmsUrl(body.id);
    await sendSms({
      to: lead.phone,
      body: `Groutix: Hi ${firstName}, your quote ${quoteNumber} ($${total.toFixed(2)}) is ready. Accept here: ${smsUrl}`,
    });
  }

  return NextResponse.json({ ok: true, quoteNumber, total });
}
