// Server-side quotation PDF builder (pdf-lib — pure JS, safe on serverless).
// Produces the official branded Groutix A4 quote with customer details,
// job description, itemized pricing table, full 20-clause terms & conditions,
// and customer signature block.

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
  const isInvoice = input.docType === "invoice";
  const heading = isInvoice ? "TAX INVOICE" : "QUOTATION";
  const numberLabel = isInvoice ? "Invoice No." : "Quote No.";

  const doc = await PDFDocument.create();
  doc.setTitle(`Groutix ${isInvoice ? "Invoice" : "Quotation"} ${input.quoteNumber}`);
  doc.setProducer("Groutix CRM");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([A4.w, A4.h]);
  const contentW = A4.w - MARGIN * 2;
  let y = A4.h - MARGIN;

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
      size: opts.size ?? 10,
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
    const size = opts.size ?? 10;
    text(cleaned, rightX - f.widthOfTextAtSize(cleaned, size), yy, opts);
  };

  const ensureRoom = (needed: number) => {
    if (y - needed < MARGIN + 45) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - MARGIN;
    }
  };

  // ── 1. Top Header ──
  text("GROUTIX", MARGIN, y - 6, { font: bold, size: 24, color: BRAND });
  text("Tile Regrouting * Waterproofing * Shower Sealing", MARGIN, y - 22, {
    size: 8.5,
    color: MUTED,
  });
  text("ACN: 687 415 005 | Melbourne, VIC", MARGIN, y - 33, {
    size: 8,
    color: MUTED,
  });

  rightText(heading, A4.w - MARGIN, y - 4, { font: bold, size: 18, color: INK });
  rightText(`${numberLabel}  ${input.quoteNumber}`, A4.w - MARGIN, y - 20, { size: 9.5, color: MUTED });
  rightText(`Date  ${input.date}`, A4.w - MARGIN, y - 33, { size: 9.5, color: MUTED });

  y -= 48;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4.w - MARGIN, y },
    thickness: 1.5,
    color: BRAND,
  });
  y -= 18;

  // ── 2. Billing Address / Customer Info («job.instantpost_billing_address») ──
  text("CUSTOMER DETAILS & BILLING ADDRESS", MARGIN, y, { font: bold, size: 8.5, color: MUTED });
  y -= 13;
  text(input.customerName || "Customer", MARGIN, y, { font: bold, size: 11, color: INK });
  y -= 13;

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
  y -= 8;

  // ── 3. JOB DESCRIPTION («job.work_done_description») ──
  const jobDesc = (input.jobDescription || "").trim();
  if (jobDesc) {
    ensureRoom(40);
    text("JOB DESCRIPTION:", MARGIN, y, { font: bold, size: 9.5, color: BRAND });
    y -= 12;
    const descLines = wrapLines(jobDesc, font, 8.5, contentW);
    for (const ln of descLines) {
      ensureRoom(12);
      if (ln === "") {
        y -= 5;
      } else {
        text(ln, MARGIN, y, { size: 8.5, color: INK });
        y -= 11;
      }
    }
    y -= 10;
  }

  // ── 4. Items Table (DESCRIPTION | QTY | UNIT PRICE | TOTAL PRICE) ──
  const colDescX = MARGIN + 8;
  const colQtyRight = A4.w - MARGIN - 170;
  const colPriceRight = A4.w - MARGIN - 85;
  const colAmountRight = A4.w - MARGIN - 8;
  const rowPadY = 6;

  ensureRoom(35);
  // Header row
  page.drawRectangle({
    x: MARGIN,
    y: y - 18,
    width: contentW,
    height: 20,
    color: BRAND,
  });
  text("DESCRIPTION", colDescX, y - 12, { font: bold, size: 8.5, color: rgb(1, 1, 1) });
  rightText("QTY", colQtyRight, y - 12, { font: bold, size: 8.5, color: rgb(1, 1, 1) });
  rightText("UNIT PRICE", colPriceRight, y - 12, { font: bold, size: 8.5, color: rgb(1, 1, 1) });
  rightText("TOTAL PRICE", colAmountRight, y - 12, { font: bold, size: 8.5, color: rgb(1, 1, 1) });
  y -= 20;

  const items = input.items.length
    ? input.items
    : [{ service: "Regrouting & waterproof resealing", price: input.total, qty: 1 }];

  let zebra = false;
  for (const it of items) {
    const label = it.service || it.description || "Regrouting & waterproof resealing";
    const descLines = wrapLines(label, bold, 9, colQtyRight - colDescX - 15).filter(Boolean);

    // If item has distinct scope/description, add it beneath the title
    const extraScope = it.scope && it.scope !== label ? it.scope : (it.description && it.description !== label ? it.description : "");
    const scopeLines = extraScope ? wrapLines(extraScope, font, 7.5, colQtyRight - colDescX - 15).filter(Boolean) : [];

    const qty = Number(it.qty || 1);
    const price = Number(it.price || 0);
    const amount = price * qty;

    const rowContentH = descLines.length * 11 + scopeLines.length * 9.5;
    const rowH = Math.max(22, rowContentH + rowPadY * 2);

    ensureRoom(rowH + 10);

    if (zebra) {
      page.drawRectangle({ x: MARGIN, y: y - rowH, width: contentW, height: rowH, color: ZEBRA });
    }
    zebra = !zebra;

    let ty = y - rowPadY - 7;
    for (const ln of descLines) {
      text(ln, colDescX, ty, { font: bold, size: 9, color: INK });
      ty -= 11;
    }
    for (const ln of scopeLines) {
      text(ln, colDescX, ty, { font, size: 7.5, color: MUTED });
      ty -= 9.5;
    }

    const midY = y - rowPadY - 7;
    rightText(qty > 0 ? String(qty) : "1", colQtyRight, midY, { size: 9 });
    rightText(money(price), colPriceRight, midY, { size: 9 });
    rightText(money(amount), colAmountRight, midY, { font: bold, size: 9 });

    y -= rowH;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4.w - MARGIN, y },
      thickness: 0.5,
      color: LINE,
    });
  }

  // ── 5. Financial Summary (SUBTOTAL | TAX | TOTAL) ──
  y -= 14;
  ensureRoom(75);
  const totalsLabelRight = colPriceRight;
  const drawTotal = (label: string, value: string, opts: { strong?: boolean } = {}) => {
    const f = opts.strong ? bold : font;
    const size = opts.strong ? 11 : 9.5;
    rightText(label, totalsLabelRight, y, { font: f, size, color: opts.strong ? INK : MUTED });
    rightText(value, colAmountRight, y, { font: f, size, color: opts.strong ? BRAND : INK });
    y -= opts.strong ? 18 : 14;
  };

  drawTotal("SUBTOTAL:", money(input.subtotal));
  const taxLabel = input.taxName || "GST (10%):";
  drawTotal(taxLabel, money(input.gst));

  page.drawLine({
    start: { x: totalsLabelRight - 50, y: y + 4 },
    end: { x: colAmountRight, y: y + 4 },
    thickness: 1,
    color: BRAND,
  });
  y -= 4;
  drawTotal("TOTAL:", money(input.total), { strong: true });

  // Payment status (invoices)
  if (input.statusLabel) {
    const paid = /paid/i.test(input.statusLabel) && !/unpaid/i.test(input.statusLabel);
    rightText(`Status:  ${input.statusLabel.toUpperCase()}`, colAmountRight, y, {
      font: bold,
      size: 9.5,
      color: paid ? rgb(0.09, 0.6, 0.35) : rgb(0.86, 0.15, 0.15),
    });
    y -= 16;
  }

  // ── 6. Special Notes / Quote Conditions (Page 1) ──
  const specialNotesText = (
    input.specialNotes?.trim() ||
    (input.terms && input.terms.length < 500 && !/^Groutix terms/i.test(input.terms)
      ? input.terms.trim()
      : "")
  ).trim();

  if (specialNotesText) {
    y -= 12;
    ensureRoom(40);
    text("SPECIAL NOTES / CONDITIONS:", MARGIN, y, { font: bold, size: 8, color: BRAND });
    y -= 11;
    const noteLines = wrapLines(specialNotesText, font, 7.5, contentW);
    for (const nl of noteLines) {
      ensureRoom(9.5);
      text(nl, MARGIN, y, { font, size: 7.5, color: INK });
      y -= 9.5;
    }
  }

  // ── 7. Official Groutix Terms and Conditions (20 clauses) ──
  // Always begin the contract schedule on a fresh page for an executive-grade quotation layout
  page = doc.addPage([A4.w, A4.h]);
  y = A4.h - MARGIN;

  const termsContent = (input.terms && input.terms.length > 500 ? input.terms : GROUTIX_QUOTE_TERMS).trim();

  if (termsContent) {
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: A4.w - MARGIN, y: y + 4 },
      thickness: 1,
      color: BRAND,
    });
    text("Groutix terms and conditions", MARGIN, y - 8, { font: bold, size: 10.5, color: BRAND });
    y -= 22;

    const termLines = termsContent.split(/\r?\n/);
    for (const raw of termLines) {
      const trimmed = cleanPdfText(raw).trim();
      if (!trimmed || /^Groutix terms and conditions/i.test(trimmed)) continue;

      // Skip acceptance / signature markers if they are in the terms text; rendered explicitly below
      if (
        /^I have read and agree/i.test(trimmed) ||
        /^\.{5,}/.test(trimmed) ||
        /^…{5,}/.test(trimmed) ||
        /^Customer Signature/i.test(trimmed)
      ) {
        continue;
      }

      const isClauseHeading = /^\d{1,2}\s+[A-Za-z]/.test(trimmed);
      const f = isClauseHeading ? bold : font;
      const sz = isClauseHeading ? 7.5 : 7;
      const lh = isClauseHeading ? 9.5 : 8.4;

      if (isClauseHeading) {
        ensureRoom(lh + 4);
        y -= 3;
      }

      const wrapped = wrapLines(trimmed, f, sz, contentW);
      for (const w of wrapped) {
        ensureRoom(lh);
        text(w, MARGIN, y, { font: f, size: sz, color: isClauseHeading ? INK : rgb(0.12, 0.16, 0.24) });
        y -= lh;
      }
    }

    // ── 7. Customer Acceptance & Signature Block ──
    ensureRoom(80);
    y -= 10;
    text("I have read and agree to the terms and conditions.", MARGIN, y, { font: bold, size: 8.5, color: INK });
    y -= 22;

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
        ensureRoom(drawH + 40);
        page.drawImage(img, {
          x: MARGIN,
          y: y - drawH,
          width: drawW,
          height: drawH,
        });
        y -= drawH + 4;
      } catch (e) {
        console.warn("Could not embed signature image in quote PDF:", e);
      }
    }

    text("........................................................................", MARGIN, y, { size: 9, color: MUTED });
    y -= 12;
    text("Customer Signature", MARGIN, y, { font: bold, size: 8.5, color: INK });
    if (input.customerSignedAt) {
      y -= 10;
      text(`Date: ${input.customerSignedAt}`, MARGIN, y, { size: 8, color: MUTED });
    }
  }

  // ── 8. Footers on Every Page ──
  const pages = doc.getPages();
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: MARGIN, y: MARGIN + 26 },
      end: { x: A4.w - MARGIN, y: MARGIN + 26 },
      thickness: 0.5,
      color: LINE,
    });
    p.drawText("Stay Sealed. Stay Smiling.  -  GROUTIX  *  Terms: groutix.com.au/terms-conditions", {
      x: MARGIN,
      y: MARGIN + 12,
      size: 8,
      font: bold,
      color: BRAND,
    });
    const phone = input.businessPhone ? `Call: ${input.businessPhone}` : "info@groutix.com";
    const pageStr = `Page ${idx + 1} of ${totalPages}`;
    const rightInfo = `${phone}   |   ${pageStr}`;
    p.drawText(rightInfo, {
      x: A4.w - MARGIN - font.widthOfTextAtSize(rightInfo, 8),
      y: MARGIN + 12,
      size: 8,
      font,
      color: MUTED,
    });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}
