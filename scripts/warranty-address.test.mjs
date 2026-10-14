import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as pdfLib from "pdf-lib";
import { loadTs } from "./test-ts-loader.mjs";

const { layoutWarrantyAddress } = loadTs("lib/warrantyAddressLayout.ts");

test("warranty addresses fit both certificate layouts without dropping text", async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const cases = [
    "12 Main Street",
    "Melbourne International Airport Terminal 4, Melbourne Airport VIC 3045, Australia",
    "Unit 123, Building 456, Melbourne International Airport Terminal 4, Departure Drive, Melbourne Airport, Victoria 3045, Australia",
    "A".repeat(180),
    "Terminal 4\nMelbourne Airport VIC 3045",
    "",
  ];
  for (const widths of [[308, 488], [349.28, 499.28]]) {
    for (const address of cases) {
      const measure = (text, size) => font.widthOfTextAtSize(text, size);
      const layout = layoutWarrantyAddress(address, widths, measure, 13);
      assert.ok(layout.lines.length <= 2, address);
      assert.equal(layout.lines.join("").replace(/\s/g, ""), address.replace(/\s/g, ""));
      layout.lines.forEach((line, index) => assert.ok(measure(line, layout.fontSize) <= widths[index] + 0.001));
      assert.ok(layout.fontSize > 0 && layout.fontSize <= 13);
    }
  }
  const airport = layoutWarrantyAddress(cases[1], [308, 488], (text, size) => font.widthOfTextAtSize(text, size), 13);
  assert.equal(airport.lines.length, 2);
  assert.equal(airport.fontSize, 13, "normal long addresses wrap at the original size");
});

test("the generated PDF draws the airport address within its margin and above the next field", async () => {
  const drawn = [];
  const { buildWarrantyPdfBase64 } = loadTs("lib/warrantyPdf.ts", {
    "./settings": { getSiteSettings: async () => { throw new Error("No logo in test"); } },
    "pdf-lib": {
      ...pdfLib,
      PDFDocument: {
        create: async () => {
          const doc = await PDFDocument.create();
          const addPage = doc.addPage.bind(doc);
          doc.addPage = (...args) => {
            const page = addPage(...args.map(arg => Array.isArray(arg) ? Array.from(arg) : arg));
            const drawLine = page.drawLine.bind(page);
            page.drawLine = options => drawLine({ ...options, start: { ...options.start }, end: { ...options.end } });
            const drawText = page.drawText.bind(page);
            page.drawText = (text, options) => {
              drawn.push({ text, ...options });
              return drawText(text, options);
            };
            return page;
          };
          return doc;
        },
      },
    },
  });
  const address = "Melbourne International Airport Terminal 4, Departure Drive, Melbourne Airport, Victoria 3045, Australia";
  const encoded = await buildWarrantyPdfBase64({
    jobNo: "Job No-1622", customerName: "Babar Sultan", address,
    completionDate: "14 Oct 2026", expiryDate: "14 Oct 2036",
  });
  const pdf = await PDFDocument.load(Buffer.from(encoded, "base64"));
  assert.equal(pdf.getPageCount(), 2);
  const start = drawn.findIndex(row => row.text === "PROPERTY ADDRESS:");
  const end = drawn.findIndex(row => row.text === "AUTHORISED BY GROUTIX:");
  const lines = drawn.slice(start + 1, end);
  assert.equal(lines.length, 2);
  assert.equal(lines.map(row => row.text).join(" "), address);
  for (const row of lines) {
    assert.ok(row.x + row.font.widthOfTextAtSize(row.text, row.size) <= 595.28 - 42);
    assert.ok(row.y > drawn[end].y);
  }
});
