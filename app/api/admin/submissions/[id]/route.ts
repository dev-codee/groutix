import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  deleteSubmission,
  getSubmission,
  updateSubmission,
  appendActivity,
  pickAssigneeForRole,
} from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { autoSendInvoice, autoSendWarranty } from "@/lib/automations";
import { sendInternalAlert } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Email + PDF generation can run on some transitions (auto-invoice / warranty).
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  const item = await getSubmission(id);
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Snapshot the prior state so we can record what actually changed.
  const before = await getSubmission(id);
  const ok = await updateSubmission(id, body);
  if (!ok) return NextResponse.json({ error: "Not found or update failed." }, { status: 404 });

  // Automatic step: write an audit-trail entry for meaningful staff changes.
  if (before) {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    const actor = session?.username || "staff";
    const now = new Date().toISOString();
    if (typeof body.status === "string" && body.status !== before.status) {
      await appendActivity(id, {
        time: now,
        actor,
        action: "Status changed",
        detail: `${before.status} → ${body.status}`,
      });

      // Automatic handoff between role queues. Only reassign when the caller
      // didn't set an assignee themselves, so a manual override always wins.
      if (typeof body.assigned !== "string") {
        let handoffRole: "intake" | "finance" | null = null;
        if (body.status === "Inspection Completed") handoffRole = "intake"; // back to intake to quote
        else if (body.status === "Job Done") handoffRole = "finance"; // to finance to invoice
        if (handoffRole) {
          const assignee = await pickAssigneeForRole(handoffRole);
          if (assignee && assignee !== "Unassigned" && assignee !== before.assigned) {
            await updateSubmission(id, { assigned: assignee });
            await appendActivity(id, {
              time: now,
              actor: "system",
              action: handoffRole === "intake" ? "Handed to Intake for quoting" : "Handed to Finance for invoicing",
              detail: assignee,
            });
          }
        }
      }

      // ── Transition automations (auto-invoice / auto-warranty) ──
      // Best-effort; each helper is internally guarded and idempotent.
      if (body.status === "Job Done") {
        await autoSendInvoice(id);
        await sendInternalAlert({
          title: "Job completed — invoice sent",
          emoji: "🧾",
          accent: "#001f97",
          lines: [
            `${before.name || "A customer"} — ${before.address || ""}`.trim(),
            `The invoice has been auto-generated and emailed. Awaiting payment.`,
          ],
          leadId: id,
        });
      } else if (body.status === "Payment Received") {
        await autoSendWarranty(id);
        await sendInternalAlert({
          title: "Payment received",
          emoji: "💰",
          accent: "#16a34a",
          lines: [
            `${before.name || "A customer"}${before.quoteAmount ? ` — AUD $${before.quoteAmount.toFixed(2)}` : ""}`,
            `The 10-year warranty has been auto-generated and emailed. Job complete 🏆`,
          ],
          leadId: id,
        });
      }
    }
    if (typeof body.assigned === "string" && body.assigned !== before.assigned) {
      await appendActivity(id, {
        time: now,
        actor,
        action: "Reassigned",
        detail: body.assigned,
      });
    }
    if (typeof body.contacted === "string" && body.contacted && body.contacted !== before.contacted) {
      await appendActivity(id, { time: now, actor, action: "Marked contacted" });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const { id } = await params;
  const ok = await deleteSubmission(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
