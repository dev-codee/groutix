import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { reorderItems } = loadTs("lib/reorderItems.ts");
const items = [
  { service: "Regrouting", scope: "Shower walls", qty: 2, price: 300, templateNo: "A" },
  { service: "Silicone", scope: "Perimeter joints", qty: 1, price: 120, templateNo: "B" },
  { service: "Tiling", scope: "Replace tile", qty: 3, price: 80, templateNo: "C" },
];
test("dropping item 1 at item 2 moves the complete row and preserves totals", () => {
  const result = reorderItems(items, 0, 1);
  assert.equal(result.map(item => item.templateNo).join(","), "B,A,C");
  assert.equal(result[1], items[0]);
  assert.equal(result.reduce((sum, item) => sum + item.qty * item.price, 0), 960);
  assert.equal(items[0].templateNo, "A");
});
test("moving in either direction produces a persistable sequence", () => {
  const result = reorderItems(items, 2, 0);
  assert.equal(JSON.parse(JSON.stringify({ quoteItems: result })).quoteItems.map(item => item.templateNo).join(","), "C,A,B");
  assert.equal(reorderItems(result, 0, 2).map(item => item.templateNo).join(","), "A,B,C");
});
test("self drops and invalid targets leave quote order unchanged", () => {
  for (const [from, to] of [[0,0],[-1,1],[1,3],[NaN,1]]) assert.equal(reorderItems(items, from, to), items);
});
