import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { loadTs } from "./test-ts-loader.mjs";

const require = createRequire(import.meta.url);
let mapProps;
const load = (relativePath, overrides = {}) => {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const moduleRecord = { exports: {} };
  vm.runInNewContext(compiled, {
    module: moduleRecord,
    exports: moduleRecord.exports,
    require: (name) => overrides[name] || require(name),
  });
  return moduleRecord.exports;
};
const scheduling = load("../lib/unassignedLeads.ts");
const { ScheduleCalendarView } = load("../components/admin/ScheduleCalendarView.tsx", {
  "@/lib/unassignedLeads": scheduling,
  "@/lib/scheduleDays": load("../lib/scheduleDays.ts"),
  "@/lib/scheduleRoutes": loadTs("lib/scheduleRoutes.ts"),
  "@/lib/bookingRules": loadTs("lib/bookingRules.ts"),
  "@/lib/useBookingRules": { useBookingRules: () => loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES },
  "@/components/admin/DispatchMap": {
    DispatchMap: (props) => { mapProps = props; return React.createElement("div", { "data-testid": "planning-map" }); },
  },
});
const unassignedLeads = [
  { lead: { id: "other", name: "Other Customer", status: "New", address: "10 Main Street", createdAt: "2026-10-07" }, type: "inspection" },
  { lead: { id: "chosen", name: "Chosen Customer", status: "Quote Sent", address: "20 Main Street", createdAt: "2026-10-07" }, type: "job" },
  { lead: { id: "no-address", name: "Address Needed", status: "Contacted", createdAt: "2026-10-07" }, type: "inspection" },
];
const render = (initialBooking) => renderToStaticMarkup(React.createElement(ScheduleCalendarView, {
  initialBooking, unassignedLeads, leads: unassignedLeads.map(({ lead }) => lead), onOpenLead: () => {},
}));

test("opening an unassigned lead highlights it and displays the planning map without a booking dialog", () => {
  const html = render({ leadId: "chosen", type: "job", date: "2026-10-08" });
  assert.doesNotMatch(html, /role="dialog"/);
  assert.match(html, /Selected for planning/);
  assert.match(html, /Selected for job/);
  assert.match(html, /Book this lead/);
  assert.match(html, /Other Customer/);
  assert.match(html, /Address Needed/);
  assert.equal(mapProps.selectedLeadId, "chosen");
  assert.deepEqual(Array.from(mapProps.items, (item) => item.lead.id), ["other", "chosen"]);
  assert.ok(mapProps.items.every((item) => item.unassigned));
});

test("opening the calendar normally lists unassigned leads without selecting one or opening a form", () => {
  const html = render();
  assert.doesNotMatch(html, /role="dialog"|Selected for planning|Book this lead/);
  assert.match(html, /Unassigned leads/);
  assert.equal(mapProps.selectedLeadId, null);
  assert.equal(mapProps.items.length, 2);
});
