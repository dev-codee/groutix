import type { Metadata } from "next";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import { initialChecklistRevision, verifyJobChecklistLink } from "@/lib/quoteChecklistLink";
import { normalizeJobChecklist } from "@/lib/quoteJobChecklist";
import { getSubmission } from "@/lib/submissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Job Checklist", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function JobChecklistPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; revision?: string }>;
}) {
  const { id } = await params;
  const { token, revision } = await searchParams;
  const lead = typeof token === "string" && typeof revision === "string" && verifyJobChecklistLink(id, revision, token)
    ? await getSubmission(id)
    : null;

  return (
    <main className="public-page min-h-screen bg-slate-100 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {!lead || !token || !revision ? (
          <p role="alert" className="rounded-lg bg-white p-5 text-slate-800">This checklist link is invalid. Please ask Groutix to resend it.</p>
        ) : (lead.quoteChecklistRevision ?? initialChecklistRevision) !== revision ? (
          <div className="rounded-lg bg-white p-5 text-slate-800">
            <h1 className="text-lg font-bold">Checklist received</h1>
            <p className="mt-1 text-sm">Groutix already received this checklist.</p>
          </div>
        ) : (
          <QuoteFormV2 idPrefix="emailed-checklist" checklistRequest={{
            leadId: id,
            token,
            revision,
            checklist: initialAnswers(lead.quoteChecklist, lead.leaking),
            leaking: lead.quoteChecklist && lead.quoteChecklist.location !== "Balcony" && (lead.leaking === "Yes" || lead.leaking === "No") ? lead.leaking : "",
            additionalBalconies: lead.additionalBalconies ?? [],
            photoCount: lead.photos?.length ?? lead.photosCount ?? 0,
          }} />
        )}
      </div>
    </main>
  );
}

function initialAnswers(answers: unknown, leaking?: string) {
  const checklist = normalizeJobChecklist(answers);
  if (checklist.location === "Balcony") {
    checklist.location = "";
    if (!checklist.balconyLeakage && (leaking === "Yes" || leaking === "No")) checklist.balconyLeakage = leaking;
  } else if (checklist.location === "Other shower") {
    checklist.location = "";
  }
  return checklist;
}
