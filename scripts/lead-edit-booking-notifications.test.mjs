import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { loadTs } from "./test-ts-loader.mjs";

const { leadEditChanges } = loadTs("lib/leadEdit.ts");
const source = fs.readFileSync("app/admin/page.tsx", "utf8");
const tree = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "handleSaveLead") handler = node.getText(tree);
  ts.forEachChild(node, visit);
}
visit(tree);
const compiled = ts.transpileModule(`${handler}\nmodule.exports = handleSaveLead;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

async function save(original, changes, response = {}) {
  const state = { leads: [original], closed: false, toast: null, request: null };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, editingLead: { ...original, ...changes }, leadEditChanges,
    statusAfterBooking: () => "Job Booked",
    fetch: async (_url, options) => {
      state.request = JSON.parse(options.body);
      return { ok: response.ok !== false, json: async () => response };
    },
    setLeads: update => { state.leads = update(state.leads); },
    setLeadModalOpen: open => { state.closed = !open; },
    setEtaToast: toast => { state.toast = toast; },
    setTimeout() {},
  });
  state.error = await module.exports({ preventDefault() {} }, original);
  return state;
}

const lead = { id: "lead-1", name: "Sam", status: "Won" };
test("Edit Lead opts in to confirmation when saving the first job date", async () => {
  const state = await save(lead, { jobAt: "2026-10-20T09:00" });
  assert.equal(state.request.bookingNotifications, true);
  assert.equal(state.request.jobAt, "2026-10-20T09:00");
  assert.equal(state.closed, true);
  assert.match(state.toast.msg, /confirmations sent/);
  assert.equal(state.leads[0].bookingNotifications, undefined);
});

test("notes, inspection dates, clearing and rescheduling do not request new job confirmations", async () => {
  for (const [original, changes] of [
    [lead, { notes: "Call first" }],
    [lead, { inspectionAt: "2026-10-20T09:00" }],
    [{ ...lead, jobAt: "2026-10-20T09:00" }, { jobAt: "" }],
    [{ ...lead, jobAt: "2026-10-20T09:00" }, { jobAt: "2026-10-21T10:00" }],
    [{ ...lead, jobAt: "2026-10-20T09:00" }, { notes: "Call first" }],
  ]) {
    const state = await save(original, changes);
    assert.equal(state.request.bookingNotifications, undefined);
    assert.equal(state.toast, null);
  }
});

test("a saved booking displays notification failures without asking staff to save again", async () => {
  const state = await save(lead, { jobAt: "2026-10-20T09:00" }, { notificationWarnings: ["Confirmation email failed."] });
  assert.equal(state.closed, true);
  assert.match(state.toast.msg, /Job booked.*email failed/);
});

test("a rejected booking keeps the form open and never claims confirmation was sent", async () => {
  const state = await save(lead, { jobAt: "2026-10-20T09:00" }, { ok: false, error: "Slot taken" });
  assert.equal(state.error, "Slot taken");
  assert.equal(state.closed, false);
  assert.equal(state.toast, null);
});
