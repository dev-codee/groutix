// Reports the QuickBooks Online connection state and whether recent invoices
// reached QBO. Reads .env.local directly so it can run without the Next server:
//   node scripts/check-qbo.mjs
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const root = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

if (!env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db(env.MONGODB_DB || "groutix");

console.log("=== Configuration ===");
console.log("QBO_CLIENT_ID:", env.QBO_CLIENT_ID ? "set" : "MISSING");
console.log("QBO_CLIENT_SECRET:", env.QBO_CLIENT_SECRET ? "set" : "MISSING");
console.log("QBO_SERVICE_ITEM_ID:", env.QBO_SERVICE_ITEM_ID || '(unset -> defaults to "1")');
console.log("redirect URI (production):", `${(env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/api/admin/qbo/callback`);

console.log("\n=== Connection ===");
const qbo = await db.collection("settings").findOne({ _id: "quickbooks" });
if (!qbo) {
  console.log('NOT CONNECTED - no settings/quickbooks doc. Click "Connect QuickBooks" in the admin panel.');
} else {
  const refreshDays = (qbo.refreshExpiresAt - Date.now()) / 86400000;
  console.log("connected realm:", qbo.realmId, "| since:", qbo.connectedAt);
  console.log("access token valid:", Date.now() < qbo.accessExpiresAt);
  console.log("refresh token expires in:", refreshDays.toFixed(1), "days", refreshDays < 0 ? "(EXPIRED - reconnect)" : "");
}

console.log("\n=== 10 most recent invoiced leads ===");
const leads = await db.collection("submissions")
  .find({ $or: [{ invoiceNumber: { $exists: true } }, { invoiceSentAt: { $exists: true } }, { qboInvoiceId: { $exists: true } }] })
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();

if (!leads.length) console.log("none found");
for (const l of leads) {
  const state = l.qboInvoiceId ? `PUSHED (${l.qboInvoiceId})` : l.qboError ? "FAILED" : "NO QBO";
  console.log(`${state.padEnd(16)} ${l._id} | ${l.name || "(no name)"} | ${l.invoiceNumber || l.jobNo || "-"} | sent: ${l.invoiceSentAt || "-"}`);
  if (l.qboError) console.log(`${" ".repeat(16)} error @ ${l.qboErrorAt || "?"}: ${l.qboError}`);
}

await client.close();
