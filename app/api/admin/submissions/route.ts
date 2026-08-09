import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { listSubmissions, parseListParams } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const params = parseListParams(sp);
  params.page = Math.max(1, Number(sp.get("page")) || 1);
  params.pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 25));

  try {
    const { items, total } = await listSubmissions(params);
    return NextResponse.json({
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    });
  } catch (err: any) {
    console.error("admin/submissions failed:", err);
    return NextResponse.json(
      { error: `Could not load submissions: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
