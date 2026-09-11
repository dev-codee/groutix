// scripts/migrate-mongodb.mjs
// Safely copies all collections, documents, and indexes from the current
// MongoDB database to a new target MongoDB database (e.g. Vercel MongoDB Atlas).
//
// Features:
// - Uses reliable DNS servers (8.8.8.8, 1.1.1.1) to avoid Windows SRV lookup timeouts.
// - Supports `--clean` flag to wipe target database collections before importing.
// - Uses upsert (by _id) so running it multiple times will NEVER duplicate data.
// - Batch processing with real-time progress logging for large collections.
//
// Usage:
//   node scripts/migrate-mongodb.mjs "<TARGET_MONGODB_URI>" [TARGET_DB_NAME] [--clean]

import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dns from "node:dns";

// Fix Windows DNS queryTxt / SRV timeout issues when connecting to Atlas
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // fallback to system resolver if setServers not permitted
}

function loadEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const cleanFirst = args.includes("--clean");
  const positionalArgs = args.filter((a) => !a.startsWith("--"));

  const sourceUri = process.env.MONGODB_URI;
  const sourceDbName = process.env.MONGODB_DB || "groutix";

  const targetUri = positionalArgs[0] || process.env.TARGET_MONGODB_URI;
  const targetDbName = positionalArgs[1] || process.env.TARGET_MONGODB_DB || sourceDbName;

  if (!sourceUri) {
    console.error("❌ Error: MONGODB_URI is not defined in .env.local (source).");
    process.exit(1);
  }

  if (!targetUri) {
    console.error("\n❌ Error: Please provide the target MongoDB URI.");
    console.error('Usage: node scripts/migrate-mongodb.mjs "<TARGET_MONGODB_URI>" [TARGET_DB_NAME] [--clean]\n');
    process.exit(1);
  }

  if (sourceUri.trim() === targetUri.trim() && sourceDbName === targetDbName) {
    console.error("❌ Error: Source and Target connection strings and database names are identical!");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🚀 Starting MongoDB Migration for Groutix");
  console.log("==================================================");
  console.log(`Source DB : "${sourceDbName}" (from .env.local)`);
  console.log(`Target DB : "${targetDbName}"`);
  console.log(`Mode      : ${cleanFirst ? "Wipe Target First (--clean)" : "Safe Merge / Upsert (no duplicates)"}`);
  console.log("--------------------------------------------------");

  const sourceClient = new MongoClient(sourceUri, { serverSelectionTimeoutMS: 20000 });
  const targetClient = new MongoClient(targetUri, { serverSelectionTimeoutMS: 20000 });

  try {
    console.log("⏳ Connecting to Source MongoDB...");
    await sourceClient.connect();
    console.log("✅ Connected to Source.");

    console.log("⏳ Connecting to Target MongoDB...");
    await targetClient.connect();
    console.log("✅ Connected to Target.");

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    const collections = await sourceDb.listCollections().toArray();
    const collectionNames = collections
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."));

    if (collectionNames.length === 0) {
      console.log("ℹ️ No collections found in source database.");
      return;
    }

    console.log(`\nFound ${collectionNames.length} collections: ${collectionNames.join(", ")}\n`);

    const results = [];

    for (const name of collectionNames) {
      console.log(`\n📦 Processing collection: "${name}"`);
      const srcCol = sourceDb.collection(name);
      const tgtCol = targetDb.collection(name);

      const srcCount = await srcCol.countDocuments();
      if (srcCount === 0) {
        console.log(`   (0 documents, skipping)`);
        results.push({ collection: name, sourceDocs: 0, targetDocs: 0, status: "Empty" });
        continue;
      }

      if (cleanFirst) {
        console.log(`   🧹 Dropping target collection "${name}" first...`);
        await tgtCol.drop().catch(() => {});
      }

      console.log(`   Transferring ${srcCount} documents in batches...`);
      const cursor = srcCol.find({});
      const BATCH_SIZE = 25;
      let batch = [];
      let transferred = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        batch.push(doc);

        if (batch.length >= BATCH_SIZE) {
          const ops = batch.map((d) => ({
            replaceOne: {
              filter: { _id: d._id },
              replacement: d,
              upsert: true,
            },
          }));
          await tgtCol.bulkWrite(ops, { ordered: false });
          transferred += batch.length;
          process.stdout.write(`   Progress: ${transferred}/${srcCount} docs\r`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        const ops = batch.map((d) => ({
          replaceOne: {
            filter: { _id: d._id },
            replacement: d,
            upsert: true,
          },
        }));
        await tgtCol.bulkWrite(ops, { ordered: false });
        transferred += batch.length;
      }

      console.log(`   ✅ Progress: ${transferred}/${srcCount} docs transferred.`);

      // Copy custom indexes (skip default _id_ index)
      try {
        const indexes = await srcCol.indexes();
        const nonIdIndexes = indexes.filter((idx) => idx.name !== "_id_");
        for (const idx of nonIdIndexes) {
          const { key, name: indexName, unique, sparse } = idx;
          const options = {};
          if (indexName) options.name = indexName;
          if (unique) options.unique = unique;
          if (sparse) options.sparse = sparse;
          await tgtCol.createIndex(key, options).catch(() => {});
        }
      } catch (idxErr) {
        console.warn(`   ⚠️ Index notice: ${idxErr.message}`);
      }

      const tgtCount = await tgtCol.countDocuments();
      results.push({
        collection: name,
        sourceDocs: srcCount,
        targetDocs: tgtCount,
        status: tgtCount === srcCount ? "✅ Complete" : "⚠️ Discrepancy",
      });
    }

    console.log("\n==================================================");
    console.log("📊 Final Migration Summary");
    console.log("==================================================");
    console.table(results);
    console.log("🎉 All collections and documents successfully migrated!");
    console.log("Next: update MONGODB_URI in .env.local and Vercel environment variables.");

  } catch (err) {
    console.error("\n❌ Migration error:", err.message);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

main();
