import { NextRequest } from "next/server";
import { getSubmission, updateSubmission, appendActivity } from "@/lib/submissions";
import { verifyQuoteToken } from "@/lib/quoteToken";
import { QUOTE_STATUSES } from "@/lib/pipeline";

// Public endpoint the customer hits when they click "Accept" / "Decline" in the
// quotation email. No login — the link is authorised by an HMAC token tied to
// the lead id. Accepting moves the lead to "Won" (which hands it off to the
// field queue automatically); declining moves it to "Lost".

export const runtime = "nodejs";

function page(title: string, message: string, tone: "ok" | "info" | "warn"): Response {
  const accent = tone === "ok" ? "#16a34a" : tone === "warn" ? "#dc2626" : "#001f97";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Groutix</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,.08);">
        <tr><td style="height:6px;background:${accent};"></td></tr>
        <tr><td style="padding:40px 40px 8px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:#001f97;letter-spacing:-.5px;">GROUTIX</div>
        </td></tr>
        <tr><td style="padding:8px 40px 40px;text-align:center;">
          <h1 style="margin:16px 0 8px;font-size:22px;color:${accent};">${title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">${message}</p>
          <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;">Stay Sealed. Stay Smiling.</p>
          <a href="https://www.groutix.com" style="display:inline-block;margin-top:20px;color:#001f97;text-decoration:none;font-size:13px;font-weight:600;">www.groutix.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id") || "";
  const action = searchParams.get("action") || "";
  const token = searchParams.get("token");

  if (!id || (action !== "accept" && action !== "decline")) {
    return page("Invalid link", "This link is missing or malformed. Please reply to your quotation email and we'll help you.", "warn");
  }

  if (!verifyQuoteToken(id, token)) {
    return page("Link expired", "This link could not be verified. Please reply to your quotation email and our team will assist you.", "warn");
  }

  const lead = await getSubmission(id);
  if (!lead) {
    return page("Not found", "We couldn't find this quotation. Please reply to your email and we'll help you out.", "warn");
  }

  // Idempotent: only act while the lead is still in a quote stage. If they've
  // already responded (or the job has moved on), just acknowledge it.
  const isQuoteStage = QUOTE_STATUSES.includes(lead.status || "");
  if (!isQuoteStage) {
    if (lead.status === "Lost") {
      return page("Already recorded", "You've already declined this quotation. If this was a mistake, just reply to your email and we'll sort it out.", "info");
    }
    return page(
      "Thank you!",
      "Your response has already been recorded and our team is taking care of your booking. We'll be in touch shortly.",
      "ok"
    );
  }

  const now = new Date().toISOString();

  if (action === "accept") {
    await updateSubmission(id, {
      status: "Won",
      quoteAcceptedAt: now,
    });
    await appendActivity(id, {
      time: now,
      actor: "customer",
      action: "Quote accepted",
      detail: `Accepted online${lead.quoteNumber ? ` (${lead.quoteNumber})` : ""}`,
    });
    return page(
      "Quote accepted 🎉",
      "Thank you for accepting your Groutix quotation! Our scheduling team has been notified and will contact you shortly to arrange your booking.",
      "ok"
    );
  }

  // decline
  await updateSubmission(id, {
    status: "Lost",
    quoteDeclinedAt: now,
  });
  await appendActivity(id, {
    time: now,
    actor: "customer",
    action: "Quote declined",
    detail: `Declined online${lead.quoteNumber ? ` (${lead.quoteNumber})` : ""}`,
  });
  return page(
    "Response recorded",
    "Thanks for letting us know. If your plans change or you'd like to revisit the quote, simply reply to your email — we're here to help.",
    "info"
  );
}
