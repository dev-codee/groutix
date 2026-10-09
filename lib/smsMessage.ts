// Client-safe SMS formatting, shared by the sender and the CRM preview.
import { BUSINESS } from "@/lib/seo";

export const SMS_MAX_CHARS = 1600;

export type SmsContact = { phone?: string; email?: string };

function cleanSmsText(text: string): string {
  return (text || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\r\n]/g, "")
    .trim();
}

/** Keep SMS text in ASCII without cutting URLs or their signed tokens. */
export function prepareSinglePartSms(text: string): string {
  let cleaned = cleanSmsText(text);
  if (cleaned && !cleaned.toLowerCase().includes("groutix")) {
    cleaned = `Groutix: ${cleaned}`;
  }
  return cleaned;
}

export function smsReplyNotice(contact: SmsContact = {}): string {
  const email = contact.email?.trim() || BUSINESS.email;
  const phone = contact.phone?.trim() || BUSINESS.phone;
  return `This SMS is read-only. Please do not reply. Email ${email} or call ${phone}.`;
}

/** Refresh an existing generated footer so preparing a message twice is safe. */
export function prepareCustomerSms(text: string, contact: SmsContact = {}): string {
  const message = text.replace(/\n\nThis SMS is read-only\. Please do not reply\. Email [^\r\n]+ or call [^\r\n]+\.$/, "");
  const cleaned = prepareSinglePartSms(message);
  return cleaned ? `${cleaned}\n\n${cleanSmsText(smsReplyNotice(contact))}` : "";
}

/** GSM extension characters use two septets; multipart segments hold 153. */
export function smsSegmentCount(text: string): number {
  const septets = text.length + (text.match(/[\^{}\\\[\]~|]/g)?.length || 0);
  return septets <= 160 ? 1 : Math.ceil(septets / 153);
}
