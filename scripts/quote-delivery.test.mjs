import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadTs } from "./test-ts-loader.mjs";
const { quoteDeliveryTimes } = loadTs("lib/quoteDelivery.ts");

test("legacy emailed quotes use the genuine send activity rather than edit time", () => {
  const times = quoteDeliveryTimes({ quoteUpdated: "2026-10-12", activity: [{ action: "Quote emailed", time: "2026-10-10" }] });
  assert.equal(times.sentAt, "2026-10-10");
  assert.equal(times.openedAt, undefined);
});
test("quote delivery uses the same rendered status layout as invoices", () => {
  const { DocumentDeliveryStatus } = loadTs("components/admin/DocumentDeliveryStatus.tsx");
  for (const openedAt of [undefined, "2026-10-10T12:00:00Z"]) {
    const props = { sentAt: "2026-10-10T11:00:00Z", openedAt };
    const quote = renderToStaticMarkup(createElement(DocumentDeliveryStatus, { ...props, label: "Quote" }));
    const invoice = renderToStaticMarkup(createElement(DocumentDeliveryStatus, { ...props, label: "Invoice" }));
    assert.equal(quote.replaceAll("Quote", "Invoice"), invoice);
    assert.match(quote, openedAt ? /emerald-50/ : /Not opened yet/);
  }
});
test("first quote open is recorded once and unsent drafts stay untracked", async () => {
  let lead = { id: "lead-1", quoteNumber: "QT-1", quoteSentAt: "2026-10-10T11:00:00Z" };
  const writes = [], activities = [];
  const { recordQuoteOpen, quoteTrackingPixel } = loadTs("lib/quoteOpenTracking.ts", {
    "./submissions": { getSubmission: async () => lead, updateSubmission: async (_id, updates) => { writes.push(updates); lead = { ...lead, ...updates }; }, appendActivity: async (_id, entry) => activities.push(entry) },
  });
  assert.match(quoteTrackingPixel("lead-1"), /\/api\/track\/quote\/lead-1\?token=/);
  await recordQuoteOpen("lead-1");
  await recordQuoteOpen("lead-1");
  assert.equal(writes.length, 1);
  assert.equal(activities[0].action, "Quote opened");
  lead = { id: "draft" };
  await recordQuoteOpen("draft");
  assert.equal(writes.length, 1);
});
test("the public pixel ignores invalid tokens and returns an uncached image", async () => {
  let opens = 0;
  const { GET } = loadTs("app/api/track/quote/[id]/route.ts", {
    "@/lib/quoteToken": { verifyQuoteToken: (_id, token) => token === "valid" },
    "@/lib/quoteOpenTracking": { recordQuoteOpen: async () => { opens++; } },
  });
  for (const token of ["invalid", "valid"]) {
    const response = await GET({ nextUrl: new URL(`https://example.com?token=${token}`) }, { params: Promise.resolve({ id: "lead-1" }) });
    assert.equal(response.headers.get("Content-Type"), "image/gif");
    assert.match(response.headers.get("Cache-Control"), /no-store/);
  }
  assert.equal(opens, 1);
});
