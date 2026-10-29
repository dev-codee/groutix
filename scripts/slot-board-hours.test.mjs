import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES, slotsForDate } = loadTs("lib/bookingRules.ts");
const { formatSlotRange } = loadTs("lib/scheduling.ts");
const { staffPlanningRules } = loadTs("lib/staffBookingRules.ts");

function renderBoard(type, date, appointments = [], rules = DEFAULT_BOOKING_RULES) {
  const hooks = { ...React, useState: initial => React.useState(initial === null
    ? { key: `${date}#0`, appts: appointments, technicians: [], error: false }
    : initial) };
  const { SlotBoard } = loadTs("components/admin/SlotBoard.tsx", {
    react: hooks,
    "@/lib/useBookingRules": { useBookingRules: () => rules },
    "@/lib/useTechnicians": { useTechnicians: () => ({ technicians: [{ id: "tech", name: "Tech", active: true }] }) },
    "@/lib/useZoneRules": { useZoneRules: () => ({}) },
    "@/lib/scheduling": { formatSlotRange, melbourneYmd: () => "2026-10-13" },
  });
  return renderToStaticMarkup(React.createElement(SlotBoard, { type, value: `${date}T09:00`, onPick() {} }));
}

test("both appointment boards follow configured hours for each weekday", () => {
  for (const type of ["inspection", "job"]) {
    for (const date of ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"]) {
      const html = renderBoard(type, date);
      const times = [...html.matchAll(/<div class="font-bold">([^<]+)<\/div>/g)].map(match => match[1]);
      assert.deepEqual(times, Array.from(slotsForDate(staffPlanningRules(DEFAULT_BOOKING_RULES), type, date), time => formatSlotRange(time, DEFAULT_BOOKING_RULES[type].slotMinutes)));
    }
  }
});

test("out-of-hours appointments do not reintroduce overnight labels into the board", () => {
  const html = renderBoard("job", "2026-10-14", [
    { leadId: "early", date: "2026-10-14", time: "08:00", type: "job", name: "Early customer" },
    { leadId: "late", date: "2026-10-14", time: "18:00", type: "job", name: "Late customer" },
    { leadId: "within", date: "2026-10-14", time: "09:30", type: "inspection", name: "Working hours customer" },
  ]);
  assert.doesNotMatch(html, /8:00 AM|6:00 PM|Early customer|Late customer/);
  assert.match(html, /9:30 AM/);
});

test("suggested slots fit the window and keep configured slot lengths", () => {
  const configured = structuredClone(DEFAULT_BOOKING_RULES);
  configured.inspection.slotMinutes = 30;
  const rules = staffPlanningRules(configured);
  assert.equal(staffPlanningRules(configured), rules);
  assert.equal(slotsForDate(rules, "inspection", "2026-10-14").length, 16);
  assert.equal(slotsForDate(rules, "inspection", "2026-10-14").at(-1), "16:30");
  assert.equal(slotsForDate(rules, "job", "2026-10-14").at(-1), "16:00");
});

test("staff planning opens customer closures and retains dated time ranges without changing public rules", () => {
  const configured = structuredClone(DEFAULT_BOOKING_RULES);
  configured.job.changeovers = [{ from: "2026-10-19", days: configured.job.days.map(() => ({ open: true, start: "07:00", end: "11:00" })) }];
  configured.closedDates = [{ date: "2026-10-20", label: "Closed" }];
  const rules = staffPlanningRules(configured);
  assert.equal(slotsForDate(rules, "job", "2026-10-19").join(","), "07:00,08:00,09:00,10:00");
  assert.equal(slotsForDate(rules, "job", "2026-10-20").length, 4);
  assert.equal(slotsForDate(configured, "job", "2026-10-20").length, 0);
  assert.equal(configured.job.days[1].start, "09:00");
});

test("slot labels display the configured inspection and job time ranges", () => {
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  rules.inspection.slotMinutes = 30;
  rules.job.slotMinutes = 120;
  assert.match(renderBoard("inspection", "2026-10-14", [], rules), /9:00 AM – 9:30 AM/);
  assert.match(renderBoard("job", "2026-10-14", [], rules), /9:00 AM – 11:00 AM/);
});

test("staff slot boards show selectable times when every customer weekday is disabled", () => {
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  rules.minDate = "2027-01-01";
  rules.closedDates = [{ date: "2026-10-31", label: "Customer booking closed" }];
  for (const type of ["job", "inspection"]) {
    rules[type].days = rules[type].days.map(day => ({ ...day, open: false }));
    rules[type].changeovers = [];
    const html = renderBoard(type, "2026-10-31", [], rules);
    assert.match(html, /9:00 AM/);
    assert.doesNotMatch(html, /not offered on|Before earliest booking date|Customer booking closed/);
    assert.equal(slotsForDate(rules, type, "2026-10-31").length, 0);
    assert.ok(slotsForDate(staffPlanningRules(rules), type, "2026-10-31").length > 0);
  }
});
