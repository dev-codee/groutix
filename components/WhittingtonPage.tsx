/* WhittingtonPage — Phase 2 Geelong spoke build #1 (2026-11-24).
   /locations/geelong/whittington (Geelong route, NOT the Melbourne
   route — wiring lives in app/locations/geelong/[suburb]/page.tsx).
   GATE: "whittington" IS in GEELONG_SUBURB_SLUGS — no fix needed.
   GSC (live, last 3 months): 0 clicks / 134 impressions / pos 38.3.
   Diagnosis: pure generic template dilution. ZERO of the 16 query
   rows mention Whittington; the page is lent to Sunbury, Bacchus
   Marsh, Malvern and St Albans queries. The only Geelong row,
   "bathroom regrouting geelong" (6 imp @ 78.2), belongs to the hub.
   Primary keyword: shower regrouting whittington.
   Secondary: tile regrouting whittington, grout repair whittington,
   leaking shower repair whittington.
   NOT targeted: bathroom regrouting geelong (hub owns it), sunbury
   and bacchus marsh terms, malvern and richmond terms.
   Local entities: postcode 3219, City of Greater Geelong, Bellarine
   Highway, Newcomb, St Albans Park, Breakwater. Housing: post war
   weatherboard and brick veneer homes, many originally housing
   commission, one of Geelong's most affordable suburbs, first home
   buyer and investor territory, renovations done in stages.
   Core angle: original bathrooms at 50 to 70 years old, grout
   failing across the whole suburb at once, and regrouting as the
   smart first renovation for buyers fixing a place up room by room.
   PATTERN: deliberately different order again (per Edeel, 24 Nov):
   hero, stats strip (hub style), local intro, era section (why
   these bathrooms fail together), shower, Real Work, floors,
   leaking, verandahs and balconies, areas, mid CTA, why, cost,
   services strip, FAQ, final CTA. No full width balcony band.
   Images: ALL already live in public/ — no uploads in this pack.
   Sliders use the latest before/after pairs built 19–20 Nov 2026,
   per Edeel. Rating fully dynamic via useGoogleRating() (301).
   No invented jobs, reviews or locations. The only price figure is
   the $550 to $1,500 range already live in the site cost FAQs,
   mirrored word for word in FAQ 1.
   Route title: "Shower & Balcony Regrouting Whittington | Free
   Quote" (route file is delivered whole in this pack). */

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
    q: "How much does shower regrouting cost in Whittington?",
    a: "Most standard single showers cost about $550 to $1,500 to regrout. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    q: "We just bought our first home in Whittington. Is regrouting worth it before we move in?",
    a: "It is usually the smartest first job. An empty house is the easiest time to regrout: no one is sharing the bathroom, the work is done in one visit, and you move into a shower that is watertight from day one instead of discovering a leak with your furniture already in. Plenty of Whittington buyers do exactly this between settlement and moving day.",
  },
  {
    q: "Our bathroom is original from the 1960s. Can it be regrouted, or does it need a full renovation?",
    a: "Most original Whittington bathrooms can be regrouted. The tiles in these homes were laid to last, and if they are firm and the wall behind them is sound, cutting out the failed grout and rebuilding the joints gives you a watertight bathroom without renovation money. If tiles have gone drummy or the boards have rotted, we will show you before quoting, because joints alone cannot fix structure.",
  },
  {
    q: "We are renovating in stages. Does it make sense to regrout now and renovate later?",
    a: "Yes, and it is common here. Regrouting makes the bathroom safe and usable now, at a fraction of renovation cost, and buys you years while you save for the bigger job. When the renovation eventually happens, nothing about a regrout stands in its way.",
  },
  {
    q: "Why does the mould in our shower keep coming back?",
    a: "Because mould grows into silicone, not just on it, so scrubbing never cleans it out, and failed grout lets moisture sit in the joint where mould feeds. In an older bathroom the silicone may have been renewed over old silicone more than once, which traps it deeper. The lasting fix is to strip it all out, cut out the failed grout, and rebuild the joints with epoxy grout and fresh silicone.",
  },
  {
    q: "Will regrouting fix a leaking shower, or is it the waterproofing?",
    a: "Most leaking showers leak through failed grout and silicone, and regrouting fixes those. Many post war homes were built before modern membranes existed, so the joints really are the waterproofing. If water has damaged the wall or floor structure itself, regrouting alone will not fix it, and we will tell you straight before quoting rather than sell you a repair that cannot hold.",
  },
  {
    q: "How long does regrouting last, and when can we use the shower again?",
    a: "A proper epoxy regrout lasts well beyond ten years in a domestic shower and never needs sealing. Silicone is the wear item and usually needs renewing after some years of daily use. After the job, silicone needs 24 hours to cure and epoxy grout needs 4 days to cure fully before heavy use, and we confirm the exact timing for your bathroom before we leave.",
  },
  {
    q: "Do you cover Newcomb, St Albans Park and Breakwater as well?",
    a: "Yes. This page covers Whittington 3219, and the same crew works through Newcomb, St Albans Park, Breakwater and Thomson, plus the rest of Geelong from the hub page. One visit can cover the shower, the bathroom floor and the verandah tiles together, so the finish matches through the house.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/geelong/whittington#service",
      name: "Shower, tile and balcony regrouting in Whittington",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Whittington VIC 3219" },
      ],
      url: "https://groutix.com/locations/geelong/whittington",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Geelong", item: "https://groutix.com/locations/geelong" },
        { "@type": "ListItem", position: 4, name: "Whittington", item: "https://groutix.com/locations/geelong/whittington" },
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

export default function WhittingtonPage({
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Whittington 3219</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Whittington: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Just bought in Whittington, or fixing up a post war home room by room? The bathroom is where these houses show their age first: original grout crumbling, silicone long gone black. We regrout showers, bathrooms and verandahs across Whittington, and the tiles stay in place. Waterproof epoxy grout, most jobs done in a single visit, and a 10 year waterproof warranty on complete shower regrouts. Free quote.
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

        {/* ═════════ 3. LOCAL INTRO — first home buyer suburb ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for Whittington Homes
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Whittington is where Geelong's first home buyers land: solid post war houses at prices that still leave room to improve them. Buyers here renovate in stages, a roof one year, a kitchen the next, and the bathroom usually jumps the queue, because it is the room that decides whether the house feels tired or cared for.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                The good news is that these bathrooms are worth saving. The tiles were laid well and the bones are honest; it is the grout and silicone, at fifty to seventy years old, that have given up. Regrouting rebuilds those joints in epoxy and reseals every corner, which is how an original Whittington bathroom becomes watertight and presentable again on a first home budget. You can see exactly how a job runs on{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                page, and the wider region is covered from the{" "}
                <Link href="/locations/geelong" className="font-bold text-accent hover:underline">Geelong</Link>{" "}
                page.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3219", label: "Postcode Covered", sub: "Bellarine Highway to the Newcomb border" },
                { value: "1950s–60s", label: "Build Era", sub: "Post war homes, original bathrooms" },
                { value: "1 Visit", label: "Most Jobs", sub: "Shower, floor and seals together" },
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

        {/* ═════════ 4. THE ERA SECTION — why these bathrooms fail together ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Built After the War, All Failing at Once
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Whittington went up in a rush after the war, street after street of weatherboard and brick veneer homes, many of them housing commission. Whole streets were tiled in the same few years, with the same materials, so whole streets are reaching the end of their grout's life in the same few years too. If your bathroom is failing, your neighbours' probably are as well.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Original Bathrooms", text: "Plenty of Whittington showers have never been regrouted. Sixty year old cement grout goes powdery and porous, and silicone renewed over silicone traps mould deeper each time." },
                { title: "Built Fast, Built Honest", text: "Commission homes were built to a budget but tiled by tradesmen. The tiles and the falls are usually sound; it is the joints between them that were never meant to last this long." },
                { title: "Renovating in Stages", text: "A regrout is the stage that makes the bathroom safe now: watertight, mould free and presentable, while the bigger renovation waits its turn and its budget." },
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
          </div>
        </AnimatedSection>

        {/* ═════════ 5. SHOWER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in Whittington
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a Whittington bathroom the tiles are rarely the problem. It is the grout that has crumbled and stained, and the silicone that let go years ago. A shower regrout replaces both in one visit, with every tile left exactly where it is, which is why it suits these homes so well.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, never smeared over, however many layers of past patching we find.",
                    "Shower, bathroom, floor and wall grout done together if you want one matching finish.",
                    "Every layer of old silicone stripped out and replaced, never sealed over.",
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link>, which we recommend in an older bathroom.</>,
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

        {/* ═════════ 6. REAL WORK — latest before/after pairs ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Real Work</p>
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Before and After: Real Regrouting Results
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Real Groutix jobs in Victorian homes, not stock photos. Drag the slider to see the after. This is the standard we bring to every Whittington bathroom.
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

        {/* ═════════ 7. IMAGE BAND A ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/walk-in-shower-regrouting-wide-view.webp" alt="Shower regrouting in Whittington by Groutix, a wide shower with freshly regrouted tiles and sealed edges" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">The finish we work to in every Whittington bathroom: clean joints, sealed edges, original tiles untouched.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/tile-regrouting-dark-floor-tiles-close-up.webp" alt="Tile regrouting in Whittington, dark floor tiles with worn grout replaced joint by joint" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Floor grout up close: cracked and sunken joints are the first path for water to get under the tiles.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ═════════ 8. FLOORS, LAUNDRIES, SPLASHBACKS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Splashbacks
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Whittington homes put tiles where water works hardest: bathroom floors, laundries and kitchen splashbacks. Those joints darken and crack long after the tiles themselves have settled in for good. Tile regrouting in Whittington covers all of them, cut out and replaced without retiling.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Bathroom Floors", text: "Dark, tired floor grout cut out and replaced so the room matches the shower again." },
                { title: "Laundries", text: "Floors and splashbacks that see water daily, regrouted and resealed to last." },
                { title: "Kitchen Splashbacks", text: "Stained joints behind the stove and sink cut out and renewed, tiles kept." },
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

        {/* ═════════ 9. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Whittington
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a post war Whittington home a leaking shower usually shows up next door first: a wall that will not dry, skirting swelling beside the bathroom, or a musty smell that no cleaning shifts. These homes were built before modern membranes, so the grout and silicone are not just the finish, they are the waterproofing, and when they fail the water goes straight into the wall.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Damp Wall", text: "A wall beside the shower that stays damp or smells musty." },
                { title: "Swollen Skirting", text: "Skirting boards or door frames swelling near the bathroom." },
                { title: "Soft or Stained Floor", text: "Flooring near the bathroom lifting, staining or feeling soft." },
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
              <h3 className="mb-2 text-lg font-bold text-neutral-900">How We Tell Grout From Structure</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Before we quote, we check the grout, silicone and tiles for cracks, gaps and movement, and we look at what the water has reached. If the leak has rotted the wall or floor structure, joints alone will not fix it, and we will say so. More on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>
                , and in our guides to a{" "}
                <Link href="/guides/shower-still-leaking-after-regrouting" className="font-bold text-accent hover:underline">shower still leaking after regrouting</Link>{" "}
                and a{" "}
                <Link href="/guides/shower-leaking-into-ceiling-below" className="font-bold text-accent hover:underline">shower leaking into the ceiling below</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 10. VERANDAHS AND BALCONIES ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Verandah and Balcony Regrouting
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                The tiled verandah is part of a Whittington home's face to the street, and its joints take the weather head on. Sun, rain and decades of foot traffic open the grout at the edges first, and once water gets under verandah tiles it tracks towards the house. Regrouting renews those joints before tiles loosen, on verandahs, porches and the balconies of the newer units alike.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Verandahs and Porches", text: "Cracked verandah joints cut out and regrouted so the front of the house looks kept again, original tiles left in place." },
                { title: "Balconies", text: "Failed grout and silicone at the sill and edges cut out, resealed and regrouted with outdoor grade grout." },
                { title: "Entries and Paths", text: "The odd loose tile made good and joints regrouted where suitable. We will tell you if relaying is the honest answer." },
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
              if water is already getting in. Relaying a whole verandah is a bigger job, and we will tell you if yours needs it.
            </p>
            <div className="text-center">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Get a Free Outdoor Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 11. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Whittington
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Whittington 3219, end to end, from the highway side to the Newcomb border, plus the neighbouring suburbs below. One crew, one visit, same standard.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="whittington-post-war-streets" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">The Post War Streets</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in the Original Homes</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Weatherboard and brick veneer homes on the quiet streets, many still on their first bathroom. This is where regrouting earns its keep: the tiles are sound, the grout is spent, and one visit brings the room back without renovation money.
                </p>
              </div>
              <div id="whittington-bellarine-highway" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Bellarine Highway Side</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting Along the Highway</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Homes and units along the Bellarine Highway corridor, where owners and agents book regrouting between tenancies and before sales, when a tired shower is the one thing dating an otherwise tidy place.
                </p>
              </div>
              <div id="whittington-newcomb-border" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Toward Newcomb and St Albans Park</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting on the Eastern Edge</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The streets that run into Newcomb and St Albans Park share the same post war stock and the same failing grout. First silicone renewals and grout repairs here are caught early, and caught early it is the cheapest regrout there is.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Newcomb", href: "/locations/geelong/newcomb" },
                { name: "St Albans Park", href: "/locations/geelong/st-albans-park" },
                { name: "Breakwater", href: "/locations/geelong/breakwater" },
                { name: "All Geelong Areas", href: "/locations/geelong" },
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
              Get a Free Quote in Whittington
            </h2>
            <p className="text-base leading-relaxed text-white/85">
              Send a photo of your shower, bathroom or verandah and we will come back with a fixed quote, no obligation.
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
                Why Whittington Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a regrouting specialist: showers, floors, balconies, epoxy and silicone. The crew on your Whittington job does this work every day, in homes of every age.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs, so sound tiles stay where they are." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne and Geelong customers on Google." },
                { title: "The Smart First Renovation", text: "A watertight, presentable bathroom now, at a fraction of renovation cost, while the bigger plans wait." },
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
                What Does Regrouting Cost in Whittington?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Short answer: you get a fixed quote once we have seen the job, because every home is different. These four things decide the number:
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Size", text: "How big the shower, floor or verandah is." },
                { title: "Condition", text: "How far the grout and silicone have failed." },
                { title: "Grout Type", text: "Cement grout with sealer, or epoxy grout." },
                { title: "How Many Rooms", text: "Doing the shower, bathroom floor and laundry together can save a second visit." },
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
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Whittington
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Shower Regrouting", href: "/shower-regrouting", text: "Failed shower grout and silicone cut out and replaced, tiles left in place." },
                { name: "Leaking Shower Repair", href: "/leaking-shower-repair", text: "We trace where the water is escaping and fix the joints and seals letting it through." },
                { name: "Tile Regrouting", href: "/tile-regrouting", text: "Bathroom floors, laundries and splashbacks regrouted without retiling." },
                { name: "Balcony Regrouting", href: "/balcony-regrouting", text: "Failed balcony and verandah grout replaced with outdoor grade grout, tiles kept in place." },
                { name: "Balcony Leak Repairs", href: "/balcony-leak-repairs", text: "Sill and edge joints resealed and regrouted before water gets underneath." },
                { name: "Epoxy Grout", href: "/epoxy-grout", text: "Waterproof, stain resistant grout that never needs sealing, made for showers." },
                { name: "Silicone Recaulking", href: "/silicone-recaulking", text: "Old, mouldy silicone stripped out and replaced with a clean, sealed finish." },
                { name: "Our Process", href: "/our-process", text: "How a Groutix job runs, from first photo to final clean, with no surprises." },
              ].map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  className="rounded-sm border border-neutral-200 bg-neutral-50 p-5 font-bold text-neutral-900 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.name}
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-neutral-600">{s.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 16. FAQ ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Whittington Regrouting FAQs
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
              Tired Grout Anywhere in Whittington?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting Whittington is what we do, from the post war streets to the Bellarine Highway, with most jobs done in a single visit.
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
