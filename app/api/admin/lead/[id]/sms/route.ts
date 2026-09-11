import { NextRequest, NextResponse } from "next/server";
import { getSubmission, appendActivity } from "@/lib/submissions";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import type { CustomerMessage, SubmissionDoc } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const lead = await getSubmission(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!lead.phone) {
    return NextResponse.json({ error: "Lead does not have a phone number." }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text } = body;
  const bodyText = typeof text === "string" ? text.trim() : "";
  if (!bodyText) {
    return NextResponse.json({ error: "SMS message text is required." }, { status: 400 });
  }

  if (!isSmsConfigured()) {
    return NextResponse.json({
      error: "SMS provider is not configured. Please add TEXTO_API_KEY in your environment variables."
    }, { status: 503 });
  }

  try {
    // 1. Send the SMS via Texto/configured provider
    const result = await sendSms({
      to: lead.phone,
      body: bodyText,
      campaign: "Groutix CRM",
    });

    if (!result.ok) {
      return NextResponse.json({
        error: result.error || "Failed to send SMS."
      }, { status: 400 });
    }

    // 2. Log message in customer conversation
    const crmMessage: CustomerMessage = {
      id: `out_sms_${Date.now()}`,
      from: "groutix",
      channel: "sms",
      text: bodyText,
      time: new Date().toISOString(),
    };

    const db = await getDb();
    const col = db.collection<SubmissionDoc>("submissions");
    await col.updateOne(
      { _id: new ObjectId(id) },
      { $push: { messages: crmMessage } }
    );

    // 3. Log activity
    await appendActivity(id, {
      time: new Date().toISOString(),
      actor: session.username || "staff",
      action: "Sent SMS",
      detail: `To: ${lead.phone}${result.messageId ? ` • ID: ${result.messageId}` : ""}`,
    });

    return NextResponse.json({
      ok: true,
      message: crmMessage,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (error) {
    console.error("Failed to send CRM SMS:", error);
    return NextResponse.json({ error: "Failed to send SMS." }, { status: 500 });
  }
}
