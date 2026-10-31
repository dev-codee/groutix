/* FootscrayPage — v1 service-first build (2026-10-31).
   Page 10 of the location rebuild, Batch 1 (west corridor) #4:
   /locations/melbourne/footscray, covering Footscray, West
   Footscray, Yarraville, Seddon, Kingsville, Maribyrnong and
   Braybrook (client-confirmed service-area doc #22).
   IMPORTANT: "footscray" was NOT in the site's suburb lists, so the
   Step-2 route gating returned 404 for this URL. This pack includes
   an updated lib/locationRoutes.ts (built on the St Albans pack's
   version) that adds the slug (sitemap 309 -> 310 once both packs
   are in). West Footscray, Yarraville, Seddon, Kingsville and
   Braybrook have no live route of their own — they are covered as
   sections on this page, never linked.
   GSC note: no footscray query rows appear in the 29 Jul–30 Oct
   2026 export — this page is built for 50km coverage and the GBP
   service-area list (Footscray added 2026-10-31), not on existing
   query demand.
   Built on the Albert Park v3 / Malvern pattern per Edeel:
   - Hero: live homepage hero pattern — QuoteFormV2 with
     defaultService="Shower Regrouting", HeroContactBadges CTAs,
     items-start grid, pt-[140px] lg:pt-[160px].
   - Copy: direct-answer / service-first, unique inner-west angle
     (Victorian and post-war cottages with old bathrooms, a heavy
     mix of rentals and units, river-side apartment balconies in
     Maribyrnong).
   - No invented stats, jobs, reviews or prices. Rating badges use
     the live useGoogleRating() hook.
   Drop-in: add components/FootscrayPage.tsx on the main branch.
   ALSO REQUIRED: replace lib/locationRoutes.ts with the version in
   this pack, and the route edits in
   app/locations/melbourne/[suburb]/page.tsx (see notes file).
   NO redirects: no sub-area 301s are confirmed for Footscray. */

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
    q: "Our Footscray cottage bathroom is decades old. Can you regrout without wrecking the original tiles?",
    a: "Yes — regrouting is exactly the job for that. We cut the old grout out carefully by hand around sound tiles and rebuild the joints; the original tiles stay right where they've always been. If some tiles are already loose, we'll show you before we start.",
  },
  {
    q: "We rent out our Yarraville place. Can regrouting be done between tenants?",
    a: "It's one of the most common reasons landlords call us. Most regrouting is done in a single visit, so it fits neatly between tenancies — the bathroom comes back watertight and presentable without a renovation holding the property up.",
  },
  {
    q: "Our Maribyrnong apartment balcony leaks into the unit below. Is that a grout problem?",
    a: "Often, yes — the joints at the door sill and balcony edges fail first, and water tracks through. We inspect the grout, silicone and tiles; if the membrane underneath has failed instead, we'll tell you straight, because that's a bigger conversation (and sometimes an owners-corporation one).",
  },
  {
    q: "How can I tell if it's the grout or the waterproofing?",
    a: "If water only appears after the shower runs and the grout or silicone is cracked, it's usually the surface. If walls or floors stay damp, tiles are loose or the leak continues after a reseal, the membrane may have failed. We check before we quote.",
  },
  {
    q: "Do you cover West Footscray, Seddon and Kingsville too?",
    a: "Yes — the whole area: Footscray, West Footscray, Yarraville, Seddon, Kingsville, Maribyrnong and Braybrook.",
  },
  {
    q: "Should I choose epoxy or cement grout for a busy bathroom?",
    a: "Epoxy grout resists water and staining far better than cement grout and never needs sealing, so it suits share houses and family bathrooms that get used all day. Cement grout with a penetrating sealer is the standard option and costs less. We'll tell you which suits each room.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/footscray#service",
      name: "Shower, tile and balcony regrouting in Footscray",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Footscray VIC 3011" },
        { "@type": "Place", name: "Seddon VIC 3011" },
        { "@type": "Place", name: "West Footscray VIC 3012" },
        { "@type": "Place", name: "Kingsville VIC 3012" },
        { "@type": "Place", name: "Yarraville VIC 3013" },
        { "@type": "Place", name: "Braybrook VIC 3019" },
        { "@type": "Place", name: "Maribyrnong VIC 3032" },
      ],
      url: "https://groutix.com/locations/melbourne/footscray",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Footscray", item: "https://groutix.com/locations/melbourne/footscray" },
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

export default function FootscrayPage({
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Footscray 3011</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Footscray: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower grout gone in a Footscray cottage? Balcony leaking in a Maribyrnong unit? We regrout showers, bathrooms and balconies across Footscray, Yarraville and Seddon — tiles stay in place. That&apos;s regrouting in Footscray, backed by a 10-year waterproof warranty on showers. Free quote.
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
                Regrouting for the Inner West&apos;s Old Homes &amp; New Units
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Footscray and its neighbours mix some of Melbourne&apos;s oldest housing with some of its newest. Victorian and Edwardian cottages in Seddon, Kingsville and Yarraville still run bathrooms that have been patched for decades — while up in Maribyrnong, apartment balconies along the river are failing in buildings barely ten years old. Different buildings, same weak point: the grout and silicone.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                There are a lot of rentals here too, and regrouting is the fix that makes sense for them — done in a single visit, no tiles ripped out, no weeks of renovation. Our grouting repairs in Footscray start with the joints, not the tiles: we cut out the failed grout and rebuild it, so the bathroom or balcony comes back watertight.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3011–3032", label: "Postcodes Covered", sub: "Footscray to Maribyrnong" },
                { value: "100+ Yrs", label: "The Oldest Homes We Regrout", sub: "Victorian-era cottages in the inner west" },
                { value: "Houses & Units", label: "Both Covered", sub: "Cottage bathrooms and apartment balconies" },
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
                Shower Regrouting in Footscray
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it — and the old silicone — in one visit, tiles left in place. In the inner west&apos;s older bathrooms that matters: the tiles are often the best thing in the room, and regrouting keeps them.
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
                Floor grout wears fastest in the rooms you use most. Tile regrouting in Footscray covers bathroom floors, laundries and kitchen splashbacks right through the house — cut out and replaced, without retiling.
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
                Leaking Shower Repair in Footscray
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In the inner west&apos;s older homes a leaking shower usually announces itself next door: swollen skirting, bubbling paint on the other side of the wall, floorboards going soft by the bathroom door. We find where the water is escaping, fix the grout and seals — and tell you straight if it&apos;s a membrane or plumbing problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Swollen Skirting", text: "Skirting or door frames swelling on the other side of the shower wall." },
                { title: "Bubbling Paint", text: "Paint blistering on the wall that backs onto the shower." },
                { title: "Soft Floorboards", text: "Timber going spongy near the bathroom door or along the shower wall." },
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
                This is apartment country as much as house country, and balconies are where the inner west leaks. Balcony regrouting in Footscray and Maribyrnong fixes failed grout and silicone at the door sill and edges before tiles loosen and water reaches the unit below.
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
                Areas We Cover Around Footscray
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Footscray 3011 plus West Footscray, Yarraville, Seddon, Kingsville, Maribyrnong and Braybrook. One page, one crew, same week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="west-footscray" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">West Footscray 3012</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in West Footscray</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Edwardian and post-war homes west of the station, many of them rentals or first homes mid-renovation. The pattern is consistent: original grout at end of life, silicone long gone. We regrout showers and floors so the renovation money can go elsewhere.
                </p>
              </div>
              <div id="yarraville" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Yarraville 3013</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Yarraville</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The village suburb — weatherboard and brick cottages with bathrooms full of character and grout full of cracks. Regrouting keeps the original bathroom intact and watertight, which is exactly what most Yarraville owners renovating in stages want.
                </p>
              </div>
              <div id="seddon" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Seddon 3011</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Seddon</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  A small pocket of cottages and townhouses between Footscray and Yarraville. Seddon bathrooms are typically compact and heavily used — shower grout, floor grout and silicone all done together, usually in one visit.
                </p>
              </div>
              <div id="kingsville" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Kingsville 3012</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Kingsville</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  One of the inner west&apos;s smallest suburbs, tucked between Seddon and West Footscray — older homes, ageing grout, same story. We regrout and reseal Kingsville showers, floors and laundries without pulling tiles.
                </p>
              </div>
              <div id="maribyrnong" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Maribyrnong 3032</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Maribyrnong</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Two suburbs in one: older homes up the hill, and the apartment towers along the river at Edgewater. In the towers it&apos;s balconies — failed joints letting water into the unit below. In the houses it&apos;s the usual end-of-life shower grout. We regrout both.
                </p>
              </div>
              <div id="braybrook" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Braybrook 3019</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Braybrook</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Post-war homes and big households out past Maidstone&apos;s edge — bathrooms that work hard every day. Braybrook showers and floors get the full treatment: failed grout cut out to depth, rebuilt properly, silicone renewed.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Maribyrnong", href: "/locations/melbourne/maribyrnong" },
                { name: "Ascot Vale", href: "/locations/melbourne/ascot-vale" },
                { name: "Flemington", href: "/locations/melbourne/flemington" },
                { name: "St Albans", href: "/locations/melbourne/st-albans" },
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
                Why the Inner West Chooses Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist — showers, floors, balconies, epoxy and silicone. The crew on your job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs — good tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Rental-Friendly", text: "Most jobs done in a single visit — easy between tenancies." },
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
                What Does Regrouting Cost in Footscray?
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
                Footscray Regrouting FAQs
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
              Tired Grout Anywhere in the Inner West?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting the inner west is what we do — we cover Footscray, West Footscray, Yarraville, Seddon, Kingsville, Maribyrnong and Braybrook, most jobs done in a single visit.
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
