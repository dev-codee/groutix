import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  restoreFromRecycleBin,
  permanentlyDeleteFromRecycleBin,
} from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/admin/recycle-bin/[id] — restore a lead from the recycle bin */
export async function POST(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  try {
    const ok = await restoreFromRecycleBin(id);
    if (!ok) return NextResponse.json({ error: "Not found in recycle bin." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin/recycle-bin/[id] POST failed:", err);
    return NextResponse.json(
      { error: `Could not restore lead: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/recycle-bin/[id] — permanently delete a lead */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  try {
    const ok = await permanentlyDeleteFromRecycleBin(id);
    if (!ok) return NextResponse.json({ error: "Not found in recycle bin." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin/recycle-bin/[id] DELETE failed:", err);
    return NextResponse.json(
      { error: `Could not permanently delete lead: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
