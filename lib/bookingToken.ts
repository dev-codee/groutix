// Signed tokens for the login-free customer booking links (inspection + job).
//
// Same idea as lib/quoteToken.ts: the customer isn't logged in, so we HMAC the
// lead id with the server secret. One token authorises booking for one lead;
// the server decides (from the lead's current status) whether an inspection or
// a job may be booked, so the same token can't be abused to skip the pipeline.

import crypto from "node:crypto";

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "groutix-quote-link-secret";
}

export function signBookingToken(id: string): string {
  return crypto.createHmac("sha256", secret()).update(`book:${id}`).digest("base64url");
}

export function verifyBookingToken(id: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = signBookingToken(id);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function siteBaseUrl(): string {
  // Apex (not www) avoids the 308 www→apex redirect on outbound links.
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://groutix.com").replace(/\/$/, "");
}

/** Public booking page URL for a lead, e.g. /book/inspection/<id>?token=… */
export function buildBookingUrl(id: string, type: "inspection" | "job"): string {
  const token = signBookingToken(id);
  return `${siteBaseUrl()}/book/${type}/${id}?token=${token}`;
}

// ── Short link for SMS ────────────────────────────────────────────────────
// Same trade-off as the quote links (see lib/quoteToken.ts): the full 43-char
// token makes /book/<type>/<id>?token=... far too long to sit in an SMS next to
// any real message text. For SMS we hand out a short redirect (/b/i|j/<id>?t=…)
// that 302s to the full, fully-tokened booking page. The short token is a slice
// of the same HMAC — enough to stop blind guessing of a lead id, while the
// booking page itself still requires the full token.

export function signBookingTokenShort(id: string): string {
  return signBookingToken(id).slice(0, 10);
}

export function verifyBookingTokenShort(id: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = signBookingTokenShort(id);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Short SMS-friendly booking link, e.g. https://groutix.com/b/i/<id>?t=… */
export function buildBookingSmsUrl(id: string, type: "inspection" | "job"): string {
  const slug = type === "inspection" ? "i" : "j";
  return `${siteBaseUrl()}/b/${slug}/${id}?t=${signBookingTokenShort(id)}`;
}
