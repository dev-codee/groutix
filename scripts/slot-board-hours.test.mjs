import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES, slotsForDate } = loadTs("lib/bookingRules.ts");
const { staffPlanningRules } = loadTs("lib/staffBookingRules.ts");

function renderBoard(type, date, appointments = []) {
  const hooks = { ...React, useState: initial => React.useState(initial === null
    ? { key: `${date}#0`, appts: appointments, technicians: [], error: false }
    : initial) };
  const { SlotBoard } = loadTs("components/admin/SlotBoard.tsx", {
    react: hooks,
    "@/lib/useBookingRules": { useBookingRules: () => DEFAULT_BOOKING_RULES },
    "@/lib/useTechnicians": { useTechnicians: () => ({ technicians: [{ id: "tech", name: "Tech", active: true }] }) },
    "@/lib/useZoneRules": { useZoneRules: () => ({}) },
    "@/lib/scheduling": { melbourneYmd: () => "2026-10-13" },
  });
  return renderToStaticMarkup(React.createElement(SlotBoard, { type, value: `${date}T09:00`, onPick() {} }));
}

test("both appointment boards show only 9 AM–5 PM on every day of the week", () => {
  for (const type of ["inspection", "job"]) {
    for (const date of ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"]) {
      const html = renderBoard(type, date);
      assert.match(html, /9:00 AM – 5:00 PM/);
      const times = [...html.matchAll(/<div class="font-bold">([^<]+)<\/div>/g)].map(match => match[1]);
      assert.deepEqual(times, ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]);
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
