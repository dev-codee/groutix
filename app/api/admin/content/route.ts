import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSiteContent, saveSiteContent } from "@/lib/siteContentServer";
import type { SiteContent, SiteContentOverrides } from "@/lib/siteContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the current merged content so the editor can pre-fill every field.
export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json({ content, mongo: isMongoConfigured() });
}

const str = (v: unknown, max = 2000): string =>
  typeof v === "string" ? v.slice(0, max) : "";

// Normalise the editor payload into a clean overrides document before storing.
function sanitize(body: Record<string, any>): SiteContentOverrides {
  const b = body.business ?? {};
  const out: SiteContentOverrides = {
    business: {
      phone: str(b.phone, 40),
      email: str(b.email, 160),
      address: {
        street: str(b.address?.street, 160),
        locality: str(b.address?.locality, 120),
        region: str(b.address?.region, 60),
        postalCode: str(b.address?.postalCode, 20),
      },
      areasServed: Array.isArray(b.areasServed)
        ? b.areasServed.map((a: unknown) => str(a, 80)).filter(Boolean).slice(0, 40)
        : [],
      social: {
        google: str(b.social?.google, 300),
        facebook: str(b.social?.facebook, 300),
        instagram: str(b.social?.instagram, 300),
      },
      rating: {
        value: Math.min(5, Math.max(0, Number(b.rating?.value) || 0)),
        count: Math.max(0, Math.round(Number(b.rating?.count) || 0)),
      },
    },
    hero: {
      headline: str(body.hero?.headline, 300),
      subheadline: str(body.hero?.subheadline, 600),
    },
    cta: {
      heading: str(body.cta?.heading, 200),
      subtext: str(body.cta?.subtext, 400),
      buttonLabel: str(body.cta?.buttonLabel, 60),
    },
    faqCategories: Array.isArray(body.faqCategories)
      ? body.faqCategories
          .map((cat: any) => ({
            title: str(cat?.title, 160),
            faqs: Array.isArray(cat?.faqs)
              ? cat.faqs
                  .map((f: any) => ({ question: str(f?.question, 400), answer: str(f?.answer, 3000) }))
                  .filter((f: { question: string; answer: string }) => f.question || f.answer)
              : [],
          }))
          .filter((cat: { title: string; faqs: any[] }) => cat.title || cat.faqs.length)
      : [],
  };
  return out;
}

export async function PUT(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured — content cannot be saved." },
      { status: 503 }
    );
  }
  let body: Partial<SiteContent>;
  try {
    body = (await req.json()) as Partial<SiteContent>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  try {
    await saveSiteContent(sanitize(body));
    const content = await getSiteContent();
    return NextResponse.json({ ok: true, content });
  } catch (err) {
    console.error("admin/content save failed:", err);
    return NextResponse.json({ error: "Could not save content." }, { status: 500 });
  }
}
