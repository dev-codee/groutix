import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const leadId = "507f1f77bcf86cd799439011";
const reply = id => ({ id, from: "customer", channel: "email", text: "Customer reply", time: "2026-10-12T10:00:00Z", read: false });
function fixture() {
  const messages = [reply("opened"), reply("arrived-during-open")];
  const calls = [];
  const { PATCH } = loadTs("app/api/admin/lead/[id]/messages/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    "@/lib/mongodb": { getDb: async () => ({ collection: () => ({
      findOne: async () => ({ _id: leadId }),
      updateOne: async (query, update, options) => {
        calls.push({ query, update, options });
        if (options?.arrayFilters) {
          const ids = options.arrayFilters[0]["message.id"].$in;
          messages.forEach(message => { if (ids.includes(message.id) && message.from === "customer") message.read = true; });
        } else if (!messages.some(message => message.id === update.$push.messages.id)) messages.push(update.$push.messages);
        return { modifiedCount: 1 };
      },
    }) }) },
  });
  return { messages, calls, patch: body => PATCH({ json: async () => body }, { params: Promise.resolve({ id: leadId }) }) };
}

test("reading a browser snapshot leaves concurrently imported replies present and unread", async () => {
  const f = fixture();
  assert.equal((await f.patch({ readIds: ["opened"] })).status, 200);
  assert.equal(f.messages.length, 2);
  assert.equal(f.messages[0].read, true);
  assert.equal(f.messages[1].read, false);
  assert.equal(f.calls[0].update.$set.messages, undefined);
  assert.equal(f.calls[0].update.$set["messages.$[message].read"], true);
});

test("manual additions append atomically without replacing new replies or duplicating retries", async () => {
  const f = fixture();
  const message = { ...reply("manual"), from: "groutix", channel: "sms" };
  assert.equal((await f.patch({ message })).status, 200);
  assert.equal((await f.patch({ message })).status, 200);
  assert.equal(f.messages.length, 3);
  assert.equal(f.messages[1].id, "arrived-during-open");
  assert.equal(f.calls[0].query["messages.id"].$ne, "manual");
  assert.equal(f.calls[0].update.$push.messages.id, "manual");
});

test("malformed requests never write to the conversation", async () => {
  for (const body of [null, {}, { readIds: [5] }, { messages: [] }, { message: { id: "bad" } }, { readIds: ["opened"], message: reply("ambiguous") }]) {
    const f = fixture();
    assert.equal((await f.patch(body)).status, 400);
    assert.equal(f.calls.length, 0);
  }
});
