// Hardened Brevo transactional-email sender, shared by every form route.
//
// The whole point of this module is that a lead notification must not be lost
// to a transient hiccup. So each send gets a per-attempt timeout and automatic
// retries with backoff on network errors and retryable HTTP statuses. Client
// errors that can never succeed (bad key, malformed payload) fail fast.
//
// It stays within a serverless request's time budget: attempts and timeout are
// tuned so the worst case is bounded. When a send still fails after all
// retries it throws - callers persist emailDelivered:false so the lead is
// flagged in the admin panel and can be re-sent, never silently dropped.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

// Per-attempt network timeout. Brevo normally responds in well under a second;
// this guards against a hung socket without blowing the request budget.
const TIMEOUT_MS = 8000;
// Total attempts (initial + retries). Backoff between them is short so the
// whole retry sequence fits comfortably inside a typical function limit.
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 2000];

export type EmailAttachment = { name: string; content: string; contentType?: string };

export type SendEmailArgs = {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  replyTo?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

// Brevo rejects some attachment extensions (webp/heic/heif/svg). Phone photos
// are commonly HEIC, so relabel those to .jpg - the bytes are passed through
// unchanged, we only correct the filename Brevo validates against.
function normalizeAttachments(attachments?: EmailAttachment[]) {
  if (!attachments?.length) return undefined;
  return attachments.map((a) => {
    let safeName = a.name || "photo";
    const ext = (safeName.split(".").pop() || "").toLowerCase();
    if (["webp", "heic", "heif", "svg"].includes(ext)) {
      const dot = safeName.lastIndexOf(".");
      safeName = (dot > 0 ? safeName.substring(0, dot) : safeName) + ".jpg";
    }
    return { name: safeName, content: a.content };
  });
}

class BrevoError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function sendOnce(apiKey: string, args: SendEmailArgs): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: args.fromName, email: args.fromEmail },
        to: [{ email: args.toEmail }],
        replyTo: args.replyTo ? { email: args.replyTo } : undefined,
        subject: args.subject,
        htmlContent: args.html,
        attachment: normalizeAttachments(args.attachments),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new BrevoError(`Brevo API ${res.status}: ${detail}`, res.status);
    }
  } finally {
    clearTimeout(timer);
  }
}

// A failure is worth retrying if it's transient: network/abort (no status), a
// timeout/rate-limit (408/429), or any server-side 5xx. A 4xx like 400/401/403
// means the request itself is wrong and every retry would fail identically.
function isRetryable(err: unknown): boolean {
  const status = err instanceof BrevoError ? err.status : undefined;
  if (status === undefined) return true;
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Send one email through Brevo with timeout + retries. Resolves on success,
 * throws the last error if every attempt fails.
 */
export async function sendBrevoEmail(apiKey: string, args: SendEmailArgs): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await sendOnce(apiKey, args);
      return;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break;
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1] ?? 2000));
    }
  }
  throw lastErr;
}
