import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { updateUser, deleteUser, type UpdateUserInput } from "@/lib/users";

export const runtime = "nodejs";

async function requireManager(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  return session?.role === "manager" ? session : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireManager(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  let body: UpdateUserInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await updateUser(id, body);
  if (!result.ok)
    return NextResponse.json({ error: result.error || "Not found." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireManager(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const ok = await deleteUser(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
