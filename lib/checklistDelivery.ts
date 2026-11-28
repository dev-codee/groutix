// Checklist email delivery + lifecycle tracking.
//
// Staff can email the checklist on its own. The invitation carries a tracking
// pixel so the CRM can show when it was opened.

import { getSubmission, updateSubmission, appendActivity } from "./submissions";
import type { ChecklistAnswers } from "./checklist";
import { signQuoteToken, siteBaseUrl } from "./quoteToken";
import { sendEmail, wrapEmailHtml, getEmailLogoUrl } from "./email";
import { emailActionButton } from "./emailPresentation";
import { buildJobChecklistUrl } from "./quoteChecklistLink";
import { hasSubmittedQuoteChecklist } from "./quoteJobChecklist";

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";

// ── Public link + tracking pixel ─────────────────────────────────────────────

function buildChecklistUrl(id: string): string {
  return `${siteBaseUrl()}/checklist/${id}?token=${signQuoteToken(id)}`;
}

function checklistTrackingPixel(id: string): string {
  return `<img src="${siteBaseUrl()}/api/track/checklist/${encodeURIComponent(id)}?token=${signQuoteToken(id)}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
}

export function checklistInvitationHtml(id: string, url = buildChecklistUrl(id)): string {
  return `${emailActionButton(url, "Complete My Quote Form")}${checklistTrackingPixel(id)}`;
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
    if (!lead || hasSubmittedQuoteChecklist(lead)) return false;
    const toEmail = options.toEmail || lead.email;
    if (!toEmail) return false;
    const name = options.name || lead.name;
    const firstName = (name || "").trim().split(/\s+/)[0].replace(/[&<>"']/g, "") || "there";
    const logoUrl = await getEmailLogoUrl();
    await sendEmail({
      toEmail,
      fromName: "Groutix",
      fromEmail: FROM_EMAIL,
      subject: "Complete your Groutix Smart Quote Request",
      html: wrapEmailHtml(
        `${checklistInvitationHtml(id, buildJobChecklistUrl(id, lead.quoteChecklistRevision))}
         <p style="margin:12px 0 6px;">Hi ${firstName}, add your details and photos so we can prepare your quote.</p>
         <p style="margin:0;font-size:13px;color:#64748b;">Remote quotes may require verification.</p>`,
        "Add your details and photos for your quote.",
        logoUrl,
        { compact: true }
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
