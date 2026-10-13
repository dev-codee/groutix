import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function picker(value = "2026-12-29") {
  const states = [];
  let cursor = 0;
  let effect;
  let cleanUp;
  let chosen;
  const listeners = new Map();
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (next) => { states[index] = next; }];
    },
    useRef: () => ({ current: null }),
    useEffect: (callback) => { effect = callback; },
  };
  const { DispatchDatePicker } = loadTs("components/admin/DispatchDatePicker.tsx", { react }, {
    document: {
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
  });
  const render = () => {
    cursor = 0;
    const tree = DispatchDatePicker({ value, today: "2026-10-12", onChange: (date) => { chosen = date; value = date; } });
    cleanUp?.();
    cleanUp = effect();
    const nodes = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== "object") return;
      nodes.push(node);
      visit(node.props?.children);
    };
    visit(tree);
    return nodes;
  };
  const find = (label) => render().find((node) => node.props?.["aria-label"] === label);
  const open = () => render().find((node) => node.props?.["aria-haspopup"] === "dialog").props.onClick();
  return { render, find, open, listeners, chosen: () => chosen };
}

test("calendar selects any day, highlights only the selected day across years, and closes", () => {
  const ui = picker();
  const trigger = ui.render().find(node => node.props?.["aria-haspopup"] === "dialog");
  assert.equal(trigger.props["aria-label"], "Choose dispatch date, Tue, 29 Dec 2026");
  ui.open();
  let nodes = ui.render();
  assert.equal(nodes.filter((node) => node.props?.["aria-pressed"] !== undefined).length, 42);
  assert.equal(nodes.filter((node) => node.props?.className?.includes("bg-blue-50 text-blue-700")).length, 0);
  assert.ok(ui.find("Tuesday 29 December 2026").props["aria-pressed"]);
  ui.find("Monday 4 January 2027").props.onClick();
  assert.equal(ui.chosen(), "2027-01-04");
  assert.equal(ui.render().some((node) => node.props?.role === "dialog"), false);
  ui.open();
  assert.equal(ui.find("Dispatch calendar month").props.value, "2027-01");
});

test("month arrows and direct month input allow distant dates and Today resets the schedule", () => {
  const ui = picker();
  ui.open();
  ui.find("Next month").props.onClick();
  assert.equal(ui.find("Dispatch calendar month").props.value, "2027-01");
  ui.find("Previous month").props.onClick();
  assert.equal(ui.find("Dispatch calendar month").props.value, "2026-12");
  ui.find("Dispatch calendar month").props.onChange({ target: { value: "2028-02" } });
  ui.find("Tuesday 29 February 2028").props.onClick();
  assert.equal(ui.chosen(), "2028-02-29");
  ui.open();
  ui.render().find((node) => node.type === "button" && node.props.children === "Today").props.onClick();
  assert.equal(ui.chosen(), "2026-10-12");
});

test("Escape and clicking outside dismiss the calendar without changing the schedule", () => {
  const ui = picker();
  ui.open();
  ui.render();
  ui.listeners.get("keydown")({ key: "Escape" });
  assert.equal(ui.render().some((node) => node.props?.role === "dialog"), false);
  ui.open();
  ui.render();
  ui.listeners.get("pointerdown")({ target: {} });
  assert.equal(ui.render().some((node) => node.props?.role === "dialog"), false);
  assert.equal(ui.chosen(), undefined);
});
