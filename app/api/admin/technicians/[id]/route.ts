import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { deleteTechnician } from "@/lib/technicians";

export const runtime = "nodejs";

const ALLOWED = ["field", "manager", "super_admin"];

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || !ALLOWED.includes(session.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const ok = await deleteTechnician(id);
  if (!ok) return NextResponse.json({ error: "Technician not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
