import { createHash } from "node:crypto";
import { ObjectId, type ClientSession } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { listTechnicians } from "@/lib/technicians";
import type { Lead } from "@/components/admin/types";
import { EarningsError, calculateEarnings, earningsBody, earningsId, earningsInteger, earningsJob, earningsText, invoiceForEarnings, parseEarningsShares, sameEarningsInvoice, type EarningsData, type EarningsLedger, type EarningsMember, type EarningsPayment, type EarningsEvent } from "./teamEarnings";

type LedgerDoc = Omit<EarningsLedger, "id"> & { _id: string };
type PaymentDoc = Omit<EarningsPayment, "id"> & { _id: string; leadId: string };
type EventDoc = Omit<EarningsEvent, "id"> & { _id: string; leadId: string; requestHash: string; snapshot: LedgerDoc };
const leadProjection = { name: 1, jobNo: 1, service: 1, status: 1, type: 1, createdAt: 1, assigned: 1, technician: 1, technicianId: 1, technicianUsername: 1, inspectorId: 1, inspectorUsername: 1, jobAt: 1, inspectionAt: 1, jobTotalDays: 1, jobDaysDone: 1, invoiceAmount: 1, invoiceNumber: 1, "invoiceDraft.gst": 1, invoiceStatus: 1, paymentType: 1 };
let indexes: Promise<unknown> | undefined;
async function collections() {
  const db = await getDb();
  const ledgers = db.collection<LedgerDoc>("team_earnings");
  const payments = db.collection<PaymentDoc>("team_earnings_payments");
  const events = db.collection<EventDoc>("team_earnings_events");
  indexes ??= Promise.all([payments.createIndex({ leadId: 1, createdAt: -1 }), events.createIndex({ leadId: 1, "snapshot.version": -1 })]).catch(e => { indexes = undefined; throw e; });
  await indexes;
  return { db, ledgers, payments, events };
}
function serialize(doc: LedgerDoc): EarningsLedger { const { _id, ...rest } = doc; return { ...rest, id: _id }; }
function validateLeadId(id: string) { if (!/^[0-9a-f]{24}$/i.test(id)) throw new EarningsError("Invalid lead ID."); return id.toLowerCase(); }
async function members(): Promise<EarningsMember[]> {
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
async function sourceLead(id: string, session?: ClientSession): Promise<Lead | null> {
  const db = await getDb();
  const doc = await db.collection("submissions").findOne({ _id: new ObjectId(id) }, { projection: leadProjection, session });
  if (!doc) return null;
  const visits = await db.collection("bookings").find({ leadId: id }, { session }).toArray();
  return { ...doc, id, createdAt: String(doc.createdAt || ""), bookings: visits.map(b => ({ ...b, bookingId: b.bookingId || b._id.toString() })) } as unknown as Lead;
}
function missingLead(ledger: EarningsLedger): Lead {
  return { id: ledger.id, status: "Source unavailable", createdAt: "", name: ledger.customer, jobNo: ledger.jobLabel };
}
export async function listTeamEarnings(): Promise<EarningsData> {
  const { db, ledgers } = await collections();
  const [roster, docs, sources, visits] = await Promise.all([members(), ledgers.find({}).toArray(), db.collection("submissions").find({}, { projection: leadProjection }).toArray(), db.collection("bookings").find({}).toArray()]);
  const byLead = new Map<string, typeof visits>();
  for (const visit of visits) { const rows = byLead.get(visit.leadId) || []; rows.push(visit); byLead.set(visit.leadId, rows); }
  const records = new Map(docs.map(doc => [doc._id, serialize(doc)]));
  const jobs = sources.filter(doc => doc.type !== "support_ticket").map(doc => {
    const id = doc._id.toString();
    const lead = { ...doc, id, createdAt: String(doc.createdAt || ""), bookings: (byLead.get(id) || []).map(b => ({ ...b, bookingId: b.bookingId || b._id.toString() })) } as unknown as Lead;
    return earningsJob(lead, roster, records.get(id) || null);
  });
  const present = new Set(jobs.map(job => job.id));
  for (const ledger of records.values()) if (!present.has(ledger.id)) jobs.push(earningsJob(missingLead(ledger), roster, ledger));
  // Removed members stay identifiable in financial history and summaries.
  for (const ledger of records.values()) for (const share of ledger.shares) if (!roster.some(m => m.id === share.memberId)) roster.push({ id: share.memberId, name: share.name, role: "former member", active: false, aliases: [] });
  return { members: roster, jobs };
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
  const { ledgers, payments, events } = await collections();
  const roster = action === "save" ? await members() : [];
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
        record.notes = earningsText(body.notes, "Notes", 2000);
        record.invoice = null;
        detail = `Saved ${record.shares.length} shares, ${(record.shares.reduce((sum, s) => sum + s.rateBps, 0) / 100).toFixed(2)}% total; basis ${record.basis}. ${record.notes}`;
      } else if (action === "approve") {
        if (record.status !== "draft" || !record.shares.length) throw new EarningsError("Save draft shares before approving.", 409);
        const job = earningsJob(lead!, [], serialize(record));
        if (!job.eligible) throw new EarningsError(job.unavailableReason, 409);
        const invoice = invoiceForEarnings(lead!, record.basis)!;
        // Confirm the amount the manager reviewed; a stale UI cannot approve a
        // different invoice even if the earnings document itself did not change.
        if (!sameEarningsInvoice(body.invoice as typeof invoice, invoice)) throw new EarningsError("The invoice changed. Refresh before approving.", 409);
        record.invoice = invoice; record.shares = calculateEarnings(record.shares, invoice.baseCents);
        record.status = "approved"; record.approvedAt = now; record.approvedBy = actor;
        detail = `Approved ${invoice.number}: base AUD ${(invoice.baseCents / 100).toFixed(2)}; ${record.shares.map(s => `${s.name} ${s.rateBps / 100}% = AUD ${(s.earnedCents / 100).toFixed(2)}`).join(", ")}.`;
      } else if (action === "reopen") {
        if (record.status !== "approved") throw new EarningsError("Only approved earnings can be reopened.", 409);
        if (record.shares.some(s => s.paidCents !== 0)) throw new EarningsError("Reverse recorded payments before reopening earnings.", 409);
        detail = earningsText(body.reason, "Reason for reopening", 500, true);
        record.status = "draft"; record.invoice = null;
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
