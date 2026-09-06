// Data-access layer for internal team chat (staff-to-staff messages).
//
// Node-only (imports mongodb), so never import from edge middleware or the
// browser. Messages are addressed by staff *username* (the stable login handle
// carried on the session), so a conversation survives display-name edits.

import { ObjectId, type Collection } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export interface TeamMessageDoc {
  _id?: ObjectId;
  from: string; // sender username
  to: string; // recipient username
  text: string;
  createdAt: Date;
  read: boolean; // has the recipient opened the conversation since this arrived
}

export type TeamMessageJSON = {
  id: string;
  from: string;
  to: string;
  text: string;
  createdAt: string;
  read: boolean;
};

let indexEnsured = false;

async function collection(): Promise<Collection<TeamMessageDoc>> {
  const db = await getDb();
  const col = db.collection<TeamMessageDoc>("team_messages");
  if (!indexEnsured) {
    try {
      // Conversation lookups filter on the (from,to) pair and sort by time;
      // the unread summary filters on (to,read).
      await col.createIndex({ from: 1, to: 1, createdAt: 1 });
      await col.createIndex({ to: 1, read: 1 });
      indexEnsured = true;
    } catch (err) {
      console.error("ensure team_messages index failed (non-fatal):", err);
    }
  }
  return col;
}

function toJSON(doc: TeamMessageDoc): TeamMessageJSON {
  return {
    id: doc._id ? doc._id.toString() : "",
    from: doc.from,
    to: doc.to,
    text: doc.text,
    createdAt: (doc.createdAt instanceof Date
      ? doc.createdAt
      : new Date(doc.createdAt)
    ).toISOString(),
    read: Boolean(doc.read),
  };
}

/** Full conversation between two users, oldest first. */
export async function listConversation(
  userA: string,
  userB: string,
  limit = 300
): Promise<TeamMessageJSON[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const docs = await col
      .find({
        $or: [
          { from: userA, to: userB },
          { from: userB, to: userA },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    return docs.map(toJSON);
  } catch (err) {
    console.error("listConversation failed:", err);
    return [];
  }
}

/** Store a message. Sender/recipient are usernames; text is trimmed & capped. */
export async function sendTeamMessage(
  from: string,
  to: string,
  text: string
): Promise<TeamMessageJSON | null> {
  if (!isMongoConfigured()) return null;
  const clean = text.trim().slice(0, 4000);
  if (!clean || !from || !to || from === to) return null;
  try {
    const col = await collection();
    const doc: TeamMessageDoc = {
      from,
      to,
      text: clean,
      createdAt: new Date(),
      read: false,
    };
    const res = await col.insertOne(doc);
    return toJSON({ ...doc, _id: res.insertedId });
  } catch (err) {
    console.error("sendTeamMessage failed:", err);
    return null;
  }
}

/** Mark every message from `other` to `me` as read. */
export async function markConversationRead(
  me: string,
  other: string
): Promise<void> {
  if (!isMongoConfigured()) return;
  try {
    const col = await collection();
    await col.updateMany(
      { from: other, to: me, read: false },
      { $set: { read: true } }
    );
  } catch (err) {
    console.error("markConversationRead failed:", err);
  }
}

/** Unread message counts for `me`, keyed by the sender's username. */
export async function unreadCountsFor(
  me: string
): Promise<Record<string, number>> {
  if (!isMongoConfigured()) return {};
  try {
    const col = await collection();
    const rows = await col
      .aggregate<{ _id: string; count: number }>([
        { $match: { to: me, read: false } },
        { $group: { _id: "$from", count: { $sum: 1 } } },
      ])
      .toArray();
    const out: Record<string, number> = {};
    for (const r of rows) out[r._id] = r.count;
    return out;
  } catch (err) {
    console.error("unreadCountsFor failed:", err);
    return {};
  }
}
