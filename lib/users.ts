// Data-access layer for admin staff accounts (the four role logins).
//
// Node-only (imports mongodb + node:crypto), so never import this from edge
// middleware or the browser — use lib/roles.ts for the shared, dependency-free
// role model. Passwords are stored as scrypt hashes in the format
// `scrypt$<saltHex>$<hashHex>`; verification is constant-time.

import { ObjectId, type Collection } from "mongodb";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { type Role, isRole } from "@/lib/roles";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export interface UserDoc {
  _id?: ObjectId;
  username: string;
  name: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: Date;
}

export type UserJSON = {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

let indexEnsured = false;

async function collection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  const col = db.collection<UserDoc>("admin_users");
  if (!indexEnsured) {
    try {
      await col.createIndex({ username: 1 }, { unique: true });
      indexEnsured = true;
    } catch (err) {
      console.error("ensure admin_users index failed (non-fatal):", err);
    }
  }
  return col;
}

export function toUserJSON(doc: UserDoc): UserJSON {
  return {
    id: doc._id ? doc._id.toString() : "",
    username: doc.username,
    name: doc.name,
    role: doc.role,
    active: doc.active,
    createdAt: (doc.createdAt instanceof Date
      ? doc.createdAt
      : new Date(doc.createdAt)
    ).toISOString(),
  };
}

// ── Password hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const derived = await scryptAsync(password, salt, expected.length);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

// Allow plain usernames and email-style logins.
const USERNAME_RE = /^[a-zA-Z0-9._@+-]{3,64}$/;

export function normaliseUsername(username: string): string {
  return username.trim().toLowerCase();
}

export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  role: Role;
}

export type CreateUserResult =
  | { ok: true; user: UserJSON }
  | { ok: false; error: string };

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  if (!isMongoConfigured()) return { ok: false, error: "Database not configured." };
  const username = normaliseUsername(input.username);
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Username must be 3-64 characters (letters, numbers, or . _ @ + -).",
    };
  }
  if (!input.password || input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!isRole(input.role)) return { ok: false, error: "Invalid role." };
  const name = input.name.trim() || username;

  try {
    const col = await collection();
    const existing = await col.findOne({ username });
    if (existing) return { ok: false, error: "That username already exists." };
    const doc: UserDoc = {
      username,
      name,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      active: true,
      createdAt: new Date(),
    };
    const res = await col.insertOne(doc);
    return { ok: true, user: toUserJSON({ ...doc, _id: res.insertedId }) };
  } catch (err) {
    console.error("createUser failed:", err);
    return { ok: false, error: "Could not create user." };
  }
}

export async function findUserByUsername(username: string): Promise<UserDoc | null> {
  if (!isMongoConfigured()) return null;
  try {
    const col = await collection();
    return await col.findOne({ username: normaliseUsername(username) });
  } catch (err) {
    console.error("findUserByUsername failed:", err);
    return null;
  }
}

export async function listUsers(): Promise<UserJSON[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(toUserJSON);
  } catch (err) {
    console.error("listUsers failed:", err);
    return [];
  }
}

/** Active staff for a role, as { username, name } — used for auto-assignment. */
export async function getActiveUsersByRole(
  role: Role
): Promise<{ username: string; name: string }[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const docs = await col
      .find({ role, active: true }, { projection: { username: 1, name: 1 } })
      .toArray();
    return docs.map((d) => ({ username: d.username, name: d.name || d.username }));
  } catch (err) {
    console.error("getActiveUsersByRole failed:", err);
    return [];
  }
}

export async function countUsers(): Promise<number> {
  if (!isMongoConfigured()) return 0;
  try {
    const col = await collection();
    return await col.countDocuments({});
  } catch {
    return 0;
  }
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  active?: boolean;
  password?: string;
}

export async function updateUser(
  id: string,
  updates: UpdateUserInput
): Promise<{ ok: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) return { ok: false, error: "Invalid id." };
  const set: Partial<UserDoc> = {};
  if (typeof updates.name === "string" && updates.name.trim()) set.name = updates.name.trim();
  if (updates.role) {
    if (!isRole(updates.role)) return { ok: false, error: "Invalid role." };
    set.role = updates.role;
  }
  if (typeof updates.active === "boolean") set.active = updates.active;
  if (updates.password) {
    if (updates.password.length < 8)
      return { ok: false, error: "Password must be at least 8 characters." };
    set.passwordHash = await hashPassword(updates.password);
  }
  if (Object.keys(set).length === 0) return { ok: false, error: "Nothing to update." };
  try {
    const col = await collection();
    const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: set });
    return { ok: res.matchedCount > 0 };
  } catch (err) {
    console.error("updateUser failed:", err);
    return { ok: false, error: "Could not update user." };
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  try {
    const col = await collection();
    const res = await col.deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount > 0;
  } catch (err) {
    console.error("deleteUser failed:", err);
    return false;
  }
}
