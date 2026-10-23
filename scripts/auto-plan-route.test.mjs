import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { loadTs } from "./test-ts-loader.mjs";

function planner({ failSave = false, holdLoad = false, empty = false } = {}) {
  const values = [];
  let cursor = 0;
  const cell = (initial) => {
    const index = cursor++;
    if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial;
    return [values[index], (next) => { values[index] = typeof next === "function" ? next(values[index]) : next; }];
  };
  const hooks = { ...React, useState: cell, useRef: (initial) => cell({ current: initial })[0] };
  const requests = [], saved = [];
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const date = "2026-10-23";
  const appointments = empty ? [] : ["Ringwood", "Werribee", "Croydon", "Keilor"].map((address, index) => ({ leadId: String(index), type: "job", date, time: `${9 + index}:00`, name: `Customer ${index}`, address }));
  const scheduling = loadTs("lib/scheduling.ts");
  const { AutoPlanRouteButton } = loadTs("components/admin/AutoPlanRouteButton.tsx", {
    react: hooks,
    "@/lib/scheduling": { ...scheduling, todayAU: () => date },
  }, {
    fetch: async (url, options = {}) => {
      requests.push({ url, ...options });
      if (options.method === "PUT") return { ok: !failSave, json: async () => failSave ? { error: "Bookings have changed. Refresh the calendar." } : { ok: true } };
      if (holdLoad) await waiting;
      return { ok: true, json: async () => ({ appointments, routeOrders: {} }) };
    },
  });
  const render = () => { cursor = 0; return AutoPlanRouteButton({ onSaved: (day) => saved.push(day) }); };
  const all = (element) => !element || typeof element !== "object" ? [] : [element, ...React.Children.toArray(element.props?.children).flatMap(all)];
  const find = (predicate) => all(render()).find(predicate);
  const button = (label) => find((el) => el.type === "button" && React.Children.toArray(el.props.children).includes(label));
  const tick = () => new Promise(setImmediate);
  return { render, find, button, tick, requests, saved, release, date, appointments };
}

test("auto-plan loads all of today, previews a closed tour, and saves only the visit order", async () => {
  const ui = planner();
  ui.button("Auto-plan today").props.onClick();
  await ui.tick();
  assert.equal(ui.requests[0].url, `/api/admin/slots?from=${ui.date}&to=${ui.date}`);
  assert.ok(ui.find((el) => el.props?.role === "dialog"));
  assert.equal(ui.requests.filter((req) => req.method === "PUT").length, 0);
  assert.ok(ui.find((el) => el.type === "li" && el.props.children === "Finish at base · Gowanbrae"));
  ui.button("Save today’s route").props.onClick();
  await ui.tick();
  const write = JSON.parse(ui.requests.find((req) => req.method === "PUT").body);
  assert.equal(write.routes[0].date, ui.date);
  assert.equal(write.routes[0].order.length, ui.appointments.length);
  assert.equal(new Set(write.routes[0].order).size, ui.appointments.length);
  assert.deepEqual(Object.keys(write.routes[0]).sort(), ["date", "order"]);
  assert.deepEqual(ui.saved, [ui.date]);
  assert.equal(ui.find((el) => el.props?.role === "dialog"), undefined);
});

test("stale bookings keep the preview open and do not report a saved route", async () => {
  const ui = planner({ failSave: true });
  ui.button("Auto-plan today").props.onClick();
  await ui.tick();
  ui.button("Save today’s route").props.onClick();
  await ui.tick();
  assert.match(ui.find((el) => el.props?.role === "alert").props.children.join(""), /Bookings have changed/);
  assert.equal(ui.saved.length, 0);
  assert.ok(ui.find((el) => el.props?.role === "dialog"));
});

test("closing while loading ignores late results and allows planning again", async () => {
  const ui = planner({ holdLoad: true });
  ui.button("Auto-plan today").props.onClick();
  ui.button("Close").props.onClick();
  assert.equal(ui.button("Auto-plan today").props.disabled, false);
  ui.release();
  await ui.tick();
  assert.equal(ui.find((el) => el.props?.role === "dialog"), undefined);
  assert.equal(ui.requests.filter((req) => req.method === "PUT").length, 0);
});

test("days with no visits cannot save a route", async () => {
  const ui = planner({ empty: true });
  ui.button("Auto-plan today").props.onClick();
  await ui.tick();
  assert.equal(ui.button("Save today’s route").props.disabled, true);
});
