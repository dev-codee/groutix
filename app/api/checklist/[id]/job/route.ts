import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { parseAdditionalBalconies, type QuoteBalcony } from "@/lib/quoteBalconies";
import { initialChecklistRevision, verifyJobChecklistLink } from "@/lib/quoteChecklistLink";
import { describeJobChecklist, jobChecklistErrors, normalizeJobChecklist } from "@/lib/quoteJobChecklist";
import { readQuotePhotos } from "@/lib/quotePhotoUpload";
import { getSubmission, saveResentJobChecklist } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid checklist submission." }, { status: 400 });

  const field = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  const revision = field("revision");
  if (!verifyJobChecklistLink(id, revision, field("token"))) {
    return NextResponse.json({ error: "Invalid checklist link." }, { status: 401 });
  }
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
  if ((lead.quoteChecklistRevision ?? initialChecklistRevision) !== revision) return NextResponse.json({ ok: true });
  if (!rateLimit(`job-checklist:${id}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const raw = field("checklist");
  const balconiesRaw = field("additionalBalconies");
  let checklist;
  let additionalBalconies: QuoteBalcony[];
  try {
    checklist = normalizeJobChecklist(JSON.parse(raw));
    additionalBalconies = balconiesRaw ? parseAdditionalBalconies(balconiesRaw) : [];
  } catch {
    return NextResponse.json({ error: "Check the job and balcony details and try again." }, { status: 400 });
  }
  const leaking = checklist.location === "Balcony" ? "" : field("leaking");
  const errors = jobChecklistErrors(checklist, leaking, additionalBalconies);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Complete the highlighted checklist fields.", errors }, { status: 400 });
  }

  const uploaded = await readQuotePhotos(form, { cloudinaryOnly: true });
  if (!uploaded) return NextResponse.json({ error: "Please upload smaller images." }, { status: 400 });

  const job = describeJobChecklist(checklist, leaking, additionalBalconies);
  const saved = await saveResentJobChecklist(id, revision, job, additionalBalconies, uploaded.submissionPhotos);
  if (!saved) {
    const current = await getSubmission(id);
    if (!current || (current.quoteChecklistRevision ?? initialChecklistRevision) === revision) {
      return NextResponse.json({ error: "Could not save the checklist. Please try again." }, { status: 503 });
    }
  }
  return NextResponse.json({ ok: true });
}
