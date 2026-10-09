import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES: rules } = loadTs("lib/bookingRules.ts");
const { DEFAULT_ZONE_RULES: zoneRules } = loadTs("lib/zoneRules.ts");
const date = "2099-10-14";
const technicians = [{ id: "tech-1", name: "Technician", active: true }];
const appointments = [{ leadId: "other", date, time: "10:00", type: "job", durationMinutes: 120, technicianId: "tech-1", name: "Booked customer" }];
const boundaries = {
  "@/lib/useBookingRules": { useBookingRules: () => rules },
  "@/lib/useZoneRules": { useZoneRules: () => zoneRules },
  "@/lib/useTechnicians": { useTechnicians: () => ({ technicians, loading: false }) },
};

for (const recordType of ["lead", "quote", "support_ticket"]) {
  for (const loaded of [false, true]) {
    test(`job slots render for a ${recordType} record ${loaded ? "after bookings load" : "while loading"}`, () => {
      const { SlotBoard } = loadTs("components/admin/SlotBoard.tsx", {
        ...boundaries,
        react: {
          ...React,
          useState: (initial) => React.useState(loaded && initial === null
            ? { key: `${date}#0`, appts: appointments, technicians, error: false }
            : initial),
        },
      });
      const html = renderToStaticMarkup(React.createElement(SlotBoard, {
        type: "job", value: `${date}T10:00`, leadId: "editing", durationMinutes: 120,
        assignment: { type: recordType, technicianId: "tech-1" }, onPick: () => {},
      }));
      assert.match(html, /Day to view/);
      assert.match(html, loaded ? /Booked customer/ : /Loading bookings/);
      if (loaded) assert.match(html, /Free · 1 technician/);
    });
  }

  test(`job conflict checks preserve the booking type for a ${recordType} record`, async () => {
    const effects = [];
    const results = [];
    const { useSlotConflict } = loadTs("components/admin/SlotBoard.tsx", {
      ...boundaries,
      react: {
        ...React,
        useState: (initial) => [initial, (value) => results.push(value)],
        useEffect: (effect) => effects.push(effect),
      },
    }, { fetch: async () => ({ ok: true, json: async () => ({ appointments, technicians }) }) });
    useSlotConflict(`${date}T10:00`, "editing", "job", 120, { type: recordType, technicianId: "tech-1" });
    const cleanup = effects[0]();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(results.length, 1);
    assert.match(results[0].conflict?.label || "", /overlapping job/);
    cleanup();
  });
}
