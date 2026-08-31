import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  checkCredentials,
  createSession,
  isAdminConfigured,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/adminAuth";
import { findUserByUsername, verifyPassword } from "@/lib/users";
import type { Role } from "@/lib/roles";

export const runtime = "nodejs";

const RATE_LIMIT = 8; // login attempts…
const RATE_WINDOW_MS = 10 * 60 * 1000; // …per 10 minutes per IP.

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  // We can mint sessions as long as the signing secret is present; DB user
  // accounts work even when the env break-glass admin isn't configured.
  if (!process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin panel is not configured on the server." },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  if (!rateLimit(`admin-login:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  // 1) Try a database staff account (the four role logins).
  let sessionUser: string | null = null;
  let role: Role = "manager";
  const user = await findUserByUsername(username);
  if (user) {
    if (user.active && (await verifyPassword(password, user.passwordHash))) {
      sessionUser = user.username;
      role = user.role;
    }
  } else if (isAdminConfigured() && checkCredentials(username, password)) {
    // 2) Env break-glass admin (manager level). Only consulted when no DB user
    //    owns this username, so a real account can't be shadowed by env creds.
    sessionUser = username;
    role = "manager";
  }

  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await createSession(sessionUser, role);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
