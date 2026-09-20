import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { deleteTechnician, updateTechnician } from "@/lib/technicians";

export const runtime = "nodejs";

const ALLOWED = ["field", "technician", "manager", "super_admin", "inspection", "intake"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || !ALLOWED.includes(session.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: { workDays?: number[] | null; active?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await updateTechnician(id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || !ALLOWED.includes(session.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const ok = await deleteTechnician(id);
  if (!ok) return NextResponse.json({ error: "Technician not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
