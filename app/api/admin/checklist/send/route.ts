import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getSubmission } from "@/lib/submissions";
import { isEmailConfigured } from "@/lib/email";
import { sendChecklistEmail } from "@/lib/checklistDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-send the regrouting & resealing checklist so staff can email it on demand
// (for example when the customer asks for the link again after the first email).
export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const lead = await getSubmission(body.id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "This lead has no email address." }, { status: 400 });

  const sent = await sendChecklistEmail(body.id, { toEmail: lead.email, name: lead.name });
  if (!sent) return NextResponse.json({ error: "Could not send the checklist email." }, { status: 502 });

  const item = await getSubmission(body.id);
  return NextResponse.json({ ok: true, item });
}
