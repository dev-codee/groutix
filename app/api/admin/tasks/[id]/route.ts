import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { updateTask, deleteTask } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const done = Boolean(body.done);
    const ok = await updateTask(id, done);
    if (!ok) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin/tasks PATCH failed:", err);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  try {
    const ok = await deleteTask(id);
    if (!ok) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin/tasks DELETE failed:", err);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
