// Admin authentication helpers.
//
// Single shared login: credentials live in env (ADMIN_USERNAME /
// ADMIN_PASSWORD). On success we issue a stateless, HMAC-signed session cookie
// (no DB needed). Everything here uses the Web Crypto API so the exact same
// code runs in edge middleware and in Node route handlers.

import { type Role, isRole } from "@/lib/roles";

export const SESSION_COOKIE = "gx_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const DEFAULT_BASE_PATH = "/admin";

/** Public URL prefix for the admin panel (configurable, defaults to /admin). */
export function getAdminBasePath(): string {
  const raw = (process.env.ADMIN_BASE_PATH || DEFAULT_BASE_PATH).trim();
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  // Strip any trailing slash so we can concatenate segments predictably.
  return withSlash.length > 1 && withSlash.endsWith("/")
    ? withSlash.slice(0, -1)
    : withSlash;
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      process.env.ADMIN_SESSION_SECRET
  );
}

// ── base64url helpers (edge + node safe) ─────────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<Uint8Array> {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

/** Length-safe, content constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME || "";
  const p = process.env.ADMIN_PASSWORD || "";
  // Evaluate both comparisons so timing doesn't reveal which field was wrong.
  const okU = safeEqual(username, u);
  const okP = safeEqual(password, p);
  return okU && okP;
}

type SessionPayload = { u: string; role?: Role; exp: number };

export async function createSession(
  username: string,
  role: Role = "manager"
): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = toBase64Url(await hmac(body));
  return `${body}.${sig}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<{ username: string; role: Role } | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = toBase64Url(await hmac(body));
  if (!safeEqual(sig, expected)) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    // Older tokens (pre-roles) carry no role: treat as manager so an existing
    // break-glass session keeps full access until it expires.
    const role = isRole(payload.role) ? payload.role : "manager";
    return { username: payload.u, role };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_TTL_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
