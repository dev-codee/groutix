import { NextRequest, NextResponse } from "next/server";
import {
  getSubmission,
  updateSubmission,
  appendActivity,
  getNextSequence,
  formatDocNumber,
  createTask,
} from "@/lib/submissions";
import { verifyBookingToken } from "@/lib/bookingToken";
import {
  resolveArea,
  resolveAreaByCoords,
  computeAvailability,
  isSlotOffered,
  type AreaInfo,
} from "@/lib/scheduling";
import { listUpcomingBookings, createBooking } from "@/lib/bookings";
import { sendEmail, isEmailConfigured, wrapEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";

// Which pipeline statuses allow booking each appointment type.
const INSPECTION_OK = [
  "New",
  "Contacted",
  "Waiting for Info",
  "Inspection Booked",
  "Inspection En Route",
  "Inspection Arrived",
  "Inspection In Progress",
];
const JOB_OK = [
  "Won",
  "Job Booked",
  "Scheduled",
  "Job Confirmed",
  "Job En Route",
  "Job Arrived",
  "Job In Progress",
];

function parseType(v: string | null): "inspection" | "job" | null {
  return v === "inspection" || v === "job" ? v : null;
}

function bookingAllowed(type: "inspection" | "job", status: string): boolean {
  return (type === "inspection" ? INSPECTION_OK : JOB_OK).includes(status);
}

function esc(v: string) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Resolve the customer's service area. Precise GPS coordinates (captured via the
// booking page "use my location" button) win over the lead's stored address text
// because they classify the 15 km Tullamarine circle and corridor day exactly.
function resolveLeadArea(
  lead: { address?: string | null; city?: string | null },
  lat?: number | null,
  lng?: number | null
): AreaInfo {
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return resolveAreaByCoords(lat, lng);
  }
  return resolveArea(lead.address || lead.city);
}

function parseCoord(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function buildMaps(area: AreaInfo, currentLeadId?: string) {
  const bookings = await listUpcomingBookings();
  const bookedByDate = new Map<string, Set<string>>();
  const sameZoneDates = new Set<string>();
  for (const b of bookings) {
    // If the booking belongs to this customer, don't block their own slot for them
    if (b.leadId && b.leadId === currentLeadId) {
      continue;
    }
    if (!bookedByDate.has(b.date)) bookedByDate.set(b.date, new Set());
    bookedByDate.get(b.date)!.add(b.time);
    if (b.zone === area.zone || (area.inner && b.date)) {
      sameZoneDates.add(b.date);
    }
  }
  return { bookedByDate, sameZoneDates };
}

// ── GET: availability for the customer's area ──────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const type = parseType(req.nextUrl.searchParams.get("type"));
  const token = req.nextUrl.searchParams.get("token");
  if (!type) return NextResponse.json({ error: "Invalid booking type." }, { status: 400 });
  if (!verifyBookingToken(id, token)) {
    return NextResponse.json({ error: "This booking link is invalid or has expired." }, { status: 403 });
  }
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (!bookingAllowed(type, lead.status || "")) {
    return NextResponse.json(
      { error: "This booking link is no longer active. Please contact Groutix if you need to change your appointment." },
      { status: 409 }
    );
  }

  const lat = parseCoord(req.nextUrl.searchParams.get("lat"));
  const lng = parseCoord(req.nextUrl.searchParams.get("lng"));
  const area = resolveLeadArea(lead, lat, lng);
  const { bookedByDate, sameZoneDates } = await buildMaps(area, id);
  const days = computeAvailability(area, bookedByDate, sameZoneDates);
  const already = type === "inspection" ? lead.inspectionAt : lead.jobAt;

  return NextResponse.json({
    customer: { name: lead.name || "", address: lead.address || "" },
    type,
    area: {
      label: area.label,
      inner: area.inner,
      suburb: area.suburb,
      zone: area.zone,
      distanceKm: area.distanceKm != null ? Math.round(area.distanceKm * 10) / 10 : null,
      located: lat != null && lng != null,
    },
    days,
    current: already || null,
  });
}

// ── POST: lock a slot & confirm the booking ────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { token?: string; type?: string; date?: string; time?: string; lat?: number; lng?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const type = parseType(body.type || null);
  if (!type) return NextResponse.json({ error: "Invalid booking type." }, { status: 400 });
  if (!verifyBookingToken(id, body.token)) {
    return NextResponse.json({ error: "This booking link is invalid or has expired." }, { status: 403 });
  }
  const date = (body.date || "").trim();
  const time = (body.time || "").trim().slice(0, 5).padStart(5, "0");
  if (!date || !time) return NextResponse.json({ error: "Pick a day and time." }, { status: 400 });

  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (!bookingAllowed(type, lead.status || "")) {
    return NextResponse.json({ error: "This booking link is no longer active." }, { status: 409 });
  }

  const area = resolveLeadArea(
    lead,
    typeof body.lat === "number" ? body.lat : null,
    typeof body.lng === "number" ? body.lng : null
  );
  if (!isSlotOffered(area, date, time)) {
    return NextResponse.json({ error: "That day/time isn't available. Please pick another." }, { status: 400 });
  }

  // Atomically lock the slot (unique index on {date,time}).
  const reference = formatDocNumber("GX-BK", await getNextSequence("booking"));
  const lock = await createBooking({
    leadId: id,
    type,
    date,
    time,
    zone: area.zone,
    suburb: area.suburb || undefined,
    reference,
  });
  if (!lock.ok) {
    return NextResponse.json(
      { error: lock.error },
      { status: lock.conflict ? 409 : 500 }
    );
  }

  const whenIso = `${date}T${time}`;
  const whenLabel = new Date(whenIso).toLocaleString("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const now = new Date().toISOString();

  // Advance the lead + arm the 24h reminder for the fresh appointment.
  if (type === "inspection") {
    await updateSubmission(id, {
      inspectionAt: whenIso,
      status: "Inspection Booked",
      inspectionReminderSent: false,
    });
  } else {
    await updateSubmission(id, {
      jobAt: whenIso,
      status: "Job Booked",
      jobReminderSent: false,
    });
  }
  await appendActivity(id, {
    time: now,
    actor: "customer",
    action: type === "inspection" ? "Inspection booked online" : "Job booked online",
    detail: `${whenLabel} (${reference})`,
  });
  await createTask(
    `${type === "inspection" ? "Inspection" : "Job"} — ${lead.name || "Customer"} on ${whenLabel} [${reference}]`
  );

  // Confirmation to the customer (email + SMS, both best-effort).
  const title = type === "inspection" ? "Your Inspection is Booked" : "Your Job is Booked";
  const html = wrapEmailHtml(
    `
      <h2 style="margin:0 0 12px;color:#001f97;font-size:24px;">${title} ✅</h2>
      <p style="margin:0 0 16px;">Hi ${esc(lead.name || "there")}, your ${type} is confirmed. Here are the details:</p>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0;">
        <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
          <tr><td style="padding:12px;background:#f8fafc;font-weight:600;width:130px;">When</td><td style="padding:12px;">${esc(whenLabel)}</td></tr>
          ${lead.address ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;">Location</td><td style="padding:12px;">${esc(lead.address)}</td></tr>` : ""}
          <tr><td style="padding:12px;background:#f8fafc;font-weight:600;">Reference</td><td style="padding:12px;">${esc(reference)}</td></tr>
        </table>
      </div>
      <p style="margin:16px 0 0;color:#64748b;font-size:13px;">We'll send you a reminder the day before. Need to change it? Reply to this email or call us.</p>
    `,
    `${title} — ${whenLabel}`
  );
  if (isEmailConfigured() && lead.email) {
    try {
      await sendEmail({
        toEmail: lead.email,
        fromName: FROM_NAME,
        fromEmail: FROM_EMAIL,
        replyTo: REPLY_TO,
        subject: `${title} — ${whenLabel}`,
        html,
      });
    } catch (err) {
      console.error("booking confirmation email failed:", err);
    }
  }
  if (lead.phone) {
    await sendSms({
      to: lead.phone,
      body: `Groutix: your ${type} is booked for ${whenLabel}. Ref ${reference}. We'll remind you the day before. Reply or call to change.`,
    });
  }

  return NextResponse.json({ ok: true, reference, whenLabel });
}
