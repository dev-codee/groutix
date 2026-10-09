import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const secret = "test-inbound-signing-secret";
const payload = {
  event: "message.inbound",
  message_id: "inbound-message-1",
  from: "+61412345678",
  to: "+61480000000",
  body: "Yes, please book me in",
  received_at: "2026-10-09T03:00:00.000Z",
};

function webhook({ phone = "0412345678", matched = true, messages = [] } = {}) {
  const lead = { _id: { toString: () => "lead-1" }, name: "Test Customer", phone, messages: [...messages] };
  const activities = [];
  const notifications = [];
  let reads = 0;
  const col = {
    findOne: async (filter) => {
      reads++;
      if (!matched || !filter.$or.some(({ phone: condition }) => new RegExp(condition.$regex).test(phone))) return null;
      // Return a snapshot, like a database read, to exercise concurrent retries.
      return { ...lead, messages: [...lead.messages] };
    },
    updateOne: async (filter, update) => {
      const id = filter["messages.id"].$ne;
      if (lead.messages.some((message) => message.id === id)) return { modifiedCount: 0 };
      lead.messages.push(update.$push.messages);
      return { modifiedCount: 1 };
    },
  };
  const api = loadTs("app/api/webhooks/sms-reply/route.ts", {
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    "@/lib/mongodb": { getDb: async () => ({ collection: () => col }) },
    "@/lib/submissions": { appendActivity: async (...args) => activities.push(args) },
    "@/lib/email": { sendReplyNotification: async (args) => notifications.push(args) },
  });
  return { api, lead, activities, notifications, get reads() { return reads; } };
}

function signedRequest(body = JSON.stringify(payload), { prefix = true, signature, contentType = "application/json", event = "message.inbound" } = {}) {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return new Request("https://example.test/api/webhooks/sms-reply", {
    method: "POST", body,
    headers: {
      "content-type": contentType,
      "x-texto-event": event,
      "x-texto-signature": signature ?? (prefix ? `sha256=${digest}` : digest),
    },
  });
}

async function withSecret(run, dedicated = false) {
  const original = [process.env.TEXTO_WEBHOOK_SECRET, process.env.TEXTO_INBOUND_WEBHOOK_SECRET];
  process.env.TEXTO_WEBHOOK_SECRET = dedicated ? "different-delivery-secret" : secret;
  if (dedicated) process.env.TEXTO_INBOUND_WEBHOOK_SECRET = secret;
  else delete process.env.TEXTO_INBOUND_WEBHOOK_SECRET;
  try { await run(); }
  finally {
    for (const [i, key] of ["TEXTO_WEBHOOK_SECRET", "TEXTO_INBOUND_WEBHOOK_SECRET"].entries()) {
      if (original[i] === undefined) delete process.env[key];
      else process.env[key] = original[i];
    }
  }
}

test("Texto sha256= signatures save an unread SMS in the customer's dashboard conversation", () => withSecret(async () => {
  const w = webhook();
  const result = await w.api.POST(signedRequest());
  assert.equal(result.body.matched, true);
  assert.equal(w.lead.messages.length, 1);
  const message = w.lead.messages[0];
  assert.equal(message.id, payload.message_id);
  assert.equal(message.from, "customer");
  assert.equal(message.channel, "sms");
  assert.equal(message.read, false);
  assert.equal(message.text, payload.body);
  assert.equal(message.time, payload.received_at);
  assert.equal(w.activities.length, 1);
  assert.equal(w.notifications.length, 1);
}));

test("dedicated inbound secret overrides the legacy secret; bare signatures remain compatible", () => withSecret(async () => {
  const w = webhook();
  assert.equal((await w.api.POST(signedRequest(undefined, { prefix: false }))).body.matched, true);
}, true));

test("missing, malformed and tampered signatures are rejected before any database read", () => withSecret(async () => {
  for (const signature of ["", "sha256=bad", `sha256=${"0".repeat(64)}`]) {
    const w = webhook();
    assert.equal((await w.api.POST(signedRequest(undefined, { signature }))).status, 401);
    assert.equal(w.reads, 0);
    assert.equal(w.lead.messages.length, 0);
  }
}));

test("incoming E.164 numbers match formatted Australian numbers stored by staff", () => withSecret(async () => {
  for (const phone of ["0412 345 678", "0412-345-678", "+61 412 345 678", "61412345678", "+61412345678", "(04)12345678"]) {
    const w = webhook({ phone });
    assert.equal((await w.api.POST(signedRequest())).body.matched, true, phone);
  }
  const w = webhook({ phone: "0412345679" });
  assert.equal((await w.api.POST(signedRequest())).body.matched, false);
}));

test("concurrent and subsequent retries save and notify exactly once", () => withSecret(async () => {
  const w = webhook();
  const results = await Promise.all([w.api.POST(signedRequest()), w.api.POST(signedRequest())]);
  assert.equal(results.filter((result) => result.body.matched).length, 1);
  assert.equal(results.filter((result) => result.body.duplicate).length, 1);
  assert.equal((await w.api.POST(signedRequest())).body.duplicate, true);
  assert.equal(w.lead.messages.length, 1);
  assert.equal(w.notifications.length, 1);
  assert.equal(w.activities.length, 1);
}));

test("form replies decode plus signs and spaces correctly", () => withSecret(async () => {
  const w = webhook();
  const body = new URLSearchParams({ from: payload.from, body: "Yes + thanks", message_id: "form-1" }).toString();
  assert.equal((await w.api.POST(signedRequest(body, { contentType: "application/x-www-form-urlencoded" }))).body.matched, true);
  assert.equal(w.lead.messages[0].text, "Yes + thanks");
}));

test("multipart replies retain their raw signed body and parse form fields", () => withSecret(async () => {
  const w = webhook();
  const form = new FormData();
  form.set("from", payload.from);
  form.set("body", payload.body);
  form.set("message_id", "multipart-1");
  const encoded = new Request("https://example.test", { method: "POST", body: form });
  const body = await encoded.text();
  assert.equal((await w.api.POST(signedRequest(body, { contentType: encoded.headers.get("content-type") }))).body.matched, true);
  assert.equal(w.lead.messages[0].text, payload.body);
}));

test("delivery receipts do not appear as customer replies", () => withSecret(async () => {
  const w = webhook();
  const result = await w.api.POST(signedRequest(JSON.stringify({ ...payload, event: "message.dlr" }), { event: "message.dlr" }));
  assert.equal(result.body.skipped, "not_inbound");
  assert.equal(w.reads, 0);
}));

test("invalid payloads and numbers are rejected; whitespace-only messages are skipped", () => withSecret(async () => {
  for (const body of ["{invalid", "null", "[]", JSON.stringify({ ...payload, from: "unknown" })]) {
    const w = webhook();
    assert.equal((await w.api.POST(signedRequest(body))).status, 400);
    assert.equal(w.reads, 0);
  }
  const w = webhook();
  assert.equal((await w.api.POST(signedRequest(JSON.stringify({ ...payload, body: "  " })))).body.skipped, "missing_from_or_text");
}));

test("an invalid provider timestamp does not discard a valid reply", () => withSecret(async () => {
  const w = webhook();
  assert.equal((await w.api.POST(signedRequest(JSON.stringify({ ...payload, received_at: "bad-date" })))).body.matched, true);
  assert.ok(Number.isFinite(new Date(w.lead.messages[0].time).getTime()));
}));
