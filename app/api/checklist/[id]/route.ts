import { NextRequest, NextResponse } from "next/server";
import { verifyQuoteToken } from "@/lib/quoteToken";
import { rateLimit } from "@/lib/rateLimit";
import {
  appendSubmissionPhotos,
  getSubmission,
  type SubmissionPhoto,
} from "@/lib/submissions";
import {
  checklistServiceNames,
  checklistToQuoteItems,
  checklistRequestText,
  mergeQuoteItems,
  type ChecklistAnswers,
  type ChecklistPage,
} from "@/lib/checklist";
import {
  recordChecklistFilled,
  recordChecklistSubmission,
} from "@/lib/checklistDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAGES = 20;
const MAX_TEXT = 2000;
const MAX_PHOTOS_PER_PAGE = 20;

function str(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function strList(value: unknown, max = 30): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => str(entry, 120)).filter(Boolean).slice(0, max);
}

/** Keep only the known checklist fields, so nothing arbitrary is stored. */
function sanitizeAnswers(raw: unknown): ChecklistAnswers {
  const pages = Array.isArray((raw as { pages?: unknown })?.pages)
    ? ((raw as { pages: unknown[] }).pages as unknown[])
    : [];
  const cleanPages: ChecklistPage[] = pages.slice(0, MAX_PAGES).map((entry, index) => {
    const page = (entry || {}) as Record<string, unknown>;
    return {
      id: str(page.id, 64) || `page-${index + 1}`,
      showerLeakage: str(page.showerLeakage, 20),
      leakageNotes: str(page.leakageNotes),
      showerType: str(page.showerType, 10),
      wallHeight: str(page.wallHeight, 10),
      workRequired: str(page.workRequired, 10),
      selectiveAreas: str(page.selectiveAreas),
      numberOfWalls: str(page.numberOfWalls, 5),
      tileSize: str(page.tileSize, 40),
      mosaic: str(page.mosaic, 10),
      showerScreen: str(page.showerScreen, 40),
      siliconeJoints: strList(page.siliconeJoints),
      crackedWallTiles: str(page.crackedWallTiles, 5),
      crackedFloorTiles: str(page.crackedFloorTiles, 5),
      tileAction: str(page.tileAction, 20),
      additionalAreas: strList(page.additionalAreas),
      additionalNotes: str(page.additionalNotes),
      balconyLeakage: str(page.balconyLeakage, 20),
      balconyArea: str(page.balconyArea, 40),
      balconyTileSize: str(page.balconyTileSize, 40),
      photos: [],
    };
  });
  return { pages: cleanPages };
}

function collectPhotos(raw: unknown): SubmissionPhoto[] {
  const pages = Array.isArray((raw as { pages?: unknown })?.pages)
    ? ((raw as { pages: unknown[] }).pages as unknown[])
    : [];
  const photos: SubmissionPhoto[] = [];
  for (const entry of pages) {
    const list = (entry as { photos?: unknown })?.photos;
    if (!Array.isArray(list)) continue;
    for (const item of list.slice(0, MAX_PHOTOS_PER_PAGE)) {
      const photo = (item || {}) as Record<string, unknown>;
      const url = str(photo.secureUrl, 500) || str(photo.url, 500);
      if (!url) continue;
      photos.push({
        name: str(photo.name, 200) || "photo",
        contentType: str(photo.contentType, 100) || undefined,
        url,
        secureUrl: url,
        publicId: str(photo.publicId, 300) || undefined,
        added: new Date().toISOString(),
      });
    }
  }
  return photos;
}

function tokenFrom(req: NextRequest, body?: { token?: string; t?: string }): string {
  return body?.token || body?.t || req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("t") || "";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!verifyQuoteToken(id, req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("t"))) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 401 });
  }
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Checklist not found." }, { status: 404 });

  return NextResponse.json(
    {
      ok: true,
      customer: {
        name: lead.name || "",
        email: lead.email || "",
        address: lead.address || "",
        service: lead.service || "",
        areas: lead.areas || "",
      },
      answers: lead.checklist?.answers || null,
      submitted: Boolean(lead.checklistSubmittedAt),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { token?: string; t?: string; event?: string; answers?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  if (!verifyQuoteToken(id, tokenFrom(req, body))) {
    return NextResponse.json({ error: "Invalid or expired checklist link." }, { status: 401 });
  }

  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Checklist not found." }, { status: 404 });

  // Lightweight lifecycle pings from the form.
  if (body.event === "viewed") return NextResponse.json({ ok: true });
  if (body.event === "started") {
    await recordChecklistFilled(id);
    return NextResponse.json({ ok: true });
  }

  if (!rateLimit(`checklist:${id}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const answers = sanitizeAnswers(body.answers);
  if (!answers.pages.length) {
    return NextResponse.json({ error: "Please complete at least one checklist page." }, { status: 400 });
  }

  const photos = collectPhotos(body.answers);
  if (photos.length) await appendSubmissionPhotos(id, photos);

  const additions = checklistToQuoteItems(answers, lead);
  const services = checklistServiceNames(additions);
  const requestText = checklistRequestText(answers);

  // Never overwrite the items of an already-accepted quote.
  const locked = Boolean(lead.quoteAcceptedAt || lead.quoteSignedAt);
  const quoteItems = locked ? undefined : mergeQuoteItems(lead.quoteItems, additions);

  await recordChecklistSubmission(id, answers, { services, requestText, quoteItems });

  return NextResponse.json({ ok: true, services, items: additions });
}
