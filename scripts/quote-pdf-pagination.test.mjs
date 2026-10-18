import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import * as pdfLib from "pdf-lib";
import { loadTs } from "./test-ts-loader.mjs";

function fixture() {
  const pages = [];
  const builder = loadTs("lib/quotePdf.ts", {
    "./settings": { getSiteSettings: async () => { throw new Error("No fixture logo"); } },
    "pdf-lib": { ...pdfLib, PDFDocument: { create: async () => {
      const doc = await pdfLib.PDFDocument.create();
      const addPage = doc.addPage.bind(doc);
      doc.addPage = (...args) => {
        const page = addPage(...args.map(arg => Array.isArray(arg) ? Array.from(arg) : arg));
        const calls = [];
        pages.push(calls);
        const drawText = page.drawText.bind(page);
        const drawLine = page.drawLine.bind(page);
        page.drawText = (text, options) => { calls.push({ text, ...options }); return drawText(text, options); };
        page.drawLine = options => drawLine({ ...options, start: { ...options.start }, end: { ...options.end } });
        return page;
      };
      return doc;
    } } },
  });
  return { ...builder, pages };
}

for (const docType of ["quote", "scope"]) {
  test(`${docType}: an oversized item starts on page one and continues without losing or clipping lines`, async () => {
    const { buildQuotePdfBase64, pages } = fixture();
    const scope = Array.from({ length: 180 }, (_, i) => `• Step ${String(i + 1).padStart(3, "0")}: Carefully prepare and seal the tile joints.`).join("\n");
    const base64 = await buildQuotePdfBase64({
      docType, quoteNumber: "PAGINATION-TEST", date: "18 Oct 2026", customerName: "Pagination Test Customer",
      items: [{ service: "Detailed shower restoration", description: scope, price: 1000, qty: 2 },
        { service: "Final inspection", scope: "Check every sealed joint.", price: 100, qty: 1 }],
      subtotal: 2100, gst: 210, total: 2310, taxMode: "exclusive", statusLabel: "UNPAID",
    });
    assert.ok(pages[0].some(call => call.text.startsWith("Step 001:")), "first page must include the long description");
    const itemPages = pages.filter(calls => calls.some(call => /^Step \d{3}:/.test(call.text)));
    assert.ok(itemPages.length >= 3, "fixture must exercise multiple page breaks inside one item");
    for (const calls of itemPages) {
      assert.ok(calls.some(call => call.text === "DESCRIPTION"), "repeat the table heading");
      assert.ok(calls.some(call => call.text === "QTY"));
      for (const call of calls.filter(call => call.size === 7.5)) {
        assert.ok(call.y >= 55 && call.y <= 600, `description outside content area: ${call.y}`);
        const edge = docType === "scope" ? 504.28 : 354.28;
        assert.ok(call.x + call.font.widthOfTextAtSize(call.text, call.size) <= edge + 0.01, "description must stay inside its column");
      }
    }
    const texts = pages.flat().map(call => call.text);
    for (let i = 1; i <= 180; i++) {
      const marker = `Step ${String(i).padStart(3, "0")}:`;
      assert.equal(texts.filter(text => text.startsWith(marker)).length, 1, `${marker} must appear exactly once`);
    }
    assert.equal(pages.flat().filter(call => call.text === "2").length, 1, "quantity is not duplicated on continuation pages");
    if (docType === "quote") {
      const summary = pages.flat().filter(call => /^(SUBTOTAL:|GST \(10%\):|TOTAL:|Status:)/.test(call.text));
      assert.equal(summary.length, 4);
      assert.ok(summary.every(call => call.y >= 55), "summary must clear the footer");
      if (process.env.QUOTE_PDF_PREVIEW) fs.writeFileSync(process.env.QUOTE_PDF_PREVIEW, Buffer.from(base64, "base64"));
    }
    assert.ok(texts.includes("Customer Signature"), "terms and acceptance must still render");
  });
}

test("long unbroken text wraps within the description column", async () => {
  const { buildQuotePdfBase64, pages } = fixture();
  await buildQuotePdfBase64({ quoteNumber: "WORD-WRAP", date: "18 Oct 2026",
    items: [{ service: "Tile restoration", scope: "x".repeat(1800), price: 10 }], subtotal: 10, gst: 1, total: 11 });
  const lines = pages.flat().filter(call => call.size === 7.5);
  assert.equal(lines.map(call => call.text).join(""), "x".repeat(1800));
  assert.ok(lines.every(call => call.font.widthOfTextAtSize(call.text, call.size) <= 298.28 + 0.01));
});
