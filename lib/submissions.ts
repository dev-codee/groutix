// Data-access layer for form submissions (quotes + support tickets).
//
// Everything the admin panel reads and everything the public forms write goes
// through here. Writes are deliberately best-effort: recordSubmission swallows
// errors and returns null so a Mongo outage can never break a lead's email
// flow. Reads are only ever called from authenticated admin routes.

import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export type SubmissionType = "quote" | "support_ticket";
export type SubmissionStatus = "new" | "read" | "archived";

export type TranscriptMessage = { role: "user" | "assistant"; content: string };

export interface SubmissionDoc {
  _id?: ObjectId;
  type: SubmissionType;
  status: SubmissionStatus;
  createdAt: Date;
  // Contact / lead fields (subset present depends on type).
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
  issue?: string;
  transcript?: TranscriptMessage[];
  photosCount?: number;
  photos?: { name: string; contentType?: string; dataUrl: string }[];
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

let indexesEnsured = false;

async function collection(): Promise<Collection<SubmissionDoc>> {
  const db = await getDb();
  const col = db.collection<SubmissionDoc>("submissions");
  // Ensure the indexes the admin panel filters/sorts by - but only once per
  // process, so it doesn't add a round-trip to every submission/query.
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
      status: doc.status ?? "new",
      createdAt: new Date(),
    });
    return res.insertedId.toString();
  } catch (err) {
    console.error("recordSubmission failed (non-fatal):", err);
    return null;
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
  const from = sp.get("from");
  const to = sp.get("to");
  const params: ListParams = {};
  if (type === "quote" || type === "support_ticket") params.type = type;
  if (status === "new" || status === "read" || status === "archived") params.status = status;
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) params.from = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      // Treat a plain YYYY-MM-DD "to" as inclusive of the whole day.
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
  if (params.from || params.to) {
    filter.createdAt = {};
    if (params.from) (filter.createdAt as Record<string, Date>).$gte = params.from;
    if (params.to) (filter.createdAt as Record<string, Date>).$lte = params.to;
  }
  if (params.search) {
    const rx = { $regex: escapeRegex(params.search), $options: "i" };
    filter.$or = [
      { name: rx },
      { email: rx },
      { phone: rx },
      { message: rx },
      { issue: rx },
      { city: rx },
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
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));

  const [docs, total] = await Promise.all([
    col
      .find(filter)
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
    if (bucket) bucket[row._id.type] = row.count;
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}
