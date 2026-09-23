import { NextRequest, NextResponse } from "next/server";
import { syncUnreadEmails } from "@/lib/imap";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const result = await syncUnreadEmails();
    // Return full detail so cron-job.org logs show exactly what happened
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...result });
  } catch (error: any) {
    console.error("Inbox sync failed:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Sync failed", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
