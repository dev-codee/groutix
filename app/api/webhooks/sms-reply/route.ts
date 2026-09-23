import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/mongodb";
import { appendActivity, type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";
import { normaliseAuNumber } from "@/lib/sms";
import { sendReplyNotification } from "@/lib/email";

export const runtime = "nodejs";

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
  const from = body.from || body.mobile || body.sender || body.msisdn || body.originator || body.source_number || "";
  const text = body.message || body.text || body.body || body.content || body.msg || "";
  const msgId = body.message_id || body.id || body.messageId || body.msg_id || `sms_in_${Date.now()}`;
  return { from: String(from), text: String(text), msgId: String(msgId) };
}

export async function POST(req: NextRequest) {
  const secret = process.env.TEXTO_WEBHOOK_SECRET || "";

  // Read raw body as buffer first (needed for signature verification)
  const rawBody = Buffer.from(await req.arrayBuffer());
  const bodyStr = rawBody.toString("utf8");

  console.log("[SMS Webhook] Received POST");
  console.log("[SMS Webhook] Headers:", Object.fromEntries(req.headers.entries()));
  console.log("[SMS Webhook] Body:", bodyStr.slice(0, 500));

  // Verify signature if a secret is configured
  if (secret) {
    const sig = req.headers.get("x-texto-signature") || req.headers.get("x-signature") || "";
    if (!sig) {
      console.warn("[SMS Webhook] No signature header found — rejecting.");
      return NextResponse.json({ error: "Unauthorized: missing signature" }, { status: 401 });
    }
    if (!verifySignature(rawBody, sig, secret)) {
      console.warn("[SMS Webhook] Signature mismatch.");
      console.warn("[SMS Webhook] Received sig:", sig);
      console.warn("[SMS Webhook] Expected:", createHmac("sha256", secret).update(rawBody).digest("hex"));
      return NextResponse.json({ error: "Unauthorized: signature mismatch" }, { status: 401 });
    }
    console.log("[SMS Webhook] Signature verified OK");
  }

  // Parse body — try JSON first, then form-urlencoded
  let raw: Record<string, any> = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      raw = JSON.parse(bodyStr);
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      for (const pair of bodyStr.split("&")) {
        const idx = pair.indexOf("=");
        if (idx === -1) continue;
        const k = decodeURIComponent(pair.slice(0, idx));
        const v = decodeURIComponent(pair.slice(idx + 1));
        if (k) raw[k] = v;
      }
    } else {
      // Try JSON regardless of content-type
      try {
        raw = JSON.parse(bodyStr);
      } catch {
        for (const pair of bodyStr.split("&")) {
          const idx = pair.indexOf("=");
          if (idx === -1) continue;
          const k = decodeURIComponent(pair.slice(0, idx));
          const v = decodeURIComponent(pair.slice(idx + 1));
          if (k) raw[k] = v;
        }
      }
    }
  } catch {
    console.error("[SMS Webhook] Failed to parse body");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  console.log("[SMS Webhook] Parsed body:", JSON.stringify(raw).slice(0, 500));

  const { from, text, msgId } = extractFields(raw);

  console.log("[SMS Webhook] from:", from, "| text:", text, "| msgId:", msgId);

  if (!from || !text) {
    console.warn("[SMS Webhook] Missing from or text — skipping");
    return NextResponse.json({ ok: true, skipped: "missing_from_or_text" });
  }

  const normalisedFrom = normaliseAuNumber(from);
  const localFrom = normalisedFrom.startsWith("+61")
    ? "0" + normalisedFrom.slice(3)
    : normalisedFrom;

  console.log("[SMS Webhook] Searching for phone:", normalisedFrom, "or", localFrom, "or", from);

  try {
    const db = await getDb();
    const col = db.collection<SubmissionDoc>("submissions");

    const lead = await col.findOne({
      $or: [{ phone: normalisedFrom }, { phone: localFrom }, { phone: from }],
      status: { $nin: ["Lost"] },
    }, { sort: { createdAt: -1 } });

    if (!lead) {
      console.log(`[SMS Webhook] No lead matched phone: ${from} / ${normalisedFrom} / ${localFrom}`);
      return NextResponse.json({ ok: true, matched: false });
    }

    console.log("[SMS Webhook] Matched lead:", lead._id.toString(), lead.name);

    // Deduplicate
    if (lead.messages?.some((m) => m.id === msgId)) {
      console.log("[SMS Webhook] Duplicate message, skipping");
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

    console.log("[SMS Webhook] Message saved successfully for lead:", lead._id.toString());
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
