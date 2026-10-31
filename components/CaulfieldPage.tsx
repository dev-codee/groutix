/* CaulfieldPage — v2 service-first build (2026-10-31).
   Batch 3 (inner / south-east) #2: /locations/melbourne/caulfield,
   covering Caulfield North, Caulfield South, Caulfield East and
   Elsternwick (client-confirmed service-area doc #7).
   GATE NOTE: "caulfield" is NOT yet in the gate list
   (lib/locationRoutes.ts) — this pack carries a one-line
   locationRoutes fix for it (parent handles it). The four
   sub-slugs (caulfield-north, caulfield-south, caulfield-east,
   elsternwick) have no live route of their own either — covered
   as sections here, never linked.
   GSC 29 Jul–30 Oct 2026: query "balcony regrouting caulfield"
   172 impr at pos 29.1 — balcony demand is the known signal
   here, so the balcony section and first FAQ carry weight.
   Route title: "Regrouting Caulfield | Shower, Tile & Balcony | Groutix"
   Meta description: "Shower, bathroom and balcony regrouting in
   Caulfield, Caulfield North and Elsternwick. No tile removal,
   ${reviewsText}. Free quote."
   Pattern v2 (hero photo + seal, image bands, services strip,
   mid CTA) on the Albert Park v3 / Malvern pattern per Edeel:
   - Hero: homepage hero photo (dark shower floor regrouting)
     with dark gradient overlay, QuoteFormV2 with
     defaultService="Shower Regrouting", HeroContactBadges CTAs,
     warranty seal row, pt-[140px] lg:pt-[160px].
   - Copy: direct-answer / service-first, unique angle
     (established family and period homes around Caulfield Park,
     apartment balconies, ensuites over living areas).
   - No invented stats, jobs, reviews or prices. Rating badges use
     the live useGoogleRating() hook.
   Drop-in: add components/CaulfieldPage.tsx on the main branch
   + the route edits in app/locations/melbourne/[suburb]/page.tsx
   + the locationRoutes gate fix (see notes file). NO redirects
   confirmed for Caulfield. */

"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone, Star, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import { useGoogleRating } from "@/components/useGoogleRating";
import type { Review, BusinessRating } from "@/lib/reviews";

/* ─── FAQ accordion item (matches site pattern) ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <li className="list-none">
      <details className="group rounded-sm border border-neutral-200 bg-white open:border-accent/50">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-neutral-900 text-base leading-snug">{q}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180 group-open:text-accent" />
        </summary>
        <p className="border-t border-neutral-100 px-5 pb-4 pt-3 text-base leading-relaxed text-neutral-600">{a}</p>
      </details>
    </li>
  );
}

const FAQS = [
  {
    q: "Our balcony grout has failed and water is getting in. Can regrouting fix it?",
    a: "In most Caulfield homes and apartments, yes — balcony leaks usually start at the door sill and the perimeter joints, where grout and silicone fail first. We cut out the failed joints, reseal and regrout with outdoor-grade grout. If the membrane underneath has failed, we'll tell you straight before quoting anything.",
  },
  {
    q: "There's a stain on the ceiling below our upstairs bathroom. Is it the shower?",
    a: "Very often, yes — in two-storey Caulfield homes the upstairs shower or ensuite is the first suspect when a downstairs ceiling stains. Failed grout and silicone let water through slowly for months before the mark shows. We find where it's escaping and fix the grout and seals; if it's plumbing or a failed membrane, we'll say so.",
  },
  {
    q: "Can you regrout around period tiles without damaging them?",
    a: "Yes — many Caulfield homes carry period and older tiling worth keeping. We work joint by joint with hand care, cut the failed grout out and rebuild it to proper depth, so the original tiling survives. Tiles are only disturbed if one is already loose.",
  },
  {
    q: "Do you cover Caulfield North, Caulfield South and Elsternwick too?",
    a: "Yes — the whole doc area: Caulfield, Caulfield North, Caulfield South, Caulfield East and Elsternwick.",
  },
  {
    q: "Can you do the ensuite, main bathroom and laundry in one visit?",
    a: "Yes — most family homes in this area have the full set, and doing them together gives a matching finish across the house and saves a second call-out.",
  },
  {
    q: "Should I choose epoxy or cement grout?",
    a: "Epoxy grout resists water and staining far better than cement grout and never needs sealing — ideal for busy family showers. Cement grout with a penetrating sealer is the standard option and costs less. We'll tell you which suits each room when we quote.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/caulfield#service",
      name: "Shower, tile and balcony regrouting in Caulfield",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Caulfield VIC 3162" },
        { "@type": "Place", name: "Caulfield North VIC 3161" },
        { "@type": "Place", name: "Caulfield South VIC 3162" },
        { "@type": "Place", name: "Caulfield East VIC 3162" },
        { "@type": "Place", name: "Elsternwick VIC 3185" },
      ],
      url: "https://groutix.com/locations/melbourne/caulfield",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Caulfield", item: "https://groutix.com/locations/melbourne/caulfield" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function CaulfieldPage({
  reviews,
  rating,
}: {
  reviews: Review[];
  rating: BusinessRating;
}) {
  const gr = useGoogleRating();
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="public-page">
        {/* ═════════ 1. HERO — homepage photo hero pattern (v2) ═════════ */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className="relative mx-auto grid w-full max-w-[1460px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Caulfield 3162</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Caulfield: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower grout gone dark in Caulfield? Balcony joints letting water in? We regrout showers, bathrooms and balconies across Caulfield, Caulfield North, Caulfield South and Elsternwick — tiles stay in place. That&apos;s regrouting in Caulfield, backed by a 10-year waterproof warranty on showers. Free quote.
              </p>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges rating={rating} />
              </div>
              <div className="flex items-center justify-center gap-3.5 border-t border-white/20 pt-6 text-left lg:justify-start">
                <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} className="h-[84px] w-[88px] shrink-0 object-contain" />
                <div><b className="block text-lg font-black leading-tight">10-Year Waterproof Warranty</b><span className="text-sm text-white/80">On every complete shower regrout</span></div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[560px] lg:max-w-none lg:self-start">
              <QuoteFormV2 defaultService="Shower Regrouting" />
            </div>
          </div>
        </section>

        {/* ═════════ 2. STATS STRIP ═════════ */}
        <AnimatedSection className="bg-white py-12 lg:py-16">
          <div className="mx-auto grid max-w-[1460px] grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-10">
            {[
              { value: `${gr.ratingLabel}/5`, stars: true, label: "Google Rating", sub: `From ${gr.countLabel} Google reviews` },
              { value: "10 Year", stars: false, label: "Waterproof Warranty", sub: "On eligible completed shower regrouting" },
              { value: "No Tile", stars: false, label: "Removal", sub: "On most regrouting jobs" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center"
              >
                <p className="text-3xl font-black leading-none text-neutral-900">{s.value}</p>
                {s.stars && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />
                    ))}
                  </div>
                )}
                <p className="text-base font-bold text-neutral-900">{s.label}</p>
                <p className="text-sm text-neutral-500">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ═════════ 3. LOCAL INTRO — direct answer ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for Caulfield&apos;s Family and Period Homes
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Caulfield is established family territory — period homes and solid brick houses around Caulfield Park, plus apartment blocks whose balconies cop the weather from every direction. The bathrooms in these homes are mostly sound; it&apos;s the grout and silicone between the tiles that gives up first. Regrouting replaces the joints and keeps the tiles, which is exactly what most of them need.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our grouting repairs in Caulfield start with the joints, not the tiles: we cut out the failed grout joint by joint and rebuild it to proper depth. You can see exactly how a job runs on{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                page — in a period home near the park or an apartment on Hawthorn Road, the method is the same.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3161–3185", label: "Postcodes Covered", sub: "Caulfield North to Elsternwick" },
                { value: "Period", label: "Tiles Kept", sub: "Older tiling regrouted in place" },
                { value: "1 Visit", label: "Shower, Bathroom & Balcony", sub: "Matching finish, no second call-out" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
                  <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                  <p className="mt-2 text-sm font-bold text-neutral-900">{s.label}</p>
                  <p className="text-[13px] text-neutral-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 4. SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in Caulfield
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it — and the old silicone — in one visit, tiles left in place. Family bathrooms in this area get used hard, so we regrout shower, floor and walls together for a matching finish that stands up to daily use.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted over.",
                    "Shower, floor and wall grout done together if you want a matching finish.",
                    "Old silicone stripped and replaced, not layered over.",
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link>.</>,
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-base text-neutral-700">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{i + 1}</span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="text-center">
                <Link
                  href="/shower-regrouting"
                  className="inline-block bg-primary px-6 py-3 text-base font-bold text-white rounded-sm transition-colors hover:bg-primary-hover active:scale-95"
                >
                  See Our Shower Regrouting Process
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 5. IMAGE BAND A (v2) ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/walk-in-shower-regrouting-wide-view.webp" alt="Shower regrouting in Caulfield by Groutix — walk-in shower with freshly regrouted tiles and sealed edges" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">The finish we aim for in every Caulfield home: clean joints, sealed edges, tiles untouched.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/tile-regrouting-dark-floor-tiles-close-up.webp" alt="Tile regrouting in Caulfield — dark floor tiles with failed grout replaced joint by joint" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Up close, floor grout tells the story — cracked and recessed joints are where water starts getting under the tiles.</figcaption>
              </figure>
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-base text-neutral-600">
              See more of our work in the{" "}
              <Link href="/gallery" className="font-bold text-accent hover:underline">gallery</Link>
              , and how a job runs on{" "}
              <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
              page.
            </p>
          </div>
        </section>

        {/* ═════════ 6. FLOORS, LAUNDRIES, KITCHENS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Kitchens
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Floor grout wears fastest in the rooms you use most. Tile regrouting in Caulfield covers bathroom floors, laundries and kitchen splashbacks right through the house — cut out and replaced, without retiling.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Bathroom Floors", text: "Tired, stained floor grout cut out and replaced so the whole room matches." },
                { title: "Laundries", text: "Floors and splashbacks that take water every day, regrouted to last." },
                { title: "Kitchen Splashbacks", text: "Stained or cracked grout behind the sink and cooktop refreshed." },
                { title: "A Few Cracked Tiles", text: "Two or three cracked tiles replaced and regrouted, matched as closely as we can." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              More on{" "}
              <Link href="/tile-regrouting" className="font-bold text-accent hover:underline">tile regrouting</Link>{" "}
              and{" "}
              <Link href="/small-tiling-jobs" className="font-bold text-accent hover:underline">small tiling jobs</Link>.
            </p>
            <div className="text-center">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Get a Free Floor Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 7. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Caulfield
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In Caulfield&apos;s two-storey homes, a leaking upstairs shower usually announces itself downstairs first: a stain spreading on the ceiling, paint bubbling, plaster going soft. We find where the water is escaping, fix the grout and seals — and tell you straight if it&apos;s a membrane or plumbing problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Ceiling Stain Below", text: "A stain or bubbling paint on the ceiling under the bathroom." },
                { title: "Damp Wall", text: "A wall that stays damp or smells musty beside the shower." },
                { title: "Swollen Skirting", text: "Skirting or door frames swelling near the bathroom." },
                { title: "Cracked Base Grout", text: "Gaps where the shower floor meets the walls." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-white p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">How We Tell Grout From Membrane</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                We check the grout, silicone and tiles for cracks, gaps and movement before we quote. If the waterproofing under the tiles has failed, regrouting alone won&apos;t fix it — and we&apos;ll say so. Under NCC 2022, shower walls must be waterproofed to at least 1,800 mm. More on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 8. BALCONIES, ALFRESCOS, OUTDOOR ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balconies, Alfrescos and Outdoor Tiles
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Caulfield&apos;s apartment balconies and home terraces sit over living spaces, and sun, wind and movement work their joints hard — the grout and silicone at the door sill and edges are usually the first to fail. Balcony regrouting in Caulfield fixes failed joints before tiles loosen and water gets underneath.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Balconies", text: "Failed grout and silicone at the door sill and edges cut out, resealed and regrouted with outdoor-grade grout." },
                { title: "Alfresco Areas", text: "Washed-out or cracked joints regrouted so outdoor tiles stop rocking and water stays out." },
                { title: "Porches and Entries", text: "The odd loose tile re-fixed and joints regrouted where suitable — we tell you if it needs relaying." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              Relaying a whole balcony is a bigger job — we&apos;ll tell you if yours needs it. More on{" "}
              <Link href="/balcony-leak-repairs" className="font-bold text-accent hover:underline">balcony leak repairs</Link>.
            </p>
            <div className="text-center">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Get a Free Balcony Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 9. IMAGE BAND B (v2) ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <figure>
              <div className="relative aspect-[21/9] overflow-hidden rounded-sm">
                <Image src="/balcony-regrouting-tiles.webp" alt="Balcony regrouting in Caulfield — balcony tiles with failed grout cut out and replaced with outdoor-grade grout" fill sizes="100vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-neutral-500">Balcony joints renewed end to end — the standard we work to on Caulfield balconies, before failed grout turns into a leak downstairs.</figcaption>
            </figure>
          </div>
        </section>

        {/* ═════════ 10. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Caulfield
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Caulfield 3162 plus Caulfield North, Caulfield South, Caulfield East and Elsternwick. One page, one crew, same week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="caulfield-north" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Caulfield North 3161</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Caulfield North</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Period homes and grand older houses near Alma Park — bathrooms where the tiles are a feature and the grout has quietly failed around them. We regrout joint by joint so the original work survives.
                </p>
              </div>
              <div id="caulfield-south" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Caulfield South 3162</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Caulfield South</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Family homes between the park and Glen Huntly Road — ensuites and main bathrooms at regrout age, done together in a single visit so the finish matches across the house.
                </p>
              </div>
              <div id="caulfield-east" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Caulfield East 3162</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Caulfield East</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  A mix of homes and apartments around the racecourse and the station — hard-used bathrooms refreshed with a regrout and reseal, and balcony joints fixed before they leak.
                </p>
              </div>
              <div id="elsternwick" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Elsternwick 3185</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Elsternwick</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Victorian and Edwardian homes off Glen Huntly Road with period bathrooms worth keeping — grout and silicone replaced throughout, leaking showers traced to the joint that failed.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Brighton", href: "/locations/melbourne/brighton" },
                { name: "St Kilda", href: "/locations/melbourne/st-kilda" },
                { name: "Carnegie", href: "/locations/melbourne/carnegie" },
              ].map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-neutral-700 transition-colors hover:border-accent hover:text-accent"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 11. MID CTA (v2) ═════════ */}
        <section className="bg-[#0d1030] py-12">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-2xl font-black leading-tight">
              Get a Free Quote in Caulfield
            </h2>
            <p className="text-base leading-relaxed text-white/85">
              Send a photo of your shower, bathroom or balcony and we&apos;ll come back with a fixed quote — no obligation.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-[#FBBC04] px-8 py-3 text-base font-bold text-neutral-900 transition-transform hover:scale-105"
              >
                Request A Quote
              </Link>
              <a
                href="tel:+61370238094"
                className="inline-flex items-center gap-2 rounded-sm border-[1.5px] border-white/80 px-8 py-3 text-base font-bold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> (03) 7023 8094
              </a>
            </div>
          </div>
        </section>

        {/* ═════════ 12. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why Caulfield Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist — showers, floors, balconies, epoxy and silicone. The crew on your Caulfield job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs — good tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Balcony Leaks Found", text: "Sill and edge joints checked first — the usual culprit over living rooms." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">
                    {c.text}{" "}
                    {c.link && (
                      <Link href={c.link.href} className="font-bold text-accent hover:underline">
                        {c.link.label}
                      </Link>
                    )}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 13. COST (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in Caulfield?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Short answer: we give you a fixed quote once we&apos;ve seen the job — every home is different. These four things decide the number:
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Size", text: "How big the shower, floor or balcony is." },
                { title: "Condition", text: "How far the grout and silicone have failed." },
                { title: "Grout Type", text: "Cement grout with sealer, or epoxy grout." },
                { title: "How Many Rooms", text: "Doing the ensuite, bathroom and laundry together can save a second visit." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6 text-center"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              Shower pricing is on our{" "}
              <Link href="/shower-regrouting" className="font-bold text-accent hover:underline">
                shower regrouting page
              </Link>.
            </p>
            <div className="text-center">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Get a Free Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 14. SERVICES STRIP (v2) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Caulfield
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Shower Regrouting", href: "/shower-regrouting", text: "Failed shower grout and silicone cut out and replaced, tiles left in place." },
                { name: "Leaking Shower Repair", href: "/leaking-shower-repair", text: "We trace where the water is escaping and fix the joints and seals letting it through." },
                { name: "Tile Regrouting", href: "/tile-regrouting", text: "Bathroom floors, laundries and splashbacks regrouted without retiling." },
                { name: "Balcony Leak Repairs", href: "/balcony-leak-repairs", text: "Sill and edge joints resealed and regrouted before water gets underneath." },
                { name: "Epoxy Grout", href: "/epoxy-grout", text: "Waterproof, stain-resistant grout that never needs sealing — made for showers." },
                { name: "Silicone Recaulking", href: "/silicone-recaulking", text: "Old, mouldy silicone stripped out and replaced with a clean, sealed finish." },
                { name: "Small Tiling Jobs", href: "/small-tiling-jobs", text: "A few cracked or loose tiles replaced and regrouted, matched as closely as we can." },
                { name: "Our Process", href: "/our-process", text: "How a Groutix job runs, from first photo to final clean — no surprises." },
              ].map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  className="rounded-sm border border-neutral-200 bg-white p-5 font-bold text-neutral-900 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.name}
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-neutral-600">{s.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 15. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Caulfield Regrouting FAQs
              </h2>
            </div>
            <ul className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </ul>
          </div>
        </AnimatedSection>

        {/* ═════════ 16. FINAL CTA (navy) ═════════ */}
        <section className="bg-[#0d1030] py-16 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[42px]">
              Tired Grout Anywhere in Caulfield or Elsternwick?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting the Caulfield area is what we do — we cover Caulfield, Caulfield North, Caulfield South, Caulfield East and Elsternwick, most jobs done in a single visit.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-[#FBBC04] px-8 py-3 text-base font-bold text-neutral-900 transition-transform hover:scale-105"
              >
                Request A Quote
              </Link>
              <a
                href="tel:+61370238094"
                className="inline-flex items-center gap-2 rounded-sm border-[1.5px] border-white/80 px-8 py-3 text-base font-bold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> (03) 7023 8094
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
