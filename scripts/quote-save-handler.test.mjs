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
const compiled = ts.transpileModule(`${functions.get("quoteTotals")}\n${functions.get("openQuoteModal")}\n${functions.get("closeQuoteModal")}\n${functions.get("handleSaveQuote")}\nmodule.exports = { run: handleSaveQuote, open: openQuoteModal, close: closeQuoteModal };`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
function handler({ tenants = null, preparationError = false, save, saving = false } = {}) {
  const state = { saving, error: "", closed: false, writes: [] };
  const module = { exports: {} };
  const context = { module, Error, quoteSaveSession: { current: 0 }, quoteSaveInFlight: { current: saving ? 0 : null }, activeQuoteLead: { id: "lead-1", name: "Homeowner", tenants }, quoteSaving: saving,
    quoteItems: [{ service: "Regrouting", price: 100, qty: 2 }], quoteTaxMode: "exclusive", quoteTaxRate: 10,
    quoteScope: "Scope", quoteTerms: "Terms", quoteLeadDetails: preparationError ? () => { throw new Error("Invalid lead data"); } : quoteLeadDetails,
    setQuoteSaving: value => { state.saving = value; context.quoteSaving = value; }, setQuoteSaveError: value => { state.error = value; },
    setQuoteModalOpen: value => { state.closed = !value; },
    clearQuoteDrag() {}, setQuoteOrderNotice() {}, setQuoteFullscreen() {},
    DEFAULT_QUOTE_CONDITIONS: "Terms", getMatchedQuoteItemsForLead: () => context.quoteItems,
    setActiveQuoteLead: value => { context.activeQuoteLead = value; },
    setQuoteItems: value => { context.quoteItems = value; },
    setQuoteTaxMode: value => { context.quoteTaxMode = value; },
    setQuoteTaxRate: value => { context.quoteTaxRate = value; },
    setQuoteTerms: value => { context.quoteTerms = value; },
    setQuoteScope: value => { context.quoteScope = value; },
    updateLeadField: async (id, updates, onError) => { state.writes.push({ id, updates }); return save ? save(id, updates, onError) : true; },
  };
  Object.defineProperty(state, "saving", { get: () => context.quoteSaveInFlight.current === context.quoteSaveSession.current });
  vm.runInNewContext(compiled, context);
  return { state, ...module.exports };
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

test("opening a quote clears carried loading without sending a save request", () => {
  const fixture = handler({ saving: true });
  fixture.open({ id: "lead-2", name: "Next customer" });
  assert.equal(fixture.state.saving, false);
  assert.equal(fixture.state.closed, false);
  assert.equal(fixture.state.writes.length, 0);
});
test("a previous quote save cannot close a newly opened quote", async () => {
  let resolve;
  const fixture = handler({ save: () => new Promise(done => { resolve = done; }) });
  const pending = fixture.run();
  assert.equal(fixture.state.saving, true);
  fixture.close();
  fixture.open({ id: "lead-2", name: "Next customer" });
  resolve(true);
  await pending;
  assert.equal(fixture.state.closed, false);
  assert.equal(fixture.state.saving, false);
});
test("double clicking Save sends only one request", async () => {
  let resolve;
  const fixture = handler({ save: () => new Promise(done => { resolve = done; }) });
  const pending = fixture.run();
  await fixture.run();
  assert.equal(fixture.state.writes.length, 1);
  resolve(true);
  await pending;
  assert.equal(fixture.state.saving, false);
});
test("a previous failed request cannot overwrite the new quote's error or loading state", async () => {
  let finish;
  const fixture = handler({ save: (_id, _updates, onError) => new Promise(done => { finish = () => { onError("Database unavailable"); done(false); }; }) });
  const pending = fixture.run();
  fixture.open({ id: "lead-2", name: "Next customer" });
  finish();
  await pending;
  assert.equal(fixture.state.error, "");
  assert.equal(fixture.state.saving, false);
  assert.equal(fixture.state.closed, false);
});
