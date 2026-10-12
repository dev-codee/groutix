import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

test("customer booking availability exposes time slots while retaining internal capacity checks", async () => {
  const slot = { time: "09:00", booked: false, remaining: 2, reason: null };
  const unavailable = { time: "10:00", booked: true, remaining: 0, reason: "All 2 job technicians are booked" };
  const internalDays = [{ date: "2026-10-15", label: "Thursday", weekday: "Thursday", times: ["09:00"], slots: [slot, unavailable], recommended: true }];
  let checkedCapacity = false;
  const { GET } = loadTs("app/api/book/[id]/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    "@/lib/submissions": { getSubmission: async () => ({ name: "Customer", address: "Melbourne", status: "Won", technicianId: "internal-tech" }) },
    "@/lib/bookingToken": { verifyBookingToken: () => true },
    "@/lib/bookings": { listUpcomingBookings: async () => [] },
    "@/lib/bookingRulesServer": { getBookingRules: async () => ({}) },
    "@/lib/zoneRulesServer": { getZoneRules: async () => ({}) },
    "@/lib/technicians": { listTechnicians: async () => [{ id: "internal-tech", name: "Private Name" }] },
    "@/lib/bookingDuration": { appointmentDurationMinutes: () => 60 },
    "@/lib/bookingAvailabilityDays": { applyBookingCapacity: (_days, _appointments, candidate, _rules, roster) => {
      assert.equal(candidate.technicianId, "internal-tech");
      assert.equal(roster[0].name, "Private Name");
      checkedCapacity = true;
      return internalDays;
    } },
    "@/lib/scheduling": { resolveArea: () => ({ label: "Melbourne", inner: true, serviced: true }), computeAvailability: () => internalDays, shortlistDays: days => days, zoneDayName: () => null },
    "@/lib/email": {}, "@/lib/sms": {},
  });
  const response = await GET({ nextUrl: new URL("https://groutix.com/api/book/lead?type=job&token=valid") }, { params: Promise.resolve({ id: "lead" }) });
  assert.equal(response.status, 200);
  assert.ok(checkedCapacity);
  assert.equal(JSON.stringify(response.body.days[0].slots), JSON.stringify([{ time: "09:00", booked: false }, { time: "10:00", booked: true }]));
  assert.equal(response.body.durationMinutes, 60);
  assert.equal(slot.remaining, 2);
  assert.ok(!JSON.stringify(response.body).includes("technician"));
});
