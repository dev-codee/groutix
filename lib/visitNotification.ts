export type NotificationChannel = "sms" | "email";
export type ChannelOutcome = {
  status: "accepted" | "failed" | "unknown" | "sending";
  reason: string;
  nextStep: string;
  retryable: boolean;
};
export type VisitEta = { text: string | null; minutes: number | null; source: "osrm" | "distance_estimate" | "unavailable"; reason: string; nextStep: string };
export type VisitNotificationReport = {
  requestId: string; channels: Record<NotificationChannel, ChannelOutcome>;
  eta: VisitEta; trackingUrl: string | null; warnings: string[];
  messages: { id: string; from: "groutix" | "customer"; channel: "sms" | "email"; subject?: string; text: string; time: string }[];
  processing?: boolean;
};
export function notificationFailure(channel: NotificationChannel, error: unknown, skipped = false): ChannelOutcome {
  const e = error && typeof error === "object" ? error as { code?: string; responseCode?: number; command?: string; message?: string } : {};
  const value = `${e.code || ""} ${e.responseCode || ""} ${typeof error === "string" ? error : e.message || ""}`.toLowerCase();
  const failure = (reason: string, nextStep: string): ChannelOutcome => ({ status: "failed", reason, nextStep, retryable: true });
  if (skipped || /not.configured|missing.*(key|credential)/.test(value)) return failure(`${channel === "sms" ? "SMS" : "Email"} sending is not configured.`, channel === "sms" ? "Ask an administrator to configure the SMS provider credentials, then retry this channel." : "Ask an administrator to configure the SMTP account and password, then retry this channel.");
  if (/auth|unauthor|forbidden|\b401\b|\b403\b|\b535\b/.test(value)) return failure("The messaging account rejected authentication.", "Ask an administrator to check the provider credentials, account access and authorised sender, then retry.");
  if (/credit|balance|fund|payment|\b402\b/.test(value)) return failure("The SMS provider reports insufficient credit or a billing problem.", "Top up or reactivate the SMS account, then retry SMS.");
  if (/invalid.*(number|recipient|phone|email|address)|recipient.*invalid|eenvelope|\b550\b|\b553\b/.test(value)) return failure("The provider rejected the customer’s contact address.", `Correct the customer’s ${channel === "sms" ? "phone number" : "email address"} in the lead, then retry this channel.`);
  if (/rate|quota|limit|\b429\b|\b450\b|\b451\b|\b452\b/.test(value)) return failure("The provider temporarily limited sending.", "Wait a few minutes, check the account’s sending limits, then retry this channel.");
  if (/exceeds|too.long|length/.test(value)) return failure("The notification exceeds the SMS length limit.", "Ask an administrator to shorten the notification template, then retry SMS.");
  if (/econnrefused|enotfound|eai_again|esocket/.test(value) && e.command !== "DATA") return failure("Could not connect to the email server.", "Ask an administrator to check the SMTP host, port and network access, then retry email.");
  if (/reject|blocked|invalid|\b400\b|\b422\b|\b5[0-9]{2}\b/.test(value) && channel === "email") return failure("The email server rejected this notification.", "Check the recipient, sender permissions and SMTP account in the email provider, then retry email.");
  if (/reject|invalid|\b400\b|\b422\b/.test(value)) return failure("The SMS provider rejected this notification.", "Check the customer’s phone number and your approved sender in the SMS provider, then retry SMS.");
  return { status: "unknown", reason: "The provider did not confirm whether this notification was accepted.", nextStep: "Check the provider’s message records before sending again. Automatic resending is blocked to avoid duplicates.", retryable: false };
}
