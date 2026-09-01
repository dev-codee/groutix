// Signed tokens for the "Accept / Decline quote" links we email to customers.
//
// The link is public (the customer isn't logged in), so we sign the lead id
// with the server secret. That lets the /api/quote/respond route confirm the
// click is for a real, unmodified lead id without needing any per-lead state in
// the database. A single token authorises responding to one specific lead;
// the accept and decline links share it (both carry the same lead id).

import crypto from "node:crypto";

function secret(): string {
  // Reuse the session secret so no new env var is required. Falls back to a
  // constant only in local/dev where ADMIN_SESSION_SECRET may be unset.
  return process.env.ADMIN_SESSION_SECRET || "groutix-quote-link-secret";
}

export function signQuoteToken(id: string): string {
  return crypto.createHmac("sha256", secret()).update(`quote:${id}`).digest("base64url");
}

export function verifyQuoteToken(id: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = signQuoteToken(id);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Absolute base URL used to build the links inside the email. */
export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.groutix.com").replace(/\/$/, "");
}

/** Build the public accept/decline URL for a lead. */
export function buildQuoteResponseUrl(id: string, action: "accept" | "decline"): string {
  const token = signQuoteToken(id);
  const params = new URLSearchParams({ id, action, token });
  return `${siteBaseUrl()}/api/quote/respond?${params.toString()}`;
}
