import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const {
  checklistToQuoteItems,
  checklistServiceNames,
  mergeQuoteItems,
  checklistRequestText,
  checklistHasAnswers,
} = loadTs("lib/checklist.ts");

const page = (over = {}) => ({ id: "p1", ...over });

test("a full shower page maps to catalog items and silicone/tile add-ons", () => {
  const answers = {
    pages: [
      page({
        showerLeakage: "Yes",
        showerType: "SS",
        wallHeight: "SH",
        workRequired: "WF",
        numberOfWalls: "2",
        tileSize: "Large",
        siliconeJoints: ["C-V-I", "C-H-O"],
        crackedWallTiles: "1",
        tileAction: "Repair",
      }),
    ],
  };
  const items = checklistToQuoteItems(answers, { service: "Shower regrouting" });
  const codes = items.map((item) => item.code);
  assert.ok(codes.includes("MB-SS-WF-SH-EG"), `expected shower code in ${codes}`);
  assert.ok(codes.includes("C-V-I"));
  assert.ok(codes.includes("C-H-O"));
  assert.ok(codes.includes("TILE REPAIR"));
  // No duplicates even when several answers map to the same catalog row.
  assert.equal(new Set(codes).size, codes.length);
});

test("room and grout are inferred from the original enquiry", () => {
  const ensuite = checklistToQuoteItems(
    { pages: [page({ showerType: "SS", wallHeight: "SH", workRequired: "WF" })] },
    { service: "Ensuite shower regrouting" }
  );
  assert.equal(ensuite[0].code, "EN-SS-WF-SH-EG");

  const double = checklistToQuoteItems(
    { pages: [page({ showerType: "DS", wallHeight: "SH", workRequired: "WF" })] },
    { service: "Double shower regrouting" }
  );
  assert.equal(double[0].code, "MB-DS-WF-SH-EG");
});

test("cracked tiles default to repair, replace switches the catalog code", () => {
  const repair = checklistToQuoteItems({
    pages: [page({ crackedFloorTiles: "2" })],
  });
  assert.equal(repair[0].code, "TILE REPAIR");

  const replace = checklistToQuoteItems({
    pages: [page({ crackedFloorTiles: "2", tileAction: "Replace" })],
  });
  assert.equal(replace[0].code, "CT - GROUTIX TO SUPPLY & INSTALL");
});

test("balcony details map to the balcony item and keep the scope note", () => {
  const items = checklistToQuoteItems({
    pages: [page({ balconyLeakage: "Yes", balconyArea: "8", balconyTileSize: "Large" })],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].code, "BALCONY");
  assert.match(items[0].scope, /8 sq m/);
});

test("unmatched additional areas become a zero-dollar custom line", () => {
  const items = checklistToQuoteItems({
    pages: [page({ additionalAreas: ["Kitchen"], additionalNotes: "Splashback too" })],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].code, "");
  assert.equal(items[0].service, "Kitchen");
  assert.equal(items[0].price, 0);
});

test("service names are de-duplicated and merge keeps existing items", () => {
  const additions = checklistToQuoteItems({
    pages: [page({ showerType: "SS", wallHeight: "SH", workRequired: "WF", siliconeJoints: ["C-V-I", "C-V-I"] })],
  });
  const names = checklistServiceNames(additions);
  assert.equal(new Set(names).size, names.length);

  const existing = [{ code: "MB-SS-WF-SH-EG", service: "Existing", scope: "", price: 10, qty: 1 }];
  const merged = mergeQuoteItems(existing, additions);
  assert.equal(merged.filter((item) => item.code === "MB-SS-WF-SH-EG").length, 1);
  assert.ok(merged.some((item) => item.code === "C-V-I"));
});

test("checklistRequestText summarises each page for the CRM", () => {
  const text = checklistRequestText({
    pages: [page({ showerLeakage: "Yes", showerType: "DS", workRequired: "WF", numberOfWalls: "3" })],
  });
  assert.match(text, /Shower 1/);
  assert.match(text, /Shower leakage: Yes/);
  assert.match(text, /Shower type: Double/);
});

test("checklistHasAnswers ignores id/photos-only pages", () => {
  assert.equal(checklistHasAnswers({ pages: [page({ photos: [{ name: "a" }] })] }), false);
  assert.equal(checklistHasAnswers({ pages: [page({ showerType: "SS" })] }), true);
});

test("written checklist includes notes, explicit zero counts and selected photo categories", () => {
  const text = checklistRequestText({
    pages: [page({
      service: "Shower", areaName: "Other", areaDescription: "Upstairs shower",
      leakageNotes: "Water in the hallway", showerType: "Not sure", numberOfWalls: "Not s",
      crackedWallTiles: "0", crackedFloorTiles: "2", additionalNotes: "Include vanity",
      photoCategory: "2", photoCategoryLabel: "Outside the shower",
      customAnswers: { empty: { label: "Unanswered", value: [] }, timing: { label: "Availability", value: ["Monday", "Friday"] } },
    })],
  });
  for (const line of [
    "Area description: Upstairs shower", "Leakage notes: Water in the hallway", "Shower type: Not sure",
    "Tiled walls: Not sure", "Cracked or loose wall tiles: 0", "Cracked or loose floor tiles: 2",
    "Additional notes: Include vanity", "Selected photo category: Outside the shower", "Availability: Monday, Friday",
  ]) assert.ok(text.includes(line), line);
  assert.doesNotMatch(text, /Unanswered/);
});
