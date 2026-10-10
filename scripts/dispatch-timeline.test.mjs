import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { dispatchDates, dispatchDropMinutes, dispatchBookingIssue } = loadTs("lib/dispatchTimeline.ts");
const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const rules = structuredClone(DEFAULT_BOOKING_RULES);
const technicians = [{ id: "tech-1", name: "Alex", active: true, workDays: [0,1,2,3,4,5,6] }];
const candidate = { leadId: "lead-1", type: "job", date: "2026-10-12", time: "10:00", durationMinutes: 180, technician: "Alex" };
test("week view includes seven consecutive local dates across month and year boundaries", () => {
  assert.equal(dispatchDates("2026-12-29", "Week").join(","), "2026-12-29,2026-12-30,2026-12-31,2027-01-01,2027-01-02,2027-01-03,2027-01-04");
  assert.equal(dispatchDates("2026-10-10", "Day").join(","), "2026-10-10");
});
test("dragging snaps time to 15 minutes and preserves the grabbed point and complete job duration", () => {
  assert.equal(dispatchDropMinutes(.5, 540, 1020, 180, 60), 720);
  assert.equal(dispatchDropMinutes(.99, 540, 1020, 180), 840);
  assert.equal(dispatchDropMinutes(-.1, 540, 1020, 60), 540);
  assert.equal(dispatchDropMinutes(.29, 540, 1020, 60), 675);
});
test("moving a booking excludes itself but blocks overlapping jobs for its technician", () => {
  assert.equal(dispatchBookingIssue(candidate, [{ ...candidate }], rules, technicians), null);
  assert.match(dispatchBookingIssue(candidate, [{ ...candidate, leadId: "other", time: "12:30" }], rules, technicians), /overlapping|booked/);
  assert.equal(dispatchBookingIssue({ ...candidate, date: "2026-10-13" }, [{ ...candidate, leadId: "other" }], rules, technicians), null);
});
test("a full job cannot extend beyond the day's hours and closed dates cannot be booked", () => {
  assert.match(dispatchBookingIssue({ ...candidate, time: "15:00" }, [], rules, technicians), /full appointment/);
  assert.match(dispatchBookingIssue({ ...candidate, date: "2026-10-16", time: "13:00" }, [], rules, technicians), /full appointment/);
  const closed = { ...rules, closedDates: [{ date: candidate.date, label: "Closed" }] };
  assert.match(dispatchBookingIssue(candidate, [], closed, technicians), /closed/);
});

test("the real board stages a drag, cancellation writes nothing, and confirmation saves the new date/time", async () => {
  const states = [];
  const effects = [];
  let cursor = 0;
  let collectEffects = true;
  const writes = [];
  const lead = { id: "lead-1", status: "Job Booked", name: "Test Customer", jobAt: "2026-10-12T10:00", technician: "Alex", service: "Regrouting", inspectionReport: { estimatedTime: "3 hours" } };
  const noop = () => {};
  const ctx = { scopedLeads: [lead], assignableTechnicians: technicians, staff: [], inspectionStaff: [], openSchedule: noop,
    updateLeadField: async (...args) => { writes.push(args); return true; }, setEditingLead: noop, setLeadModalOpen: noop,
    openPhotosModal: noop, openMessagesModal: noop, callCustomer: noop };
  const react = {
    useState: initial => { const index = cursor++; if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; },
    useMemo: fn => fn(), useCallback: fn => fn, useEffect: fn => { if (collectEffects) effects.push(fn); },
  };
  const { DispatchView } = loadTs("components/admin/views/DispatchView.tsx", {
    react, "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ctx },
    "@/lib/useBookingRules": { useBookingRules: () => rules }, "@/lib/useZoneRules": { useZoneRules: () => ({}) },
    "@/components/admin/DispatchMap": { DispatchMap: () => null },
  }, { fetch: async () => ({ ok: true, json: async () => ({ appointments: [candidate] }) }), setTimeout: () => 0 });
  const render = () => { cursor = 0; return DispatchView({ onOpenLead: noop, initialDate: "2026-10-12" }); };
  const nodes = root => {
    const result = [];
    const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return;
      result.push(node); visit(node.props?.children); };
    visit(root); return result;
  };
  const label = node => { if (Array.isArray(node)) return node.map(label).join(""); if (!node || typeof node === "boolean") return "";
    if (typeof node !== "object") return String(node); return label(node.props?.children); };
  render(); collectEffects = false;
  effects.forEach(fn => fn());
  await new Promise(resolve => setImmediate(resolve));
  const drag = () => {
    let tree = nodes(render());
    assert.equal(tree.filter(node => node.props?.onDrop).length, 7);
    const card = tree.find(node => node.props?.title?.includes("Drag to reschedule."));
    assert.equal(card.props.draggable, true);
    const transfer = { setData: noop };
    card.props.onDragStart({ clientX: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 300 }) }, dataTransfer: transfer });
    tree = nodes(render());
    // Second row is the following date; 50% of the 9–17 track means 13:00.
    tree.filter(node => node.props?.onDrop)[1].props.onDrop({ preventDefault: noop, clientX: 400,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 800 }) }, dataTransfer: transfer });
    return nodes(render());
  };
  let tree = drag();
  assert.equal(writes.length, 0);
  assert.ok(tree.some(node => node.props?.role === "dialog"));
  assert.match(label(tree.find(node => node.props?.role === "dialog")), /1:00 PM.*4:00 PM/);
  tree.find(node => node.type === "button" && label(node) === "Cancel").props.onClick();
  assert.equal(writes.length, 0);
  assert.equal(nodes(render()).some(node => node.props?.role === "dialog"), false);
  tree = drag();
  await tree.find(node => node.type === "button" && label(node).includes("Confirm & Reschedule")).props.onClick();
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], "lead-1");
  assert.equal(writes[0][1].jobAt, "2026-10-13T13:00");
  assert.equal(writes[0][1].inspectionAt, undefined);
  assert.equal(writes[0][1].status, undefined);
  assert.equal(nodes(render()).some(node => node.props?.role === "dialog"), false);
});
