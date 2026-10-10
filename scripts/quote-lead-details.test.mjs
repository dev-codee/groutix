import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";
const { QuoteLeadDetailsForm } = loadTs("components/admin/QuoteLeadDetailsForm.tsx");
const { quoteLeadDetails, isPropertyManagerLead } = loadTs("lib/quoteLeadDetails.ts");
const lead = { id: "pm-1", status: "New", createdAt: "2026-10-10", customerType: "Property Manager", name: "Test Manager", agency: "Test Agency", email: "manager@example.test", phone: "0300000000", address: "Test property address", tenants: [
  { name: "First Tenant", phone: "0400000001", email: "tenant1@example.test" },
  { name: "Second Tenant", phone: "0400000002", email: "tenant2@example.test" },
] };
function nodes(root) {
  const result = [];
  const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return;
    result.push(node); visit(node.props?.children); };
  visit(root); return result;
}
test("property manager quote form shows agency, manager, property and every tenant", () => {
  const html = renderToStaticMarkup(createElement(QuoteLeadDetailsForm, { lead, onChange: () => {} }));
  for (const value of ["Property Manager Lead", "Manager Email", "Test Agency", "Test property address", "First Tenant", "Second Tenant", "tenant2@example.test"]) assert.ok(html.includes(value));
});
test("tenant edits preserve manager contact, other tenants and the original lead", () => {
  let edited;
  const tree = QuoteLeadDetailsForm({ lead, onChange: next => { edited = next; } });
  nodes(tree).find(node => node.props?.["aria-label"] === "Tenant 2 Phone").props.onChange({ target: { value: "0499999999" } });
  assert.equal(edited.tenants[1].phone, "0499999999");
  assert.equal(edited.email, "manager@example.test");
  assert.equal(edited.tenants[0], lead.tenants[0]);
  assert.equal(lead.tenants[1].phone, "0400000002");
  const persisted = quoteLeadDetails(edited);
  assert.equal(persisted.agency, "Test Agency");
  assert.equal(persisted.tenants[1].phone, "0499999999");
  assert.equal(persisted.name, lead.name);
});
test("manager leads with no tenant data show an empty state and can add tenants", () => {
  let edited;
  const empty = { ...lead, tenants: [] };
  const tree = QuoteLeadDetailsForm({ lead: empty, onChange: next => { edited = next; } });
  nodes(tree).find(node => node.type === "button" && node.props.disabled === false).props.onClick();
  assert.equal(edited.tenants.length, 1);
  assert.match(renderToStaticMarkup(createElement(QuoteLeadDetailsForm, { lead: empty, onChange: () => {} })), /No tenant details provided/);
});
test("ordinary homeowners retain the standard customer form; legacy agency leads are recognized", () => {
  const homeowner = { id: "home-1", status: "New", createdAt: "2026-10-10", name: "Homeowner" };
  const html = renderToStaticMarkup(createElement(QuoteLeadDetailsForm, { lead: homeowner, onChange: () => {} }));
  assert.ok(html.includes("Customer Name"));
  assert.equal(html.includes("Tenant Details"), false);
  assert.equal(isPropertyManagerLead({ ...lead, customerType: undefined }), true);
  assert.equal("tenants" in quoteLeadDetails(homeowner), false);
});
