import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { isMongoConfigured } from "@/lib/mongodb";
import { getChecklistForm, saveChecklistForm } from "@/lib/checklistFormServer";
import { sanitizeChecklistForm } from "@/lib/checklistForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session || !["manager", "super_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    return NextResponse.json({ form: await getChecklistForm({ strict: true }) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load checklist form settings:", error);
    return NextResponse.json({ error: "Could not load checklist form settings." }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session || !["manager", "super_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured; checklist changes cannot be saved." }, { status: 500 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const form = sanitizeChecklistForm((body as { form?: unknown })?.form);
  try {
    await saveChecklistForm(form, session.username);
    return NextResponse.json({ ok: true, form });
  } catch (error) {
    console.error("Could not save checklist form:", error);
    return NextResponse.json({ error: "Could not save checklist form." }, { status: 500 });
  }
}
