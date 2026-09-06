import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSubmission, updateSubmission, appendActivity } from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Log a phone-call outcome against a lead (part of the intake call follow-up
// workflow). Records an audit-trail entry and, for a productive contact, stamps
// the lead as Contacted so response-time tracking and follow-ups behave.
const OUTCOMES = [
  "Call Attempted",
  "Connected",
  "No Answer",
  "Callback Requested",
  "Customer Interested",
  "Not Interested",
] as const;
type Outcome = (typeof OUTCOMES)[number];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;

  let body: { outcome?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const outcome = (body.outcome || "").trim() as Outcome;
  if (!OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: "Unknown call outcome." }, { status: 400 });
  }

  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const actor = session?.username || "staff";
  const now = new Date().toISOString();

  await appendActivity(id, {
    time: now,
    actor,
    action: `Call — ${outcome}`,
    detail: body.note?.trim() || undefined,
  });

  // A productive contact stamps the lead as Contacted (only advancing a brand
  // new lead, never overwriting a later stage) and records the contact time.
  const productive = outcome === "Connected" || outcome === "Customer Interested";
  const updates: Record<string, unknown> = {};
  if (productive) {
    if (!lead.contacted) updates.contacted = now;
    if (lead.status === "New") updates.status = "Contacted";
  }
  if (outcome === "Not Interested") {
    updates.status = "Lost";
  }
  if (Object.keys(updates).length) await updateSubmission(id, updates);

  return NextResponse.json({ ok: true });
}
