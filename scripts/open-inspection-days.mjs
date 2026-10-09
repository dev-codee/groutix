// One-off: schedule inspections to open on every day from a given date.
//
// Usage:
//   node scripts/open-inspection-days.mjs [YYYY-MM-DD]   (default 2026-10-07)
//
// The saved booking-rules document in MongoDB overrides the defaults in
// lib/bookingRules.ts, so an existing install needs this changeover written to
// the DB (a manager can do the same from Settings → Booking Hours → Scheduled
// changes). Dates before the changeover keep the current weekend-only hours.
//
// Reads MONGODB_URI / MONGODB_DB from .env.local (falls back to process.env).
// Safe to re-run: the changeover for that date is replaced, not duplicated.

import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DOC_ID = "booking_rules";

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // No .env.local — rely on process.env.
  }
}

async function main() {
  loadEnv();

  const from = (process.argv[2] || "2026-10-07").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    console.error("Usage: node scripts/open-inspection-days.mjs [YYYY-MM-DD]");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || undefined);
    const settings = db.collection("settings");
    const doc = await settings.findOne({ _id: DOC_ID });
    if (!doc) {
      console.log("No saved booking rules — the defaults already open inspections from 2026-10-07.");
      return;
    }

    // Keep each open day's existing hours; fall back to the weekend hours (or
    // 9–5) for days that are currently closed.
    const current = Array.isArray(doc.inspection?.days) ? doc.inspection.days : [];
    const template = current.find((d) => d?.open) || { start: "09:00", end: "17:00" };
    const days = Array.from({ length: 7 }, (_, wd) => ({
      open: true,
      start: current[wd]?.start || template.start,
      end: current[wd]?.end || template.end,
    }));

    const kept = (doc.inspection?.changeovers || []).filter((c) => c?.from !== from);
    const changeovers = [...kept, { from, days, label: "Open every day" }].sort((a, b) =>
      String(a.from).localeCompare(String(b.from))
    );

    await settings.updateOne(
      { _id: DOC_ID },
      {
        $set: {
          "inspection.changeovers": changeovers,
          updatedAt: new Date().toISOString(),
          updatedBy: "open-inspection-days script",
        },
      }
    );
    console.log(`Inspections now open every day from ${from} (${days[1].start}–${days[1].end}).`);
    console.log("Dates before then keep the existing days:", current.map((d, i) => (d?.open ? i : null)).filter((v) => v !== null).join(", "));
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
