import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import {
  getAllQuoteTemplates,
  listCustomQuoteTemplates,
  saveCustomQuoteTemplate,
  deleteCustomQuoteTemplate,
  replaceQuoteTemplate,
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
    customTemplates: custom.filter(item => !item.replacesNo),
  });
}

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Parameters<typeof saveCustomQuoteTemplate>[0];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || !body.service || typeof body.service !== "string") {
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
    isLibraryCopy: true,
  });

  return NextResponse.json({ ok: true, success: true, template: saved });
}

export async function PATCH(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  if (!body || typeof body.targetNo !== "string" || !body.targetNo.trim() || typeof body.targetCode !== "string" ||
    typeof body.service !== "string" || !body.service.trim() || typeof body.scope !== "string" ||
    typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
    return NextResponse.json({ error: "Select a library item and enter a title, scope and valid price." }, { status: 400 });
  }
  try {
    const saved = await replaceQuoteTemplate({ targetNo: body.targetNo, targetCode: body.targetCode,
      service: body.service, scope: body.scope, price: body.price });
    if (!saved) return NextResponse.json({ error: "The selected library item no longer exists. Select it again before updating." }, { status: 404 });
    return NextResponse.json({ ok: true, success: true, template: saved });
  } catch (error) {
    console.error("Failed to replace library item:", error);
    return NextResponse.json({ error: "Could not update the library. Your quote edits are still available. Try again." }, { status: 503 });
  }
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
