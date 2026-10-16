import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import * as pdfLib from "pdf-lib";
import { loadTs } from "./test-ts-loader.mjs";

test("scope bullets and hanging indents render on the second quote page", async () => {
  const pages = [];
  const { buildQuotePdfBase64, computeQuoteTotals } = loadTs("lib/quotePdf.ts", {
    "./settings": { getSiteSettings: async () => { throw new Error("No logo in fixture"); } },
    "pdf-lib": { ...pdfLib, PDFDocument: { create: async () => {
      const doc = await pdfLib.PDFDocument.create();
      const addPage = doc.addPage.bind(doc);
      doc.addPage = (...args) => {
        const page = addPage(...args.map(arg => Array.isArray(arg) ? Array.from(arg) : arg));
        const calls = { circles: [], text: [] };
        pages.push(calls);
        const drawText = page.drawText.bind(page);
        const drawCircle = page.drawCircle.bind(page);
        const drawLine = page.drawLine.bind(page);
        page.drawLine = (options) => drawLine({ ...options, start: { ...options.start }, end: { ...options.end } });
        page.drawText = (text, options) => { calls.text.push({ text, ...options }); return drawText(text, options); };
        page.drawCircle = (options) => { calls.circles.push(options); return drawCircle(options); };
        return page;
      };
      return doc;
    } } },
  });
  const items = [
    { service: "Shower regrouting", scope: Array.from({ length: 28 }, (_, i) => `• Scope step ${i + 1}`).join("\n"), price: 1600 },
    { service: "Remove & Dispose Off Existing Shower Screen - Supply & Install Semi-Frameless Shower Screen (Silver)", price: 1245,
      scope: "SILICONE WORK\nRemove and dispose of the existing shower screen.\n• Supply and install a new semi-frameless shower screen with a brushed gold frame with handle.\n- Supply and install new toughened safety glass in accordance with Australian Standards.\no Secure the shower screen using appropriate fixings and brackets. Apply premium sanitary-grade, mould-resistant silicone to all required internal and external junctions.\nCOMPLETION / OTHER\nEnsure the shower screen is correctly aligned, levelled and operates smoothly. Remove all installation debris and leave the work area clean upon completion." },
  ];
  const totals = computeQuoteTotals(items, undefined, 10);
  assert.equal(totals.gst, 284.5);
  assert.equal(totals.total, 3130);
  const base64 = await buildQuotePdfBase64({ quoteNumber: "QT-1482", date: "12 Oct 2026", items, ...totals });
  const second = pages[1];
  assert.equal(second.circles.length, 5);
  const headings = second.text.filter(call => call.text === "SILICONE WORK" || call.text === "COMPLETION / OTHER");
  assert.equal(headings.length, 2);
  assert.ok(headings.every(call => call.x === 56 && call.font.name === "Helvetica-Bold"));
  const scopeText = second.text.filter(call => call.size === 7.5 && !headings.includes(call));
  assert.ok(scopeText.length > 5, "long bullet paragraphs should wrap");
  assert.ok(scopeText.every(call => call.x === 64), "wrapped text aligns after the bullet");
  assert.ok(second.circles.every(call => call.x === 58));
  assert.ok(scopeText.every(call => !/^[•*\-]|^o\s/.test(call.text)), "existing markers are not duplicated");
  if (process.env.QUOTE_PDF_PREVIEW) fs.writeFileSync(process.env.QUOTE_PDF_PREVIEW, Buffer.from(base64, "base64"));
});

test("inclusive PDF shows net unit prices and adds GST once while preserving the total", async () => {
  const texts = [];
  const { buildQuotePdfBase64, computeQuoteTotals } = loadTs("lib/quotePdf.ts", {
    "./settings": { getSiteSettings: async () => { throw new Error("No logo in fixture"); } },
    "pdf-lib": { ...pdfLib, PDFDocument: { create: async () => {
      const doc = await pdfLib.PDFDocument.create();
      const addPage = doc.addPage.bind(doc);
      doc.addPage = (...args) => {
        const page = addPage(...args.map(arg => Array.isArray(arg) ? Array.from(arg) : arg));
        const drawText = page.drawText.bind(page);
        const drawLine = page.drawLine.bind(page);
        page.drawLine = options => drawLine({ ...options, start: { ...options.start }, end: { ...options.end } });
        page.drawText = (text, options) => { texts.push(text); return drawText(text, options); };
        return page;
      };
      return doc;
    } } },
  });
  const items = [{ service: "Regrouting", price: 1000, qty: 1 }];
  const totals = computeQuoteTotals(items, "inclusive", 10);
  await buildQuotePdfBase64({ quoteNumber: "TEST", date: "16 Oct 2026", items, ...totals, taxMode: "inclusive", taxRate: 10 });
  assert.ok(texts.includes("UNIT PRICE"));
  assert.equal(texts.filter(text => text === "(EX GST)").length, 2);
  assert.ok(texts.filter(text => text === "$909.09").length >= 2);
  assert.ok(texts.some(text => /SUBTOTAL.*909\.09/.test(text)));
  assert.ok(texts.some(text => /GST.*90\.91/.test(text)));
  assert.ok(texts.some(text => /^TOTAL:.*1,?000\.00/.test(text)));
  assert.equal(items[0].price, 1000);
});
