import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const scheduling = loadTs("lib/scheduling.ts");

function renderPlanner(rules, type) {
  let stateCalls = 0;
  let markers = [];
  const lead = { id: "customer", name: "Current customer", address: "St Kilda VIC", status: "New" };
  const stop = { leadId: "booked", name: "Existing booked customer", date: "2026-10-30", time: "10:00", type, address: "St Kilda VIC" };
  const hooks = { ...React, useState(initial) {
    stateCalls += 1;
    return React.useState(stateCalls === 6 ? {
      key: "2026-10-29|2026-11-26|0", appts: [stop], technicians: [], error: null,
    } : initial);
  } };
  const { BookingPlanner } = loadTs("components/admin/BookingPlanner.tsx", {
    react: hooks,
    "./AdminPageContext": { useAdminPageCtx: () => ({ leads: [lead, { id: "booked", name: stop.name, status: "Job Booked" }] }) },
    "@/lib/useBookingRules": { useBookingRules: () => rules },
    "@/lib/useTechnicians": { useTechnicians: () => ({ technicians: [{ id: "tech", name: "Technician", active: true, workDays: [] }] }) },
    "@/lib/useZoneRules": { useZoneRules: () => undefined },
    "@/lib/scheduling": { ...scheduling, melbourneYmd: () => "2026-10-29" },
    "./PlannerLeadPicker": { PlannerLeadPicker: () => null },
    "./modals/EditBookingModal": { EditBookingModal: () => null },
    "@/components/admin/DispatchMap": { DispatchMap: ({ items }) => {
      markers = items;
      return React.createElement("div", { "data-testid": "map" });
    } },
  });
  const html = renderToStaticMarkup(React.createElement(BookingPlanner, {
    type, lead, value: "2026-10-30T10:00", onPick() {}, onClose() {},
  }));
  return { html, markers };
}

for (const type of ["job", "inspection"]) {
  for (const restriction of ["closed week", "future minimum date", "long notice"]) {
    test(`${type}: staff can select times despite customer ${restriction}`, () => {
      const rules = structuredClone(DEFAULT_BOOKING_RULES);
      if (restriction === "closed week") {
        rules[type].days = rules[type].days.map(day => ({ ...day, open: false }));
        rules[type].changeovers = [];
      } else if (restriction === "future minimum date") {
        rules.minDate = "2027-01-01";
      } else {
        rules.minNoticeDays = 35;
      }
      const { html, markers } = renderPlanner(rules, type);
      assert.match(html, /data-testid="map"/);
      
      assert.match(html, /Existing booked customer/);
      assert.ok(markers.some(item => item.lead.id === "customer" && item.proposed));
      assert.ok(markers.some(item => item.lead.id === "booked"));
      assert.match(html, />Free</);
    });
  }
}
