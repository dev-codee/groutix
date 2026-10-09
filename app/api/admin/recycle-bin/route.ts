import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { listRecycleBin, emptyRecycleBin, getRecycleBinCount } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/recycle-bin — list all trashed leads */
export async function GET(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") || undefined;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize")) || 50));

  try {
    const { items, total } = await listRecycleBin({ search, page, pageSize });
    return NextResponse.json({ items, total, page, pageSize });
  } catch (err: any) {
    console.error("admin/recycle-bin GET failed:", err);
    return NextResponse.json(
      { error: `Could not load recycle bin: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/recycle-bin — empty the entire recycle bin */
export async function DELETE() {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  try {
    const count = await emptyRecycleBin();
    return NextResponse.json({ ok: true, deleted: count });
  } catch (err: any) {
    console.error("admin/recycle-bin DELETE failed:", err);
    return NextResponse.json(
      { error: `Could not empty recycle bin: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
