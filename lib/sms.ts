// Provider-agnostic SMS sender. Supports Texto (Australian gateway), ClickSend,
// and MessageMedia via SMS_PROVIDER. Everything is best-effort and NEVER throws:
// when no credentials are configured the call is a graceful no-op.
//
// Required env (Texto): SMS_PROVIDER=texto (default when TEXTO_API_KEY is present),
// TEXTO_API_KEY, SMS_FROM (optional sender number or registered alphanumeric ID).
// Required env (ClickSend): SMS_PROVIDER=clicksend, CLICKSEND_USERNAME, CLICKSEND_API_KEY.
// Required env (MessageMedia): SMS_PROVIDER=messagemedia, MESSAGEMEDIA_API_KEY, MESSAGEMEDIA_API_SECRET.

type SmsProvider = "texto" | "clicksend" | "messagemedia";

function provider(): SmsProvider {
  const p = (process.env.SMS_PROVIDER || "").toLowerCase();
  if (p === "texto") return "texto";
  if (p === "messagemedia") return "messagemedia";
  if (p === "clicksend") return "clicksend";
  // Default to texto if TEXTO_API_KEY is configured
  if (process.env.TEXTO_API_KEY) return "texto";
  return "clicksend";
}

export function isSmsConfigured(): boolean {
  const p = provider();
  if (p === "texto") {
    return Boolean(process.env.TEXTO_API_KEY);
  }
  if (p === "messagemedia") {
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

export type SmsResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  messageId?: string;
  creditsRemaining?: number;
};

/**
 * Sanitise text to strict GSM-7 7-bit character set:
 * 1. Replaces smart quotes, em-dashes, and unicode symbols with standard ASCII equivalents.
 * 2. Ensures the text clearly mentions "Groutix" so the customer knows who it is from.
 * 3. Strips emojis and non-GSM characters that would force UCS-2 encoding (costing 2 credits per part).
 * 4. Ensures the final message fits within 160 characters (strictly 1 SMS credit).
 */
export function prepareSinglePartSms(text: string, maxChars: number = 160): string {
  let cleaned = (text || "")
    // Normalize unicode punctuation to standard ASCII
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    // Remove emojis and non-ASCII / non-GSM characters to prevent 2-credit UCS-2 encoding
    .replace(/[^\x20-\x7E\r\n]/g, "")
    .trim();

  // Ensure "Groutix" is mentioned so the customer always knows who it is from
  if (!cleaned.toLowerCase().includes("groutix")) {
    cleaned = `Groutix: ${cleaned}`;
  }

  // Cap at 160 characters to strictly guarantee 1 credit per SMS
  if (cleaned.length > maxChars) {
    cleaned = cleaned.slice(0, maxChars).trim();
  }

  return cleaned;
}

/**
 * Send a single SMS. Best-effort — returns a result object and never throws, so
 * a texting failure can't break the surrounding lead flow.
 */
export async function sendSms(args: {
  to: string;
  body: string;
  from?: string;
  campaign?: string;
}): Promise<SmsResult> {
  const to = normaliseAuNumber(args.to);
  const body = prepareSinglePartSms(args.body);
  if (!to || !body) return { ok: false, error: "missing_to_or_body" };
  if (!isSmsConfigured()) return { ok: false, skipped: true };

  const from = (args.from || process.env.SMS_FROM || "").trim();
  try {
    const p = provider();
    if (p === "texto") {
      return await sendViaTexto({ to, from, body, campaign: args.campaign || "Groutix CRM" });
    }
    if (p === "messagemedia") {
      return await sendViaMessageMedia({ to, from: from || "Groutix", body });
    }
    return await sendViaClickSend({ to, from: from || "Groutix", body });
  } catch (err) {
    console.error("sendSms failed (non-fatal):", err);
    return { ok: false, error: "send_failed" };
  }
}

async function sendViaTexto(args: {
  to: string;
  from: string;
  body: string;
  campaign?: string;
}): Promise<SmsResult> {
  const apiKey = (process.env.TEXTO_API_KEY || "").trim();
  if (!apiKey) return { ok: false, error: "missing_texto_api_key" };

  const payload: Record<string, any> = {
    to: args.to,
    message: args.body,
  };
  if (args.from) {
    payload.sender = args.from;
  }
  if (args.campaign) {
    payload.campaign = args.campaign;
  }

  const res = await fetch("https://api.texto.com.au/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Texto error:", res.status, data);
    return { ok: false, error: data?.error || data?.message || `texto_${res.status}` };
  }

  return {
    ok: true,
    messageId: data.message_id,
    creditsRemaining: data.credits_remaining,
  };
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
