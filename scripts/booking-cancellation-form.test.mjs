import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES: rules } = loadTs("lib/bookingRules.ts");
const { BookingTimingEditor } = loadTs("components/admin/BookingTimingEditor.tsx");
const { LeadEditModal } = loadTs("components/admin/modals/LeadEditModal.tsx", {
  "@/lib/useBookingRules": { useBookingRules: () => rules },
  "@/components/admin/SlotBoard": { useSlotConflict: () => null, SlotBoard: () => null },
});

function inputs(html) {
  return [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
}

test("lead edits and booking cancellation can save without any job date", () => {
  for (const lead of [
    { name: "Customer", inspectionAt: "2026-10-20T09:00" },
    { name: "Customer", jobAt: "", jobEndAt: "" },
    { name: "Customer", inspectionAt: "", jobAt: "" },
  ]) {
    const html = renderToStaticMarkup(createElement(LeadEditModal, {
      editingLead: { id: "lead", status: "New", ...lead },
      role: "manager", isTechnician: false, isTechnicianName: () => false,
      assigneeOptions: [], addressSuggestions: [], addressInputRef: { current: null },
    }));
    const timing = inputs(html).filter(input => /type="(?:date|time|datetime-local)"/.test(input));
    assert.ok(timing.length > 0);
    assert.ok(timing.every(input => !input.includes('required=""')), "empty booking dates must not block Save Lead");
  }
});

test("booking forms still require timing, and an optional job becomes required once started", () => {
  for (const props of [{ start: "" }, { start: "2026-10-20T09:00", required: false }]) {
    const html = renderToStaticMarkup(createElement(BookingTimingEditor, { type: "job", rules, onChange() {}, ...props }));
    const timing = inputs(html).filter(input => /type="(?:date|time|datetime-local)"/.test(input));
    assert.ok(timing.every(input => input.includes('required=""')));
  }
});

test("clearing the start date clears the entire optional timing value", () => {
  let saved;
  const tree = BookingTimingEditor({ type: "job", start: "2026-10-20T09:00", rules, required: false,
    onChange: (start, end) => { saved = { start, end }; } });
  const startFields = tree.props.children[0];
  const dateInput = startFields.props.children[0].props.children[1];
  dateInput.props.onChange({ target: { value: "" } });
  assert.deepEqual(saved, { start: "", end: "" });
});
