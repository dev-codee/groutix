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
        calls.images = [];
        calls.rules = [];
        pages.push(calls);
        const drawText = page.drawText.bind(page);
        const drawLine = page.drawLine.bind(page);
        const drawImage = page.drawImage.bind(page);
        page.drawText = (text, options) => { calls.push({ text, ...options }); return drawText(text, options); };
        page.drawLine = options => { calls.rules.push(options); return drawLine({ ...options, start: { ...options.start }, end: { ...options.end } }); };
        page.drawImage = (image, options) => { calls.images.push(options); return drawImage(image, options); };
        return page;
      };
      return doc;
    } } },
  }, { Uint8Array });
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

for (const docType of ["quote", "scope"]) {
  test(`${docType}: a long row that fits a fresh page uses the current page before continuing`, async () => {
    const { buildQuotePdfBase64, pages } = fixture();
    const scope = Array.from({ length: 44 }, (_, i) => `Medium step ${String(i + 1).padStart(3, "0")}`).join("\n");
    const base64 = await buildQuotePdfBase64({ docType, quoteNumber: "MEDIUM-ROW", date: "2 Nov 2026",
      customerName: "Page Break Test", items: [
        { service: "Initial preparation", scope: Array.from({ length: 12 }, (_, i) => `Preparation ${i + 1}`).join("\n"), price: 100 },
        { service: "Detailed restoration", scope, price: 200 },
      ], subtotal: 300, gst: 30, total: 330, taxMode: "exclusive" });
    assert.ok(pages[0].some(call => call.text === "Medium step 001"), "a long second item must start in the available space");
    assert.ok(pages[1].some(call => call.text === "Medium step 044"), "the remaining scope continues on the next page");
    assert.equal(pages.flat().filter(call => call.text === "$200.00").length, docType === "quote" ? 2 : 0);
    for (let i = 1; i <= 44; i++) {
      assert.equal(pages.flat().filter(call => call.text === `Medium step ${String(i).padStart(3, "0")}`).length, 1);
    }
    if (process.env.QUOTE_PDF_PREVIEW_DIR) fs.writeFileSync(`${process.env.QUOTE_PDF_PREVIEW_DIR}/${docType}-medium.pdf`, Buffer.from(base64, "base64"));
  });
}

test("a moderately long first item does not leave the first page empty", async () => {
  const { buildQuotePdfBase64, pages } = fixture();
  await buildQuotePdfBase64({ quoteNumber: "FIRST-ROW", date: "2 Nov 2026", customerName: "Page Break Test",
    items: [{ service: "Restoration", scope: Array.from({ length: 44 }, (_, i) => `First step ${i + 1}`).join("\n"), price: 100 }],
    subtotal: 100, gst: 10, total: 110 });
  assert.ok(pages[0].some(call => call.text === "First step 1"));
  assert.ok(pages[0].some(call => call.text === "First step 44"), "use the bottom space previously reserved below every row");
});

test("row borders, images, totals, and signed acceptance stay above the footer at page boundaries", async () => {
  // A valid 10 x 1000 PNG exercises the signature height limit as well as its width.
  const tallSignature = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAPoCAIAAABoNPj+AAAANUlEQVR4nO3BgQAAAADDoPlTX+EAVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwGeRgAAbAahAwAAAAASUVORK5CYII=";
  for (const count of [39, 43, 46, 50, 55, 98]) {
    const { buildQuotePdfBase64, pages } = fixture();
    const base64 = await buildQuotePdfBase64({ quoteNumber: `BOTTOM-${count}`, date: "2 Nov 2026",
      items: [{ service: "Restoration", scope: Array.from({ length: count }, (_, i) => `Boundary step ${i + 1}`).join("\n"), price: 100 }],
      subtotal: 100, gst: 10, total: 110, statusLabel: "UNPAID",
      terms: `Groutix terms and conditions\n${Array.from({ length: 37 }, (_, i) => `Clause detail ${i + 1}: ${"Agreed work and warranty provisions. ".repeat(2)}`).join("\n")}`,
      customerSignatureImage: `data:image/png;base64,${tallSignature}`, customerSignedAt: "2 Nov 2026" });
    for (const calls of pages) {
      assert.ok(calls.filter(call => !call.text.startsWith("Thank you for choosing")).every(call => call.y >= 55), "all content clears the footer");
      assert.ok(calls.rules.every(rule => rule.start.y >= 55 && rule.end.y >= 55), "row borders clear the footer");
      assert.ok(calls.images.every(image => image.y >= 55), "images clear the footer");
      if (calls.some(call => call.text === "DESCRIPTION")) {
        assert.ok(calls.some(call => call.size === 7.5 || (call.size === 9 && call.font.name === "Helvetica-Bold")), "table headings are followed by item content");
      }
    }
    const lastPage = pages.at(-1);
    assert.equal(lastPage.images.length, 1);
    assert.ok(lastPage.images[0].height <= 60);
    assert.ok(lastPage.some(call => call.text === "Customer Signature"));
    if (count === 46 && process.env.QUOTE_PDF_PREVIEW_DIR) fs.writeFileSync(`${process.env.QUOTE_PDF_PREVIEW_DIR}/signed-boundary.pdf`, Buffer.from(base64, "base64"));
  }
});
