import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../lib/scheduleDays.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { consecutivePlanningDates, addPlanningDate, shiftPlanningDates, planningDateRanges, colorPlanningMapItems, mapRouteGroups, MAX_PLANNING_DAYS } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("day counts support two, three, four, and week views across month boundaries", () => {
  for (const count of [1, 2, 3, 4, 7, 14, 31]) assert.equal(consecutivePlanningDates("2026-10-30", count).length, count);
  assert.deepEqual(consecutivePlanningDates("2026-10-30", 4), ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
});

test("adding custom dates maintains order, prevents duplicates, and limits the view to a month of dates", () => {
  assert.deepEqual(addPlanningDate(["2026-10-08", "2026-10-10"], "2026-10-09"), ["2026-10-08", "2026-10-09", "2026-10-10"]);
  const dates = consecutivePlanningDates("2026-10-08", MAX_PLANNING_DAYS);
  assert.equal(addPlanningDate(dates, "2026-12-01"), dates);
  assert.equal(addPlanningDate(dates, dates[0]), dates);
});

test("moving the first date preserves gaps between separately selected days", () => {
  assert.deepEqual(shiftPlanningDates(["2026-10-08", "2026-10-10", "2026-10-13"], "2026-11-01"), ["2026-11-01", "2026-11-03", "2026-11-06"]);
});

test("distant selected dates use valid API ranges", () => {
  const ranges = planningDateRanges(["2026-10-08", "2026-10-11", "2027-02-01", "2027-02-05"]);
  assert.deepEqual(ranges, [{ from: "2026-10-08", to: "2026-10-11" }, { from: "2027-02-01", to: "2027-02-05" }]);
});

test("each day has a distinct color and its own stop numbers", () => {
  const dates = consecutivePlanningDates("2026-10-08", 31);
  const items = colorPlanningMapItems(dates.map((date) => ({ lead: { id: date }, type: "job", time: "09:00", date })), dates);
  assert.equal(new Set(items.map((item) => item.color)).size, 31);
  assert.ok(items.every((item) => item.stopNumber === 1));
  const sameDay = colorPlanningMapItems([items[0], { ...items[0], time: "10:00" }, items[1]], dates);
  assert.deepEqual(sameDay.map((item) => item.stopNumber), [1, 2, 1]);
  assert.equal(sameDay[0].color, sameDay[1].color);
  assert.notEqual(sameDay[1].color, sameDay[2].color);
});

test("routes stay within their own day and exclude unassigned and ungeocoded pins", () => {
  const items = colorPlanningMapItems([
    { lead: { id: "first" }, type: "job", time: "09:00", date: "2026-10-08" },
    { lead: { id: "second" }, type: "inspection", time: "09:00", date: "2026-10-09" },
    { lead: { id: "third" }, type: "job", time: "10:00", date: "2026-10-08" },
    { lead: { id: "unassigned" }, type: "job", time: "", unassigned: true },
    { lead: { id: "missing" }, type: "job", time: "11:00", date: "2026-10-08" },
  ], ["2026-10-08", "2026-10-09"]);
  const groups = mapRouteGroups(items, [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, { lat: 3, lng: 3 }, { lat: 4, lng: 4 }, null]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].positions, [{ lat: 1, lng: 1 }, { lat: 3, lng: 3 }]);
  assert.deepEqual(groups[1].positions, [{ lat: 2, lng: 2 }]);
  assert.notEqual(groups[0].color, groups[1].color);
});
