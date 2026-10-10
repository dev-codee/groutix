import { getSubmission, updateSubmission, appendActivity } from "./submissions";
import { quoteDeliveryTimes } from "./quoteDelivery";
import { signQuoteToken, siteBaseUrl } from "./quoteToken";

export function quoteTrackingPixel(id: string): string {
  return `<img src="${siteBaseUrl()}/api/track/quote/${encodeURIComponent(id)}?token=${signQuoteToken(id)}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
}

export async function recordQuoteOpen(id: string): Promise<void> {
  const lead = await getSubmission(id);
  if (!lead || lead.quoteOpenedAt || !quoteDeliveryTimes(lead).sentAt) return;
  const now = new Date().toISOString();
  await updateSubmission(id, { quoteOpenedAt: now });
  await appendActivity(id, { time: now, actor: "customer", action: "Quote opened", detail: lead.quoteNumber });
}
