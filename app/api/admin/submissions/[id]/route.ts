import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  deleteSubmission,
  getSubmission,
  updateSubmission,
  appendActivity,
} from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { autoSendInvoice } from "@/lib/automations";
import { sendInternalAlert, sendEmail, wrapEmailHtml, getEmailLogoUrl, isEmailConfigured } from "@/lib/email";
import { sendSms, isSmsConfigured, prepareSinglePartSms } from "@/lib/sms";
import { formatAppt } from "@/lib/scheduling";
import { createBooking, deleteBooking } from "@/lib/bookings";
import { resolveArea } from "@/lib/scheduling";
import { getTechnician } from "@/lib/technicians";
import { getStaffMemberByUsername } from "@/lib/users";

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
    rows.push(`<p><b>${whenLabel} time:</b> ${formatAppt(when, { weekday: "long", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) || when}</p>`);
  }

  const logoUrl = await getEmailLogoUrl();
  await sendEmail({
    toEmail: tech.email,
    subject: `New Groutix assignment${lead.address ? ` — ${lead.address}` : ""}`,
    html: wrapEmailHtml(
      `<h2 style="margin:0 0 12px">You've been assigned a job</h2>
       <p>Hi ${tech.name}, you've been dispatched to the following:</p>
       ${rows.join("\n")}
       <p style="margin-top:16px;color:#64748b">Please review the details and be on site on time.</p>`,
      "You've been assigned a new Groutix job",
      logoUrl
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


      // ── Transition automations (auto-invoice / auto-warranty) ──
      // Best-effort; each helper is internally guarded and idempotent.
      if (body.status === "Job Done") {
        // Invoice is no longer auto-sent — Finance (Login 3) issues it manually.
        await sendInternalAlert({
          title: "Job completed",
          emoji: "🧾",
          accent: "#001f97",
          lines: [
            `${before.name || "A customer"} — ${before.address || ""}`.trim(),
            `Job is completed. Please review and send the invoice manually.`,
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

      // Email the newly assigned staff member their lead details
      if (body.assigned && isEmailConfigured()) {
        try {
          const staffMember = await getStaffMemberByUsername(body.assigned);
          if (staffMember?.email) {
            const logoUrl = await getEmailLogoUrl();
            const lead = before;
            const rows: string[] = [];
            if (lead.name) rows.push(`<p><b>Customer:</b> ${lead.name}</p>`);
            if (lead.address) rows.push(`<p><b>Address:</b> ${lead.address}</p>`);
            if (lead.phone) rows.push(`<p><b>Phone:</b> ${lead.phone}</p>`);
            if (lead.service) rows.push(`<p><b>Service:</b> ${lead.service}</p>`);
            if (lead.status) rows.push(`<p><b>Status:</b> ${lead.status}</p>`);
            if (lead.inspectionAt) {
              rows.push(`<p><b>Inspection:</b> ${formatAppt(lead.inspectionAt, { weekday: "long", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) || lead.inspectionAt}</p>`);
            }
            await sendEmail({
              toEmail: staffMember.email,
              subject: `New lead assigned to you${lead.address ? ` — ${lead.address}` : ""}`,
              html: wrapEmailHtml(
                `<h2 style="margin:0 0 12px">You've been assigned a lead</h2>
                 <p>Hi ${staffMember.name || staffMember.username}, a new lead has been assigned to you:</p>
                 ${rows.join("\n")}
                 <p style="margin-top:16px;color:#64748b">Please log in to the CRM to review all details and take action.</p>`,
                "New Groutix lead assigned",
                logoUrl
              ),
            });
          }
        } catch (err) {
          console.error("Staff assignment email failed (non-fatal):", err);
        }
      }
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

          // Reschedule: notify customer when an existing booking is moved.
          if (before.inspectionAt) {
            await updateSubmission(id, { inspectionRescheduled: true });
            await appendActivity(id, {
              time: now,
              actor,
              action: "Inspection rescheduled",
              detail: `${formatAppt(before.inspectionAt, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) || before.inspectionAt} → ${formatAppt(body.inspectionAt, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) || body.inspectionAt}`,
            });

            const newDateLabel = formatAppt(body.inspectionAt, {
              weekday: "long", day: "2-digit", month: "short",
              year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
            }) || body.inspectionAt;
            const firstName = before.name?.trim().split(/\s+/)[0] || "there";
            const propertyAddress = before.address || "your property";

            if (isEmailConfigured() && before.email) {
              const logoUrl = await getEmailLogoUrl();
              await sendEmail({
                toEmail: before.email,
                subject: "Your Groutix Inspection Has Been Rescheduled",
                html: wrapEmailHtml(
                  `<h2 style="margin:0 0 12px">Inspection Rescheduled</h2>
                   <p>Hi ${firstName},</p>
                   <p>Your on-site inspection at <strong>${propertyAddress}</strong> has been rescheduled to:</p>
                   <p style="font-size:16px;font-weight:bold;color:#001f97;margin:12px 0">&#128197; ${newDateLabel}</p>
                   <p>If you have any questions or need to reschedule again, please reply to this email, visit <a href="https://groutix.com" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">groutix.com</a>, or call us on <a href="tel:70238094" style="color:#001f97;font-weight:700;text-decoration:none;">7023 8094</a>.</p>
                   <p>Kind regards,<br>Groutix Team</p>`,
                  "Your Groutix inspection has been rescheduled",
                  logoUrl
                ),
              }).catch((err) => console.error("Reschedule email failed (non-fatal):", err));
            }

            if (isSmsConfigured() && before.phone) {
              const shortLabel = formatAppt(body.inspectionAt, {
                weekday: "short", day: "numeric", month: "short",
                hour: "numeric", minute: "2-digit", hour12: true,
              }) || body.inspectionAt;
              const smsBody = prepareSinglePartSms(
                `Your Groutix inspection has been rescheduled to ${shortLabel}. Call 7023 8094 for questions.`
              );
              await sendSms({ to: before.phone, body: smsBody, campaign: "inspection_reschedule" }).catch(
                (err) => console.error("Reschedule SMS failed (non-fatal):", err)
              );
            }
          }
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
