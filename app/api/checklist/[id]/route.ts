import { NextRequest, NextResponse } from "next/server";
import { verifyQuoteToken } from "@/lib/quoteToken";
import { rateLimit } from "@/lib/rateLimit";
import { getChecklistForm } from "@/lib/checklistFormServer";
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
      service: str(page.service, 80),
      photoCategory: str(page.photoCategory, 2),
      customAnswers: page.customAnswers && typeof page.customAnswers === "object" && !Array.isArray(page.customAnswers)
        ? Object.fromEntries(Object.entries(page.customAnswers as Record<string, unknown>).slice(0, 50).flatMap(([id, rawAnswer]) => {
          if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || !rawAnswer || typeof rawAnswer !== "object") return [];
          const answer = rawAnswer as Record<string, unknown>;
          return [[id, { label: str(answer.label, 160), value: Array.isArray(answer.value) ? strList(answer.value) : str(answer.value) }]];
        })) : {},
      areaName: str(page.areaName, 120),
      areaDescription: str(page.areaDescription),
      issues: strList(page.issues),
      dimensionsLength: str(page.dimensionsLength, 20),
      dimensionsWidth: str(page.dimensionsWidth, 20),
      measurementsUnknown: page.measurementsUnknown === true,
      floorTileSize: str(page.floorTileSize, 40),
      damagedTiles: str(page.damagedTiles, 20),
      spareTiles: str(page.spareTiles, 20),
      groutPreference: str(page.groutPreference, 20),
      preferInspection: page.preferInspection === true,
      balconyLevel: str(page.balconyLevel, 80),
      balconyBelow: str(page.balconyBelow, 80),
      balconySkirting: str(page.balconySkirting, 20),
      balconyWork: strList(page.balconyWork),
      previousRepairs: str(page.previousRepairs, 20),
      previousRepairNotes: str(page.previousRepairNotes),
      areaWork: strList(page.areaWork),
      showerLeakage: str(page.showerLeakage, 20),
      leakageNotes: str(page.leakageNotes),
      showerType: str(page.showerType, 10),
      wallHeight: str(page.wallHeight, 10),
      workRequired: str(page.workRequired, 10),
      selectiveAreas: str(page.selectiveAreas),
      numberOfWalls: str(page.numberOfWalls, 10),
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
      photos: Array.isArray(page.photos) ? page.photos.slice(0, MAX_PHOTOS_PER_PAGE).map(item => {
        const photo = (item || {}) as Record<string, unknown>;
        const url = str(photo.secureUrl, 500) || str(photo.url, 500);
        return { name: str(photo.name, 200) || "photo", category: str(photo.category, 120), contentType: str(photo.contentType, 100), url, secureUrl: url, publicId: str(photo.publicId, 300) };
      }).filter(photo => { try { return new URL(photo.url).hostname === "res.cloudinary.com"; } catch { return false; } }) : [],
    };
  });
  const source = (raw || {}) as Record<string, unknown>;
  return { pages: cleanPages, timeframe: str(source.timeframe, 40), propertyType: str(source.propertyType, 40), accessNotes: str(source.accessNotes), additionalInformation: str(source.additionalInformation) };
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
      try { if (new URL(url).hostname !== "res.cloudinary.com") continue; } catch { continue; }
      photos.push({
        name: str(photo.name, 200) || "photo",
        category: str(photo.category, 120) || undefined,
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
      form: await getChecklistForm(),
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
  if (lead.checklistSubmittedAt && body.event !== "viewed") return NextResponse.json({ error: "This quote request has already been submitted." }, { status: 409 });

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
  if (answers.pages.some(page => !page.service)) {
    return NextResponse.json({ error: "Please select a service for each area." }, { status: 400 });
  }
  const form = await getChecklistForm();
  if (answers.pages.some(page => !form.serviceChoices.includes(page.service || ""))) {
    return NextResponse.json({ error: "Please select an available service for each area." }, { status: 400 });
  }
  for (const page of answers.pages) {
    if (page.photoCategory) page.photoCategoryLabel = form.photoCategories[Number(page.photoCategory) - 1];
    page.customAnswers = Object.fromEntries(form.customQuestions.filter(q => q.service === "All" || q.service === page.service).flatMap(q => {
      const value = page.customAnswers?.[q.id]?.value;
      if (value === undefined) return [];
      if (["single", "multiple"].includes(q.type)) {
        const values = Array.isArray(value) ? value : [value];
        if (values.some(item => !q.options.includes(item))) return [];
      }
      return [[q.id, { label: q.label, value }]];
    }));
  }
  if (answers.pages.some(page => form.customQuestions.some(q => q.required && (q.service === "All" || q.service === page.service) && !(Array.isArray(page.customAnswers?.[q.id]?.value) ? (page.customAnswers![q.id].value as string[]).length : String(page.customAnswers?.[q.id]?.value || "").trim())))) {
    return NextResponse.json({ error: "Please answer all required questions." }, { status: 400 });
  }
  if (!form.hiddenQuestions.includes("Photos for your quote") && answers.pages.some(page => !page.preferInspection && (page.photos?.length || 0) < (page.service === "Shower" ? 4 : 3))) {
    return NextResponse.json({ error: "Please add the requested photos or choose an on-site assessment for each area." }, { status: 400 });
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
