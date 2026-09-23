import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/quickbooks";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const adminPath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "/admin";
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}${adminPath}`;

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${adminUrl}?qbo=error&msg=${encodeURIComponent(error)}`);
  }

  const storedState = req.cookies.get("qbo_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${adminUrl}?qbo=error&msg=invalid_state`);
  }

  if (!code || !realmId) {
    return NextResponse.redirect(`${adminUrl}?qbo=error&msg=missing_params`);
  }

  try {
    await exchangeCodeForTokens(code, realmId);
  } catch (err) {
    console.error("QBO callback error:", err);
    const msg = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.redirect(`${adminUrl}?qbo=error&msg=${encodeURIComponent(msg)}`);
  }

  const res = NextResponse.redirect(`${adminUrl}?qbo=connected`);
  res.cookies.set("qbo_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
