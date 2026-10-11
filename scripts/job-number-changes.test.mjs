import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { jobNumberChanges } = loadTs("lib/jobNumberChanges.ts");
test("sorting leads does not trigger background database writes", () => {
  const before = [{ id: "a", jobNo: "JOBNO-1201" }, { id: "b", jobNo: "JOBNO-1202" }];
  assert.equal(jobNumberChanges(before, [...before].reverse()).length, 0);
});
test("only an actual changed number is persisted to the correct lead", () => {
  const before = [{ id: "a", jobNo: "JOBNO-1201" }, { id: "b" }];
  const after = [{ id: "b", jobNo: "JOBNO-1202" }, before[0]];
  const changes = jobNumberChanges(before, after);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].id, "b");
  assert.equal(changes[0].jobNo, "JOBNO-1202");
});
