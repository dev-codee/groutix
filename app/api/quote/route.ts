import { readQuotePhotos } from "@/lib/quotePhotoUpload";
import { parseAdditionalBalconies, type QuoteBalcony } from "@/lib/quoteBalconies";
import { additionalShowerErrors, jobChecklistText, parseAdditionalShowers, type AdditionalShower } from "@/lib/quoteJobChecklist";
import { inspectionConfirmationHtml, inspectionConfirmationSms } from "@/lib/inspectionConfirmation";
import { isCompletePropertyAddress, PROPERTY_ADDRESS_ERROR } from "@/lib/propertyAddress";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { recordSubmission, updateEmailDelivered } from "@/lib/submissions";
import { getSiteContent } from "@/lib/siteContentServer";
import { sendEmail, isInternalEmailAlertEnabled, isEmailConfigured, wrapEmailHtml, getEmailLogoUrl } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { buildBookingSmsUrl } from "@/lib/bookingToken";
import { resolveArea, isSlotOffered } from "@/lib/scheduling";
import { createBooking, isSlotTaken } from "@/lib/bookings";
import { getBookingRules } from "@/lib/bookingRulesServer";
import { getZoneRules } from "@/lib/zoneRulesServer";
import { updateSubmission, appendActivity, getNextJobNo, assignInspectorOnBooking } from "@/lib/submissions";

export const runtime = "nodejs";
// Give the retry sequence room to finish before the platform kills the
// instance (Vercel Pro honours this; Hobby is capped lower).
export const maxDuration = 60;

// Where new quote requests are delivered internally.
const TO_EMAIL = process.env.SUPPORT_TO_EMAIL || "info@groutix.com";
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
// Shown in the inbox for the internal notification (customer confirmation
// uses a plain "Groutix" name below).
const INTERNAL_FROM_NAME = "Groutix Website Enquiry";
const CUSTOMER_FROM_NAME = "Groutix";
// Public phone shown to customers for urgent enquiries. Defaults to the
// business number; the current value is loaded per-request in the handler so
// admin edits to the contact number flow through to confirmation emails.
const DEFAULT_CONTACT_PHONE = "(03) 7023 8094";

// Anti-spam limits.
const RATE_LIMIT = 5; // submissions...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ...per 10 minutes per IP.

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Verify a Cloudflare Turnstile token. Returns true when the token is valid,
// or when Turnstile isn't configured yet (so setup isn't blocked).
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set - skipping CAPTCHA verification.");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#0f172a;border:1px solid #e2e8f0;white-space:nowrap;vertical-align:top;">${esc(
    label
  )}</td>
      <td style="padding:8px 12px;color:#334155;border:1px solid #e2e8f0;">${esc(value).replace(
    /\n/g,
    "<br/>"
  )}</td>
    </tr>`;
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 }
    );
  }

  // Throttle repeated submissions from the same IP.
  const ip = clientIp(req);
  if (!rateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  // Bot check - must pass before we do any work or send any mail.
  const captchaToken = ((form.get("cf-turnstile-response") as string | null) ?? "").trim();
  if (!(await verifyTurnstile(captchaToken, ip))) {
    return NextResponse.json(
      { error: "Verification failed. Please tick the box and try again." },
      { status: 403 }
    );
  }

  const get = (key: string) => ((form.get(key) as string | null) ?? "").trim();

  const customerType = get("customerType") || get("clientType");
  const agency = get("agency");
  const tenantsRaw = get("tenants");
  let tenants: { name: string; phone: string; email?: string }[] = [];
  if (tenantsRaw) {
    try {
      const parsed: unknown = JSON.parse(tenantsRaw);
      if (Array.isArray(parsed)) {
        tenants = parsed
          .flatMap((tenant: unknown) => {
            if (!tenant || typeof tenant !== "object") return [];
            const { name, phone, email } = tenant as Record<string, unknown>;
            const details = {
              name: typeof name === "string" ? name.trim() : "",
              phone: typeof phone === "string" ? phone.trim() : "",
              email: typeof email === "string" ? email.trim() || undefined : undefined,
            };
            return details.name || details.phone ? [details] : [];
          });
      }
    } catch {
      tenants = [];
    }
  }

  const firstName = get("firstName");
  const lastName = get("lastName");
  const email = get("email");
  const phone = get("phone");
  const address = get("address");
  const city = get("city");
  const state = get("state");
  const service = get("service") || get("enquiry");
  const enquiry = service;
  const damagedTiles = get("damagedTiles");
  const leaking = get("leaking");
  const message = get("message");
  let checklist: Record<string, string | string[]> | undefined;
  try {
    const raw = get("checklist");
    if (raw && raw.length < 10000) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        checklist = Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string")))) as Record<string, string | string[]>;
      }
    }
  } catch { /* Older forms do not send a checklist. */ }
  let additionalBalconies: QuoteBalcony[] = [];
  const balconiesRaw = get("additionalBalconies");
  if (balconiesRaw) {
    try {
      additionalBalconies = parseAdditionalBalconies(balconiesRaw);
    } catch {
      return NextResponse.json({ error: "Check the leakage, area and tile sizes for each additional balcony." }, { status: 400 });
    }
  }
  let additionalShowers: AdditionalShower[];
  try {
    additionalShowers = parseAdditionalShowers(get("additionalShowers"));
  } catch {
    return NextResponse.json({ error: "Check the additional shower details and try again." }, { status: 400 });
  }
  const showerErrors = additionalShowerErrors(additionalShowers);
  if (Object.keys(showerErrors).length) {
    return NextResponse.json({ error: "Complete the highlighted shower fields.", errors: showerErrors }, { status: 400 });
  }
  const areas = get("areas");
  const heard = get("heard");
  const sourcePage = get("sourcePage");
  const inspectionDate = get("inspectionDate");
  const inspectionTime = get("inspectionTime");
  const requestedInspectionAt = inspectionDate && inspectionTime ? `${inspectionDate}T${inspectionTime.slice(0, 5).padStart(5, "0")}` : undefined;
  const requestedMode = get("quoteRequestMode");
  const quoteRequestMode = inspectionDate && inspectionTime ? "inspection"
    : requestedMode === "quote" || requestedMode === "inspection" ? requestedMode : undefined;

  // Minimal server-side validation mirroring the client.
  if (!firstName || !lastName || !email || !phone) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }
  // The separate suburb-coverage callback form does not book a property visit.
  const coverageOnly = get("enquiryType") === "coverage" && !address && !!city && !inspectionDate && !inspectionTime;
  if (!coverageOnly && !isCompletePropertyAddress(address)) {
    return NextResponse.json({ error: PROPERTY_ADDRESS_ERROR, field: "address" }, { status: 400 });
  }

  // If the customer chose an inspection slot, validate & confirm it's still free
  // BEFORE recording anything or sending any mail. This is the single source of
  // truth for the slot lock: the availability the form loaded can go stale while
  // the form sits open, so we re-check here and reject an already-taken slot with
  // a clear message instead of silently accepting it and forcing staff to adjust.
  const bookingRules = await getBookingRules();
  const zoneRules = await getZoneRules();
  if (inspectionDate && inspectionTime) {
    const inspectionArea = resolveArea(address, zoneRules);
    if (inspectionArea.serviced) {
      if (!isSlotOffered(inspectionArea, inspectionDate, inspectionTime, "inspection", bookingRules, zoneRules)) {
        return NextResponse.json(
          { error: "The inspection time you selected is no longer available. Please pick another slot.", slotConflict: true },
          { status: 409 }
        );
      }
      if (await isSlotTaken(inspectionDate, inspectionTime)) {
        return NextResponse.json(
          { error: "That inspection time has just been booked. Please choose another slot.", slotConflict: true },
          { status: 409 }
        );
      }
    }
  }

  const uploaded = await readQuotePhotos(form);
  if (!uploaded) {
    return NextResponse.json({ error: "Total attachments exceed the maximum size limit. Please upload smaller images." }, { status: 400 });
  }
  const { attachments, submissionPhotos } = uploaded;
  if (checklist) {
    checklist.photoLabels = submissionPhotos.map((photo) => photo.category ? `${photo.category} — ${photo.name}` : photo.name);
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const tenantRows = tenants
    .map(
      (t, i) =>
        row(
          `Tenant ${i + 1}`,
          `${t.name || "-"}${t.phone ? ` &bull; Phone: ${t.phone}` : ""}${t.email ? ` &bull; Email: ${t.email}` : ""
          }`
        )
    )
    .join("");

  const photoLinksHtml = submissionPhotos
    .filter((p) => p.secureUrl || p.url)
    .map((p, i) => `<a href="${esc(p.secureUrl || p.url || '')}" target="_blank" style="color:#001f97;text-decoration:underline;">Photo ${i + 1}</a>`)
    .join(" &bull; ");

  // 1) Internal notification to the Groutix inbox with all the details.
  const internalHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
    <h2 style="margin:0 0 4px;">New Quote Request</h2>
    <p style="margin:0 0 16px;color:#64748b;">Submitted via the Groutix website${sourcePage ? ` (${esc(sourcePage)})` : ""
    }</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      ${row("Customer / Client", customerType)}
      ${agency ? row("Real Estate Agency", agency) : ""}
      ${row("Name", fullName)}
      ${row("Email", email)}
      ${row("Phone", phone)}
      ${row("Address", address)}
      ${tenantRows}
      ${row("City", city)}
      ${row("State", state)}
      ${row("Areas to service", areas)}
      ${row("Service required", service)}
      ${row("Damaged tiles", damagedTiles)}
      ${row("Is area leaking", leaking)}
      ${checklist ? Object.entries(checklist).filter(([, value]) => Array.isArray(value) ? value.length : String(value || "").trim()).map(([key, value]) => row(key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()), Array.isArray(value) ? value.join(", ") : String(value))).join("") : ""}
      ${additionalBalconies.map((balcony, index) => row(`Balcony ${index + 2}`, [`${balcony.area} m²`, `Leaking: ${balcony.leakage}`, balcony.tileSizes.length ? `Tile sizes: ${balcony.tileSizes.join(", ")}` : ""].filter(Boolean).join(" · "))).join("")}
      ${row("Additional showers", jobChecklistText(undefined, "", [], additionalShowers))}
      ${row("Message", message)}
      ${row("Heard about us", heard)}
      ${row("Photos attached", submissionPhotos.length ? `${submissionPhotos.length} attached${photoLinksHtml ? ` (${photoLinksHtml})` : ""}` : "")}
      ${row("Assigned to", "Unassigned — pick it up in the CRM")}
    </table>
  </div>`;

  // 1) Save to DB immediately so we never lose a lead.
  const nowIso = new Date().toISOString();
  const submissionId = await recordSubmission({
    type: "quote",
    customerType,
    agency: agency || undefined,
    tenants: tenants.length ? tenants : undefined,
    name: fullName,
    email,
    phone,
    address,
    city,
    state,
    enquiry,
    service,
    damagedTiles,
    leaking,
    message,
    quoteChecklist: checklist,
    additionalBalconies: additionalBalconies.length ? additionalBalconies : undefined,
    additionalShowers: additionalShowers.length ? additionalShowers : undefined,
    quoteRequestMode,
    requestedInspectionAt,
    areas,
    heard,
    sourcePage,
    assigned: "",
    received: nowIso,
    priority: "Medium",
    activity: [
      { time: nowIso, actor: "system", action: "Lead created", detail: sourcePage || "Website form" },
    ],
    photosCount: submissionPhotos.length,
    photos: submissionPhotos,
    ip,
    userAgent: req.headers.get("user-agent") || undefined,
    emailDelivered: false,
  });
  if (!submissionId && quoteRequestMode) {
    return NextResponse.json({ error: "We couldn’t save your request. Please try again." }, { status: 503 });
  }

  // 1b) If customer selected an inspection slot, book it immediately (only if within 50km service area)
  // Tracks whether that actually succeeded: a slot can be requested but not
  // secured (outside the service area, or another customer took it first), and
  // those customers still need the self-booking link.
  let inspectionSelfBooked = false;
  if (submissionId && inspectionDate && inspectionTime) {
    try {
      const area = resolveArea(address, zoneRules);
      if (area.serviced) {
        const jobNo = await getNextJobNo();
        await updateSubmission(submissionId, { jobNo });
        const lock = await createBooking({
          leadId: submissionId,
          type: "inspection",
          date: inspectionDate,
          time: inspectionTime,
          scheduledMinutes: bookingRules.inspection.slotMinutes,
          zone: area.zone || "flexible",
          suburb: area.suburb || undefined,
          reference: jobNo,
        });
        if (lock.ok) {
          // Store the NAIVE Melbourne wall-clock the customer picked (e.g.
          // "2026-09-16T12:00"), matching the /api/book flow. Never run it through
          // new Date().toISOString() — on a UTC server that reinterprets the local
          // time as UTC and shifts the appointment by the Melbourne offset.
          const inspectionAt = `${inspectionDate}T${inspectionTime.slice(0, 5).padStart(5, "0")}`;
          const saved = await updateSubmission(submissionId, { status: "Inspection Booked", inspectionAt,
            inspectionWorkSegments: [{ date: inspectionDate, time: inspectionTime.slice(0, 5), scheduledMinutes: bookingRules.inspection.slotMinutes }] });
          if (!saved) throw new Error("Could not save inspection booking.");
          inspectionSelfBooked = true;
          // Hand it to the inspection team, or it never reaches their dashboard.
          await assignInspectorOnBooking(submissionId);
          await appendActivity(submissionId, {
            time: new Date().toISOString(),
            actor: "customer",
            action: "Inspection booked via website form",
            detail: `${inspectionDate} at ${inspectionTime}`,
          });
        } else if (lock.conflict) {
          // The pre-check above passed, so this is a genuine race: another
          // customer locked the same slot in the moment between the two checks.
          // Don't silently pretend it's booked — flag it so staff follow up.
          await appendActivity(submissionId, {
            time: new Date().toISOString(),
            actor: "system",
            action: "Inspection slot conflict — not booked",
            detail: `Customer requested ${inspectionDate} at ${inspectionTime}, but the slot was taken. Please contact them to rebook.`,
          });
        }
      }
    } catch (err) {
      console.error("Auto-booking inspection failed (non-fatal):", err);
    }
  }

  // 2) Asynchronously process emails and update status
  const processEmails = async () => {
    let internalSent = false;
    const logoUrl = await getEmailLogoUrl();
    try {
      if (isInternalEmailAlertEnabled()) {
        await sendEmail({
          toEmail: TO_EMAIL,
          fromName: INTERNAL_FROM_NAME,
          fromEmail: FROM_EMAIL,
          replyTo: email || undefined,
          subject: `New Quote Request: ${fullName || "Website"}`,
          html: wrapEmailHtml(internalHtml, undefined, logoUrl),
          attachments: attachments.length ? attachments : undefined,
        });
        internalSent = true;
      }
    } catch (err) {
      logSendError("internal notification", err);
    }

    if (internalSent && submissionId) {
      await updateEmailDelivered(submissionId, true);
    }

    const contactPhone = (await getSiteContent().catch(() => null))?.business.phone || DEFAULT_CONTACT_PHONE;

    const customerHtml = `
      <p style="margin:12px 0 8px;">Thanks, ${esc(firstName)}. We’ve received your request.</p>
      ${quoteRequestMode === "inspection" ? inspectionConfirmationHtml(inspectionDate, inspectionTime, inspectionSelfBooked, bookingRules.inspection.slotMinutes) : ""}
      ${submissionId ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Remote quotes may require verification.</p>` : ""}
      <p style="margin:0;">Questions? Reply or call <a href="tel:${contactPhone.replace(/[^\d+]/g, "")}">${esc(contactPhone)}</a>.</p>`;

    try {
      await sendEmail({
        toEmail: email,
        fromName: CUSTOMER_FROM_NAME,
        fromEmail: FROM_EMAIL,
        replyTo: TO_EMAIL,
        subject: "We've received your request | Groutix",
        html: wrapEmailHtml(customerHtml, "Your Groutix request and next steps.", logoUrl, { compact: true }),
      });
    } catch (err) {
      logSendError("customer confirmation", err);
    }

    // Acknowledge by multipart SMS, preserving the entire signed booking URL.
    if (phone) {
      // Short self-booking link so the customer can pick (or change) their
      // inspection slot straight from the text.
      const smsBookingUrl = !inspectionSelfBooked && submissionId
        ? buildBookingSmsUrl(submissionId, "inspection")
        : "";
      const bookingLine = smsBookingUrl
        ? `\n\nBook or change your free inspection time:\n${smsBookingUrl}`
        : "";
      const smsBody = `Thanks ${firstName || "there"}!\n\nWe've received your enquiry. ${inspectionConfirmationSms(inspectionDate, inspectionTime, inspectionSelfBooked, bookingRules.inspection.slotMinutes)}${bookingLine}\n\nGroutix\nStay Sealed. Stay Smiling.`;
      await sendSms({ to: phone, body: smsBody });
    }
  };

  // Await the email work before responding. On serverless hosts the instance
  // is frozen/torn down the moment we return, which would abandon any pending
  // (un-awaited) email send - that's exactly why quotes were recording but the
  // notification email never arrived and emailDelivered stayed false.
  await processEmails();

  // 3) Return success to the client
  return NextResponse.json({ ok: true, inspectionBooked: inspectionSelfBooked });
}

function logSendError(label: string, err: unknown) {
  console.error(`Brevo email error (${label}):`, err);
}
