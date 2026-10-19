import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { quoteSendHistory } = loadTs("lib/quoteDelivery.ts");
const { SentQuoteHistory, QuoteDeliveryHistory } = loadTs("components/admin/QuoteDeliveryHistory.tsx");

test("all previous sends and resends remain visible in date order without mutating lead activity", () => {
  const lead = { quoteSentAt: "2026-10-19T10:00:00Z", activity: [
    { action: "Quote emailed", time: "2026-10-15T09:00:00Z", detail: "QT-1 to customer" },
    { action: "Notes updated", time: "2026-10-17T09:00:00Z" },
    { action: "Quote emailed", time: "2026-10-18T09:00:00Z", detail: "QT-1 to customer" },
    { action: "Quote emailed", time: "2026-10-19T10:00:00Z", detail: "QT-2 to customer" },
  ] };
  const before = JSON.stringify(lead);
  assert.deepEqual(Array.from(quoteSendHistory(lead), entry => entry.time), ["2026-10-19T10:00:00Z", "2026-10-18T09:00:00Z", "2026-10-15T09:00:00Z"]);
  assert.equal(JSON.stringify(lead), before);
  assert.equal(quoteSendHistory({ quoteSentAt: "2026-10-19T10:00:00Z" }).length, 1);
});

test("history renders every saved sent quote with independent PDF and open status, excluding drafts and deleted quotes", () => {
  const quotes = [
    { _id: "lead~old", title: "First option", state: "accepted", values: { quoteNumber: "QT-1", quoteSentAt: "2026-10-15T09:00:00Z", quoteOpenedAt: "2026-10-15T10:00:00Z" } },
    { _id: "lead~new", title: "Second option", state: "sent", values: { quoteNumber: "QT-2", quoteSentAt: "2026-10-19T10:00:00Z" } },
    { _id: "lead~declined", title: "Declined option", state: "declined", values: { quoteNumber: "QT-0", quoteSentAt: "2026-10-14T09:00:00Z" } },
    { _id: "lead~draft", title: "Unsent draft", state: "draft", values: {} },
    { _id: "lead~deleted", title: "Deleted quote", state: "deleted", values: {} },
  ];
  const html = renderToStaticMarkup(createElement(SentQuoteHistory, { lead: { id: "lead" }, quotes }));
  for (const reference of ["old", "new", "declined"]) assert.ok(html.includes(`quoteId=lead~${reference}`));
  assert.ok(html.indexOf("QT-2") < html.indexOf("QT-1"));
  assert.match(html, /Not opened yet/);
  assert.match(html, /accepted/);
  assert.doesNotMatch(html, /Unsent draft|Deleted quote/);
  assert.equal(quotes[0]._id, "lead~old");
});

test("legacy send activity remains readable even without saved quote versions", () => {
  const html = renderToStaticMarkup(createElement(SentQuoteHistory, { lead: { id: "lead", activity: [
    { action: "Quote emailed", time: "2026-10-15T09:00:00Z", detail: "QT-previous to customer" },
    { action: "Quote emailed", time: "2026-10-19T09:00:00Z", detail: "QT-latest to customer" },
  ] }, quotes: [] }));
  assert.match(html, /QT-previous/);
  assert.match(html, /QT-latest/);
  assert.doesNotMatch(html, /View quote PDF/);
});

test("the delivery summary provides access to previous quotes without loading every customer on mount", () => {
  const html = renderToStaticMarkup(createElement(QuoteDeliveryHistory, { lead: { id: "lead", quoteSentAt: "2026-10-19T09:00:00Z" } }));
  assert.match(html, /View quote history/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Quote Sent/);
});
