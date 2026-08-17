import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

// Minimal .env.local loader.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const col = client.db(process.env.MONGODB_DB || "groutix").collection("submissions");
const docs = await col.find({}).sort({ createdAt: -1 }).limit(8).toArray();
for (const d of docs) {
  console.log(
    [
      d._id.toString(),
      d.createdAt?.toISOString?.() ?? d.createdAt,
      d.type,
      d.name,
      d.email,
      d.phone,
      `photos=${d.photosCount ?? (d.photos?.length || 0)}`,
      `emailDelivered=${d.emailDelivered}`,
    ].join("  |  ")
  );
}
await client.close();
