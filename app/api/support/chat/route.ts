import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  buildFallbackReply,
  buildSupportSystemPrompt,
  getSupportKnowledgeText,
  type SupportMessage,
} from "@/lib/supportKnowledge";

export const runtime = "nodejs";

const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_TOTAL_CHARS = 6000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type ChatBody = {
  messages?: SupportMessage[];
};

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function clientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMessages(value: unknown): SupportMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;

  const normalized: SupportMessage[] = [];
  let totalChars = 0;

  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const role = "role" in entry ? entry.role : undefined;
    const content = sanitizeText("content" in entry ? entry.content : "");

    if ((role !== "user" && role !== "assistant") || !content || content.length > MAX_MESSAGE_LENGTH) {
      return null;
    }

    totalChars += content.length;
    if (totalChars > MAX_TOTAL_CHARS) return null;
    normalized.push({ role, content });
  }

  const lastMessage = normalized.at(-1);
  if (!lastMessage || lastMessage.role !== "user") return null;

  return normalized;
}

function toGeminiRole(role: SupportMessage["role"]): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

async function askGemini(messages: SupportMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return buildFallbackReply(messages);

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const knowledge = getSupportKnowledgeText();

  const response = await fetch(`${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `${buildSupportSystemPrompt()}\n\nGroutix knowledge base:\n${knowledge}`,
          },
        ],
      },
      contents: messages.map((message) => ({
        role: toGeminiRole(message.role),
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 350,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini API ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) return buildFallbackReply(messages);
  return content;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`support-chat:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many chat requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) {
    return NextResponse.json({ error: "Invalid chat payload." }, { status: 400 });
  }

  try {
    const reply = await askGemini(messages);
    return NextResponse.json({
      reply,
      canEscalate: true,
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return NextResponse.json(
      {
        error: "The chat assistant is unavailable right now. Please try again or send a support request.",
        fallbackReply: buildFallbackReply(messages),
      },
      { status: 502 }
    );
  }
}
