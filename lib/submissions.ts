// Data-access layer for form submissions (quotes + support tickets).
//
// Everything the admin panel reads and everything the public forms write goes
// through here. Writes are deliberately best-effort: recordSubmission swallows
// errors and returns null so a Mongo outage can never break a lead's email
// flow. Reads are only ever called from authenticated admin routes.

import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getActiveUsersByRole } from "@/lib/users";
import type { InspectionReportDoc } from "@/lib/inspection";
import { normalizeApptString } from "@/lib/scheduling";

/**
 * Force `inspectionAt` / `jobAt` in a submission patch to the canonical naive
 * Melbourne wall-clock before it ever reaches the database. Every write to a
 * submission goes through here, so no future caller can persist a timezone-shifted
 * appointment (e.g. via `new Date(...).toISOString()`). See normalizeApptString.
 */
function normalizeApptFields<T extends { inspectionAt?: unknown; jobAt?: unknown }>(patch: T): T {
  for (const key of ["inspectionAt", "jobAt"] as const) {
    if (typeof patch[key] === "string") {
      (patch as Record<string, unknown>)[key] = normalizeApptString(patch[key] as string);
    }
  }
  return patch;
}

export type SubmissionType = "quote" | "support_ticket" | "lead";
export type SubmissionStatus = string;

export type TranscriptMessage = { role: "user" | "assistant"; content: string };

export interface TenantDoc {
  name: string;
  phone: string;
  email?: string;
}

export interface QuoteItem {
  templateNo?: string | number;
  code?: string;
  service?: string;
  scope?: string;
  description?: string;
  price?: number;
  qty?: number;
}

export interface CustomerMessage {
  id: string;
  from: "customer" | "groutix";
  channel?: "email" | "sms" | "lead" | "internal";
  subject?: string;
  text: string;
  time: string;
  initial?: boolean;
  read?: boolean;
  // Files attached to the message. For outbound mail we keep metadata only
  // (the bytes are forwarded to the customer at send time). For inbound customer
  // emails we upload the file to Cloudinary and keep a link so staff can open it
  // straight from the dashboard.
  attachments?: {
    name: string;
    contentType?: string;
    size?: number;
    url?: string;
    secureUrl?: string;
    publicId?: string;
  }[];
}

export interface GpsCheckin {
  lat: number;
  lng: number;
  accuracy?: number;
  time: string;
}

export interface WarrantyDoc {
  jobNo?: string;
  warrantyNo?: string;
  completionDate?: string;
  expiryDate?: string;
  customerName?: string;
  address?: string;
  authorisedBy?: string;
  dateIssued?: string;
  sentAt?: string;
  provided?: boolean;
}

// A single entry in a lead's audit trail. `actor` is the staff username, or
// "system" for automatic steps (assignment, follow-ups, timestamps).
export interface ActivityEntry {
  time: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface SubmissionPhoto {
  name: string;
  contentType?: string;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  size?: number;
  added?: string;
  uploadedBy?: string;
}

export interface SubmissionDoc {
  _id?: ObjectId;
  type: SubmissionType;
  status: SubmissionStatus;
  previousStatus?: string;
  jobNo?: string;
  createdAt: Date;
  // Contact / lead fields (subset present depends on type).
  customerType?: string;
  agency?: string;
  tenants?: TenantDoc[];
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  enquiry?: string;
  service?: string;
  damagedTiles?: string;
  leaking?: string;
  message?: string;
  areas?: string;
  heard?: string;
  sourcePage?: string;
  source?: string;
  issue?: string;
  assigned?: string;
  // Field technician (from the technicians roster) dispatched to physically do
  // the inspection/job. Separate from `assigned`, which is the CRM staffer who
  // owns the lead. `technician` is the display name; `technicianId` links to the
  // technicians collection so we can notify them by email.
  technician?: string;
  technicianId?: string;
  technicianUsername?: string;
  priority?: string;
  received?: string;
  contacted?: string;
  follow?: string;
  notes?: string;
  technicianNotes?: string;
  scopeNotes?: string;
  // Quote / Invoice / Workflow fields
  quoteItems?: QuoteItem[];
  quoteItemCode?: string;
  quoteScope?: string;
  quoteTaxMode?: "inclusive" | "exclusive" | "none";
  quoteTaxRate?: number;
  quoteTerms?: string;
  quoteUpdated?: string;
  quoteAmount?: number;
  // Media / Communications
  transcript?: TranscriptMessage[];
  photosCount?: number;
  photos?: SubmissionPhoto[];
  messages?: CustomerMessage[];
  gps?: GpsCheckin | null;
  /** Revokes an earlier customer tracking link when the visit leaves en route. */
  customerTrackingEndedAt?: Date;
  warranty?: WarrantyDoc;
  warrantyProvided?: boolean;
  activity?: ActivityEntry[];
  quoteNumber?: string;
  quoteAcceptedAt?: string; // ISO time the customer accepted the quote online
  quoteDeclinedAt?: string; // ISO time the customer declined the quote online
  quoteSignature?: string; // Base64 data URL of the customer's signature
  quoteSignedName?: string; // Name entered/confirmed on signature
  quoteSignedAt?: string; // ISO time the signature was captured
  quoteSignedIp?: string; // IP address of the signer
  invoiceNumber?: string;
  invoiceSentAt?: string; // ISO time the invoice was emailed to the customer
  invoiceOpenedAt?: string; // ISO time the customer first opened the invoice email
  invoiceStatus?: string; // "Paid" | "Unpaid"
  // QuickBooks Online sync outcome for the emailed invoice. The push is
  // fire-and-forget, so these are the only record of whether it landed.
  qboInvoiceId?: string; // QBO Invoice Id once the push succeeded
  qboSyncedAt?: string; // ISO time the invoice reached QBO
  qboError?: string; // Last push failure message ("" once a retry succeeds)
  qboErrorAt?: string; // ISO time of that failure
  followUpStage?: number; // 0 = none, 1..3 = follow-up sent, 4 = no response
  followUpNext?: string; // ISO time the next follow-up is due
  // Scheduling — the booked date/time for the free inspection and the job. Set
  // by staff today (and by the public booking flow in Phase E). Drive the 24h
  // reminder cron; the *ReminderSent flags stop duplicate reminders.
  inspectionAt?: string; // ISO datetime of the booked inspection
  jobAt?: string; // ISO datetime of the booked job
  inspectionReminderSent?: boolean; // 24h-before reminder
  jobReminderSent?: boolean; // 24h-before reminder
  inspectionReminder1hSent?: boolean; // 1h-before reminder
  jobReminder1hSent?: boolean; // 1h-before reminder
  inspectionRescheduled?: boolean; // true once the inspection has been moved from its original time
  inspectionReport?: InspectionReportDoc;
  // Request metadata.
  ip?: string;
  userAgent?: string;
  emailDelivered?: boolean;
}

// Serialised shape sent to the browser (ObjectId -> string, Date -> ISO).
export type SubmissionJSON = Omit<SubmissionDoc, "_id" | "createdAt"> & {
  id: string;
  createdAt: string;
};

export interface TaskDoc {
  _id?: ObjectId;
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
}

let indexesEnsured = false;

async function collection(): Promise<Collection<SubmissionDoc>> {
  const db = await getDb();
  const col = db.collection<SubmissionDoc>("submissions");
  if (!indexesEnsured) {
    try {
      await col.createIndexes([
        { key: { createdAt: -1 } },
        { key: { type: 1, createdAt: -1 } },
        { key: { status: 1 } },
      ]);
      indexesEnsured = true;
    } catch (err) {
      console.error("ensure submission indexes failed (non-fatal):", err);
    }
  }
  return col;
}

async function taskCollection(): Promise<Collection<TaskDoc>> {
  const db = await getDb();
  return db.collection<TaskDoc>("crm_tasks");
}

// ── Recycle Bin ────────────────────────────────────────────────────────────────

export interface RecycleBinDoc extends SubmissionDoc {
  deletedAt: Date;
  deletedBy?: string;
  /** The original status the lead had before it was deleted. */
  originalStatus?: string;
}

export type RecycleBinJSON = Omit<RecycleBinDoc, "_id" | "createdAt" | "deletedAt"> & {
  id: string;
  createdAt: string;
  deletedAt: string;
};

function recycleBinToJSON(doc: RecycleBinDoc): RecycleBinJSON {
  const { _id, createdAt, deletedAt, ...rest } = doc;
  return {
    ...rest,
    id: _id ? _id.toString() : "",
    createdAt: (createdAt instanceof Date ? createdAt : new Date(createdAt)).toISOString(),
    deletedAt: (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)).toISOString(),
  };
}

async function recycleBinCollection(): Promise<Collection<RecycleBinDoc>> {
  const db = await getDb();
  return db.collection<RecycleBinDoc>("recycle_bin");
}

/**
 * Atomically increment and return a named counter (e.g. "quote", "warranty").
 * Used to mint sequential, human-friendly document numbers.
 */
export async function getNextSequence(name: string): Promise<number> {
  const db = await getDb();
  const col = db.collection<{ _id: string; seq: number }>("counters");
  const res = await col.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return res?.seq ?? 1;
}

/** Format a sequential number as a padded, prefixed document number. */
export function formatDocNumber(prefix: string, seq: number): string {
  const yy = new Date().getFullYear().toString().slice(-2);
  return `${prefix}-${yy}-${String(seq).padStart(4, "0")}`;
}

export const JOB_NO_START = 1201;
export const JOB_NO_PREFIX = "JOBNO-";

/**
 * Atomically increment and return the next sequential Job Number (e.g. "JOBNO-1201", "JOBNO-1202").
 * Sequence starts at 1201 and only increments for new incoming leads.
 */
export async function getNextJobNo(): Promise<string> {
  const db = await getDb();
  const col = db.collection<{ _id: string; seq: number }>("counters");
  await col.updateOne(
    { _id: "jobNo" },
    { $setOnInsert: { seq: JOB_NO_START - 1 } },
    { upsert: true }
  );
  const res = await col.findOneAndUpdate(
    { _id: "jobNo" },
    { $inc: { seq: 1 } },
    { returnDocument: "after" }
  );
  const seq = res?.seq ?? JOB_NO_START;
  return `${JOB_NO_PREFIX}${seq}`;
}

/**
 * Persist a submission. Never throws - logs and returns null on failure so the
 * caller (a public form route) can carry on delivering the email.
 */
export async function recordSubmission(
  doc: Omit<SubmissionDoc, "_id" | "createdAt" | "status"> & { status?: SubmissionStatus }
): Promise<string | null> {
  if (!isMongoConfigured()) return null;
  try {
    const col = await collection();
    const isLeadOrQuote = !doc.type || doc.type === "quote" || doc.type === "lead";
    const jobNo = doc.jobNo || (isLeadOrQuote ? await getNextJobNo() : undefined);
    const res = await col.insertOne(normalizeApptFields({
      ...doc,
      jobNo,
      status: doc.status ?? "New",
      createdAt: new Date(),
    }));
    return res.insertedId.toString();
  } catch (err) {
    console.error("recordSubmission failed (non-fatal):", err);
    return null;
  }
}

export async function createLead(
  doc: Partial<SubmissionDoc>
): Promise<SubmissionJSON | null> {
  if (!isMongoConfigured()) return null;
  try {
    const col = await collection();
    const now = new Date();
    // New leads land Unassigned on purpose: they stay in the manager's
    // Unassigned box until someone picks them up. Only an explicit assignee
    // passed in by the caller is honoured.
    const assigned = doc.assigned || "";
    const jobNo = doc.jobNo || (await getNextJobNo());
    const fullDoc: SubmissionDoc = {
      type: (doc.type as SubmissionType) || "lead",
      status: doc.status || "New",
      jobNo,
      createdAt: now,
      name: doc.name || "",
      phone: doc.phone || "",
      email: doc.email || "",
      service: doc.service || "",
      address: doc.address || "",
      assigned,
      priority: doc.priority || "Medium",
      received: doc.received || now.toISOString(),
      contacted: doc.contacted || "",
      follow: doc.follow || "",
      source: doc.source || "Manual Entry",
      notes: doc.notes || "",
      quoteItems: doc.quoteItems || [],
      quoteTaxMode: doc.quoteTaxMode || "exclusive",
      quoteTaxRate: doc.quoteTaxRate ?? 10,
      quoteTerms: doc.quoteTerms || "",
      photos: doc.photos || [],
      messages: doc.messages || [],
      gps: doc.gps || null,
      warranty: doc.warranty,
      activity: doc.activity || [
        { time: now.toISOString(), actor: "system", action: "Lead created", detail: doc.source || "Manual Entry" },
        ...(assigned
          ? [{ time: now.toISOString(), actor: "system", action: "Assigned", detail: assigned }]
          : []),
      ],
    };
    const res = await col.insertOne(fullDoc);
    return toJSON({ ...fullDoc, _id: res.insertedId });
  } catch (err) {
    console.error("createLead failed:", err);
    return null;
  }
}

// ── Auto-assignment (round-robin, least-loaded) ──────────────────────────────

// Stages that no longer need attention, so they don't count toward workload.
const CLOSED_STATUSES = ["Lost", "Payment Received", "Warranty Sent", "Completed"];

/**
 * Pick the active intake staffer with the fewest open leads. Falls back to
 * "Unassigned" when no intake accounts exist yet.
 */
export async function pickAssignee(): Promise<string> {
  return pickAssigneeForRole("intake");
}

/**
 * Pick the active staffer of a given role with the fewest open leads. Used for
 * auto-handoff (e.g. reassign to Finance when a job is marked done). Falls back
 * to "Unassigned" when no accounts of that role exist yet.
 */
export async function pickAssigneeForRole(
  role: import("@/lib/roles").Role
): Promise<string> {
  try {
    const staff = await getActiveUsersByRole(role);
    if (staff.length === 0) return "Unassigned";
    const names = staff.map((u) => u.name);
    const col = await collection();
    const rows = await col
      .aggregate<{ _id: string; count: number }>([
        { $match: { assigned: { $in: names }, status: { $nin: CLOSED_STATUSES } } },
        { $group: { _id: "$assigned", count: { $sum: 1 } } },
      ])
      .toArray();
    const load = new Map(rows.map((r) => [r._id, r.count]));
    let best = names[0];
    let bestLoad = Infinity;
    for (const name of names) {
      const c = load.get(name) ?? 0;
      if (c < bestLoad) {
        bestLoad = c;
        best = name;
      }
    }
    return best;
  } catch (err) {
    console.error("pickAssignee failed:", err);
    return "Unassigned";
  }
}

/**
 * Hand a freshly booked inspection to the inspection team.
 *
 * Without this the lead keeps whatever assignee it had — usually none, since new
 * leads are created with `assigned: ""` — and the inspection dashboard only shows
 * leads assigned to the signed-in inspector. A customer self-booking would create
 * an appointment its own inspector could never see.
 *
 * Booking an inspection moves the lead into a stage the inspection role owns (see
 * lib/pipeline.ts), so this is a stage handoff, the same shape as reassigning to
 * Finance when a job is marked done. It therefore takes over an assignee from
 * another team — but never from someone already on the inspection team, because
 * that was a deliberate choice about WHICH inspector goes.
 *
 * Returns the name assigned, or null when nothing changed. Best-effort: a booking
 * must never fail because assignment did.
 */
export async function assignInspectorOnBooking(
  id: string,
  currentAssigned?: string | null
): Promise<string | null> {
  try {
    const inspectors = await getActiveUsersByRole("inspection");
    if (inspectors.length === 0) return null;

    // Already with an inspector? Leave their choice alone.
    const held = (currentAssigned || "").trim().toLowerCase();
    if (held && held !== "unassigned") {
      const alreadyInspection = inspectors.some(
        (u) => u.name.trim().toLowerCase() === held || u.username.trim().toLowerCase() === held
      );
      if (alreadyInspection) return null;
    }

    const name = await pickAssigneeForRole("inspection");
    if (!name || name === "Unassigned") return null;
    if (name.trim().toLowerCase() === held) return null;

    await updateSubmission(id, { assigned: name });
    await appendActivity(id, {
      time: new Date().toISOString(),
      actor: "system",
      action: "Inspection assigned",
      detail: `Auto-assigned to ${name} when the inspection was booked.`,
    });
    return name;
  } catch (err) {
    console.error("assignInspectorOnBooking failed (non-fatal):", err);
    return null;
  }
}

/** Append one entry to a lead's audit trail. Best-effort; never throws. */
export async function appendActivity(id: string, entry: ActivityEntry): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  try {
    const col = await collection();
    await col.updateOne({ _id: new ObjectId(id) }, { $push: { activity: entry } });
  } catch (err) {
    console.error("appendActivity failed (non-fatal):", err);
  }
}

export function toJSON(doc: SubmissionDoc): SubmissionJSON {
  const { _id, createdAt, ...rest } = doc;
  return {
    ...rest,
    id: _id ? _id.toString() : "",
    createdAt: (createdAt instanceof Date ? createdAt : new Date(createdAt)).toISOString(),
  };
}

export interface ListParams {
  type?: SubmissionType;
  status?: SubmissionStatus;
  priority?: string;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Parse admin list/export filters from a URL query string. */
export function parseListParams(sp: URLSearchParams): ListParams {
  const type = sp.get("type");
  const status = sp.get("status");
  const priority = sp.get("priority");
  const from = sp.get("from");
  const to = sp.get("to");
  const params: ListParams = {};
  if (type === "quote" || type === "support_ticket" || type === "lead") params.type = type;
  if (status) params.status = status;
  if (priority) params.priority = priority;
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) params.from = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(to)) d.setUTCHours(23, 59, 59, 999);
      params.to = d;
    }
  }
  const search = sp.get("search");
  if (search) params.search = search.trim();
  return params;
}

function buildFilter(params: ListParams): Filter<SubmissionDoc> {
  const filter: Filter<SubmissionDoc> = {};
  if (params.type) filter.type = params.type;
  if (params.status) filter.status = params.status;
  if (params.priority) filter.priority = params.priority;
  if (params.from || params.to) {
    filter.createdAt = {};
    if (params.from) (filter.createdAt as Record<string, Date>).$gte = params.from;
    if (params.to) (filter.createdAt as Record<string, Date>).$lte = params.to;
  }
  if (params.search) {
    const rx = { $regex: escapeRegex(params.search), $options: "i" };
    // Also build a space/separator-stripped variant for the phone field so that
    // "0412 345 678", "0412-345-678", or "+61 412 345 678" all match the
    // compactly-stored number (e.g. "0412345678") in the database.
    const phoneQuery = params.search.replace(/[\s\-().]/g, "");
    const phoneRx = phoneQuery
      ? { $regex: escapeRegex(phoneQuery), $options: "i" }
      : rx;
    filter.$or = [
      { jobNo: rx },
      { name: rx },
      { customerType: rx },
      { agency: rx },
      { email: rx },
      { phone: phoneRx },
      { message: rx },
      { issue: rx },
      { city: rx },
      { address: rx },
      { service: rx },
      { notes: rx },
      { source: rx },
    ];
  }
  return filter;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listSubmissions(
  params: ListParams
): Promise<{ items: SubmissionJSON[]; total: number }> {
  const col = await collection();
  const filter = buildFilter(params);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, params.pageSize ?? 25));

  const [docs, total] = await Promise.all([
    col
      .find(filter, { projection: { "photos.dataUrl": 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return { items: docs.map(toJSON), total };
}

/** Stream-friendly export: every matching doc, newest first, no pagination. */
export async function exportSubmissions(params: ListParams): Promise<SubmissionJSON[]> {
  const col = await collection();
  const docs = await col.find(buildFilter(params)).sort({ createdAt: -1 }).toArray();
  return docs.map(toJSON);
}

/**
 * Leads sitting in "Quote Sent" that still owe a follow-up (fewer than 3 sent).
 * The cron endpoint decides which are actually due based on followUpNext.
 */
export async function listFollowUpCandidates(): Promise<SubmissionJSON[]> {
  const col = await collection();
  // Include stage 3 (all nudges sent) so the sweep can auto-close it to Lost
  // once the grace period lapses; stage 4 = already closed, so excluded.
  const docs = await col
    .find({
      status: "Quote Sent",
      $or: [{ followUpStage: { $exists: false } }, { followUpStage: { $lt: 4 } }],
    })
    .toArray();
  return docs.map(toJSON);
}

/**
 * Leads with a booked inspection or job that hasn't had its 24h reminder sent
 * yet. The cron decides which are actually within the reminder window.
 */
export async function listReminderCandidates(): Promise<SubmissionJSON[]> {
  const col = await collection();
  const docs = await col
    .find({
      status: { $nin: ["Lost", "Completed"] },
      $or: [
        { inspectionAt: { $gt: "" }, inspectionReminderSent: { $ne: true } },
        { inspectionAt: { $gt: "" }, inspectionReminder1hSent: { $ne: true } },
        { jobAt: { $gt: "" }, jobReminderSent: { $ne: true } },
        { jobAt: { $gt: "" }, jobReminder1hSent: { $ne: true } },
      ],
    })
    .toArray();
  return docs.map(toJSON);
}

export async function getSubmission(id: string): Promise<SubmissionJSON | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await collection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? toJSON(doc) : null;
}

export async function updateStatus(
  id: string,
  status: SubmissionStatus
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: {
    status,
    ...(!["Inspection En Route", "Job En Route"].includes(status) ? { customerTrackingEndedAt: new Date() } : {}),
  } });
  return res.matchedCount > 0;
}

export async function updateSubmission(
  id: string,
  updates: Partial<SubmissionDoc>
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const { _id, ...safeUpdates } = updates;
  normalizeApptFields(safeUpdates);
  if (safeUpdates.status && !["Inspection En Route", "Job En Route"].includes(safeUpdates.status)) {
    safeUpdates.customerTrackingEndedAt = new Date();
  }
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: safeUpdates });
  return res.matchedCount > 0;
}

export async function deleteSubmission(id: string, deletedBy?: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return false;

  // Move to recycle bin instead of permanently deleting
  const bin = await recycleBinCollection();
  const recycleBinDoc: RecycleBinDoc = {
    ...doc,
    deletedAt: new Date(),
    deletedBy: deletedBy || "system",
    originalStatus: doc.status,
  };
  await bin.insertOne(recycleBinDoc);
  await col.deleteOne({ _id: new ObjectId(id) });
  return true;
}

export async function updateEmailDelivered(
  id: string,
  emailDelivered: boolean
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: { emailDelivered } });
  return res.matchedCount > 0;
}

// ── CRM Tasks ──────────────────────────────────────────────────────────────

export async function listTasks(): Promise<Array<{ id: string; text: string; done: boolean }>> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await taskCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => ({
      id: d._id ? d._id.toString() : d.id,
      text: d.text,
      done: Boolean(d.done),
    }));
  } catch (err) {
    console.error("listTasks failed:", err);
    return [];
  }
}

export async function createTask(text: string): Promise<{ id: string; text: string; done: boolean } | null> {
  if (!isMongoConfigured()) return null;
  try {
    const col = await taskCollection();
    const doc: TaskDoc = {
      id: "task_" + Date.now(),
      text,
      done: false,
      createdAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return {
      id: res.insertedId.toString(),
      text: doc.text,
      done: false,
    };
  } catch (err) {
    console.error("createTask failed:", err);
    return null;
  }
}

export async function updateTask(id: string, done: boolean): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const col = await taskCollection();
    if (ObjectId.isValid(id)) {
      const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: { done } });
      return res.matchedCount > 0;
    } else {
      const res = await col.updateOne({ id }, { $set: { done } });
      return res.matchedCount > 0;
    }
  } catch (err) {
    console.error("updateTask failed:", err);
    return false;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const col = await taskCollection();
    if (ObjectId.isValid(id)) {
      const res = await col.deleteOne({ _id: new ObjectId(id) });
      return res.deletedCount > 0;
    } else {
      const res = await col.deleteOne({ id });
      return res.deletedCount > 0;
    }
  } catch (err) {
    console.error("deleteTask failed:", err);
    return false;
  }
}

// ── Analytics ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  newCount: number;
  byType: { type: SubmissionType; count: number }[];
  byStatus: { status: SubmissionStatus; count: number }[];
  timeline: { date: string; quote: number; support_ticket: number }[];
  topEnquiries: { label: string; count: number }[];
  topCities: { label: string; count: number }[];
  topSources: { label: string; count: number }[];
}

function startOfUTCDay(offsetDays = 0): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d;
}

export async function getDashboardStats(days = 30): Promise<DashboardStats> {
  const col = await collection();
  const since = startOfUTCDay(days - 1);
  const startToday = startOfUTCDay(0);
  const start7 = startOfUTCDay(6);
  const start30 = startOfUTCDay(29);

  const [
    total,
    today,
    last7Days,
    last30Days,
    newCount,
    byTypeRaw,
    byStatusRaw,
    timelineRaw,
    topEnquiriesRaw,
    topCitiesRaw,
    topSourcesRaw,
  ] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments({ createdAt: { $gte: startToday } }),
    col.countDocuments({ createdAt: { $gte: start7 } }),
    col.countDocuments({ createdAt: { $gte: start30 } }),
    col.countDocuments({ status: "new" }),
    col
      .aggregate<{ _id: SubmissionType; count: number }>([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ])
      .toArray(),
    col
      .aggregate<{ _id: SubmissionStatus; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray(),
    col
      .aggregate<{ _id: { date: string; type: SubmissionType }; count: number }>([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: "$type",
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    topGroup(col, "enquiry"),
    topGroup(col, "city"),
    topGroup(col, "sourcePage"),
  ]);

  return {
    total,
    today,
    last7Days,
    last30Days,
    newCount,
    byType: byTypeRaw.map((r) => ({ type: r._id, count: r.count })),
    byStatus: byStatusRaw.map((r) => ({ status: r._id, count: r.count })),
    timeline: buildTimeline(days, timelineRaw),
    topEnquiries: topEnquiriesRaw,
    topCities: topCitiesRaw,
    topSources: topSourcesRaw,
  };
}

async function topGroup(
  col: Collection<SubmissionDoc>,
  field: keyof SubmissionDoc,
  limit = 8
): Promise<{ label: string; count: number }[]> {
  const rows = await col
    .aggregate<{ _id: string; count: number }>([
      { $match: { [field]: { $nin: [null, ""] } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
    .toArray();
  return rows.map((r) => ({ label: r._id, count: r.count }));
}

function buildTimeline(
  days: number,
  raw: { _id: { date: string; type: SubmissionType }; count: number }[]
): DashboardStats["timeline"] {
  const map = new Map<string, { quote: number; support_ticket: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const key = startOfUTCDay(i).toISOString().slice(0, 10);
    map.set(key, { quote: 0, support_ticket: 0 });
  }
  for (const row of raw) {
    const bucket = map.get(row._id.date);
    if (bucket && (row._id.type === "quote" || row._id.type === "support_ticket")) {
      bucket[row._id.type] = row.count;
    }
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

// ── Recycle Bin Operations ─────────────────────────────────────────────────────

/** List all soft-deleted leads, newest deletions first. */
export async function listRecycleBin(
  params?: { search?: string; page?: number; pageSize?: number }
): Promise<{ items: RecycleBinJSON[]; total: number }> {
  const bin = await recycleBinCollection();
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params?.pageSize ?? 50));

  let filter: Filter<RecycleBinDoc> = {};
  if (params?.search) {
    const esc = escapeRegex(params.search);
    const rx = { $regex: esc, $options: "i" };
    filter = {
      $or: [
        { name: rx },
        { email: rx },
        { phone: rx },
        { jobNo: rx },
        { address: rx },
        { service: rx },
      ],
    };
  }

  const [docs, total] = await Promise.all([
    bin
      .find(filter, { projection: { "photos.dataUrl": 0 } })
      .sort({ deletedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    bin.countDocuments(filter),
  ]);

  return { items: docs.map(recycleBinToJSON), total };
}

/** Restore a lead from the recycle bin back to the submissions collection. */
export async function restoreFromRecycleBin(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const bin = await recycleBinCollection();
  const doc = await bin.findOne({ _id: new ObjectId(id) });
  if (!doc) return false;

  // Remove recycle-bin metadata and restore the original document
  const { deletedAt, deletedBy, originalStatus, ...original } = doc;
  // Restore the status to what it was before deletion
  if (originalStatus) original.status = originalStatus;

  const col = await collection();
  await col.insertOne(original as SubmissionDoc);
  await bin.deleteOne({ _id: new ObjectId(id) });
  return true;
}

/** Permanently delete a single lead from the recycle bin. */
export async function permanentlyDeleteFromRecycleBin(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const bin = await recycleBinCollection();
  const res = await bin.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}

/** Empty the entire recycle bin (permanent deletion of all trashed leads). */
export async function emptyRecycleBin(): Promise<number> {
  const bin = await recycleBinCollection();
  const res = await bin.deleteMany({});
  return res.deletedCount;
}

/** Get the count of items in the recycle bin. */
export async function getRecycleBinCount(): Promise<number> {
  const bin = await recycleBinCollection();
  return bin.countDocuments({});
}
