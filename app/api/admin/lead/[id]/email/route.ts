import { NextRequest, NextResponse } from "next/server";
import { getSubmission, appendActivity } from "@/lib/submissions";
import { sendEmail } from "@/lib/email";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { CustomerMessage, SubmissionDoc } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const lead = await getSubmission(id);
  if (!lead || !lead.email) {
    return NextResponse.json({ error: "Lead not found or has no email address." }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subject, text, html } = body;
  if (!text) {
    return NextResponse.json({ error: "Email body is required." }, { status: 400 });
  }

  try {
    // 1. Send the email via Nodemailer
    await sendEmail({
      toEmail: lead.email,
      subject: subject || `Re: Your Groutix Enquiry`,
      html: html || text.replace(/\n/g, "<br/>"),
    });

    // 2. Log the outgoing message in the CRM
    const crmMessage: CustomerMessage = {
      id: `out_${Date.now()}`,
      from: "groutix",
      channel: "email",
      subject: subject || `Re: Your Groutix Enquiry`,
      text: text,
      time: new Date().toISOString(),
    };

    const db = await getDb();
    const col = db.collection<SubmissionDoc>("submissions");
    await col.updateOne(
      { _id: new ObjectId(id) },
      { $push: { messages: crmMessage } }
    );

    // 3. Log the activity
    await appendActivity(id, {
      time: new Date().toISOString(),
      actor: "admin",
      action: "Sent Email Reply",
      detail: subject || "No subject",
    });

    return NextResponse.json({ ok: true, message: crmMessage });
  } catch (error) {
    console.error("Failed to send CRM reply:", error);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
