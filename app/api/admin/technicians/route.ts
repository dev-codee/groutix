import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listTechnicians, addTechnician } from "@/lib/technicians";

export const runtime = "nodejs";

// Field techs are dispatched by the Field login (Login 2) and by managers.
const ALLOWED = ["field", "technician", "manager", "super_admin"];

async function requireDispatcher(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  return session && ALLOWED.includes(session.role) ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireDispatcher(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const technicians = await listTechnicians();
  return NextResponse.json({ technicians });
}

export async function POST(req: NextRequest) {
  if (!(await requireDispatcher(req)))
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
