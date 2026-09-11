// Server-side quotation PDF builder (pdf-lib — pure JS, safe on serverless).
// Produces the official branded Groutix A4 quote with customer details,
// job description, itemized pricing table, full 20-clause terms & conditions,
// and customer signature block.

import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { GROUTIX_QUOTE_TERMS } from "./serviceTemplates";

export interface QuotePdfItem {
  service?: string;
  description?: string;
  scope?: string;
  price?: number;
  qty?: number;
}

export interface QuotePdfInput {
  quoteNumber: string;
  date: string;
  customerName?: string;
  address?: string;
  phone?: string;
  email?: string;
  jobDescription?: string; // «job.work_done_description»
  items: QuotePdfItem[];
  subtotal: number;
  gst: number;
  total: number;
  taxName?: string; // e.g. "GST (10%)"
  specialNotes?: string;
  terms?: string;
  businessPhone?: string;
  // Document type controls the heading/labels so the same branded layout can
  // render either a quotation or a tax invoice. Defaults to "quote".
  docType?: "quote" | "invoice";
  // Optional status line (e.g. "PAID" / "UNPAID") shown under the total.
  statusLabel?: string;
  customerSignatureImage?: string; // base64 / data URL for «image_customer_signature»
  customerSignedAt?: string;
  // Invoice-specific fields (matching official Groutix Tax Invoice layout)
  businessEmail?: string;
  businessAddress?: string;
  amountPaid?: number;
  balanceDue?: number;
  dueDate?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bsb?: string;
}

/** Derive subtotal / GST / total from quote items and the tax mode. */
export function computeQuoteTotals(
  items: QuotePdfItem[],
  mode: string | undefined,
  rate: number,
  quoteAmount?: number
): { subtotal: number; gst: number; total: number } {
  const rawSub = items.reduce((a, x) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
  if (mode === "exclusive") {
    const gst = rawSub * (rate / 100);
    return { subtotal: rawSub, gst, total: rawSub + gst };
  }
  if (mode === "none") {
    return { subtotal: rawSub, gst: 0, total: rawSub };
  }
  // inclusive: entered prices already contain GST.
  const total = quoteAmount || rawSub;
  const subtotal = total / (1 + rate / 100);
  return { subtotal, gst: total - subtotal, total };
}

const BRAND = rgb(0, 0.122, 0.592); // #001f97
const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.38, 0.43, 0.51);
const LINE = rgb(0.88, 0.90, 0.93);
const ZEBRA = rgb(0.97, 0.98, 0.99);

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 48;

function money(n: number): string {
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

/** Sanitize unicode characters that fail StandardFonts (WinAnsiEncoding). */
function cleanPdfText(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/[\uFEFF]/g, "")
    .replace(/[^\x00-\xFF]/g, (ch) => {
      if (ch === "—" || ch === "–") return "-";
      if (ch === "“" || ch === "”") return '"';
      if (ch === "‘" || ch === "’") return "'";
      if (ch === "…" || ch === "…") return "...";
      if (ch === "•") return "*";
      return "";
    });
}

/** Word-wrap text into lines for a given font, size and max width while preserving explicit line breaks. */
function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const rawLines = String(text || "").split(/\r?\n/);
  const result: string[] = [];
  for (const rawLine of rawLines) {
    const trimmed = cleanPdfText(rawLine).trim();
    if (!trimmed) {
      result.push("");
      continue;
    }
    const words = trimmed.split(/\s+/);
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && cur) {
        result.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) result.push(cur);
  }
  return result.length ? result : [""];
}

export async function buildQuotePdfBase64(input: QuotePdfInput): Promise<string> {
  if (input.docType === "invoice") {
    return buildInvoicePdfBase64(input);
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`Groutix Quotation ${input.quoteNumber}`);
  doc.setProducer("Groutix CRM");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const GOLD = rgb(0.85, 0.72, 0.28);
  const INK = rgb(0.1, 0.1, 0.1);
  const MUTED = rgb(0.38, 0.42, 0.48);
  const LINE = rgb(0.88, 0.9, 0.93);
  const BRAND = rgb(0, 0.122, 0.592);
  const ZEBRA = rgb(0.97, 0.98, 0.99);

  const contentW = A4.w - MARGIN * 2;
  const bottomLimit = 55;

  let logoImg: any = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      logoImg = await doc.embedPng(fs.readFileSync(logoPath));
    }
  } catch {
    // fallback if logo unavailable
  }

  // Draw official Groutix header on every page: Logo on left, right-aligned contact, Quote in gold, ACN, Quote # & Date on right
  const drawQuoteHeader = (targetPage: any) => {
    // 1. Logo (Top-Left)
    if (logoImg) {
      const drawH = 46;
      const drawW = (logoImg.width / logoImg.height) * drawH;
      targetPage.drawImage(logoImg, {
        x: MARGIN,
        y: A4.h - MARGIN - drawH + 4,
        width: drawW,
        height: drawH,
      });
    } else {
      targetPage.drawText("GROUTIX", {
        x: MARGIN,
        y: A4.h - MARGIN - 20,
        size: 24,
        font: bold,
        color: BRAND,
      });
    }

    // 2. Right-aligned header column
    const rightX = A4.w - MARGIN;
    let ry = A4.h - MARGIN;

    const drawR = (str: string, f: PDFFont, sz: number, clr: any) => {
      const cleaned = cleanPdfText(str);
      const w = f.widthOfTextAtSize(cleaned, sz);
      targetPage.drawText(cleaned, {
        x: rightX - w,
        y: ry,
        size: sz,
        font: f,
        color: clr,
      });
    };

    const addrLines = input.businessAddress
      ? input.businessAddress.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : ["1/14 St Andrews St", "Brighton VIC", "3186"];
    for (const line of addrLines) {
      drawR(line, font, 8.5, INK);
      ry -= 10.5;
    }
    drawR(input.businessPhone || "1300 476 884", font, 8.5, INK);
    ry -= 10.5;
    drawR(input.businessEmail || "info@groutix.com.au", font, 8.5, INK);
    ry -= 14;

    drawR("Quote", bold, 15, GOLD);
    ry -= 13;
    drawR("ACN: 687 415 005", bold, 8.5, INK);
    ry -= 16;

    drawR(`Quote # ${input.quoteNumber}`, font, 8.5, INK);
    ry -= 11;
    drawR(input.date || new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }), font, 8.5, INK);
  };

  // Draw centered «final_note» at the bottom of the page (no terms links)
  const drawQuoteFooter = (targetPage: any) => {
    const noteText = input.specialNotes?.trim();
    if (!noteText) return;
    const cleaned = cleanPdfText(noteText);
    const sz = 8;
    const w = font.widthOfTextAtSize(cleaned, sz);
    targetPage.drawText(cleaned, {
      x: (A4.w - w) / 2,
      y: 35,
      size: sz,
      font,
      color: INK,
    });
  };

  // ── PAGE 1: Quotation Details & Itemized Table ──
  let page1 = doc.addPage([A4.w, A4.h]);
  drawQuoteHeader(page1);
  drawQuoteFooter(page1);

  let y = 600;

  const rightTextOnPage = (
    p: any,
    s: string,
    rx: number,
    yy: number,
    f: PDFFont,
    sz: number,
    clr: any = INK
  ) => {
    const cleaned = cleanPdfText(s);
    const w = f.widthOfTextAtSize(cleaned, sz);
    p.drawText(cleaned, { x: rx - w, y: yy, size: sz, font: f, color: clr });
  };

  // 1. Customer Details / Billing Address («job.instantpost_billing_address»)
  if (input.customerName) {
    page1.drawText(cleanPdfText(input.customerName), { x: MARGIN, y, size: 9.5, font: bold, color: INK });
    y -= 12;
  }
  if (input.address) {
    const addrLines = wrapLines(input.address, font, 9, 300);
    for (const ln of addrLines) {
      page1.drawText(cleanPdfText(ln), { x: MARGIN, y, size: 9, font, color: INK });
      y -= 11.5;
    }
  }
  const contactParts: string[] = [];
  if (input.phone) contactParts.push(input.phone);
  if (input.email) contactParts.push(input.email);
  if (contactParts.length > 0) {
    page1.drawText(cleanPdfText(contactParts.join("   *   ")), { x: MARGIN, y, size: 8.5, font, color: MUTED });
    y -= 12;
  }
  y -= 14;

  // 2. JOB DESCRIPTION («job.work_done_description»)
  const jobDesc = (input.jobDescription || "").trim();
  if (jobDesc) {
    page1.drawText("JOB DESCRIPTION:", { x: MARGIN, y, size: 9.5, font: bold, color: INK });
    y -= 13;
    const descLines = wrapLines(jobDesc, font, 8.5, contentW);
    for (const ln of descLines) {
      if (ln === "") {
        y -= 4;
      } else {
        page1.drawText(cleanPdfText(ln), { x: MARGIN, y, size: 8.5, font, color: INK });
        y -= 11;
      }
    }
    y -= 14;
  }

  // 3. Items Table (DESCRIPTION | QTY | UNIT PRICE | TOTAL PRICE)
  const colDescX = MARGIN + 8;
  const colQtyRight = A4.w - MARGIN - 170;
  const colPriceRight = A4.w - MARGIN - 85;
  const colAmountRight = A4.w - MARGIN - 8;

  // Header row
  page1.drawRectangle({
    x: MARGIN,
    y: y - 16,
    width: contentW,
    height: 18,
    color: rgb(0.95, 0.95, 0.96),
  });
  page1.drawText("DESCRIPTION", { x: colDescX, y: y - 11, size: 8.5, font: bold, color: INK });
  rightTextOnPage(page1, "QTY", colQtyRight, y - 11, bold, 8.5);
  rightTextOnPage(page1, "UNIT PRICE", colPriceRight, y - 11, bold, 8.5);
  rightTextOnPage(page1, "TOTAL PRICE", colAmountRight, y - 11, bold, 8.5);
  y -= 22;

  const items = input.items.length
    ? input.items
    : [{ service: "Regrouting & waterproof resealing", price: input.total, qty: 1 }];

  let zebra = false;
  for (const it of items) {
    const label = it.service || it.description || "Regrouting & waterproof resealing";
    const descLines = wrapLines(label, bold, 9, colQtyRight - colDescX - 15).filter(Boolean);

    const extraScope =
      it.scope && it.scope !== label
        ? it.scope
        : it.description && it.description !== label
        ? it.description
        : "";
    const scopeLines = extraScope
      ? wrapLines(extraScope, font, 7.5, colQtyRight - colDescX - 15).filter(Boolean)
      : [];

    const qty = Number(it.qty || 1);
    const price = Number(it.price || 0);
    const amount = price * qty;

    const rowContentH = descLines.length * 11 + scopeLines.length * 9.5;
    const rowH = Math.max(22, rowContentH + 12);

    if (y - rowH < bottomLimit + 75) {
      page1 = doc.addPage([A4.w, A4.h]);
      drawQuoteHeader(page1);
      drawQuoteFooter(page1);
      y = 635;
    }

    if (zebra) {
      page1.drawRectangle({ x: MARGIN, y: y - rowH, width: contentW, height: rowH, color: ZEBRA });
    }
    zebra = !zebra;

    let ty = y - 6 - 7;
    for (const ln of descLines) {
      page1.drawText(cleanPdfText(ln), { x: colDescX, y: ty, size: 9, font: bold, color: INK });
      ty -= 11;
    }
    for (const ln of scopeLines) {
      page1.drawText(cleanPdfText(ln), { x: colDescX, y: ty, size: 7.5, font, color: MUTED });
      ty -= 9.5;
    }

    const midY = y - 6 - 7;
    rightTextOnPage(page1, qty > 0 ? String(qty) : "1", colQtyRight, midY, font, 9);
    rightTextOnPage(page1, money(price), colPriceRight, midY, font, 9);
    rightTextOnPage(page1, money(amount), colAmountRight, midY, bold, 9);

    y -= rowH;
    page1.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4.w - MARGIN, y },
      thickness: 0.5,
      color: LINE,
    });
  }

  // 4. Financial Summary (SUBTOTAL | TAX | TOTAL)
  y -= 20;
  rightTextOnPage(page1, `SUBTOTAL:   ${money(input.subtotal)}`, colAmountRight, y, font, 9.5);
  y -= 14;
  const taxLabel = input.taxName || "GST (10%):";
  rightTextOnPage(page1, `${taxLabel}   ${money(input.gst)}`, colAmountRight, y, font, 9.5);
  y -= 16;
  rightTextOnPage(page1, `TOTAL:   ${money(input.total)}`, colAmountRight, y, bold, 10.5);

  if (input.statusLabel) {
    y -= 15;
    const paid = /paid/i.test(input.statusLabel) && !/unpaid/i.test(input.statusLabel);
    rightTextOnPage(
      page1,
      `Status:  ${input.statusLabel.toUpperCase()}`,
      colAmountRight,
      y,
      bold,
      9.5,
      paid ? rgb(0.09, 0.6, 0.35) : rgb(0.86, 0.15, 0.15)
    );
  }

  // ── PAGES 2+: Full Text of All 20 Terms & Conditions Across Pages ──
  const termsContent = (
    input.terms && input.terms.length > 500 ? input.terms : GROUTIX_QUOTE_TERMS
  ).trim();

  if (termsContent) {
    let curPage = doc.addPage([A4.w, A4.h]);
    drawQuoteHeader(curPage);
    drawQuoteFooter(curPage);

    let ty = 635;

    const newTermsPage = () => {
      curPage = doc.addPage([A4.w, A4.h]);
      drawQuoteHeader(curPage);
      drawQuoteFooter(curPage);
      ty = 635;
    };

    const termLines = termsContent.split(/\r?\n/);
    for (let i = 0; i < termLines.length; i++) {
      const raw = termLines[i].trim();
      if (!raw) continue;

      // Skip signature placeholders from the raw string as we render the signature block explicitly at the end
      if (
        /^I have read and agree/i.test(raw) ||
        /^\.{5,}/.test(raw) ||
        /^…{5,}/.test(raw) ||
        /^Customer Signature/i.test(raw)
      ) {
        continue;
      }

      const isMainTitle = /^Groutix terms and conditions/i.test(raw);
      const isClauseHeading = /^\d{1,2}\s+[A-Za-z]/.test(raw);

      const f = isMainTitle || isClauseHeading ? bold : font;
      const sz = isMainTitle ? 12 : isClauseHeading ? 9.8 : 9.1;
      const lh = isMainTitle ? 16 : isClauseHeading ? 13.5 : 12.3;

      if (isClauseHeading) {
        ty -= 7;
      }

      const wrapped = wrapLines(raw, f, sz, contentW);
      for (const w of wrapped) {
        if (ty - lh < bottomLimit) {
          newTermsPage();
        }
        curPage.drawText(cleanPdfText(w), {
          x: MARGIN,
          y: ty,
          size: sz,
          font: f,
          color: INK,
        });
        ty -= lh;
      }
      ty -= 3.5;
    }

    // Customer Acceptance & Signature Block
    const sigNeeded = input.customerSignatureImage ? 110 : 70;
    if (ty - sigNeeded < bottomLimit) {
      newTermsPage();
    }

    ty -= 14;
    curPage.drawText("I have read and agree to the terms and conditions.", {
      x: MARGIN,
      y: ty,
      size: 9,
      font,
      color: INK,
    });
    ty -= 20;

    if (input.customerSignatureImage) {
      try {
        const raw = input.customerSignatureImage.trim();
        const base64Data = raw.replace(/^data:image\/\w+;base64,/, "");
        const imgBytes = Uint8Array.from(Buffer.from(base64Data, "base64"));
        const isJpg = /^data:image\/jpe?g/i.test(raw);
        const img = isJpg ? await doc.embedJpg(imgBytes) : await doc.embedPng(imgBytes);
        const dims = img.scale(0.35);
        const drawW = Math.min(dims.width, 160);
        const drawH = (dims.height / dims.width) * drawW;
        curPage.drawImage(img, {
          x: MARGIN,
          y: ty - drawH,
          width: drawW,
          height: drawH,
        });
        ty -= drawH + 6;
      } catch (e) {
        console.warn("Could not embed signature image in quote PDF:", e);
      }
    }

    curPage.drawText("………………………………………………..", {
      x: MARGIN,
      y: ty,
      size: 9,
      font,
      color: INK,
    });
    ty -= 12;
    curPage.drawText("Customer Signature", {
      x: MARGIN,
      y: ty,
      size: 9,
      font,
      color: INK,
    });
    if (input.customerSignedAt) {
      ty -= 10;
      curPage.drawText(`Date: ${input.customerSignedAt}`, {
        x: MARGIN,
        y: ty,
        size: 8,
        font,
        color: MUTED,
      });
      if (input.customerSignatureImage) {
        ty -= 9;
        curPage.drawText("Digitally accepted & signed online via Groutix Secure Portal", {
          x: MARGIN,
          y: ty,
          size: 7,
          font,
          color: MUTED,
        });
      }
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

/**
 * Builds the official Groutix Tax Invoice PDF matching the specific two-page
 * invoice layout with prominent Groutix logo, amber headings, itemized table,
 * balance due breakdown, coral-bordered deposit payment info box, terms link,
 * and service warranty link on page 2.
 */
export async function buildInvoicePdfBase64(input: QuotePdfInput): Promise<string> {
  const doc = await PDFDocument.create();
  const invoiceNumber = input.quoteNumber || "INV-0001";
  doc.setTitle(`Groutix Tax Invoice ${invoiceNumber}`);
  doc.setProducer("Groutix CRM");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const GOLD = rgb(0.93, 0.67, 0.12);
  const INK = rgb(0.10, 0.10, 0.10);
  const MUTED = rgb(0.40, 0.43, 0.48);
  const LINE = rgb(0.85, 0.86, 0.88);
  const BLUE_TITLE = rgb(0.12, 0.29, 0.52);
  const LINK_BLUE = rgb(0.10, 0.36, 0.78);
  const CORAL_BORDER = rgb(0.82, 0.38, 0.38);

  let page = doc.addPage([A4.w, A4.h]);
  const contentW = A4.w - MARGIN * 2;
  let y = A4.h - 45;

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    const cleaned = cleanPdfText(s);
    page.drawText(cleaned, {
      x,
      y: yy,
      size: opts.size ?? 9,
      font: opts.font ?? font,
      color: opts.color ?? INK,
    });
  };

  const rightText = (
    s: string,
    rightX: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    const cleaned = cleanPdfText(s);
    const f = opts.font ?? font;
    const size = opts.size ?? 9;
    text(cleaned, rightX - f.widthOfTextAtSize(cleaned, size), yy, opts);
  };

  const ensureRoom = (needed: number) => {
    if (y - needed < MARGIN + 20) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - 45;
    }
  };

  // 1. Logo (Top-Left)
  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await doc.embedPng(logoBytes);
      const drawH = 46;
      const drawW = (logoImg.width / logoImg.height) * drawH;
      page.drawImage(logoImg, {
        x: MARGIN,
        y: y - drawH,
        width: drawW,
        height: drawH,
      });
      logoDrawn = true;
    }
  } catch {
    // fallback to text brand
  }

  if (!logoDrawn) {
    text("GROUTIX", MARGIN, y - 10, { font: bold, size: 24, color: BRAND });
  }

  // 2. Top-Right Header Column (Left-aligned column at x ≈ 410)
  const rightColX = 410;
  let ry = y;
  text(input.businessAddress || "Melbourne, VIC", rightColX, ry, { size: 9, color: INK });
  ry -= 12;
  text(input.businessPhone || "1300 476 884", rightColX, ry, { size: 9, color: INK });
  ry -= 12;
  text(input.businessEmail || "info@groutix.com.au", rightColX, ry, { size: 9, color: INK });
  ry -= 16;
  text("TAX INVOICE", rightColX, ry, { font: bold, size: 10.5, color: INK });
  ry -= 12;
  text("ACN: 687 415 005", rightColX, ry, { font: bold, size: 9, color: INK });
  ry -= 16;
  text(`Tax Invoice No: ${invoiceNumber}`, rightColX, ry, { font: bold, size: 9.5, color: INK });
  ry -= 12;
  text(input.date || new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }), rightColX, ry, { size: 9, color: INK });

  // Move below header
  y = Math.min(y - 58, ry - 18);

  // 3. Billing Address («job.instantpost_billing_address»)
  if (input.customerName) {
    text(input.customerName, MARGIN, y, { font: bold, size: 9.5, color: INK });
    y -= 12;
  }
  if (input.address) {
    const addrLines = wrapLines(input.address, font, 9, contentW - 160);
    for (const ln of addrLines) {
      if (ln) {
        text(ln, MARGIN, y, { size: 9, color: INK });
        y -= 11.5;
      }
    }
  }
  const contactPieces: string[] = [];
  if (input.phone) contactPieces.push(`Phone: ${input.phone}`);
  if (input.email) contactPieces.push(`Email: ${input.email}`);
  if (contactPieces.length > 0) {
    text(contactPieces.join("   *   "), MARGIN, y, { size: 8.5, color: MUTED });
    y -= 12;
  }
  y -= 10;

  // 4. WORK COMPLETED («job.work_done_description»)
  const items = input.items && input.items.length
    ? input.items
    : [{ service: "Regrouting & waterproof resealing", price: input.total, qty: 1 }];

  const jobDesc = (
    input.jobDescription ||
    (items[0]?.scope || items[0]?.description || items[0]?.service || "Regrouting, tile restoration and shower sealing.")
  ).trim();

  ensureRoom(40);
  text("WORK COMPLETED", MARGIN, y, { font: bold, size: 10.5, color: GOLD });
  y -= 13;
  const descLines = wrapLines(jobDesc, font, 8.5, contentW);
  for (const ln of descLines) {
    ensureRoom(12);
    if (ln === "") {
      y -= 4;
    } else {
      text(ln, MARGIN, y, { size: 8.5, color: INK });
      y -= 11;
    }
  }
  y -= 10;

  // 5. Items Table (DESCRIPTION | QUANTITY | PRICE | TOTAL)
  const colDescX = MARGIN;
  const colQtyRight = 370;
  const colPriceRight = 455;
  const colTotalRight = A4.w - MARGIN;

  ensureRoom(35);
  text("DESCRIPTION", colDescX, y, { font: bold, size: 9.5, color: GOLD });
  rightText("QUANTITY", colQtyRight, y, { font: bold, size: 9.5, color: GOLD });
  rightText("PRICE", colPriceRight, y, { font: bold, size: 9.5, color: GOLD });
  rightText("TOTAL", colTotalRight, y, { font: bold, size: 9.5, color: GOLD });

  y -= 5;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4.w - MARGIN, y },
    thickness: 0.5,
    color: LINE,
  });
  y -= 14;

  for (const it of items) {
    const label = it.service || it.description || "Regrouting & waterproof resealing";
    const itemDescLines = wrapLines(label, font, 9, colQtyRight - colDescX - 20).filter(Boolean);
    const extraScope = it.scope && it.scope !== label ? it.scope : "";
    const scopeLines = extraScope ? wrapLines(extraScope, font, 7.5, colQtyRight - colDescX - 20).filter(Boolean) : [];

    const qty = Number(it.qty || 1);
    const price = Number(it.price || 0);
    const amount = price * qty;

    const rowH = itemDescLines.length * 11 + scopeLines.length * 9.5 + 4;
    ensureRoom(rowH + 10);

    const rowMidY = y;
    for (const ln of itemDescLines) {
      text(ln, colDescX, y, { font, size: 9, color: INK });
      y -= 11;
    }
    for (const ln of scopeLines) {
      text(ln, colDescX, y, { font, size: 7.5, color: MUTED });
      y -= 9.5;
    }

    rightText(qty > 0 ? String(qty) : "1", colQtyRight, rowMidY, { size: 9 });
    rightText(money(price), colPriceRight, rowMidY, { size: 9 });
    rightText(money(amount), colTotalRight, rowMidY, { size: 9 });

    y -= 3;
  }

  y -= 3;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4.w - MARGIN, y },
    thickness: 0.5,
    color: LINE,
  });
  y -= 14;

  // 6. Financial Summary
  const isPaidStatus = Boolean(
    input.statusLabel &&
    /paid/i.test(input.statusLabel) &&
    !/unpaid/i.test(input.statusLabel)
  );
  const amountPaid = input.amountPaid !== undefined
    ? input.amountPaid
    : isPaidStatus
    ? input.total
    : 0;
  const balanceDue = input.balanceDue !== undefined
    ? input.balanceDue
    : Math.max(0, input.total - amountPaid);

  ensureRoom(80);
  const totalsLabelRight = colPriceRight;
  const drawSummary = (label: string, val: string, opts: { strong?: boolean; sz?: number } = {}) => {
    const f = opts.strong ? bold : font;
    const sz = opts.sz ?? (opts.strong ? 10 : 9);
    rightText(label, totalsLabelRight, y, { font: f, size: sz, color: opts.strong ? INK : MUTED });
    rightText(val, colTotalRight, y, { font: f, size: sz, color: INK });
    y -= 13.5;
  };

  drawSummary("SUBTOTAL", money(input.subtotal));
  const taxLabel = input.taxName || "GST (10%)";
  drawSummary(taxLabel, money(input.gst));
  drawSummary("TOTAL", money(input.total), { strong: true });
  drawSummary("AMOUNT PAID", money(amountPaid));
  drawSummary("BALANCE DUE", money(balanceDue), { strong: true, sz: 10.5 });

  y -= 18;

  // 7. HOW TO PAY: & PAYMENT INFORMATION Box
  ensureRoom(130);
  text("HOW TO PAY:", MARGIN, y, { font: bold, size: 13, color: GOLD });
  y -= 13;
  text("We accept payment by: Deposit", MARGIN, y, { size: 9.5, color: INK });
  y -= 10;

  const boxX = MARGIN;
  const boxW = 275;
  const boxH = 76;
  const boxY = y - boxH;

  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxW,
    height: boxH,
    borderColor: CORAL_BORDER,
    borderWidth: 0.8,
  });

  const bulletX = boxX + 14;
  const textX = boxX + 22;
  let iy = y - 16;
  text("PAYMENT INFORMATION", boxX + 12, iy, { font: bold, size: 12, color: INK });

  iy -= 14;
  page.drawCircle({ x: bulletX, y: iy + 2.5, size: 1.5, color: INK });
  text("Bank Name: ", textX, iy, { size: 8.5, color: INK });
  text(input.bankName || "ANZ", textX + font.widthOfTextAtSize("Bank Name: ", 8.5), iy, { font: bold, size: 8.5, color: INK });

  iy -= 12;
  page.drawCircle({ x: bulletX, y: iy + 2.5, size: 1.5, color: INK });
  text("Account Name: ", textX, iy, { size: 8.5, color: INK });
  text(input.accountName || "Groutix Pty Ltd", textX + font.widthOfTextAtSize("Account Name: ", 8.5), iy, { font: bold, size: 8.5, color: INK });

  iy -= 12;
  page.drawCircle({ x: bulletX, y: iy + 2.5, size: 1.5, color: INK });
  text("Account Number: ", textX, iy, { size: 8.5, color: INK });
  text(input.accountNumber || "123456789", textX + font.widthOfTextAtSize("Account Number: ", 8.5), iy, { font: bold, size: 8.5, color: INK });

  iy -= 12;
  page.drawCircle({ x: bulletX, y: iy + 2.5, size: 1.5, color: INK });
  text("BSB: ", textX, iy, { size: 8.5, color: INK });
  text(input.bsb || "013442", textX + font.widthOfTextAtSize("BSB: ", 8.5), iy, { font: bold, size: 8.5, color: INK });

  y = boxY - 26;

  // 8. TERMS & CONDITIONS (Page 1 bottom)
  ensureRoom(80);
  const tcTitle = "TERMS & CONDITIONS";
  const tcW = bold.widthOfTextAtSize(tcTitle, 15);
  text(tcTitle, (A4.w - tcW) / 2, y, { font: bold, size: 15, color: BLUE_TITLE });
  y -= 16;

  const tcStartX = (A4.w - 210) / 2;
  const dueDateStr = input.dueDate || "within 7 days of invoice date";
  page.drawCircle({ x: tcStartX, y: y + 2.5, size: 1.5, color: INK });
  text(`Payment is due ${dueDateStr}`, tcStartX + 8, y, { size: 9, color: INK });
  y -= 12;

  page.drawCircle({ x: tcStartX, y: y + 2.5, size: 1.5, color: INK });
  text("Access our Terms & Conditions", tcStartX + 8, y, { size: 9, color: INK });
  y -= 11;

  const tcLink = "https://groutix.com/terms-and-conditions/.";
  text(tcLink, tcStartX + 8, y, { size: 9, color: LINK_BLUE });
  page.drawLine({
    start: { x: tcStartX + 8, y: y - 1 },
    end: { x: tcStartX + 8 + font.widthOfTextAtSize(tcLink, 9), y: y - 1 },
    thickness: 0.5,
    color: LINK_BLUE,
  });

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}
