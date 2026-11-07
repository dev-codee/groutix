import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadTs } from "./test-ts-loader.mjs";

const rules = loadTs("lib/materials.ts");
const fields = { name: "White grout", sku: "gr-white", unit: "kg", category: "Grout", location: "Warehouse", supplier: "Supplier", notes: "", reorderLevel: 2, unitCost: 12.50 };
const opening = (overrides = {}) => ({ ...fields, openingQuantity: 10, requestId: randomUUID(), ...overrides });
const movement = (version, overrides = {}) => ({ type: "use", quantity: 1, reason: "Used on job", reference: "Job-10", requestId: randomUUID(), version, ...overrides });

// Transactional in-memory DB boundary: run real repository operations and roll
// back every write on failure. Concurrent transactions are serialized here;
// MongoDB provides write-conflict retries in production.
function fixture() {
  let state = { materials: [], material_movements: [] };
  let failHistory = false;
  let queue = Promise.resolve();
  const clone = value => structuredClone(value);
  const matches = (doc, query) => Object.entries(query).every(([key, value]) => doc[key] === value);
  const collection = name => ({
    createIndex: async () => "index",
    findOne: async query => clone(state[name].find(doc => matches(doc, query)) || null),
    find(query) {
      let sort = {}, skip = 0, limit = Infinity;
      return { sort(value) { sort = value; return this; }, skip(value) { skip = value; return this; }, limit(value) { limit = value; return this; }, async toArray() {
        return clone(state[name].filter(doc => matches(doc, query)).sort((a, b) => {
          for (const [key, direction] of Object.entries(sort)) { if (a[key] < b[key]) return -direction; if (a[key] > b[key]) return direction; } return 0;
        }).slice(skip, skip + limit));
      } };
    },
    async insertOne(doc) {
      if (name === "material_movements" && failHistory) throw new Error("Injected ledger write failure");
      if (state[name].some(existing => existing._id === doc._id || (name === "materials" && existing.sku === doc.sku))) throw Object.assign(new Error("duplicate"), { code: 11000 });
      state[name].push(clone(doc)); return { insertedId: doc._id };
    },
    async updateOne(query, update) {
      const doc = state[name].find(doc => matches(doc, query));
      if (!doc) return { matchedCount: 0 };
      if (update.$set?.sku && state[name].some(other => other._id !== doc._id && other.sku === update.$set.sku)) throw Object.assign(new Error("duplicate"), { code: 11000 });
      Object.assign(doc, clone(update.$set || {}));
      for (const [key, value] of Object.entries(update.$inc || {})) doc[key] += value;
      return { matchedCount: 1 };
    },
    async findOneAndUpdate(query, update) {
      const result = await this.updateOne(query, update);
      return result.matchedCount ? this.findOne({ _id: query._id }) : null;
    },
  });
  const client = { startSession: () => ({
    async withTransaction(work) {
      const previous = queue;
      let release; queue = new Promise(resolve => { release = resolve; });
      await previous;
      const before = clone(state);
      try { return await work(); } catch (error) { state = before; throw error; } finally { release(); }
    }, async endSession() {},
  }) };
  const api = loadTs("lib/materialsServer.ts", { "@/lib/mongodb": { getDb: async () => ({ collection }), getMongoClient: async () => client } });
  return { api, get state() { return state; }, failHistory() { failHistory = true; } };
}

test("validates types, finite numbers, precision and required fields", () => {
  assert.equal(rules.parseMaterial(fields).sku, "GR-WHITE");
  for (const value of [-1, NaN, Infinity, "2", null, 0.00001, 1000000001]) assert.throws(() => rules.scaledNumber(value, "Stock"));
  assert.equal(rules.scaledNumber(1.001, "Stock"), 1001);
  assert.throws(() => rules.parseMaterial({ ...fields, unitCost: 1.001 }));
  for (const patch of [{ name: " " }, { sku: "bad sku" }, { unit: "invalid" }, { reorderLevel: -1 }]) assert.throws(() => rules.parseMaterial({ ...fields, ...patch }));
  for (const value of [null, [], "text"]) assert.throws(() => rules.materialBody(value));
  assert.throws(() => rules.parseMovement(movement(1, { reason: " " })));
  assert.throws(() => rules.parseMovement(movement(1, { quantity: 0 })));
  assert.throws(() => rules.parseMovement(movement(1, { type: "delete" })));
});
test("stock status includes exact thresholds and excludes archived stock", () => {
  assert.equal(rules.materialStatus({ quantity: 0, reorderLevel: 0, archived: false }), "Out of stock");
  assert.equal(rules.materialStatus({ quantity: 2, reorderLevel: 2, archived: false }), "Low stock");
  assert.equal(rules.materialStatus({ quantity: 3, reorderLevel: 2, archived: false }), "In stock");
  assert.equal(rules.materialStatus({ quantity: 0, reorderLevel: 2, archived: true }), "Archived");
});
test("opening stock and history are saved together; repeated creation is idempotent", async () => {
  const f = fixture(), input = opening();
  const item = await f.api.createMaterial(input, "manager");
  assert.equal(item.quantity, 10); assert.equal(item.sku, "GR-WHITE");
  assert.equal((await f.api.createMaterial(input, "manager")).id, item.id);
  assert.equal(f.state.materials.length, 1); assert.equal(f.state.material_movements.length, 1);
  await assert.rejects(f.api.createMaterial({ ...input, openingQuantity: 20 }, "manager"), /already used/);
  const history = await f.api.materialHistory(item.id, 1);
  assert.equal(history.movements[0].actor, "manager");
  assert.equal(history.movements[0].balance, 10);
});
test("duplicate SKU is rejected even with different case", async () => {
  const f = fixture(); await f.api.createMaterial(opening(), "manager");
  await assert.rejects(f.api.createMaterial(opening({ sku: "GR-WHITE" }), "manager"), error => error.code === 11000);
  assert.equal(f.state.materials.length, 1); assert.equal(f.state.material_movements.length, 1);
});
test("fractional receipt, use, return and count reconcile exactly with the ledger", async () => {
  const f = fixture(); let item = await f.api.createMaterial(opening({ openingQuantity: 0.3 }), "manager");
  for (const input of [{ type: "use", quantity: 0.1 }, { type: "use", quantity: 0.2 }, { type: "receive", quantity: 1.555 }, { type: "return", quantity: 0.001 }, { type: "adjust", quantity: 1 }]) {
    item = await f.api.recordMaterialMovement(item.id, movement(item.version, input), "manager");
  }
  assert.equal(item.quantity, 1);
  assert.equal(f.state.material_movements.reduce((sum, entry) => sum + entry.deltaMilli, 0), 1000);
  assert.equal(f.state.material_movements.at(-1).deltaMilli, -556);
});
test("insufficient stock and no-op counts cannot change the ledger", async () => {
  const f = fixture(), item = await f.api.createMaterial(opening(), "manager");
  await assert.rejects(f.api.recordMaterialMovement(item.id, movement(1, { quantity: 11 }), "manager"), /Insufficient stock/);
  await assert.rejects(f.api.recordMaterialMovement(item.id, movement(1, { type: "adjust", quantity: 10 }), "manager"), /no correction/);
  assert.equal(f.state.materials[0].quantityMilli, 10000); assert.equal(f.state.material_movements.length, 1);
});
test("identical movement retries cannot deduct stock twice", async () => {
  const f = fixture(), item = await f.api.createMaterial(opening(), "manager"), input = movement(1);
  await f.api.recordMaterialMovement(item.id, input, "manager");
  const retry = await f.api.recordMaterialMovement(item.id, input, "manager");
  await assert.rejects(f.api.recordMaterialMovement(item.id, { ...input, quantity: 2 }, "manager"), /already used/);
  assert.equal(retry.quantity, 9); assert.equal(retry.version, 2); assert.equal(f.state.material_movements.length, 2);
});
test("concurrent stale stock updates reject one writer", async () => {
  const f = fixture(), item = await f.api.createMaterial(opening({ openingQuantity: 1 }), "manager");
  const results = await Promise.allSettled([f.api.recordMaterialMovement(item.id, movement(1), "a"), f.api.recordMaterialMovement(item.id, movement(1), "b")]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(f.state.materials[0].quantityMilli, 0); assert.equal(f.state.material_movements.length, 2);
});
test("history write failure rolls back both opening stock and movements", async () => {
  const f = fixture(); f.failHistory();
  await assert.rejects(f.api.createMaterial(opening(), "manager"), /ledger write failure/);
  assert.equal(f.state.materials.length, 0);
  const second = fixture(), item = await second.api.createMaterial(opening(), "manager"); second.failHistory();
  await assert.rejects(second.api.recordMaterialMovement(item.id, movement(1), "manager"), /ledger write failure/);
  assert.equal(second.state.materials[0].quantityMilli, 10000); assert.equal(second.state.materials[0].version, 1);
  assert.equal(second.state.material_movements.length, 1);
});
test("edits protect balance and unit; archive requires zero stock and can be restored", async () => {
  const f = fixture(); let item = await f.api.createMaterial(opening(), "manager");
  await assert.rejects(f.api.editMaterial(item.id, { ...fields, unit: "bag", version: 1, action: "edit" }), /units cannot change/);
  await assert.rejects(f.api.editMaterial(item.id, { version: 1, action: "archive" }), /remaining stock/);
  item = await f.api.editMaterial(item.id, { ...fields, name: "New name", quantity: 999, version: 1, action: "edit" });
  assert.equal(item.quantity, 10); assert.equal(item.name, "New name");
  await assert.rejects(f.api.editMaterial(item.id, { ...fields, version: 1, action: "edit" }), /changed/);
  item = await f.api.recordMaterialMovement(item.id, movement(item.version, { type: "adjust", quantity: 0 }), "manager");
  item = await f.api.editMaterial(item.id, { version: item.version, action: "archive" });
  await assert.rejects(f.api.recordMaterialMovement(item.id, movement(item.version, { type: "receive" }), "manager"), /Restore/);
  await assert.rejects(f.api.createMaterial(opening(), "manager"), error => error.code === 11000);
  item = await f.api.editMaterial(item.id, { version: item.version, action: "restore" });
  assert.equal(item.archived, false); assert.equal((await f.api.materialHistory(item.id, 1)).movements.length, 2);
});
test("history is paginated without discarding older records", async () => {
  const f = fixture(); let item = await f.api.createMaterial(opening(), "manager");
  for (let i = 0; i < 27; i++) item = await f.api.recordMaterialMovement(item.id, movement(item.version, { type: "receive" }), "manager");
  const first = await f.api.materialHistory(item.id, 1), second = await f.api.materialHistory(item.id, 2);
  assert.equal(first.movements[0].balance, 37);
  assert.equal(second.movements.at(-1).type, "opening");
  assert.equal(first.movements.length, 25); assert.equal(first.hasMore, true);
  assert.equal(second.movements.length, 3); assert.equal(second.hasMore, false);
  assert.equal(new Set([...first.movements, ...second.movements].map(entry => entry.id)).size, 28);
});
test("API authorization denies missing sessions and all non-manager roles before database work", async () => {
  const roles = loadTs("lib/roles.ts");
  for (const role of [null, "intake", "inspection", "field", "technician", "finance", "manager", "super_admin"]) {
    let called = false;
    const { materialsApi } = loadTs("lib/materialsApi.ts", {
      "@/lib/adminAuth": { verifyRequestSession: async () => role ? { role, username: "tester" } : null },
      "@/lib/mongodb": { isMongoConfigured: () => true },
      "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    });
    const response = await materialsApi({}, async actor => { called = true; return { actor }; });
    const allowed = role === "manager" || role === "super_admin";
    assert.equal(response.status, allowed ? 200 : role ? 403 : 401); assert.equal(called, allowed);
    if (role) { assert.equal(roles.canView(role, "materials"), allowed); assert.equal(roles.canAccessApi(role, "/api/admin/materials/test/movements"), allowed); }
  }
});

test("API reports invalid bodies, conflicts and unsupported database transactions clearly", async () => {
  const { materialsApi } = loadTs("lib/materialsApi.ts", {
    "@/lib/adminAuth": { verifyRequestSession: async () => ({ role: "manager", username: "manager" }) },
    "@/lib/mongodb": { isMongoConfigured: () => true },
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    "@/lib/materials": rules,
  }, { SyntaxError });
  for (const [error, status] of [[new SyntaxError("bad JSON"), 400], [new rules.MaterialError("stale", 409), 409], [{ code: 11000 }, 409], [{ code: 20 }, 503]]) {
    assert.equal((await materialsApi({}, async () => { throw error; })).status, status);
  }
  const unavailable = loadTs("lib/materialsApi.ts", {
    "@/lib/adminAuth": { verifyRequestSession: async () => ({ role: "manager", username: "manager" }) },
    "@/lib/mongodb": { isMongoConfigured: () => false },
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
  });
  assert.equal((await unavailable.materialsApi({}, async () => { assert.fail("Must not access database"); })).status, 503);
});
