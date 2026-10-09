import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { URLSearchParams } from "node:url";
import { getDb } from "@/lib/mongodb";
import { appendActivity, type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";
import { normaliseAuNumber } from "@/lib/sms";
import { sendReplyNotification } from "@/lib/email";

export const runtime = "nodejs";

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  try {
    // Texto sends X-Texto-Signature: sha256=<hex>.
    const provided = signature.replace(/^sha256=/i, "").trim();
    if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
    const a = createHmac("sha256", secret).update(rawBody).digest();
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractFields(body: Record<string, unknown>): { from: string; text: string; msgId: string } {
  const from = body.from || body.mobile || body.sender || body.msisdn || body.originator || body.source_number || "";
  const text = body.message || body.text || body.body || body.content || body.msg || "";
  const msgId = body.message_id || body.id || body.messageId || body.msg_id || `sms_in_${Date.now()}`;
  return {
    from: typeof from === "string" ? from.trim() : "",
    text: typeof text === "string" ? text.trim() : "",
    msgId: String(msgId),
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.TEXTO_INBOUND_WEBHOOK_SECRET || process.env.TEXTO_WEBHOOK_SECRET || "";

  // Read raw body as buffer first (needed for signature verification)
  const rawBody = Buffer.from(await req.clone().arrayBuffer());
  const bodyStr = rawBody.toString("utf8");

  console.log("[SMS Webhook] Received POST");

  // Verify signature if a secret is configured
  if (secret) {
    const sig = req.headers.get("x-texto-signature") || req.headers.get("x-signature") || "";
    if (!sig) {
      console.warn("[SMS Webhook] No signature header found — rejecting.");
      return NextResponse.json({ error: "Unauthorized: missing signature" }, { status: 401 });
    }
    if (!verifySignature(rawBody, sig, secret)) {
      console.warn("[SMS Webhook] Signature mismatch.");
      return NextResponse.json({ error: "Unauthorized: signature mismatch" }, { status: 401 });
    }
    console.log("[SMS Webhook] Signature verified OK");
  }

  // Parse body — try JSON first, then form-urlencoded
  let raw: Record<string, unknown> = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      raw = JSON.parse(bodyStr);
    } else if (ct.includes("multipart/form-data")) {
      for (const [key, value] of await req.formData()) {
        if (typeof value === "string") raw[key] = value;
      }
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      raw = Object.fromEntries(new URLSearchParams(bodyStr));
    } else {
      // Try JSON regardless of content-type
      try {
        raw = JSON.parse(bodyStr);
      } catch {
        raw = Object.fromEntries(new URLSearchParams(bodyStr));
      }
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid payload");
  } catch {
    console.error("[SMS Webhook] Failed to parse body");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Delivery receipts are separate events, not customer replies.
  const event = req.headers.get("x-texto-event") || raw.event;
  if (event && event !== "message.inbound") {
    return NextResponse.json({ ok: true, skipped: "not_inbound" });
  }

  const { from, text, msgId } = extractFields(raw);

  if (!from || !text) {
    console.warn("[SMS Webhook] Missing from or text — skipping");
    return NextResponse.json({ ok: true, skipped: "missing_from_or_text" });
  }

  const normalisedFrom = normaliseAuNumber(from);
  if (!/^\+?\d{7,15}$/.test(normalisedFrom)) {
    return NextResponse.json({ error: "Invalid sender number" }, { status: 400 });
  }
  const localFrom = normalisedFrom.startsWith("+61")
    ? "0" + normalisedFrom.slice(3)
    : normalisedFrom;

  // Match the same number whether staff saved 0412 345 678, +61 412 345 678,
  // 61412345678, or an unformatted value. Escape and anchor every variant.
  const phoneVariants = [...new Set([normalisedFrom, localFrom, from, normalisedFrom.replace(/^\+/, "")])];
  const phonePatterns = phoneVariants.map((phone) => ({
    phone: {
      $regex: "^[\\s().-]*" + Array.from(phone.replace(/[^\d+]/g, ""), (char) =>
        char === "+" ? "\\+" : char
      ).join("[\\s().-]*") + "[\\s().-]*$",
    },
  }));

  try {
    const db = await getDb();
    const col = db.collection<SubmissionDoc>("submissions");

    const lead = await col.findOne({
      $or: phonePatterns,
      status: { $nin: ["Lost"] },
    }, { sort: { createdAt: -1 } });

    if (!lead) {
      console.warn("[SMS Webhook] No matching lead for inbound message:", msgId);
      return NextResponse.json({ ok: true, matched: false });
    }

    console.log("[SMS Webhook] Matched lead:", lead._id.toString());

    // Deduplicate
    if (lead.messages?.some((m) => m.id === msgId)) {
      console.log("[SMS Webhook] Duplicate message, skipping");
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const receivedAt = typeof raw.received_at === "string" ? new Date(raw.received_at) : new Date();
    const crmMessage: CustomerMessage = {
      id: msgId,
      from: "customer",
      channel: "sms",
      text: text.trim(),
      time: (Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt).toISOString(),
      read: false,
    };

    // Enforce deduplication in the write too, so concurrent retries cannot both
    // append the same reply or send two notifications.
    const saved = await col.updateOne(
      { _id: lead._id, "messages.id": { $ne: msgId } },
      { $push: { messages: crmMessage } }
    );
    if (!saved.modifiedCount) return NextResponse.json({ ok: true, duplicate: true });

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
