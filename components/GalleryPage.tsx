"use client";

// /gallery — real Groutix job photos: filterable gallery with lightbox,
// before/after drag sliders, reviews, FAQs and quote CTA.
// Colours, type and components follow the site's v2 system (navy #001F97, gold #FBBC04).

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Phone, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import { abs, faqJsonLd } from "@/lib/seo";
import type { Review, BusinessRating } from "@/lib/reviews";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, h2, inlineLink, lead, wrap,
} from "@/components/v2/ui";

/* ───────────── Photos (all from the site's public folder) ───────────── */
type Cat = "showers" | "balconies" | "problems";
type Photo = { src: string; w: number; h: number; title: string; alt: string; cat: Cat };

const catLabel: Record<Cat, string> = {
  showers: "Shower Regrouting",
  balconies: "Balcony Regrouting",
  problems: "Problems We Fix",
};

const photos: Photo[] = [
  { src: "/shower-regrouting-tiled-interior.webp", w: 1428, h: 1071, title: "Tiled Shower Interior, Fully Regrouted", alt: "Freshly regrouted tiled shower interior with waterproof epoxy grout in a Melbourne home", cat: "showers" },
  { src: "/Shower regrouting cover .webp", w: 1428, h: 1071, title: "Shower Regrouted with Waterproof Epoxy", alt: "Shower regrouting in Melbourne — failed grout removed and rebuilt with waterproof epoxy grout", cat: "showers" },
  { src: "/shower-regrouting-over-bath-tiles.webp", w: 756, h: 1008, title: "Shower Over Bath, Regrouted & Resealed", alt: "Shower over a bath after regrouting and silicone resealing", cat: "showers" },
  { src: "/beige-shower-floor-regrouting-top-view after.webp", w: 536, h: 714, title: "Beige Shower Floor After Regrouting", alt: "Beige shower floor after a full epoxy regrout, viewed from above", cat: "showers" },
  { src: "/grey-shower-floor-regrouting-top-view after.webp", w: 536, h: 714, title: "Grey Shower Floor After Epoxy Regrouting", alt: "Grey shower floor finished with waterproof epoxy grout after regrouting", cat: "showers" },
  { src: "/white-tile-shower-regrouting-overhead after.webp", w: 536, h: 714, title: "White Tiled Shower, Freshly Resealed", alt: "White tiled shower after regrouting and fresh silicone sealing", cat: "showers" },
  { src: "/grey-shower-floor-envelope-cut-regrouting after.webp", w: 378, h: 504, title: "Envelope-Cut Shower Floor, Regrouted", alt: "Shower floor with envelope-cut falls to the drain, regrouted with epoxy grout", cat: "showers" },
  { src: "/balcony-regrouting-tiles.webp", w: 362, h: 272, title: "Balcony Tiles Regrouted", alt: "Outdoor balcony tiles regrouted by Groutix in Melbourne", cat: "balconies" },
  { src: "/balcony-regrouting-herringbone-tiles.webp", w: 543, h: 724, title: "Herringbone Balcony Tiles Regrouted", alt: "Herringbone-pattern balcony tiles with fresh epoxy grout", cat: "balconies" },
  { src: "/tile-regrouting-cracked-grout-closeup.webp", w: 352, h: 192, title: "Cracked & Missing Grout", alt: "Close-up of cracked and missing grout between shower tiles", cat: "problems" },
  { src: "/shower-regrouting-signs-black-mould.webp", w: 305, h: 406, title: "Black Mould in Shower Grout", alt: "Black mould growing in shower grout and silicone", cat: "problems" },
  { src: "/shower-regrouting-mouldy-grout-corner.webp", w: 320, h: 221, title: "Mouldy Grout & Silicone Corner", alt: "Mouldy grout and silicone in a shower corner next to the glass screen", cat: "problems" },
  { src: "/water stains on the ceiling below.webp", w: 436, h: 278, title: "Water Stains on the Ceiling Below", alt: "Water stains on the ceiling below a leaking shower", cat: "problems" },
  { src: "/leaking-shower-water-damage-wall.webp", w: 320, h: 214, title: "Water Damage from a Leaking Shower", alt: "Water damage on a wall caused by a leaking shower", cat: "problems" },
  { src: "/balcony-water-damage-regrouting-signs.webp", w: 368, h: 335, title: "Balcony Water Damage", alt: "Water damage and staining caused by a leaking balcony", cat: "problems" },
  { src: "/white-tile-shower-regrouting-floor-view before.webp", w: 536, h: 714, title: "Worn Shower Floor Before Regrouting", alt: "Worn white tiled shower floor before regrouting", cat: "problems" },
  { src: "/grey-shower-base-regrouting-overhead-view before .webp", w: 378, h: 504, title: "Shower Base with Pooling Water", alt: "Shower base where water pools and sits because the grout has failed", cat: "problems" },
  { src: "/shower-regrouting-rust-stained-tiles.webp", w: 150, h: 149, title: "Rust-Stained Grout Lines", alt: "Rust staining along the grout lines of shower tiles", cat: "problems" },
];

const beforeAfterPairs = [
  { before: "/beige-shower-floor-regrouting-top-view before.webp", after: "/beige-shower-floor-regrouting-top-view after.webp", title: "Shower floor regrout", label: "Beige shower floor in a Melbourne home, regrouted with waterproof epoxy" },
  { before: "/tiled-shower-floor-regrouting-wide before.webp", after: "/tiled-shower-floor-regrouting-wide after .webp", title: "Floor tile regrout", label: "Tiled shower floor in a Melbourne home before and after regrouting" },
  { before: "/grey-shower-base-regrouting-overhead-view before .webp", after: "/grey-shower-floor-regrouting-top-view after.webp", title: "Shower base regrout", label: "Grey shower base in a Melbourne home, regrouted and resealed" },
  { before: "/grey-shower-floor-envelope-cut-regrouting before.webp", after: "/grey-shower-floor-envelope-cut-regrouting after.webp", title: "Envelope-cut shower floor regrout", label: "Envelope-cut shower floor in a Melbourne home before and after regrouting" },
];

const faqs: Array<{ q: string; a: ReactNode; plain: string }> = [
  {
    q: "Are these photos from real Groutix jobs?",
    a: "Yes. Every photo in this gallery is from a real Groutix job in a Melbourne home — showers, balconies and bathrooms we have actually regrouted or repaired. No stock photos.",
    plain: "Yes. Every photo in this gallery is from a real Groutix job in a Melbourne home — showers, balconies and bathrooms we have actually regrouted or repaired. No stock photos.",
  },
  {
    q: "Can my shower look like these results?",
    a: "In most cases, yes — if your tiles are solid and the waterproof membrane underneath is intact. We inspect first and tell you honestly if regrouting will work, or if the shower needs more. The quote is free.",
    plain: "In most cases, yes — if your tiles are solid and the waterproof membrane underneath is intact. We inspect first and tell you honestly if regrouting will work, or if the shower needs more. The quote is free.",
  },
  {
    q: "Do you regrout balconies as well as showers?",
    a: "Yes. We regrout and repair showers, balconies, bathrooms, laundries and other tiled wet areas across Melbourne.",
    plain: "Yes. We regrout and repair showers, balconies, bathrooms, laundries and other tiled wet areas across Melbourne.",
  },
  {
    q: "How do I get a quote for my shower or balcony?",
    a: <>Use the <Link className={inlineLink} href="/#quote-form">quote form</Link> or call us. Adding photos of your shower or balcony helps us assess the grout, silicone and tiles before we quote — photos are required on the form for exactly that reason.</>,
    plain: "Use the quote form on our homepage or call us. Adding photos of your shower or balcony helps us assess the grout, silicone and tiles before we quote.",
  },
];

const googleReviewsUrl = "https://www.google.com/maps/place/Groutix";

/* ───────────── Before/after drag slider (same as the homepage) ───────────── */
function BeforeAfterPair({ before, after, title, label }: { before: string; after: string; title: string; label: string }) {
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const layer = (src: string) => (
    <div className="absolute inset-0">
      <Image src={src} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
    </div>
  );
  return (
    <figure className="m-0">
      <div className="relative aspect-square select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:aspect-[4/4.2]">
        <div className="absolute inset-0 overflow-hidden" role="img" aria-label={`${label}, before regrouting`}>{layer(before)}</div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} role="img" aria-label={`${label}, after regrouting`}>{layer(after)}</div>
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
        <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${handle}%` }} aria-hidden="true" />
        <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-black text-[#001F97] shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ left: `${handle}%` }} aria-hidden="true">↔</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Drag to compare before and after: ${title}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>
      <figcaption className="mt-3 font-bold text-slate-900">{title}</figcaption>
    </figure>
  );
}

/* ───────────── Page ───────────── */
export default function GalleryPage({ reviews, rating }: { reviews: Review[]; rating: BusinessRating }) {
  const { phone, tel } = useContact();
  const [cat, setCat] = useState<"all" | Cat>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const visible = cat === "all" ? photos : photos.filter((p) => p.cat === cat);
  const counts: Record<string, number> = {
    all: photos.length,
    showers: photos.filter((p) => p.cat === "showers").length,
    balconies: photos.filter((p) => p.cat === "balconies").length,
    problems: photos.filter((p) => p.cat === "problems").length,
  };

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (d: number) => setLightbox((i) => (i === null ? i : (i + d + visible.length) % visible.length)),
    [visible.length]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close, step]);

  const galleryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Groutix Regrouting Gallery — Before & After Photos Melbourne",
    description: "Real Groutix regrouting results from Melbourne homes: shower regrouting, balcony regrouting and leak repairs.",
    url: abs("/gallery"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: photos.map((p, i) => ({
        "@type": "ImageObject",
        position: i + 1,
        contentUrl: abs(p.src),
        caption: p.title,
        description: p.alt,
      })),
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: "Gallery", item: abs("/gallery") },
    ],
  };

  const chips: Array<{ key: "all" | Cat; label: string }> = [
    { key: "all", label: "All Photos" },
    { key: "showers", label: "Showers" },
    { key: "balconies", label: "Balconies" },
    { key: "problems", label: "Problems We Fix" },
  ];

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

        {/* PHOTO GALLERY — no hero; straight into the photos */}
        <section id="gallery" className="scroll-mt-28 bg-white pb-14 pt-[140px] md:pb-20 lg:pt-[160px]">
          <div className={wrap}>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm font-semibold text-slate-500">
              <Link href="/" className="hover:text-[#001F97] hover:underline">Home</Link>
              <span className="mx-2 text-[#FBBC04]" aria-hidden="true">›</span>
              <span aria-current="page" className="text-slate-900">Gallery</span>
            </nav>
            <h1 className={`${h2} max-w-[840px]`}>Regrouting Gallery: Real Shower &amp; Balcony Results in Melbourne</h1>
            <p className={`${lead} mb-9 mt-3.5 max-w-[720px]`}>
              Every photo here is from a real Groutix job — no stock photos. Filter by job type, then tap any photo to view it full screen.
            </p>

          <div className="mb-8 flex flex-wrap justify-start gap-2.5 md:justify-center" role="group" aria-label="Filter gallery photos">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => { setCat(c.key); setLightbox(null); }}
                aria-pressed={cat === c.key}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  cat === c.key
                    ? "border-[#001F97] bg-[#001F97] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#2F63CC] hover:text-[#001F97]"
                }`}
              >
                {c.label} <span className={cat === c.key ? "text-[#FBBC04]" : "text-slate-400"}>({counts[c.key]})</span>
              </button>
            ))}
          </div>

          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {visible.map((p, i) => (
              <button
                key={p.src + p.title}
                type="button"
                onClick={() => setLightbox(i)}
                className="group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2F63CC]/40"
                aria-label={`View photo: ${p.title}`}
              >
                <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-3.5 pt-12">
                  <span className="block text-[15px] font-bold leading-snug text-white">{p.title}</span>
                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wider text-[#FBBC04]">{catLabel[p.cat]}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[15px] leading-relaxed text-slate-500">
            More job photos are added as new work is completed. Want your shower or balcony assessed?{" "}
            <Link className={inlineLink} href="/#quote-form">Get a free quote</Link> — photos of your tiles help us quote accurately.
            </p>
          </div>
        </section>

        {/* BEFORE & AFTER */}
        <Section id="before-after" alt>
          <SectionHead k="Before & After" title="Drag to Compare: Before and After Regrouting">
            <p className={lead}>Drag the handle on any photo to compare the same shower before and after its Groutix regrout.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {beforeAfterPairs.map((p) => <BeforeAfterPair key={p.title} before={p.before} after={p.after} title={p.title} label={p.label} />)}
          </div>
        </Section>

        {/* REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">
              Read More Verified Reviews on Google <span className="font-extrabold text-[#FBBC04]">→</span>
            </a>
          </div>
          <div className={`${box} mt-8 flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center`}>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Have a shower or balcony that needs attention?</h3>
              <p className="mt-1 text-base text-slate-600">Tell us what’s happening and we’ll help you understand the right next step.</p>
            </div>
            <Link href="/contact" className={`${btnNavy} shrink-0`}>Get a Quote</Link>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" alt>
          <SectionHead title="Frequently Asked Questions" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs.map((f) => ({ q: f.q, a: f.plain })))) }} />
          <FaqList items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
        </Section>

        {/* FINAL CTA */}
        <section className="bg-white py-14 md:py-20">
          <div className={wrap}>
            <div className="grid grid-cols-1 items-center gap-7 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-[52px]">
              <div>
                <h2 className={`${h2} text-white`}>Want Results Like These?</h2>
                <p className="mt-3 text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
                <p className="mt-1 text-[#D6DCF5]">Free quote · Tiles stay in place · 10-year waterproof warranty</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/#quote-form" className={`${btnGold} min-h-[54px] w-full sm:w-auto`}>Request A Quote</a>
                <a href={tel} className={`${btnGhost} min-h-[54px] w-full sm:w-auto`}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar quoteHref="/#quote-form" />

      {/* LIGHTBOX */}
      {lightbox !== null && visible[lightbox] ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`Photo: ${visible[lightbox].title}`}>
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pb-4 text-white">
            <span className="text-sm font-bold tabular-nums text-white/70">{lightbox + 1} / {visible.length}</span>
            <button type="button" onClick={close} aria-label="Close photo viewer" className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
            <Image
              key={visible[lightbox].src}
              src={visible[lightbox].src}
              alt={visible[lightbox].alt}
              width={visible[lightbox].w}
              height={visible[lightbox].h}
              sizes="100vw"
              className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
            />
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:-left-2">
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:-right-2">
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mx-auto w-full max-w-5xl pt-4 text-center">
            <p className="text-base font-bold text-white">{visible[lightbox].title}</p>
            <p className="mt-0.5 text-sm font-semibold uppercase tracking-wider text-[#FBBC04]">{catLabel[visible[lightbox].cat]}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
