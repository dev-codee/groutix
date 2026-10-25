import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTs } from "./test-ts-loader.mjs";

const { SERVICE_TEMPLATES, bestTemplateForTask } = loadTs("lib/serviceTemplates.ts");
const { findBestTemplateForService, getMatchedQuoteItemsForLead, parseCustomerServices } = loadTs("lib/serviceMatching.ts");
const byCode = code => SERVICE_TEMPLATES.find(item => item.code === code);
const expectedCodes = `EN-DS-WB-TC-PG
EN-DS-WB-SH-EG
EN-DS-WB-SH-PG
EN-DS-WF-TC-EG
EN-DS-WF-TC-PG
EN-DS-WF-SH-EG
EN-DS-WF-SH-PG
EN-DS-WP-TC-EG
EN-DS-WP-TC-PG
EN-DS-WP-SH-EG
EN-DS-WP-SH-PG
EN-SS-FO-EG
EN-DS-FO-EG
EN-DS-FO-PG
EN-SS-FO-PG
EN-SS-WB-SH-EG
EN-SS-WB-SH-PG
EN-SS-WF-TC-EG
EN-SS-WF-TC-PG
EN-SS-WF-SH-EG
EN-SS-WF-SH-PG
EN-SS-WO-TC-EG
EN-SS-WO-SH-EG
EN-SS-WO-SH-PG
EN-SS-WO-TC-PG
EN-SS-WP-TC-EG
EN-SS-WP-TC-PG
EN-SS-WP-SH-EG
EN-SS-WP-SH-PG
EN-DS-WB-TC-EG
GUYS
MB-DS-WB-TC-EG
MB-DS-WB-TC-PG
MB-DS-WB-SH-EG
MB-DS-WB-SH-PG
MB-DS-WF-TC-EG
MB-DS-WF-TC-PG
MB-DS-WF-SH-EG
MB-DS-WF-SH-PG
MB-DS-WP-TC-EG
MB-DS-WP-TC-PG
MB-DS-WP-SH-EG
MB-DS-WP-SH-PG
MB-SS-FO-EG
MB-DS-FO-EG
MB-SS-FO-PG
MB-DS-FO-PG
MB-SS-WF-SH-PG
MB-SS-WB-TC-EG
MB-SS-WB-TC-PG
MB-SS-WB-SH-EG
MB-SS-WB-SH-PG
MB-SS-WF-TC-EG
MB-SS-WF-TC-PG
MB-SS-WF-SH-EG
MB-SS-WF-SH-PG
MB-SS-WO-TC-EG
MB-SS-WO-TC-PG
MB-SS-WO-SH-EG
MB-SS-WO-SH-PG
MB-SS-WP-TC-EG
MB-SS-WP-TC-PG
MB-SS-WP-SH-EG
MB-SS-WP-SH-PG
MB-DS-WO-SH-PG
MB-SS-WF-SH-PG
MB-DS-WO-SH-EG
BALCONY
CT - (CLIENT TO SOURCE)
CT - GROUTIX TO SUPPLY & INSTALL
MT - MOULD TREATMENT
S - SEALANT
PRESSURE WASH
EPOXY UPGRADE
PP
C-V-O
C-H-I
C-H-O
C-V-I
SEALER
SEALER MAIN BATHROOM
SCREEN REPLECEMENT
TILE REPAIR`.split("\n");

test("the final document has 83 rows, preserves its row numbers and provided prices", () => {
  assert.deepEqual(Array.from(SERVICE_TEMPLATES, item => item.code), expectedCodes);
  assert.deepEqual(Array.from(SERVICE_TEMPLATES, item => item.no), Array.from({ length: 84 }, (_, i) => String(i + 2)).filter(no => no !== "67"));
  const prices = { GUYS: 1250, "MB-DS-WO-SH-EG": 750,
    "PRESSURE WASH": 450, "EPOXY UPGRADE": 125, PP: 20, "C-V-I": 58, SEALER: 97.9, "SEALER MAIN BATHROOM": 89 };
  for (const item of SERVICE_TEMPLATES) {
    assert.equal(item.price, item.no === "49" ? 1400 : prices[item.code] || 0, item.code);
  }
});

test("each code selects its own complete scope and price through both matchers", () => {
  for (const item of SERVICE_TEMPLATES) {
    for (const match of [findBestTemplateForService(item.code.toLowerCase()), bestTemplateForTask(item.code.toLowerCase())]) {
      if (item.code === "MB-SS-WF-SH-PG") { assert.equal(match, null, "ambiguous codes require manual row selection"); continue; }
      assert.equal(match.code, item.code);
      assert.equal(match.scope, item.scope);
      assert.equal(match.price, item.price);
    }
  }
});

test("grouting and silicone removal stay separate, with the supplied special drying work", () => {
  const first = byCode("EN-DS-WB-TC-PG");
  assert.equal(first.scope, `GROUTING WORK
• Removal of existing grout from double shower wall tiles and surrounding bath tiled areas to ceiling height (excluding mosaic tiles, if any)
• Removal of existing grout from all tile-to-tile junctions and tile-to-bath junctions (excluding mosaic tiles, if any)
• Cleaning and preparation of grout joints and movement joints prior to installation
• Mould treatment to kill existing mould.
• Use of a commercial wet and dry vacuum to extract trapped moisture from beneath the tiled surface and grout joints where possible.
• Use of high-pressure air blowers to assist in removing residual moisture and drying the substrate prior to regrouting.
• Regrouting using premium polymer fortified mould-resistant flex grout
SILICONE WORK
• Removal of existing silicone from all tile-to-tile junctions and tile-to-bath junctions (excluding mosaic tiles, if any)
• Installation of premium mould-resistant silicone to all tile-to-tile junctions and tile-to-bath junctions
COMPLETION / OTHER
• Final clean upon completion`);
  for (const item of SERVICE_TEMPLATES.filter(item => /^(EN|MB)-(SS|DS)-/.test(item.code))) {
    assert.match(item.scope, /^GROUTING WORK\n/);
    assert.match(item.scope, /\nSILICONE WORK\n• Removal of existing silicone/);
    assert.match(item.scope, /\nCOMPLETION \/ OTHER\n• Final clean/);
    assert.doesNotMatch(item.scope, /failed grout and silicone/);
  }
  for (const item of SERVICE_TEMPLATES.filter(item => /^(EN|MB)-(SS|DS)-/.test(item.code))) {
    assert.match(item.scope, /commercial wet and dry vacuum/, item.code);
    assert.match(item.scope, /high-pressure air blowers/, item.code);
    assert.match(item.scope, /Mould treatment to kill existing mould/, item.code);
  }
  assert.match(byCode("EN-DS-WB-TC-EG").scope, /highly water-resistant/);
  assert.doesNotMatch(byCode("EN-DS-WB-TC-EG").scope, /permanently waterproof/);
  assert.match(byCode("SCREEN REPLECEMENT").scope, /silver aluminum frame/);
  assert.doesNotMatch(byCode("SCREEN REPLECEMENT").scope, /12-month workmanship warranty/);
});

test("automatic recommendations use codes after rows move, including specified shower variants", () => {
  const cases = [
    ["Balcony regrouting", "", "BALCONY"], ["Balcony pressure washing", "", "PRESSURE WASH"],
    ["Cracked tile repair", "", "CT - GROUTIX TO SUPPLY & INSTALL"], ["Drummy tile repair", "", "TILE REPAIR"], ["Loose tile repair", "", "TILE REPAIR"], ["Mould treatment", "", "MT - MOULD TREATMENT"],
    ["Penetrating sealer", "", "S - SEALANT"], ["Shower screen replacement", "", "SCREEN REPLECEMENT"],
    ["Shower regrouting", "Guest bathroom", "GUYS"], ["Shower regrouting", "Ensuite", "EN-SS-WF-SH-EG"],
    ["Shower floor only", "Main bathroom", "MB-SS-FO-EG"], ["Shower regrouting", "", "MB-SS-WF-SH-EG"],
    ["Double shower walls & bath to ceiling polymer", "Ensuite", "EN-DS-WB-TC-PG"],
    ["Single shower walls to pan to ceiling epoxy", "Main bathroom", "MB-SS-WP-TC-EG"],
  ];
  for (const [service, area, code] of cases) assert.equal(findBestTemplateForService(service, area).code, code, service);
  assert.equal(getMatchedQuoteItemsForLead({})[0].code, "MB-SS-WF-SH-EG");
  const items = getMatchedQuoteItemsForLead({ service: "CT - (CLIENT TO SOURCE)", damagedTiles: "Cracked tiles" });
  assert.equal(items.length, 1, "do not duplicate an existing tile-repair code");
});

test("an older quote's row number cannot make its picker show a different item code", () => {
  const { TemplatePicker } = loadTs("components/admin/TemplatePicker.tsx");
  const html = renderToStaticMarkup(React.createElement(TemplatePicker, {
    selectedTemplateNo: "20", selectedTemplateCode: "EN-SS-WF-SH-EG", onSelectTemplate() {},
  }));
  assert.match(html, /EN-SS-WF-SH-EG/);
  assert.doesNotMatch(html, /EN-SS-WF-TC-PG/);
});

test("natural requests select the actual surface and screen joint from the revised catalog", () => {
  const cases = [
    ["Single shower walls and floor to shower screen height epoxy", "Main Bathroom", "MB-SS-WF-SH-EG"],
    ["Shower Base Repair", "Main Bathroom", "MB-SS-FO-EG"],
    ["Double shower floor epoxy", "Ensuite Bathroom", "EN-DS-FO-EG"],
    ["Shower screen replacement", "Main Bathroom", "SCREEN REPLECEMENT"],
    ["Horizontal outside shower screen caulking", "", "C-H-O"],
    ["Horizontal inside shower screen silicone", "", "C-H-I"],
    ["Vertical outside shower screen silicone", "", "C-V-O"],
    ["Vertical inside shower screen caulking", "", "C-V-I"],
    ["Main bathroom shower regrouting", "Ensuite Bathroom, Guest Bathroom", "MB-SS-WF-SH-EG"],
  ];
  for (const [service, area, code] of cases) {
    assert.equal(findBestTemplateForService(service, area)?.code, code, service);
  }
});

test("requests without a suitable catalog scope stay custom rather than picking different work", () => {
  for (const service of ["Silicone Replacement", "Double shower walls only to ceiling polymer"]) {
    assert.equal(findBestTemplateForService(service, "Main Bathroom"), null, service);
    const item = getMatchedQuoteItemsForLead({ service, message: "Requested work details" })[0];
    assert.equal(item.code, "");
    assert.equal(item.service, service);
    assert.equal(item.scope, "Requested work details");
  }
});

test("compound requests preserve catalog titles and do not repeat matching quote items", () => {
  assert.deepEqual(Array.from(parseCustomerServices("Other, None")), []);
  for (const item of SERVICE_TEMPLATES) {
    assert.deepEqual(Array.from(parseCustomerServices(item.service)), [item.service]);
  }
  const items = getMatchedQuoteItemsForLead({
    service: "Shower Cubicle Regrouting + Leaking Shower Repair + Balcony Regrouting",
    areas: "Main Bathroom",
  });
  assert.deepEqual(Array.from(items, item => item.code), ["MB-SS-WF-SH-EG", "BALCONY"]);
});

test("selecting a zero-priced item replaces a previous item's price", () => {
  const source = fs.readFileSync("app/admin/page.tsx", "utf8");
  const tree = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  const visit = node => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(tree) === "TemplatePicker") {
      handler = node.attributes.properties.find(prop => prop.name?.text === "onSelectTemplate").initializer.expression.getText(tree);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  assert.ok(handler);
  let selected;
  const compiled = ts.transpileModule(`(${handler})(template)`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(compiled, { idx: 0, quoteItems: [{ price: 1400, qty: 2 }], template: byCode("EN-DS-WB-TC-PG"), setQuoteItems: items => { selected = items[0]; } });
  assert.equal(selected.code, "EN-DS-WB-TC-PG");
  assert.equal(selected.templateNo, "2");
  assert.equal(selected.price, 0);
  assert.equal(selected.qty, 2);
});

test("the live library uses the revised scope instead of custom duplicates of old item codes", async () => {
  const { saveCustomQuoteTemplate, getAllQuoteTemplates } = loadTs("lib/quoteTemplates.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => false },
  });
  await saveCustomQuoteTemplate({ code: "en-ds-wb-tc-pg", service: "Old title", scope: "Old scope", price: 123 });
  await saveCustomQuoteTemplate({ code: "CUSTOM-NEW", service: "Additional custom work", scope: "Custom scope", price: 45 });
  const templates = await getAllQuoteTemplates();
  const revised = templates.filter(template => template.code === "EN-DS-WB-TC-PG");
  assert.equal(revised.length, 1);
  assert.equal(revised[0].scope, byCode("EN-DS-WB-TC-PG").scope);
  assert.ok(templates.some(template => template.code === "CUSTOM-NEW"));
});


test("the three repeated codes keep their own row, scope and price", () => {
  const variants = SERVICE_TEMPLATES.filter(item => item.code === "MB-SS-WF-SH-PG");
  assert.deepEqual(Array.from(variants, item => [item.no, item.price]), [["49", 1400], ["57", 0], ["68", 0]]);
  assert.equal(new Set(variants.map(item => item.scope)).size, 3);
  assert.equal(findBestTemplateForService(variants[0].service), null);
  assert.equal(bestTemplateForTask(variants[0].service), null);
  const { TemplatePicker } = loadTs("components/admin/TemplatePicker.tsx");
  for (const item of variants) {
    const html = renderToStaticMarkup(React.createElement(TemplatePicker, {
      selectedTemplateNo: item.no, selectedTemplateCode: item.code, onSelectTemplate() {},
    }));
    assert.ok(html.includes(item.service.replaceAll("&", "&amp;")));
  }
});

test("new repair sections render as headings and repaired tiles are categorized correctly", () => {
  const { isQuoteScopeHeading } = loadTs("lib/quoteScope.ts");
  const { getTemplateCategory } = loadTs("lib/serviceMatching.ts");
  for (const heading of ["COLOURS:", "TILE REPAIR WORK", "EPOXY REGROUTING WORK", "COMPLETION / OTHER"]) {
    assert.equal(isQuoteScopeHeading(heading), true);
  }
  const repair = byCode("TILE REPAIR");
  assert.equal(getTemplateCategory(repair), "Tile & Grout Repairs");
  assert.match(repair.scope, /Injection of specialist epoxy adhesive/);
  assert.equal(repair.price, 0);
  assert.equal(byCode("SCREEN REPLECEMENT").price, 0);
  assert.equal(getTemplateCategory(byCode("SCREEN REPLECEMENT")), "Screens & Upgrades");
});
