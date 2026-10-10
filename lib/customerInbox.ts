import type { Lead, CustomerMessage } from "@/components/admin/types";

export type InboxFolder = "inbox" | "unread" | "sent" | "all";
export type InboxChannel = "all" | "email" | "sms";

export function getInboxThreads(leads: Lead[], folder: InboxFolder, channel: InboxChannel, query = "") {
  const search = query.trim().toLowerCase();
  return leads.flatMap(lead => {
    const messages = getLeadConversation(lead).filter(message => {
      if (message.channel === "internal") return false;
      return channel === "all" || (channel === "sms" ? message.channel === "sms" : message.channel !== "sms");
    });
    if (!messages.length) return [];
    const unreadCount = messages.filter(message => message.from === "customer" && message.read === false).length;
    if (folder === "unread" && !unreadCount) return [];
    if (folder === "inbox" && !messages.some(message => message.from === "customer")) return [];
    if (folder === "sent" && !messages.some(message => message.from === "groutix")) return [];
    if (search && ![lead.jobNo, lead.name, lead.email, lead.phone, ...messages.flatMap(message => [message.subject, message.text])].filter(Boolean).join(" ").toLowerCase().includes(search)) return [];
    const latest = messages[messages.length - 1];
    return [{ lead, latest, unreadCount, messageCount: messages.length }];
  }).sort((a, b) => (new Date(b.latest.time).getTime() || 0) - (new Date(a.latest.time).getTime() || 0));
}

export function getLeadConversation(lead: Lead): CustomerMessage[] {
  const list = Array.isArray(lead.messages) ? [...lead.messages] : [];

  // Synthesize past On The Way / Arrived dispatch notifications from lead.activity if not yet in messages
  if (Array.isArray(lead.activity)) {
    lead.activity.forEach((act, idx) => {
      if (
        act.action === "On The Way notification sent" ||
        act.action === "Arrived notification sent"
      ) {
        const isEnRoute = act.action === "On The Way notification sent";
        const alreadyInList = list.some(
          (m) =>
            (m.id && (m.id.includes(`act_${idx}`) || m.id.includes(act.time))) ||
            (m.subject && (
              (isEnRoute && /on the way/i.test(m.subject)) ||
              (!isEnRoute && /arrived/i.test(m.subject))
            ) && Math.abs(new Date(m.time).getTime() - new Date(act.time).getTime()) < 120000)
        );

        if (!alreadyInList) {
          list.push({
            id: `otw_act_${lead.id}_${idx}_${new Date(act.time).getTime() || idx}`,
            from: "groutix",
            channel: "sms",
            subject: isEnRoute ? "🚗 Specialist On The Way" : "📍 Specialist Arrived",
            text: act.detail || (isEnRoute ? "Specialist is on the way." : "Specialist has arrived."),
            time: act.time,
          });
        }
      }
    });
  }

  const initialExists = list.some((m) => m.initial);
  if (!initialExists && (lead.service || lead.notes || lead.message || (lead.photos && lead.photos.length > 0))) {
    const initialAttachments = (lead.photos || []).map((p, idx) => ({
      name: p.name || `Customer_Photo_${idx + 1}.jpg`,
      url: p.secureUrl || p.url || p.dataUrl,
      secureUrl: p.secureUrl || p.url,
      contentType: p.contentType || "image/jpeg",
    }));
    list.unshift({
      id: `initial_${lead.id}`,
      from: "customer",
      channel: "lead",
      subject: "Original Enquiry",
      text: [
        lead.service ? `Service: ${lead.service}` : "",
        lead.notes ? `Notes: ${lead.notes}` : "",
        lead.message ? `Customer Message: ${lead.message}` : "",
        lead.source ? `Source: ${lead.source}` : ""
      ].filter(Boolean).join("\n"),
      time: lead.received || lead.createdAt,
      initial: true,
      ...(initialAttachments.length > 0 ? { attachments: initialAttachments } : {}),
    });
  }

  // Sort chronologically so all messages and notifications appear in exact timeline sequence
  list.sort((a, b) => {
    const ta = new Date(a.time).getTime() || 0;
    const tb = new Date(b.time).getTime() || 0;
    return ta - tb;
  });

  return list;
}
