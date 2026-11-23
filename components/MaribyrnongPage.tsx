/* MaribyrnongPage — Phase 1 west build #1 (2026-11-23).
   West region programme, page 1 of 5: /locations/melbourne/maribyrnong.
   GATE: "maribyrnong" IS in lib/locationRoutes.ts — no gate fix needed.
   GSC (live, last 3 months): 2 clicks / 886 impressions / avg pos 33.3.
   Diagnosis: generic template dilution — of 82 queries earning impressions,
   only ONE mentions Maribyrnong (1 imp). The page picks up scattered
   impressions for Bentleigh, Malvern, Caulfield and other suburbs because
   Google cannot tell what it is the specialist for. This custom page gives
   it a real Maribyrnong identity.
   Primary keyword: shower regrouting maribyrnong.
   Secondary: regrouting maribyrnong, tile regrouting maribyrnong,
   grout repair maribyrnong, leaking shower repair maribyrnong.
   Local entities: Maribyrnong River, Edgewater, Highpoint, Raleigh Road,
   postcode 3032, October 2022 flood (hundreds of homes flooded, suburb has
   been repairing and renovating since — Ombudsman VIC + federal inquiry
   submission, public record).
   Pattern: Armadale v2 (hero photo + form, stats strip, local sections,
   areas cards, mid CTA, why, cost, services strip, FAQ, final CTA)
   + homepage elements per Edeel: TrustedMarquee after the hero and a
   Real Work before/after slider section (Ballarat hub BeforeAfter).
   Images: ALL already live in public/ — no uploads in this pack.
   Sliders use the latest before/after pairs built 19–20 Nov 2026
   (walk in shower pair, leaking base pair, balcony pair) per Edeel.
   Rating: fully dynamic via useGoogleRating() — Google reviews passed
   300 in Nov 2026 and the count updates itself; nothing hardcoded.
   No invented jobs, reviews or locations. The only price figure is the
   $550 to $1,500 range already live in the site cost FAQs (Ballarat,
   shower page), mirrored word for word in FAQ 1.
   Route title: "Shower & Balcony Regrouting Maribyrnong | Free Quote"
   (route edits in ROUTE-EDITS.md). */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Star, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import TrustedMarquee from "@/components/TrustedMarquee";
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

/* ─── Before / after drag slider (Ballarat hub pattern) ─── */
function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const layer = (src: string) => (
    <div className="absolute inset-0">
      <Image src={src} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
    </div>
  );
  return (
    <figure className="m-0">
      <div className="relative aspect-square select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:aspect-[4/4.2]">
        <div className="absolute inset-0 overflow-hidden" role="img" aria-label={`${title}, before`}>{layer(before)}</div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} role="img" aria-label={`${title}, after`}>{layer(after)}</div>
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

const REAL_JOBS = [
  { before: "/leaking-shower-hero-before.webp", after: "/leaking-shower-hero-after.webp", title: "Walk in shower, regrouted and resealed" },
  { before: "/leaking-shower-base-leak-before.webp", after: "/leaking-shower-base-resealed-after.webp", title: "Leaking shower base, repaired with epoxy" },
  { before: "/balcony-regrouting-before.webp", after: "/balcony-regrouting-after.webp", title: "Balcony regrouting" },
];

const FAQS = [
  {
    q: "How much does shower regrouting cost in Maribyrnong?",
    a: "Most standard single showers cost about $550 to $1,500 to regrout. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    q: "Can you put new grout over the old grout?",
    a: "No, and it is the shortcut that fails fastest. New grout does not bond properly to old grout, so a thin layer smeared over the top looks fine for a few months, then lifts and cracks along the same lines. We cut the failed grout out to proper depth first, so the new grout has a clean tile edge to grip.",
  },
  {
    q: "Our home was flooded in 2022. Can you still regrout the bathroom?",
    a: "In most cases, yes. The October 2022 flood put hundreds of Maribyrnong homes under water, and plenty of bathrooms here were repaired in a hurry or have carried damp ever since. If the tiles are firm and the wall behind them is sound and dry, regrouting is the right finishing job. If we find soft walls or signs the waterproofing has failed, we will tell you plainly before quoting, because grout alone cannot fix that.",
  },
  {
    q: "Why does the mould in our shower keep coming back?",
    a: "Because mould grows into silicone, not just on it, so no amount of scrubbing cleans it out, and failed grout lets moisture sit in the joint where mould feeds. The lasting fix is to strip the silicone out completely, cut out the failed grout, and rebuild the joints with epoxy grout and fresh silicone. A fan that runs while you shower and a little while after helps it stay away.",
  },
  {
    q: "How long does regrouting last, and when can we use the shower again?",
    a: "A proper epoxy regrout lasts well beyond ten years in a domestic shower and never needs sealing. Silicone is the wear item and usually needs renewing after some years of daily use. After the job, silicone needs 24 hours to cure and epoxy grout needs 4 days to cure fully before heavy use, and we confirm the exact timing for your bathroom before we leave.",
  },
  {
    q: "There is a stain on the ceiling below our ensuite. Could the shower be causing it?",
    a: "It is the first place we look. Plenty of Maribyrnong homes and townhouses run an ensuite over the living areas, and failed grout and silicone let water through slowly, often for months, before a mark shows downstairs. We trace where the water is escaping and repair the joints and seals. If the cause turns out to be plumbing or a failed membrane, we will tell you straight.",
  },
  {
    q: "Should we regrout or retile our older Maribyrnong bathroom?",
    a: "If the tiles are firmly bonded and only the grout and silicone have failed, regrouting is the better spend by a wide margin: the tiles stay, the job is done in a day, and it costs a fraction of a retile. If tiles sound hollow, move under hand pressure, or the wall behind feels soft, that is rebuild territory and we will say so before you spend anything on the surface.",
  },
  {
    q: "Do you cover Maidstone, Braybrook, West Footscray and Footscray as well?",
    a: "Yes. This page covers Maribyrnong 3032, and the same crew works through Maidstone, Braybrook, West Footscray and Footscray, plus the rest of the inner west. One visit can cover the ensuite, the main bathroom and the balcony together, so the finish matches through the house.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/maribyrnong#service",
      name: "Shower, tile and balcony regrouting in Maribyrnong",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Maribyrnong VIC 3032" },
      ],
      url: "https://groutix.com/locations/melbourne/maribyrnong",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Maribyrnong", item: "https://groutix.com/locations/melbourne/maribyrnong" },
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

export default function MaribyrnongPage({
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
        {/* ═════════ 1. HERO — homepage photo hero pattern ═════════ */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/leaking-shower-hero-after.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className="relative mx-auto grid w-full max-w-[1460px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Maribyrnong 3032</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Maribyrnong: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower grout gone dark in a Maribyrnong home? Mould that keeps coming back, or a stain spreading across the ceiling below the ensuite? We regrout showers, bathrooms and balconies across Maribyrnong, from the river streets at Edgewater to the blocks near Highpoint, and the tiles stay in place. Waterproof epoxy grout, most jobs done in a single visit, and a 10 year waterproof warranty on complete shower regrouts. Free quote.
              </p>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges rating={rating} />
              </div>
              <div className="flex items-center justify-center gap-3.5 border-t border-white/20 pt-6 text-left lg:justify-start">
                <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} className="h-[84px] w-[88px] shrink-0 object-contain" />
                <div><b className="block text-lg font-black leading-tight">10 Year Waterproof Warranty</b><span className="text-sm text-white/80">On every complete shower regrout</span></div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[560px] lg:max-w-none lg:self-start">
              <QuoteFormV2 defaultService="Shower Regrouting" />
            </div>
          </div>
        </section>

        <TrustedMarquee />

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
                Regrouting for Maribyrnong Homes, From the River Streets to Highpoint
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Maribyrnong wraps around its river: older brick and weatherboard homes on the streets running down to the water, post war brick further out, the townhouses of Edgewater, and apartments stacked up around Highpoint. The tiles in most of these bathrooms are still sound. What gives up is the grout and silicone between them, and replacing the joints is usually all the room needs.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                This suburb also carries the October 2022 flood in its walls. Hundreds of homes went under when the Maribyrnong River burst its banks, and the years since have been one long repair job. Bathrooms that took on damp, or were put back together in a hurry, often show it first in the grout: joints crumbling early, mould that will not stay away, silicone splitting at the corners. A proper regrout, cut out and rebuilt with epoxy, is usually the finishing job those bathrooms still need.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our grouting repairs in Maribyrnong start with the joints, not the tiles: the failed grout is cut out joint by joint and rebuilt to proper depth. You can see exactly how a job runs on{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                page. A riverside cottage and a Highpoint apartment get the same method.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3032", label: "Postcode Covered", sub: "Edgewater to the Highpoint blocks" },
                { value: "Flood", label: "Recovery Bathrooms", sub: "Wet areas checked joint by joint" },
                { value: "1 Visit", label: "Ensuite, Bathroom & Balcony", sub: "Matching finish, no second call out" },
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
                Shower Regrouting in Maribyrnong
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Shower grout gone crumbly, stained or black with mould? A shower regrout replaces the grout and the old silicone in one visit, with the tiles left exactly where they are. In Maribyrnong ensuites and family bathrooms we regrout the shower, floor and walls together, so the whole room comes up with one clean, matching finish.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, never smeared over.",
                    "Shower, floor and wall grout done together if you want one matching finish.",
                    "Old silicone stripped out and replaced, never layered over.",
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

        {/* ═════════ 5. REAL WORK — latest before/after pairs ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Real Work</p>
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Before and After: Real Regrouting Results
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Real Groutix jobs in Melbourne homes, not stock photos. Drag the slider to see the after. This is the standard we bring to every Maribyrnong bathroom.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {REAL_JOBS.map((j) => <BeforeAfter key={j.title} before={j.before} after={j.after} title={j.title} />)}
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              See more of our work in the{" "}
              <Link href="/gallery" className="font-bold text-accent hover:underline">gallery</Link>
              , and how a job runs on{" "}
              <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
              page.
            </p>
          </div>
        </AnimatedSection>

        {/* ═════════ 6. IMAGE BAND A ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/walk-in-shower-regrouting-wide-view.webp" alt="Shower regrouting in Maribyrnong by Groutix, a wide shower with freshly regrouted tiles and sealed edges" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">The finish we work to in every Maribyrnong bathroom: clean joints, sealed edges, original tiles untouched.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/tile-regrouting-dark-floor-tiles-close-up.webp" alt="Tile regrouting in Maribyrnong, dark floor tiles with worn grout replaced joint by joint" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Floor grout up close: cracked and sunken joints are the first path for water to get under the tiles.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ═════════ 7. FLOORS, LAUNDRIES, KITCHENS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Kitchens
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                The shower is not the only place grout gives up. Tile regrouting in Maribyrnong covers bathroom floors, laundries and kitchen splashbacks through the house, cut out and replaced without retiling. Laundries in the older homes here sit against outside walls and cop every wet day of the year, and their joints usually fail first.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Bathroom Floors", text: "Dark, tired floor grout cut out and replaced so the room matches the shower again." },
                { title: "Laundries", text: "Floors and splashbacks that see water daily, regrouted and resealed to last." },
                { title: "Kitchen Splashbacks", text: "Stained or cracked grout behind the sink and cooktop, refreshed joint by joint." },
                { title: "A Few Cracked Tiles", text: "One or two cracked tiles replaced and regrouted, matched as closely as we can." },
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

        {/* ═════════ 8. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Maribyrnong
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Many Maribyrnong homes and townhouses carry an ensuite upstairs, over the living areas below. When its grout and silicone fail, the first sign is often downstairs: a stain spreading across the ceiling, paint starting to bubble, plaster going soft. We find where the water is getting out and fix the joints and seals, and we will tell you straight if the problem is a membrane or plumbing instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Ceiling Stain Below", text: "A stain or bubbling paint on the ceiling under an upstairs bathroom." },
                { title: "Damp Wall", text: "A wall beside the shower that stays damp or smells musty." },
                { title: "Swollen Skirting", text: "Skirting boards or door frames swelling near the bathroom." },
                { title: "Cracked Base Grout", text: "Gaps opening where the shower floor meets the walls." },
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
                Before we quote, we check the grout, silicone and tiles for cracks, gaps and movement. If the waterproofing under the tiles has failed, regrouting on its own will not fix the leak, and we will say so. NCC 2022 asks for shower walls to be waterproofed to at least 1,800 mm high. More on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>
                , and in our guides to a{" "}
                <Link href="/guides/shower-still-leaking-after-regrouting" className="font-bold text-accent hover:underline">shower still leaking after regrouting</Link>{" "}
                and a{" "}
                <Link href="/guides/shower-leaking-into-ceiling-below" className="font-bold text-accent hover:underline">shower leaking into the ceiling below</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 9. BALCONIES ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balcony Regrouting in Maribyrnong
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Balconies here face the river weather head on, and many sit over living rooms and garages. Sun, rain and building movement work their joints hard, and the grout and silicone at the door sill and the edges are usually the first to fail. Balcony regrouting in Maribyrnong renews those joints before tiles loosen and water starts tracking inside.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Balconies", text: "Failed grout and silicone at the sill and edges cut out, resealed and regrouted with outdoor grade grout." },
                { title: "Terraces and Courtyards", text: "Washed out or cracked joints regrouted so outdoor tiles sit firm and water stays on top." },
                { title: "Apartment Balconies", text: "Edgewater and Highpoint side blocks, where a leaking balcony usually shows up as a damp wall inside the unit below the sill line." },
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
              Not sure if yours is a refresh or a leak? Start with{" "}
              <Link href="/balcony-regrouting" className="font-bold text-accent hover:underline">balcony regrouting</Link>{" "}
              for failed joints, or{" "}
              <Link href="/balcony-leak-repairs" className="font-bold text-accent hover:underline">balcony leak repairs</Link>{" "}
              if water is already getting in. Relaying a whole balcony is a bigger job, and we will tell you if yours needs it.
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

        {/* ═════════ 10. IMAGE BAND B ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <figure>
              <div className="relative aspect-[21/9] overflow-hidden rounded-sm">
                <Image src="/balcony-regrouting-tiles.webp" alt="Balcony regrouting in Maribyrnong, balcony tiles with failed grout cut out and replaced with outdoor grade grout" fill sizes="100vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-neutral-500">Balcony joints renewed from sill to edge, the standard we work to on Maribyrnong balconies before failed grout becomes a leak in the room below.</figcaption>
            </figure>
          </div>
        </section>

        {/* ═════════ 11. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Maribyrnong
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Maribyrnong 3032, end to end, from the river to Raleigh Road, plus the neighbouring suburbs below. One crew, one visit, same standard.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="edgewater-maribyrnong" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Edgewater · The River Streets</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Edgewater and Along the River</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Townhouses and homes on the river side of the suburb, where the 2022 flood hit hardest and bathrooms have been repaired, rebuilt and regrouted ever since. Balconies facing the water cop the weather first, and their sill joints are where we usually start.
                </p>
              </div>
              <div id="highpoint-maribyrnong" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Highpoint · Raleigh Road</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting Near Highpoint</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Apartments and homes behind the shopping centre, where ensuites and main bathrooms in the same unit reach regrout age together. We do the full set in one visit so the finish matches, and the balcony in the same trip if its joints have gone.
                </p>
              </div>
              <div id="older-maribyrnong" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">The Older Streets</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Older Maribyrnong Homes</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Brick and weatherboard homes on the suburb&apos;s older streets, many on timber floors that move a little with the seasons. Rigid cement grout cannot flex with that movement, so it cracks along the same lines until the joints are rebuilt to depth and the movement joints renewed in silicone.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Footscray", href: "/locations/melbourne/footscray" },
                { name: "Essendon", href: "/locations/melbourne/essendon" },
                { name: "Hobsons Bay", href: "/locations/melbourne/hobsons-bay" },
                { name: "All Melbourne Areas", href: "/locations/melbourne" },
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

        {/* ═════════ 12. MID CTA ═════════ */}
        <section className="bg-[#0d1030] py-12">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-2xl font-black leading-tight">
              Get a Free Quote in Maribyrnong
            </h2>
            <p className="text-base leading-relaxed text-white/85">
              Send a photo of your shower, bathroom or balcony and we will come back with a fixed quote, no obligation.
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

        {/* ═════════ 13. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why Maribyrnong Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist: showers, floors, balconies, epoxy and silicone. The crew on your Maribyrnong job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs, so sound tiles stay where they are." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Flood Recovery Bathrooms Checked Properly", text: "Wet areas in flood affected homes checked joint by joint, and we tell you straight if more than the grout has failed." },
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

        {/* ═════════ 14. COST (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in Maribyrnong?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Short answer: you get a fixed quote once we have seen the job, because every home is different. These four things decide the number:
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

        {/* ═════════ 15. SERVICES STRIP ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Maribyrnong
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Shower Regrouting", href: "/shower-regrouting", text: "Failed shower grout and silicone cut out and replaced, tiles left in place." },
                { name: "Leaking Shower Repair", href: "/leaking-shower-repair", text: "We trace where the water is escaping and fix the joints and seals letting it through." },
                { name: "Tile Regrouting", href: "/tile-regrouting", text: "Bathroom floors, laundries and splashbacks regrouted without retiling." },
                { name: "Balcony Regrouting", href: "/balcony-regrouting", text: "Failed balcony grout replaced with outdoor grade grout, tiles kept in place." },
                { name: "Balcony Leak Repairs", href: "/balcony-leak-repairs", text: "Sill and edge joints resealed and regrouted before water gets underneath." },
                { name: "Epoxy Grout", href: "/epoxy-grout", text: "Waterproof, stain resistant grout that never needs sealing, made for showers." },
                { name: "Silicone Recaulking", href: "/silicone-recaulking", text: "Old, mouldy silicone stripped out and replaced with a clean, sealed finish." },
                { name: "Our Process", href: "/our-process", text: "How a Groutix job runs, from first photo to final clean, with no surprises." },
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

        {/* ═════════ 16. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Maribyrnong Regrouting FAQs
              </h2>
            </div>
            <ul className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </ul>
          </div>
        </AnimatedSection>

        {/* ═════════ 17. FINAL CTA (navy) ═════════ */}
        <section className="bg-[#0d1030] py-16 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[42px]">
              Tired Grout Anywhere in Maribyrnong?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting Maribyrnong is what we do, from the river streets at Edgewater to the blocks near Highpoint and the older homes in between, with most jobs done in a single visit.
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
