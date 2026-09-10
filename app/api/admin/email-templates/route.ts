import { NextRequest, NextResponse } from "next/server";
import {
  listDbTemplates,
  saveDbTemplate,
  deleteDbTemplate,
  resetDbTemplates,
} from "@/lib/emailTemplatesDb";
import type { EmailTemplate } from "@/lib/emailTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await listDbTemplates();
    return NextResponse.json({ templates });
  } catch (err: any) {
    console.error("GET /api/admin/email-templates failed:", err);
    return NextResponse.json({ error: "Failed to load email templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "reset") {
      const templates = await resetDbTemplates();
      return NextResponse.json({ ok: true, templates });
    }

    const template: EmailTemplate = body.template || body;
    if (!template || !template.name?.trim() || !template.body?.trim()) {
      return NextResponse.json(
        { error: "Template name and message body are required." },
        { status: 400 }
      );
    }

    const id = template.id?.trim() || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedTemplate: EmailTemplate = {
      id,
      category: (template.category?.trim() || "General") as any,
      name: template.name.trim(),
      description: template.description?.trim() || "",
      subject: template.subject?.trim() || "Re: Groutix Enquiry",
      body: template.body.trim(),
    };

    const saved = await saveDbTemplate(sanitizedTemplate);
    return NextResponse.json({ ok: true, template: saved });
  } catch (err: any) {
    console.error("POST /api/admin/email-templates failed:", err);
    return NextResponse.json({ error: "Failed to save email template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Template ID is required." }, { status: 400 });
    }

    const ok = await deleteDbTemplate(id);
    return NextResponse.json({ ok });
  } catch (err: any) {
    console.error("DELETE /api/admin/email-templates failed:", err);
    return NextResponse.json({ error: "Failed to delete email template" }, { status: 500 });
  }
}
