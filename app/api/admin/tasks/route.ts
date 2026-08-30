import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { listTasks, createTask } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({ items: [] });
  }
  try {
    const tasks = await listTasks();
    return NextResponse.json({ items: tasks });
  } catch (err: any) {
    console.error("admin/tasks GET failed:", err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  try {
    const body = await req.json();
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Task text is required." }, { status: 400 });
    }
    const task = await createTask(text);
    if (!task) {
      return NextResponse.json({ error: "Could not create task." }, { status: 500 });
    }
    return NextResponse.json({ item: task }, { status: 201 });
  } catch (err: any) {
    console.error("admin/tasks POST failed:", err);
    return NextResponse.json(
      { error: `Could not create task: ${err?.message || "Invalid request"}` },
      { status: 400 }
    );
  }
}
