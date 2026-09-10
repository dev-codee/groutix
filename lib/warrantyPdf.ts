// Server-side Warranty Certificate & Terms PDF builder (pdf-lib).
// Produces the official branded Groutix 2-page 10-Year Full Shower Re-Grout Warranty
// matching the new official executive template.

import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface WarrantyPdfInput {
  jobNo: string;
  completionDate: string;
  expiryDate: string;
  customerName: string;
  address: string;
  authorisedBy?: string;
  dateIssued?: string;
  phone?: string;
  email?: string;
  website?: string;
}

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 42;

// Theme Colors matching official template
const NAVY = rgb(0.02, 0.15, 0.45); // #052673 - Primary dark navy
const CYAN = rgb(0.0, 0.65, 0.95); // #00a6f3 - Accent vibrant cyan
const LIGHT_BG = rgb(0.91, 0.96, 0.99); // #e8f4fc - Callout / section banner light blue
const INK = rgb(0.12, 0.14, 0.18); // Body text
const MUTED = rgb(0.42, 0.46, 0.52);
const LINE = rgb(0.78, 0.84, 0.92);

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

export async function buildWarrantyPdfBase64(input: WarrantyPdfInput): Promise<string> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Groutix 10-Year Warranty Certificate - ${input.jobNo}`);
  doc.setProducer("Groutix Warranty System");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logoImg: any = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      logoImg = await doc.embedPng(fs.readFileSync(logoPath));
    }
  } catch {
    // fallback if logo unavailable
  }

  // Draw background decorative corner waves on both pages
  const drawCornerWaves = (page: PDFPage) => {
    // Top-right corner waves
    page.drawCircle({
      x: A4.w + 40,
      y: A4.h + 20,
      size: 130,
      color: NAVY,
    });
    page.drawCircle({
      x: A4.w + 40,
      y: A4.h + 20,
      size: 145,
      borderWidth: 8,
      borderColor: CYAN,
      color: rgb(1, 1, 1),
      opacity: 0,
      borderOpacity: 1,
    });

    // Bottom-left corner waves
    page.drawCircle({
      x: -40,
      y: -20,
      size: 120,
      color: NAVY,
    });
    page.drawCircle({
      x: -40,
      y: -20,
      size: 135,
      borderWidth: 8,
      borderColor: CYAN,
      color: rgb(1, 1, 1),
      opacity: 0,
      borderOpacity: 1,
    });
  };

  // Draw bottom footer banner on both pages
  const drawFooterBanner = (page: PDFPage, pageNumStr: string) => {
    const bannerH = 40;
    page.drawRectangle({
      x: 0,
      y: 0,
      width: A4.w,
      height: bannerH,
      color: NAVY,
    });

    const phoneStr = input.phone || "70238094";
    const emailStr = input.email || "info@groutix.com";
    const webStr = input.website || "www.groutix.com";

    // Draw circular icon badge helper
    const drawBadge = (cx: number, cy: number, iconChar: string) => {
      page.drawCircle({
        x: cx,
        y: cy,
        size: 7,
        color: CYAN,
      });
      page.drawText(iconChar, {
        x: cx - 3,
        y: cy - 3,
        size: 7,
        font: bold,
        color: rgb(1, 1, 1),
      });
    };

    let startX = 35;
    // Phone
    drawBadge(startX, bannerH / 2, "P");
    page.drawText(phoneStr, {
      x: startX + 12,
      y: bannerH / 2 - 3.5,
      size: 8.5,
      font: bold,
      color: rgb(1, 1, 1),
    });

    // Separator
    startX += 85;
    page.drawText("|", {
      x: startX,
      y: bannerH / 2 - 3.5,
      size: 9,
      font,
      color: rgb(0.4, 0.6, 0.9),
    });

    // Email
    startX += 15;
    drawBadge(startX, bannerH / 2, "@");
    page.drawText(emailStr, {
      x: startX + 12,
      y: bannerH / 2 - 3.5,
      size: 8.5,
      font: bold,
      color: rgb(1, 1, 1),
    });

    // Separator
    startX += 115;
    page.drawText("|", {
      x: startX,
      y: bannerH / 2 - 3.5,
      size: 9,
      font,
      color: rgb(0.4, 0.6, 0.9),
    });

    // Web
    startX += 15;
    drawBadge(startX, bannerH / 2, "W");
    page.drawText(webStr, {
      x: startX + 12,
      y: bannerH / 2 - 3.5,
      size: 8.5,
      font: bold,
      color: rgb(1, 1, 1),
    });

    // Page number on right
    page.drawText(pageNumStr, {
      x: A4.w - MARGIN - 35,
      y: bannerH / 2 - 3.5,
      size: 8,
      font,
      color: rgb(0.85, 0.9, 1.0),
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // PAGE 1: 10-YEAR FULL SHOWER RE-GROUT WARRANTY CERTIFICATE
  // ══════════════════════════════════════════════════════════════════
  const page1 = doc.addPage([A4.w, A4.h]);
  drawCornerWaves(page1);
  drawFooterBanner(page1, "Page 1 of 2");

  // 1. Header: Logo (left) & Stacked Title (right)
  const headerTopY = A4.h - 45;
  if (logoImg) {
    const drawH = 46;
    const drawW = (logoImg.width / logoImg.height) * drawH;
    page1.drawImage(logoImg, {
      x: MARGIN,
      y: headerTopY - drawH,
      width: drawW,
      height: drawH,
    });
  } else {
    page1.drawText("GROUTIX", {
      x: MARGIN,
      y: headerTopY - 25,
      size: 28,
      font: bold,
      color: NAVY,
    });
  }

  // Right-aligned stacked title
  page1.drawText("10-YEAR", {
    x: 340,
    y: headerTopY - 14,
    size: 15,
    font: bold,
    color: NAVY,
  });
  page1.drawText("FULL SHOWER", {
    x: 340,
    y: headerTopY - 30,
    size: 15,
    font: bold,
    color: NAVY,
  });
  page1.drawText("RE-GROUT WARRANTY", {
    x: 340,
    y: headerTopY - 46,
    size: 15,
    font: bold,
    color: NAVY,
  });

  // 2. Navy Ribbon Pill: YOUR PEACE OF MIND. ENGINEERED TO LAST.
  const ribbonY = headerTopY - 80;
  const ribbonW = A4.w - MARGIN * 2;
  const ribbonH = 26;
  page1.drawRectangle({
    x: MARGIN,
    y: ribbonY,
    width: ribbonW,
    height: ribbonH,
    color: NAVY,
    borderWidth: 0,
  });
  const ribbonText = "YOUR PEACE OF MIND. ENGINEERED TO LAST.";
  const ribbonTextW = bold.widthOfTextAtSize(ribbonText, 11);
  page1.drawText(ribbonText, {
    x: MARGIN + (ribbonW - ribbonTextW) / 2,
    y: ribbonY + 7.5,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });

  // 3. Warranting Statement
  let curY = ribbonY - 26;
  const statement =
    "Groutix Pty Ltd trading as Groutix warrants that a qualifying full shower re-grout performed by Groutix will remain waterproof for a period of 10 years from the date of the Services are completed, subject to the terms, conditions and exclusions set out in this Warranty Document.";
  const stmtLines = wrapLines(statement, font, 10.5, ribbonW);
  for (const line of stmtLines) {
    page1.drawText(cleanPdfText(line), {
      x: MARGIN,
      y: curY,
      size: 10.5,
      font,
      color: INK,
    });
    curY -= 15;
  }

  curY -= 12;

  // 4. Feature Section: Shield Icon on left + 4 Bullet Points on right
  const shieldX = MARGIN + 22;
  const shieldY = curY - 75;

  // Draw Shield Outline
  page1.drawRectangle({
    x: shieldX,
    y: shieldY + 25,
    width: 54,
    height: 40,
    borderColor: NAVY,
    borderWidth: 3,
    color: rgb(1, 1, 1),
  });
  // Water Droplet inside shield
  page1.drawCircle({
    x: shieldX + 27,
    y: shieldY + 42,
    size: 11,
    color: NAVY,
  });

  // 4 Bullets on the right
  const bulletsX = MARGIN + 115;
  let bulletY = curY - 10;
  const bulletItems = [
    "10 YEARS WORKMANSHIP WARRANTY",
    "WATERPROOF PROTECTION",
    "QUALITY MATERIALS",
    "EXPERT INSTALLATION",
  ];

  for (const item of bulletItems) {
    // Blue circular checkmark icon
    page1.drawCircle({
      x: bulletsX,
      y: bulletY + 4,
      size: 8,
      color: CYAN,
    });
    page1.drawText("v", {
      x: bulletsX - 3.5,
      y: bulletY + 1.5,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page1.drawText(item, {
      x: bulletsX + 16,
      y: bulletY,
      size: 9.5,
      font: bold,
      color: NAVY,
    });
    bulletY -= 21;
  }

  curY = bulletY - 10;

  // 5. Callout Box: Australian Consumer Law notice
  const calloutH = 32;
  page1.drawRectangle({
    x: MARGIN,
    y: curY - calloutH,
    width: ribbonW,
    height: calloutH,
    color: LIGHT_BG,
  });
  page1.drawText(
    "This warranty is in addition to any rights and remedies available under the Australian Consumer Law.",
    {
      x: MARGIN + 12,
      y: curY - calloutH + 11,
      size: 9,
      font,
      color: NAVY,
    }
  );

  curY = curY - calloutH - 30;

  // 6. Certificate Details Fields with underline styling
  const fieldLabelW = 150;
  const lineEndX = A4.w - MARGIN;

  const drawFieldRow = (label: string, val: string) => {
    // Label in bold dark blue
    page1.drawText(label, {
      x: MARGIN,
      y: curY,
      size: 9.5,
      font: bold,
      color: NAVY,
    });
    // Underline
    page1.drawLine({
      start: { x: MARGIN + fieldLabelW, y: curY - 2 },
      end: { x: lineEndX, y: curY - 2 },
      thickness: 1,
      color: LINE,
    });
    // Value on underline
    if (val) {
      page1.drawText(cleanPdfText(val), {
        x: MARGIN + fieldLabelW + 6,
        y: curY + 1,
        size: 9.5,
        font,
        color: INK,
      });
    }
    curY -= 24;
  };

  drawFieldRow("JOB / INVOICE NO.:", input.jobNo);
  drawFieldRow("COMPLETION DATE:", input.completionDate);
  drawFieldRow("WARRANTY EXPIRY DATE:", input.expiryDate);
  drawFieldRow("CUSTOMER NAME:", input.customerName);
  drawFieldRow("PROPERTY ADDRESS:", input.address);

  curY -= 12;
  drawFieldRow("AUTHORISED BY GROUTIX:", input.authorisedBy || "GROUTIX PTY LTD");
  drawFieldRow("DATE ISSUED:", input.dateIssued || input.completionDate);

  // ══════════════════════════════════════════════════════════════════
  // PAGE 2: TERMS & CONDITIONS (Two-Column Layout)
  // ══════════════════════════════════════════════════════════════════
  const page2 = doc.addPage([A4.w, A4.h]);
  drawCornerWaves(page2);
  drawFooterBanner(page2, "Page 2 of 2");

  // Top Header: Logo on left, TERMS & CONDITIONS pill + subtitle on right
  if (logoImg) {
    const drawH = 42;
    const drawW = (logoImg.width / logoImg.height) * drawH;
    page2.drawImage(logoImg, {
      x: MARGIN,
      y: headerTopY - drawH,
      width: drawW,
      height: drawH,
    });
  } else {
    page2.drawText("GROUTIX", {
      x: MARGIN,
      y: headerTopY - 25,
      size: 26,
      font: bold,
      color: NAVY,
    });
  }

  // Right pill banner
  const pillW = 190;
  const pillH = 22;
  page2.drawRectangle({
    x: A4.w - MARGIN - pillW,
    y: headerTopY - 22,
    width: pillW,
    height: pillH,
    color: NAVY,
  });
  const pillTxt = "TERMS & CONDITIONS";
  const pillTxtW = bold.widthOfTextAtSize(pillTxt, 10);
  page2.drawText(pillTxt, {
    x: A4.w - MARGIN - pillW + (pillW - pillTxtW) / 2,
    y: headerTopY - 16,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page2.drawText("10-YEAR FULL SHOWER RE-GROUT WARRANTY", {
    x: A4.w - MARGIN - pillW - 2,
    y: headerTopY - 36,
    size: 8,
    font: bold,
    color: NAVY,
  });

  // Two-Column Layout Parameters
  const colGap = 16;
  const colW = (ribbonW - colGap) / 2;
  const col1X = MARGIN;
  const col2X = MARGIN + colW + colGap;
  const colTopY = headerTopY - 62;

  // Helper to draw section header banner
  const drawSectionBanner = (p: PDFPage, x: number, yy: number, title: string) => {
    p.drawRectangle({
      x,
      y: yy - 14,
      width: colW,
      height: 18,
      color: LIGHT_BG,
    });
    p.drawText(title, {
      x: x + 8,
      y: yy - 9,
      size: 8.5,
      font: bold,
      color: NAVY,
    });
    return yy - 20;
  };

  // Helper to flow text lines
  const flowParagraph = (
    p: PDFPage,
    x: number,
    yy: number,
    textStr: string,
    f: PDFFont = font,
    sz: number = 6.6,
    lh: number = 8.6
  ): number => {
    const lines = wrapLines(textStr, f, sz, colW);
    let cur = yy;
    for (const ln of lines) {
      p.drawText(cleanPdfText(ln), {
        x,
        y: cur,
        size: sz,
        font: f,
        color: INK,
      });
      cur -= lh;
    }
    return cur - 3;
  };

  // ── Column 1 (Left) ──
  let c1Y = colTopY;
  c1Y = drawSectionBanner(page2, col1X, c1Y, "1. Service Warranty");
  c1Y = flowParagraph(
    page2,
    col1X,
    c1Y,
    "1.1 Groutix warrants that, subject to the terms and conditions of this warranty, for a period of 10 years from the date of supply of the Service to the party who purchased the Service from Groutix:"
  );
  c1Y = flowParagraph(
    page2,
    col1X + 4,
    c1Y,
    "(1) The grout applied to the tiled surface or tile installation during the Service will stay waterproof."
  );
  c1Y = flowParagraph(
    page2,
    col1X + 4,
    c1Y,
    "(2) If the grout applied to the tiled surface or tile installation during the Service does not stay waterproof, it will at Groutix's election, be replaced or repaired without cost to you or you will be refunded the price you paid for the Service."
  );

  c1Y -= 4;
  c1Y = drawSectionBanner(page2, col1X, c1Y, "2. Exclusions and limitations");
  c1Y = flowParagraph(
    page2,
    col1X,
    c1Y,
    "2.1 This warranty is not transferable to any subsequent owner of your property."
  );
  c1Y = flowParagraph(page2, col1X, c1Y, "2.2 This warranty will be void where:");
  c1Y = flowParagraph(
    page2,
    col1X + 4,
    c1Y,
    "(1) The tiled surface or tile installation has been subjected to misuse, negligence or accident by you or any third party; or"
  );
  c1Y = flowParagraph(
    page2,
    col1X + 4,
    c1Y,
    "(2) The tiled surface or tile installation has been modified, repaired or altered by you or any third party; or"
  );
  c1Y = flowParagraph(
    page2,
    col1X + 4,
    c1Y,
    "(3) The tiled surface or tile installation is affixed to a building which has experienced structural movement and/or defects and/or cracking; or"
  );
  c1Y = flowParagraph(
    page2,
    col1X + 4,
    c1Y,
    "(4) You have not followed the after-care and maintenance instructions we provided to you."
  );
  c1Y = flowParagraph(
    page2,
    col1X,
    c1Y,
    "2.3 This warranty does not apply to a partial shower re-grout service. It applies only to a full shower re-grout service."
  );
  c1Y = flowParagraph(
    page2,
    col1X,
    c1Y,
    "2.4 This warranty applies only to grouting services and where grout has been applied. It does not apply to silicone and where silicone has been applied."
  );
  c1Y = flowParagraph(
    page2,
    col1X,
    c1Y,
    "2.5 This warranty only applies if the grout applied to the tiled surface or tile installation during the Service is no longer waterproof. It does not apply to shower leaks or mould."
  );

  // ── Column 2 (Right) ──
  let c2Y = colTopY;
  c2Y = flowParagraph(
    page2,
    col2X,
    c2Y,
    "2.6 Groutix will not be liable under this warranty for any damages, losses, costs or expenses including, without limitation, loss of market, loss of profit, loss of production or for any financial or economic loss including indirect or consequential loss or damage which may be suffered by you or by any third party arising out of or in any way connected with failure of the Service or any defect in materials and workmanship except as provided by this warranty."
  );
  c2Y = flowParagraph(
    page2,
    col2X,
    c2Y,
    "2.7 The obligations of Groutix under this warranty will be limited to one of the following at the election of Groutix:"
  );
  c2Y = flowParagraph(
    page2,
    col2X + 4,
    c2Y,
    "(1) Repair of the tiled surface or tile installation the subject of the Service; or"
  );
  c2Y = flowParagraph(
    page2,
    col2X + 4,
    c2Y,
    "(2) Provision of a replacement Service or, where this is not possible for any reason, the provision of an equivalent service or product; or"
  );
  c2Y = flowParagraph(page2, col2X + 4, c2Y, "(3) A refund of the price you paid for the Service.");
  c2Y = flowParagraph(
    page2,
    col2X,
    c2Y,
    "2.8 Notwithstanding any other provision of this warranty, Groutix's liability arising from, under or in connection with this warranty will be limited to the full replacement value of the Service."
  );
  c2Y = flowParagraph(
    page2,
    col2X,
    c2Y,
    "2.9 Whilst Groutix will endeavor to ensure that the color and texture of the grout and any other materials used in any repair or replacement will match any existing grout and other relevant materials, it does not warrant that they will be an exact match and will not be liable if they are not an exact match."
  );
  c2Y = flowParagraph(
    page2,
    col2X,
    c2Y,
    "2.10 You acknowledge that Groutix is not the manufacturer of the materials used to provide the Service. To the extent permitted by law, Groutix shall not be liable as the manufacturer of the materials used to provide the Service."
  );
  c2Y = flowParagraph(page2, col2X, c2Y, "2.11 This warranty is only valid and enforceable in Australia.");

  c2Y -= 4;
  c2Y = drawSectionBanner(page2, col2X, c2Y, "3. How to claim");
  c2Y = flowParagraph(
    page2,
    col2X,
    c2Y,
    "3.1 Upon discovery of any evidence that the grout applied to the tiled surface or tile installation during the Service is no longer waterproof and to make a claim under this warranty, you must promptly contact Groutix by email at info@groutix.com. You must provide a copy of your invoice and proof of payment for the Service, and photographs of the relevant surface or installation."
  );

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}
