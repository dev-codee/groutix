import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { inspectionConfirmationHtml, inspectionConfirmationSms } = loadTs("lib/inspectionConfirmation.ts");
test("confirmed inspection email shows the chosen Melbourne date and time without shifting", () => {
  const html = inspectionConfirmationHtml("2026-10-15", "09:30", true, 180);
  assert.match(html, /Thursday,? 15 October 2026/);
  assert.match(html, /Arrival time:<\/strong> 9:30 AM – 12:30 PM \(Melbourne time\)/);
  assert.match(html, /We have booked your inspection/);
  assert.match(html, /If any adjustment.*our team will contact you/);
});
test("an unavailable or unsaved slot is shown as requested, with a promise to arrange timing", () => {
  const html = inspectionConfirmationHtml("2026-10-15", "14:00", false, 180);
  assert.match(html, /Requested arrival time:<\/strong> 2:00 PM – 5:00 PM/);
  assert.match(html, /has not been confirmed/);
  assert.equal(html.includes("We have booked"), false);
});
test("arrival windows follow the configured duration and retain start minutes", () => {
  assert.match(inspectionConfirmationHtml("2026-10-15", "09:00", true, 180), /9:00 AM – 12:00 PM/);
  assert.match(inspectionConfirmationHtml("2026-10-15", "11:45", true, 90), /11:45 AM – 1:15 PM/);
});
test("customers who did not select a slot are told the team will arrange an inspection", () => {
  const html = inspectionConfirmationHtml("", "", false, 180);
  assert.match(html, /contact you to arrange/);
  assert.equal(html.includes("Date:"), false);
});

for (const [minutes, range] of [[30, "9:00 AM – 9:30 AM"], [60, "9:00 AM – 10:00 AM"], [180, "9:00 AM – 12:00 PM"], [240, "9:00 AM – 1:00 PM"]]) {
  test(`email and SMS agree on the ${minutes}-minute inspection slot`, () => {
    const html = inspectionConfirmationHtml("2026-10-15", "09:00", true, minutes);
    const sms = inspectionConfirmationSms("2026-10-15", "09:00", true, minutes);
    assert.ok(html.includes(range));
    assert.ok(sms.includes(range));
    assert.match(sms, /Your inspection is booked/);
    assert.match(sms, /15 October 2026/);
    assert.ok(!html.includes("30-minute window"));
  });
}
test("SMS distinguishes unconfirmed requests and customers without a selected slot", () => {
  const requested = inspectionConfirmationSms("2026-10-15", "14:30", false, 180);
  assert.match(requested, /2:30 PM – 5:30 PM/);
  assert.match(requested, /has not been confirmed/);
  assert.ok(!requested.includes("is booked"));
  assert.match(inspectionConfirmationSms("", "", false, 180), /contact you to arrange/);
});
