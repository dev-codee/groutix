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
const load = (relativePath, overrides = {}, globals = {}) => {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const moduleRecord = { exports: {} };
  vm.runInNewContext(compiled, {
    ...globals,
    module: moduleRecord,
    exports: moduleRecord.exports,
    require: (name) => overrides[name] || require(name),
  });
  return moduleRecord.exports;
};
const scheduling = load("../lib/unassignedLeads.ts");
const calendarDependencies = {
  "@/lib/unassignedLeads": scheduling,
  "@/lib/scheduleDays": load("../lib/scheduleDays.ts"),
  "@/lib/scheduleRoutes": loadTs("lib/scheduleRoutes.ts"),
  "@/lib/scheduleDrag": loadTs("lib/scheduleDrag.ts"),
  "@/lib/bookingRules": loadTs("lib/bookingRules.ts"),
  "@/lib/useBookingRules": { useBookingRules: () => loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES },
  "@/components/admin/DispatchMap": {
    DispatchMap: (props) => { mapProps = props; return React.createElement("div", { "data-testid": "planning-map" }); },
  },
};
const { ScheduleCalendarView } = load("../components/admin/ScheduleCalendarView.tsx", calendarDependencies);
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
  assert.match(html, /Add next day/);
  assert.match(html, /data-testid="schedule-day-stack"/);
  assert.doesNotMatch(html, /aria-label="Calendar view"|grid-auto-flow:column/);
});

// Drive the actual component's event handlers with deterministic hook state and
// mocked network boundaries, including the confirmation/cancellation lifecycle.
function interactiveCalendar() {
  const scopes = new Map();
  let scope = "calendar";
  let cursor = 0;
  const cell = (initial) => {
    const values = scopes.get(scope) || [];
    scopes.set(scope, values);
    const index = cursor++;
    if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial;
    return [values[index], (next) => { values[index] = typeof next === "function" ? next(values[index]) : next; }];
  };
  const hooks = { ...React, useState: cell, useRef: (value) => cell({ current: value })[0], useMemo: (fn) => fn(), useCallback: (fn) => fn, useEffect: () => {} };
  const requests = [];
  const appointments = [
    { leadId: "a", type: "inspection", date: "2099-10-08", time: "09:00", name: "Booked A", address: "10 Main Street" },
    { leadId: "b", type: "inspection", date: "2099-10-08", time: "10:00", name: "Booked B", address: "20 Main Street" },
  ];
  const { ScheduleCalendarView: Component } = load("../components/admin/ScheduleCalendarView.tsx", { ...calendarDependencies, react: hooks }, {
    window: { confirm: () => true },
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      return { ok: true, json: async () => ({ appointments, routeOrders: {} }) };
    },
  });
  const props = { initialBooking: { leadId: "chosen", type: "job", date: "2099-10-08" }, unassignedLeads, leads: unassignedLeads.map(({ lead }) => lead), onOpenLead: () => {} };
  const render = (element) => {
    scope = element ? element.type.name : "calendar";
    cursor = 0;
    return element ? element.type(element.props) : Component(props);
  };
  const all = (element) => {
    if (!element || typeof element !== "object") return [];
    return [element, ...React.Children.toArray(element.props?.children).flatMap(all)];
  };
  const find = (root, predicate) => all(root).find(predicate);
  const event = () => ({ preventDefault() {}, stopPropagation() {}, dataTransfer: { setData() {} } });
  const initialize = async () => {
    find(render(), (el) => el.props?.title === "Refresh").props.onClick();
    await new Promise(setImmediate);
    return render();
  };
  return { render, find, event, initialize, requests };
}

test("adding a day stacks the next date, and hiding unassigned removes their list and map pins", async () => {
  const ui = interactiveCalendar();
  let root = await ui.initialize();
  ui.find(root, (el) => el.type === "button" && el.props.children?.includes?.("Add next day")).props.onClick();
  root = ui.render();
  assert.ok(ui.find(root, (el) => el.props?.["data-schedule-date"] === "2099-10-09"));
  assert.ok(ui.find(root, (el) => el.props?.["data-testid"] === "schedule-day-stack"));
  ui.find(root, (el) => el.type === "button" && el.props.children?.includes?.(" unassigned leads (")).props.onClick();
  root = ui.render();
  assert.equal(ui.find(root, (el) => el.props?.selectedLeadId === "chosen"), undefined);
  const map = ui.find(root, (el) => el.type?.name === "RouteMapPanel");
  assert.ok(map.props.mapItems.every((item) => !item.unassigned));
});

test("an unassigned drop can be cancelled without a write, and saves only after confirmation", async () => {
  const ui = interactiveCalendar();
  let root = await ui.initialize();
  const lead = ui.find(root, (el) => el.type === "button" && el.props.draggable && el.props["aria-pressed"]);
  lead.props.onDragStart(ui.event());
  ui.find(root, (el) => el.props?.["data-schedule-date"]).props.onDrop(ui.event());
  let dialog = ui.find(ui.render(), (el) => el.type?.name === "AddBookingDialog");
  assert.equal(ui.requests.filter((req) => req.method === "PATCH").length, 0);
  dialog.props.onClose();
  assert.equal(ui.find(ui.render(), (el) => el.type?.name === "AddBookingDialog"), undefined);
  root = ui.render();
  ui.find(root, (el) => el.type === "button" && el.props.draggable && el.props["aria-pressed"]).props.onDragStart(ui.event());
  ui.find(root, (el) => el.props?.["data-schedule-date"]).props.onDrop(ui.event());
  dialog = ui.find(ui.render(), (el) => el.type?.name === "AddBookingDialog");
  const form = ui.find(ui.render(dialog), (el) => el.type === "form");
  await form.props.onSubmit(ui.event());
  assert.equal(ui.requests.filter((req) => req.method === "PATCH").length, 1);
});

test("cross-day booking drops wait for confirmation and same-day reordering waits for confirmation", async () => {
  const ui = interactiveCalendar();
  let root = await ui.initialize();
  ui.find(root, (el) => el.type === "button" && el.props.children?.includes?.("Add next day")).props.onClick();
  root = ui.render();
  let list = ui.find(root, (el) => el.type?.name === "JobListPanel");
  const firstId = list.props.entries[0].id;
  const secondId = list.props.entries[1].id;
  list.props.onDragStart(ui.event(), { kind: "booking", id: firstId });
  ui.find(root, (el) => el.props?.["data-schedule-date"] === "2099-10-09").props.onDrop(ui.event());
  let dialog = ui.find(ui.render(), (el) => el.type?.name === "RescheduleDialog");
  assert.equal(dialog.props.modal.newDate, "2099-10-09");
  assert.equal(ui.requests.filter((req) => req.method === "PATCH").length, 0);
  dialog.props.onClose();
  root = ui.render();
  list = ui.find(root, (el) => el.type?.name === "JobListPanel");
  list.props.onDragStart(ui.event(), { kind: "booking", id: firstId });
  list.props.onDropBooking(ui.event(), "2099-10-08", secondId);
  root = ui.render();
  assert.equal(ui.find(root, (el) => el.type?.name === "JobListPanel").props.entries[0].id, firstId);
  ui.find(root, (el) => el.type === "button" && el.props.children === "Cancel").props.onClick();
  root = ui.render();
  list = ui.find(root, (el) => el.type?.name === "JobListPanel");
  list.props.onDragStart(ui.event(), { kind: "booking", id: firstId });
  list.props.onDropBooking(ui.event(), "2099-10-08", secondId);
  root = ui.render();
  ui.find(root, (el) => el.type === "button" && el.props.children === "Confirm order").props.onClick();
  root = ui.render();
  assert.equal(ui.find(root, (el) => el.type?.name === "JobListPanel").props.entries[0].id, secondId);
  assert.equal(ui.requests.filter((req) => req.method === "PATCH").length, 0);
  list = ui.find(root, (el) => el.type?.name === "JobListPanel");
  list.props.onDragStart(ui.event(), { kind: "booking", id: firstId });
  ui.find(root, (el) => el.props?.["data-schedule-date"] === "2099-10-09").props.onDrop(ui.event());
  dialog = ui.find(ui.render(), (el) => el.type?.name === "RescheduleDialog");
  await dialog.props.onSave("2099-10-09", "11:00");
  const writes = ui.requests.filter((req) => req.method === "PATCH");
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(writes[0].body).inspectionAt, "2099-10-09T11:00:00");
});
