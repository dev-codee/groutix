import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/mongodb";
import { appendActivity, type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";
import { normaliseAuNumber } from "@/lib/sms";
import { sendReplyNotification } from "@/lib/email";

export const runtime = "nodejs";

// Verify the x-Texto-Signature HMAC-SHA256 header Texto attaches when
// "Sign requests" is enabled. Uses timing-safe comparison to prevent
// timing attacks.
function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractFields(body: Record<string, any>): { from: string; text: string; msgId: string } {
  const from = body.from || body.mobile || body.sender || body.msisdn || "";
  const text = body.message || body.text || body.body || body.content || "";
  const msgId = body.message_id || body.id || body.messageId || `sms_in_${Date.now()}`;
  return { from: String(from), text: String(text), msgId: String(msgId) };
}

export async function POST(req: NextRequest) {
  const secret = process.env.TEXTO_WEBHOOK_SECRET || "";

  // Read raw body as buffer first (needed for signature verification)
  const rawBody = Buffer.from(await req.arrayBuffer());

  // Verify signature if a secret is configured
  if (secret) {
    const sig = req.headers.get("x-texto-signature") || "";
    if (!sig || !verifySignature(rawBody, sig, secret)) {
      console.warn("[SMS Webhook] Invalid or missing signature — request rejected.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Parse body
  let raw: Record<string, any> = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      raw = JSON.parse(rawBody.toString("utf8"));
    } else {
      for (const pair of rawBody.toString("utf8").split("&")) {
        const [k, v] = pair.split("=");
        if (k) raw[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { from, text, msgId } = extractFields(raw);
  if (!from || !text) {
    return NextResponse.json({ ok: true, skipped: "missing_from_or_text" });
  }

  const normalisedFrom = normaliseAuNumber(from);
  const localFrom = normalisedFrom.startsWith("+61")
    ? "0" + normalisedFrom.slice(3)
    : normalisedFrom;

  try {
    const db = await getDb();
    const col = db.collection<SubmissionDoc>("submissions");

    // Match lead by phone — try all common formats
    const lead = await col.findOne({
      $or: [{ phone: normalisedFrom }, { phone: localFrom }, { phone: from }],
      status: { $nin: ["Lost"] },
    }, { sort: { createdAt: -1 } });

    if (!lead) {
      console.log(`[SMS Webhook] No lead matched phone: ${from}`);
      return NextResponse.json({ ok: true, matched: false });
    }

    // Deduplicate
    if (lead.messages?.some((m) => m.id === msgId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const crmMessage: CustomerMessage = {
      id: msgId,
      from: "customer",
      channel: "sms",
      text: text.trim(),
      time: (raw.received_at ? new Date(raw.received_at) : new Date()).toISOString(),
      read: false,
    };

    await col.updateOne({ _id: lead._id }, { $push: { messages: crmMessage } });

    await appendActivity(lead._id.toString(), {
      time: new Date().toISOString(),
      actor: "system",
      action: "Customer replied via SMS",
      detail: text.trim().slice(0, 100),
    });

    await sendReplyNotification({
      leadName: lead.name,
      leadEmail: lead.email || "",
      subject: `SMS reply from ${lead.name}`,
      snippet: text.trim(),
      leadId: lead._id.toString(),
    });

    return NextResponse.json({ ok: true, matched: true });
  } catch (err) {
    console.error("[SMS Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Texto may send a GET to verify the endpoint is reachable
export async function GET() {
  return NextResponse.json({ ok: true, service: "Groutix SMS Reply Webhook" });
}
