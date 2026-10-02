// Server-side persistence for the manager-editable zone rules
// (see lib/zoneRules.ts). Stored as a single document in the `settings`
// collection alongside the site settings and booking rules.

import { getDb, isMongoConfigured } from "./mongodb";
import { DEFAULT_ZONE_RULES, sanitizeZoneRules, type ZoneRules } from "./zoneRules";

const DOC_ID = "zone_rules";

/** Current zone rules, falling back to the defaults if unset or unreachable. */
export async function getZoneRules(): Promise<ZoneRules> {
  if (!isMongoConfigured()) return DEFAULT_ZONE_RULES;
  try {
    const db = await getDb();
    const doc = await db.collection<{ _id: string }>("settings").findOne({ _id: DOC_ID });
    return doc ? sanitizeZoneRules(doc) : DEFAULT_ZONE_RULES;
  } catch (err) {
    console.error("getZoneRules failed, using defaults:", err);
    return DEFAULT_ZONE_RULES;
  }
}

export async function saveZoneRules(rules: ZoneRules, updatedBy: string): Promise<ZoneRules> {
  const clean = sanitizeZoneRules({ ...rules, updatedAt: new Date().toISOString(), updatedBy });
  const db = await getDb();
  await db.collection<{ _id: string }>("settings").updateOne({ _id: DOC_ID }, { $set: clean }, { upsert: true });
  return clean;
}
