import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_LENGTH = 20000;
type ManagerNote = { _id: string; text: string; updatedAt: string };

async function authorize(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (session.role !== "manager" && session.role !== "super_admin") return { error: NextResponse.json({ error: "Manager access required." }, { status: 403 }) };
  if (!isMongoConfigured()) return { error: NextResponse.json({ error: "Database is not configured." }, { status: 503 }) };
  return { username: session.username };
}

export async function GET(req: NextRequest) {
  const access = await authorize(req);
  if (access.error) return access.error;
  try {
    const db = await getDb();
    const note = await db.collection<ManagerNote>("manager_notes").findOne({ _id: access.username });
    return NextResponse.json({ text: note?.text || "", updatedAt: note?.updatedAt || null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load your notes." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const access = await authorize(req);
  if (access.error) return access.error;
  let body: { text?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body.text !== "string" || body.text.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Notes must be text, up to ${MAX_LENGTH} characters.` }, { status: 400 });
  }
  try {
    const db = await getDb();
    const updatedAt = new Date().toISOString();
    await db.collection<ManagerNote>("manager_notes").updateOne({ _id: access.username }, { $set: { text: body.text, updatedAt } }, { upsert: true });
    return NextResponse.json({ text: body.text, updatedAt });
  } catch {
    return NextResponse.json({ error: "Could not save your notes. Please try again." }, { status: 500 });
  }
}
