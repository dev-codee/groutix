// Cached MongoDB client for the App Router.
//
// Next.js hot-reloads modules in dev and spins up many serverless instances in
// prod, so we cache a single MongoClient (and its connection promise) on the
// global object to avoid exhausting the connection pool. Reads MONGODB_URI at
// call time so the rest of the site keeps working even when Mongo isn't
// configured - callers should treat a thrown/absent client as "persistence
// unavailable" and never let it break the user-facing flow.

import { MongoClient, type Db } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "groutix";

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

const globalForMongo = globalThis as unknown as { _mongo?: MongoCache };
const cache: MongoCache = globalForMongo._mongo ?? { client: null, promise: null };
globalForMongo._mongo = cache;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

/** Returns a connected MongoClient, reusing one across invocations. */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (cache.client) return cache.client;
  if (!cache.promise) {
    cache.promise = new MongoClient(uri, {
      // Keep connections lean on serverless; fail fast rather than hang the
      // request if the cluster is unreachable.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .then((client) => {
        cache.client = client;
        return client;
      })
      .catch((err) => {
        // Reset so the next call can retry instead of reusing a rejected promise.
        cache.promise = null;
        throw err;
      });
  }
  return cache.promise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}
