import { NextRequest, NextResponse } from "next/server";
import { getSubmission, updateSubmission, appendActivity } from "@/lib/submissions";
import { sendInternalAlert } from "@/lib/email";

// Invoice open-tracking pixel. The invoice email embeds a 1x1 image pointing
// here; when the customer's mail client loads it, we record the first open.
// Public (no auth) and best-effort — always returns the pixel even if logging
// fails, so it never leaves a broken image in the customer's inbox.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function pixelResponse(): NextResponse {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getSubmission(id);
    // Only record the FIRST open, and only for a lead that was actually invoiced.
    if (lead && lead.invoiceSentAt && !lead.invoiceOpenedAt) {
      const now = new Date().toISOString();
      await updateSubmission(id, { invoiceOpenedAt: now });
      await appendActivity(id, {
        time: now,
        actor: "customer",
        action: "Invoice opened",
        detail: lead.invoiceNumber || undefined,
      });
      await sendInternalAlert({
        title: "Invoice opened",
        emoji: "👁️",
        accent: "#0ea5e9",
        lines: [
          `${lead.name || "The customer"} just opened invoice ${lead.invoiceNumber || ""}.`.trim(),
          lead.quoteAmount ? `Amount: AUD $${lead.quoteAmount.toFixed(2)} — awaiting payment.` : "",
        ].filter(Boolean),
        leadId: id,
      });
    }
  } catch (err) {
    console.error("invoice pixel tracking failed (non-fatal):", err);
  }
  return pixelResponse();
}
