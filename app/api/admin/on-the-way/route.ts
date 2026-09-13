import { NextRequest, NextResponse } from "next/server";
import { getSubmission, appendActivity } from "@/lib/submissions";
import { sendSms } from "@/lib/sms";
import { sendEmail, wrapEmailHtml } from "@/lib/email";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";

export const runtime = "nodejs";

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Approximate Melbourne CBD centre as fallback destination for Haversine
const MELBOURNE_CENTRE = { lat: -37.8136, lng: 144.9631 };

/**
 * Calculate ETA using Google Maps Distance Matrix API.
 * Falls back to Haversine at avg 35 km/h driving speed if the API is
 * unavailable or returns a non-OK element status.
 */
async function calculateEta(
  staffLat: number,
  staffLng: number,
  destinationAddress: string
): Promise<{ etaText: string; etaMinutes: number }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";

  const haversineFallback = () => {
    const distKm = haversineKm(
      staffLat,
      staffLng,
      MELBOURNE_CENTRE.lat,
      MELBOURNE_CENTRE.lng
    );
    const minutes = Math.max(1, Math.round((distKm / 35) * 60));
    return {
      etaText: `${minutes} min${minutes !== 1 ? "s" : ""}`,
      etaMinutes: minutes,
    };
  };

  if (!apiKey) return haversineFallback();

  try {
    const encoded = encodeURIComponent(destinationAddress);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${staffLat},${staffLng}&destinations=${encoded}&key=${apiKey}&mode=driving`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return haversineFallback();
    const data = await res.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") return haversineFallback();
    const durationText: string = element.duration?.text || "";
    const durationSec: number = element.duration?.value || 0;
    const etaMinutes = Math.max(1, Math.round(durationSec / 60));
    return {
      etaText: durationText || `${etaMinutes} mins`,
      etaMinutes,
    };
  } catch {
    return haversineFallback();
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    leadId: string;
    lat: number | null;
    lng: number | null;
    eventType: "en_route" | "arrived";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { leadId, lat, lng, eventType } = body;
  if (!leadId || !eventType) {
    return NextResponse.json({ error: "Missing leadId or eventType" }, { status: 400 });
  }

  const lead = await getSubmission(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const firstName = (lead.name || "").split(" ")[0].trim() || "there";
  const customerAddress = lead.address || "";

  // Calculate ETA if we have staff GPS coords and a destination address
  let etaText = "";
  let etaMinutes = 0;
  if (eventType === "en_route" && lat != null && lng != null && customerAddress) {
    const eta = await calculateEta(lat, lng, customerAddress);
    etaText = eta.etaText;
    etaMinutes = eta.etaMinutes;
  }

  // ── SMS ──────────────────────────────────────────────────────────────────
  const smsBody =
    eventType === "en_route"
      ? etaText
        ? `Hi ${firstName}, your Groutix specialist is on the way and should arrive in approx ${etaText}. See you soon! - Groutix 7023 8094`
        : `Hi ${firstName}, your Groutix specialist is on the way. See you soon! - Groutix 7023 8094`
      : `Hi ${firstName}, your Groutix specialist has arrived at your property. - Groutix 7023 8094`;

  if (lead.phone) {
    sendSms({ to: lead.phone, body: smsBody, campaign: "Groutix CRM" }).catch(() => {});
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  const emailSubject =
    eventType === "en_route"
      ? "Groutix - Your specialist is on the way!"
      : "Groutix - Your specialist has arrived!";

  const emailContentHtml =
    eventType === "en_route"
      ? `
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#0f172a;">Your specialist is on the way!</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
          Your Groutix specialist is currently heading to your property and will be with you shortly.
        </p>
        ${
          etaText
            ? `<div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:20px 24px;margin:0 0 24px;text-align:center;">
            <div style="font-size:13px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Estimated Arrival</div>
            <div style="font-size:32px;font-weight:900;color:#001f97;">${etaText}</div>
          </div>`
            : ""
        }
        <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
          If you have any questions, please don't hesitate to call us on <strong>7023 8094</strong>.
        </p>
        <p style="margin:0;font-size:14px;color:#334155;">See you soon!<br/><strong>The Groutix Team</strong></p>
      `
      : `
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#0f172a;">Your specialist has arrived!</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
          Your Groutix specialist has arrived at your property and is ready to get started.
        </p>
        <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:0 0 24px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Status</div>
          <div style="font-size:24px;font-weight:900;color:#15803d;">We're here!</div>
        </div>
        <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
          If you have any questions or concerns, please speak directly with our specialist or call us on <strong>7023 8094</strong>.
        </p>
        <p style="margin:0;font-size:14px;color:#334155;">Thank you for choosing Groutix!<br/><strong>The Groutix Team</strong></p>
      `;

  if (lead.email) {
    sendEmail({
      fromName: "Groutix",
      toEmail: lead.email,
      subject: emailSubject,
      html: wrapEmailHtml(emailContentHtml, emailSubject),
    }).catch(() => {});
  }

  // ── Activity log ─────────────────────────────────────────────────────────
  const detail =
    eventType === "en_route"
      ? etaText
        ? `Notified customer: on the way. ETA: ${etaText}.`
        : "Notified customer: on the way (no GPS/ETA)."
      : "Notified customer: specialist arrived.";

  await appendActivity(leadId, {
    time: new Date().toISOString(),
    actor: session.username || "staff",
    action:
      eventType === "en_route"
        ? "On The Way notification sent"
        : "Arrived notification sent",
    detail,
  });

  return NextResponse.json({
    ok: true,
    eta: etaText || null,
    etaMinutes: etaMinutes || null,
  });
}
