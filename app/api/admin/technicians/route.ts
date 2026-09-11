import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listTechnicians, addTechnician } from "@/lib/technicians";

export const runtime = "nodejs";

// All authenticated staff sessions can list technicians for job assignment dropdowns.
// Dispatch management is allowed for field, inspection, intake, manager, super_admin, technician.
const MANAGE_ALLOWED = ["field", "inspection", "intake", "technician", "manager", "super_admin"];

async function requireSession(req: NextRequest) {
  return await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const technicians = await listTechnicians();
  return NextResponse.json({ technicians });
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req);
  if (!session || !MANAGE_ALLOWED.includes(session.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await addTechnician({ name: body.name || "", email: body.email || "" });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ technician: result.technician }, { status: 201 });
}
