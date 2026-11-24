/* AnakiePage — Phase 2 Geelong spoke build #3 (2026-11-24).
   /locations/geelong/anakie (Geelong route — wiring lives in
   app/locations/geelong/[suburb]/page.tsx).
   GATE: "anakie" IS in GEELONG_SUBURB_SLUGS — no fix needed.
   GSC (live, last 3 months): 0 clicks / 127 impressions / pos 31.4.
   Diagnosis: generic template dilution. ZERO of the 11 query rows
   mention Anakie; the URL is lent to a Sunbury cluster (73 imp)
   and to Geelong hub terms (35 imp) that belong to the hub.
   Primary keyword: shower regrouting anakie.
   Secondary: tile regrouting anakie, grout repair anakie,
   leaking shower repair anakie.
   NOT targeted: sunbury terms, hub Geelong terms.
   Local entities: postcode 3213, City of Greater Geelong,
   Brisbane Ranges, Anakie Gorge, Fairy Park, Geelong Ballan
   Road, Staughton Vale, Lara. Housing: rural township, acreage
   and farm properties, older farmhouses, country homes and
   weekenders. Tank and bore water common on rural properties.
   Core angle: distance. Getting a tradie out is half the battle,
   so one trip fixes everything (shower, floors, verandah) in
   epoxy that lasts. Farm showers work hard; hard water is hard
   on grout and silicone.
   PATTERN: deliberately different order again (per Edeel, 24 Nov):
   hero, local intro with slim stat row, one trip section, shower,
   Real Work, floors, leaking, verandahs and outdoor areas, areas,
   mid CTA, why, cost, services strip, FAQ, final CTA.
   No stats strip, no full width balcony band.
   Images: ALL already live in public/ — no uploads in this pack.
   Sliders use the latest before/after pairs built 19–20 Nov 2026,
   per Edeel. Rating fully dynamic via useGoogleRating() (301).
   No invented jobs, reviews or locations. The only price figure
   is the $550 to $1,500 range already live in the site cost FAQs,
   mirrored word for word in FAQ 1.
   Route title: "Shower & Balcony Regrouting Anakie | Free Quote"
   (route file is delivered whole in this pack). */

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
    q: "How much does shower regrouting cost in Anakie?",
    a: "Most standard single showers cost about $550 to $1,500 to regrout. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    q: "Do you really come out to Anakie for a regrout?",
    a: "Yes. Anakie is inside our Geelong service area, and the way to make the trip count is to bundle the work: send photos of the shower, the bathroom floor and the verandah, and one visit covers all of it. That is how most Anakie jobs run, and it is why we ask for photos of the whole house's wet areas, not just the one room.",
  },
  {
    q: "Our property runs on tank and bore water. Does that change anything?",
    a: "It makes the grout choice matter more. Hard water leaves mineral stains in porous cement grout and works at silicone edges, so rural showers often look tired faster than town ones. Epoxy grout is non porous, shrugs off mineral staining and never needs sealing, which is why we recommend it on tank and bore water properties.",
  },
  {
    q: "Our farmhouse shower gets used hard. Will a regrout hold up?",
    a: "A farm shower at the end of a working day is exactly what epoxy grout is built for: it is the grout used in commercial wet areas, waterproof and stain resistant, and it does not soften or crumble under heavy daily use the way old cement grout does. The wear item stays the silicone, which is straightforward to renew when its turn comes.",
  },
  {
    q: "Why does the mould in our shower keep coming back?",
    a: "Because mould grows into silicone, not just on it, so scrubbing never cleans it out, and failed grout lets moisture sit in the joint where mould feeds. The lasting fix is to strip it all out, cut out the failed grout, and rebuild the joints with epoxy grout and fresh silicone.",
  },
  {
    q: "Will regrouting fix a leaking shower, or is it the waterproofing?",
    a: "Most leaking showers leak through failed grout and silicone, and regrouting fixes those. Many older farmhouses were built before modern membranes existed, so the joints really are the waterproofing. If water has damaged the wall or floor structure itself, regrouting alone will not fix it, and we will tell you straight before quoting rather than sell you a repair that cannot hold.",
  },
  {
    q: "How long does regrouting last, and when can we use the shower again?",
    a: "A proper epoxy regrout lasts well beyond ten years in a domestic shower and never needs sealing. Silicone is the wear item and usually needs renewing after some years of daily use. After the job, silicone needs 24 hours to cure and epoxy grout needs 4 days to cure fully before heavy use, and we confirm the exact timing for your bathroom before we leave.",
  },
  {
    q: "Do you cover Staughton Vale, Lara and Lovely Banks as well?",
    a: "Yes. This page covers Anakie 3213, and the same crew works through Staughton Vale, Lara and Lovely Banks, plus the rest of Geelong from the hub page. One visit can cover the shower, the bathroom floor and the verandah tiles together, so the finish matches through the house.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/geelong/anakie#service",
      name: "Shower, tile and balcony regrouting in Anakie",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Anakie VIC 3213" },
      ],
      url: "https://groutix.com/locations/geelong/anakie",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Geelong", item: "https://groutix.com/locations/geelong" },
        { "@type": "ListItem", position: 4, name: "Anakie", item: "https://groutix.com/locations/geelong/anakie" },
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

export default function AnakiePage({
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Anakie 3213</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Anakie: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Out here, getting a tradie out is half the battle, so the job has to be done properly the first time. We regrout showers, bathrooms and verandahs across Anakie in waterproof epoxy grout, and one visit can cover the whole house, tiles left in place. A 10 year waterproof warranty on complete shower regrouts. Free quote.
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

        {/* ═════════ 2. LOCAL INTRO — a rural township ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for Anakie Homes
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Anakie sits at the foot of the Brisbane Ranges, a farming township of acreage blocks, older farmhouses and weekenders, with Fairy Park on the hill and the gorge walk at the end of the road. Bathrooms out here work hard and help is a drive away, which changes what a good regrout looks like: it has to last.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                That is why epoxy grout is the default recommendation on rural properties. It is waterproof, it shrugs off the mineral staining that tank and bore water leave in porous grout, and it never needs sealing or a return visit to maintain. You can see exactly how a job runs on{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                page, and the wider region is covered from the{" "}
                <Link href="/locations/geelong" className="font-bold text-accent hover:underline">Geelong</Link>{" "}
                page.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3213", label: "Postcode Covered", sub: "Township, ranges foot and the Ballan Road" },
                { value: "Ranges", label: "At the Foot Of", sub: "Brisbane Ranges and Anakie Gorge country" },
                { value: "1 Trip", label: "Everything Fixed", sub: "Shower, floors and verandah together" },
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

        {/* ═════════ 3. ONE TRIP SECTION — the distance argument ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                One Trip, Everything Fixed
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In town, a second visit is an inconvenience. In Anakie it is another week of waiting and another drive. So Anakie jobs are planned differently: send photos of every wet area in the house, and the single visit covers all of it.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Photos First, Properly Planned", text: "Photos of the shower, the bathroom floor, the laundry and the verandah let us quote the whole house and bring everything the job needs, so nothing waits on a second trip." },
                { title: "Built to Last Out Here", text: "Epoxy grout, fresh silicone, joints rebuilt to depth. The point of doing it once is doing it right: no patch that fails by next winter and starts the whole wait again." },
                { title: "Hard Use, Hard Water", text: "Farm showers at the end of a working day, kids, dogs and tank water minerals. The materials are chosen for that life, not for a display home." },
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

        {/* ═════════ 4. SHOWER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in Anakie
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A farmhouse shower earns its keep: first shower before dawn, last one after the paddocks, and everyone in between. When its grout crumbles and its silicone blackens, there is no spare bathroom to fall back on. A shower regrout replaces both in one visit, with every tile left exactly where it is.
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
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link>, which we recommend on tank and bore water properties.</>,
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
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Real Work</p>
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Before and After: Real Regrouting Results
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Real Groutix jobs in Victorian homes, not stock photos. Drag the slider to see the after. This is the standard we bring to every Anakie bathroom.
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
                  <Image src="/walk-in-shower-regrouting-wide-view.webp" alt="Shower regrouting in Anakie by Groutix, a wide shower with freshly regrouted tiles and sealed edges" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">The finish we work to in every Anakie bathroom: clean joints, sealed edges, original tiles untouched.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/tile-regrouting-dark-floor-tiles-close-up.webp" alt="Tile regrouting in Anakie, dark floor tiles with worn grout replaced joint by joint" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Floor grout up close: cracked and sunken joints are the first path for water to get under the tiles.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ═════════ 7. FLOORS, LAUNDRIES, SPLASHBACKS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Splashbacks
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A country home puts its laundry to work like a second kitchen, and its floors take boots, dogs and everything the farm brings in. Those joints darken and crack while the tiles themselves stay sound. Tile regrouting in Anakie covers all of them, cut out and replaced without retiling, in the same visit as the shower.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Bathroom Floors", text: "Dark, tired floor grout cut out and replaced so the room matches the shower again." },
                { title: "Laundries", text: "Floors and splashbacks that see water and work daily, regrouted and resealed to last." },
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

        {/* ═════════ 8. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Anakie
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                On stumps and bearers, a leaking shower quietly feeds the timbers under a farmhouse for years before anyone sees it. The signs are the same as anywhere, just easier to miss in a busy house: a wall that will not dry, skirting swelling beside the bathroom, or a floor that has started to feel soft.
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
                Before we quote, we check the grout, silicone and tiles for cracks, gaps and movement, and we look at what the water has reached. If the leak has rotted the wall or floor structure itself, joints alone will not fix it, and we will say so. More on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>
                , and in our guides to a{" "}
                <Link href="/guides/shower-still-leaking-after-regrouting" className="font-bold text-accent hover:underline">shower still leaking after regrouting</Link>{" "}
                and a{" "}
                <Link href="/guides/shower-leaking-into-ceiling-below" className="font-bold text-accent hover:underline">shower leaking into the ceiling below</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 9. VERANDAHS AND OUTDOOR AREAS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Verandah and Balcony Regrouting
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A farmhouse verandah is a working room: boots off, dogs in, wood stacked against the wall. Its tiled joints take weather and work together, and once water gets under them it tracks towards the house. Regrouting renews those joints before tiles loosen, on verandahs, porches and balconies alike, usually in the same visit as the bathroom.
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

        {/* ═════════ 10. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Anakie
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Anakie 3213, from the township out to the ranges foot and down the Ballan Road, plus the neighbouring districts below. One crew, one trip, same standard.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="anakie-township" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">The Township</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Anakie Itself</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Homes in and around the township, where the bathroom is often the original one and the grout has simply outlived its years. One visit brings it back to watertight, tiles and all.
                </p>
              </div>
              <div id="anakie-ranges-foot" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">The Ranges Foot</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting Toward the Brisbane Ranges</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Properties climbing toward the ranges and the gorge, including weekenders that sit closed up for weeks. A closed house hides a slow leak well; regrouting on time is the cheap insurance.
                </p>
              </div>
              <div id="anakie-acreage" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Acreage and Farms</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting on Working Properties</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Farmhouses and acreage homes down the Ballan Road and toward Staughton Vale, where showers work hard and water comes from tanks and bores. Epoxy grout is the standard recommendation out here, and the whole house is done in the one trip.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Lara", href: "/locations/geelong/lara" },
                { name: "Lovely Banks", href: "/locations/geelong/lovely-banks" },
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

        {/* ═════════ 11. MID CTA ═════════ */}
        <section className="bg-[#0d1030] py-12">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-2xl font-black leading-tight">
              Get a Free Quote in Anakie
            </h2>
            <p className="text-base leading-relaxed text-white/85">
              Send photos of your shower, bathroom floor and verandah and we will come back with a fixed quote for the lot, no obligation.
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
                Why Anakie Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a regrouting specialist: showers, floors, balconies, epoxy and silicone. The crew on your Anakie job does this work every day, in homes of every age.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs, so sound tiles stay where they are." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne and Geelong customers on Google." },
                { title: "Worth the Trip, Once", text: "Everything quoted from photos and finished in one visit, in materials chosen to last out here." },
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
                What Does Regrouting Cost in Anakie?
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

        {/* ═════════ 14. SERVICES STRIP ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Anakie
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

        {/* ═════════ 15. FAQ ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Anakie Regrouting FAQs
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
              Tired Grout Anywhere in Anakie?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us photos of the whole house and call (03) 7023 8094 for a free quote. Regrouting Anakie is what we do, from the township to the ranges foot, with everything finished in a single visit.
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
