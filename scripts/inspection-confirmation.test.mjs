import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { inspectionConfirmationHtml } = loadTs("lib/inspectionConfirmation.ts");
test("confirmed inspection email shows the chosen Melbourne date and time without shifting", () => {
  const html = inspectionConfirmationHtml("2026-10-15", "09:30", true);
  assert.match(html, /Thursday,? 15 October 2026/);
  assert.match(html, /9:30 am.*Melbourne time/i);
  assert.match(html, /We have booked your inspection/);
  assert.match(html, /If any adjustment.*our team will contact you/);
});
test("an unavailable or unsaved slot is shown as requested, with a promise to arrange timing", () => {
  const html = inspectionConfirmationHtml("2026-10-15", "14:00", false);
  assert.match(html, /2:00 pm/i);
  assert.match(html, /has not been confirmed/);
  assert.equal(html.includes("We have booked"), false);
});
test("customers who did not select a slot are told the team will arrange an inspection", () => {
  const html = inspectionConfirmationHtml("", "", false);
  assert.match(html, /contact you to arrange/);
  assert.equal(html.includes("Date:"), false);
});
