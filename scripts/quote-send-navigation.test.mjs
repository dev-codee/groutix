import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("app/admin/page.tsx", "utf8");
const tree = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "handleSendQuoteEmail") handler = node.getText(tree);
  ts.forEachChild(node, visit);
}
visit(tree);

for (const ok of [true, false]) {
  test(`sending a quote preserves the inspection queue on ${ok ? "success" : "failure"}`, async () => {
    const lead = { id: "customer", email: "customer@example.com", status: "Inspection Completed" };
    let filter = "Inspection Completed", view = "leads", records = [lead], closed = false;
    const refreshes = [], published = [];
    const module = { exports: {} };
    vm.runInNewContext(ts.transpileModule(`${handler}; module.exports = handleSendQuoteEmail;`, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText, {
      module, activeQuoteLead: lead, activeCustomerQuote: { _id: "quote" },
      quoteTotals: () => ({ total: 100 }), quoteLeadDetails: () => ({}),
      quoteScope: "Scope", quoteItems: [], quoteTaxMode: "inclusive", quoteTaxRate: 10, quoteTerms: "Terms",
      updateLeadField: async () => true,
      fetch: async () => ({ ok, json: async () => ok
        ? { item: { ...lead, status: "Quote Sent" }, quoteNumber: "QT-1" }
        : { error: "Delivery failed" } }),
      leads: records, leadReadVersion: { current: 0 },
      setStatusFilter: update => { filter = update(filter); },
      statusFilterAfterChange: () => "Quote Sent",
      setCurrentView: next => { view = next; },
      setLeads: update => { records = update(records); },
      publishCrmChange: item => published.push(item),
      setQuoteModalOpen: open => { closed = !open; },
      loadData: async options => refreshes.push(options), alert() {},
    });
    await module.exports();
    assert.equal(filter, "Inspection Completed");
    assert.equal(view, "leads");
    assert.equal(closed, ok);
    assert.equal(records[0].status, ok ? "Quote Sent" : "Inspection Completed");
    assert.equal(published.length, ok ? 1 : 0);
    assert.equal(refreshes.length, ok ? 1 : 0);
    if (ok) assert.equal(refreshes[0].silent, true);
  });
}
