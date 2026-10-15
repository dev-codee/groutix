import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function fixture(onSave = async () => true, initial = {}) {
  const hooks = [];
  let index = 0;
  const lead = { id: "lead-1", notes: "Call first", message: "Loose tiles", enquiry: "Shower base repair", ...initial };
  const { LeadRequestDetails } = loadTs("components/admin/LeadRequestDetails.tsx", {
    react: {
      useState(initial) {
        const slot = index++;
        if (!(slot in hooks)) hooks[slot] = initial;
        return [hooks[slot], value => { hooks[slot] = value; }];
      },
      useRef(initial) {
        const slot = index++;
        if (!(slot in hooks)) hooks[slot] = { current: initial };
        return hooks[slot];
      },
    },
  });
  const render = () => { index = 0; return LeadRequestDetails({ lead, onSave }); };
  return {
    lead,
    render,
    button(label) {
      return nodes(render()).find(node => node.type === "button" && (node.props["aria-label"] === label || node.props.children === label));
    },
    edit() { this.button("Edit lead notes and customer request").props.onClick(); },
    change(fieldIndex, value) {
      nodes(render()).filter(node => node.type === "textarea")[fieldIndex].props.onChange({ target: { value } });
    },
    values() { return nodes(render()).filter(node => node.type === "textarea").map(node => node.props.value); },
  };
}

test("inline edits save only changed notes and request fields, including clearing a request", async () => {
  const writes = [];
  const f = fixture(async (id, changes) => { writes.push([id, JSON.parse(JSON.stringify(changes))]); return true; });
  f.edit();
  assert.deepEqual(f.values(), ["Call first", "Loose tiles", "Shower base repair"]);
  f.change(0, "Call after 3 PM");
  f.change(1, "");
  await f.button("Save").props.onClick();
  assert.deepEqual(writes, [["lead-1", { notes: "Call after 3 PM", message: "" }]]);
  assert.equal(f.values().length, 0);
});

test("cancel discards drafts, and unchanged drafts send no request", async () => {
  let writes = 0;
  const f = fixture(async () => { writes++; return true; });
  f.edit();
  f.change(2, "Different request");
  f.button("Cancel").props.onClick();
  f.edit();
  assert.equal(f.values()[2], "Shower base repair");
  await f.button("Save").props.onClick();
  assert.equal(writes, 0);
});

test("failed saves retain drafts and show an error so staff can retry", async () => {
  const f = fixture(async () => false);
  f.edit();
  f.change(2, "Both showers");
  await f.button("Save").props.onClick();
  assert.equal(f.values()[2], "Both showers");
  assert.match(nodes(f.render()).find(node => node.props?.role === "alert").props.children, /Could not save/);
});

test("duplicate clicks do not submit twice while saving", async () => {
  let finish, writes = 0;
  const f = fixture(() => { writes++; return new Promise(resolve => { finish = resolve; }); });
  f.edit();
  f.change(0, "Updated");
  const button = f.button("Save");
  const pending = button.props.onClick();
  await button.props.onClick();
  assert.equal(writes, 1);
  assert.equal(nodes(f.render()).find(node => node.type === "fieldset").props.disabled, true);
  finish(true);
  await pending;
  assert.equal(f.values().length, 0);
});

test("empty leads can add notes and customer requests from the card", async () => {
  const writes = [];
  const f = fixture(async (_id, changes) => { writes.push(JSON.parse(JSON.stringify(changes))); return true; }, { notes: "", message: "", enquiry: "" });
  f.edit();
  f.change(0, "New note");
  f.change(1, "New customer request");
  await f.button("Save").props.onClick();
  assert.deepEqual(writes, [{ notes: "New note", message: "New customer request" }]);
});
