// Data-access layer for form submissions (quotes + support tickets).
//
// Everything the admin panel reads and everything the public forms write goes
// through here. Writes are deliberately best-effort: recordSubmission swallows
// errors and returns null so a Mongo outage can never break a lead's email
// flow. Reads are only ever called from authenticated admin routes.

import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getActiveUsersByRole } from "@/lib/users";

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
}

export interface SubmissionDoc {
  _id?: ObjectId;
  type: SubmissionType;
  status: SubmissionStatus;
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
  priority?: string;
  received?: string;
  contacted?: string;
  follow?: string;
  notes?: string;
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
  warranty?: WarrantyDoc;
  activity?: ActivityEntry[];
  quoteNumber?: string;
  followUpStage?: number; // 0 = none, 1..3 = follow-up sent, 4 = no response
  followUpNext?: string; // ISO time the next follow-up is due
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
    const res = await col.insertOne({
      ...doc,
      status: doc.status ?? "New",
      createdAt: new Date(),
    });
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
    const assigned = doc.assigned || (await pickAssignee());
    const fullDoc: SubmissionDoc = {
      type: (doc.type as SubmissionType) || "lead",
      status: doc.status || "New",
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
      quoteTaxMode: doc.quoteTaxMode || "inclusive",
      quoteTaxRate: doc.quoteTaxRate ?? 10,
      quoteTerms: doc.quoteTerms || "",
      photos: doc.photos || [],
      messages: doc.messages || [],
      gps: doc.gps || null,
      warranty: doc.warranty,
      activity: doc.activity || [
        { time: now.toISOString(), actor: "system", action: "Lead created", detail: doc.source || "Manual Entry" },
        { time: now.toISOString(), actor: "system", action: "Auto-assigned", detail: assigned },
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
const CLOSED_STATUSES = ["Lost", "Payment Received", "Warranty Sent"];

/**
 * Pick the active intake staffer with the fewest open leads. Falls back to
 * "Unassigned" when no intake accounts exist yet.
 */
export async function pickAssignee(): Promise<string> {
  try {
    const intake = await getActiveUsersByRole("intake");
    if (intake.length === 0) return "Unassigned";
    const names = intake.map((u) => u.name);
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
    filter.$or = [
      { name: rx },
      { customerType: rx },
      { agency: rx },
      { email: rx },
      { phone: rx },
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
  const docs = await col
    .find({
      status: "Quote Sent",
      $or: [{ followUpStage: { $exists: false } }, { followUpStage: { $lt: 3 } }],
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
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
  return res.matchedCount > 0;
}

export async function updateSubmission(
  id: string,
  updates: Partial<SubmissionDoc>
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const { _id, ...safeUpdates } = updates;
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: safeUpdates });
  return res.matchedCount > 0;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
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
