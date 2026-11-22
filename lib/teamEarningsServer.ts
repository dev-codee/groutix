import { createHash } from "node:crypto";
import { ObjectId, type ClientSession } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { listTechnicians } from "@/lib/technicians";
import type { Lead } from "@/components/admin/types";
import { EarningsError, validateEarningsTotal, calculateEarnings, applyDailyEarningsCaps, earningsBody, earningsCompletionDate, earningsId, earningsInteger, earningsJob, earningsText, invoiceForEarnings, parseEarningsShares, sameEarningsInvoice, type EarningsData, type EarningsExpense, type EarningsLedger, type EarningsMember, type EarningsPayment, type EarningsEvent, type EarningsSourceLead } from "./teamEarnings";
import { defaultTeamEarningsSettings, validateTeamEarningsSettings, type TeamEarningsSettings } from "./teamEarningsSettings";

type LedgerDoc = Omit<EarningsLedger, "id"> & { _id: string };
type PaymentDoc = Omit<EarningsPayment, "id"> & { _id: string; leadId: string };
type EventDoc = Omit<EarningsEvent, "id"> & { _id: string; leadId: string; requestHash: string; snapshot: LedgerDoc };
type ExpenseDoc = { _id: string; version: number; items: EarningsExpense[] };
const leadProjection = { name: 1, jobNo: 1, service: 1, status: 1, type: 1, createdAt: 1, assigned: 1, technician: 1, technicianId: 1, technicianUsername: 1, inspectorId: 1, inspectorUsername: 1, jobAt: 1, inspectionAt: 1, jobTotalDays: 1, jobDaysDone: 1, invoiceAmount: 1, invoiceNumber: 1, "invoiceDraft.gst": 1, invoiceStatus: 1, invoiceSentAt: 1, paymentType: 1, amountPaid: 1, "paymentReceipt.total": 1, primaryJobBookingId: 1, primaryInspectionBookingId: 1, jobEndAt: 1, inspectionEndAt: 1, jobWorkSegments: 1, inspectionWorkSegments: 1 };
let indexes: Promise<unknown> | undefined;
async function collections() {
  const db = await getDb();
  const ledgers = db.collection<LedgerDoc>("team_earnings");
  const payments = db.collection<PaymentDoc>("team_earnings_payments");
  const events = db.collection<EventDoc>("team_earnings_events");
  const dailyCaps = db.collection<{ _id: string; version: number }>("team_earnings_daily_caps");
  const expenses = db.collection<ExpenseDoc>("team_earnings_job_expenses");
  const expenseEvents = db.collection<{ _id: string; leadId: string; requestHash: string; action: string; actor: string; createdAt: string; detail: string; snapshot: ExpenseDoc }>("team_earnings_expense_events");
  indexes ??= Promise.all([payments.createIndex({ leadId: 1, createdAt: -1 }), events.createIndex({ leadId: 1, "snapshot.version": -1 })]).catch(e => { indexes = undefined; throw e; });
  await indexes;
  return { db, ledgers, payments, events, dailyCaps, expenses, expenseEvents };
}
function serialize(doc: LedgerDoc): EarningsLedger { const { _id, ...rest } = doc; return { ...rest, id: _id }; }
function validateLeadId(id: string) { if (!/^[0-9a-f]{24}$/i.test(id)) throw new EarningsError("Invalid lead ID."); return id.toLowerCase(); }
export async function listEarningsMembers(): Promise<EarningsMember[]> {
  const db = await getDb();
  const users = await db.collection("admin_users").find({}, { projection: { name: 1, username: 1, role: 1, active: 1 } }).toArray();
  const technicians = await listTechnicians({ strict: true });
  const result: EarningsMember[] = technicians.map(t => ({ id: t.id, name: t.name, username: t.username, role: "technician", active: t.active, aliases: t.aliases || [] }));
  for (const user of users) {
    const id = user._id.toString();
    if (!result.some(m => m.id === id || m.aliases.includes(id))) result.push({ id, name: user.name || user.username, username: user.username, role: user.role, active: user.active !== false, aliases: [] });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
export async function getTeamEarningsSettings(): Promise<TeamEarningsSettings> {
  const db = await getDb();
  const saved = await db.collection("settings").findOne({ _id: "team-earnings" } as never);
  if (!saved) return defaultTeamEarningsSettings;
  return {
    ...defaultTeamEarningsSettings,
    basis: saved.basis === "inclusive" ? "inclusive" : "ex_gst",
    gstRateBps: Number.isSafeInteger(saved.gstRateBps) ? saved.gstRateBps : defaultTeamEarningsSettings.gstRateBps,
    employeeSettings: Array.isArray(saved.employeeSettings) ? saved.employeeSettings : [],
    automaticExpenses: Array.isArray(saved.automaticExpenses) ? saved.automaticExpenses : [],
    ...(typeof saved.updatedAt === "string" ? { updatedAt: saved.updatedAt } : {}),
    ...(typeof saved.updatedBy === "string" ? { updatedBy: saved.updatedBy } : {}),
  };
}
export async function saveTeamEarningsSettings(value: unknown, actor: string): Promise<TeamEarningsSettings> {
  const settings = validateTeamEarningsSettings(value, await listEarningsMembers());
  const now = new Date().toISOString();
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "team-earnings" } as never,
    { $set: { ...settings, updatedAt: now, updatedBy: actor } },
    { upsert: true },
  );
  return { ...settings, updatedAt: now, updatedBy: actor };
}
async function sourceLead(id: string, session?: ClientSession): Promise<EarningsSourceLead | null> {
  const db = await getDb();
  const doc = await db.collection("submissions").findOne({ _id: new ObjectId(id) }, { projection: leadProjection, session });
  if (!doc) return null;
  const visits = await db.collection("bookings").find({ leadId: id }, { session }).toArray();
  const invoices = await db.collection("customer_invoices").find({ leadId: id }, { session }).sort({ _id: 1 }).toArray();
  return { ...doc, earningsInvoices: invoices.map(invoice => invoice.values), id, createdAt: String(doc.createdAt || ""), bookings: visits.map(b => ({ ...b, bookingId: b.bookingId || b._id.toString() })) } as unknown as EarningsSourceLead;
}
function missingLead(ledger: EarningsLedger): Lead {
  return { id: ledger.id, status: "Source unavailable", createdAt: "", name: ledger.customer, jobNo: ledger.jobLabel };
}
export async function listTeamEarnings(): Promise<EarningsData> {
  const { db, ledgers, payments, expenses } = await collections();
  const [roster, docs, sources, visits, invoices, settings, paymentDocs, expenseDocs] = await Promise.all([listEarningsMembers(), ledgers.find({}).toArray(), db.collection("submissions").find({}, { projection: leadProjection }).toArray(), db.collection("bookings").find({}).toArray(), db.collection("customer_invoices").find({}).sort({ _id: 1 }).toArray(), getTeamEarningsSettings(), payments.find({}).sort({ createdAt: -1 }).toArray(), expenses.find({}).toArray()]);
  const byLead = new Map<string, typeof visits>();
  for (const visit of visits) { const rows = byLead.get(visit.leadId) || []; rows.push(visit); byLead.set(visit.leadId, rows); }
  const invoicesByLead = new Map<string, typeof invoices>();
  for (const invoice of invoices) { const rows = invoicesByLead.get(invoice.leadId) || []; rows.push(invoice); invoicesByLead.set(invoice.leadId, rows); }
  const records = new Map(docs.map(doc => [doc._id, serialize(doc)]));
  const expensesByLead = new Map(expenseDocs.map(doc => [doc._id, doc.items || []]));
  const jobs = sources.filter(doc => doc.type !== "support_ticket").map(doc => {
    const id = doc._id.toString();
    const lead = { ...doc, earningsInvoices: (invoicesByLead.get(id) || []).map(invoice => invoice.values), id, createdAt: String(doc.createdAt || ""), bookings: (byLead.get(id) || []).map(b => ({ ...b, bookingId: b.bookingId || b._id.toString() })) } as unknown as EarningsSourceLead;
    const job = earningsJob(lead, roster, records.get(id) || null, settings);
    job.expenses = expensesByLead.get(id) || [];
    job.expenseVersion = expenseDocs.find(expense => expense._id === id)?.version || 0;
    return job;
  });
  const present = new Set(jobs.map(job => job.id));
  for (const ledger of records.values()) if (!present.has(ledger.id)) {
    const job = earningsJob(missingLead(ledger), roster, ledger, settings);
    job.expenses = expensesByLead.get(ledger.id) || [];
    job.expenseVersion = expenseDocs.find(expense => expense._id === ledger.id)?.version || 0;
    jobs.push(job);
  }
  // Removed members stay identifiable in financial history and summaries.
  for (const ledger of records.values()) for (const share of ledger.shares) if (!roster.some(m => m.id === share.memberId)) roster.push({ id: share.memberId, name: share.name, role: "former member", active: false, aliases: [] });
  const dailyUsage = new Map<string, Map<string, number>>();
  for (const job of jobs) {
    if (job.ledger?.status !== "approved" || !job.completionDate) continue;
    const day = dailyUsage.get(job.completionDate) || new Map<string, number>();
    for (const share of job.ledger.shares) day.set(share.memberId, (day.get(share.memberId) || 0) + share.earnedCents);
    dailyUsage.set(job.completionDate, day);
  }
  const dailyCaps = new Map(settings.employeeSettings.filter(setting => setting.dailyCapCents !== null).map(setting => [setting.memberId, setting.dailyCapCents!]));
  for (const job of jobs) {
    const used = dailyUsage.get(job.completionDate);
    const relevantMembers = new Set([...job.assignedIds, ...(job.ledger?.shares.map(share => share.memberId) || [])]);
    job.dailyCapUsage = [...relevantMembers].flatMap(memberId => {
      const capCents = dailyCaps.get(memberId);
      return capCents === undefined ? [] : [{ memberId, capCents, usedCents: used?.get(memberId) || 0 }];
    });
  }
  for (const job of jobs) {
    if (["Cancelled", "Lost", "Source unavailable"].includes(job.status)) continue;
    const rules = settings.automaticExpenses.filter(rule => rule.active && job.completionDate >= rule.activeFrom);
    const current = expensesByLead.get(job.id) || [];
    let expenseVersion = expenseDocs.find(expense => expense._id === job.id)?.version || 0;
    for (const rule of rules) {
      if (current.some(expense => expense.autoRuleId === rule.id)) continue;
      await expenses.updateOne({ _id: job.id }, { $setOnInsert: { _id: job.id, version: 0, items: [] } }, { upsert: true });
      const item: EarningsExpense = {
        id: `auto-${rule.id}`, autoRuleId: rule.id, name: rule.name, amountCents: rule.amountCents,
        date: job.completionDate, source: "automatic", createdAt: `${rule.activeFrom}T00:00:00.000Z`,
        createdBy: settings.updatedBy || "system",
      };
      const result = await expenses.updateOne({ _id: job.id, "items.autoRuleId": { $ne: rule.id } }, { $push: { items: item }, $inc: { version: 1 } });
      if (result.matchedCount) { current.push(item); expenseVersion++; }
    }
    job.expenses = current;
    job.expenseVersion = expenseVersion;
  }
  return {
    members: roster, jobs, settings,
    payments: paymentDocs.map(({ _id, leadId, ...payment }) => ({
      ...payment, id: _id, jobId: leadId, jobLabel: jobs.find(job => job.id === leadId)?.jobLabel || `Lead-${leadId.slice(-6)}`,
    })),
  };
}

function validMoneyDate(value: unknown, label: string) {
  const date = earningsText(value, label, 10, true);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date || date > today) throw new EarningsError(`Enter a valid ${label.toLowerCase()}, today or earlier.`);
  return date;
}

export async function earningsExpenses(id: string) {
  id = validateLeadId(id);
  const { expenses, expenseEvents } = await collections();
  const [record, events] = await Promise.all([
    expenses.findOne({ _id: id }),
    expenseEvents.find({ leadId: id }).sort({ createdAt: -1 }).toArray(),
  ]);
  return { version: record?.version || 0, expenses: record?.items || [], events: events.map(({ _id, action, actor, createdAt, detail }) => ({ id: _id, action, actor, createdAt, detail })) };
}

export async function mutateTeamEarningsExpense(id: string, value: unknown, actor: string) {
  id = validateLeadId(id);
  const body = earningsBody(value);
  const requestId = earningsId(body.requestId);
  const version = earningsInteger(body.version, "expense version");
  const action = earningsText(body.action, "Action", 20, true);
  if (action !== "add" && action !== "remove") throw new EarningsError("Invalid expense action.");
  const requestHash = createHash("sha256").update(JSON.stringify({ id, body })).digest("hex");
  const { expenses, expenseEvents } = await collections();
  const session = (await getMongoClient()).startSession();
  try {
    return await session.withTransaction(async () => {
      const eventId = `${id}:${requestId}`;
      const previous = await expenseEvents.findOne({ _id: eventId }, { session });
      let current = await expenses.findOne({ _id: id }, { session });
      if (previous) {
        if (previous.requestHash !== requestHash) throw new EarningsError("This request was already used with different details.", 409);
        return current || { _id: id, version: 0, items: [] };
      }
      if ((current?.version || 0) !== version) throw new EarningsError("Expenses changed. Refresh before trying again.", 409);
      const lead = await sourceLead(id, session);
      if (!lead || lead.type === "support_ticket") throw new EarningsError("The original lead is unavailable.", 409);
      const now = new Date().toISOString();
      current ||= { _id: id, version: 0, items: [] };
      let detail = "";
      if (action === "add") {
        const item: EarningsExpense = {
          id: requestId, name: earningsText(body.name, "Expense name", 100, true),
          amountCents: earningsInteger(body.amountCents, "expense amount", 1),
          date: validMoneyDate(body.date, "Expense date"), source: "manual", createdAt: now, createdBy: actor,
        };
        current.items.push(item);
        detail = `Added ${item.name}: AUD ${(item.amountCents / 100).toFixed(2)} on ${item.date}.`;
      } else {
        const expenseId = earningsText(body.expenseId, "Expense", 100, true);
        const item = current.items.find(expense => expense.id === expenseId && !expense.voidedAt);
        if (!item) throw new EarningsError("Expense was not found or is already removed.", 409);
        item.voidedAt = now; item.voidedBy = actor;
        detail = `Removed ${item.name}: AUD ${(item.amountCents / 100).toFixed(2)}.`;
      }
      current.version++;
      if (current.version === 1) await expenses.insertOne(current, { session });
      else {
        const result = await expenses.replaceOne({ _id: id, version }, current, { session });
        if (!result.matchedCount) throw new EarningsError("Expenses changed. Refresh before trying again.", 409);
      }
      await expenseEvents.insertOne({ _id: eventId, leadId: id, requestHash, action, actor, createdAt: now, detail, snapshot: current }, { session });
      return current;
    });
  } finally { await session.endSession(); }
}
export async function earningsHistory(id: string, page: number) {
  validateLeadId(id);
  const { payments, events } = await collections();
  const entries = await events.find({ leadId: id }).sort({ "snapshot.version": -1 }).skip((page - 1) * 25).limit(26).toArray();
  return { hasMore: entries.length > 25, events: entries.slice(0, 25).map(({ _id, action, actor, createdAt, detail }) => ({ id: _id, action, actor, createdAt, detail })),
    payments: (await payments.find({ leadId: id }).sort({ createdAt: -1, _id: -1 }).toArray()).map(({ _id, leadId: _leadId, ...rest }) => ({ ...rest, id: _id })) };
}
export async function mutateTeamEarnings(id: string, value: unknown, actor: string) {
  id = validateLeadId(id);
  const body = earningsBody(value), requestId = earningsId(body.requestId);
  const version = earningsInteger(body.version, "version");
  const action = earningsText(body.action, "Action", 30, true);
  if (!["save", "approve", "reopen", "pay", "void_payment"].includes(action)) throw new EarningsError("Invalid earnings action.");
  const requestHash = createHash("sha256").update(JSON.stringify({ id, body })).digest("hex");
  const { db, ledgers, payments, events, dailyCaps } = await collections();
  const roster = action === "save" ? await listEarningsMembers() : [];
  const session = (await getMongoClient()).startSession();
  try {
    return await session.withTransaction(async () => {
      const eventId = `${id}:${requestId}`;
      const previous = await events.findOne({ _id: eventId }, { session });
      const current = await ledgers.findOne({ _id: id }, { session });
      if (previous) {
        if (previous.requestHash !== requestHash) throw new EarningsError("This request was already used with different details.", 409);
        return current ? serialize(current) : null;
      }
      if ((current?.version || 0) !== version) throw new EarningsError("This record changed. Refresh and reopen it before trying again.", 409);
      const lead = await sourceLead(id, session);
      if ((!lead || lead.type === "support_ticket") && !["reopen", "void_payment"].includes(action)) throw new EarningsError("The original lead is unavailable.", 409);
      const now = new Date().toISOString();
      let record: LedgerDoc = current ? { ...current, shares: current.shares.map(s => ({ ...s })) } : { _id: id, version: 0, status: "draft", basis: "ex_gst", shares: [], invoice: null, notes: "", updatedAt: now, jobLabel: lead?.jobNo || `Lead-${id.slice(-6)}`, customer: lead?.name || "Customer" };
      let detail = "";
      if (action === "save") {
        if (record.status === "approved") throw new EarningsError("Reopen the approval before changing shares.", 409);
        if (body.basis !== "ex_gst" && body.basis !== "inclusive") throw new EarningsError("Choose an invoice basis.");
        record.basis = body.basis;
        record.shares = parseEarningsShares(body.shares, roster, current?.shares);
        const draftInvoice = invoiceForEarnings(lead!, record.basis);
        if (draftInvoice) validateEarningsTotal(record.shares, draftInvoice.baseCents);
        record.notes = earningsText(body.notes, "Notes", 2000);
        record.invoice = null;
        detail = `Saved ${record.shares.length} shares, ${(record.shares.reduce((sum, s) => sum + s.rateBps, 0) / 100).toFixed(2)}% total plus AUD ${(record.shares.reduce((sum, s) => sum + (s.fixedAmountCents || 0), 0) / 100).toFixed(2)} fixed; basis ${record.basis}. ${record.notes}`;
      } else if (action === "approve") {
        if (record.status !== "draft" || !record.shares.length) throw new EarningsError("Save draft shares before approving.", 409);
        const settingsDoc = await db.collection("settings").findOne({ _id: "team-earnings" } as never, { session });
        const settings: TeamEarningsSettings = {
          ...defaultTeamEarningsSettings,
          ...(settingsDoc || {}),
          basis: settingsDoc?.basis === "inclusive" ? "inclusive" : "ex_gst",
          employeeSettings: Array.isArray(settingsDoc?.employeeSettings) ? settingsDoc.employeeSettings : [],
          automaticExpenses: Array.isArray(settingsDoc?.automaticExpenses) ? settingsDoc.automaticExpenses : [],
        };
        const job = earningsJob(lead!, [], serialize(record), settings);
        if (!job.eligible) throw new EarningsError(job.unavailableReason, 409);
        const invoice = invoiceForEarnings(lead!, record.basis, settings.gstRateBps)!;
        // Confirm the amount the manager reviewed; a stale UI cannot approve a
        // different invoice even if the earnings document itself did not change.
        if (!sameEarningsInvoice(body.invoice as typeof invoice, invoice)) throw new EarningsError("The invoice changed. Refresh before approving.", 409);
        validateEarningsTotal(record.shares, invoice.baseCents);
        const completionDate = job.completionDate;
        if (completionDate) await dailyCaps.updateOne({ _id: completionDate }, { $inc: { version: 1 } }, { upsert: true, session });
        const usedByMember = new Map<string, number>();
        const earlierApproved = completionDate ? await ledgers.find({ status: "approved" }, { session }).toArray() : [];
        for (const prior of earlierApproved) {
          if (prior._id === id) continue;
          let priorDate = prior.completionDate;
          if (!priorDate) {
            const priorLead = await sourceLead(prior._id, session);
            priorDate = priorLead ? earningsCompletionDate(priorLead) : "";
          }
          if (priorDate !== completionDate) continue;
          for (const share of prior.shares) usedByMember.set(share.memberId, (usedByMember.get(share.memberId) || 0) + share.earnedCents);
        }
        const capUsage = settings.employeeSettings.flatMap(setting => setting.dailyCapCents === null
          ? [] : [{ memberId: setting.memberId, capCents: setting.dailyCapCents, usedCents: usedByMember.get(setting.memberId) || 0 }]);
        record.invoice = invoice; record.completionDate = completionDate;
        record.shares = applyDailyEarningsCaps(calculateEarnings(record.shares, invoice.baseCents), capUsage);
        record.status = "approved"; record.approvedAt = now; record.approvedBy = actor;
        detail = `Approved ${invoice.number}: base AUD ${(invoice.baseCents / 100).toFixed(2)}; ${record.shares.map(s => `${s.name} ${s.fixedAmountCents !== undefined ? "fixed amount" : `${s.rateBps / 100}%`} = AUD ${(s.earnedCents / 100).toFixed(2)}`).join(", ")}. Daily caps are applied across approved jobs for ${completionDate || "the completion date"}.`;
      } else if (action === "reopen") {
        if (record.status !== "approved") throw new EarningsError("Only approved earnings can be reopened.", 409);
        if (record.shares.some(s => s.paidCents !== 0)) throw new EarningsError("Reverse recorded payments before reopening earnings.", 409);
        detail = earningsText(body.reason, "Reason for reopening", 500, true);
        record.status = "draft"; record.invoice = null; delete record.completionDate;
        record.shares = record.shares.map(s => ({ ...s, earnedCents: 0, paidCents: 0 }));
        delete record.approvedAt; delete record.approvedBy;
      } else if (action === "pay") {
        if (record.status !== "approved") throw new EarningsError("Approve earnings before recording payment.", 409);
        if (earningsJob(lead!, [], serialize(record)).changed) throw new EarningsError("The invoice or work status changed after approval. Review and reopen the earnings first.", 409);
        const share = record.shares.find(s => s.memberId === body.memberId);
        if (!share) throw new EarningsError("Choose a member from this job's approved shares.");
        const amountCents = earningsInteger(body.amountCents, "payment amount", 1);
        if (amountCents > share.earnedCents - share.paidCents) throw new EarningsError("Payment exceeds this member's outstanding earnings.", 409);
        const date = earningsText(body.date, "Payment date", 10, true);
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date || date > today) throw new EarningsError("Enter a valid payment date, today or earlier.");
        const method = earningsText(body.method, "Payment method", 30, true);
        if (!["Bank transfer", "Cash", "Other"].includes(method)) throw new EarningsError("Choose a payment method.");
        const reference = earningsText(body.reference, "Payment reference", 160, true);
        const note = earningsText(body.note, "Payment note", 500);
        await payments.insertOne({ _id: requestId, leadId: id, memberId: share.memberId, memberName: share.name, amountCents, date, method, reference, note, actor, createdAt: now }, { session });
        share.paidCents += amountCents;
        detail = `${share.name}: recorded AUD ${(amountCents / 100).toFixed(2)} via ${method} on ${date}; reference ${reference}. ${note}`;
      } else {
        const paymentId = earningsId(body.paymentId);
        const payment = await payments.findOne({ _id: paymentId, leadId: id }, { session });
        if (!payment || payment.voidedAt) throw new EarningsError("Payment is missing or already reversed.", 409);
        const reason = earningsText(body.reason, "Reversal reason", 500, true);
        const share = record.shares.find(s => s.memberId === payment.memberId);
        if (!share || share.paidCents < payment.amountCents) throw new EarningsError("Payment balance needs review.", 409);
        await payments.updateOne({ _id: paymentId, leadId: id }, { $set: { voidedAt: now, voidedBy: actor, voidReason: reason } }, { session });
        share.paidCents -= payment.amountCents;
        detail = `Reversed payment ${payment.reference}, AUD ${(payment.amountCents / 100).toFixed(2)} to ${payment.memberName}: ${reason}`;
      }
      record = { ...record, version: version + 1, updatedAt: now };
      if (current) {
        const result = await ledgers.replaceOne({ _id: id, version }, record, { session });
        if (!result.matchedCount) throw new EarningsError("This record changed. Refresh before trying again.", 409);
      } else await ledgers.insertOne(record, { session });
      await events.insertOne({ _id: eventId, leadId: id, action, actor, createdAt: now, detail, requestHash, snapshot: record }, { session });
      return serialize(record);
    });
  } finally { await session.endSession(); }
}
