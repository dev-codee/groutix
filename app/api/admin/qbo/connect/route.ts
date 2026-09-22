import { NextRequest, NextResponse } from "next/server";
import { buildQboAuthUrl, isQboConfigured } from "@/lib/quickbooks";
import { verifyRequestSession } from "@/lib/adminAuth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isQboConfigured()) {
    return NextResponse.json(
      { error: "QBO_CLIENT_ID and QBO_CLIENT_SECRET env vars are not set." },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const authUrl = buildQboAuthUrl(state);

  const res = NextResponse.redirect(authUrl);
  // Short-lived cookie to verify the state on callback and prevent CSRF.
  res.cookies.set("qbo_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
