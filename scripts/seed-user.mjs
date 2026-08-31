// Create or update an admin staff account (one of the four role logins).
//
// Usage:
//   node scripts/seed-user.mjs <username> <password> <role> ["Full Name"]
//
//   role = intake | field | finance | manager
//
// Reads MONGODB_URI / MONGODB_DB from .env.local (falls back to process.env).
// Safe to re-run: an existing username is updated (password + role reset).

import { MongoClient } from "mongodb";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scryptAsync = promisify(scrypt);
const ROLES = ["intake", "field", "finance", "manager"];

// ── Minimal .env.local loader (only the keys we need) ────────────────────────
function loadEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // No .env.local — rely on process.env.
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function main() {
  loadEnv();

  const [username, password, role, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(" ").trim();

  if (!username || !password || !role) {
    console.error(
      'Usage: node scripts/seed-user.mjs <username> <password> <role> ["Full Name"]'
    );
    console.error("  role = intake | field | finance | manager");
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set (checked .env.local and environment).");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB || "groutix";
  const uname = username.trim().toLowerCase();

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    const col = client.db(dbName).collection("admin_users");
    await col.createIndex({ username: 1 }, { unique: true });
    const passwordHash = await hashPassword(password);
    const existing = await col.findOne({ username: uname });

    if (existing) {
      await col.updateOne(
        { username: uname },
        { $set: { passwordHash, role, active: true, name: name || existing.name || uname } }
      );
      console.log(`Updated existing user "${uname}" (role: ${role}).`);
    } else {
      await col.insertOne({
        username: uname,
        name: name || uname,
        passwordHash,
        role,
        active: true,
        createdAt: new Date(),
      });
      console.log(`Created user "${uname}" (role: ${role}).`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
