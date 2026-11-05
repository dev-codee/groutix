import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { APPLICATION_STATUSES } from "@/lib/careers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["manager", "super_admin"].includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || !(APPLICATION_STATUSES as readonly unknown[]).includes(body.status) || typeof body.notes !== "string" || body.notes.length > 10000) return NextResponse.json({ error: "Check the status and notes (maximum 10,000 characters)." }, { status: 400 });
  const { id } = await params;
  try {
    const updatedAt = new Date().toISOString();
    const result = await (await getDb()).collection("careerApplications").updateOne({ id }, { $set: { status: body.status, notes: body.notes.trim(), updatedAt, updatedBy: session.username } });
    if (!result.matchedCount) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ updatedAt, updatedBy: session.username });
  } catch { return NextResponse.json({ error: "Could not save changes." }, { status: 503 }); }
}
