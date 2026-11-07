import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { loadTs } from "./test-ts-loader.mjs";
const rules = loadTs("lib/teamEarnings.ts");
const leadId = "111111111111111111111111", memberId = "222222222222222222222222", secondId = "333333333333333333333333";
const member = { id: memberId, name: "Alex", role: "technician", active: true, aliases: [] };
const second = { ...member, id: secondId, name: "Sam" };
const baseLead = { id: leadId, name: "Customer", jobNo: "Job-100", status: "Completed", createdAt: "2026-01-01", technicianId: memberId, technician: "Alex", invoiceNumber: "INV-100", invoiceAmount: 1100, invoiceDraft: { gst: 10 }, jobAt: "2026-01-01T08:00", jobTotalDays: 2, jobDaysDone: 2 };
function fixture() {
  let state = { submissions: [{ ...baseLead, _id: new ObjectId(leadId) }], bookings: [], admin_users: [], team_earnings: [], team_earnings_payments: [], team_earnings_events: [] };
  let failEvents = false, queue = Promise.resolve();
  const copy = value => structuredClone(value);
  const get = (obj, key) => key.split(".").reduce((a, k) => a?.[k], obj);
  const matches = (doc, query) => Object.entries(query).every(([key, value]) => value instanceof ObjectId ? String(doc[key]) === String(value) : doc[key] === value);
  const collection = name => ({
    createIndex: async () => "index",
    findOne: async query => state[name].find(d => matches(d, query)) || null,
    find(query = {}) { let sort = {}, skip = 0, limit = Infinity; return {
      sort(value) { sort = value; return this; }, skip(value) { skip = value; return this; }, limit(value) { limit = value; return this; }, async toArray() {
        return state[name].filter(d => matches(d, query)).sort((a, b) => { for (const [key, dir] of Object.entries(sort)) { if (get(a, key) < get(b, key)) return -dir; if (get(a, key) > get(b, key)) return dir; } return 0; }).slice(skip, skip + limit);
      },
    }; },
    async insertOne(doc) {
      if (name === "team_earnings_events" && failEvents) throw new Error("Injected audit write failure");
      if (state[name].some(d => String(d._id) === String(doc._id))) throw Object.assign(new Error("Duplicate"), { code: 11000 });
      state[name].push(copy(doc)); return {};
    },
    async replaceOne(query, doc) { const index = state[name].findIndex(d => matches(d, query)); if (index < 0) return { matchedCount: 0 }; state[name][index] = copy(doc); return { matchedCount: 1 }; },
    async updateOne(query, update) { const doc = state[name].find(d => matches(d, query)); if (!doc) return { matchedCount: 0 }; Object.assign(doc, copy(update.$set)); return { matchedCount: 1 }; },
  });
  const client = { startSession: () => ({ async withTransaction(work) {
    const previous = queue; let release; queue = new Promise(resolve => { release = resolve; }); await previous;
    // Keep BSON identity in source records across rollback.
    const before = Object.fromEntries(Object.entries(state).map(([key, rows]) => [key, rows.map(row => ({ ...copy(row), ...(row._id instanceof ObjectId ? { _id: new ObjectId(String(row._id)) } : {}) }))]));
    try { return await work(); } catch (e) { state = before; throw e; } finally { release(); }
  }, async endSession() {} }) };
  const api = loadTs("lib/teamEarningsServer.ts", {
    "@/lib/mongodb": { getDb: async () => ({ collection }), getMongoClient: async () => client },
    "@/lib/technicians": { listTechnicians: async () => [{ ...member, createdAt: "2026-01-01" }, { ...second, createdAt: "2026-01-01" }] },
  });
  const mutate = (action, version, fields = {}) => api.mutateTeamEarnings(leadId, { action, version, requestId: randomUUID(), ...fields }, "manager");
  return { api, mutate, get state() { return state; }, failEvents() { failEvents = true; } };
}
async function draft(f, rate = 3000) { return f.mutate("save", 0, { basis: "ex_gst", notes: "Agreed job share", shares: [{ memberId, rateBps: rate }] }); }
async function approved(f) { const d = await draft(f); return f.mutate("approve", d.version, { invoice: rules.invoiceForEarnings(baseLead, "ex_gst") }); }
const pay = (extra = {}) => ({ memberId, amountCents: 10000, date: "2026-01-01", method: "Bank transfer", reference: "TX-100", note: "Part payment", ...extra });

test("invoice basis uses saved total, GST and no quote fallback", () => {
  assert.equal(rules.invoiceForEarnings(baseLead, "ex_gst").baseCents, 100000);
  assert.equal(rules.invoiceForEarnings(baseLead, "inclusive").baseCents, 110000);
  assert.equal(rules.invoiceForEarnings({ ...baseLead, invoiceDraft: { gst: 0 } }, "ex_gst").baseCents, 110000);
  for (const invoiceAmount of [undefined, NaN, Infinity, 0, -1, "100"]) assert.equal(rules.invoiceForEarnings({ ...baseLead, invoiceAmount, quoteAmount: 100 }, "ex_gst"), null);
});
test("shares require valid members, integer precision, unique recipients and total at most 100%", () => {
  const parse = shares => rules.parseEarningsShares(shares, [member, second]);
  for (const shares of [[], [{ memberId, rateBps: 0 }], [{ memberId, rateBps: 1.5 }], [{ memberId, rateBps: 10001 }], [{ memberId: "unknown", rateBps: 100 }], [{ memberId, rateBps: 5000 }, { memberId, rateBps: 5000 }], [{ memberId, rateBps: 8000 }, { memberId: secondId, rateBps: 3000 }]]) assert.throws(() => parse(shares));
  assert.equal(parse([{ memberId, rateBps: 3000 }])[0].name, "Alex");
  assert.throws(() => rules.parseEarningsShares([{ memberId, rateBps: 100 }], [{ ...member, active: false }]));
});
test("shared-job rounding reconciles to cents and never exceeds the invoice basis", () => {
  const shares = rules.parseEarningsShares([{ memberId, rateBps: 5000 }, { memberId: secondId, rateBps: 5000 }], [member, second]);
  for (let cents = 1; cents < 1000; cents++) {
    const result = rules.calculateEarnings(shares, cents);
    assert.equal(result.reduce((sum, s) => sum + s.earnedCents, 0), cents);
    assert.equal(result.every(s => Number.isSafeInteger(s.earnedCents)), true);
  }
});
test("ambiguous names are not assigned earnings identities; stable IDs and aliases resolve", () => {
  assert.equal(rules.earningsJob({ ...baseLead, technicianId: undefined }, [member, { ...second, name: "Alex" }], null).assignedIds.length, 0);
  assert.equal(rules.earningsJob(baseLead, [member, { ...second, name: "Alex" }], null).assignedIds[0], memberId);
  assert.equal(rules.earningsJob({ ...baseLead, technicianId: "alias" }, [{ ...member, aliases: ["alias"] }], null).assignedIds[0], memberId);
});
test("all active job visits must be complete; cancelled and missing sources cannot earn", () => {
  assert.equal(rules.earningsJob(baseLead, [], null).eligible, true);
  for (const status of ["Cancelled", "Lost", "Job Booked", "Source unavailable"]) assert.equal(rules.earningsJob({ ...baseLead, status }, [], null).eligible, false);
  const visits = [{ type: "job", date: "2026-01-01", time: "08:00", status: "Job Done" }, { type: "job", date: "2026-01-02", time: "08:00", status: "Job Booked" }];
  assert.equal(rules.earningsJob({ ...baseLead, bookings: visits }, [], null).eligible, false);
  assert.equal(rules.earningsJob({ ...baseLead, bookings: [{ ...visits[0], status: "Cancelled" }] }, [], null).eligible, false);
});
test("approval preserves invoice and earned amounts and requires the reviewed invoice", async () => {
  const f = fixture(); const d = await draft(f);
  await assert.rejects(f.mutate("approve", d.version, { invoice: { ...rules.invoiceForEarnings(baseLead, "ex_gst"), totalCents: 100 } }), /invoice changed/);
  const a = await f.mutate("approve", d.version, { invoice: rules.invoiceForEarnings(baseLead, "ex_gst") });
  assert.equal(a.shares[0].earnedCents, 30000); assert.equal(a.approvedBy, "manager");
  f.state.submissions[0].invoiceAmount = 2200;
  const list = await f.api.listTeamEarnings();
  assert.equal(list.jobs[0].changed, true); assert.equal(list.jobs[0].ledger.shares[0].earnedCents, 30000);
  await assert.rejects(f.mutate("pay", a.version, pay()), /changed after approval/);
});
test("partial payments reduce due, prevent overpayment, and log actor and reference", async () => {
  const f = fixture(); let a = await approved(f);
  a = await f.mutate("pay", a.version, pay()); assert.equal(a.shares[0].paidCents, 10000);
  await assert.rejects(f.mutate("pay", a.version, pay({ amountCents: 20001 })), /exceeds/);
  a = await f.mutate("pay", a.version, pay({ amountCents: 20000, reference: "TX-101" }));
  assert.equal(a.shares[0].earnedCents - a.shares[0].paidCents, 0);
  const history = await f.api.earningsHistory(leadId, 1);
  assert.equal(history.payments.length, 2); assert.equal(history.payments[0].actor, "manager"); assert.equal(history.events.length, 4);
});
test("payment retries are idempotent and changed payloads are rejected", async () => {
  const f = fixture(); const a = await approved(f);
  const body = { action: "pay", version: a.version, requestId: randomUUID(), ...pay() };
  await f.api.mutateTeamEarnings(leadId, body, "manager");
  const retry = await f.api.mutateTeamEarnings(leadId, body, "manager");
  assert.equal(retry.shares[0].paidCents, 10000); assert.equal(f.state.team_earnings_payments.length, 1);
  await assert.rejects(f.api.mutateTeamEarnings(leadId, { ...body, amountCents: 20000 }, "manager"), /different details/);
});
test("concurrent payments cannot overdraw outstanding earnings", async () => {
  const f = fixture(); const a = await approved(f);
  const result = await Promise.allSettled([f.mutate("pay", a.version, pay({ amountCents: 30000 })), f.mutate("pay", a.version, pay({ amountCents: 30000 }))]);
  assert.equal(result.filter(r => r.status === "fulfilled").length, 1); assert.equal(f.state.team_earnings_payments.length, 1);
});
test("failed audit write rolls back payment and running balances", async () => {
  const f = fixture(); const a = await approved(f); f.failEvents();
  await assert.rejects(f.mutate("pay", a.version, pay()), /audit write failure/);
  assert.equal(f.state.team_earnings_payments.length, 0); assert.equal(f.state.team_earnings[0].shares[0].paidCents, 0); assert.equal(f.state.team_earnings[0].version, a.version);
});
test("reversals preserve payment history and reopening requires all payments reversed", async () => {
  const f = fixture(); let a = await approved(f); a = await f.mutate("pay", a.version, pay());
  await assert.rejects(f.mutate("reopen", a.version, { reason: "Changed invoice" }), /Reverse recorded payments/);
  const paymentId = f.state.team_earnings_payments[0]._id;
  a = await f.mutate("void_payment", a.version, { paymentId, reason: "Duplicate manual entry" });
  assert.equal(a.shares[0].paidCents, 0); assert.equal(f.state.team_earnings_payments[0].voidedBy, "manager");
  await assert.rejects(f.mutate("void_payment", a.version, { paymentId, reason: "Again" }), /already reversed/);
  a = await f.mutate("reopen", a.version, { reason: "Correcting invoice basis" });
  assert.equal(a.status, "draft"); assert.equal(a.invoice, null);
  assert.equal(f.state.team_earnings_events.find(e => e.action === "approve").snapshot.shares[0].earnedCents, 30000);
});
test("invalid payment dates, methods, references and non-cent amounts fail", async () => {
  const f = fixture(); const a = await approved(f);
  for (const patch of [{ date: "2026-02-30" }, { date: "2999-01-01" }, { method: "Cheque" }, { reference: " " }, { amountCents: 1.1 }, { amountCents: -1 }, { memberId: secondId }]) await assert.rejects(f.mutate("pay", a.version, pay(patch)));
  assert.equal(f.state.team_earnings_payments.length, 0);
});
test("removed source leads retain approved balances and payment reversal access", async () => {
  const f = fixture(); let a = await approved(f); a = await f.mutate("pay", a.version, pay());
  f.state.submissions = [];
  const list = await f.api.listTeamEarnings(); assert.equal(list.jobs[0].changed, true); assert.equal(list.jobs[0].ledger.shares[0].paidCents, 10000);
  await assert.rejects(f.mutate("pay", a.version, pay()), /unavailable/);
  const result = await f.mutate("void_payment", a.version, { paymentId: f.state.team_earnings_payments[0]._id, reason: "Payment was not made" });
  assert.equal(result.shares[0].paidCents, 0);
});
test("earnings are manager-only in middleware permissions and API handlers", async () => {
  const roles = loadTs("lib/roles.ts");
  for (const role of [null, "manager", "super_admin", "intake", "finance", "technician", "inspection", "field"]) {
    let called = false;
    const { teamEarningsApi } = loadTs("lib/teamEarningsApi.ts", {
      "@/lib/adminAuth": { verifyRequestSession: async () => role ? { role, username: "test" } : null },
      "@/lib/mongodb": { isMongoConfigured: () => true },
      "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    });
    const allowed = role === "manager" || role === "super_admin";
    const response = await teamEarningsApi({}, async () => { called = true; return {}; });
    assert.equal(response.status, allowed ? 200 : role ? 403 : 401); assert.equal(called, allowed);
    if (role) { assert.equal(roles.canView(role, "earnings"), allowed); assert.equal(roles.canAccessApi(role, "/api/admin/team-earnings/test"), allowed); }
  }
});

test("member work totals follow each visit's worker rather than the lead owner", () => {
  const owner = { ...member, id: "444444444444444444444444", name: "Office", role: "intake" };
  const job = rules.earningsJob({ ...baseLead, assigned: "Office", bookings: [
    { type: "job", date: "2026-01-01", time: "08:00", technicianId: memberId, status: "Job Done", jobDaysDone: 2, jobTotalDays: 2 },
    { type: "job", date: "2026-01-02", time: "08:00", technicianId: secondId, status: "Job Done", jobDaysDone: 1, jobTotalDays: 1 },
    { type: "job", date: "2026-01-03", time: "08:00", technicianId: secondId, status: "Cancelled", jobDaysDone: 9 },
  ] }, [member, second, owner], null);
  assert.equal(job.assignedIds.includes(owner.id), true);
  assert.equal(job.memberWork.find(w => w.memberId === owner.id), undefined);
  assert.equal(job.memberWork.find(w => w.memberId === memberId).daysDone, 2);
  assert.equal(job.memberWork.find(w => w.memberId === secondId).daysDone, 1);
  assert.equal(job.memberWork.find(w => w.memberId === secondId).completedVisits, 1);
});
