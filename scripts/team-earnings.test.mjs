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
  let state = { submissions: [{ ...baseLead, _id: new ObjectId(leadId) }], bookings: [], customer_invoices: [], admin_users: [], team_earnings: [], team_earnings_payments: [], team_earnings_events: [], team_earnings_daily_caps: [], team_earnings_job_expenses: [], team_earnings_expense_events: [], settings: [{ _id: "team-earnings", basis: "ex_gst", gstRateBps: 1000, employeeSettings: [], automaticExpenses: [] }] };
  let failEvents = false, queue = Promise.resolve();
  const copy = value => structuredClone(value);
  const get = (obj, key) => key.split(".").reduce((a, k) => Array.isArray(a) ? a.flatMap(item => item?.[k] ?? []) : a?.[k], obj);
  const matches = (doc, query) => Object.entries(query).every(([key, value]) => {
    const actual = get(doc, key);
    if (value && typeof value === "object" && "$ne" in value) return Array.isArray(actual) ? !actual.includes(value.$ne) : actual !== value.$ne;
    return value instanceof ObjectId ? String(actual) === String(value) : actual === value;
  });
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
    async updateOne(query, update, options = {}) {
      let doc = state[name].find(d => matches(d, query));
      if (!doc && options.upsert) {
        doc = Object.fromEntries(Object.entries(query).filter(([, value]) => value === null || typeof value !== "object").map(([key, value]) => [key, value]));
        Object.assign(doc, copy(update.$setOnInsert || {})); state[name].push(doc);
      }
      if (!doc) return { matchedCount: 0 };
      Object.assign(doc, copy(update.$set || {}));
      for (const [key, value] of Object.entries(update.$inc || {})) doc[key] = (doc[key] || 0) + value;
      for (const [key, value] of Object.entries(update.$push || {})) doc[key].push(copy(value));
      return { matchedCount: 1 };
    },
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
  const mutateFor = (id, action, version, fields = {}) => api.mutateTeamEarnings(id, { action, version, requestId: randomUUID(), ...fields }, "manager");
  const mutate = (action, version, fields = {}) => mutateFor(leadId, action, version, fields);
  return { api, mutate, mutateFor, get state() { return state; }, failEvents() { failEvents = true; } };
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

test("invoice IDs do not mark existing approved invoice snapshots as changed", () => {
  const oldSnapshot = rules.invoiceForEarnings({ ...baseLead, earningsInvoices: [{ invoiceNumber: "INV-B", invoiceAmount: 220, invoiceDraft: { gst: 10 } }] }, "ex_gst");
  for (const item of oldSnapshot.items) delete item.key;
  const current = rules.invoiceForEarnings({ ...baseLead, earningsInvoices: [{ invoiceNumber: "INV-B", invoiceAmount: 220, invoiceDraft: { gst: 10 }, earningsKey: "saved-invoice-id" }] }, "ex_gst");
  assert.equal(rules.sameEarningsInvoice(oldSnapshot, current), true);
});

test("team pool follows configured percentage ratios and reconciles to hundredths", () => {
  assert.deepEqual(Array.from(rules.distributeTeamPool(2500, [{ memberId, rateBps: 2000 }, { memberId: secondId, rateBps: 1000 }]), row => ({ memberId: row.memberId, rateBps: row.rateBps })), [
    { memberId, rateBps: 1667 }, { memberId: secondId, rateBps: 833 },
  ]);
  assert.deepEqual(Array.from(rules.distributeTeamPool(3000, [{ memberId, rateBps: 2000 }, { memberId: secondId, rateBps: 1000 }]), row => ({ memberId: row.memberId, rateBps: row.rateBps })), [
    { memberId, rateBps: 2000 }, { memberId: secondId, rateBps: 1000 },
  ]);
  assert.throws(() => rules.distributeTeamPool(2500, [{ memberId, rateBps: 0 }]), /positive default/);
});
test("worker defaults prefill a stable share and manager settings validate against CRM members", async () => {
  const defaults = {
    basis: "ex_gst", gstRateBps: 1000,
    employeeSettings: [{ memberId, mode: "percent", rateBps: 3000, dailyCapCents: 50000 }],
    automaticExpenses: [],
  };
  const job = rules.earningsJob(baseLead, [member], null, defaults);
  assert.equal(job.defaultShares[0].memberId, memberId);
  assert.equal(job.defaultShares[0].rateBps, 3000);
  const f = fixture();
  const saved = await f.api.saveTeamEarningsSettings(defaults, "manager");
  assert.equal(saved.employeeSettings[0].dailyCapCents, 50000);
  assert.equal(f.state.settings[0].updatedBy, "manager");
  await assert.rejects(f.api.saveTeamEarningsSettings({
    ...defaults, employeeSettings: [{ ...defaults.employeeSettings[0], memberId: "not-in-roster" }],
  }, "manager"), /current CRM team member/);
});
test("each invoice has an independent sent and payment state within one job", () => {
  const invoice = rules.earningsJob({
    ...baseLead, invoiceSentAt: "2026-11-20T10:00:00.000Z",
    earningsInvoices: [{ invoiceNumber: "INV-ADDON", invoiceAmount: 220, invoiceStatus: "Unpaid" }],
  }, [member], null);
  assert.equal(Array.from(invoice.receipts, receipt => receipt.status).join(","), "pending,unsent");
  assert.equal(invoice.paymentStatus, "pending");
  const paid = rules.earningsJob({
    ...baseLead, invoiceStatus: "Paid", amountPaid: 1100,
    earningsInvoices: [{ invoiceNumber: "INV-ADDON", invoiceAmount: 220, invoiceStatus: "Unpaid" }],
  }, [member], null);
  assert.equal(Array.from(paid.receipts, receipt => receipt.status).join(","), "paid,unsent");
  assert.equal(paid.paymentStatus, "partial");
  assert.equal(paid.invoicePaid, false);
});
test("shares require valid members, integer precision, unique recipients and total at most 35%", () => {
  const parse = shares => rules.parseEarningsShares(shares, [member, second]);
  for (const shares of [[], [{ memberId, rateBps: 0 }], [{ memberId, rateBps: 1.5 }], [{ memberId, rateBps: 3501 }], [{ memberId: "unknown", rateBps: 100 }], [{ memberId, rateBps: 2000 }, { memberId, rateBps: 1000 }], [{ memberId, rateBps: 2000 }, { memberId: secondId, rateBps: 1501 }]]) assert.throws(() => parse(shares));
  assert.equal(parse([{ memberId, rateBps: 3000 }])[0].name, "Alex");
  assert.throws(() => rules.parseEarningsShares([{ memberId, rateBps: 100 }], [{ ...member, active: false }]));
});
test("saved team payout limit controls draft and approval validation", async () => {
  const f = fixture();
  f.state.settings[0].maxTeamShareBps = 4000;
  const d = await f.mutate("save", 0, { basis: "ex_gst", shares: [{ memberId, rateBps: 4000 }] });
  assert.equal(d.shares[0].rateBps, 4000);
  f.state.settings[0].maxTeamShareBps = 3500;
  await assert.rejects(f.mutate("approve", d.version, { invoice: rules.invoiceForEarnings(baseLead, "ex_gst") }), /35%/);
});
test("shared-job rounding reconciles to cents at the 35% team limit", () => {
  const shares = rules.parseEarningsShares([{ memberId, rateBps: 1750 }, { memberId: secondId, rateBps: 1750 }], [member, second]);
  for (let cents = 1; cents < 1000; cents++) {
    const result = rules.calculateEarnings(shares, cents);
    assert.equal(result.reduce((sum, s) => sum + s.earnedCents, 0), Math.round(cents * 3500 / 10000));
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
test("daily caps span approved jobs on the same completion day without changing earlier approvals", async () => {
  const f = fixture();
  f.state.settings[0].employeeSettings = [{ memberId, mode: "percent", rateBps: 3000, dailyCapCents: 40000 }];
  const first = await approved(f);
  assert.equal(first.shares[0].earnedCents, 30000);
  const secondId = "abcdef0123456789abcdef02";
  f.state.submissions.push({ ...baseLead, _id: new ObjectId(secondId), jobNo: "GX-2002", invoiceNumber: "INV-2002" });
  const secondDraft = await f.mutateFor(secondId, "save", 0, { basis: "ex_gst", notes: "", shares: [{ memberId, rateBps: 3000 }] });
  const second = await f.mutateFor(secondId, "approve", secondDraft.version, { invoice: rules.invoiceForEarnings({ ...baseLead, jobNo: "GX-2002", invoiceNumber: "INV-2002" }, "ex_gst") });
  assert.equal(second.shares[0].earnedCents, 10000);
  assert.equal(f.state.team_earnings.find(row => row._id === leadId).shares[0].earnedCents, 30000);
  const jobs = (await f.api.listTeamEarnings()).jobs;
  assert.equal(jobs.find(job => job.id === leadId).dailyCapUsage[0].usedCents, 10000, "the first job does not count its own approved share");
  assert.equal(jobs.find(job => job.id === secondId).dailyCapUsage[0].usedCents, 30000, "the second job sees the other approved share");
});

test("automatic expenses are snapshotted once per eligible job and manual expense changes are audited", async () => {
  const f = fixture();
  f.state.settings[0].automaticExpenses = [{ id: randomUUID(), name: "Fuel", amountCents: 2500, active: true, activeFrom: "2026-01-01" }];
  const first = await f.api.listTeamEarnings();
  assert.equal(first.jobs[0].expenses.filter(expense => !expense.voidedAt).length, 1);
  assert.equal(first.jobs[0].expenses[0].amountCents, 2500);
  const again = await f.api.listTeamEarnings();
  assert.equal(again.jobs[0].expenses.length, 1);
  assert.equal(f.state.team_earnings_job_expenses[0].version, 1);
  assert.equal((await f.api.earningsExpenses(leadId)).version, 1);
  const added = await f.api.mutateTeamEarningsExpense(leadId, {
    action: "add", requestId: randomUUID(), version: 1, name: "Materials", amountCents: 5000, date: "2026-01-01",
  }, "manager");
  assert.equal(added.version, 2);
  const removed = await f.api.mutateTeamEarningsExpense(leadId, {
    action: "remove", requestId: randomUUID(), version: 2, expenseId: added.items.find(expense => expense.source === "manual").id,
  }, "manager");
  assert.equal(removed.items.find(expense => expense.source === "manual").voidedBy, "manager");
  assert.equal(f.state.team_earnings_expense_events.length, 2);
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


test("completed legacy visits are payable and show each worker with days", () => {
  const job = rules.earningsJob({ ...baseLead, inspectionAt: "2025-12-30T09:00", inspectorId: secondId, assigned: "Sam", bookings: [
    { type: "job", date: "2026-01-01", time: "08:00", technicianId: memberId, status: "Job Booked", jobDaysDone: 2, jobTotalDays: 2 },
  ] }, [member, second], null);
  assert.equal(job.eligible, true);
  assert.equal(job.workVisits.find(v => v.type === "job").name, "Alex");
  assert.equal(job.workVisits.find(v => v.type === "job").daysDone, 2);
  assert.equal(job.workVisits.find(v => v.type === "inspection").name, "Sam");
});
test("separately saved customer invoices appear, approve, and detect later invoice changes", async () => {
  const f = fixture();
  delete f.state.submissions[0].invoiceNumber;
  delete f.state.submissions[0].invoiceAmount;
  f.state.customer_invoices.push({ _id: leadId + "~invoice~one", leadId, values: { invoiceNumber: "INV-A", invoiceAmount: 1100, invoiceDraft: { gst: 10 }, invoiceStatus: "Paid" } },
    { _id: leadId + "~invoice~two", leadId, values: { invoiceNumber: "INV-B", invoiceAmount: 500, invoiceDraft: { gst: 0 }, invoiceStatus: "Unpaid" } });
  let job = (await f.api.listTeamEarnings()).jobs[0];
  assert.equal(job.invoice.totalCents, 160000, "paid and pending invoices both contribute to the job basis");
  assert.equal(job.invoice.baseCents, 150000);
  assert.equal(job.invoicePaid, false);
  assert.equal(job.eligible, true);
  const d = await draft(f);
  const a = await f.mutate("approve", d.version, { invoice: job.invoice });
  assert.equal(a.shares[0].earnedCents, 45000);
  f.state.customer_invoices[1].values.invoiceAmount = 600;
  job = (await f.api.listTeamEarnings()).jobs[0];
  assert.equal(job.changed, true);
  await assert.rejects(f.mutate("pay", a.version, pay()), /changed after approval/);
});

test("each invoice can have independent shares, payments, and later allocations", async () => {
  const f = fixture();
  f.state.customer_invoices.push({ _id: "invoice-two", leadId, values: { invoiceNumber: "INV-B", invoiceAmount: 500, invoiceDraft: { gst: 0 } } });
  let invoice = (await f.api.listTeamEarnings()).jobs[0].invoice;
  const first = await f.mutate("save", 0, { basis: "ex_gst", invoiceKey: "primary", poolBps: 3000, shares: [{ memberId, rateBps: 3000 }] });
  assert.equal(first.invoiceShares[0].poolBps, 3000);
  await assert.rejects(f.mutate("save", first.version, { basis: "ex_gst", invoiceKey: "primary", poolBps: 2500, shares: [{ memberId, rateBps: 3000 }] }), /team pool must equal/);
  const secondDraft = await f.mutate("save", first.version, { basis: "ex_gst", invoiceKey: "invoice-two", shares: [{ memberId: secondId, rateBps: 1000 }] });
  let approved = await f.mutate("approve", secondDraft.version, { invoice });
  assert.equal(approved.invoiceShares.find(a => a.invoiceKey === "primary").shares[0].earnedCents, 30000);
  assert.equal(approved.invoiceShares.find(a => a.invoiceKey === "invoice-two").shares[0].earnedCents, 5000);
  assert.equal(approved.shares.reduce((sum, share) => sum + share.earnedCents, 0), 35000);
  approved = await f.mutate("pay", approved.version, { ...pay({ memberId: secondId, amountCents: 2000 }), invoiceKey: "invoice-two" });
  assert.equal(approved.invoiceShares.find(a => a.invoiceKey === "invoice-two").shares[0].paidCents, 2000);
  assert.equal(approved.shares.find(s => s.memberId === secondId).paidCents, 2000);
  f.state.customer_invoices.push({ _id: "invoice-three", leadId, values: { invoiceNumber: "INV-C", invoiceAmount: 220, invoiceDraft: { gst: 10 } } });
  invoice = (await f.api.listTeamEarnings()).jobs[0].invoice;
  approved = await f.mutate("upsert_invoice", approved.version, { basis: "ex_gst", invoiceKey: "invoice-three", shares: [{ memberId, rateBps: 1000 }], invoice });
  assert.equal(approved.invoiceShares.find(a => a.invoiceKey === "invoice-three").shares[0].earnedCents, 2000);
  assert.equal(approved.shares.find(s => s.memberId === memberId).earnedCents, 32000);
  assert.equal((await f.api.listTeamEarnings()).jobs[0].changed, false);
  await assert.rejects(f.mutate("upsert_invoice", approved.version, { basis: "ex_gst", invoiceKey: "invoice-two", shares: [{ memberId: secondId, rateBps: 2000 }], invoice }), /Reverse this invoice/);
});

test("member summary payment records every invoice balance atomically and retries safely", async () => {
  const f = fixture();
  f.state.customer_invoices.push({ _id: "invoice-two", leadId, values: { invoiceNumber: "INV-B", invoiceAmount: 500, invoiceDraft: { gst: 0 } } });
  const invoice = (await f.api.listTeamEarnings()).jobs[0].invoice;
  const first = await f.mutate("save", 0, { basis: "ex_gst", invoiceKey: "primary", shares: [{ memberId, rateBps: 3000 }] });
  const secondDraft = await f.mutate("save", first.version, { basis: "ex_gst", invoiceKey: "invoice-two", shares: [{ memberId, rateBps: 1000 }] });
  const approved = await f.mutate("approve", secondDraft.version, { invoice });
  const body = { memberId, date: "2026-01-01", method: "Bank transfer", reference: "BATCH-100", note: "Paid together", requestId: randomUUID(), entries: [
    { jobId: leadId, invoiceKey: "primary", version: approved.version, amountCents: 30000 },
    { jobId: leadId, invoiceKey: "invoice-two", version: approved.version, amountCents: 5000 },
  ] };
  await assert.rejects(f.api.recordMemberEarningsPayment({ ...body, entries: [body.entries[0], { ...body.entries[1], amountCents: 4999 }] }, "manager"), /balance changed/);
  assert.equal(f.state.team_earnings_payments.length, 0);
  const result = await f.api.recordMemberEarningsPayment(body, "manager");
  assert.equal(result.amountCents, 35000);
  assert.equal(result.paymentsCount, 2);
  assert.equal(f.state.team_earnings_payments.length, 2);
  assert.equal(f.state.team_earnings[0].shares[0].paidCents, 35000);
  assert.equal(f.state.team_earnings[0].invoiceShares[0].shares[0].paidCents, 30000);
  assert.equal(f.state.team_earnings[0].invoiceShares[1].shares[0].paidCents, 5000);
  await f.api.recordMemberEarningsPayment(body, "manager");
  assert.equal(f.state.team_earnings_payments.length, 2);
});

test("member summary payment rolls back all jobs if one balance changed", async () => {
  const f = fixture();
  const first = await approved(f);
  f.state.submissions.push({ ...baseLead, _id: new ObjectId(secondId), jobNo: "Job-200", invoiceNumber: "INV-200" });
  const secondDraft = await f.mutateFor(secondId, "save", 0, { basis: "ex_gst", shares: [{ memberId, rateBps: 2000 }] });
  const secondApproved = await f.mutateFor(secondId, "approve", secondDraft.version, { invoice: rules.invoiceForEarnings({ ...baseLead, invoiceNumber: "INV-200" }, "ex_gst") });
  const body = { memberId, date: "2026-01-01", method: "Cash", reference: "BATCH-200", requestId: randomUUID(), entries: [
    { jobId: leadId, version: first.version, amountCents: 30000 },
    { jobId: secondId, version: secondApproved.version, amountCents: 19999 },
  ] };
  await assert.rejects(f.api.recordMemberEarningsPayment(body, "manager"), /balance changed/);
  assert.equal(f.state.team_earnings_payments.length, 0);
  assert.equal(f.state.team_earnings.find(row => row._id === leadId).shares[0].paidCents, 0);
  assert.equal(f.state.team_earnings.find(row => row._id === secondId).shares[0].paidCents, 0);
});

test("fixed amounts mix with percentage shares, survive approval and support payment", async () => {
  const f = fixture();
  const d = await f.mutate("save", 0, { basis: "ex_gst", shares: [{ memberId, fixedAmountCents: 10000 }, { memberId: secondId, rateBps: 2500 }] });
  assert.equal(d.shares[0].fixedAmountCents, 10000);
  const a = await f.mutate("approve", d.version, { invoice: rules.invoiceForEarnings(baseLead, "ex_gst") });
  assert.deepEqual(a.shares.map(s => s.earnedCents), [10000, 25000]);
  const paid = await f.mutate("pay", a.version, pay({ amountCents: 10000 }));
  assert.equal(paid.shares[0].paidCents, 10000);
  assert.equal(paid.shares[0].fixedAmountCents, 10000);
});

test("invalid fixed amounts and mixed totals above the 35% team limit are rejected", async () => {
  for (const fixedAmountCents of [0, -1, 1.5, NaN, "30000"]) {
    assert.throws(() => rules.parseEarningsShares([{ memberId, fixedAmountCents }], [member]));
  }
  assert.throws(() => rules.parseEarningsShares([{ memberId, fixedAmountCents: 30000, rateBps: 1000 }], [member]));
  const f = fixture();
  await assert.rejects(f.mutate("save", 0, { basis: "ex_gst", shares: [{ memberId, fixedAmountCents: 80000 }, { memberId: secondId, rateBps: 2500 }] }), /cannot exceed/);
  const d = await f.mutate("save", 0, { basis: "ex_gst", shares: [{ memberId, fixedAmountCents: 30000 }] });
  f.state.submissions[0].invoiceAmount = 550;
  await assert.rejects(f.mutate("approve", d.version, { invoice: rules.invoiceForEarnings({ ...baseLead, invoiceAmount: 550 }, "ex_gst") }), /cannot exceed/);
});

test("mixed allocation preserves exact fixed cents and currency displays cents", () => {
  const shares = rules.parseEarningsShares([{ memberId, fixedAmountCents: 101 }, { memberId: secondId, rateBps: 3333 }], [member, second]);
  const result = rules.calculateEarnings(shares, 1001);
  assert.deepEqual(result.map(s => s.earnedCents), [101, 334]);
  for (const [cents, expected] of [[30000, "$300"], [30040, "$300.40"], [30090, "$300.90"], [30099, "$300.99"]]) assert.equal(rules.formatEarningsMoney(cents), expected);
  assert.equal(rules.formatEarningsMoney(99), "$0.99");
  assert.equal(rules.formatEarningsMoney(-0), "$0");
});

test("register receipts reconcile legacy, partial and multiple invoice payments without changing approval snapshots", async () => {
  const f = fixture();
  f.state.submissions[0].amountPaid = 100.25;
  f.state.submissions[0].invoiceStatus = "Partially Paid";
  f.state.customer_invoices.push({ _id: "extra", leadId, values: { invoiceNumber: "INV-EXTRA", invoiceAmount: 220, invoiceStatus: "Paid", invoiceDraft: { gst: 10 } } });
  let job = (await f.api.listTeamEarnings()).jobs[0];
  assert.equal(job.invoice.totalCents, 132000);
  assert.equal(job.scheduledAt, baseLead.jobAt);
  assert.equal(job.receipts.reduce((sum, row) => sum + row.paidCents, 0), 32025);
  assert.equal(job.receipts[0].remainingCents, 99975);
  assert.equal(job.invoicePaid, false);
  const d = await draft(f);
  const a = await f.mutate("approve", d.version, { invoice: job.invoice });
  f.state.submissions[0].amountPaid = 1100;
  f.state.submissions[0].invoiceStatus = "Paid";
  job = (await f.api.listTeamEarnings()).jobs[0];
  assert.equal(job.changed, false, "Customer receipts must not invalidate approved team allocations");
  assert.equal(job.invoicePaid, true);
  assert.equal(job.ledger.shares[0].earnedCents, a.shares[0].earnedCents);
  const legacy = rules.earningsJob({ ...baseLead, paymentType: "full" }, [member], null);
  assert.equal(legacy.receipts[0].paidCents, 110000);
  assert.equal(legacy.invoicePaid, true);
});

test("register filters reflect visit progress and receipts while totals exclude draft estimates from payable earnings", () => {
  const { matchesRegisterFilter: matches, registerTotals } = loadTs("lib/teamEarningsRegister.ts");
  const done = rules.earningsJob({ ...baseLead, amountPaid: 200 }, [member], null);
  const booked = rules.earningsJob({ ...baseLead, status: "Job Booked", invoiceNumber: undefined }, [member], null);
  const cancelled = rules.earningsJob({ ...baseLead, status: "Cancelled" }, [member], null);
  assert.equal(matches(done, "Completed"), true);
  assert.equal(matches(done, "Pending"), true);
  assert.equal(matches(done, "Paid"), false);
  assert.equal(matches(booked, "Booked"), true);
  assert.equal(matches(booked, "Scheduled"), true);
  assert.equal(matches(booked, "Invoiced"), false);
  assert.equal(matches(cancelled, "Completed"), false);
  assert.equal(matches(cancelled, "Cancelled"), true);
  done.ledger = { status: "draft", shares: [{ memberId, name: "Alex", rateBps: 3000, earnedCents: 0, paidCents: 0 }] };
  const totals = registerTotals([done]);
  assert.equal(totals.received, 20000);
  assert.equal(totals.earned, 0);
  assert.equal(totals.estimated, 30000);
  done.ledger.status = "approved";
  done.ledger.shares[0].earnedCents = 30000;
  done.ledger.shares[0].paidCents = 10000;
  assert.equal(registerTotals([done]).earned - registerTotals([done]).paid, 20000);
  const paymentPending = rules.earningsJob({ ...baseLead, status: "Payment Pending", invoiceNumber: "INV-200", invoiceAmount: 220 }, [member], null);
  paymentPending.ledger = { status: "approved", shares: [{ memberId, name: "Alex", rateBps: 3000, earnedCents: 6000, paidCents: 0 }] };
  assert.equal(matches(paymentPending, "Completed"), true);
  assert.equal(matches(paymentPending, "Pending"), true);
  assert.equal(registerTotals([done, paymentPending]).earned, 36000);
  assert.equal(registerTotals([done, paymentPending]).value, 132000);
});
