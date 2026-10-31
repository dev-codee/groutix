/* MelbourneCbdPage — v2 service-first build (2026-10-31).
   Location rebuild, Batch 3 (inner/SE):
   /locations/melbourne/melbourne-cbd, covering Southbank,
   Docklands, East Melbourne, West Melbourne, North Melbourne,
   Carlton, Carlton North, Parkville, Princes Hill and
   Kensington (client-confirmed service-area doc #16). All
   sub-slugs except "kensington" are in the gate list and are
   chipped; Kensington is mentioned in prose only — no card,
   no chip, never linked.
   GSC 29 Jul–30 Oct 2026: melbourne-cbd generic page 1,636
   impressions with 4 clicks at pos 17.3 — the most impressions
   of any location page in the whole rebuild programme.
   Route title: "Regrouting Melbourne CBD | Shower, Tile & Balcony | Groutix"
   Route meta: "Shower, bathroom and balcony regrouting in Melbourne
   CBD, Southbank and Docklands. Apartment specialists,
   ${reviewsText}. Free quote."
   Built on the Albert Park v3 / Malvern pattern per Edeel,
   Pattern v2 (2026-10-31):
   - Hero: homepage background photo (dark-grey shower floor)
     with black overlay, bg-black, warranty seal under the
     contact badges — same hero as the homepage.
   - Image bands after the shower and balcony sections, a mid
     CTA after the areas section, and a services strip before
     the FAQs.
   - Copy: direct-answer / service-first, apartments first
     (high-rise bathrooms and balconies in the CBD, Southbank
     and Docklands towers, compact bathrooms, rental wear,
     between-tenants refreshes), with the East Melbourne and
     Carlton terrace pockets as the second housing story.
   - No invented stats, jobs, reviews or prices. Rating badges
     use the live useGoogleRating() hook.
   Drop-in: add components/MelbourneCbdPage.tsx on the main
   branch + the route edits in
   app/locations/melbourne/[suburb]/page.tsx (see notes file).
   NO redirects confirmed for Melbourne CBD. */

"use client";

import Image from "next/image";
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
    q: "Our apartment balcony leaks into the unit below. Can regrouting fix it?",
    a: "If the leak is coming through failed grout and silicone at the door sill and edges — the most common cause in the towers — yes. We cut out the failed joints, reseal and regrout with outdoor-grade grout. If the membrane underneath has failed, we'll say so before quoting anything, because that changes the job entirely.",
  },
  {
    q: "Can you regrout a compact high-rise bathroom?",
    a: "Yes — compact apartment bathrooms are our daily work in the city. The tiles stay in place, the failed grout and silicone are replaced, and most apartment bathrooms are done in a single visit. Small doesn't mean rough: in a small bathroom every joint shows, so the finish has to be right.",
  },
  {
    q: "The unit below says water is coming through their ceiling. Could it be our shower?",
    a: "Very often, yes — in a tower, the bathroom above is the first suspect when a ceiling below stains. Failed grout and silicone let water through slowly for months before anyone sees it. We find where it's escaping and fix the grout and seals; if it's plumbing or a failed membrane, we'll tell you straight.",
  },
  {
    q: "Do you refresh rental bathrooms between tenants?",
    a: "Yes — owners and agents across Southbank, Docklands and the CBD use a regrout and reseal to make a rental bathroom look cared-for again between tenants. It's typically done in a single visit, and epoxy grout is worth considering for rentals: it resists stains and never needs sealing.",
  },
  {
    q: "Which areas do you cover from the CBD?",
    a: "The whole city pocket: the CBD itself, Southbank, Docklands, East Melbourne, West Melbourne, North Melbourne, Carlton, Carlton North, Parkville, Princes Hill and Kensington.",
  },
  {
    q: "Should I choose epoxy or cement grout for an apartment shower?",
    a: "Epoxy grout resists water and staining far better and never needs sealing — ideal for apartment showers that get daily use and for rentals between tenants. Cement grout with a penetrating sealer is the standard option and costs less. We'll tell you which suits your bathroom when we quote.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/melbourne-cbd#service",
      name: "Shower, tile and balcony regrouting in Melbourne CBD",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Melbourne CBD VIC 3000" },
        { "@type": "Place", name: "Southbank VIC 3006" },
        { "@type": "Place", name: "Docklands VIC 3008" },
        { "@type": "Place", name: "East Melbourne VIC 3002" },
        { "@type": "Place", name: "West Melbourne VIC 3003" },
        { "@type": "Place", name: "North Melbourne VIC 3051" },
        { "@type": "Place", name: "Carlton VIC 3053" },
        { "@type": "Place", name: "Carlton North VIC 3054" },
        { "@type": "Place", name: "Parkville VIC 3052" },
        { "@type": "Place", name: "Princes Hill VIC 3054" },
        { "@type": "Place", name: "Kensington VIC 3031" },
      ],
      url: "https://groutix.com/locations/melbourne/melbourne-cbd",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Melbourne CBD", item: "https://groutix.com/locations/melbourne/melbourne-cbd" },
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

export default function MelbourneCbdPage({
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
        {/* ═════════ 1. HERO — homepage pattern v2 (photo bg + warranty seal) ═════════ */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className="relative mx-auto grid w-full max-w-[1460px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Melbourne CBD 3000</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Melbourne CBD: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Apartment shower grout gone dark? Balcony leaking into the unit below? We regrout showers, bathrooms and balconies across the CBD, Southbank and Docklands — and the terrace pockets of East Melbourne and Carlton. Tiles stay in place. That&apos;s regrouting in Melbourne CBD, backed by a 10-year waterproof warranty on showers. Free quote.
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
                Regrouting for the City&apos;s Apartments — and Its Old Terraces
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most bathrooms in the city sit in towers: compact apartment ensuites in the CBD, Southbank and Docklands, with balconies stacked above living spaces all the way up. Their grout works hard and fails quietly — and when it fails, the unit below finds out first. Around the edges, the terrace pockets through East Melbourne, Carlton, North Melbourne and out to Kensington carry the other city story: period tiling worth keeping in houses a century older than the towers.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our grouting repairs in Melbourne CBD start with the joints, not the tiles: we cut out the failed grout joint by joint and rebuild it to proper depth — in a fortieth-floor Southbank ensuite or an East Melbourne terrace, the method is the same. You can see exactly how a job runs in{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>, from the first photo you send us to the final cure.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3000–3054", label: "Postcodes Covered", sub: "CBD to Parkville and Princes Hill" },
                { value: "High-Rise", label: "Apartments a Specialty", sub: "Compact bathrooms and tower balconies" },
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
                Shower Regrouting in Melbourne CBD
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it — and the old silicone — in one visit, tiles left in place. Apartment bathrooms are compact, so there&apos;s nowhere for tired grout to hide: fresh joints are what make a small ensuite look new again, without a renovation a tower bathroom never needs.
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

        {/* ═════════ IMAGE BAND A — Pattern v2 ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/walk-in-shower-regrouting-glass-screen-view.webp" alt="Walk-in shower regrouting behind a glass screen in a Melbourne CBD apartment" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">A walk-in shower behind glass — crisp new grout lines are what make the whole screen wall look new.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/shower-regrouting-tiled-interior.webp" alt="Shower regrouting inside a tiled apartment bathroom in the Melbourne CBD" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">A tiled shower interior after regrouting — no tiles removed, no renovation, no weeks without a bathroom.</figcaption>
              </figure>
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              Want to see the finish up close? Browse{" "}
              <Link href="/gallery" className="font-bold text-accent hover:underline">our gallery</Link>{" "}
              of recent regrouting work, or read{" "}
              <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
              to see how a job runs from first photo to final cure.
            </p>
          </div>
        </section>

        {/* ═════════ 5. FLOORS, LAUNDRIES, KITCHENS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Kitchens
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Floor grout wears fastest in the rooms you use most. Tile regrouting in Melbourne CBD covers apartment bathroom floors, internal laundries and kitchen splashbacks — and over in East Melbourne and Carlton, the tessellated terrace floors that deserve to be kept. Cut out and replaced, without retiling.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Bathroom Floors", text: "Tired, stained floor grout cut out and replaced so the whole room matches." },
                { title: "Internal Laundries", text: "The apartment laundry floor and splashback that take water every day, regrouted to last." },
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
                Leaking Shower Repair in Melbourne CBD
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a tower, a leaking shower usually announces itself one floor down first: the unit below reports a stain spreading on their ceiling, paint bubbling, plaster going soft. We find where the water is escaping, fix the grout and seals — and tell you straight if it&apos;s a membrane or plumbing problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Stain in the Unit Below", text: "A stain or bubbling paint reported on the ceiling of the unit or room below your bathroom." },
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

        {/* ═════════ 7. BALCONIES, ALFRESCOS, OUTDOOR ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balconies, Alfrescos and Outdoor Tiles
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Almost every apartment in the city has a balcony, and almost every balcony sits over someone&apos;s living space — yours or the unit below&apos;s. Up high, wind drives rain straight into the joints, and the grout and silicone at the door sill and edges are usually the first to fail. Balcony regrouting in Melbourne CBD fixes failed joints before tiles loosen, water gets underneath and the ceiling below starts to stain.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Apartment Balconies", text: "Failed grout and silicone at the door sill and edges cut out, resealed and regrouted with outdoor-grade grout." },
                { title: "Terrace Balconies", text: "The East Melbourne and Carlton pattern: balcony joints over living rooms, resealed before the ceiling below pays for it." },
                { title: "Porches and Entries", text: "Tessellated porch and entry tiles kept — joints regrouted, the odd loose tile re-fixed where suitable." },
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

        {/* ═════════ IMAGE BAND B — Pattern v2 ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <figure>
              <div className="relative aspect-[21/9] overflow-hidden rounded-sm">
                <Image src="/balcony-regrouting-herringbone-tiles.webp" alt="Balcony regrouting on herringbone tiles in a Melbourne CBD apartment" fill sizes="100vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-neutral-500">Herringbone balcony tiles regrouted — the pattern stays exactly as it was, the leaks stop.</figcaption>
            </figure>
          </div>
        </section>

        {/* ═════════ 8. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Melbourne CBD
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Melbourne CBD 3000 plus Southbank, Docklands, East Melbourne, West Melbourne, North Melbourne, Carlton, Carlton North, Parkville and Princes Hill. One page, one crew, same week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="southbank" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Southbank 3006</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Southbank</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The tower suburb — hundreds of apartment bathrooms and balconies stacked over the Arts Precinct. Ensuites regrouted in a single visit, balcony sills resealed before the unit below reports a stain.
                </p>
              </div>
              <div id="docklands" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Docklands 3008</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Docklands</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Waterfront towers where wind-driven rain tests every balcony joint. We regrout Docklands bathrooms and balconies with outdoor-grade grout that stands up to the weather off the bay.
                </p>
              </div>
              <div id="east-melbourne" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">East Melbourne 3002</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in East Melbourne</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Grand Victorian terraces by the Fitzroy Gardens — period bathrooms where the tiles are the feature and the grout is the failure. We regrout joint by joint so the original work survives.
                </p>
              </div>
              <div id="carlton" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Carlton 3053</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Carlton</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Terraces, student rentals and share houses around Lygon Street — hard-used bathrooms refreshed with a regrout and reseal, and period tiles kept wherever they&apos;re sound.
                </p>
              </div>
              <div id="north-melbourne" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">North Melbourne 3051</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in North Melbourne</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Workers&apos; cottages and warehouse conversions with compact bathrooms at deep regrout age. Shower, floor and laundry done together so there&apos;s only one visit to organise.
                </p>
              </div>
              <div id="parkville" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Parkville 3052</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Parkville</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Prestigious terraces by Royal Park plus hospital and university rental stock — owner bathrooms regrouted with period care, rentals refreshed between tenants.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Southbank", href: "/locations/melbourne/southbank" },
                { name: "Docklands", href: "/locations/melbourne/docklands" },
                { name: "East Melbourne", href: "/locations/melbourne/east-melbourne" },
                { name: "West Melbourne", href: "/locations/melbourne/west-melbourne" },
                { name: "North Melbourne", href: "/locations/melbourne/north-melbourne" },
                { name: "Carlton", href: "/locations/melbourne/carlton" },
                { name: "Carlton North", href: "/locations/melbourne/carlton-north" },
                { name: "Parkville", href: "/locations/melbourne/parkville" },
                { name: "Princes Hill", href: "/locations/melbourne/princes-hill" },
                { name: "Richmond", href: "/locations/melbourne/richmond" },
                { name: "Fitzroy", href: "/locations/melbourne/fitzroy" },
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

        {/* ═════════ MID CTA — Pattern v2 ═════════ */}
        <section className="bg-[#0d1030] py-12">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[36px]">
              Get a Free Quote in Melbourne CBD
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo of the shower, floor or balcony and we&apos;ll come back with a fixed quote — no obligation, no call-out fee.
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

        {/* ═════════ 9. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why Melbourne CBD Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist — showers, floors, balconies, epoxy and silicone. The crew on your city job does this work every day, in apartments and terraces like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs — apartment and period tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Apartment Ready", text: "Compact bathrooms and tower balconies — tidy work, done in one visit." },
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
                What Does Regrouting Cost in Melbourne CBD?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Short answer: we give you a fixed quote once we&apos;ve seen the job — every apartment and terrace is different. These four things decide the number:
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

        {/* ═════════ SERVICES STRIP — Pattern v2 ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Melbourne CBD
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                One specialist crew for every grout and silicone job in the apartment — pick the service that matches your problem.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/shower-regrouting", title: "Shower Regrouting", text: "Failed shower grout cut out and rebuilt to depth, tiles left in place." },
                { href: "/leaking-shower-repair", title: "Leaking Shower Repair", text: "We find where the water is escaping and fix the grout and seals." },
                { href: "/tile-regrouting", title: "Tile Regrouting", text: "Floors, laundries and splashbacks regrouted without retiling." },
                { href: "/balcony-leak-repairs", title: "Balcony Leak Repairs", text: "Failed balcony joints resealed and regrouted before water gets in." },
                { href: "/epoxy-grout", title: "Epoxy Grout", text: "Stain-proof, waterproof grout that never needs sealing." },
                { href: "/silicone-recaulking", title: "Silicone Recaulking", text: "Old silicone stripped out and replaced, never layered over." },
                { href: "/small-tiling-jobs", title: "Small Tiling Jobs", text: "A few cracked or loose tiles replaced and regrouted to match." },
                { href: "/our-process", title: "Our Process", text: "How a Groutix job runs, from first photo to final cure." },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="rounded-sm border border-neutral-200 bg-white p-5 font-bold text-neutral-900 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.title}
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-neutral-600">{s.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 11. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Melbourne CBD Regrouting FAQs
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
              Tired Grout in the City or Southbank?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting the city is what we do — we cover the CBD, Southbank, Docklands, East Melbourne, Carlton and the inner fringe, most jobs done in a single visit.
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
