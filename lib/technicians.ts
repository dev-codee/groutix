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
}

export type TechnicianJSON = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  hasLogin?: boolean;
  username?: string;
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
  };
}

export async function listTechnicians(): Promise<TechnicianJSON[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    const result: TechnicianJSON[] = docs.map(toTechnicianJSON);

    // Also include staff accounts with role === "technician"
    const db = await getDb();
    const staffTechs = await db
      .collection("admin_users")
      .find({ role: "technician", active: { $ne: false } })
      .toArray();

    for (const st of staffTechs) {
      const displayName = (st.name && st.name.trim()) ? st.name.trim() : st.username;
      const lowerName = displayName.toLowerCase();
      const lowerUsername = st.username ? st.username.toLowerCase() : "";
      const existing = result.find(
        (r) =>
          r.id === st._id.toString() ||
          r.name.trim().toLowerCase() === lowerName ||
          (lowerUsername.includes("@") && r.email.toLowerCase() === lowerUsername)
      );
      if (existing) {
        existing.hasLogin = true;
        existing.username = st.username;
      } else {
        result.push({
          id: st._id.toString(),
          name: displayName,
          email: lowerUsername.includes("@") ? st.username : "",
          active: st.active !== false,
          hasLogin: true,
          username: st.username,
          createdAt: (st.createdAt instanceof Date ? st.createdAt : new Date(st.createdAt || Date.now())).toISOString(),
        });
      }
    }

    return result;
  } catch (err) {
    console.error("listTechnicians failed:", err);
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
