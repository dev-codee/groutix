import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function fixture() {
  const docs = new Map(), activities = [];
  const leadId = "507f1f77bcf86cd799439011";
  const leads = new Map([[leadId, { id: leadId, name: "Sam", email: "sam@example.test", phone: "0400000000", jobNo: "JOBNO-1618",
    status: "Quote Sent", quoteNumber: "QT-1618", quoteScope: "Original shower", quoteItems: [{ service: "Shower", qty: 1, price: 100 }],
    quoteTaxMode: "exclusive", quoteTaxRate: 10, quoteAmount: 110, quoteSentAt: "2026-10-15T09:00:00Z" }]]);
  let sequence = 0;
  const clone = value => value == null ? value : structuredClone(value);
  const matches = (doc, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === "object") {
      if ("$ne" in value) return doc[key] !== value.$ne;
      if ("$in" in value) return value.$in.includes(doc[key]);
    }
    return doc[key] === value;
  });
  const col = {
    async findOne(query) { return clone([...docs.values()].find(doc => matches(doc, query)) || null); },
    find(query) { return { sort: () => ({ toArray: async () => clone([...docs.values()].filter(doc => matches(doc, query))) }) }; },
    async updateOne(query, patch, options = {}) {
      let doc = [...docs.values()].find(doc => matches(doc, query));
      if (!doc && options.upsert) { doc = { ...query, ...clone(patch.$setOnInsert) }; docs.set(doc._id, doc); }
      if (!doc) return { matchedCount: 0 };
      for (const [path, value] of Object.entries(patch.$set || {})) {
        const [parent, child] = path.split(".");
        if (child) doc[parent][child] = clone(value); else doc[parent] = clone(value);
      }
      return { matchedCount: 1 };
    },
    async insertOne(doc) { assert.ok(!docs.has(doc._id)); docs.set(doc._id, clone(doc)); },
    async countDocuments(query) { return [...docs.values()].filter(doc => matches(doc, query)).length; },
  };
  const submissions = {
    getSubmission: async id => clone(leads.get(id) || null),
    updateSubmission: async (id, patch) => { assert.ok(leads.has(id)); Object.assign(leads.get(id), clone(patch)); return true; },
    appendActivity: async (id, entry) => { activities.push({ id, entry }); },
    getNextSequence: async () => ++sequence, formatDocNumber: (prefix, number) => `${prefix}-${number}`,
  };
  const api = loadTs("lib/customerQuotes.ts", {
    "./mongodb": { getDb: async () => ({ collection: name => { assert.equal(name, "customer_quotes"); return col; } }) },
    "./submissions": submissions,
  });
  return { api, docs, leads, leadId, submissions, activities };
}

test("multiple drafts keep independent items, totals, numbers and titles without changing the first quote", async () => {
  const { api, leadId, leads } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const second = await api.createCustomerQuote(leadId, original._id);
  const third = await api.createCustomerQuote(leadId);
  assert.notEqual(second._id, third._id);
  assert.notEqual(second.values.quoteNumber, third.values.quoteNumber);
  assert.equal(second.values.quoteSentAt, undefined);
  assert.equal(second.values.quoteSignature, undefined);
  assert.equal(third.values.quoteItems.length, 0);
  assert.equal(third.values.quoteTaxMode, "inclusive");
  assert.equal(second.values.quoteTaxMode, "exclusive");
  await api.saveCustomerQuote(leadId, second._id, { quoteScope: "Both showers", quoteItems: [{ service: "Two showers", price: 200, qty: 2 }], quoteAmount: 440 }, "Both showers");
  const list = await api.listCustomerQuotes(leadId);
  assert.equal(list.length, 3);
  assert.equal(list[1].title, "Both showers");
  assert.equal(list[1].values.quoteAmount, 440);
  assert.equal(list[0].values.quoteAmount, 110);
  assert.equal(list[2].values.quoteAmount, 0);
  assert.equal(leads.get(leadId).quoteAmount, 110);
  assert.equal(await api.saveCustomerQuote("another-customer", second._id, { quoteAmount: 999 }), false);
  assert.equal(await api.getQuoteSubmission(second._id), null);
});

test("sent links and signatures stay attached to their quote after a second quote is sent", async () => {
  const { api, leadId, leads } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const second = await api.createCustomerQuote(leadId, original._id);
  await api.saveCustomerQuote(leadId, second._id, { quoteScope: "New option", quoteAmount: 330 });
  await api.updateQuoteSubmission(second._id, { status: "Quote Sent", quoteSentAt: "2026-10-16T09:00:00Z" });
  assert.equal((await api.getQuoteSubmission(leadId)).quoteAmount, 110); // previously emailed links
  assert.equal((await api.getQuoteSubmission(second._id)).quoteAmount, 330);
  assert.equal(await api.saveCustomerQuote(leadId, second._id, { quoteAmount: 999 }), false);
  await api.updateQuoteSubmission(original._id, { status: "Won", quoteAcceptedAt: "now", quoteSignedAt: "now", quoteSignature: "signed-original" });
  assert.equal(leads.get(leadId).quoteAmount, 110);
  assert.equal((await api.getQuoteSubmission(second._id)).quoteSignature, undefined);
  assert.equal((await api.getQuoteSubmission(leadId)).quoteSignature, "signed-original");
  assert.equal((await api.getQuoteSubmission(second._id)).quoteSignedAt, undefined);
  await api.updateQuoteSubmission(second._id, { quoteOpenedAt: "opened-second" });
  assert.notEqual(leads.get(leadId).quoteOpenedAt, "opened-second");
});

test("a failed send can be retried and cannot race with draft edits", async () => {
  const { api, leadId } = fixture();
  const draft = await api.createCustomerQuote(leadId);
  assert.equal(await api.reserveCustomerQuoteSend(draft._id), true);
  assert.equal(await api.reserveCustomerQuoteSend(draft._id), false);
  assert.equal(await api.saveCustomerQuote(leadId, draft._id, { quoteScope: "Changed during send" }), false);
  assert.equal(await api.getQuoteSubmission(draft._id), null);
  await api.releaseCustomerQuoteSend(draft._id);
  assert.equal(await api.saveCustomerQuote(leadId, draft._id, { quoteScope: "Retry" }), true);
  assert.equal(await api.reserveCustomerQuoteSend(draft._id), true);
});

test("declining one option leaves another sent quote and the customer's job open", async () => {
  const { api, leadId, leads } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const second = await api.createCustomerQuote(leadId, original._id);
  await api.updateQuoteSubmission(second._id, { status: "Quote Sent", quoteSentAt: "now" });
  await api.updateQuoteSubmission(original._id, { status: "Lost", quoteDeclinedAt: "now" });
  assert.equal(leads.get(leadId).status, "Quote Sent");
  assert.equal((await api.getQuoteSubmission(second._id)).status, "Quote Sent");
  assert.equal((await api.getQuoteSubmission(original._id)).status, "Lost");
});

test("sending two quotes produces separate customer links and the selected PDF totals", async () => {
  const { api, leadId, submissions } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const second = await api.createCustomerQuote(leadId, original._id);
  await api.saveCustomerQuote(leadId, second._id, { quoteItems: [{ service: "Both showers", price: 200, qty: 2 }], quoteAmount: 440 });
  const emails = [], texts = [], pdfs = [];
  const tokens = loadTs("lib/quoteToken.ts");
  const pdf = { computeQuoteTotals: (items) => { const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0); return { subtotal, gst: subtotal * .1, total: subtotal * 1.1 }; },
    buildQuotePdfBase64: async args => { pdfs.push(args); return Buffer.from(JSON.stringify(args)).toString("base64"); } };
  const { POST } = loadTs("app/api/admin/quote/send/route.ts", {
    "@/lib/customerQuotes": api, "@/lib/submissions": submissions,
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "manager" }) },
    "@/lib/email": { isEmailConfigured: () => true, wrapEmailHtml: value => value, getEmailLogoUrl: async () => "", sendEmail: async email => emails.push(email) },
    "@/lib/sms": { sendSms: async sms => texts.push(sms) },
    "@/lib/quoteOpenTracking": { quoteTrackingPixel: () => "" }, "@/lib/quotePdf": pdf,
  }, { URLSearchParams });
  for (const quote of [original, second]) {
    const response = await POST({ cookies: { get: () => ({ value: "session" }) }, json: async () => ({ id: leadId, quoteId: quote._id }) });
    assert.equal(response.status, 200);
  }
  assert.equal(Math.round(pdfs[0].total), 110);
  assert.equal(Math.round(pdfs[1].total), 440);
  assert.ok(emails[0].html.includes(tokens.buildQuoteSignUrl(original._id)));
  assert.ok(emails[1].html.includes(tokens.buildQuoteSignUrl(second._id)));
  assert.ok(texts[1].body.includes(tokens.buildQuoteSignUrl(second._id)));
  assert.equal(tokens.verifyQuoteToken(second._id, tokens.signQuoteToken(original._id)), false);
  assert.equal((await api.getQuoteSubmission(original._id)).quoteAmount, 110); // Resending keeps the saved value, not floating-point recalculation noise.
});

test("the public PDF and signature routes resolve the selected quote and keep its signature independent", async () => {
  const { api, leadId } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const second = await api.createCustomerQuote(leadId, original._id);
  await api.saveCustomerQuote(leadId, second._id, { quoteScope: "Second option", quoteAmount: 220 });
  await api.updateQuoteSubmission(second._id, { status: "Quote Sent", quoteSentAt: "now" });
  const tokens = loadTs("lib/quoteToken.ts");
  const pdfs = [], bookingIds = [];
  const overrides = {
    "@/lib/customerQuotes": api,
    "@/lib/quotePdf": {
      computeQuoteTotals: () => ({ subtotal: 200, gst: 20, total: 220 }),
      buildQuotePdfBase64: async data => { pdfs.push(data); return Buffer.from("PDF fixture").toString("base64"); },
    },
    "@/lib/bookingToken": { buildBookingUrl: id => { bookingIds.push(id); return `https://groutix.com/book/${id}`; }, buildBookingSmsUrl: id => `https://groutix.com/b/${id}` },
    "@/lib/quoteOpenTracking": { recordQuoteOpen: async () => {} },
    "@/lib/email": { sendEmail: async () => {}, wrapEmailHtml: value => value, getEmailLogoUrl: async () => "" },
    "@/lib/sms": { sendSms: async () => {} },
  };
  const pdf = loadTs("app/api/quote/pdf/[id]/route.ts", overrides);
  const response = await pdf.GET({ nextUrl: new URL(`https://groutix.com/api/quote/pdf/${second._id}?token=${tokens.signQuoteToken(second._id)}`) }, { params: Promise.resolve({ id: second._id }) });
  assert.equal(response.status, 200);
  assert.equal(pdfs[0].quoteNumber, second.values.quoteNumber);
  assert.equal(pdfs[0].jobDescription, "Second option");
  const sign = loadTs("app/api/quote/sign/route.ts", overrides);
  const request = () => ({ headers: { get: () => "127.0.0.1" }, json: async () => ({ id: second._id, token: tokens.signQuoteToken(second._id), signatureDataUrl: "data:image/png;base64,signature", signerName: "Sam" }) });
  assert.equal((await sign.POST(request())).status, 200);
  assert.equal((await api.getQuoteSubmission(second._id)).quoteSignedName, "Sam");
  assert.equal((await api.getQuoteSubmission(original._id)).quoteSignedAt, undefined);
  assert.ok(bookingIds.every(id => id === leadId));
  const count = pdfs.length;
  assert.equal((await sign.POST(request())).status, 200);
  assert.equal(pdfs.length, count);
});


test("deleting quotes hides them permanently and revokes both modern and legacy links", async () => {
  const { api, leadId, leads } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const draft = await api.createCustomerQuote(leadId);
  assert.equal(await api.deleteCustomerQuote("another-customer", original._id), false);
  assert.equal(await api.deleteCustomerQuote(leadId, original._id), true);
  assert.equal((await api.listCustomerQuotes(leadId)).length, 1);
  assert.equal(await api.getQuoteSubmission(leadId), null);
  assert.equal(await api.getQuoteSubmission(original._id, true), null);
  assert.equal(await api.reserveCustomerQuoteSend(original._id), false);
  assert.equal(await api.updateQuoteSubmission(original._id, { quoteAcceptedAt: "now" }), false);
  assert.equal(leads.get(leadId).hasCustomerQuotes, true);
  assert.equal(await api.deleteCustomerQuote(leadId, draft._id), true);
  assert.deepEqual(await api.listCustomerQuotes(leadId), []);
  assert.equal(leads.get(leadId).hasCustomerQuotes, false);
  assert.equal(leads.get(leadId).name, "Sam");
  assert.equal(await api.deleteCustomerQuote(leadId, draft._id), false);
  const fresh = await api.createCustomerQuote(leadId);
  assert.ok(fresh);
  assert.equal((await api.listCustomerQuotes(leadId)).length, 1);
});

test("a quote being sent cannot be deleted", async () => {
  const { api, leadId } = fixture();
  const draft = await api.createCustomerQuote(leadId);
  assert.equal(await api.reserveCustomerQuoteSend(draft._id), true);
  assert.equal(await api.deleteCustomerQuote(leadId, draft._id), false);
  await api.releaseCustomerQuoteSend(draft._id);
  assert.equal(await api.deleteCustomerQuote(leadId, draft._id), true);
});

test("quote deletion requires authentication and a quote belonging to the customer", async () => {
  const { api, leadId } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  const { DELETE } = loadTs("app/api/admin/customer-quotes/[id]/route.ts", {
    "@/lib/customerQuotes": api,
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async value => value === "valid" ? { username: "manager" } : null },
  });
  const request = (quoteId, token = "valid") => ({ cookies: { get: () => ({ value: token }) }, json: async () => ({ quoteId }) });
  const context = { params: Promise.resolve({ id: leadId }) };
  assert.equal((await DELETE(request(original._id, "invalid"), context)).status, 401);
  assert.equal((await DELETE(request("other~original"), context)).status, 404);
  assert.equal((await DELETE(request(null), context)).status, 400);
  assert.equal((await DELETE(request(original._id), context)).status, 200);
  assert.equal((await DELETE(request(original._id), context)).status, 409);
});

test("accepted amount and signature survive sending or accepting another quote and resending the original", async () => {
  const { api, leadId, leads } = fixture();
  const original = (await api.listCustomerQuotes(leadId))[0];
  await api.updateQuoteSubmission(original._id, { quoteAcceptedAt: "accepted", quoteSignedAt: "signed", quoteSignature: "signature", status: "Won" });
  const saved = structuredClone(leads.get(leadId));
  const other = await api.createCustomerQuote(leadId);
  await api.updateQuoteSubmission(other._id, { quoteSentAt: "later", quoteAmount: 200, status: "Quote Sent" });
  assert.equal(leads.get(leadId).quoteAmount, saved.quoteAmount);
  assert.equal(leads.get(leadId).quoteSignature, saved.quoteSignature);
  await api.updateQuoteSubmission(other._id, { quoteAcceptedAt: "later-accepted", quoteSignedAt: "later-signed", quoteSignature: "other-signature", status: "Won" });
  assert.equal(leads.get(leadId).quoteAmount, saved.quoteAmount);
  assert.equal(leads.get(leadId).quoteSignature, saved.quoteSignature);
  await api.updateQuoteSubmission(original._id, { quoteSentAt: "resent", quoteAmount: 0, quoteItems: [], quoteSignature: "" });
  const unchanged = await api.getQuoteSubmission(original._id);
  assert.equal(unchanged.quoteAmount, saved.quoteAmount);
  assert.equal(unchanged.quoteItems.length, 1);
  assert.equal(unchanged.quoteSignature, saved.quoteSignature);
  assert.equal(await api.updateQuoteSubmission(original._id, { quoteDeclinedAt: "decline" }), false);
});
