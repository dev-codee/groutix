import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";
const { ScopeOfWorkPanel } = loadTs("components/admin/ScopeOfWorkPanel.tsx");
const lead = {
  id: "inspection-1", status: "Inspection Booked", createdAt: "2026-10-17",
  quoteScope: "Repair both shower areas", quoteTerms: "Keep the shower dry for 24 hours.",
  quoteItems: [
    { code: "GROUT-1", service: "Regrouting", description: "Main bathroom", scope: "• Remove damaged grout\n• Apply new grout", qty: 2, price: 9876.54 },
    { service: "Silicone replacement", scope: "• Seal the perimeter", qty: 1, price: 1234.56 },
  ],
  quoteAmount: 20987.65, quoteTaxRate: 10,
  inspectionNotes: "Check access before starting", technicianNotes: "Technician only note",
};
const render = (value) => renderToStaticMarkup(createElement(ScopeOfWorkPanel, {
  lead: value, readOnly: true, defaultOpen: true, notesField: "inspectionNotes", onSaveNotes: () => {},
}));
test("inspection scope includes the description, every item, quantities and quote notes without pricing", () => {
  const html = render(lead);
  for (const text of [lead.quoteScope, lead.quoteTerms, "GROUT-1", "Regrouting", "Main bathroom", "Remove damaged grout", "Apply new grout", "Quantity: 2", "Silicone replacement", "Seal the perimeter", lead.inspectionNotes, "Read-Only"]) assert.ok(html.includes(text), text);
  for (const hidden of ["9876.54", "1234.56", "20987.65", "UNIT PRICE", "TOTAL PRICE", "Edit Scope of Work", "Technician only note"]) assert.equal(html.includes(hidden), false, hidden);
  assert.ok(html.includes("Edit Note"));
  assert.equal(html.includes("textarea"), false);
});
test("inspection can add notes even before a scope or quote exists", () => {
  const html = render({ id: "empty", status: "New", createdAt: "2026-10-17" });
  assert.ok(html.includes("No scope details specified."));
  assert.ok(html.includes("Add Extra Note"));
});
