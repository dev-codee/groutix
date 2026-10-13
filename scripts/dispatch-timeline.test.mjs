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
  assert.match(dispatchBookingIssue(candidate, [{ ...candidate, leadId: "other", time: "10:30" }], rules, technicians), /overlapping|booked/);
  assert.equal(dispatchBookingIssue({ ...candidate, date: "2026-10-13" }, [{ ...candidate, leadId: "other" }], rules, technicians), null);
});
test("one-hour windows respect closing hours and legacy work durations do not block valid times", () => {
  assert.equal(dispatchBookingIssue({ ...candidate, time: "16:00" }, [], rules, technicians), null);
  assert.match(dispatchBookingIssue({ ...candidate, time: "16:30" }, [], rules, technicians), /hours|full appointment/);
  assert.match(dispatchBookingIssue({ ...candidate, date: "2026-10-16", time: "14:30" }, [], rules, technicians), /hours|full appointment/);
  const closed = { ...rules, closedDates: [{ date: candidate.date, label: "Closed" }] };
  assert.match(dispatchBookingIssue(candidate, [], closed, technicians), /closed/);
});

test("the real board stages a drag, cancellation writes nothing, and confirmation saves the new time and assignee; clicking edits the exact appointment", async () => {
  const states = [];
  const effects = [];
  let cursor = 0;
  let collectEffects = true;
  const writes = [];
  const lead = { id: "lead-1", status: "Job Booked", name: "Test Customer", inspectionAt: "2026-10-12T09:00", inspectionEndAt: "2026-10-12T09:30", assigned: "Clara", jobEndAt: "2026-10-12T11:00", jobAt: "2026-10-12T10:00", technician: "Alex", service: "Regrouting", inspectionReport: { estimatedTime: "3 hours" } };
  const noop = () => {};
  const ctx = { scopedLeads: [lead], assignableTechnicians: [...technicians, { id: "tech-2", name: "Bob", active: true, workDays: [0,1,2,3,4,5,6] }], staff: [], inspectionStaff: [{ id: "inspector-1", name: "Clara", active: true }], openSchedule: noop,
    upsertLead: noop, setEditingLead: noop, setLeadModalOpen: noop,
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
  }, { fetch: async (url, options) => { if (options?.method === "PATCH") writes.push([url.split("/").pop(), JSON.parse(options.body)]); return { ok: true, json: async () => ({ appointments: [candidate] }) }; }, setTimeout: () => 0 });
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
  let board = nodes(render());
  assert.ok(label(board).includes("Technician / Inspector"));
  assert.ok(label(board).includes("9 AM"));
  assert.ok(label(board).includes("5 PM"));
  board.filter(node => node.props?.onDrop)[1].props.onContextMenu({ preventDefault: noop, clientX: 400,
    target: { closest: () => null }, currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 800 }) } });
  const newBooking = nodes(render()).find(node => node.props?.staffName === "Bob" && node.props?.onBooked);
  assert.equal(newBooking.props.time, "13:00");
  assert.equal(newBooking.props.initialType, "job");
  newBooking.props.onClose();
  const drag = () => {
    let tree = nodes(render());
    assert.equal(tree.filter(node => node.props?.onDrop).length, 3);
    const card = tree.find(node => node.props?.title?.includes("10:00 AM"));
    assert.equal(card.props.draggable, true);
    const transfer = { setData: noop };
    card.props.onDragStart({ clientX: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 300 }) }, dataTransfer: transfer });
    tree = nodes(render());
    // Second row is Bob on the same date; 50% of the 9 AM–5 PM display means 13:00.
    tree.filter(node => node.props?.onDrop)[1].props.onDrop({ preventDefault: noop, clientX: 400,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 800 }) }, dataTransfer: transfer });
    return nodes(render());
  };
  let tree = drag();
  assert.equal(writes.length, 0);
  assert.ok(tree.some(node => node.props?.role === "dialog"));
  assert.match(label(tree.find(node => node.props?.role === "dialog")), /1:00 PM.*2:00 PM/);
  tree.find(node => node.type === "button" && label(node) === "Cancel").props.onClick();
  assert.equal(writes.length, 0);
  assert.equal(nodes(render()).some(node => node.props?.role === "dialog"), false);
  tree = drag();
  await tree.find(node => node.type === "button" && label(node).includes("Confirm & Reschedule")).props.onClick();
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], "lead-1");
  assert.equal(writes[0][1].jobAt, "2026-10-12T13:00");
  assert.equal(writes[0][1].technician, "Bob");
  assert.equal(writes[0][1].technicianId, "tech-2");
  assert.equal(writes[0][1].bookingNotifications, true);
  assert.equal(writes[0][1].inspectionAt, undefined);
  assert.equal(writes[0][1].status, undefined);
  assert.equal(nodes(render()).some(node => node.props?.role === "dialog"), false);
  // This lead also has an inspection: clicking its job must open the job fields.
  tree = nodes(render());
  tree.find(node => node.props?.title?.includes("10:00 AM")).props.onClick();
  effects.length = 0; collectEffects = true; render(); collectEffects = false;
  effects.forEach(fn => fn());
  tree = nodes(render());
  assert.equal(tree.find(node => node.type === "input" && node.props.type === "time").props.value, "10:00");
  assert.equal(tree.find(node => node.type === "input" && node.props.type === "datetime-local").props.value, "2026-10-12T11:00");
  const assignee = tree.find(node => node.type === "select" && node.props.value === "Alex");
  assert.ok(assignee);
  assert.ok(!label(assignee).includes("Clara"));
  assignee.props.onChange({ target: { value: "Bob" } });
  tree.find(node => node.type === "input" && node.props.type === "datetime-local").props.onChange({ target: { value: "2026-10-12T12:30" } });
  tree = nodes(render());
  tree.find(node => node.type === "button" && label(node).includes("Confirm Change")).props.onClick();
  assert.equal(writes.length, 1);
  tree = nodes(render());
  await tree.find(node => node.type === "button" && label(node).includes("Confirm & Reschedule")).props.onClick();
  assert.equal(writes.length, 2);
  assert.equal(writes[1][1].jobAt, "2026-10-12T10:00");
  assert.equal(writes[1][1].jobEndAt, "2026-10-12T12:30");
  assert.equal(writes[1][1].technician, "Bob");
  assert.equal(writes[1][1].inspectionAt, undefined);
  tree = nodes(render());
  tree.find(node => node.props?.title?.includes("9:00 AM")).props.onClick();
  effects.length = 0; collectEffects = true; render(); collectEffects = false;
  effects.forEach(fn => fn());
  tree = nodes(render());
  assert.equal(tree.find(node => node.type === "input" && node.props.type === "time").props.value, "09:00");
  assert.equal(tree.find(node => node.type === "input" && node.props.type === "datetime-local").props.value, "2026-10-12T09:30");
  assert.ok(tree.some(node => node.type === "select" && node.props.value === "Clara"));
});
