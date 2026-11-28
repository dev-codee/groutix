import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

for (const booked of [true, false]) {
  test(`quote submission sends matching three-hour email and SMS for a ${booked ? "confirmed" : "requested"} inspection`, async () => {
    const emails = [], texts = [], submissions = [], updates = [], activities = [];
    const rules = structuredClone(loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES);
    rules.inspection.slotMinutes = 180;
    const scheduling = loadTs("lib/scheduling.ts");
    const submissionApi = {
      recordSubmission: async (...args) => { submissions.push(args); return "lead"; },
      updateSubmission: async (...args) => { updates.push(args); return true; },
      updateEmailDelivered: async () => {},
      appendActivity: async (...args) => { activities.push(args); },
      getNextJobNo: async () => "Job No-123", assignInspectorOnBooking: async () => {},
    };
    const { POST } = loadTs("app/api/quote/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
      "@/lib/rateLimit": { rateLimit: () => true },
      "@/lib/submissions": submissionApi,
      "./submissions": submissionApi,
      "@/lib/siteContentServer": { getSiteContent: async () => ({ business: { phone: "(03) 7023 8094" } }) },
      "@/lib/email": {
        isEmailConfigured: () => true, isInternalEmailAlertEnabled: () => false, getEmailLogoUrl: async () => "",
        wrapEmailHtml: html => html, sendEmail: async email => { emails.push(email); },
      },
      "@/lib/sms": { sendSms: async sms => { texts.push(sms); return { ok: true }; } },
      "@/lib/bookingToken": { buildBookingSmsUrl: () => "https://groutix.com/b" },
      "@/lib/bookings": {
        listUpcomingBookings: async () => [], isSlotTaken: async () => false,
        createBooking: async () => ({ ok: booked, conflict: !booked }),
      },
      "@/lib/bookingRulesServer": { getBookingRules: async () => rules },
      "@/lib/zoneRulesServer": { getZoneRules: async () => loadTs("lib/zoneRules.ts").DEFAULT_ZONE_RULES },
      "@/lib/scheduling": { ...scheduling, isSlotOffered: () => true, computeAvailability: () => [] },
      "@/lib/cloudinary": { isCloudinaryConfigured: () => false },
    }, { process: { env: {} }, console: { ...console, warn: () => {} } });
    const fields = {
      firstName: "Sam", lastName: "Customer", email: "sam@example.test", phone: "0400000000",
      checklist: JSON.stringify({ location: "Main bathroom shower", work: "Grout only", additional: ["Kitchen"] }),
      additionalShowers: JSON.stringify([
        { checklist: { location: "Ensuite shower", work: "Grout and silicone", showerScope: "Floor only", leakNotes: "By the drain" }, leaking: "Yes" },
      ]),
      address: "12 Smith Street, Gowanbrae VIC 3043", areas: "Ensuite Bathroom, Main Bathroom, Other", inspectionDate: "2026-10-22", inspectionTime: "09:00",
    };
    for (const address of ["", "Melbourne", "Richmond VIC 3121", "3000 Melbourne", "12 Smith Street"]) {
      const invalid = await POST({
        headers: { get: () => null },
        formData: async () => ({ get: key => key === "address" ? address : fields[key] ?? null, getAll: () => [] }),
      });
      assert.equal(invalid.status, 400);
      assert.equal(invalid.body.field, "address");
      assert.match(invalid.body.error, /street number, street name and suburb/);
      assert.equal(emails.length, 0);
      assert.equal(texts.length, 0);
      assert.equal(submissions.length, 0);
    }
    const incomplete = await POST({
      headers: { get: () => null },
      formData: async () => ({ get: key => key === "additionalShowers" ? JSON.stringify([{ checklist: {}, leaking: "" }]) : fields[key] ?? null, getAll: () => [] }),
    });
    assert.equal(incomplete.status, 400);
    assert.ok(incomplete.body.errors["shower-1-leaking"]);
    assert.equal(submissions.length, 0);
    const response = await POST({
      headers: { get: () => null },
      formData: async () => ({ get: key => fields[key] ?? null, getAll: () => [] }),
    });
    assert.equal(response.status, 200);
    assert.equal(submissions[0][0].areas, fields.areas);
    assert.equal(submissions[0][0].quoteChecklist.work, "Grout only");
    assert.deepEqual(Array.from(submissions[0][0].quoteChecklist.additional), ["Kitchen"]);
    assert.equal(submissions[0][0].additionalShowers[0].checklist.leakNotes, "By the drain");
    assert.equal(submissions[0][0].additionalShowers[0].leaking, "Yes");
    const customerEmails = emails.filter(email => email.toEmail === fields.email);
    assert.equal(customerEmails.length, 1);
    const customerEmail = customerEmails[0];
    assert.doesNotMatch(customerEmail.html, /Complete My Quote Form|Fill in My Checklist|Book Free Inspection/i);
    assert.doesNotMatch(customerEmail.html, /\/checklist\/|\/book\//i);
    assert.ok(!updates.some(([, changes]) => changes.checklistSentAt));
    assert.ok(!activities.some(([, entry]) => entry.action === "Checklist emailed"));
    assert.ok(customerEmail.html.includes("9:00 AM – 12:00 PM"));
    assert.equal(texts.length, 1);
    assert.ok(texts[0].body.includes("9:00 AM – 12:00 PM"));
    assert.ok(!customerEmail.html.includes("30-minute"));
    assert.ok(!texts[0].body.includes("9:30 AM"));
    if (booked) assert.match(texts[0].body, /Your inspection is booked/);
    else assert.match(texts[0].body, /has not been confirmed/);
    assert.equal(texts[0].body.includes("https://groutix.com/b"), !booked);
    const coverage = { ...fields, address: "", city: "Melbourne", enquiryType: "coverage", inspectionDate: "", inspectionTime: "" };
    const callback = await POST({
      headers: { get: () => null },
      formData: async () => ({ get: key => coverage[key] ?? null, getAll: () => [] }),
    });
    assert.equal(callback.status, 200);
    assert.equal(emails.length, 2);
    assert.equal(emails[1].toEmail, fields.email);
    assert.doesNotMatch(emails[1].html, /Complete My Quote Form|Book Free Inspection/i);
  });
}
