/* CraigieburnPage — v1 service-first build (2026-10-31).
   Page 15 of the location rebuild, Batch 2 (north/east) #1:
   /locations/melbourne/craigieburn, covering Craigieburn,
   Greenvale, Roxburgh Park, Mickleham and Kalkallo
   (client-confirmed service-area doc #25). "craigieburn" is
   already in the gate list — no locationRoutes change in this
   pack. Mickleham, Roxburgh Park and Kalkallo have no live
   route of their own; they are covered as sections here, never
   linked. Greenvale IS gated and is chipped.
   GSC 29 Jul–30 Oct 2026: greenvale generic page 151 impr
   (pos 28.6), craigieburn 90 (pos 20.1); queries skew to
   waterproofing in Greenvale — the grout-vs-membrane material
   leads.
   Built on the Albert Park v3 / Malvern pattern per Edeel:
   - Hero: live homepage hero pattern — QuoteFormV2 with
     defaultService="Shower Regrouting", HeroContactBadges CTAs,
     items-start grid, pt-[140px] lg:pt-[160px].
   - Copy: direct-answer / service-first, unique north-growth
     angle (established Craigieburn at first-regrout age, the
     Highlands-era family homes, and brand-new Mickleham and
     Kalkallo builds whose builder grout is already failing).
   - No invented stats, jobs, reviews or prices. Rating badges use
     the live useGoogleRating() hook.
   Drop-in: add components/CraigieburnPage.tsx on the main branch
   + the route edits in app/locations/melbourne/[suburb]/page.tsx
   (see notes file). NO redirects confirmed for Craigieburn. */

"use client";

import Link from "next/link";
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
    q: "Our Mickleham home is nearly new and the shower grout is already cracking. Why?",
    a: "It's the most common call we get from the new estates: builder grout goes in fast and thin, and a new slab keeps moving slightly as it settles, so joints crack and silicone lets go within a few years. Regrouting to proper depth with the right grout fixes it for the long term — you're not doing anything wrong.",
  },
  {
    q: "How can I tell if it's the grout or the waterproofing?",
    a: "If water only appears after the shower runs and the grout or silicone is cracked, it's usually the surface. If walls or floors stay damp, tiles are loose or the leak continues after a reseal, the membrane may have failed. We check before we quote — and if it is the membrane, we'll tell you straight rather than regrout over it.",
  },
  {
    q: "Do you cover Roxburgh Park and Kalkallo too?",
    a: "Yes — the whole area: Craigieburn, Greenvale, Roxburgh Park, Mickleham and Kalkallo.",
  },
  {
    q: "Can you do the ensuite, main bathroom and laundry in one visit?",
    a: "Yes — most homes in this corridor have the full set, and doing them together gives a matching finish and saves a second call-out.",
  },
  {
    q: "Should I choose epoxy or cement grout for a family shower?",
    a: "Epoxy grout resists water and staining far better than cement grout and never needs sealing, so it suits showers that get used several times a day. Cement grout with a penetrating sealer is the standard option and costs less. We'll tell you which suits each room.",
  },
  {
    q: "Can you replace just a few cracked tiles?",
    a: "Yes — two or three cracked tiles can be replaced and regrouted, matched as closely as we can. On older bathrooms a full regrout in a fresh colour usually looks better than patching one section; we'll show you the options when we quote.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/craigieburn#service",
      name: "Shower, tile and balcony regrouting in Craigieburn",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Craigieburn VIC 3064" },
        { "@type": "Place", name: "Roxburgh Park VIC 3064" },
        { "@type": "Place", name: "Mickleham VIC 3064" },
        { "@type": "Place", name: "Kalkallo VIC 3064" },
        { "@type": "Place", name: "Greenvale VIC 3059" },
      ],
      url: "https://groutix.com/locations/melbourne/craigieburn",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Craigieburn", item: "https://groutix.com/locations/melbourne/craigieburn" },
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

export default function CraigieburnPage({
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
        {/* ═════════ 1. HERO — live homepage (HomePageV2) pattern ═════════ */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-[#0d1030] pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <div className="mx-auto grid w-full max-w-[1460px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Craigieburn 3064</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Craigieburn: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower grout gone dark in Craigieburn? Builder grout cracking already in Mickleham? We regrout showers, bathrooms and balconies across Craigieburn, Greenvale, Roxburgh Park and Kalkallo — tiles stay in place. That&apos;s regrouting in Craigieburn, backed by a 10-year waterproof warranty on showers. Free quote.
              </p>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges rating={rating} />
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
                Regrouting for the North&apos;s Growth Corridor
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Craigieburn has been growing for thirty years, and its bathrooms show every stage of it. The established streets are at first-regrout age; the Highlands-era family homes have big ensuites and main bathrooms wearing out together; and out in Mickleham and Kalkallo, homes that are barely finished are already cracking at the joints as their slabs settle.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our grouting repairs in Craigieburn start with the joints, not the tiles: we cut out the failed grout and rebuild it to proper depth, so the bathroom comes back watertight without a renovation — in a thirty-year-old Roxburgh Park home or a three-year-old Mickleham one.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3059–3064", label: "Postcodes Covered", sub: "Greenvale to Kalkallo" },
                { value: "Old & New", label: "Both Covered", sub: "First regrouts and early builder-grout failures" },
                { value: "1 Visit", label: "Ensuite, Bathroom & Laundry", sub: "Matching finish, no second call-out" },
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
                Shower Regrouting in Craigieburn
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it — and the old silicone — in one visit, tiles left in place. In this corridor&apos;s family bathrooms the shower rarely travels alone: once it&apos;s fresh, the tired floor grout beside it stands out, so we regrout floor and walls together for a matching finish.
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

        {/* ═════════ 5. FLOORS, LAUNDRIES, KITCHENS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Kitchens
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Floor grout wears fastest in the rooms you use most. Tile regrouting in Craigieburn covers bathroom floors, laundries and kitchen splashbacks right through the house — cut out and replaced, without retiling.
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

        {/* ═════════ 6. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Craigieburn
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most homes in this corridor are single-storey, so a leaking shower shows up beside the bathroom, not below: swollen skirting in the hallway, damp carpet in the bedroom next door, a musty smell that won&apos;t shift. We find where the water is escaping, fix the grout and seals — and tell you straight if it&apos;s a membrane or plumbing problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Swollen Skirting", text: "Skirting or door frames swelling on the other side of the shower wall." },
                { title: "Damp Carpet Next Door", text: "Carpet or underlay staying damp in the room beside the bathroom." },
                { title: "Musty Smell", text: "A damp smell in the bedroom or hallway that cleaning won't shift." },
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

        {/* ═════════ 7. BALCONIES, ALFRESCOS, OUTDOOR ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balconies, Alfrescos and Outdoor Tiles
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Sun, wind and movement work outdoor joints hard, and the grout and silicone at the door sill and balcony edges are usually the first to fail. Balcony regrouting in Craigieburn fixes failed joints before tiles loosen and water gets underneath — and from a balcony, that water usually ends up in the room below.
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
              Relaying a whole balcony or alfresco is a bigger job — we&apos;ll tell you if yours needs it. More on{" "}
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

        {/* ═════════ 8. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Craigieburn
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Craigieburn 3064 plus Greenvale, Roxburgh Park, Mickleham and Kalkallo. One page, one crew, same week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="greenvale" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Greenvale 3059</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Greenvale</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The established pocket by the reservoir — bigger 1980s and 90s homes on bigger blocks, with ensuites and main bathrooms now well past first-regrout age. We regrout the set in one visit so the finish matches across the house.
                </p>
              </div>
              <div id="roxburgh-park" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Roxburgh Park 3064</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Roxburgh Park</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  1990s and 2000s family homes around the station — bathrooms at exactly the age where original grout and silicone fail together. Shower, floor and laundry regrouted in one visit, tiles left in place.
                </p>
              </div>
              <div id="mickleham" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Mickleham 3064</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Mickleham</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Some of the fastest-growing streets in Australia — and some of the youngest grout problems. Builder grout that went in thin cracks early as new slabs settle. We regrout Mickleham showers and bathrooms to proper depth so the fix outlasts the house&apos;s first decade.
                </p>
              </div>
              <div id="kalkallo" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Kalkallo 3064</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Kalkallo</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The newest town on the Hume corridor, still being built. The pattern is the same as Mickleham: early joint failure in nearly-new bathrooms. Shower regrouting, resealing and balcony joints — done once, done properly.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Greenvale", href: "/locations/melbourne/greenvale" },
                { name: "Broadmeadows", href: "/locations/melbourne/broadmeadows" },
                { name: "Sunbury", href: "/locations/melbourne/sunbury" },
                { name: "Epping", href: "/locations/melbourne/epping" },
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

        {/* ═════════ 9. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why Craigieburn Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist — showers, floors, balconies, epoxy and silicone. The crew on your Craigieburn job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs — good tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Old & New Alike", text: "Thirty-year-old bathrooms and brand-new estate showers, same standard." },
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

        {/* ═════════ 10. COST (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in Craigieburn?
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

        {/* ═════════ 11. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Craigieburn Regrouting FAQs
              </h2>
            </div>
            <ul className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </ul>
          </div>
        </AnimatedSection>

        {/* ═════════ 12. FINAL CTA (navy) ═════════ */}
        <section className="bg-[#0d1030] py-16 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[42px]">
              Tired Grout Anywhere in the Craigieburn Corridor?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting the north&apos;s growth corridor is what we do — we cover Craigieburn, Greenvale, Roxburgh Park, Mickleham and Kalkallo, most jobs done in a single visit.
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
