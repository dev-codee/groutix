import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const leadId = "507f1f77bcf86cd799439011";
const otherLeadId = "507f1f77bcf86cd799439012";
const tokenFrom = (url) => new URL(url).pathname.split("/").at(-1);
const json = (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers });

function matches(doc, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === "$or") return value.some((item) => matches(doc, item));
    if (value && typeof value === "object" && "$gt" in value) return doc[key] > value.$gt;
    return String(doc[key]) === String(value);
  });
}

function fixture() {
  const docs = [];
  const staff = [];
  const leads = [
    { _id: leadId, status: "Inspection En Route", name: "Sam", phone: "0412345678", email: "sam@example.test" },
    { _id: otherLeadId, status: "Job En Route", name: "Jo" },
  ];
  const indexes = [];
  const makeCollection = (rows) => ({
    createIndex: async (...args) => indexes.push(args),
    createIndexes: async () => {},
    insertOne: async (doc) => { rows.push(doc); },
    findOne: async (filter) => rows.find((doc) => matches(doc, filter)) || null,
    updateMany: async (filter, update) => {
      for (const doc of rows.filter((item) => matches(item, filter))) Object.assign(doc, update.$set);
    },
    updateOne: async (filter, update, options = {}) => {
      let doc = rows.find((item) => matches(item, filter));
      if (!doc && options.upsert) { doc = { ...filter }; rows.push(doc); }
      if (doc && update.$set) Object.assign(doc, update.$set);
      if (doc && update.$push) doc.messages = update.$push.messages.$each;
      return { matchedCount: doc ? 1 : 0 };
    },
  });
  const db = { collection: (name) => makeCollection(name === "customer_tracking" ? docs : name === "staff_locations" ? staff : leads) };
  const tracking = loadTs("lib/customerTrackingServer.ts", { "@/lib/mongodb": { getDb: async () => db } });
  return { docs, staff, leads, indexes, db, tracking };
}

test("unguessable visit link returns only its specialist's current location", async () => {
  const f = fixture();
  const url = await f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9);
  const token = tokenFrom(url);
  assert.match(token, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(f.indexes[0][1].expireAfterSeconds, 0);
  await f.tracking.publishCustomerLocation("other-staff", -38, 145);
  assert.equal((await f.tracking.getCustomerTracking(token)).location.lat, -37.7);
  await f.tracking.publishCustomerLocation("inspector", -37.8, 144.8);
  const view = await f.tracking.getCustomerTracking(token);
  assert.equal(view.location.lat, -37.8);
  assert.deepEqual(Object.keys(view).sort(), ["location", "status"]);
  assert.deepEqual(Object.keys(view.location).sort(), ["lat", "lng", "updatedAt"]);
  assert.equal(await f.tracking.getCustomerTracking("bad-token"), null);
  assert.equal(await f.tracking.getCustomerTracking("a".repeat(32)), null);
});

test("new journey revokes previous customer's access before further GPS updates", async () => {
  const f = fixture();
  const oldToken = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9));
  const newToken = tokenFrom(await f.tracking.startCustomerTracking(otherLeadId, "inspector", -38, 145));
  await f.tracking.publishCustomerLocation("inspector", -38.1, 145.1);
  assert.equal((await f.tracking.getCustomerTracking(oldToken)).status, "ended");
  assert.equal((await f.tracking.getCustomerTracking(oldToken)).location, null);
  assert.equal((await f.tracking.getCustomerTracking(newToken)).location.lat, -38.1);
});

test("overlapping notifications cannot leave two customers tracking the same staff member", async () => {
  const f = fixture();
  const urls = await Promise.all([
    f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9),
    f.tracking.startCustomerTracking(otherLeadId, "inspector", -38, 145),
  ]);
  const views = await Promise.all(urls.map((url) => f.tracking.getCustomerTracking(tokenFrom(url))));
  assert.equal(views.filter((view) => view.location).length, 1);
});

test("arrival, cancellation and expiry hide coordinates and never resume the old journey", async () => {
  for (const status of ["Inspection Arrived", "Job Arrived", "Cancelled", "Completed"]) {
    const f = fixture();
    const token = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9));
    f.leads[0].status = status;
    assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
    f.leads[0].status = "Inspection En Route";
    assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
  }
  const f = fixture();
  const token = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9));
  f.docs[0].expiresAt = new Date(Date.now() - 1);
  assert.equal((await f.tracking.getCustomerTracking(token)).status, "expired");
  assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
});

test("missing or stale GPS waits for fresh coordinates instead of presenting an old position as live", async () => {
  const f = fixture();
  const token = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", null, null));
  assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
  await f.tracking.publishCustomerLocation("inspector", -37.7, 144.9);
  assert.ok((await f.tracking.getCustomerTracking(token)).location);
  f.docs[0].location.updatedAt = new Date(Date.now() - 121000);
  assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
  await f.tracking.publishCustomerLocation("inspector", NaN, 144.9);
  assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
});

test("an old link stays revoked if staff arrive without notifying and later revisit the same customer", async () => {
  const f = fixture();
  const token = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9));
  const submissions = loadTs("lib/submissions.ts", {
    "@/lib/mongodb": { getDb: async () => f.db },
    "@/lib/users": {},
  });
  // Arrival was saved while no customer browser was polling. The lead can
  // subsequently return to en route, but the old journey must remain closed.
  assert.equal(await submissions.updateSubmission(leadId, { status: "Inspection Arrived" }), true);
  assert.equal(await submissions.updateStatus(leadId, "Inspection En Route"), true);
  assert.equal((await f.tracking.getCustomerTracking(token)).status, "ended");
  assert.equal((await f.tracking.getCustomerTracking(token)).location, null);
});

test("authenticated staff location endpoint feeds the customer journey; invalid coordinates are rejected", async () => {
  const f = fixture();
  const token = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", null, null));
  let session = { username: "inspector" };
  const route = loadTs("app/api/admin/staff/location/route.ts", {
    "next/server": { NextResponse: { json } },
    "@/lib/adminAuth": { verifyRequestSession: async () => session },
    "@/lib/mongodb": { getDb: async () => f.db },
    "@/lib/customerTrackingServer": f.tracking,
  });
  const post = (body) => route.POST({ json: async () => body });
  assert.equal((await post({ lat: -37.8, lng: 145 })).status, 200);
  assert.equal((await f.tracking.getCustomerTracking(token)).location.lat, -37.8);
  for (const body of [null, { lat: 91, lng: 145 }, { lat: -37, lng: Infinity }, { lat: "-37", lng: 145 }]) {
    assert.equal((await post(body)).status, 400);
  }
  session = null;
  assert.equal((await post({ lat: -37, lng: 145 })).status, 403);
});

test("public location endpoint is uncached and has no login or staff-directory dependency", async () => {
  const f = fixture();
  const token = tokenFrom(await f.tracking.startCustomerTracking(leadId, "inspector", -37.7, 144.9));
  const route = loadTs("app/api/track/location/[token]/route.ts", {
    "next/server": { NextResponse: { json } },
    "@/lib/customerTrackingServer": f.tracking,
  });
  const result = await route.GET({}, { params: Promise.resolve({ token }) });
  assert.equal(result.status, 200);
  assert.match(result.headers["Cache-Control"], /no-store/);
  assert.equal(result.headers["Referrer-Policy"], "no-referrer");
  assert.equal((await route.GET({}, { params: Promise.resolve({ token: "bad" }) })).status, 404);
});

function notificationFixture(f, { emailGate = Promise.resolve() } = {}) {
  const sms = [];
  const emails = [];
  let session = { username: "inspector" };
  const formatting = loadTs("lib/smsMessage.ts");
  const route = loadTs("app/api/admin/on-the-way/route.ts", {
    "next/server": { NextResponse: { json } },
    "@/lib/adminAuth": { verifyRequestSession: async () => session },
    "@/lib/submissions": { getSubmission: async () => f.leads[0], appendActivity: async () => {} },
    "@/lib/mongodb": { getDb: async () => f.db },
    "@/lib/customerTrackingServer": f.tracking,
    "@/lib/geocode": { geocodeAddress: async () => null },
    "@/lib/sms": { sendSms: async (args) => { sms.push(args); return { ok: true, body: formatting.prepareCustomerSms(args.body) }; } },
    "@/lib/email": { getEmailLogoUrl: async () => "", wrapEmailHtml: (html) => html, sendEmail: async (args) => { emails.push(args); await emailGate; } },
  });
  return {
    sms, emails,
    setSession: (value) => { session = value; },
    post: (body = {}) => route.POST({ json: async () => ({ leadId, lat: null, lng: null, eventType: "en_route", ...body }) }),
  };
}

test("on-the-way email and SMS carry the same live link and conversation retains the SMS reply footer", async () => {
  const f = fixture();
  const n = notificationFixture(f);
  const result = await n.post({ lat: -37.7, lng: 144.9 });
  assert.equal(result.status, 200);
  const { trackingUrl, messages } = result.body;
  assert.ok(n.sms[0].body.includes(trackingUrl));
  assert.ok(n.emails[0].html.includes(`href="${trackingUrl}"`));
  assert.ok(messages.find((message) => message.channel === "sms").text.includes("This SMS is read-only."));
  assert.ok(messages.every((message) => message.text.includes(trackingUrl)));
  await n.post({ eventType: "arrived" });
  assert.equal((await f.tracking.getCustomerTracking(tokenFrom(trackingUrl))).status, "arrived");
  assert.equal(n.sms[1].body.includes("/track/"), false);
});

test("notification handler waits for email delivery before completing the response", async () => {
  const f = fixture();
  let release;
  const emailGate = new Promise((resolve) => { release = resolve; });
  const n = notificationFixture(f, { emailGate });
  let finished = false;
  const pending = n.post().then((result) => { finished = true; return result; });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(n.emails.length, 1);
  assert.equal(finished, false);
  release();
  assert.equal((await pending).status, 200);
});

test("notification endpoint rejects invalid events, coordinates and unauthenticated requests", async () => {
  const n = notificationFixture(fixture());
  for (const body of [{ eventType: "invalid" }, { leadId: "bad" }, { lat: 100, lng: 0 }, { lat: 0, lng: null }]) {
    assert.equal((await n.post(body)).status, 400);
  }
  n.setSession(null);
  assert.equal((await n.post()).status, 403);
  assert.equal(n.sms.length, 0);
});
