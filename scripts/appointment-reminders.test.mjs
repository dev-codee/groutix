import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const now = Date.parse("2026-10-11T00:00:00Z");
function setup({ hours = 24, configured = true, email = "customer@example.test", flags = {}, failure = false } = {}) {
  const lead = { id: "test", name: "Customer", email, inspectionAt: new Date(now + hours * 3600000).toISOString(), ...flags };
  const sent = [], updates = [], activity = [];
  const { GET } = loadTs("app/api/cron/reminders/route.ts", {
    "@/lib/submissions": { listReminderCandidates: async () => [lead], updateSubmission: async (_id, patch) => { updates.push(patch); Object.assign(lead, patch); return true; }, appendActivity: async (_id, entry) => activity.push(entry) },
    "@/lib/email": { isEmailConfigured: () => configured, wrapEmailHtml: html => html, sendEmail: async data => { if (failure) throw new Error("SMTP failed"); sent.push(data); } },
  }, { process: { env: { CRON_SECRET: "test-secret" } }, Date: class extends Date { static now() { return now; } }, console: { error: () => {} } });
  const request = { headers: { get: name => name === "authorization" ? "Bearer test-secret" : null } };
  return { run: () => GET(request), sent, updates, activity };
}
test("24-hour reminder includes appointment details and is not sent twice", async () => {
  const fixture = setup();
  assert.equal((await (await fixture.run()).json()).sent, 1);
  assert.match(fixture.sent[0].subject, /within 24 hours/);
  assert.match(fixture.sent[0].html, /When/);
  assert.equal(fixture.updates[0].inspectionReminderSent, true);
  assert.equal((await (await fixture.run()).json()).sent, 0);
});
test("no email, missing email configuration and delivery failures leave flags unset for retries", async () => {
  for (const settings of [{ configured: false }, { email: "" }, { failure: true }]) {
    const fixture = setup(settings);
    assert.equal((await (await fixture.run()).json()).sent, 0);
    assert.equal(fixture.updates.length, 0);
    assert.equal(fixture.activity.length, 0);
  }
});
test("one-hour reminder has its own flag, and past or more distant appointments receive nothing", async () => {
  const soon = setup({ hours: .75, flags: { inspectionReminderSent: true } });
  assert.equal((await (await soon.run()).json()).sent, 1);
  assert.equal(soon.updates[0].inspectionReminder1hSent, true);
  for (const hours of [-1, 25]) assert.equal((await (await setup({ hours }).run()).json()).sent, 0);
});

test("rescheduling through the shared save path resets both reminder tiers, while unchanged appointments preserve them", async () => {
  const patches = [];
  const before = { inspectionAt: "2026-10-12T09:00", jobAt: "2026-10-13T10:00" };
  const collection = { createIndexes: async () => {}, findOne: async () => before,
    updateOne: async (_filter, update) => { patches.push(update.$set); return { matchedCount: 1 }; } };
  const { updateSubmission } = loadTs("lib/submissions.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => ({ collection: () => collection }) },
    "@/lib/users": { getActiveUsersByRole: async () => [] },
  });
  const id = "507f1f77bcf86cd799439011";
  await updateSubmission(id, { inspectionAt: "2026-10-14T09:00", jobAt: "2026-10-15T10:00" });
  assert.equal(patches[0].inspectionReminderSent, false);
  assert.equal(patches[0].inspectionReminder1hSent, false);
  assert.equal(patches[0].jobReminderSent, false);
  assert.equal(patches[0].jobReminder1hSent, false);
  await updateSubmission(id, { inspectionAt: before.inspectionAt, inspectionReminderSent: true, inspectionReminder1hSent: true });
  assert.equal(patches[1].inspectionReminderSent, true);
  assert.equal(patches[1].inspectionReminder1hSent, true);
});
