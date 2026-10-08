import { validateTechnicianSchedule } from "./technicianAvailability";
// Lightweight technician roster (name + email) used by the Dispatch board to
// assign inspections and notify the technician by email. Technicians are NOT
// login accounts — for CRM logins use lib/users.ts.
//
// Node-only (imports mongodb) — never import from edge middleware or the browser.

import { ObjectId, type Collection } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export interface TechnicianDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
  /** Working weekdays: 0=Sun, 1=Mon … 6=Sat. Undefined means all days. */
  workDays?: number[];
  dateOverrides?: Record<string, boolean>;
  aliases?: string[];
}

export type TechnicianJSON = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  aliases?: string[];
  hasLogin?: boolean;
  username?: string;
  workDays?: number[];
  dateOverrides?: Record<string, boolean>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function collection(): Promise<Collection<TechnicianDoc>> {
  const db = await getDb();
  return db.collection<TechnicianDoc>("technicians");
}

export function toTechnicianJSON(doc: TechnicianDoc): TechnicianJSON {
  return {
    id: doc._id ? doc._id.toString() : "",
    name: doc.name,
    email: doc.email,
    active: doc.active,
    createdAt: (doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt)).toISOString(),
    workDays: doc.workDays,
    dateOverrides: doc.dateOverrides,
    aliases: doc.aliases,
  };
}

export async function listTechnicians(options: { strict?: boolean } = {}): Promise<TechnicianJSON[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    const result: TechnicianJSON[] = docs.map(toTechnicianJSON);

    // Also include staff accounts with role === "technician"
    const db = await getDb();
    const staffTechs = await db
      .collection("admin_users")
      .find({ role: "technician" })
      .toArray();

    for (const st of staffTechs) {
      const displayName = (st.name && st.name.trim()) ? st.name.trim() : st.username;
      const lowerName = displayName.toLowerCase();
      const lowerUsername = st.username ? st.username.toLowerCase() : "";
      const email = typeof st.email === "string" && st.email ? st.email.trim().toLowerCase() : lowerUsername.includes("@") ? lowerUsername : "";
      let existing = result.find((tech) => tech.id === st._id.toString() || tech.aliases?.includes(st._id.toString()) || (email && tech.email.toLowerCase() === email));
      if (!existing) {
        // Support older name-only links, without merging two different people sharing a name.
        const matches = result.filter((tech) => !tech.hasLogin && tech.name.trim().toLowerCase() === lowerName && (!email || !tech.email || tech.email.toLowerCase() === email));
        if (matches.length === 1) existing = matches[0];
      }
      if (existing) {
        existing.hasLogin = true;
        existing.active = existing.active && st.active !== false;
        existing.username = st.username;
        existing.aliases = [...(existing.aliases || []), st._id.toString()];
      } else {
        result.push({
          id: st._id.toString(),
          name: displayName,
          email,
          active: st.active !== false && st.jobSchedulingActive !== false,
          hasLogin: true,
          username: st.username,
          workDays: Array.isArray(st.workDays) ? st.workDays : undefined,
          dateOverrides: st.dateOverrides,
          createdAt: (st.createdAt instanceof Date ? st.createdAt : new Date(st.createdAt || Date.now())).toISOString(),
        });
      }
    }

    return result;
  } catch (err) {
    console.error("listTechnicians failed:", err);
    if (options.strict) throw err;
    return [];
  }
}

export type AddTechnicianResult =
  | { ok: true; technician: TechnicianJSON }
  | { ok: false; error: string };

export async function addTechnician(input: { name: string; email: string }): Promise<AddTechnicianResult> {
  if (!isMongoConfigured()) return { ok: false, error: "Database not configured." };
  const name = (input.name || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Please enter the technician's name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  try {
    const col = await collection();
    const existing = await col.findOne({ email });
    if (existing) return { ok: false, error: "A technician with that email already exists." };
    const doc: TechnicianDoc = { name, email, active: true, createdAt: new Date() };
    const res = await col.insertOne(doc);
    return { ok: true, technician: toTechnicianJSON({ ...doc, _id: res.insertedId }) };
  } catch (err) {
    console.error("addTechnician failed:", err);
    return { ok: false, error: "Could not add technician." };
  }
}

export async function getTechnician(id: string): Promise<TechnicianDoc | null> {
  if (!isMongoConfigured() || !ObjectId.isValid(id)) return null;
  try {
    const col = await collection();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (doc) return doc;

    // Check staff accounts with technician role
    const db = await getDb();
    const staffUser = await db
      .collection("admin_users")
      .findOne({ _id: new ObjectId(id), role: "technician" });
    if (staffUser) {
      const displayName = (staffUser.name && staffUser.name.trim()) ? staffUser.name.trim() : staffUser.username;
      const lowerUsername = staffUser.username ? staffUser.username.toLowerCase() : "";
      return {
        _id: staffUser._id,
        name: displayName,
        email: lowerUsername.includes("@") ? staffUser.username : (staffUser.email || ""),
        active: staffUser.active !== false,
        createdAt: staffUser.createdAt || new Date(),
      };
    }

    return null;
  } catch (err) {
    console.error("getTechnician failed:", err);
    return null;
  }
}

export async function updateTechnician(
  id: string,
  updates: { workDays?: number[] | null; dateOverrides?: Record<string, boolean> | null; active?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Invalid id." };
  const error = validateTechnicianSchedule(updates);
  if (error) return { ok: false, error };
  const set: Partial<TechnicianDoc> = {};
  const unset: Record<string, "">=  {};
  if (updates.workDays === null) {
    unset.workDays = "";
  } else if (Array.isArray(updates.workDays)) {
    set.workDays = [...new Set(updates.workDays)].sort();
  }
  if (updates.dateOverrides === null) unset.dateOverrides = "";
  else if (updates.dateOverrides !== undefined) set.dateOverrides = updates.dateOverrides;
  if (typeof updates.active === "boolean") set.active = updates.active;
  try {
    const col = await collection();
    const op: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) op.$set = set;
    if (Object.keys(unset).length > 0) op.$unset = unset;
    if (Object.keys(op).length === 0) return { ok: false, error: "Nothing to update." };
    // Resolve legacy staff IDs to the same roster entry used by capacity checks.
    const roster = await listTechnicians({ strict: true });
    const technician = roster.find((tech) => tech.id === id || tech.aliases?.includes(id));
    if (!technician) return { ok: false, error: "Technician not found." };
    const rosterDoc = await col.findOne({ _id: new ObjectId(technician.id) });
    if (rosterDoc) {
      const res = await col.updateOne({ _id: rosterDoc._id }, op);
      return { ok: res.matchedCount > 0 };
    }
    // Scheduling inactivity must not disable the technician's portal login.
    if ("active" in set) {
      (set as Record<string, unknown>).jobSchedulingActive = set.active;
      delete set.active;
    }
    const db = await getDb();
    const res = await db.collection("admin_users").updateOne({ _id: new ObjectId(technician.id), role: "technician" }, op);
    return { ok: res.matchedCount > 0, ...(res.matchedCount ? {} : { error: "Technician not found." }) };
  } catch (err) {
    console.error("updateTechnician failed:", err);
    return { ok: false, error: "Could not update technician." };
  }
}

export async function deleteTechnician(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  try {
    const col = await collection();
    const res = await col.deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount > 0;
  } catch (err) {
    console.error("deleteTechnician failed:", err);
    return false;
  }
}
