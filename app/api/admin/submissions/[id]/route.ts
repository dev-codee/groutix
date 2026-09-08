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
import { autoSendInvoice } from "@/lib/automations";
import { sendInternalAlert, sendEmail, wrapEmailHtml, isEmailConfigured } from "@/lib/email";
import { createBooking, deleteBooking } from "@/lib/bookings";
import { resolveArea } from "@/lib/scheduling";
import { getTechnician } from "@/lib/technicians";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Email + PDF generation can run on some transitions (auto-invoice / warranty).
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Email a newly dispatched field technician the job details. Best-effort:
 * silently no-ops if email isn't configured or the technician can't be found.
 */
async function notifyTechnicianAssigned(
  technicianId: string,
  lead: Awaited<ReturnType<typeof getSubmission>>
): Promise<void> {
  if (!isEmailConfigured() || !lead) return;
  const tech = await getTechnician(technicianId);
  if (!tech || !tech.email) return;

  const when = lead.jobAt || lead.inspectionAt;
  const whenLabel = lead.jobAt ? "Job" : lead.inspectionAt ? "Inspection" : "";
  const rows: string[] = [];
  if (lead.name) rows.push(`<p><b>Customer:</b> ${lead.name}</p>`);
  if (lead.address) rows.push(`<p><b>Address:</b> ${lead.address}</p>`);
  if (lead.phone) rows.push(`<p><b>Phone:</b> ${lead.phone}</p>`);
  if (lead.service) rows.push(`<p><b>Service:</b> ${lead.service}</p>`);
  if (when) {
    const dt = new Date(when);
    rows.push(
      `<p><b>${whenLabel} time:</b> ${Number.isNaN(dt.getTime()) ? when : dt.toLocaleString("en-AU")}</p>`
    );
  }

  await sendEmail({
    toEmail: tech.email,
    subject: `New Groutix assignment${lead.address ? ` — ${lead.address}` : ""}`,
    html: wrapEmailHtml(
      `<h2 style="margin:0 0 12px">You've been assigned a job</h2>
       <p>Hi ${tech.name}, you've been dispatched to the following:</p>
       ${rows.join("\n")}
       <p style="margin-top:16px;color:#64748b">Please review the details and be on site on time.</p>`,
      "You've been assigned a new Groutix job"
    ),
  });
}

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
        // Warranty is NOT auto-sent — Finance (Login 3) issues it manually.
        await sendInternalAlert({
          title: "Payment received",
          emoji: "💰",
          accent: "#16a34a",
          lines: [
            `${before.name || "A customer"}${before.quoteAmount ? ` — AUD $${before.quoteAmount.toFixed(2)}` : ""}`,
            `Send the 10-year warranty from the CRM when ready.`,
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

    // Field-technician dispatch: log it, and email the technician the job
    // details so they know where to go. Best-effort — never blocks the save.
    if (typeof body.technician === "string" && body.technician !== (before.technician || "")) {
      await appendActivity(id, {
        time: now,
        actor,
        action: body.technician ? "Technician assigned" : "Technician unassigned",
        detail: body.technician || undefined,
      });
      if (body.technician && typeof body.technicianId === "string" && body.technicianId) {
        await notifyTechnicianAssigned(body.technicianId, before).catch((err) =>
          console.error("notifyTechnicianAssigned failed (non-fatal):", err)
        );
      }
    }
    if (typeof body.contacted === "string" && body.contacted && body.contacted !== before.contacted) {
      await appendActivity(id, { time: now, actor, action: "Marked contacted" });
    }

    // ── Keep bookings collection in lockstep with manual staff changes ──
    if (body.status === "Lost" || body.status === "Cancelled") {
      await deleteBooking(id);
    } else {
      const area = resolveArea(before.address || before.city);
      if (typeof body.inspectionAt === "string" && body.inspectionAt !== before.inspectionAt) {
        if (body.inspectionAt.includes("T")) {
          const [d, tRaw] = body.inspectionAt.split("T");
          const t = tRaw.slice(0, 5).padStart(5, "0");
          await createBooking({
            leadId: id,
            type: "inspection",
            date: d,
            time: t,
            zone: area.zone,
            suburb: area.suburb || undefined,
            reference: `GX-ADM-${id.slice(-6)}`,
          });
        } else if (!body.inspectionAt) {
          await deleteBooking(id, "inspection");
        }
      }
      if (typeof body.jobAt === "string" && body.jobAt !== before.jobAt) {
        if (body.jobAt.includes("T")) {
          const [d, tRaw] = body.jobAt.split("T");
          const t = tRaw.slice(0, 5).padStart(5, "0");
          await createBooking({
            leadId: id,
            type: "job",
            date: d,
            time: t,
            zone: area.zone,
            suburb: area.suburb || undefined,
            reference: `GX-ADM-${id.slice(-6)}`,
          });
        } else if (!body.jobAt) {
          await deleteBooking(id, "job");
        }
      }
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
  await deleteBooking(id);
  return NextResponse.json({ ok: true });
}
