"use client";

// /gallery — finished Groutix job photos only: premium filterable gallery with
// lightbox, reviews, FAQs and quote CTA. Every photo is a real completed job
// supplied by the Groutix team (after photos, SEO named, watermarked, geotagged).
// Colours follow the site v2 system (navy #001F97, accent #2F63CC, gold #FBBC04).

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Phone, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import { abs, faqJsonLd } from "@/lib/seo";
import type { Review, BusinessRating } from "@/lib/reviews";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, h2, inlineLink, lead, wrap,
} from "@/components/v2/ui";

/* ───────────── Photos (finished jobs, all from the site's public folder) ───────────── */
type Cat = "showers" | "floors" | "bathrooms" | "bases";
type Photo = { src: string; w: number; h: number; title: string; alt: string; cat: Cat };

const catLabel: Record<Cat, string> = {
  showers: "Shower Regrouting",
  floors: "Shower Floors",
  bathrooms: "Bathrooms",
  bases: "Shower Bases",
};

const photos: Photo[] = [
  { src: "/white-wall-beige-envelope-shower-regrouting-after.webp", w: 1200, h: 1600, title: "White Shower With a Beige Envelope Cut Floor", alt: "Shower regrouting finished in a white tiled shower with a beige envelope cut floor and fresh silicone in a Melbourne home", cat: "showers" },
  { src: "/double-shower-niche-linear-drain-regrouting-after.webp", w: 1200, h: 1600, title: "Double Shower With a Wall Niche", alt: "Double shower after regrouting and resealing with twin mixers, a recessed wall niche and a linear drain", cat: "showers" },
  { src: "/dark-grey-glossy-shower-regrouting-after.webp", w: 1600, h: 1200, title: "Dark Grey Gloss Tiles, Full Shower", alt: "Dark grey gloss tiles after shower regrouting, cross handle taps and an envelope cut floor in Melbourne", cat: "showers" },
  { src: "/mosaic-strip-niche-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Mosaic Strip With a Tiled Niche", alt: "Beige tiled shower after regrouting with a dark mosaic feature strip, a matching niche and a linear drain", cat: "showers" },
  { src: "/white-kitkat-brown-feature-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Kitkat Tiles With a Brown Feature Wall", alt: "White kitkat wall tiles and a dark brown feature wall after shower regrouting in a Melbourne bathroom", cat: "showers" },
  { src: "/grey-stone-look-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Grey Stone Look Shower From Above", alt: "Grey stone look tiles after shower regrouting, top view showing the wall niche strip and tile insert waste", cat: "showers" },
  { src: "/white-panel-bench-shower-linear-drain-after.webp", w: 1600, h: 1200, title: "White Panel Shower With a Bench", alt: "White panel walk in shower after resealing with a built in bench seat and a long linear drain", cat: "showers" },
  { src: "/walk-in-rain-shower-linear-drain-regrouting-after.webp", w: 1200, h: 1600, title: "Rain Shower in a Walk In Ensuite", alt: "Rain shower and handheld rail in a walk in ensuite after shower regrouting and resealing", cat: "showers" },
  { src: "/white-subway-wall-beige-shower-floor-regrouting-after.webp", w: 1600, h: 1200, title: "Subway Wall Tiles With a Beige Floor", alt: "White subway wall tiles and a beige stone floor after shower regrouting and resealing in Melbourne", cat: "showers" },
  { src: "/white-tile-rain-shower-niche-regrouting-after.webp", w: 1200, h: 1600, title: "Rain Head Shower With a Niche", alt: "White tiled shower after regrouting with an overhead rain head, a recessed niche and a chrome mixer", cat: "showers" },
  { src: "/white-kitkat-brown-feature-shower-regrouting-after-angle.webp", w: 1200, h: 1600, title: "Kitkat Shower, Angled View", alt: "Angled view of a regrouted shower with white kitkat tiles, a brown feature wall and a chrome shelf", cat: "showers" },
  { src: "/grey-stone-black-mixer-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Grey Stone Tiles With a Black Mixer", alt: "Grey stone look shower wall after regrouting with a matte black mixer and matching floor tiles", cat: "showers" },
  { src: "/grey-stone-look-shower-corner-regrouting-after.webp", w: 1200, h: 1600, title: "Grey Stone Look Corner and Floor", alt: "Grey stone look shower corner after regrouting, wall and envelope cut floor with clean white grout lines", cat: "showers" },
  { src: "/white-wall-corner-shower-grey-floor-after.webp", w: 1200, h: 1600, title: "Corner Shower With a Grey Floor", alt: "Corner shower with white wall tiles and a grey tiled floor after regrouting, wide bathroom view", cat: "showers" },
  { src: "/white-wall-corner-shower-regrouting-after.webp", w: 1200, h: 1600, title: "White Corner Shower, Close View", alt: "White tiled corner shower after regrouting and resealing with chrome cross taps and a grey floor", cat: "showers" },
  { src: "/dark-grey-glossy-shower-regrouting-after-corner.webp", w: 1200, h: 1600, title: "Dark Grey Shower Corner", alt: "Corner of a dark grey gloss tiled shower after regrouting and resealing, floor and walls", cat: "showers" },
  { src: "/dark-grey-glossy-shower-wall-regrouting-after.webp", w: 1200, h: 1600, title: "Dark Grey Feature Wall With Cross Taps", alt: "Dark grey gloss shower wall after regrouting with chrome cross taps and bright white grout lines", cat: "showers" },
  { src: "/white-kitkat-shower-corner-regrouting-after.webp", w: 1200, h: 1600, title: "Kitkat Tile Shower Corner", alt: "Shower corner with white kitkat tiles after regrouting and fresh silicone along every joint", cat: "showers" },
  { src: "/double-shower-niche-linear-drain-regrouting-after-wide.webp", w: 1200, h: 1600, title: "Double Shower, Full Bathroom View", alt: "Double shower with a tiled niche and linear drain after regrouting, seen from the bathroom doorway", cat: "showers" },
  { src: "/walk-in-shower-linear-drain-regrouting-after.webp", w: 1200, h: 1600, title: "Walk In Shower With a Linear Drain", alt: "Walk in shower after regrouting with a stainless linear drain and large format beige floor tiles", cat: "showers" },
  { src: "/brown-floor-white-wall-shower-regrouting-after.webp", w: 1600, h: 1200, title: "Brown Floor With White Walls", alt: "Shower with a deep brown tiled floor and white wall tiles after regrouting and resealing", cat: "showers" },
  { src: "/speckled-stone-shower-floor-regrouting-after-wide.webp", w: 1200, h: 1600, title: "Speckled Stone Shower Floor From Above", alt: "Speckled stone look shower floor after regrouting and resealing, viewed from above with the glass screen beside it", cat: "floors" },
  { src: "/speckled-stone-shower-floor-regrouting-after-closeup.webp", w: 1600, h: 1200, title: "Envelope Cut Floor Around the Waste", alt: "Close view of an envelope cut shower floor after regrouting, with clean grout lines falling to the centre waste", cat: "floors" },
  { src: "/dark-grey-glossy-shower-regrouting-after-floor.webp", w: 1600, h: 1200, title: "Dark Grey Envelope Cut Floor", alt: "Dark grey envelope cut shower floor after regrouting, grout lines falling to a square tile insert waste", cat: "floors" },
  { src: "/grey-stone-shower-floor-regrouting-after.webp", w: 1200, h: 1600, title: "Grey Stone Floor, Top View", alt: "Grey stone look shower floor after regrouting viewed from above, envelope cuts falling to the smart waste", cat: "floors" },
  { src: "/mosaic-strip-linear-drain-shower-after.webp", w: 1200, h: 1600, title: "Mosaic Strip Meeting the Linear Drain", alt: "Dark mosaic feature strip running through the wall and floor to a stainless linear drain after regrouting", cat: "floors" },
  { src: "/brown-shower-floor-regrouting-after-top-view.webp", w: 1200, h: 1600, title: "Brown Shower Floor From Above", alt: "Deep brown shower floor after regrouting viewed from above, tile insert waste and white wall tiles around it", cat: "floors" },
  { src: "/bathroom-floor-and-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Full Bathroom Floor and Shower", alt: "Bathroom floor tiles and the shower at the far end after regrouting throughout a Melbourne home", cat: "bathrooms" },
  { src: "/acrylic-shower-base-sea-border-bathroom-after.webp", w: 1200, h: 1600, title: "Sea Border Bathroom, Wide View", alt: "Wide view of a bathroom after regrouting and resealing, white wall tiles with a sea border and an acrylic shower base", cat: "bathrooms" },
  { src: "/white-subway-sea-border-bath-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Shower Over Bath With a Sea Border", alt: "Shower over a bath after regrouting, white subway tiles with a blue sea themed border strip and chrome cross taps", cat: "bathrooms" },
  { src: "/white-panel-bench-shower-regrouting-after-wide.webp", w: 1600, h: 1200, title: "White Panel Shower, Wide Bathroom View", alt: "Wide view of a white panel shower and bench after resealing, glass screen and heated towel rail beside it", cat: "bathrooms" },
  { src: "/acrylic-shower-base-sea-border-regrouting-after.webp", w: 1200, h: 1600, title: "Acrylic Base With Sea Border Walls", alt: "Acrylic shower base and white tiled walls with a sea themed border after regrouting and resealing", cat: "bases" },
  { src: "/acrylic-shower-base-recaulking-after-top-view.webp", w: 1200, h: 1600, title: "Acrylic Base From Above", alt: "Acrylic shower base after recaulking viewed from above, glossy white finish with clean sealed edges", cat: "bases" },
  { src: "/acrylic-shower-base-sea-border-regrouting-after-angle.webp", w: 1200, h: 1600, title: "Acrylic Base, Corner Angle", alt: "Acrylic shower base after recaulking, corner angle showing fresh white silicone against the wall tiles", cat: "bases" },
  { src: "/beige-tile-acrylic-base-shower-regrouting-after.webp", w: 1200, h: 1600, title: "Beige Tiles Over an Acrylic Base", alt: "Beige wall tiles and an acrylic shower base after regrouting and resealing, straight on view", cat: "bases" },
  { src: "/beige-tile-acrylic-base-shower-after-angle.webp", w: 1200, h: 1600, title: "Beige Tiles and Base, Angled View", alt: "Angled view of beige wall tiles meeting an acrylic shower base after resealing, mirror and vanity beside it", cat: "bases" },
];

const faqs: Array<{ q: string; a: ReactNode; plain: string }> = [
  {
    q: "Are these photos from real Groutix jobs?",
    a: "Yes. Every photo in this gallery is from a real Groutix job in a Melbourne home, taken after the regrouting and resealing was finished. No stock photos and no renders.",
    plain: "Yes. Every photo in this gallery is from a real Groutix job in a Melbourne home, taken after the regrouting and resealing was finished. No stock photos and no renders.",
  },
  {
    q: "Can my shower look like these results?",
    a: "In most cases, yes, if your tiles are solid and the waterproof membrane underneath is intact. We inspect first and tell you honestly if regrouting will work, or if the shower needs more. The quote is free.",
    plain: "In most cases, yes, if your tiles are solid and the waterproof membrane underneath is intact. We inspect first and tell you honestly if regrouting will work, or if the shower needs more. The quote is free.",
  },
  {
    q: "Do you regrout bathrooms and shower bases as well as showers?",
    a: "Yes. We regrout and reseal showers, bathrooms, acrylic shower bases, balconies, laundries and other tiled wet areas across Melbourne.",
    plain: "Yes. We regrout and reseal showers, bathrooms, acrylic shower bases, balconies, laundries and other tiled wet areas across Melbourne.",
  },
  {
    q: "How do I get a quote for my shower or bathroom?",
    a: <>Use the <Link className={inlineLink} href="/#quote-form">quote form</Link> or call us. Adding photos of your shower helps us assess the grout, silicone and tiles before we quote, and photos are required on the form for exactly that reason.</>,
    plain: "Use the quote form on our homepage or call us. Adding photos of your shower helps us assess the grout, silicone and tiles before we quote.",
  },
];

const googleReviewsUrl = "https://www.google.com/maps/place/Groutix";

/* ───────────── Page ───────────── */
export default function GalleryPage({ reviews, rating }: { reviews: Review[]; rating: BusinessRating }) {
  const { phone, tel } = useContact();
  const [cat, setCat] = useState<"all" | Cat>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const visible = cat === "all" ? photos : photos.filter((p) => p.cat === cat);
  const counts: Record<string, number> = {
    all: photos.length,
    showers: photos.filter((p) => p.cat === "showers").length,
    floors: photos.filter((p) => p.cat === "floors").length,
    bathrooms: photos.filter((p) => p.cat === "bathrooms").length,
    bases: photos.filter((p) => p.cat === "bases").length,
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
    name: "Groutix Regrouting Gallery, Real Melbourne Job Photos",
    description: "Finished Groutix regrouting results from Melbourne homes: showers, bathrooms and shower bases photographed after regrouting and resealing.",
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
    { key: "floors", label: "Floors" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "bases", label: "Shower Bases" },
  ];

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

        {/* HERO — dark immersive band */}
        <section className="relative overflow-hidden bg-[#06124F] pb-12 pt-[140px] md:pb-16 lg:pt-[160px]">
          <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#2F63CC]/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FBBC04]/15 blur-3xl" aria-hidden="true" />
          <div className={`${wrap} relative text-center`}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#FBBC04] backdrop-blur">
              Groutix Gallery · Melbourne
            </span>
            <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(30px,6vw,52px)] font-black leading-[1.08] tracking-tight text-white">
              Real Shower Regrouting Results in Melbourne
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#D6DCF5] sm:text-lg">
              Every photo below is a finished Groutix job in a real Melbourne home, photographed after regrouting and resealing. No stock photos, no renders. Tap any photo to see it full screen.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">{photos.length} finished job photos</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">Showers, bathrooms and bases</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">10 year warranty on eligible work</span>
            </div>
          </div>
        </section>

        {/* PHOTO GALLERY */}
        <section id="gallery" className="scroll-mt-28 bg-[#F6F8FC] pb-14 pt-10 md:pb-20 md:pt-12">
          <div className={wrap}>
            <div className="mb-9 flex flex-wrap justify-center gap-2.5" role="group" aria-label="Filter gallery photos">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setCat(c.key); setLightbox(null); setHover(null); }}
                  aria-pressed={cat === c.key}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    cat === c.key
                      ? "bg-[#FBBC04] text-[#06124F] shadow-[0_8px_20px_rgba(251,188,4,0.35)] ring-1 ring-[#FBBC04]"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:text-[#001F97] hover:ring-[#2F63CC]/50"
                  }`}
                >
                  {c.label} <span className={cat === c.key ? "text-[#001F97]/70" : "text-slate-400"}>({counts[c.key]})</span>
                </button>
              ))}
            </div>

            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {visible.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => { setHover(null); setLightbox(i); }}
                  onMouseEnter={() => { if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) setHover(i); }}
                  onMouseLeave={() => setHover(null)}
                  className="group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-[22px] bg-slate-200 text-left shadow-[0_2px_10px_rgba(6,18,79,0.06)] ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(6,18,79,0.20)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2F63CC]/40"
                  aria-label={`View photo: ${p.title}`}
                >
                  <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {catLabel[p.cat]}
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#04060F]/85 via-[#04060F]/30 to-transparent px-4 pb-3.5 pt-14">
                    <span className="block pr-10 text-[15px] font-bold leading-snug text-white">{p.title}</span>
                  </span>
                  <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100" aria-hidden="true">
                    <Maximize2 className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[15px] leading-relaxed text-slate-500">
              More finished jobs are added as new work is completed. Want your shower or bathroom assessed?{" "}
              <Link className={inlineLink} href="/#quote-form">Get a free quote</Link>, and add photos of your tiles so we can quote accurately.
            </p>
          </div>
        </section>

        {/* REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we have helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">
              Read More Verified Reviews on Google <span className="font-extrabold text-[#FBBC04]">→</span>
            </a>
          </div>
          <div className={`${box} mt-8 flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center`}>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Have a shower or bathroom that needs attention?</h3>
              <p className="mt-1 text-base text-slate-600">Tell us what is happening and we will help you understand the right next step.</p>
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
            <div className="grid grid-cols-1 items-center gap-7 rounded-[28px] bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-[52px]">
              <div>
                <h2 className={`${h2} text-white`}>Want Results Like These?</h2>
                <p className="mt-3 text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
                <p className="mt-1 text-[#D6DCF5]">Free quote · Tiles stay in place · 10 year waterproof warranty</p>
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

      {/* HOVER QUICK VIEW — desktop only: full size preview while hovering a card (click or tap still opens the lightbox) */}
      {hover !== null && visible[hover] ? (
        <div className="pointer-events-none fixed inset-0 z-[70] hidden items-center justify-center bg-[#04060F]/80 p-8 backdrop-blur-[2px] [@media(hover:hover)]:flex" aria-hidden="true">
          <figure className="m-0 text-center">
            <Image
              src={visible[hover].src}
              alt=""
              width={visible[hover].w}
              height={visible[hover].h}
              sizes="92vw"
              className="mx-auto max-h-[82vh] w-auto max-w-[92vw] rounded-2xl object-contain shadow-[0_30px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/20"
            />
            <figcaption className="mt-3 text-sm font-bold text-white">{visible[hover].title}</figcaption>
          </figure>
        </div>
      ) : null}

      {/* LIGHTBOX */}
      {lightbox !== null && visible[lightbox] ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#04060F]/[0.985] p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label={`Photo: ${visible[lightbox].title}`}>
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pb-4 text-white">
            <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold tabular-nums text-white/85 ring-1 ring-white/15 backdrop-blur">{lightbox + 1} / {visible.length}</span>
            <button type="button" onClick={close} aria-label="Close photo viewer" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20">
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
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
            />
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20 sm:-left-2">
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20 sm:-right-2">
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mx-auto w-full max-w-5xl pt-4 text-center">
            <p className="text-base font-bold text-white">{visible[lightbox].title}</p>
            <span className="mt-2 inline-block rounded-full bg-[#FBBC04] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#06124F]">{catLabel[visible[lightbox].cat]}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
