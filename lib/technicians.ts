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
    return docs.map(toTechnicianJSON);
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
    return await col.findOne({ _id: new ObjectId(id) });
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
