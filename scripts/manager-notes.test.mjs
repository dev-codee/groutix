import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const store = new Map();
const { GET, PATCH } = loadTs("app/api/admin/manager-notes/route.ts", {
  "@/lib/adminAuth": { verifyRequestSession: async req => req.session },
  "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => ({ collection: () => ({
    findOne: async ({ _id }) => store.get(_id),
    updateOne: async ({ _id }, { $set }) => store.set(_id, { _id, ...$set }),
  }) }) },
});
const req = (username, text, role = "manager") => ({ session: { username, role }, json: async () => ({ text, username: "other-account" }) });
test("personal notes persist per authenticated manager across reloads; request cannot choose another account", async () => {
  assert.equal((await PATCH(req("manager-a", "Reminder: confirm access\nReference: job 123"))).status, 200);
  assert.equal((await PATCH(req("manager-b", "Different notes"))).status, 200);
  const a = await (await GET(req("manager-a"))).json();
  const b = await (await GET(req("manager-b"))).json();
  assert.equal(a.text, "Reminder: confirm access\nReference: job 123");
  assert.equal(b.text, "Different notes");
  assert.ok(a.updatedAt);
  assert.equal(store.has("other-account"), false);
});
test("unsigned users and non-manager roles cannot access personal manager notes", async () => {
  assert.equal((await GET({ session: null })).status, 401);
  assert.equal((await PATCH(req("tech", "note", "technician"))).status, 403);
  assert.equal(store.has("tech"), false);
});
test("notes can be cleared deliberately; invalid requests leave stored notes intact", async () => {
  await PATCH(req("manager-clear", "keep me"));
  assert.equal((await PATCH(req("manager-clear", { invalid: true }))).status, 400);
  assert.equal((await PATCH(req("manager-clear", "x".repeat(20001)))).status, 400);
  assert.equal(store.get("manager-clear").text, "keep me");
  assert.equal((await PATCH(req("manager-clear", ""))).status, 200);
  assert.equal((await (await GET(req("manager-clear"))).json()).text, "");
});
