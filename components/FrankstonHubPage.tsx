/* FrankstonHubPage — Pattern v2 hub build (2026-10-31).
   Page 39 of the location rebuild, Batch 4 (regionals) hub:
   /locations/frankston, covering Frankston South, Carrum Downs,
   Seaford, Mount Eliza and Langwarrin (client-confirmed
   service-area doc #41). HUB adaptation: the canonical URL is
   the region hub itself (no /melbourne/ level), the breadcrumb
   is Home > Locations > Frankston, and chips link to the
   region's own suburb pages under /locations/frankston/.
   "frankston-south", "seaford" and "langwarrin" are in the
   FRANKSTON gate list; Carrum Downs and Mount Eliza are covered
   as sections here, never linked.
   GSC 29 Jul–30 Oct 2026: frankston hub page 146 impressions
   (pos 29.7). The old /locations/melbourne/frankston spoke
   (94 impr) and /locations/melbourne/seaford (86 impr) redirect
   to this hub and /locations/frankston/seaford with this batch.
   Route title: "Regrouting Frankston | Shower, Tile & Balcony | Groutix"
   Built on the Albert Park v3 / Malvern pattern, Pattern v2
   (Edeel, 2026-10-31):
   - Hero: homepage photo background (dark-grey-shower-floor-
     regrouting.webp) with black gradient overlay + warranty
     seal row, QuoteFormV2 with defaultService="Shower
     Regrouting", HeroContactBadges CTAs.
   - Photo bands after the shower and balcony sections, a
     services strip before the FAQs and a mid-page CTA.
   - Copy: direct-answer / service-first, unique bayside angle
     (gateway to the Mornington Peninsula — established brick
     homes, Seaford's beachside streets, Mount Eliza's prestige
     homes, Langwarrin's family estates, and coastal moisture
     and mould working grout harder than inland).
   - No invented stats, jobs, reviews or prices. Rating badges use
     the live useGoogleRating() hook.
   Drop-in: add components/FrankstonHubPage.tsx on the main
   branch; hub route wiring is in the Batch 4 pack (see notes). */

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
    q: "Mould keeps coming back in our shower no matter how much we scrub. Why?",
    a: "Down here the sea air keeps grout damp, and mould doesn't sit on grout — it lives in it. Old cement grout is porous, so scrubbing cleans the surface while the mould stays in the joint. Regrouting removes the grout it lives in. For bayside showers we usually recommend epoxy grout: it doesn't absorb water, so mould has nowhere to take hold.",
  },
  {
    q: "Our home is single-storey. How would we even know the shower is leaking?",
    a: "Look beside the bathroom, not below: carpet that stays damp in the next room, skirting boards swelling, a musty smell that won't shift. Most Frankston homes are single-storey, so that's where the water shows. We trace it to the failed joint or seal and fix that — and if it's plumbing or a failed membrane, we'll tell you straight.",
  },
  {
    q: "Can you regrout more than one bathroom in a Mount Eliza home in one visit?",
    a: "Yes — ensuite, main bathroom and powder room done together, in matching grout, with one call-out. Bigger homes are exactly where a single visit pays off: one day of mess instead of three.",
  },
  {
    q: "Do you cover Seaford, Carrum Downs, Mount Eliza and Langwarrin as well?",
    a: "Yes — the whole area: Frankston, Frankston South, Carrum Downs, Seaford, Mount Eliza and Langwarrin.",
  },
  {
    q: "Salt air seems to eat the grout on our balcony. Can that be fixed?",
    a: "Usually, yes. Coastal weather works balcony joints hard — sun, salt and movement crack the grout and silicone at the sill and edges first. We cut the failed joints out, reseal and regrout with outdoor-grade grout. If the membrane underneath has failed, we'll say so before quoting anything.",
  },
  {
    q: "Should we choose epoxy or cement grout for a bayside home?",
    a: "Epoxy grout resists water and staining far better than cement grout and never needs sealing, which suits damp coastal bathrooms and busy family showers. Cement grout with a penetrating sealer is the standard option and costs less. We'll tell you which suits each room when we quote.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/frankston#service",
      name: "Shower, tile and balcony regrouting in Frankston",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Frankston VIC 3199" },
        { "@type": "Place", name: "Frankston South VIC 3199" },
        { "@type": "Place", name: "Carrum Downs VIC 3201" },
        { "@type": "Place", name: "Seaford VIC 3198" },
        { "@type": "Place", name: "Mount Eliza VIC 3930" },
        { "@type": "Place", name: "Langwarrin VIC 3910" },
      ],
      url: "https://groutix.com/locations/frankston",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Frankston", item: "https://groutix.com/locations/frankston" },
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

export default function FrankstonHubPage({
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
        {/* ═════════ 1. HERO — Pattern v2: homepage photo bg + warranty seal ═════════ */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className="relative mx-auto grid w-full max-w-[1460px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Frankston 3199</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Frankston: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower mould that keeps coming back in the sea air? Grout gone in a Langwarrin family bathroom? We regrout showers, bathrooms and balconies across Frankston, Seaford, Carrum Downs, Mount Eliza and Langwarrin — tiles stay in place. That&apos;s regrouting in Frankston, backed by a 10-year waterproof warranty on showers. Free quote.
              </p>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges rating={rating} />
              </div>
              <div className="flex items-center justify-center gap-3.5 border-t border-white/20 pt-6 text-left lg:justify-start">
                <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} className="h-[84px] w-[88px] shrink-0 object-contain" />
                <div>
                  <b className="block text-lg font-black leading-tight">10-Year Waterproof Warranty</b>
                  <span className="text-sm text-white/80">On every complete shower regrout</span>
                </div>
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
                Regrouting for the Bayside Gateway
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Frankston is where the city hands over to the Peninsula, and its bathrooms show it: established brick homes in Frankston and Frankston South, beachside streets in Seaford, big prestige homes in Mount Eliza, and family estates through Langwarrin and Carrum Downs. Add sea air and coastal moisture — grout that stays damp, mould that takes hold, joints that fail earlier than they would inland — and this coast keeps us busy.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our grouting repairs in Frankston start with the joints, not the tiles: we cut out the failed grout and rebuild it to proper depth, so the bathroom comes back watertight without a renovation — and you can see exactly how a job runs in{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                before you book.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3198–3930", label: "Postcodes Covered", sub: "Seaford to Mount Eliza" },
                { value: "Coastal", label: "Conditions Covered", sub: "Salt air and moisture that work grout hard" },
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
                Shower Regrouting in Frankston
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it — and the old silicone — in one visit, tiles left in place. Along the bayside strip the corner joints go first: damp air feeds mould deep into porous old grout, and no amount of scrubbing gets it back. Fresh grout to full depth does.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted over — including the mouldy corners scrubbing can't save.",
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

        {/* ═════════ 5. IMAGE BAND A — Pattern v2 ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/shower-regrouting-white-walls-dark-floor.webp" alt="Shower regrouting in Frankston — white wall tiles over a dark tiled shower floor" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">A shower stripped back to sound joints and rebuilt — the finish we aim for in every Frankston home.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/shower-floor-regrouting-hex-mosaic-tiles.webp" alt="Shower floor regrouting in Frankston with hex mosaic tiles" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Mosaic floors carry more joints than any other surface — every one cut out and rebuilt to depth.</figcaption>
              </figure>
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-base text-neutral-600">
              Want to see the finish up close? Browse{" "}
              <Link href="/gallery" className="font-bold text-accent hover:underline">our gallery</Link>{" "}
              of recent work, or read how a job runs step by step in{" "}
              <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>.
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
                Floor grout wears fastest in the rooms you use most — and bayside floors track in sand that grinds joints down faster still. Tile regrouting in Frankston covers bathroom floors, laundries and kitchen splashbacks right through the house — cut out and replaced, without retiling.
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
                Leaking Shower Repair in Frankston
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most homes in this area are single-storey, so a leaking shower shows up beside the bathroom, not below: swollen skirting in the hallway, damp carpet in the bedroom next door, a musty smell that won&apos;t shift. We find where the water is escaping, fix the grout and seals — and tell you straight if it&apos;s a membrane or plumbing problem instead.
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

        {/* ═════════ 8. BALCONIES, ALFRESCOS, OUTDOOR ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balconies, Alfrescos and Outdoor Tiles
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                On the coast, outdoor joints get the hardest life on the house — sun, salt air and sea breezes work the grout and silicone at the door sill and balcony edges until they crack. Balcony regrouting in Frankston fixes failed joints before tiles loosen and water gets underneath — and from a balcony, that water usually ends up in the room below.
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

        {/* ═════════ 9. IMAGE BAND B — Pattern v2 ═════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-10">
            <figure>
              <div className="relative aspect-[21/9] overflow-hidden rounded-sm">
                <Image src="/balcony-water-damage-regrouting-signs.webp" alt="Balcony regrouting in Frankston showing early water damage signs" fill sizes="100vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-neutral-500">Staining and lifting at the edges are the early warnings — catch the joints before the tiles go drummy.</figcaption>
            </figure>
          </div>
        </section>

        {/* ═════════ 10. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Frankston
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Frankston 3199 plus Frankston South, Carrum Downs, Seaford, Mount Eliza and Langwarrin. One page, one crew, same week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="frankston-south" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Frankston South 3199</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Frankston South</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Established leafy streets running toward Mount Eliza — bigger homes whose ensuites and main bathrooms are at regrout age together. We do the set in one visit so the finish matches across the house.
                </p>
              </div>
              <div id="carrum-downs" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Carrum Downs 3201</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Carrum Downs</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Family estates of 90s and 2000s homes — bathrooms hitting first-regrout age all at once. Shower, floor and laundry regrouted together, tiles left in place, one call-out.
                </p>
              </div>
              <div id="seaford" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Seaford 3198</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Seaford</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Beachside streets where the sea air keeps grout damp and mould busy. We regrout Seaford showers to full depth — epoxy grout is the usual pick here, because mould has nowhere to live in it.
                </p>
              </div>
              <div id="mount-eliza" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Mount Eliza 3930</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Mount Eliza</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Prestige homes on big blocks, often with three or more bathrooms. Ensuite, main bathroom and powder room regrouted in a single visit — matching grout, careful colour choices, tiles untouched.
                </p>
              </div>
              <div id="langwarrin" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Langwarrin 3910</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Langwarrin</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Family estates backing onto the flora reserve — homes whose bathrooms work hard every day. Shower regrouting, resealing and floor grout done together so there&apos;s only one visit to organise.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Frankston South", href: "/locations/frankston/frankston-south" },
                { name: "Seaford", href: "/locations/frankston/seaford" },
                { name: "Langwarrin", href: "/locations/frankston/langwarrin" },
                { name: "Casey", href: "/locations/casey" },
                { name: "Chelsea", href: "/locations/melbourne/chelsea" },
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

        {/* ═════════ 11. MID CTA — Pattern v2 ═════════ */}
        <section className="bg-[#0d1030] py-12">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[36px]">
              Get a Free Quote in Frankston
            </h2>
            <p className="text-base leading-relaxed text-white/85">
              Send us a photo of the grout and we&apos;ll price the job properly — no obligation, no pressure.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
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
                Why Frankston Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist — showers, floors, balconies, epoxy and silicone. The crew on your Frankston job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs — good tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Coastal Mould Know-How", text: "Damp joints and mould-prone corners are the first thing we look for on the coast." },
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
                What Does Regrouting Cost in Frankston?
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

        {/* ═════════ 14. SERVICES STRIP — Pattern v2 ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Frankston
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Every Groutix service is available from Seaford to Mount Eliza:
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/shower-regrouting", title: "Shower Regrouting", text: "Failed shower grout cut out and rebuilt, tiles in place." },
                { href: "/leaking-shower-repair", title: "Leaking Shower Repair", text: "We find where the water escapes and fix the joints and seals." },
                { href: "/tile-regrouting", title: "Tile Regrouting", text: "Floors, walls, laundries and splashbacks regrouted throughout." },
                { href: "/balcony-leak-repairs", title: "Balcony Leak Repairs", text: "Sill and edge joints resealed before water gets underneath." },
                { href: "/epoxy-grout", title: "Epoxy Grout", text: "Waterproof, stain-proof grout that never needs sealing." },
                { href: "/silicone-recaulking", title: "Silicone Recaulking", text: "Old silicone stripped and replaced — never layered over." },
                { href: "/small-tiling-jobs", title: "Small Tiling Jobs", text: "A few cracked or loose tiles replaced and regrouted." },
                { href: "/our-process", title: "Our Process", text: "How a Groutix job runs, from first photo to final wipe-down." },
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

        {/* ═════════ 15. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Frankston Regrouting FAQs
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
              Tired Grout Anywhere in Frankston or Seaford?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting the bayside gateway is what we do — we cover Frankston, Frankston South, Seaford, Carrum Downs, Mount Eliza and Langwarrin, most jobs done in a single visit.
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
