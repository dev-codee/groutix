import { createHash, randomUUID } from "node:crypto";
import { ObjectId, type ClientSession } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { listTechnicians } from "@/lib/technicians";
import type { Lead } from "@/components/admin/types";
import { EarningsError, validateEarningsTotal, calculateEarnings, applyDailyEarningsCaps, earningsBody, earningsCompletionDate, earningsId, earningsInteger, earningsJob, earningsText, invoiceForEarnings, parseEarningsShares, sameEarningsInvoice, sumInvoiceShares, type EarningsData, type EarningsExpense, type EarningsLedger, type EarningsMember, type EarningsPayment, type EarningsEvent, type EarningsSourceLead } from "./teamEarnings";
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
    maxTeamShareBps: Number.isSafeInteger(saved.maxTeamShareBps) && saved.maxTeamShareBps >= 1 && saved.maxTeamShareBps <= 10000 ? saved.maxTeamShareBps : defaultTeamEarningsSettings.maxTeamShareBps,
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
  return { ...doc, earningsInvoices: invoices.map(invoice => ({ ...invoice.values, earningsKey: String(invoice._id) })), id, createdAt: String(doc.createdAt || ""), bookings: visits.map(b => ({ ...b, bookingId: b.bookingId || b._id.toString() })) } as unknown as EarningsSourceLead;
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
    const lead = { ...doc, earningsInvoices: (invoicesByLead.get(id) || []).map(invoice => ({ ...invoice.values, earningsKey: String(invoice._id) })), id, createdAt: String(doc.createdAt || ""), bookings: (byLead.get(id) || []).map(b => ({ ...b, bookingId: b.bookingId || b._id.toString() })) } as unknown as EarningsSourceLead;
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
      const ownApprovedCents = job.ledger?.status === "approved" ? job.ledger.shares.find(share => share.memberId === memberId)?.earnedCents || 0 : 0;
      return capCents === undefined ? [] : [{ memberId, capCents, usedCents: Math.max(0, (used?.get(memberId) || 0) - ownApprovedCents) }];
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
function poolForShares(value: unknown, shares: EarningsLedger["shares"], maxTeamShareBps: number): number | undefined {
  if (value === undefined) return undefined;
  const poolBps = earningsInteger(value, "team share pool", 1, maxTeamShareBps);
  if (shares.some(share => share.fixedAmountCents !== undefined) || shares.reduce((sum, share) => sum + share.rateBps, 0) !== poolBps) {
    throw new EarningsError("The team pool must equal the selected members' combined percentage shares.");
  }
  return poolBps;
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
      const stored = await expenses.findOne({ _id: id }, { session });
      let current = stored ? { ...stored, items: stored.items.map(expense => ({ ...expense })) } : null;
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
export async function recordMemberEarningsPayment(value: unknown, actor: string) {
  const body = earningsBody(value);
  const requestId = earningsId(body.requestId);
  const memberId = earningsText(body.memberId, "Member", 100, true);
  const date = validMoneyDate(body.date, "Payment date");
  const method = earningsText(body.method, "Payment method", 30, true);
  if (!["Bank transfer", "Cash", "Other"].includes(method)) throw new EarningsError("Choose a payment method.");
  const reference = earningsText(body.reference, "Payment reference", 160, true);
  const note = earningsText(body.note, "Payment note", 500);
  if (!Array.isArray(body.entries) || !body.entries.length || body.entries.length > 100) throw new EarningsError("Choose between 1 and 100 approved invoice balances.");
  const seen = new Set<string>();
  const entries = body.entries.map(value => {
    const entry = earningsBody(value);
    const jobId = validateLeadId(earningsText(entry.jobId, "Job", 24, true));
    const invoiceKey = entry.invoiceKey === undefined ? undefined : earningsText(entry.invoiceKey, "Invoice", 160, true);
    const key = `${jobId}:${invoiceKey || "legacy"}`;
    if (seen.has(key)) throw new EarningsError("Choose each invoice once.");
    seen.add(key);
    return { jobId, invoiceKey, version: earningsInteger(entry.version, "version"), amountCents: earningsInteger(entry.amountCents, "payment amount", 1) };
  });
  const totalCents = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
  if (!Number.isSafeInteger(totalCents)) throw new EarningsError("Payment total is too large.");
  const requestHash = createHash("sha256").update(JSON.stringify({ memberId, date, method, reference, note, entries })).digest("hex");
  const { ledgers, payments, events } = await collections();
  const session = (await getMongoClient()).startSession();
  try {
    return await session.withTransaction(async () => {
      const jobIds = [...new Set(entries.map(entry => entry.jobId))];
      const prior = await events.findOne({ _id: `${jobIds[0]}:${requestId}` }, { session });
      if (prior) {
        if (prior.requestHash !== requestHash) throw new EarningsError("This payment request was already used with different details.", 409);
        return { amountCents: totalCents, paymentsCount: entries.length };
      }
      const now = new Date().toISOString();
      for (const jobId of jobIds) {
        const current = await ledgers.findOne({ _id: jobId }, { session });
        const jobEntries = entries.filter(entry => entry.jobId === jobId);
        if (!current || current.status !== "approved" || jobEntries.some(entry => entry.version !== current.version)) throw new EarningsError("An earnings balance changed. Refresh and review before recording payment.", 409);
        const lead = await sourceLead(jobId, session);
        if (!lead || earningsJob(lead, [], serialize(current)).changed) throw new EarningsError("An invoice or job changed after approval. Review it before recording payment.", 409);
        const record: LedgerDoc = { ...current, shares: current.shares.map(share => ({ ...share })), invoiceShares: current.invoiceShares?.map(allocation => ({ ...allocation, shares: allocation.shares.map(share => ({ ...share })) })) };
        for (const entry of jobEntries) {
          const allocation = record.invoiceShares?.find(item => item.invoiceKey === entry.invoiceKey);
          if (!!record.invoiceShares?.length !== !!entry.invoiceKey || (entry.invoiceKey && !allocation)) throw new EarningsError("Select a valid approved invoice balance.", 409);
          const share = (allocation?.shares || record.shares).find(item => item.memberId === memberId);
          if (!share || share.earnedCents - share.paidCents !== entry.amountCents) throw new EarningsError("A member balance changed. Refresh and review before recording payment.", 409);
          const invoiceNumber = entry.invoiceKey ? (record.invoice?.items || (record.invoice ? [{ ...record.invoice, key: "primary" }] : [])).find(item => item.key === entry.invoiceKey)?.number : undefined;
          await payments.insertOne({ _id: randomUUID(), leadId: jobId, ...(entry.invoiceKey ? { invoiceKey: entry.invoiceKey, invoiceNumber } : {}), memberId, memberName: share.name, amountCents: entry.amountCents, date, method, reference, note, actor, createdAt: now }, { session });
          share.paidCents += entry.amountCents;
          if (allocation) record.shares.find(item => item.memberId === memberId)!.paidCents += entry.amountCents;
        }
        record.version = current.version + 1;
        record.updatedAt = now;
        const result = await ledgers.replaceOne({ _id: jobId, version: current.version }, record, { session });
        if (!result.matchedCount) throw new EarningsError("An earnings balance changed. Refresh and review before recording payment.", 409);
        const paid = jobEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
        await events.insertOne({ _id: `${jobId}:${requestId}`, leadId: jobId, action: "pay", actor, createdAt: now, detail: `Recorded AUD ${(paid / 100).toFixed(2)} to ${record.shares.find(share => share.memberId === memberId)?.name || memberId} across ${jobEntries.length} invoice balance${jobEntries.length === 1 ? "" : "s"}; reference ${reference}. ${note}`, requestHash, snapshot: record }, { session });
      }
      return { amountCents: totalCents, paymentsCount: entries.length };
    });
  } finally { await session.endSession(); }
}
export async function mutateTeamEarnings(id: string, value: unknown, actor: string) {
  id = validateLeadId(id);
  const body = earningsBody(value), requestId = earningsId(body.requestId);
  const version = earningsInteger(body.version, "version");
  const action = earningsText(body.action, "Action", 30, true);
  if (!["save", "approve", "upsert_invoice", "reopen", "pay", "void_payment"].includes(action)) throw new EarningsError("Invalid earnings action.");
  const requestHash = createHash("sha256").update(JSON.stringify({ id, body })).digest("hex");
  const { db, ledgers, payments, events, dailyCaps } = await collections();
  const roster = ["save", "upsert_invoice"].includes(action) ? await listEarningsMembers() : [];
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
      let record: LedgerDoc = current ? { ...current, shares: current.shares.map(s => ({ ...s })), invoiceShares: current.invoiceShares?.map(allocation => ({ ...allocation, shares: allocation.shares.map(share => ({ ...share })) })) } : { _id: id, version: 0, status: "draft", basis: "ex_gst", shares: [], invoice: null, notes: "", updatedAt: now, jobLabel: lead?.jobNo || `Lead-${id.slice(-6)}`, customer: lead?.name || "Customer" };
      const settingsDoc = ["save", "approve", "upsert_invoice"].includes(action) ? await db.collection("settings").findOne({ _id: "team-earnings" } as never, { session }) : null;
      const maxTeamShareBps = Number.isSafeInteger(settingsDoc?.maxTeamShareBps) && settingsDoc!.maxTeamShareBps >= 1 && settingsDoc!.maxTeamShareBps <= 10000 ? settingsDoc!.maxTeamShareBps : defaultTeamEarningsSettings.maxTeamShareBps;
      let detail = "";
      if (action === "save") {
        if (record.status === "approved") throw new EarningsError("Reopen the approval before changing shares.", 409);
        if (body.basis !== "ex_gst" && body.basis !== "inclusive") throw new EarningsError("Choose an invoice basis.");
        record.basis = body.basis;
        const draftInvoice = invoiceForEarnings(lead!, record.basis, Number.isSafeInteger(settingsDoc?.gstRateBps) ? settingsDoc!.gstRateBps : defaultTeamEarningsSettings.gstRateBps);
        const invoiceKey = typeof body.invoiceKey === "string" ? body.invoiceKey : "";
        if (invoiceKey) {
          const item = (draftInvoice?.items || (draftInvoice ? [{ ...draftInvoice, key: "primary" }] : [])).find(invoice => invoice.key === invoiceKey);
          if (!item) throw new EarningsError("Choose a saved invoice before setting its shares.", 409);
          const shares = parseEarningsShares(body.shares, roster, record.invoiceShares?.find(allocation => allocation.invoiceKey === invoiceKey)?.shares, maxTeamShareBps);
          const poolBps = poolForShares(body.poolBps, shares, maxTeamShareBps);
          validateEarningsTotal(shares, item.baseCents, maxTeamShareBps);
          record.invoiceShares = [...(record.invoiceShares || []).filter(allocation => allocation.invoiceKey !== invoiceKey), { invoiceKey, shares, ...(poolBps === undefined ? {} : { poolBps }) }];
          record.shares = sumInvoiceShares(record.invoiceShares);
          delete record.poolBps;
        } else {
          if (record.invoiceShares?.length) throw new EarningsError("Choose an invoice to change its shares.", 409);
          record.shares = parseEarningsShares(body.shares, roster, current?.shares, maxTeamShareBps);
          record.poolBps = poolForShares(body.poolBps, record.shares, maxTeamShareBps);
          if (draftInvoice) validateEarningsTotal(record.shares, draftInvoice.baseCents, maxTeamShareBps);
        }
        record.notes = earningsText(body.notes, "Notes", 2000);
        record.invoice = null;
        detail = `Saved ${record.shares.length} shares, ${(record.shares.reduce((sum, s) => sum + s.rateBps, 0) / 100).toFixed(2)}% total plus AUD ${(record.shares.reduce((sum, s) => sum + (s.fixedAmountCents || 0), 0) / 100).toFixed(2)} fixed; basis ${record.basis}. ${record.notes}`;
      } else if (action === "upsert_invoice") {
        if (record.status !== "approved" || !record.invoiceShares?.length) throw new EarningsError("Save and approve invoice shares first.", 409);
        if (body.basis !== record.basis) throw new EarningsError("The invoice basis is fixed after approval. Reopen the job to change it.", 409);
        const invoiceKey = earningsText(body.invoiceKey, "Invoice", 160, true);
        const invoice = invoiceForEarnings(lead!, record.basis, Number.isSafeInteger(settingsDoc?.gstRateBps) ? settingsDoc!.gstRateBps : defaultTeamEarningsSettings.gstRateBps);
        const item = (invoice?.items || (invoice ? [{ ...invoice, key: "primary" }] : [])).find(candidate => candidate.key === invoiceKey);
        if (!invoice || !item || !sameEarningsInvoice(body.invoice as typeof invoice, invoice)) throw new EarningsError("The invoice changed. Refresh before approving.", 409);
        const previousItems = record.invoice?.items || (record.invoice ? [{ ...record.invoice, key: "primary" }] : []);
        for (const allocation of record.invoiceShares) {
          if (allocation.invoiceKey === invoiceKey) continue;
          const before = previousItems.find(candidate => candidate.key === allocation.invoiceKey);
          const after = (invoice.items || [{ ...invoice, key: "primary" }]).find(candidate => candidate.key === allocation.invoiceKey);
          if (!sameEarningsInvoice(before || null, after || null)) throw new EarningsError("Another allocated invoice changed. Review the existing approval first.", 409);
        }
        const existing = record.invoiceShares.find(allocation => allocation.invoiceKey === invoiceKey);
        if (existing?.shares.some(share => share.paidCents)) throw new EarningsError("Reverse this invoice's recorded payments before changing its shares.", 409);
        const job = earningsJob(lead!, [], serialize(record));
        if (!job.eligible) throw new EarningsError(job.unavailableReason, 409);
        const shares = parseEarningsShares(body.shares, roster, existing?.shares, maxTeamShareBps);
        const poolBps = poolForShares(body.poolBps, shares, maxTeamShareBps);
        validateEarningsTotal(shares, item.baseCents, maxTeamShareBps);
        const completionDate = job.completionDate;
        if (completionDate) await dailyCaps.updateOne({ _id: completionDate }, { $inc: { version: 1 } }, { upsert: true, session });
        const usedByMember = new Map<string, number>();
        const earlierApproved = completionDate ? await ledgers.find({ status: "approved" }, { session }).toArray() : [];
        for (const prior of earlierApproved) if (prior._id !== id && prior.completionDate === completionDate) for (const share of prior.shares) usedByMember.set(share.memberId, (usedByMember.get(share.memberId) || 0) + share.earnedCents);
        for (const allocation of record.invoiceShares) if (allocation.invoiceKey !== invoiceKey) for (const share of allocation.shares) usedByMember.set(share.memberId, (usedByMember.get(share.memberId) || 0) + share.earnedCents);
        const caps = Array.isArray(settingsDoc?.employeeSettings) ? settingsDoc.employeeSettings as TeamEarningsSettings["employeeSettings"] : [];
        const capUsage = caps.flatMap(setting => setting.dailyCapCents === null ? [] : [{ memberId: setting.memberId, capCents: setting.dailyCapCents, usedCents: usedByMember.get(setting.memberId) || 0 }]);
        const calculated = applyDailyEarningsCaps(calculateEarnings(shares, item.baseCents), capUsage);
        record.invoiceShares = [...record.invoiceShares.filter(allocation => allocation.invoiceKey !== invoiceKey), { invoiceKey, shares: calculated, ...(poolBps === undefined ? {} : { poolBps }) }];
        record.shares = sumInvoiceShares(record.invoiceShares);
        record.invoice = invoice;
        record.notes = earningsText(body.notes, "Notes", 2000);
        detail = `Approved shares for ${item.number}: ${calculated.map(share => `${share.name} AUD ${(share.earnedCents / 100).toFixed(2)}`).join(", ")}.`;
      } else if (action === "approve") {
        if (record.status !== "draft" || !record.shares.length) throw new EarningsError("Save draft shares before approving.", 409);
        const settings: TeamEarningsSettings = {
          ...defaultTeamEarningsSettings,
          ...(settingsDoc || {}),
          basis: settingsDoc?.basis === "inclusive" ? "inclusive" : "ex_gst",
          maxTeamShareBps,
          employeeSettings: Array.isArray(settingsDoc?.employeeSettings) ? settingsDoc.employeeSettings : [],
          automaticExpenses: Array.isArray(settingsDoc?.automaticExpenses) ? settingsDoc.automaticExpenses : [],
        };
        const job = earningsJob(lead!, [], serialize(record), settings);
        if (!job.eligible) throw new EarningsError(job.unavailableReason, 409);
        const invoice = invoiceForEarnings(lead!, record.basis, settings.gstRateBps)!;
        // Confirm the amount the manager reviewed; a stale UI cannot approve a
        // different invoice even if the earnings document itself did not change.
        if (!sameEarningsInvoice(body.invoice as typeof invoice, invoice)) throw new EarningsError("The invoice changed. Refresh before approving.", 409);
        if (record.invoiceShares?.length) {
          const items = invoice.items || [{ ...invoice, key: "primary" }];
          for (const allocation of record.invoiceShares) {
            const item = items.find(candidate => candidate.key === allocation.invoiceKey);
            if (!item) throw new EarningsError("An invoice with team shares changed or was removed. Refresh and review the shares.", 409);
            validateEarningsTotal(allocation.shares, item.baseCents, maxTeamShareBps);
          }
        } else validateEarningsTotal(record.shares, invoice.baseCents, maxTeamShareBps);
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
        if (record.invoiceShares?.length) {
          const used = new Map(capUsage.map(cap => [cap.memberId, cap.usedCents]));
          const items = invoice.items || [{ ...invoice, key: "primary" }];
          record.invoiceShares = record.invoiceShares.map(allocation => {
            const item = items.find(candidate => candidate.key === allocation.invoiceKey)!;
            const calculated = calculateEarnings(allocation.shares, item.baseCents);
            const capped = applyDailyEarningsCaps(calculated, capUsage.map(cap => ({ ...cap, usedCents: used.get(cap.memberId) || 0 })));
            for (const share of capped) used.set(share.memberId, (used.get(share.memberId) || 0) + share.earnedCents);
            return { ...allocation, shares: capped };
          });
          record.shares = sumInvoiceShares(record.invoiceShares);
        } else record.shares = applyDailyEarningsCaps(calculateEarnings(record.shares, invoice.baseCents), capUsage);
        record.status = "approved"; record.approvedAt = now; record.approvedBy = actor;
        detail = `Approved ${invoice.number}: base AUD ${(invoice.baseCents / 100).toFixed(2)}; ${record.shares.map(s => `${s.name} ${s.fixedAmountCents !== undefined ? "fixed amount" : `${s.rateBps / 100}%`} = AUD ${(s.earnedCents / 100).toFixed(2)}`).join(", ")}. Daily caps are applied across approved jobs for ${completionDate || "the completion date"}.`;
      } else if (action === "reopen") {
        if (record.status !== "approved") throw new EarningsError("Only approved earnings can be reopened.", 409);
        if (record.shares.some(s => s.paidCents !== 0)) throw new EarningsError("Reverse recorded payments before reopening earnings.", 409);
        detail = earningsText(body.reason, "Reason for reopening", 500, true);
        record.status = "draft"; record.invoice = null; delete record.completionDate;
        record.shares = record.shares.map(s => ({ ...s, earnedCents: 0, paidCents: 0 }));
        record.invoiceShares = record.invoiceShares?.map(allocation => ({ ...allocation, shares: allocation.shares.map(share => ({ ...share, earnedCents: 0, paidCents: 0 })) }));
        delete record.approvedAt; delete record.approvedBy;
      } else if (action === "pay") {
        if (record.status !== "approved") throw new EarningsError("Approve earnings before recording payment.", 409);
        if (earningsJob(lead!, [], serialize(record)).changed) throw new EarningsError("The invoice or work status changed after approval. Review and reopen the earnings first.", 409);
        const invoiceKey = record.invoiceShares?.length ? earningsText(body.invoiceKey, "Invoice", 160, true) : undefined;
        const allocation = record.invoiceShares?.find(item => item.invoiceKey === invoiceKey);
        if (record.invoiceShares?.length && !allocation) throw new EarningsError("Choose an invoice with approved shares.", 409);
        const share = (allocation?.shares || record.shares).find(s => s.memberId === body.memberId);
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
        const invoiceNumber = invoiceKey ? (record.invoice?.items || (record.invoice ? [{ ...record.invoice, key: "primary" }] : [])).find(item => item.key === invoiceKey)?.number : undefined;
        await payments.insertOne({ _id: requestId, leadId: id, ...(invoiceKey ? { invoiceKey, invoiceNumber } : {}), memberId: share.memberId, memberName: share.name, amountCents, date, method, reference, note, actor, createdAt: now }, { session });
        share.paidCents += amountCents;
        if (allocation) record.shares.find(s => s.memberId === share.memberId)!.paidCents += amountCents;
        detail = `${share.name}: recorded AUD ${(amountCents / 100).toFixed(2)} via ${method} on ${date}; reference ${reference}. ${note}`;
      } else {
        const paymentId = earningsId(body.paymentId);
        const payment = await payments.findOne({ _id: paymentId, leadId: id }, { session });
        if (!payment || payment.voidedAt) throw new EarningsError("Payment is missing or already reversed.", 409);
        const reason = earningsText(body.reason, "Reversal reason", 500, true);
        const allocation = record.invoiceShares?.find(item => item.invoiceKey === payment.invoiceKey);
        const share = (allocation?.shares || record.shares).find(s => s.memberId === payment.memberId);
        if (!share || share.paidCents < payment.amountCents) throw new EarningsError("Payment balance needs review.", 409);
        await payments.updateOne({ _id: paymentId, leadId: id }, { $set: { voidedAt: now, voidedBy: actor, voidReason: reason } }, { session });
        share.paidCents -= payment.amountCents;
        if (allocation) record.shares.find(s => s.memberId === share.memberId)!.paidCents -= payment.amountCents;
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
