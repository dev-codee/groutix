import { invoiceChanges } from "@/lib/invoiceDraft";
import { NextRequest, NextResponse } from "next/server";
import { getInvoiceSubmission as getSubmission, updateInvoiceSubmission as updateSubmission, appendInvoiceActivity as appendActivity } from "@/lib/customerInvoices";
import { verifyRequestSession } from "@/lib/adminAuth";
import { sendEmail, isEmailConfigured, wrapEmailHtml, getEmailLogoUrl, type EmailAttachment } from "@/lib/email";
import { buildQuotePdfBase64 } from "@/lib/quotePdf";
import { invoiceTrackingPixel } from "@/lib/automations";
import { isQboConfigured } from "@/lib/quickbooks";
import { syncInvoiceToQuickbooks } from "@/lib/quickbooksInvoiceSync";

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

  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const actor = session.username || "staff";

  let body: {
    id?: string;
    service?: string;
    description?: string;
    extraWork?: string;
    extraCharge?: number;
    price?: number;
    gst?: number;
    status?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    bsb?: string;
    dueDate?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const lead = await getSubmission(body.id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (lead.hasCustomerQuotes && !lead.invoiceNumber && !lead.sourceQuoteId) return NextResponse.json({ error: "Select an accepted quote to create its invoice first." }, { status: 409 });
  if (!lead.email) return NextResponse.json({ error: "This lead has no email address." }, { status: 400 });

  // The modal treats the entered price as the GST-inclusive total, matching the
  // on-screen preview, so the emailed invoice always agrees with what staff saw.
  let savedInvoice;
  try { savedInvoice = invoiceChanges({ ...lead, id: body.id }, body); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
  const { invoiceDraft: draft, invoiceAmount: total, invoiceNumber, invoiceStatus: status } = savedInvoice;
  const gstRate = draft.gst;
  const subtotal = total / (1 + gstRate / 100);
  const gst = total - subtotal;
  const { service, description, extraWork, extraCharge, bankName, accountName, accountNumber, bsb, dueDate } = draft;
  const baseTotal = draft.basePrice;

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
            <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;text-align:right;vertical-align:top;">$${baseTotal.toFixed(2)}</td>
          </tr>
          ${extraWork || extraCharge > 0 ? `<tr>
            <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;">
              <div style="font-weight:600;">Additional Work</div>
              <div style="color:#64748b;font-size:13px;margin-top:4px;white-space:pre-wrap;">${esc(extraWork)}</div>
            </td>
            <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;text-align:right;vertical-align:top;">$${extraCharge.toFixed(2)}</td>
          </tr>` : ""}
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

    <p style="margin:0 0 16px;">Payment status: ${statusBadge}</p>

    <div style="margin:20px 0;padding:16px;border:1px solid #fca5a5;border-radius:8px;background:#fff5f5;font-size:13px;line-height:1.6;color:#1e293b;">
      <div style="font-weight:800;color:#0f172a;font-size:14px;margin-bottom:6px;">PAYMENT INFORMATION</div>
      <div>• Bank Name: <b>${esc(bankName)}</b></div>
      <div>• Account Name: <b>${esc(accountName)}</b></div>
      <div>• Account Number: <b>${esc(accountNumber)}</b></div>
      <div>• BSB: <b>${esc(bsb)}</b></div>
    </div>

    <div style="margin:20px 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;color:#64748b;line-height:1.5;">
      <div>• Payment is due ${esc(dueDate)}.</div>
      <div>• Access our Terms &amp; Conditions: <a href="https://groutix.com/terms-and-conditions/" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">https://groutix.com/terms-and-conditions/</a></div>
    </div>
    <p style="margin:20px 0 0;">Thank you for choosing Groutix. If you have any questions about this invoice, reply to this email, visit <a href="https://groutix.com" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">groutix.com</a>, or call us on <a href="tel:+61370238094" style="color:#001f97;font-weight:700;text-decoration:none;">(03) 7023 8094</a>.</p>
    ${invoiceTrackingPixel(body.id)}`;

  // Branded PDF invoice attachment (reuses the quote layout in invoice mode).
  const attachments: EmailAttachment[] = [];
  try {
    const pdfBase64 = await buildQuotePdfBase64({
      docType: "invoice",
      statusLabel: status,
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
      jobDescription: lead.sourceQuoteId ? description || service : lead.issue || lead.message || service,
      items: [
        { service, description, price: baseTotal, qty: 1 },
        ...(extraWork || extraCharge > 0 ? [{ service: "Additional Work", description: extraWork, price: extraCharge, qty: 1 }] : []),
      ],
      subtotal,
      gst,
      total,
      bankName,
      accountName,
      accountNumber,
      bsb,
      dueDate,
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

  const logoUrl = await getEmailLogoUrl();
  try {
    await sendEmail({
      toEmail: lead.email,
      fromName: FROM_NAME,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Your Groutix Tax Invoice ${invoiceNumber} — AUD $${total.toFixed(2)}`,
      html: wrapEmailHtml(html, `Your Groutix invoice ${invoiceNumber} is ready.`, logoUrl),
      attachments: attachments.length ? attachments : undefined,
    });
  } catch (err) {
    console.error("invoice send failed:", err);
    return NextResponse.json({ error: "Could not send the invoice email." }, { status: 502 });
  }

  const now = new Date().toISOString();
  try {
    const saved = await updateSubmission(body.id, {
      ...savedInvoice,
      invoiceNumber,
      invoiceSentAt: now,
      invoiceStatus: status,
      invoiceAmount: total,
    });
    if (!saved) throw new Error("Invoice save failed.");
  } catch (error) {
    console.error("Invoice delivery status save failed:", error);
    return NextResponse.json({ error: "The invoice email was sent, but the invoice status could not be saved. Please refresh and use Save Invoice before sending again." }, { status: 500 });
  }
  await appendActivity(body.id, {
    time: now,
    actor,
    action: "Invoice emailed",
    detail: `${invoiceNumber} to ${lead.email} (${status})`,
  });

  // Finish bookkeeping before the request ends; QBO failure never undoes email.
  if (isQboConfigured() && !lead.qboInvoiceId) {
    await syncInvoiceToQuickbooks({ ...lead, ...savedInvoice, id: body.id }, actor)
      .catch(error => { console.error("QBO invoice push failed:", error); });
  }

  const item = await getSubmission(body.id);
  const customer = item?.invoiceParentId ? await getSubmission(item.invoiceParentId) : item;
  return NextResponse.json({ ok: true, invoiceNumber, total, item, customer });
}
