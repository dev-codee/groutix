import type { Lead } from "@/components/admin/types";

export function quoteDeliveryTimes(lead: Pick<Lead, "quoteSentAt" | "quoteOpenedAt" | "activity">) {
  return { sentAt: lead.quoteSentAt || [...(lead.activity || [])].reverse().find(entry => entry.action === "Quote emailed")?.time,
    openedAt: lead.quoteOpenedAt };
}
