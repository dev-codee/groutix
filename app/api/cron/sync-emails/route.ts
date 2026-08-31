import { NextRequest, NextResponse } from "next/server";
import { syncUnreadEmails } from "@/lib/imap";

export const runtime = "nodejs";
export const maxDuration = 60; // Max allowed for hobby plan

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  
  if (secret) {
    const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const provided = req.headers.get("x-cron-secret") || bearer;
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncUnreadEmails();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Inbox sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
