import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import type { PaymentReceipt } from "./paymentReceipt";

export async function buildPaymentReceiptPdf(receipt: PaymentReceipt) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(.02, .15, .28), teal = rgb(0, .36, .44), gold = rgb(.76, .58, .19);
  const text = (value: string, x: number, y: number, size = 12, strong = false, maxWidth = 495) => {
    const font = strong ? bold : regular;
    // Standard PDF fonts support Latin characters; replace unsupported glyphs safely.
    const clean = Array.from(value.replace(/\s+/g, " ")).map(c => { try { font.encodeText(c); return c; } catch { return "?"; } }).join("");
    const words = clean.split(" "); let line = "", yy = y;
    for (const word of words) {
      for (const char of (line ? " " : "") + word) {
        if (font.widthOfTextAtSize(line + char, size) > maxWidth) { page.drawText(line, { x, y: yy, size, font, color: navy }); yy -= size + 5; line = ""; }
        line += char;
      }
    }
    if (line) page.drawText(line, { x, y: yy, size, font, color: navy });
  };
  page.drawRectangle({ x: 22, y: 22, width: 551, height: 798, borderColor: navy, borderWidth: 1 });
  try {
    const logo = await doc.embedJpg(await fs.readFile(path.join(process.cwd(), "public/new_logo.jpeg")));
    const dims = logo.scaleToFit(245, 90);
    page.drawImage(logo, { x: 43, y: 715, ...dims });
  } catch { text("GROUTIX", 43, 750, 30, true); }
  text("Melbourne VIC\n", 365, 780, 11);
  text("(03) 7023 8094", 365, 760, 11);
  text("info@groutix.com", 365, 740, 11);
  text("ACN: 687 415 005", 365, 720, 11);
  page.drawRectangle({ x: 43, y: 698, width: 509, height: 3, color: gold });
  text("PAYMENT RECEIPT", 43, 654, 29, true);
  text("FULL PAYMENT RECEIVED", 43, 626, 13, true);
  const field = (label: string, value: string, x: number, y: number, width = 238) => { text(label, x, y, 10, true, width); text(value || "-", x, y - 22, 12, false, width); };
  field("RECEIPT NO.", receipt.number, 43, 580, 280);
  field("DATE RECEIVED", new Date(receipt.receivedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney" }), 365, 580, 185);
  field("INVOICE NO.", receipt.invoiceNumber, 43, 510);
  field("CUSTOMER", receipt.customerName, 310, 510);
  field("SERVICE ADDRESS", receipt.address, 43, 435, 495);
  page.drawRectangle({ x: 43, y: 280, width: 509, height: 78, color: rgb(.91, .97, .98), borderColor: teal, borderWidth: 1 });
  text("AMOUNT RECEIVED", 58, 328, 12, true);
  text(`AUD $${receipt.total.toFixed(2)}`, 58, 298, 25, true);
  field("INVOICE TOTAL (AUD)", `$${receipt.total.toFixed(2)}`, 43, 245, 155);
  field("TOTAL RECEIVED (AUD)", `$${receipt.total.toFixed(2)}`, 220, 245, 155);
  field("BALANCE DUE (AUD)", "$0.00", 410, 245, 140);
  text("PAYMENT ACKNOWLEDGEMENT", 43, 169, 12, true);
  text("This receipt confirms full payment of the invoice above to Groutix Pty Ltd.", 43, 145, 11);
  text("Please retain this receipt for your records.", 43, 124, 11);
  text("Thank you for choosing Groutix.", 43, 70, 17, true);
  return Buffer.from(await doc.save());
}
