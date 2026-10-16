import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { quoteUnitPriceExGst } = loadTs("lib/quotePricing.ts");
const { computeQuoteTotals } = loadTs("lib/quotePdf.ts");

test("$1,000 inclusive shows $909.09 before GST, $90.91 GST and $1,000 total", () => {
  const items = [{ price: 1000, qty: 1 }];
  const net = quoteUnitPriceExGst(items[0].price, "inclusive", 10);
  const totals = computeQuoteTotals(items, "inclusive", 10);
  assert.equal(net.toFixed(2), "909.09");
  assert.equal(totals.subtotal.toFixed(2), "909.09");
  assert.equal(totals.gst.toFixed(2), "90.91");
  assert.equal(totals.total, 1000);
  assert.equal(items[0].price, 1000);
});

test("net prices reconcile before rounding across quantities, multiple items and tax modes", () => {
  const items = [{ price: 1000, qty: 3 }, { price: 275, qty: 2 }];
  for (const mode of ["inclusive", "exclusive", "none"]) {
    for (const rate of [0, 5, 10, 15]) {
      const net = items.reduce((sum, item) => sum + quoteUnitPriceExGst(item.price, mode, rate) * item.qty, 0);
      const totals = computeQuoteTotals(items, mode, rate);
      assert.ok(Math.abs(net - totals.subtotal) < 1e-8);
      assert.equal(totals.total, mode === "exclusive" ? Math.round(3550 + 3550 * rate / 100) : 3550);
      assert.ok(Math.abs(net + totals.gst - (mode === "exclusive" ? 3550 * (1 + rate / 100) : 3550)) < 1e-8);
    }
  }
  assert.equal(items[0].price, 1000);
  assert.equal(quoteUnitPriceExGst(undefined, "inclusive", 10), 0);
  assert.equal(quoteUnitPriceExGst(1000, undefined, 10), 1000);
});


test("decimal inclusive prices retain full precision until display", () => {
  const net = quoteUnitPriceExGst(999.99, "inclusive", 10);
  assert.equal(net.toFixed(2), "909.08");
  assert.ok(Math.abs(net * 1.1 - 999.99) < 1e-9);
  assert.equal(quoteUnitPriceExGst(999.99, "exclusive", 10), 999.99);
});
