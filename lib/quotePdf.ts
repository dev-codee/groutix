// Server-side quotation PDF builder (pdf-lib — pure JS, no fonts on disk, safe
// on serverless). Produces a branded A4 quote as a base64 string ready to
// attach to a Brevo email or stream as a download.

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface QuotePdfItem {
  service?: string;
  description?: string;
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
  items: QuotePdfItem[];
  subtotal: number;
  gst: number;
  total: number;
  terms?: string;
  businessPhone?: string;
  // Document type controls the heading/labels so the same branded layout can
  // render either a quotation or a tax invoice. Defaults to "quote".
  docType?: "quote" | "invoice";
  // Optional status line (e.g. "PAID" / "UNPAID") shown under the total.
  statusLabel?: string;
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
const MUTED = rgb(0.4, 0.45, 0.53);
const LINE = rgb(0.89, 0.91, 0.94);
const ZEBRA = rgb(0.97, 0.98, 0.99);

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 48;

function money(n: number): string {
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

/** Greedy word-wrap to a max width for a given font/size. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text).replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
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
    page.drawText(s, {
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
    const f = opts.font ?? font;
    const size = opts.size ?? 10;
    text(s, rightX - f.widthOfTextAtSize(s, size), yy, opts);
  };

  const ensureRoom = (needed: number) => {
    if (y - needed < MARGIN + 60) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - MARGIN;
    }
  };

  // ── Header ──
  text("GROUTIX", MARGIN, y - 6, { font: bold, size: 26, color: BRAND });
  text("Tile Regrouting • Waterproofing • Shower Sealing", MARGIN, y - 24, {
    size: 9,
    color: MUTED,
  });
  rightText(heading, A4.w - MARGIN, y - 4, { font: bold, size: 18, color: INK });
  rightText(`${numberLabel}  ${input.quoteNumber}`, A4.w - MARGIN, y - 22, { size: 10, color: MUTED });
  rightText(`Date  ${input.date}`, A4.w - MARGIN, y - 36, { size: 10, color: MUTED });

  y -= 54;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4.w - MARGIN, y },
    thickness: 2,
    color: BRAND,
  });
  y -= 26;

  // ── Bill to ──
  text("PREPARED FOR", MARGIN, y, { font: bold, size: 9, color: MUTED });
  y -= 15;
  text(input.customerName || "Customer", MARGIN, y, { font: bold, size: 12 });
  y -= 15;
  const contact = [input.address, input.phone, input.email].filter(Boolean) as string[];
  for (const c of contact) {
    for (const ln of wrap(c, font, 10, contentW)) {
      text(ln, MARGIN, y, { size: 10, color: MUTED });
      y -= 13;
    }
  }
  y -= 12;

  // ── Items table ──
  const colDescX = MARGIN + 8;
  const colQtyRight = A4.w - MARGIN - 150;
  const colPriceRight = A4.w - MARGIN - 78;
  const colAmountRight = A4.w - MARGIN - 8;
  const rowPadY = 8;

  // Header row
  page.drawRectangle({
    x: MARGIN,
    y: y - 18,
    width: contentW,
    height: 22,
    color: BRAND,
  });
  text("DESCRIPTION", colDescX, y - 12, { font: bold, size: 9, color: rgb(1, 1, 1) });
  rightText("QTY", colQtyRight, y - 12, { font: bold, size: 9, color: rgb(1, 1, 1) });
  rightText("PRICE", colPriceRight, y - 12, { font: bold, size: 9, color: rgb(1, 1, 1) });
  rightText("AMOUNT", colAmountRight, y - 12, { font: bold, size: 9, color: rgb(1, 1, 1) });
  y -= 22;

  const items = input.items.length
    ? input.items
    : [{ service: "Regrouting & waterproof resealing", price: input.total, qty: 1 }];

  let zebra = false;
  for (const it of items) {
    const label = it.service || it.description || "Service";
    const descLines = wrap(label, font, 10, colQtyRight - colDescX - 10);
    const qty = Number(it.qty || 1);
    const price = Number(it.price || 0);
    const amount = price * qty;
    const rowH = descLines.length * 13 + rowPadY * 2 - 4;

    ensureRoom(rowH + 10);

    if (zebra) {
      page.drawRectangle({ x: MARGIN, y: y - rowH, width: contentW, height: rowH, color: ZEBRA });
    }
    zebra = !zebra;

    let ty = y - rowPadY - 6;
    for (const ln of descLines) {
      text(ln, colDescX, ty, { size: 10 });
      ty -= 13;
    }
    const midY = y - rowH / 2 - 4;
    rightText(String(qty), colQtyRight, midY, { size: 10 });
    rightText(money(price), colPriceRight, midY, { size: 10 });
    rightText(money(amount), colAmountRight, midY, { size: 10 });

    y -= rowH;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4.w - MARGIN, y },
      thickness: 0.5,
      color: LINE,
    });
  }

  // ── Totals ──
  y -= 18;
  ensureRoom(80);
  const totalsLabelRight = colPriceRight;
  const drawTotal = (label: string, value: string, opts: { strong?: boolean } = {}) => {
    const f = opts.strong ? bold : font;
    const size = opts.strong ? 12 : 10;
    rightText(label, totalsLabelRight, y, { font: f, size, color: opts.strong ? INK : MUTED });
    rightText(value, colAmountRight, y, { font: f, size, color: opts.strong ? BRAND : INK });
    y -= opts.strong ? 20 : 16;
  };
  drawTotal("Subtotal", money(input.subtotal));
  if (input.gst > 0) drawTotal("GST (10%)", money(input.gst));
  page.drawLine({
    start: { x: totalsLabelRight - 40, y: y + 6 },
    end: { x: colAmountRight, y: y + 6 },
    thickness: 0.5,
    color: LINE,
  });
  y -= 4;
  drawTotal("Total (AUD)", money(input.total), { strong: true });

  // ── Payment status (invoices) ──
  if (input.statusLabel) {
    const paid = /paid/i.test(input.statusLabel) && !/unpaid/i.test(input.statusLabel);
    rightText(`Status:  ${input.statusLabel.toUpperCase()}`, colAmountRight, y, {
      font: bold,
      size: 10,
      color: paid ? rgb(0.09, 0.6, 0.35) : rgb(0.86, 0.15, 0.15),
    });
    y -= 18;
  }

  // ── Terms ──
  if (input.terms) {
    y -= 16;
    ensureRoom(60);
    text("TERMS & CONDITIONS", MARGIN, y, { font: bold, size: 9, color: MUTED });
    y -= 14;
    for (const para of input.terms.split(/\n+/)) {
      for (const ln of wrap(para, font, 8.5, contentW)) {
        ensureRoom(14);
        text(ln, MARGIN, y, { size: 8.5, color: MUTED });
        y -= 11;
      }
    }
  }

  // ── Footer on every page ──
  const pages = doc.getPages();
  pages.forEach((p) => {
    p.drawLine({
      start: { x: MARGIN, y: MARGIN + 26 },
      end: { x: A4.w - MARGIN, y: MARGIN + 26 },
      thickness: 0.5,
      color: LINE,
    });
    p.drawText("Stay Sealed. Stay Smiling.  —  GROUTIX  •  Terms: groutix.com.au/terms-conditions", {
      x: MARGIN,
      y: MARGIN + 12,
      size: 8,
      font: bold,
      color: BRAND,
    });
    const phone = input.businessPhone ? `Call: ${input.businessPhone}` : "info@groutix.com";
    p.drawText(phone, {
      x: A4.w - MARGIN - font.widthOfTextAtSize(phone, 8),
      y: MARGIN + 12,
      size: 8,
      font,
      color: MUTED,
    });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}
