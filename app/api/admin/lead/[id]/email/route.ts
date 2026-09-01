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

  const { subject, text, html, attachments } = body;

  // Normalise incoming attachments: each needs a name and base64 content to be
  // forwarded to the mailer. Anything malformed is dropped defensively.
  const validAttachments: { name: string; content: string; contentType?: string; size?: number }[] =
    Array.isArray(attachments)
      ? attachments
          .filter((a: any) => a && typeof a.name === "string" && typeof a.content === "string")
          .map((a: any) => ({
            name: a.name,
            content: a.content,
            contentType: typeof a.contentType === "string" ? a.contentType : undefined,
            size: typeof a.size === "number" ? a.size : undefined,
          }))
      : [];

  if (!text && validAttachments.length === 0) {
    return NextResponse.json({ error: "Email body or an attachment is required." }, { status: 400 });
  }

  const bodyText = typeof text === "string" ? text : "";

  try {
    // 1. Send the email via Nodemailer
    await sendEmail({
      toEmail: lead.email,
      subject: subject || `Re: Your Groutix Enquiry`,
      html: html || bodyText.replace(/\n/g, "<br/>") || "(See attached files.)",
      attachments: validAttachments.map((a) => ({
        name: a.name,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    // 2. Log the outgoing message in the CRM (attachment metadata only — we do
    //    not persist the raw file bytes in the record).
    const crmMessage: CustomerMessage = {
      id: `out_${Date.now()}`,
      from: "groutix",
      channel: "email",
      subject: subject || `Re: Your Groutix Enquiry`,
      text: bodyText,
      time: new Date().toISOString(),
      ...(validAttachments.length > 0 && {
        attachments: validAttachments.map((a) => ({
          name: a.name,
          contentType: a.contentType,
          size: a.size,
        })),
      }),
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
      detail:
        (subject || "No subject") +
        (validAttachments.length > 0 ? ` • ${validAttachments.length} attachment(s)` : ""),
    });

    return NextResponse.json({ ok: true, message: crmMessage });
  } catch (error) {
    console.error("Failed to send CRM reply:", error);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
