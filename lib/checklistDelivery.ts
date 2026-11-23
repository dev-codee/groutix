// Checklist email delivery + lifecycle tracking.
//
// The website quote confirmation includes the checklist invitation. Staff can
// also resend the checklist on its own. The invitation carries a tracking pixel
// so the CRM can show when it was opened.

import { getSubmission, updateSubmission, appendActivity } from "./submissions";
import { buildChecklistUrl, checklistTrackingPixel, type ChecklistAnswers } from "./checklist";
import { sendEmail, wrapEmailHtml, getEmailLogoUrl } from "./email";

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";

export function checklistInvitationHtml(id: string): string {
  const url = buildChecklistUrl(id);
  return `
    <h3 style="margin:24px 0 14px;color:#001f97;font-size:19px;">One quick step to your quote</h3>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:#1e293b;">
      To prepare an accurate quote, please complete our short
      <strong>Shower / Balcony Grouting &amp; Resealing Checklist</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#1e293b;">
      It takes about two minutes and lets us price the exact scope of work — shower type, wall height,
      work areas, tiles and anything else you need done. You can attach photos along the way.
    </p>
    <div style="margin:24px 0;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
      <a href="${url}" style="display:inline-block;background:#001f97;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:10px;box-shadow:0 2px 4px rgba(0,31,151,0.2);">
        Fill in My Checklist
      </a>
      <p style="margin:14px 0 0;font-size:13px;color:#64748b;">Add one page per shower or balcony — just tap “Add Another”.</p>
    </div>
    ${checklistTrackingPixel(id)}`;
}

/** Record a successful email containing the checklist invitation. */
export async function recordChecklistEmailSent(id: string, toEmail: string): Promise<void> {
  const now = new Date().toISOString();
  await updateSubmission(id, { checklistSentAt: now });
  await appendActivity(id, {
    time: now,
    actor: "system",
    action: "Checklist emailed",
    detail: toEmail,
  });
}

/** Email the checklist link and record that it was sent. Never throws. */
export async function sendChecklistEmail(
  id: string,
  options: { toEmail?: string; name?: string } = {}
): Promise<boolean> {
  try {
    const lead = await getSubmission(id);
    const toEmail = options.toEmail || lead?.email;
    if (!toEmail) return false;
    const name = options.name || lead?.name;
    const firstName = (name || "").trim().split(/\s+/)[0].replace(/[&<>"']/g, "") || "there";
    const logoUrl = await getEmailLogoUrl();
    await sendEmail({
      toEmail,
      fromName: "Groutix",
      fromEmail: FROM_EMAIL,
      subject: "Complete your Groutix regrouting & resealing checklist",
      html: wrapEmailHtml(
        `<h2 style="margin:0 0 14px;color:#001f97;font-size:24px;">Hi ${firstName},</h2>
         <p>Thanks for your enquiry.</p>
         ${checklistInvitationHtml(id)}
         <p>If you have any questions, simply reply to this email or call us.</p>
         <p style="margin:20px 0 0;font-size:16px;font-weight:700;color:#001f97;">Stay Sealed. Stay Smiling.</p>`,
        "One quick checklist so we can price your regrouting & resealing accurately.",
        logoUrl
      ),
    });
    await recordChecklistEmailSent(id, toEmail);
    return true;
  } catch (err) {
    console.error("sendChecklistEmail failed (non-fatal):", err);
    return false;
  }
}

/** Record the first time the customer opens the checklist email. */
export async function recordChecklistOpen(id: string): Promise<void> {
  try {
    const lead = await getSubmission(id);
    if (!lead || lead.checklistOpenedAt) return;
    const now = new Date().toISOString();
    await updateSubmission(id, { checklistOpenedAt: now });
    await appendActivity(id, {
      time: now,
      actor: "customer",
      action: "Checklist email opened",
      detail: lead.jobNo,
    });
  } catch (err) {
    console.error("recordChecklistOpen failed (non-fatal):", err);
  }
}

/** Record the first time the customer starts filling the checklist. */
export async function recordChecklistFilled(id: string): Promise<void> {
  try {
    const lead = await getSubmission(id);
    if (!lead || lead.checklistFilledAt) return;
    const now = new Date().toISOString();
    await updateSubmission(id, { checklistFilledAt: now });
    await appendActivity(id, {
      time: now,
      actor: "customer",
      action: "Checklist started",
      detail: lead.jobNo,
    });
  } catch (err) {
    console.error("recordChecklistFilled failed (non-fatal):", err);
  }
}

/** Persist submitted checklist answers and stamp the submission time. */
export async function recordChecklistSubmission(
  id: string,
  answers: ChecklistAnswers,
  extras: {
    services: string[];
    requestText: string;
    quoteItems?: { templateNo?: string; code?: string; service?: string; scope?: string; price?: number; qty?: number; matchedFrom?: string }[];
  }
): Promise<void> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    checklist: { answers, services: extras.services, submittedAt: now, savedAt: now },
    checklistSubmittedAt: now,
  };
  if (extras.requestText) patch.enquiry = extras.requestText;
  if (extras.services.length) patch.service = extras.services.join(", ");
  if (extras.quoteItems) {
    patch.quoteItems = extras.quoteItems;
    patch.quoteUpdated = now;
  }
  await updateSubmission(id, patch);
  const lead = await getSubmission(id);
  if (lead && !lead.checklistFilledAt) {
    await updateSubmission(id, { checklistFilledAt: now });
  }
  await appendActivity(id, {
    time: now,
    actor: "customer",
    action: "Checklist submitted",
    detail: `${answers?.pages?.length || 0} page(s) received`,
  });
}
