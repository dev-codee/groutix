/* LilydaleHubPage, Pattern v2 regional HUB build (2026-10-31).
   Batch 4 (regionals) hub page: /locations/lilydale, covering
   Mooroolbark, Mount Evelyn, Chirnside Park and Coldstream
   (client-confirmed service-area doc #39). This is a REGION HUB
   page, the canonical URL is the hub itself, and the areas
   chips link to the region's own suburb pages under
   /locations/lilydale/<suburb>.
   GSC 29 Jul–30 Oct 2026: lilydale hub page 138 impr with
   2 clicks at pos 18.7, modest volume, but the hub is the
   front door for the whole Yarra Ranges side of the patch.
   Route title: "Regrouting Lilydale | Shower, Tile & Balcony | Groutix"
   Meta description: "Shower, bathroom and balcony regrouting in
   Lilydale, Mooroolbark and Mount Evelyn. No tile removal,
   10 year waterproof warranty, ${reviewsText}. Free quote."
   Pattern v2 (hero photo + seal, image bands, services strip,
   mid CTA) on the Albert Park v3 / Malvern pattern per Edeel:
   - Hero: homepage hero photo (dark shower floor regrouting)
     with dark gradient overlay, QuoteFormV2 with
     defaultService="Shower Regrouting", HeroContactBadges CTAs,
     warranty seal row, pt-[140px] lg:pt-[160px].
   - Copy: direct-answer / service-first, unique Yarra Ranges
     angle (foothills weatherboard and brick homes, cold damp
     winters and condensation, Chirnside Park estates, Yarra
     Glen rural residential properties).
   - No invented stats, jobs, reviews or prices. Rating badges use
     the live useGoogleRating() hook.
   Drop in: add components/LilydaleHubPage.tsx on the main branch
   + wire it into the lilydale hub route (see notes file).
   NO redirects confirmed for the Lilydale hub. */

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
    q: "How much does shower regrouting cost in Lilydale?",
    a: "Most standard single showers cost about $550 to $1,500 to regrout. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    q: "A previous tiler botched our regrout. Can it be redone properly?",
    a: "Yes, and it is a common call around Lilydale. A botched job usually means new grout was smeared over old grout, so it cracks and lets water through within a year or two. We grind the failed grout out fully, rebuild the joints with quality grout, reseal every corner and check the shower properly before we finish.",
  },
  {
    q: "Will regrouting fix our leaking shower, or has the waterproofing failed?",
    a: "Regrouting fixes leaks caused by failed grout and silicone, which is most leaking showers. If the waterproofing system under the tiles has failed, regrouting alone will not hold, and we will tell you straight before any work starts rather than sell you a repair that cannot work.",
  },
  {
    q: "Why does mould keep coming back through the foothills winter?",
    a: "Lilydale and the Ranges get damp, cold winters, and cement grout is porous, so mould settles into the joints and cleaning only takes the surface off. Epoxy grout is non porous, so mould has nowhere to live, and it never needs sealing. For most foothills showers it ends the yearly mould cycle.",
  },
  {
    q: "Is epoxy grout worth it in a weatherboard home that moves?",
    a: "Usually, yes. Weatherboard and timber framed homes around Lilydale move more than brick homes, and the movement is handled at the corners and junctions with flexible silicone while the joints are rebuilt in epoxy. That combination gives you a waterproof, low maintenance shower that still allows the house to move.",
  },
  {
    q: "Do you cover the Yarra Ranges, Coldstream, Monbulk and Emerald?",
    a: "Yes. Groutix regrouts across Lilydale, Mooroolbark, Chirnside Park, Mount Evelyn and Coldstream, and through the Ranges townships of Emerald, Monbulk, Silvan, Macclesfield, Kangaroo Ground, Watsons Creek and Nutfield. Quotes are free, and the price is confirmed before any work starts.",
  },
  {
    q: "Can you regrout without removing the tiles?",
    a: "Yes. On most Lilydale jobs the tiles stay exactly where they are, which matters in older weatherboard and post war brick homes where the original tiling is worth keeping. Tiles only come up if one is already loose, cracked or drummy.",
  },
  {
    q: "The leak has damaged the timber under our shower. Is regrouting enough?",
    a: "Regrouting stops the water getting through, but rotted timber has to be made sound first, and we will tell you honestly if a builder needs to repair the structure before we regrout. What we will not do is seal over damage and call it fixed, because the leak would keep doing harm underneath.",
  },
  {
    q: "How long does a shower regrout take?",
    a: "Most showers are finished in a single visit. Before we start, we tell you exactly when the shower can be used again, so there are no surprises for a one bathroom home.",
  },
  {
    q: "How long will a regrout last?",
    a: "A proper regrout, with the old grout fully removed and the joints rebuilt, is made to last for years, and eligible complete shower regrouting is backed by our 10 year waterproof warranty. Surface jobs that skim new grout over old are the ones that fail early, which is why we never do them.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/lilydale#service",
      name: "Shower, tile and balcony regrouting in Lilydale",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Lilydale VIC 3140" },
        { "@type": "Place", name: "Mooroolbark VIC 3138" },
        { "@type": "Place", name: "Mount Evelyn VIC 3796" },
        { "@type": "Place", name: "Chirnside Park VIC 3116" },
        { "@type": "Place", name: "Coldstream VIC 3770" },
      ],
      url: "https://groutix.com/locations/lilydale",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Lilydale", item: "https://groutix.com/locations/lilydale" },
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

export default function LilydaleHubPage({
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
        {/* ═════════ 1. HERO, homepage photo hero pattern (v2) ═════════ */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className="relative mx-auto grid w-full max-w-[1460px] grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Lilydale 3140</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Shower Regrouting Lilydale
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Damp foothills winters and moving weatherboard homes are hard on grout in Lilydale and the Yarra Ranges. We regrout leaking and mouldy showers across Lilydale, Mooroolbark, Chirnside Park and Mount Evelyn, tiles in place, with a 10 year waterproof warranty on eligible shower regrouting.
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

        {/* ═════════ 3. LOCAL INTRO, direct answer ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for the Yarra Ranges Foothills
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Homes out here work their bathrooms hard. Cold, damp winters keep showers steamy and grout mouldy; weatherboard places flex through the seasons and crack rigid joints; and the older brick homes around Lilydale and Mooroolbark are carrying bathrooms decades past their first regrout. Ripping tiles out is rarely the answer, the joints are.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our grouting repairs in Lilydale start with the joints, not the tiles: we cut out the failed grout and rebuild it to proper depth, with flexible silicone where the house moves. You can see exactly how a job runs on{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                page, in a weatherboard cottage in Mount Evelyn or an estate home in Chirnside Park, the method is the same.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "3116 to 3796", label: "Postcodes Covered", sub: "Chirnside Park to Mount Evelyn" },
                { value: "Cold & Damp", label: "Foothills Winters", sub: "Condensation and mould are the usual grout killers out here" },
                { value: "1 Visit", label: "Ensuite, Bathroom & Laundry", sub: "Matching finish, no second call out" },
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
                Shower Regrouting in Lilydale
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Cracked, stained or mouldy shower grout? A shower regrout replaces it, and the old silicone, in one visit, tiles left in place. Out here the mould is usually the headline: black grout in a cold bathroom is grout that&apos;s already failing, so we cut it out rather than bleach over it, and epoxy grout stops it coming back.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted or bleached over.",
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
                  <Image src="/shower-regrouting-mouldy-grout-corner.webp" alt="Shower regrouting in Lilydale by Groutix, a mouldy grout corner cut out and rebuilt with fresh waterproof grout" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Black, mouldy corners are the foothills&apos; signature grout failure, the fix is cutting the failed grout out, not scrubbing it.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/walk in-shower-regrouting-wide-view.webp" alt="Walk-in shower regrouting in Lilydale, a wide tiled shower with renewed grout and resealed edges throughout" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">A walk in shower with every joint renewed, the finish we work to in Lilydale homes, weatherboard or brick.</figcaption>
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
                Floor grout wears fastest in the rooms you use most, and mud, boots and wet winters out here don&apos;t go easy on it. Tile regrouting in Lilydale covers bathroom floors, laundries and kitchen splashbacks right through the house, cut out and replaced, without retiling.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Bathroom Floors", text: "Tired, stained floor grout cut out and replaced so the whole room matches." },
                { title: "Laundries", text: "Floors and splashbacks that take water and muddy boots every day, regrouted to last." },
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
                Leaking Shower Repair in Lilydale
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most homes in the foothills are single storey, so a leaking shower shows up beside the bathroom, not below: swollen skirting in the hallway, damp carpet in the bedroom next door, a musty smell that won&apos;t shift. We find where the water is escaping, fix the grout and seals, and tell you straight if it&apos;s a membrane or plumbing problem instead.
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
                We check the grout, silicone and tiles for cracks, gaps and movement before we quote. If the waterproofing under the tiles has failed, regrouting alone won&apos;t fix it, and we&apos;ll say so. Under NCC 2022, shower walls must be waterproofed to at least 1,800 mm. More on{" "}
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
                Foothills weather works outdoor joints hard, frosty nights, wet winters and summer heat cycling through the same grout. Balcony regrouting in Lilydale fixes failed joints at the door sill and edges before tiles loosen and water gets underneath, and from a balcony or deck, that water usually ends up in the room below.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Balconies", text: "Failed grout and silicone at the door sill and edges cut out, resealed and regrouted with outdoor grade grout." },
                { title: "Alfresco Areas", text: "Washed out or cracked joints regrouted so outdoor tiles stop rocking and water stays out." },
                { title: "Porches and Entries", text: "The odd loose tile re fixed and joints regrouted where suitable, we tell you if it needs relaying." },
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
              Relaying a whole balcony or alfresco is a bigger job, we&apos;ll tell you if yours needs it. More on{" "}
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
                <Image src="/balcony-regrouting-tiles.webp" alt="Balcony regrouting in Lilydale, outdoor balcony tiles with fresh grout and resealed door sill and edges" fill sizes="100vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-neutral-500">Outdoor joints renewed before the winter rain finds them, the standard we work to on Lilydale balconies and alfrescos.</figcaption>
            </figure>
          </div>
        </section>

        {/* ═════════ 10. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Lilydale
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Lilydale 3140 plus Mooroolbark, Chirnside Park, Mount Evelyn and the Yarra Ranges townships of Coldstream, Monbulk and Emerald.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="mooroolbark" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Mooroolbark 3138</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Mooroolbark</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Established brick and weatherboard family homes, bathrooms original or renovated once, grout and silicone now failing together. Shower, floor and laundry regrouted in one visit, tiles left in place.
                </p>
              </div>
              <div id="mount-evelyn" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Mount Evelyn 3796</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Mount Evelyn</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The coldest, dampest corner of the hub, bush blocks, weatherboard cottages and bathrooms that grow mould faster than anywhere else we work. Failed grout out, epoxy in, movement joints finished in silicone.
                </p>
              </div>
              <div id="chirnside-park" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Chirnside Park 3116</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Chirnside Park</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Estate homes from the 80s through to today, the older builds are at deep regrout age and the newer ones are showing early joint wear. Ensuite, main bathroom and laundry done together for a matching finish.
                </p>
              </div>
              <div id="coldstream" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Coldstream 3770</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Coldstream</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Rural residential homes on bigger blocks at the start of wine country, where the bathroom often sits in an older farmhouse or a newer build beside one. Shower regrouting, resealing and floor grout across Coldstream, done in a single visit.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Mooroolbark", href: "/locations/lilydale/mooroolbark" },
                { name: "Mount Evelyn", href: "/locations/lilydale/mount-evelyn" },
                { name: "Chirnside Park", href: "/locations/lilydale/chirnside-park" },
                { name: "Coldstream", href: "/locations/lilydale/coldstream" },
                { name: "Lilydale Central", href: "/locations/lilydale/lilydale-central" },
                { name: "Emerald", href: "/locations/lilydale/emerald" },
                { name: "Macclesfield", href: "/locations/lilydale/macclesfield" },
                { name: "Monbulk", href: "/locations/lilydale/monbulk" },
                { name: "Silvan", href: "/locations/lilydale/silvan" },
                { name: "Doreen", href: "/locations/lilydale/doreen" },
                { name: "Hurstbridge", href: "/locations/lilydale/hurstbridge" },
                { name: "Kangaroo Ground", href: "/locations/lilydale/kangaroo-ground" },
                { name: "Nutfield", href: "/locations/lilydale/nutfield" },
                { name: "Watsons Creek", href: "/locations/lilydale/watsons-creek" },
                { name: "Yarra Glen", href: "/locations/yarra-glen" },
                { name: "Ringwood", href: "/locations/melbourne/ringwood" },
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
              Get a Free Quote in Lilydale
            </h2>
            <p className="text-base leading-relaxed text-white/85">
              Send a photo of your shower, bathroom or balcony and we&apos;ll come back with a fixed quote, no obligation.
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
                Why Lilydale Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist, showers, floors, balconies, epoxy and silicone. The crew on your Lilydale job does this work every day, in homes like yours.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs, sound tiles stay." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Mould Stopped at the Source", text: "Failed grout cut out and replaced, epoxy options that mould can't feed on." },
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
                What Does Regrouting Cost in Lilydale?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most standard single showers cost about $550 to $1,500 to regrout. The exact price is quoted free once we have seen the job, and these four things decide the number:
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
                Our Regrouting Services in Lilydale
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Shower Regrouting", href: "/shower-regrouting", text: "Failed shower grout and silicone cut out and replaced, tiles left in place." },
                { name: "Leaking Shower Repair", href: "/leaking-shower-repair", text: "We trace where the water is escaping and fix the joints and seals letting it through." },
                { name: "Tile Regrouting", href: "/tile-regrouting", text: "Bathroom floors, laundries and splashbacks regrouted without retiling." },
                { name: "Balcony Leak Repairs", href: "/balcony-leak-repairs", text: "Sill and edge joints resealed and regrouted before water gets underneath." },
                { name: "Epoxy Grout", href: "/epoxy-grout", text: "Waterproof, stain-resistant grout that never needs sealing, made for showers." },
                { name: "Silicone Recaulking", href: "/silicone-recaulking", text: "Old, mouldy silicone stripped out and replaced with a clean, sealed finish." },
                { name: "Small Tiling Jobs", href: "/small-tiling-jobs", text: "A few cracked or loose tiles replaced and regrouted, matched as closely as we can." },
                { name: "Our Process", href: "/our-process", text: "How a Groutix job runs, from first photo to final clean, no surprises." },
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
                Lilydale Regrouting FAQs
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
              Tired Grout Anywhere in the Lilydale Area?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting the Yarra Ranges foothills is what we do, we cover Lilydale, Mooroolbark, Mount Evelyn, Chirnside Park and Coldstream, most jobs done in a single visit.
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
