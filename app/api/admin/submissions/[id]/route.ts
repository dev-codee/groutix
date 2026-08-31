import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  deleteSubmission,
  getSubmission,
  updateSubmission,
  appendActivity,
} from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  const item = await getSubmission(id);
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Snapshot the prior state so we can record what actually changed.
  const before = await getSubmission(id);
  const ok = await updateSubmission(id, body);
  if (!ok) return NextResponse.json({ error: "Not found or update failed." }, { status: 404 });

  // Automatic step: write an audit-trail entry for meaningful staff changes.
  if (before) {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    const actor = session?.username || "staff";
    const now = new Date().toISOString();
    if (typeof body.status === "string" && body.status !== before.status) {
      await appendActivity(id, {
        time: now,
        actor,
        action: "Status changed",
        detail: `${before.status} → ${body.status}`,
      });
    }
    if (typeof body.assigned === "string" && body.assigned !== before.assigned) {
      await appendActivity(id, {
        time: now,
        actor,
        action: "Reassigned",
        detail: body.assigned,
      });
    }
    if (typeof body.contacted === "string" && body.contacted && body.contacted !== before.contacted) {
      await appendActivity(id, { time: now, actor, action: "Marked contacted" });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  const ok = await deleteSubmission(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
