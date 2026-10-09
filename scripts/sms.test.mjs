import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const formatting = loadTs("lib/smsMessage.ts");
const quotes = loadTs("lib/quoteToken.ts");
const bookings = loadTs("lib/bookingToken.ts");
const id = "507f1f77bcf86cd799439011";
const contact = { phone: "03 7023 8094", email: "info@groutix.com" };
const envKeys = ["SMS_PROVIDER", "TEXTO_API_KEY", "CLICKSEND_USERNAME", "CLICKSEND_API_KEY", "MESSAGEMEDIA_API_KEY", "MESSAGEMEDIA_API_SECRET"];

async function withProvider(provider, run) {
  const original = envKeys.map((key) => process.env[key]);
  process.env.SMS_PROVIDER = provider;
  for (const key of envKeys.slice(1)) process.env[key] = "test-credential";
  try { await run(); }
  finally {
    envKeys.forEach((key, i) => {
      if (original[i] === undefined) delete process.env[key];
      else process.env[key] = original[i];
    });
  }
}

function sender({ business = contact, failContent = false } = {}) {
  const requests = [];
  const api = loadTs("lib/sms.ts", {
    "@/lib/siteContentServer": { getSiteContent: async () => {
      if (failContent) throw new Error("content unavailable");
      return { business };
    } },
  }, {
    fetch: async (url, options) => {
      requests.push({ url, payload: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ message_id: "sent-1" }) };
    },
  });
  return { ...api, requests };
}

test("customer SMS footer includes company contacts, survives repeated preparation and follows contact edits", () => {
  const prepared = formatting.prepareCustomerSms("Hi Sam, we're on the way.", contact);
  assert.ok(prepared.startsWith("Groutix: Hi Sam"));
  assert.ok(prepared.endsWith(formatting.smsReplyNotice(contact)));
  assert.equal(formatting.prepareCustomerSms(prepared, contact), prepared);
  const changed = formatting.prepareCustomerSms(prepared, { phone: "03 9999 8888", email: "office@example.test" });
  assert.equal(changed.match(/This SMS is read-only/g).length, 1);
  assert.ok(changed.endsWith("Email office@example.test or call 03 9999 8888."));
  assert.equal(formatting.prepareCustomerSms("  "), "");
  assert.equal(formatting.prepareCustomerSms("😀"), "");
});

test("SMS part estimate counts GSM extension characters and multipart capacity", () => {
  assert.equal(formatting.smsSegmentCount("a".repeat(160)), 1);
  assert.equal(formatting.smsSegmentCount("a".repeat(161)), 2);
  assert.equal(formatting.smsSegmentCount("a".repeat(159) + "^"), 2);
  assert.equal(formatting.smsSegmentCount("a".repeat(307)), 3);
});

for (const provider of ["texto", "clicksend", "messagemedia"]) {
  test(`${provider} receives full quote and booking URLs followed by the read-only footer`, () => withProvider(provider, async () => {
    const sms = sender();
    const urls = [quotes.buildQuoteSmsUrl(id), bookings.buildBookingSmsUrl(id, "inspection"), bookings.buildBookingSmsUrl(id, "job")];
    for (const url of urls) {
      const result = await sms.sendSms({ to: "0412 345 678", body: `Groutix: Hi Sam, open your link:\n${url}` });
      assert.equal(result.ok, true);
      const { payload } = sms.requests.at(-1);
      const body = payload.message ?? payload.messages[0].body ?? payload.messages[0].content;
      assert.ok(body.includes(url), "URL and signed token must be intact");
      assert.ok(body.endsWith(formatting.smsReplyNotice(contact)));
      assert.equal(result.body, body);
      assert.equal(payload.to ?? payload.messages[0].to ?? payload.messages[0].destination_number, "+61412345678");
    }
  }));
}

test("oversized SMS is rejected before the provider call instead of cutting a URL or footer", () => withProvider("texto", async () => {
  const sms = sender();
  const body = `Groutix: ${"a".repeat(1600)} ${quotes.buildQuoteSmsUrl(id)}`;
  const result = await sms.sendSms({ to: "0412345678", body });
  assert.equal(result.ok, false);
  assert.match(result.error, /links cannot be truncated/);
  assert.equal(sms.requests.length, 0);
  const shortBody = "Groutix: Booking confirmed.";
  const exactLength = formatting.prepareCustomerSms(shortBody, contact).length;
  assert.equal((await sms.sendSms({ to: "0412345678", body: shortBody, maxChars: exactLength - 1 })).ok, false);
  assert.equal((await sms.sendSms({ to: "0412345678", body: shortBody, maxChars: exactLength })).ok, true);
}));

test("contact loading failure still sends the read-only notice with default company contacts", () => withProvider("texto", async () => {
  const result = await sender({ failContent: true }).sendSms({ to: "0412345678", body: "Groutix: Hi Sam" });
  assert.equal(result.ok, true);
  assert.ok(result.body.endsWith(formatting.smsReplyNotice()));
}));

test("unconfigured SMS and empty messages make no provider calls", async () => {
  const original = envKeys.map((key) => process.env[key]);
  for (const key of envKeys) delete process.env[key];
  try {
    const sms = sender();
    assert.equal((await sms.sendSms({ to: "0412345678", body: "Hi" })).skipped, true);
    assert.equal((await sms.sendSms({ to: "0412345678", body: " " })).error, "missing_to_or_body");
    assert.equal(sms.requests.length, 0);
  } finally {
    envKeys.forEach((key, i) => {
      if (original[i] !== undefined) process.env[key] = original[i];
    });
  }
});

test("SMS booking URLs redirect to authenticated inspection and job booking pages", async () => {
  const route = loadTs("app/b/[type]/[id]/route.ts", {
    "next/server": { NextResponse: { redirect: (url) => new URL(url) } },
  });
  for (const type of ["inspection", "job"]) {
    const url = new URL(bookings.buildBookingSmsUrl(id, type));
    const target = await route.GET({ url: url.href, nextUrl: url }, { params: Promise.resolve({ id, type: type === "inspection" ? "i" : "j" }) });
    assert.equal(target.pathname, `/book/${type}/${id}`);
    assert.equal(bookings.verifyBookingToken(id, target.searchParams.get("token")), true);
  }
  const quote = new URL(quotes.buildQuoteSmsUrl(id));
  assert.equal(quote.pathname, `/quote/${id}`);
  assert.equal(quotes.verifyQuoteToken(id, quote.searchParams.get("token")), true);
});

test("CRM conversation records the complete SMS including its contact footer", async () => {
  const sentBody = formatting.prepareCustomerSms("Hi Sam", contact);
  let update;
  const api = loadTs("app/api/admin/lead/[id]/sms/route.ts", {
    "next/server": { NextResponse: { json: (body) => ({ body }) } },
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "staff" }) },
    "@/lib/submissions": { getSubmission: async () => ({ phone: "0412345678" }), appendActivity: async () => {} },
    "@/lib/sms": { isSmsConfigured: () => true, sendSms: async () => ({ ok: true, body: sentBody }) },
    "@/lib/mongodb": { getDb: async () => ({ collection: () => ({ updateOne: async (_filter, value) => { update = value; } }) }) },
  });
  const result = await api.POST({ cookies: { get: () => ({ value: "session" }) }, json: async () => ({ text: "Hi Sam" }) }, { params: Promise.resolve({ id }) });
  assert.equal(result.body.message.text, sentBody);
  assert.equal(update.$push.messages.text, sentBody);
});
