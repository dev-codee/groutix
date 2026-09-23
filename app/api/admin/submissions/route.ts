import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { listSubmissions, parseListParams, createLead } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const params = parseListParams(sp);
  const isAll = sp.get("all") === "true";
  params.page = Math.max(1, Number(sp.get("page")) || 1);
  params.pageSize = isAll ? 500 : Math.min(500, Math.max(1, Number(sp.get("pageSize")) || 25));

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

export async function POST(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  try {
    const body = await req.json();
    const lead = await createLead(body);
    if (!lead) {
      return NextResponse.json({ error: "Could not create lead." }, { status: 500 });
    }
    return NextResponse.json({ item: lead }, { status: 201 });
  } catch (err: any) {
    console.error("admin/submissions POST failed:", err);
    return NextResponse.json(
      { error: `Could not create lead: ${err?.message || "Invalid request"}` },
      { status: 400 }
    );
  }
}

