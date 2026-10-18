import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const { staffBookingRules } = loadTs("lib/staffBookingRules.ts");
const { bookingEndForDuration, bookingEndForWorkingDays, bookingSegments, savedWorkSegments } = loadTs("lib/bookingSpan.ts");
const { formatLeadBookingTime } = loadTs("lib/bookingPresentation.ts");
const { BookingTimingEditor, BookingTimingSummary } = loadTs("components/admin/BookingTimingEditor.tsx");
const configured = structuredClone(DEFAULT_BOOKING_RULES);
configured.job.days = Array.from({ length: 7 }, (_, day) => ({ open: day > 0 && day < 6, start: "09:00", end: "17:00" }));
const rules = staffBookingRules(configured);
const start = "2026-10-22T09:00";

test("two working days and sixteen working hours produce the same two daily windows", () => {
  const end = bookingEndForWorkingDays("job", start, 2, rules);
  assert.equal(end, "2026-10-23T17:00");
  assert.equal(bookingEndForDuration("job", start, 960, rules), end);
  const segments = bookingSegments("job", start, end, rules);
  assert.equal(JSON.stringify(segments), JSON.stringify([
    { date: "2026-10-22", time: "09:00", scheduledMinutes: 480 },
    { date: "2026-10-23", time: "09:00", scheduledMinutes: 480 },
  ]));
  assert.equal(segments.reduce((sum, segment) => sum + segment.scheduledMinutes, 0), 960);
});

test("partial days, weekends, closures and scheduled hour changes use actual work windows", () => {
  assert.equal(bookingEndForDuration("job", "2026-10-23T15:00", 600, rules), "2026-10-26T17:00");
  const closed = { ...rules, closedDates: [{ date: "2026-10-23", label: "Holiday" }] };
  assert.equal(bookingEndForWorkingDays("job", start, 2, closed), "2026-10-26T17:00");
  const shorter = structuredClone(configured);
  shorter.job.changeovers = [{ from: "2026-10-23", days: configured.job.days.map(day => ({ ...day, end: "15:00" })) }];
  const end = bookingEndForWorkingDays("job", start, 2, staffBookingRules(shorter));
  assert.equal(end, "2026-10-23T15:00");
  assert.equal(bookingSegments("job", start, end, shorter).reduce((sum, segment) => sum + segment.scheduledMinutes, 0), 840);
});

test("legacy overnight reservations normalize to working windows while valid saved windows stay frozen", () => {
  const legacy = [{ date: "2026-10-22", time: "08:00", scheduledMinutes: 960 }, { date: "2026-10-23", time: "00:00", scheduledMinutes: 1020 }];
  const repaired = savedWorkSegments("job", "2026-10-22T08:00", "2026-10-23T17:00", legacy, rules);
  assert.equal(repaired.reduce((sum, segment) => sum + segment.scheduledMinutes, 0), 960);
  assert.ok(repaired.every(segment => segment.time === "09:00" && segment.scheduledMinutes === 480));
  assert.equal(savedWorkSegments("job", start, "2026-10-23T17:00", repaired, { ...rules, job: { ...rules.job, slotMinutes: 30 } }), repaired);
});

test("shared booking editor and CRM labels show working totals and the real finish date", () => {
  const end = "2026-10-23T17:00";
  const segments = bookingSegments("job", start, end, rules);
  const changes = [];
  const editor = BookingTimingEditor({ type: "job", start, end: "2026-10-22T10:00", rules, onChange: (...args) => changes.push(args) });
  const nodes = [];
  const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; nodes.push(node); visit(node.props?.children); };
  visit(editor);
  nodes.find(node => node.props?.["aria-label"] === "Working days").props.onChange({ target: { value: "2" } });
  assert.equal(changes[0][1], end);
  const html = renderToStaticMarkup(React.createElement(BookingTimingSummary, { type: "job", start, end, rules }));
  assert.match(html, /2 working days/);
  assert.match(html, /16.*working hour/);
  assert.doesNotMatch(html, /33|00:00/);
  const label = formatLeadBookingTime({ jobAt: start, jobEndAt: end, jobWorkSegments: segments }, "job");
  assert.match(label, /2 working days · 16 working hours/);
  assert.doesNotMatch(label, /1:00 AM/);
});
