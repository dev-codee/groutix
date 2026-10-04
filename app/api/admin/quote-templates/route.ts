import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import {
  getAllQuoteTemplates,
  listCustomQuoteTemplates,
  saveCustomQuoteTemplate,
  deleteCustomQuoteTemplate,
} from "@/lib/quoteTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await getAllQuoteTemplates();
  const custom = await listCustomQuoteTemplates();

  return NextResponse.json({
    templates: all,
    customTemplates: custom,
  });
}

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.service || typeof body.service !== "string") {
    return NextResponse.json({ error: "Service title is required" }, { status: 400 });
  }

  const saved = await saveCustomQuoteTemplate({
    id: body.id,
    no: body.no,
    code: body.code || "CUSTOM",
    service: body.service,
    scope: body.scope || "",
    price: Number(body.price) || 0,
    category: body.category || "Custom",
    description: body.description || body.service,
  });

  return NextResponse.json({ ok: true, template: saved });
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || searchParams.get("no");
  if (!id) {
    return NextResponse.json({ error: "Template id or no is required" }, { status: 400 });
  }

  const deleted = await deleteCustomQuoteTemplate(id);
  return NextResponse.json({ ok: deleted });
}
