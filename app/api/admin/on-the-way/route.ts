import { leadBookings } from "@/lib/leadBookings";
import { NextRequest, NextResponse } from "next/server";
import { getSubmission, appendActivity, type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";
import { sendSms } from "@/lib/sms";
import { sendEmail, wrapEmailHtml, getEmailLogoUrl, isEmailConfigured } from "@/lib/email";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import { calculateVisitEta } from "@/lib/visitEta";
import { notificationFailure, type VisitNotificationReport, type ChannelOutcome, type NotificationChannel } from "@/lib/visitNotification";
import { claimNotificationAttempt, saveNotificationAttempt } from "@/lib/notificationAttempts";
import { startCustomerTracking, stopCustomerTracking } from "@/lib/customerTrackingServer";
import { validCoordinates } from "@/lib/customerTracking";

export const runtime = "nodejs";
export const maxDuration = 60;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

export async function POST(req: NextRequest) {
  try { return await notify(req); }
  catch { return NextResponse.json({ error: "Could not safely confirm this notification. Check the result using the same attempt before sending again; the notification database or service may be unavailable." }, { status: 503 }); }
}

async function notify(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    leadId: string;
    requestId?: string;
    locationIssue?: string;
    etaOnly?: boolean;
    booking?: { type: "job" | "inspection"; start: string; bookingId?: string };
    lat: number | null;
    lng: number | null;
    eventType: "en_route" | "arrived";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { leadId, eventType } = body;
  const lat = body.lat ?? null, lng = body.lng ?? null;
  const requestId = body.requestId || randomUUID();
  if (typeof requestId !== "string" || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId)) return NextResponse.json({ error: "Invalid notification attempt. Refresh and try again." }, { status: 400 });
  if (typeof leadId !== "string" || !ObjectId.isValid(leadId) || !["en_route", "arrived"].includes(eventType)) {
    return NextResponse.json({ error: "Invalid leadId or eventType" }, { status: 400 });
  }
  if ((lat != null || lng != null) && !validCoordinates(lat, lng)) {
    return NextResponse.json({ error: "Invalid GPS coordinates" }, { status: 400 });
  }

  const lead = await getSubmission(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const booking = body.booking;
  if (booking) {
    const visit = leadBookings(lead).find(item => item.type === booking.type && `${item.date}T${item.time}` === booking.start && (!booking.bookingId || item.bookingId === booking.bookingId));
    const expectedStatus = `${booking.type === "job" ? "Job" : "Inspection"} ${eventType === "en_route" ? "En Route" : "Arrived"}`;
    if (!visit || visit.status !== expectedStatus || ["Lost", "Cancelled"].includes(lead.status)) {
      return NextResponse.json({ error: "This booking has changed. Refresh before notifying the customer." }, { status: 409 });
    }
  }

  const firstName = (lead.name || "").split(" ")[0].trim() || "there";
  const customerAddress = lead.address || "";
  const htmlFirstName = escapeHtml(firstName);
  const identity = JSON.stringify([leadId, session.username, eventType, booking?.type || "", booking?.start || "", booking?.bookingId || ""]);
  const { claimed, attempt } = await claimNotificationAttempt(requestId, identity);
  if (!claimed) return NextResponse.json({ processing: true, report: attempt.report,
    error: "This attempt is still processing or its result is unconfirmed. Check the result again; do not start a duplicate notification. If it stays unconfirmed, check the provider’s records." }, { status: 202 });
  const initial: ChannelOutcome = { status: "failed", reason: "Not sent yet.", nextStep: "", retryable: true };
  const report: VisitNotificationReport = attempt.report || { requestId, channels: { sms: { ...initial }, email: { ...initial } },
    eta: { text: null, minutes: null, source: "unavailable", reason: "Not checked yet.", nextStep: "" }, trackingUrl: null, warnings: [], messages: [] };
  report.warnings = [];
  report.eta = eventType === "en_route" ? await calculateVisitEta(lat, lng, customerAddress, body.locationIssue)
    : { text: null, minutes: null, source: "unavailable", reason: "An arrival notification does not need an ETA.", nextStep: "" };
  let trackingUrl = report.trackingUrl;
  try {
    if (eventType === "en_route" && !trackingUrl) trackingUrl = await startCustomerTracking(leadId, session.username, lat, lng, booking);
    if (eventType === "arrived") await stopCustomerTracking(leadId, booking);
  } catch { report.warnings.push(eventType === "arrived" ? "Could not stop the tracking session. Refresh the booking and check tracking status." : "The live tracking link could not be created. Check database availability, then retry the failed notification."); }
  report.trackingUrl = trackingUrl;
  const etaText = report.eta.text || "";
  const etaMinutes = report.eta.minutes || 0;
  await saveNotificationAttempt(requestId, report, true);

  // ── SMS ──────────────────────────────────────────────────────────────────
  let smsBody =
    eventType === "en_route"
      ? etaText
        ? `Hi ${firstName}, your Groutix specialist is on the way and estimated travel time is ${etaText} (approximate; no live traffic). See you soon! - Groutix (03) 7023 8094`
        : `Hi ${firstName}, your Groutix specialist is on the way. See you soon! - Groutix (03) 7023 8094`
      : `Hi ${firstName}, your Groutix specialist has arrived at your property. - Groutix (03) 7023 8094`;
  if (trackingUrl) smsBody += `\n\nTrack your specialist's live location:\n${trackingUrl}`;

  // ── Email ─────────────────────────────────────────────────────────────────
  const emailSubject =
    eventType === "en_route"
      ? "Groutix - Your specialist is on the way!"
      : "Groutix - Your specialist has arrived!";

  const emailContentHtml =
    eventType === "en_route"
      ? `
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#0f172a;">Your specialist is on the way!</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi <strong>${htmlFirstName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
          Your Groutix specialist is currently heading to your property and will be with you shortly.
        </p>
        ${
          etaText
            ? `<div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:20px 24px;margin:0 0 24px;text-align:center;">
            <div style="font-size:13px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Approximate Arrival · No Live Traffic</div>
            <div style="font-size:32px;font-weight:900;color:#001f97;">${etaText}</div>
          </div>`
            : ""
        }
        ${trackingUrl ? `<p style="margin:0 0 24px;text-align:center;"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#001f97;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Track your specialist live</a></p><p style="margin:0 0 24px;font-size:13px;color:#64748b;text-align:center;">Location updates automatically while your specialist is on the way.</p>` : ""}
        <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
          If you have any questions, please don't hesitate to call us on <a href="tel:+61370238094" style="color:#001f97;font-weight:700;text-decoration:none;">(03) 7023 8094</a> or visit <a href="https://groutix.com" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">groutix.com</a>.
        </p>
        <p style="margin:0;font-size:14px;color:#334155;">See you soon!<br/><strong>The Groutix Team</strong></p>
      `
      : `
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#0f172a;">Your specialist has arrived!</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi <strong>${htmlFirstName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
          Your Groutix specialist has arrived at your property and is ready to get started.
        </p>
        <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:0 0 24px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Status</div>
          <div style="font-size:24px;font-weight:900;color:#15803d;">We're here!</div>
        </div>
        <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
          If you have any questions or concerns, please speak directly with our specialist, visit <a href="https://groutix.com" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">groutix.com</a>, or call us on <a href="tel:+61370238094" style="color:#001f97;font-weight:700;text-decoration:none;">(03) 7023 8094</a>.
        </p>
        <p style="margin:0;font-size:14px;color:#334155;">Thank you for choosing Groutix!<br/><strong>The Groutix Team</strong></p>
      `;

  const newlyAccepted: CustomerMessage[] = [];
  for (const channel of ["sms", "email"] as NotificationChannel[]) {
    if (body.etaOnly || ["accepted", "unknown", "sending"].includes(report.channels[channel].status)) continue;
    const contact = (channel === "sms" ? lead.phone : lead.email)?.trim();
    if (!contact) {
      report.channels[channel] = { status: "failed", reason: `The customer has no ${channel === "sms" ? "phone number" : "email address"}.`, nextStep: `Add it to the lead, then retry ${channel === "sms" ? "SMS" : "email"}.`, retryable: true };
      await saveNotificationAttempt(requestId, report, true); continue;
    }
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || channel === "sms" && !/^\+?[\d\s().-]{8,30}$/.test(contact)) {
      report.channels[channel] = { status: "failed", reason: "The customer’s contact details are invalid.", nextStep: `Correct the ${channel === "sms" ? "phone number" : "email address"} in the lead, then retry.`, retryable: true };
      await saveNotificationAttempt(requestId, report, true); continue;
    }
    if (channel === "email" && !isEmailConfigured()) {
      report.channels.email = notificationFailure("email", "not_configured", true);
      await saveNotificationAttempt(requestId, report, true); continue;
    }
    let html = "";
    if (channel === "email") {
      try { html = wrapEmailHtml(emailContentHtml, emailSubject, await getEmailLogoUrl()); }
      catch { report.channels.email = { status: "failed", reason: "The email could not be prepared.", nextStep: "Check site content and database availability, then retry email.", retryable: true }; await saveNotificationAttempt(requestId, report, true); continue; }
    }
    report.channels[channel] = { status: "sending", reason: "Waiting for provider confirmation.", nextStep: "Check this attempt’s result before sending again.", retryable: false };
    await saveNotificationAttempt(requestId, report, true); // Persist before contacting the provider.
    let smsText = smsBody;
    try {
      if (channel === "sms") {
        const result = await sendSms({ to: contact, body: smsBody, campaign: "Groutix CRM" });
        if (result.ok) {
          smsText = result.body || smsBody;
          report.channels.sms = { status: "accepted", reason: "Accepted by the SMS provider for delivery.", nextStep: "Final handset delivery is not confirmed here.", retryable: false };
        } else report.channels.sms = notificationFailure("sms", result.uncertain ? "unconfirmed" : result.error, result.skipped);
      } else {
        await sendEmail({ fromName: "Groutix", toEmail: contact, subject: emailSubject, html, attempts: 1, requireAcceptance: true });
        report.channels.email = { status: "accepted", reason: "Accepted by the email server for delivery.", nextStep: "Inbox delivery is not confirmed here; check for bounces.", retryable: false };
      }
    } catch (err) { report.channels[channel] = notificationFailure(channel, err); }
    if (report.channels[channel].status === "accepted") {
      const message: CustomerMessage = { id: `visit_${requestId}_${channel}`, from: "groutix", channel,
        subject: emailSubject, text: channel === "sms" ? smsText : `${eventType === "en_route" ? "Your Groutix specialist is on the way." : "Your Groutix specialist has arrived."}${etaText ? ` Approximate travel time: ${etaText}; no live traffic.` : ""}${trackingUrl && eventType === "en_route" ? `\nTrack your specialist: ${trackingUrl}` : ""}`, time: new Date().toISOString() };
      report.messages.push(message); newlyAccepted.push(message);
    }
    await saveNotificationAttempt(requestId, report, true); // A retry skips accepted/unknown channels.
  }
  if (newlyAccepted.length) {
    try {
      const result = await (await getDb()).collection<SubmissionDoc>("submissions").updateOne({ _id: new ObjectId(leadId) }, { $addToSet: { messages: { $each: newlyAccepted } } });
      if (!result.matchedCount) report.warnings.push("The provider accepted the notification, but the customer conversation could not be updated. Do not resend; check the notification records.");
    } catch { report.warnings.push("The provider accepted the notification, but saving the conversation failed. Do not resend; check database availability."); }
  }
  try {
    await appendActivity(leadId, { time: new Date().toISOString(), actor: session.username, action: `${eventType === "en_route" ? "On The Way" : "Arrived"} notification result`,
      detail: `SMS: ${report.channels.sms.status}. Email: ${report.channels.email.status}. ${report.eta.reason}` });
  } catch { report.warnings.push("The notification activity log could not be saved. Check database availability."); }
  await saveNotificationAttempt(requestId, report, false);
  const accepted = Object.values(report.channels).filter(channel => channel.status === "accepted").length;
  return NextResponse.json({ ok: accepted > 0, report, eta: etaText || null, etaMinutes: etaMinutes || null, trackingUrl,
    messages: report.messages, message: report.messages[0] }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
