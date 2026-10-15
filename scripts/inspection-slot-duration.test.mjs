import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const { formatSlotRange } = loadTs("lib/scheduling.ts");

for (const [duration, start, expected] of [
  [180, "09:00", ["9:00 AM – 12:00 PM", "12:00 PM – 3:00 PM", "3:00 PM – 6:00 PM"]],
  [90, "09:30", ["9:30 AM – 11:00 AM", "11:00 AM – 12:30 PM", "12:30 PM – 2:00 PM"]],
  [60, "09:00", ["9:00 AM – 10:00 AM", "10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM"]],
]) {
  test(`inspection availability supplies the configured ${duration}-minute windows to the quote form`, async () => {
    const rules = structuredClone(DEFAULT_BOOKING_RULES);
    rules.minDate = "";
    rules.inspection = {
      slotMinutes: duration,
      days: Array.from({ length: 7 }, () => ({ open: true, start, end: "18:00" })),
    };
    const { GET } = loadTs("app/api/inspection-availability/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
      "@/lib/bookings": { listUpcomingBookings: async () => [] },
      "@/lib/bookingRulesServer": { getBookingRules: async () => rules },
      "@/lib/zoneRulesServer": { getZoneRules: async () => loadTs("lib/zoneRules.ts").DEFAULT_ZONE_RULES },
    });
    const response = await GET({ nextUrl: new URL("https://groutix.com/api/inspection-availability?address=Gowanbrae") });
    assert.equal(response.body.inServiceArea, true);
    assert.equal(response.body.durationMinutes, duration);
    assert.ok(response.body.days.length > 0);
    const slots = response.body.days[0].slots;
    assert.ok(slots.every(slot => !slot.booked));
    assert.deepEqual(Array.from(slots.slice(0, 3), slot => formatSlotRange(slot.time, response.body.durationMinutes)), expected);
    if (duration === 180) assert.equal(slots.length, 3);
    assert.match(response.headers["Cache-Control"], /no-store/);
  });
}
