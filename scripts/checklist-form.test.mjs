import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_CHECKLIST_FORM, checklistOptions, sanitizeChecklistForm } = loadTs("lib/checklistForm.ts");

test("global checklist wording changes without changing quote answer codes", () => {
  const form = sanitizeChecklistForm({
    ...DEFAULT_CHECKLIST_FORM,
    fields: { ...DEFAULT_CHECKLIST_FORM.fields, showerType: "What size is your shower?" },
    optionLabels: { ...DEFAULT_CHECKLIST_FORM.optionLabels, showerType: { SS: "One person", DS: "Two people" } },
    additionalAreas: ["Kitchen", "Kitchen", "Laundry"],
  });
  assert.equal(form.fields.showerType, "What size is your shower?");
  assert.deepEqual(Array.from(checklistOptions(form, "showerType"), option => Array.from(option)), [["SS", "One person"], ["DS", "Two people"]]);
  assert.deepEqual(Array.from(form.additionalAreas), ["Kitchen", "Laundry"]);
});
