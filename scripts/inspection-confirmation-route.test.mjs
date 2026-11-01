import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

for (const booked of [true, false]) {
  test(`quote submission sends matching three-hour email and SMS for a ${booked ? "confirmed" : "requested"} inspection`, async () => {
    const emails = [], texts = [], submissions = [];
    const rules = structuredClone(loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES);
    rules.inspection.slotMinutes = 180;
    const scheduling = loadTs("lib/scheduling.ts");
    const { POST } = loadTs("app/api/quote/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
      "@/lib/rateLimit": { rateLimit: () => true },
      "@/lib/submissions": {
        recordSubmission: async (...args) => { submissions.push(args); return "lead"; }, updateSubmission: async () => true,
        updateEmailDelivered: async () => {}, appendActivity: async () => {},
        getNextJobNo: async () => "Job No-123", assignInspectorOnBooking: async () => {},
      },
      "@/lib/siteContentServer": { getSiteContent: async () => ({ business: { phone: "(03) 7023 8094" } }) },
      "@/lib/email": {
        isEmailConfigured: () => true, getEmailLogoUrl: async () => "",
        wrapEmailHtml: html => html, sendEmail: async email => { emails.push(email); },
      },
      "@/lib/sms": { sendSms: async sms => { texts.push(sms); return { ok: true }; } },
      "@/lib/bookingToken": { buildBookingUrl: () => "https://groutix.com/book", buildBookingSmsUrl: () => "https://groutix.com/b" },
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
    const response = await POST({
      headers: { get: () => null },
      formData: async () => ({ get: key => fields[key] ?? null, getAll: () => [] }),
    });
    assert.equal(response.status, 200);
    assert.ok(JSON.stringify(submissions).includes(fields.areas));
    const customerEmail = emails.find(email => email.toEmail === fields.email);
    assert.ok(customerEmail.html.includes("9:00 AM – 12:00 PM"));
    assert.equal(texts.length, 1);
    assert.ok(texts[0].body.includes("9:00 AM – 12:00 PM"));
    assert.ok(!customerEmail.html.includes("30-minute"));
    assert.ok(!texts[0].body.includes("9:30 AM"));
    if (booked) assert.match(texts[0].body, /Your inspection is booked/);
    else assert.match(texts[0].body, /has not been confirmed/);
    const coverage = { ...fields, address: "", city: "Melbourne", enquiryType: "coverage", inspectionDate: "", inspectionTime: "" };
    const callback = await POST({
      headers: { get: () => null },
      formData: async () => ({ get: key => coverage[key] ?? null, getAll: () => [] }),
    });
    assert.equal(callback.status, 200);
  });
}
