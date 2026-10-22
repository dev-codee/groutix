import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import { loadTs } from "./test-ts-loader.mjs";
const { optimizeDayRoute, routeCost, dayItinerary } = loadTs("lib/dispatchDayRoute.ts");
const plain = value => JSON.parse(JSON.stringify(value));
const matrix = [
  [0, 2, 8, 4], [12, 0, 3, 9], [4, 15, 0, 2], [2, 8, 5, 0],
].map(row => row.map(km => ({ km, minutes: km * 2 })));
test("optimization uses directional round trips, keeps every selected stop and never worsens the original", () => {
  const order = optimizeDayRoute(matrix);
  assert.deepEqual(plain([...order].sort()), [1, 2, 3]);
  assert.ok(routeCost(order, matrix) <= routeCost([1, 2, 3], matrix));
  assert.equal(routeCost([1, 2, 3], matrix), 9);
  assert.equal(routeCost([3, 2, 1], matrix), 36);
});
test("itinerary includes departure travel, work durations, buffers and the directional return", () => {
  const result = dayItinerary(matrix, [1, 2, 3], [60, 30, 45], "08:00", 10);
  assert.equal(result.stops[0].arrival, 494);
  assert.equal(result.stops[0].finish, 554);
  assert.equal(result.returnAt, 663);
  assert.equal(result.km, 9);
  assert.throws(() => dayItinerary(matrix, [1], [0], "08:00", 10));
  assert.throws(() => dayItinerary(matrix, [1], [60], "25:00", 10));
  assert.throws(() => optimizeDayRoute([[{ km: 0, minutes: 0 }], [{ km: NaN, minutes: 2 }]]));
});
const ids = ["000000000000000000000001", "000000000000000000000002"];
function harness({ session = { role: "manager" }, road = true, unknown = false } = {}) {
  const docs = ids.map((id, i) => ({ _id: new ObjectId(id), address: unknown ? "unknown location" : ["Ringwood", "Croydon"][i] }));
  const api = loadTs("app/api/admin/dispatch-day-route/route.ts", {
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    "@/lib/adminAuth": { verifyRequestSession: async () => session },
    "@/lib/mongodb": { getDb: async () => ({ collection: () => ({ find: () => ({ project: () => ({ toArray: async () => docs }) }) }) }) },
    "@/lib/dispatchRoadDistances": { drivingLeg: async (from, to) => road ? { km: from.length, minutes: to.length } : null },
  });
  return body => api.POST({ json: async () => body });
}
test("route API validates permissions and size before reading addresses", async () => {
  assert.equal((await harness({ session: null })({ ids })).status, 403);
  assert.equal((await harness({ session: { role: "technician" } })({ ids })).status, 403);
  assert.equal((await harness()({ ids: [ids[0], ids[0]] })).status, 400);
  assert.equal((await harness()({ ids: Array(17).fill(ids[0]) })).status, 400);
});
test("route API returns a directional road matrix or a consistently labelled fallback", async () => {
  let result = await harness()({ ids });
  assert.equal(result.status, 200); assert.equal(result.body.estimated, false);
  assert.equal(result.body.matrix.length, 3); assert.equal(result.body.matrix[1][1].km, 0);
  assert.notEqual(result.body.matrix[1][2].km, result.body.matrix[2][1].km);
  result = await harness({ road: false })({ ids });
  assert.equal(result.status, 200); assert.equal(result.body.estimated, true);
  assert.ok(result.body.matrix[1][2].km > 0);
  assert.equal((await harness({ road: false, unknown: true })({ ids })).status, 422);
});
