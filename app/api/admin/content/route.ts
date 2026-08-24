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
      hours: str(b.hours, 100),
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
    whyUs: {
      headline: str(body.whyUs?.headline, 200),
      subheadline: str(body.whyUs?.subheadline, 400),
      points: Array.isArray(body.whyUs?.points)
        ? body.whyUs.points.map((p: unknown) => str(p, 300)).filter(Boolean)
        : [],
    },
    about: {
      headline: str(body.about?.headline, 200),
      subheadline: str(body.about?.subheadline, 500),
      storyTitle: str(body.about?.storyTitle, 200),
      storyParagraphs: Array.isArray(body.about?.storyParagraphs)
        ? body.about.storyParagraphs.map((p: unknown) => str(p, 2000)).filter(Boolean)
        : [],
      stats: Array.isArray(body.about?.stats)
        ? body.about.stats.map((s: any) => ({
            value: str(s?.value, 40),
            label: str(s?.label, 100),
          }))
        : [],
      values: Array.isArray(body.about?.values)
        ? body.about.values.map((v: any) => ({
            title: str(v?.title, 100),
            desc: str(v?.desc, 400),
          }))
        : [],
      features: Array.isArray(body.about?.features)
        ? body.about.features.map((f: unknown) => str(f, 200)).filter(Boolean)
        : [],
    },
    testimonials: Array.isArray(body.testimonials)
      ? body.testimonials.map((t: any) => ({
          name: str(t?.name, 100),
          location: str(t?.location, 100),
          rating: Math.min(5, Math.max(1, Number(t?.rating) || 5)),
          title: str(t?.title, 150),
          content: str(t?.content, 1500),
          date: str(t?.date, 50),
        }))
      : [],
    showerScreens: Array.isArray(body.showerScreens)
      ? body.showerScreens.map((s: any) => ({
          id: str(s?.id, 100),
          name: str(s?.name, 200),
          tagline: str(s?.tagline, 300),
          category: (["Frameless", "Semi-Frameless", "Sliding", "Wardrobes"].includes(s?.category)
            ? s.category
            : "Frameless") as "Frameless" | "Semi-Frameless" | "Sliding" | "Wardrobes",
          imageLabel: str(s?.imageLabel, 200),
          highlights: Array.isArray(s?.highlights)
            ? s.highlights.map((h: unknown) => str(h, 100)).filter(Boolean)
            : [],
          summary: str(s?.summary, 600),
          description: Array.isArray(s?.description)
            ? s.description.map((d: unknown) => str(d, 2000)).filter(Boolean)
            : [],
          features: Array.isArray(s?.features)
            ? s.features.map((f: unknown) => str(f, 300)).filter(Boolean)
            : [],
          specs: {
            glass: str(s?.specs?.glass, 200),
            frameFinishes: str(s?.specs?.frameFinishes, 200),
            doorAction: str(s?.specs?.doorAction, 200),
            dimensions: str(s?.specs?.dimensions, 200),
            coating: str(s?.specs?.coating, 200),
          },
          metaTitle: str(s?.metaTitle, 200),
          metaDesc: str(s?.metaDesc, 400),
        }))
      : [],
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
      { error: "Database is not configured - content cannot be saved." },
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
