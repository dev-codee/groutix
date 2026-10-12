import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { CustomerMessage, SubmissionDoc } from "@/lib/submissions";

export const runtime = "nodejs";

// Read markers and manual additions must never replace the conversation with
// a browser snapshot, which could delete a reply imported since it was loaded.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid lead ID." }, { status: 400 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid message update." }, { status: 400 });
  const hasReadIds = Array.isArray(body.readIds) && body.readIds.length > 0 && body.readIds.length <= 1000 && body.readIds.every((id: unknown) => typeof id === "string");
  const message = body.message as CustomerMessage | undefined;
  const hasMessage = message && typeof message.id === "string" && message.id.length > 0 &&
    typeof message.text === "string" && message.text.trim() &&
    (message.from === "customer" || message.from === "groutix") &&
    (message.channel === "email" || message.channel === "sms") &&
    typeof message.time === "string" && Number.isFinite(Date.parse(message.time));
  if (Boolean(hasReadIds) === Boolean(hasMessage)) return NextResponse.json({ error: "Provide readIds or a message." }, { status: 400 });

  try {
    const col = (await getDb()).collection<SubmissionDoc>("submissions");
    const _id = new ObjectId(id);
    if (!await col.findOne({ _id }, { projection: { _id: 1 } })) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    if (hasReadIds) {
      await col.updateOne({ _id }, { $set: { "messages.$[message].read": true } }, {
        arrayFilters: [{ "message.id": { $in: body.readIds }, "message.from": "customer" }],
      });
    } else {
      const entry: CustomerMessage = { id: message!.id, from: message!.from, channel: message!.channel, text: message!.text, time: message!.time,
        ...(message!.subject ? { subject: message!.subject } : {}), ...(message!.from === "customer" ? { read: false } : {}) };
      await col.updateOne({ _id, "messages.id": { $ne: entry.id } }, { $push: { messages: entry } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Conversation update failed:", error);
    return NextResponse.json({ error: "Could not save the conversation update." }, { status: 500 });
  }
}
