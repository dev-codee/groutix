import { NextRequest, NextResponse } from "next/server";
import { sendSms, isSmsConfigured, normaliseAuNumber } from "@/lib/sms";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSmsConfigured()) {
    return NextResponse.json(
      { error: "SMS is not configured. Please set TEXTO_API_KEY in your environment variables." },
      { status: 503 }
    );
  }

  let body: { to?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const to = (body.to || "").trim();
  if (!to) {
    return NextResponse.json({ error: "Please enter a recipient phone number." }, { status: 400 });
  }

  const message = (body.message || "").trim() || "Test SMS from Groutix CRM via Texto API.";

  const result = await sendSms({
    to,
    body: message,
    campaign: "Groutix Test",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to send test SMS." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    to: normaliseAuNumber(to),
    messageId: result.messageId,
    creditsRemaining: result.creditsRemaining,
  });
}
