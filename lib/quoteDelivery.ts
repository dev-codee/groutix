import type { Lead } from "@/components/admin/types";

export function quoteDeliveryTimes(lead: Pick<Lead, "quoteSentAt" | "quoteOpenedAt" | "activity">) {
  return { sentAt: lead.quoteSentAt || [...(lead.activity || [])].reverse().find(entry => entry.action === "Quote emailed")?.time,
    openedAt: lead.quoteOpenedAt };
}

/** Keep every recorded send, including resends, newest first. */
export function quoteSendHistory(lead: Pick<Lead, "quoteSentAt" | "activity">) {
  const sends = (lead.activity || []).filter(entry => entry.action === "Quote emailed");
  if (lead.quoteSentAt && !sends.some(entry => entry.time === lead.quoteSentAt)) {
    sends.push({ action: "Quote emailed", time: lead.quoteSentAt, actor: "staff" });
  }
  const unique = new Map(sends.map(entry => [`${entry.time}-${entry.detail || ""}`, entry]));
  return [...unique.values()].sort((a, b) => b.time.localeCompare(a.time));
}
