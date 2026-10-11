import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { loadTs } from "./test-ts-loader.mjs";
const { quoteLeadDetails } = loadTs("lib/quoteLeadDetails.ts");
const source = fs.readFileSync("app/admin/page.tsx", "utf8");
const tree = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = new Map();
const visit = node => { if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node.getText(tree)); ts.forEachChild(node, visit); };
visit(tree);
const compiled = ts.transpileModule(`${functions.get("quoteTotals")}\n${functions.get("handleSaveQuote")}\nmodule.exports = handleSaveQuote;`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
function handler({ tenants = null, preparationError = false } = {}) {
  const state = { saving: false, error: "", closed: false, writes: [] };
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, Error, activeQuoteLead: { id: "lead-1", name: "Homeowner", tenants }, quoteSaving: false,
    quoteItems: [{ service: "Regrouting", price: 100, qty: 2 }], quoteTaxMode: "exclusive", quoteTaxRate: 10,
    quoteScope: "Scope", quoteTerms: "Terms", quoteLeadDetails: preparationError ? () => { throw new Error("Invalid lead data"); } : quoteLeadDetails,
    setQuoteSaving: value => { state.saving = value; }, setQuoteSaveError: value => { state.error = value; },
    setQuoteModalOpen: value => { state.closed = !value; },
    updateLeadField: async (id, updates) => { state.writes.push({ id, updates }); return true; },
  });
  return { state, run: module.exports };
}
test("real Save Quote handler saves a homeowner whose tenant field is null and clears loading", async () => {
  const fixture = handler();
  await fixture.run();
  assert.equal(fixture.state.writes.length, 1);
  assert.equal(fixture.state.writes[0].updates.quoteAmount, 220);
  assert.equal(fixture.state.saving, false);
  assert.equal(fixture.state.closed, true);
});
test("payload preparation errors leave the quote open, show an error and always clear loading", async () => {
  const fixture = handler({ preparationError: true });
  await fixture.run();
  assert.equal(fixture.state.saving, false);
  assert.equal(fixture.state.closed, false);
  assert.match(fixture.state.error, /Invalid lead data/);
});
