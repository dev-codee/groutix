import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const { savedLeadBookingMinutes } = loadTs("lib/bookingDuration.ts");
const { formatApptTimeRange } = loadTs("lib/scheduling.ts");

test("saved and legacy reservations retain their own windows when settings change", async () => {
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  const lead = { _id: new ObjectId(), inspectionAt: "2026-10-22T09:00", status: "Inspection Booked" };
  const locks = [{ leadId: lead._id.toString(), type: "inspection", date: "2026-10-22", time: "09:00", durationMinutes: 60 }];
  const col = { createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }), find: () => ({ toArray: async () => locks }) };
  const db = { collection: name => name === "bookings" ? col : { find: () => ({ project: () => ({ toArray: async () => [lead] }) }) } };
  const api = loadTs("lib/bookings.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => db },
    "./bookingRulesServer": { getBookingRules: async () => rules },
  });
  rules.inspection.slotMinutes = 180;
  assert.equal((await api.listAppointmentsOnDate("2026-10-22"))[0].scheduledMinutes, 60);
  locks[0].scheduledMinutes = 180;
  rules.inspection.slotMinutes = 30;
  assert.equal((await api.listAppointmentsOnDate("2026-10-22"))[0].scheduledMinutes, 180);
  lead.inspectionWorkSegments = [{ date: "2026-10-22", time: "09:00", scheduledMinutes: 90 }];
  locks.length = 0;
  assert.equal((await api.listAppointmentsOnDate("2026-10-22"))[0].scheduledMinutes, 90);
  assert.equal(formatApptTimeRange(lead.inspectionAt, savedLeadBookingMinutes(lead, "inspection") / 60).toLowerCase(), "9:00 am – 10:30 am");
});

test("saving new slot settings freezes older lead windows from their reservation", async () => {
  const original = structuredClone(DEFAULT_BOOKING_RULES);
  const lead = { _id: new ObjectId(), inspectionAt: "2026-10-22T09:00" };
  const calls = [];
  const db = { collection: name => name === "settings" ? {
    findOne: async () => original,
    updateOne: async () => { calls.push("settings"); },
  } : name === "submissions" ? {
    find: () => ({ toArray: async () => [lead] }),
    bulkWrite: async patches => { calls.push(patches); },
  } : {
    find: () => ({ toArray: async () => [{ leadId: lead._id.toString(), type: "inspection", date: "2026-10-22", time: "09:00", durationMinutes: 90 }] }),
    updateMany: async () => {},
  } };
  const { saveBookingRules } = loadTs("lib/bookingRulesServer.ts", {
    "./mongodb": { isMongoConfigured: () => true, getDb: async () => db },
  });
  const updated = structuredClone(original);
  updated.inspection.slotMinutes = 180;
  const saved = await saveBookingRules(updated, "manager");
  assert.equal(saved.inspection.slotMinutes, 180);
  assert.equal(calls[0][0].updateOne.update.$set.inspectionWorkSegments[0].scheduledMinutes, 90);
  assert.equal(calls[1], "settings");
});

test("new lead appointments snapshot current slots and rescheduling keeps that snapshot", async () => {
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  rules.inspection.slotMinutes = 180;
  const lead = { _id: new ObjectId() };
  const col = { findOne: async () => lead, updateOne: async (_filter, patch) => { Object.assign(lead, patch.$set); return { matchedCount: 1 }; } };
  const { updateSubmission } = loadTs("lib/submissions.ts", {
    "@/lib/mongodb": { getDb: async () => ({ collection: () => col }) },
    "./bookingRulesServer": { getBookingRules: async () => rules },
    "@/lib/users": {},
  });
  await updateSubmission(lead._id.toString(), { inspectionAt: "2026-10-22T09:00" });
  assert.equal(lead.inspectionWorkSegments[0].scheduledMinutes, 180);
  rules.inspection.slotMinutes = 30;
  await updateSubmission(lead._id.toString(), { inspectionAt: "2026-10-23T10:00" });
  assert.equal(lead.inspectionWorkSegments[0].scheduledMinutes, 180);
  assert.equal(lead.inspectionWorkSegments[0].time, "10:00");
});
