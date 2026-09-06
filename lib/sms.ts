// Provider-agnostic SMS sender. Defaults to ClickSend (a popular Australian
// gateway) but the shape lets us swap providers via SMS_PROVIDER without
// touching call sites. Everything is best-effort and NEVER throws: when no
// credentials are configured the call is a graceful no-op, so the whole
// automation pipeline works email-only today and "lights up" the moment the
// SMS account is purchased and the env vars are set.
//
// Required env (ClickSend): SMS_PROVIDER=clicksend (default), CLICKSEND_USERNAME,
// CLICKSEND_API_KEY, SMS_FROM (a purchased number or approved alphanumeric
// sender id, e.g. "Groutix").
// Required env (MessageMedia): SMS_PROVIDER=messagemedia, MESSAGEMEDIA_API_KEY,
// MESSAGEMEDIA_API_SECRET, SMS_FROM.

type SmsProvider = "clicksend" | "messagemedia";

function provider(): SmsProvider {
  return (process.env.SMS_PROVIDER || "clicksend").toLowerCase() === "messagemedia"
    ? "messagemedia"
    : "clicksend";
}

export function isSmsConfigured(): boolean {
  if (provider() === "messagemedia") {
    return Boolean(process.env.MESSAGEMEDIA_API_KEY && process.env.MESSAGEMEDIA_API_SECRET);
  }
  return Boolean(process.env.CLICKSEND_USERNAME && process.env.CLICKSEND_API_KEY);
}

/** Normalise an Australian number toward E.164 (+61…) as best we can. */
export function normaliseAuNumber(raw: string): string {
  let n = (raw || "").replace(/[^\d+]/g, "");
  if (!n) return "";
  if (n.startsWith("+")) return n;
  if (n.startsWith("0")) return "+61" + n.slice(1); // 04xx / 03x local → +61
  if (n.startsWith("61")) return "+" + n;
  return n; // already international or unknown — send as-is
}

export type SmsResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Send a single SMS. Best-effort — returns a result object and never throws, so
 * a texting failure can't break the surrounding lead flow.
 */
export async function sendSms(args: { to: string; body: string }): Promise<SmsResult> {
  const to = normaliseAuNumber(args.to);
  const body = (args.body || "").trim();
  if (!to || !body) return { ok: false, error: "missing_to_or_body" };
  if (!isSmsConfigured()) return { ok: false, skipped: true };

  const from = process.env.SMS_FROM || "Groutix";
  try {
    if (provider() === "messagemedia") {
      return await sendViaMessageMedia({ to, from, body });
    }
    return await sendViaClickSend({ to, from, body });
  } catch (err) {
    console.error("sendSms failed (non-fatal):", err);
    return { ok: false, error: "send_failed" };
  }
}

async function sendViaClickSend(args: { to: string; from: string; body: string }): Promise<SmsResult> {
  const user = process.env.CLICKSEND_USERNAME || "";
  const key = process.env.CLICKSEND_API_KEY || "";
  const auth = Buffer.from(`${user}:${key}`).toString("base64");
  const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ source: "groutix-crm", from: args.from, to: args.to, body: args.body }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("ClickSend error:", res.status, text);
    return { ok: false, error: `clicksend_${res.status}` };
  }
  return { ok: true };
}

async function sendViaMessageMedia(args: { to: string; from: string; body: string }): Promise<SmsResult> {
  // MessageMedia Basic-auth (key:secret) messaging API.
  const key = process.env.MESSAGEMEDIA_API_KEY || "";
  const secret = process.env.MESSAGEMEDIA_API_SECRET || "";
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch("https://api.messagemedia.com/v1/messages", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      messages: [{ content: args.body, destination_number: args.to, source_number: args.from }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("MessageMedia error:", res.status, text);
    return { ok: false, error: `messagemedia_${res.status}` };
  }
  return { ok: true };
}
