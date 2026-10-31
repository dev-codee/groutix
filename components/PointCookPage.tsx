/* PointCookPage — v1 service-first build (2026-10-31).
   Page 7 of the location rebuild, Batch 1 (west corridor) #1:
   /locations/melbourne/point-cook, covering Point Cook, Williams
   Landing and Laverton North (client-confirmed service-area doc #33),
   including the Point Cook estates: Sanctuary Lakes, Saltwater Coast,
   Alamanda and Featherbrook.
   Why early: the generic Point Cook page already sits at position
   12.2 (136 impressions, GSC 29 Jul–30 Oct 2026) with real query
   demand behind it — bathroom regrouting (61 impr), grout repairs
   (56), tile regrouting (55), balcony leak repair (42) — the nearest
   win in the whole programme.
   Built on the Albert Park v3 / Malvern pattern per Edeel:
   - Hero: live homepage hero pattern — QuoteFormV2 with
     defaultService="Shower Regrouting", HeroContactBadges CTAs,
     items-start grid, pt-[140px] lg:pt-[160px].
   - Copy: direct-answer / service-first, unique Point Cook angle
     (master-planned estate suburb: almost all homes built this
     century and now reaching first-regrout age; big family homes
     with several bathrooms; coastal air on balconies).
   - No invented stats, jobs, reviews or prices. Rating badges use
     the live useGoogleRating() hook.
   Drop-in: add components/PointCookPage.tsx on the main branch.
   ALSO REQUIRED in app/locations/melbourne/[suburb]/page.tsx:
   - import PointCookPage from "@/components/PointCookPage";
   - metadata special-case + render case (see notes file).
   NO redirects: no sub-area 301s are confirmed for Point Cook. */

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
    q: "My Point Cook home is about 15 years old. Is it due for a regrout?",
    a: "Very likely, yes. Most Point Cook homes were built this century, and in a busy family bathroom grout and silicone typically last around 10 to 15 years before they crack, stain or pull away. If the shower grout is dark, crumbling or the silicone has lifted at the base, the joints have done their service — regrouting now is far cheaper than repairing water damage later.",
  },
  {
    q: "Do you cover Sanctuary Lakes and Saltwater Coast?",
    a: "Yes — all of Point Cook including Sanctuary Lakes, Saltwater Coast, Alamanda and Featherbrook, plus Williams Landing and Laverton North.",
  },
  {
    q: "Does living near the coast affect balcony grout?",
    a: "It does. Salt air, sun and movement work outdoor joints harder than indoor ones, and the grout and silicone at the door sill and balcony edges are usually the first to fail. We cut out the failed joints and rebuild them with outdoor-grade grout and fresh silicone.",
  },
  {
    q: "How can I tell if it's the grout or the waterproofing?",
    a: "If water only appears after the shower runs and the grout or silicone is cracked, it's usually the surface. If walls or floors stay damp, tiles are loose or the leak continues after a reseal, the membrane may have failed. We check before we quote.",
  },
  {
    q: "Can you do both bathrooms and the laundry in one visit?",
    a: "Yes — most Point Cook homes have an ensuite, a main bathroom and a laundry, and doing them together in one visit gives a matching finish and saves a second call-out.",
  },
  {
    q: "Is epoxy grout better for a shower the whole family uses?",
    a: "Epoxy grout resists water and staining far better than cement grout and never needs sealing, so it suits showers that get used several times a day. Cement grout with a penetrating sealer is the standard option and costs less. We'll tell you which suits each room.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/point-cook#service",
      name: "Shower, tile and balcony regrouting in Point Cook",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Point Cook VIC 3030" },
        { "@type": "Place", name: "Sanctuary Lakes VIC 3030" },
        { "@type": "Place", name: "Williams Landing VIC 3027" },
        { "@type": "Place", name: "Laverton North VIC 3026" },
      ],
      url: "https://groutix.com/locations/melbourne/point-cook",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Point Cook", item: "https://groutix.com/locations/melbourne/point-cook" },
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

export default function PointCookPage({
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Point Cook 3030</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Point Cook: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower grout gone dark or cracked? Silicone lifting in a bathroom that&apos;s barely a teenager? We regrout showers, bathrooms and balconies across Point Cook, Sanctuary Lakes and Williams Landing — tiles stay in place. That&apos;s regrouting in Point Cook, backed by a 10-year waterproof warranty on showers. Free quote.
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
                Regrouting for Point Cook&apos;s Estate Homes
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Point Cook is a suburb built this century — estate after estate, from Sanctuary Lakes around the golf course and lake to Saltwater Coast, Alamanda and Featherbrook. Those first generations of homes are now ten to twenty-five years old, which is exactly when bathroom grout and silicone reach the end of their life. The tiles are still good; the joints between them are not.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                And these are big family homes — an ensuite, a main bathroom the kids share, a laundry that never stops. Every one of those wet areas wears its grout on the same clock, so Point Cook owners usually have us regrout the whole set in one visit. Our grouting repairs in Point Cook start with the joints, not the tiles: we cut out the failed grout and rebuild it, so the bathrooms come back watertight without a renovation.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3030–3026", label: "Postcodes Covered", sub: "Point Cook to Laverton North" },
                { value: "10–25 Yrs", label: "The Age of Most Homes Here", sub: "First-regrout age for estate bathrooms" },
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
                Shower Regrouting in Point Cook
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it — and the old silicone — in one visit, tiles left in place. In Point Cook&apos;s family bathrooms the shower rarely travels alone: once it&apos;s fresh, the tired floor grout beside it stands out, so we regrout floor and walls together for a matching finish.
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
                Floor grout wears fastest in the rooms you use most. Tile regrouting in Point Cook covers bathroom floors, laundries and kitchen splashbacks right through the house — cut out and replaced, without retiling.
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
                Leaking Shower Repair in Point Cook
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most Point Cook homes are single-storey, so a leaking shower shows up next door, not below: swollen skirting in the hallway, damp carpet in the bedroom beside the ensuite, a musty smell that won&apos;t go away. We find where the water is escaping, fix the grout and seals — and tell you straight if it&apos;s a membrane or plumbing problem instead.
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
                Point Cook sits on the bay, and its balconies, alfrescos and porches cop salt air, sun and movement all year. Balcony regrouting in Point Cook fixes failed grout and silicone at the door sill and edges; where the joints have washed out, tiles loosen and water gets underneath — and from a balcony, that water usually ends up in the room below.
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
                Areas We Cover Around Point Cook
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Point Cook 3030 — every estate — plus Williams Landing and Laverton North. One page, one crew, same week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="sanctuary-lakes" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Sanctuary Lakes 3030</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Sanctuary Lakes</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The original Point Cook estate, built around the lake and golf course — and now the oldest housing stock in the suburb, so its bathrooms are first in line for regrouting. The same goes for Saltwater Coast, Alamanda and Featherbrook: ensuites, main bathrooms and balconies, all on the same wear clock.
                </p>
              </div>
              <div id="williams-landing" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Williams Landing 3027</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Williams Landing</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The newer neighbour across the freeway — townhouses and apartments around the station, alongside family homes. Balconies matter here: failed balcony grout and silicone is the most common call we get from unit and townhouse owners. We regrout and reseal balconies, showers and floors right across Williams Landing.
                </p>
              </div>
              <div id="laverton-north" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Laverton North 3026</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Laverton North</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Better known for its industrial side, but the residential streets north of the freeway have older homes whose bathrooms are well past their first regrout. Shower grout, floor grout and silicone all tend to fail around the same age — we regrout the lot, usually in a single visit.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Werribee", href: "/locations/melbourne/werribee" },
                { name: "Hoppers Crossing", href: "/locations/melbourne/hoppers-crossing" },
                { name: "Altona Meadows", href: "/locations/melbourne/altona-meadows" },
                { name: "Laverton", href: "/locations/melbourne/laverton" },
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
                Why Point Cook Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist — showers, floors, balconies, epoxy and silicone. The crew on your Point Cook job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs — good tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Whole-Home Finish", text: "Ensuite, bathroom and laundry regrouted to match in the same job." },
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
                What Does Regrouting Cost in Point Cook?
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
                Point Cook Regrouting FAQs
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
              Tired Grout Anywhere in Your Point Cook Home?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting Point Cook homes is what we do — we cover Point Cook, Sanctuary Lakes, Williams Landing and Laverton North, most jobs done in a single visit.
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
