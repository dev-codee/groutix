import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { hasAcceptedQuote, isQuoteWaiting, matchesQuoteStatusFilter, QUOTE_ACCEPTED_FILTER, QUOTE_WAITING_FILTER } = loadTs("lib/quoteAcceptance.ts");

test("accepted quotes remain counted after their leads progress beyond Won", () => {
  for (const status of ["Job Booked", "Inspection Booked", "Payment Pending", "Payment Received", "Completed"]) {
    for (const evidence of [{ quoteAcceptedAt: "2026-10-25" }, { quoteSignedAt: "2026-10-25" }, { quoteSignature: "signature" }, { acceptedCustomerQuoteCount: 1 }]) {
      const lead = { status, ...evidence };
      assert.equal(hasAcceptedQuote(lead), true);
      assert.equal(matchesQuoteStatusFilter(lead, QUOTE_ACCEPTED_FILTER), true);
      assert.equal(isQuoteWaiting(lead), false);
    }
  }
  assert.equal(hasAcceptedQuote({ status: "Won" }), true);
  assert.equal(hasAcceptedQuote({ status: "Quote Accepted" }), true);
  assert.equal(hasAcceptedQuote({ status: "Job Booked" }), false);
});

test("accepted quotes cannot remain in the waiting card or its destination list", () => {
  const leads = [
    { status: "Quote Sent", quoteSignedAt: "2026-10-25" },
    { status: "Negotiation", acceptedCustomerQuoteCount: 2 },
    { status: "Quote Sent" },
    { status: "Negotiation" },
    { status: "Job Booked", quoteAcceptedAt: "2026-10-25" },
  ];
  assert.equal(leads.filter(hasAcceptedQuote).length, 3, "multiple accepted quotes count once per customer");
  assert.equal(leads.filter(isQuoteWaiting).length, 2);
  for (const lead of leads) {
    assert.equal(matchesQuoteStatusFilter(lead, QUOTE_ACCEPTED_FILTER), hasAcceptedQuote(lead));
    assert.equal(matchesQuoteStatusFilter(lead, QUOTE_WAITING_FILTER), isQuoteWaiting(lead));
  }
  assert.equal(matchesQuoteStatusFilter({ status: "Scheduled" }, "Job Booked|Scheduled|Job Confirmed"), true);
});

test("admin list loads accepted quote records even when the lead has no acceptance fields", async () => {
  const docs = [
    { _id: "507f1f77bcf86cd799439011", status: "Job Booked", createdAt: new Date() },
    { _id: "507f1f77bcf86cd799439012", status: "Quote Sent", createdAt: new Date() },
  ];
  const quotes = [
    { leadId: docs[0]._id, state: "accepted" },
    { leadId: docs[0]._id, state: "accepted" },
    { leadId: docs[1]._id, state: "draft" },
    { leadId: docs[1]._id, state: "deleted" },
    { leadId: "unrelated-customer", state: "accepted" },
  ];
  const calls = [];
  const { listSubmissions } = loadTs("lib/submissions.ts", {
    "@/lib/mongodb": { getDb: async () => ({ collection: name => {
      if (name === "submissions") return {
        createIndexes: async () => [],
        find: () => { const cursor = { sort: () => cursor, skip: () => cursor, limit: () => cursor, toArray: async () => docs }; return cursor; },
        countDocuments: async () => docs.length,
      };
      if (name === "bookings") return { find: () => ({ toArray: async () => [] }) };
      assert.equal(name, "customer_quotes");
      return { find: query => {
        calls.push(query);
        return { toArray: async () => quotes.filter(quote => query.leadId.$in.includes(quote.leadId) && quote.state === query.state) };
      } };
    } }) },
    "@/lib/users": {},
  });
  const result = await listSubmissions({});
  assert.equal(result.items[0].acceptedCustomerQuoteCount, 2);
  assert.equal(hasAcceptedQuote(result.items[0]), true);
  assert.equal(result.items[1].acceptedCustomerQuoteCount, 0);
  assert.equal(hasAcceptedQuote(result.items[1]), false);
  assert.equal(calls.length, 1, "one bulk quote lookup per list, not one request per customer");
});
