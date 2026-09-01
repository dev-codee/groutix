import { NextRequest, NextResponse } from "next/server";
import { getSubmission, updateSubmission, appendActivity } from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { sendEmail, isEmailConfigured, wrapEmailHtml, type EmailAttachment } from "@/lib/email";
import { buildQuotePdfBase64 } from "@/lib/quotePdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";

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

  let body: {
    id?: string;
    service?: string;
    description?: string;
    price?: number;
    gst?: number;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const lead = await getSubmission(body.id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "This lead has no email address." }, { status: 400 });

  // The modal treats the entered price as the GST-inclusive total, matching the
  // on-screen preview, so the emailed invoice always agrees with what staff saw.
  const gstRate = Number(body.gst ?? 10);
  const total = Number(body.price || 0);
  const subtotal = total / (1 + gstRate / 100);
  const gst = total - subtotal;
  const service = body.service || lead.service || "Regrouting & waterproof resealing";
  const description = body.description || "";
  const status = body.status === "Paid" ? "Paid" : "Unpaid";

  // Deterministic invoice number so the preview and the emailed copy match.
  const invoiceNumber = lead.invoiceNumber || `INV-${body.id.slice(-6).toUpperCase()}`;

  const statusBadge =
    status === "Paid"
      ? `<span style="display:inline-block;padding:4px 12px;border-radius:9999px;background:#dcfce7;color:#15803d;font-weight:700;font-size:13px;">PAID</span>`
      : `<span style="display:inline-block;padding:4px 12px;border-radius:9999px;background:#fee2e2;color:#b91c1c;font-weight:700;font-size:13px;">UNPAID</span>`;

  const html = `
    <h2 style="margin:0 0 4px;color:#001f97;font-size:24px;">Your Groutix Tax Invoice</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Invoice ${esc(invoiceNumber)}</p>
    <p style="margin:0 0 16px;">Hi ${esc(lead.name || "there")}, please find your tax invoice below.</p>

    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:24px 0;">
      <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
        <thead>
          <tr>
            <th style="padding:12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;">Description</th>
            <th style="padding:12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;">
              <div style="font-weight:600;">${esc(service)}</div>
              ${description ? `<div style="color:#64748b;font-size:13px;margin-top:4px;white-space:pre-wrap;">${esc(description)}</div>` : ""}
            </td>
            <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;text-align:right;vertical-align:top;">$${total.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style="padding:8px 12px;color:#64748b;text-align:right;">Subtotal</td>
            <td style="padding:8px 12px;color:#334155;text-align:right;">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;text-align:right;">GST (${gstRate}%)</td>
            <td style="padding:8px 12px;color:#334155;text-align:right;">$${gst.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:16px 12px;font-weight:700;color:#0f172a;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:right;">Total (AUD)</td>
            <td style="padding:16px 12px;font-weight:700;color:#0f172a;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:right;">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <p style="margin:0 0 24px;">Payment status: ${statusBadge}</p>
    <p style="margin:24px 0 0;">Thank you for choosing Groutix. Reply to this email if you have any questions about this invoice.</p>`;

  // Branded PDF invoice attachment (reuses the quote layout in invoice mode).
  const attachments: EmailAttachment[] = [];
  try {
    const pdfBase64 = await buildQuotePdfBase64({
      docType: "invoice",
      statusLabel: status,
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
      items: [{ service, description, price: total, qty: 1 }],
      subtotal,
      gst,
      total,
    });
    attachments.push({
      name: `Groutix_Invoice_${invoiceNumber}.pdf`,
      content: pdfBase64,
      contentType: "application/pdf",
    });
  } catch (err) {
    // A PDF failure must not block the invoice email; send without it.
    console.error("invoice PDF generation failed (sending without attachment):", err);
  }

  try {
    await sendEmail({
      toEmail: lead.email,
      fromName: FROM_NAME,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Your Groutix Tax Invoice ${invoiceNumber} — AUD $${total.toFixed(2)}`,
      html: wrapEmailHtml(html, `Your Groutix invoice ${invoiceNumber} is ready.`),
      attachments: attachments.length ? attachments : undefined,
    });
  } catch (err) {
    console.error("invoice send failed:", err);
    return NextResponse.json({ error: "Could not send the invoice email." }, { status: 502 });
  }

  const now = new Date().toISOString();
  await updateSubmission(body.id, {
    invoiceNumber,
    invoiceSentAt: now,
    invoiceStatus: status,
    quoteAmount: total,
    // Marking an invoice Paid moves the lead into the finance "Payment Received"
    // stage; otherwise leave the stage where it is.
    ...(status === "Paid" ? { status: "Payment Received" } : {}),
  });
  await appendActivity(body.id, {
    time: now,
    actor,
    action: "Invoice emailed",
    detail: `${invoiceNumber} to ${lead.email} (${status})`,
  });

  return NextResponse.json({ ok: true, invoiceNumber, total });
}
