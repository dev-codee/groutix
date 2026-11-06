import { layoutWarrantyAddress } from "./warrantyAddressLayout";

export const WARRANTY_CERTIFICATE_WIDTH = 1536;
export const WARRANTY_CERTIFICATE_HEIGHT = 1024;
export const WARRANTY_CERTIFICATE_TEMPLATE = "/warranty-certificate-template.jpeg";

export type WarrantyCertificateFields = {
  jobNo: string;
  completionDate: string;
  expiryDate: string;
  customerName: string;
  address: string;
  authorisedBy: string;
  dateIssued: string;
};

/** Use the approved artwork unchanged, filling only its customer-specific lines. */
export function drawWarrantyCertificate(
  ctx: CanvasRenderingContext2D,
  template: CanvasImageSource,
  fields: WarrantyCertificateFields,
) {
  ctx.save();
  ctx.drawImage(template, 0, 0, WARRANTY_CERTIFICATE_WIDTH, WARRANTY_CERTIFICATE_HEIGHT);
  ctx.fillStyle = "#151515";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const font = (size: number) => { ctx.font = `bold ${size}px Arial, sans-serif`; };
  const value = (text: string, x: number, y: number, width: number, preferredSize = 25) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    font(preferredSize);
    const measured = ctx.measureText(clean).width;
    if (measured > width) font(preferredSize * width / measured);
    ctx.fillText(clean, x, y);
  };

  value(fields.jobNo, 1065, 328, 400);
  value(fields.completionDate, 1065, 400, 400);
  value(fields.expiryDate, 1125, 471, 340);
  value(fields.customerName, 1042, 542, 423);

  const address = layoutWarrantyAddress(fields.address, [385, 665], (text, size) => {
    font(size);
    return ctx.measureText(text).width;
  }, 24);
  font(address.fontSize);
  address.lines.forEach((line, index) => ctx.fillText(line, index === 0 ? 1080 : 805, index === 0 ? 609 : 665));

  // The approved template already prints the default authorisation. Only cover
  // that value when the user supplies another signatory, preserving the rule below.
  if (fields.authorisedBy.trim() !== "GROUTIX PTY LTD") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(1118, 696, 355, 40);
    ctx.fillStyle = "#151515";
    value(fields.authorisedBy, 1130, 725, 335, 27);
  }
  value(fields.dateIssued, 980, 798, 355);
  ctx.restore();
}
