/* WilliamstownNorthPage — Phase 1 west build #5 (2026-11-24).
   West region programme, page 5 of 5 (Phase 1 complete with this one):
   /locations/melbourne/williamstown-north.
   GATE: "williamstown-north" IS in lib/locationRoutes.ts — no fix needed.
   GSC (live, last 3 months): 0 clicks / 384 impressions / avg pos 35.1.
   Diagnosis: dilution, BUT this page holds a real local cluster the
   other Phase 1 pages did not: grout cleaning williamstown 15 imp
   @ 24.9, tile restoration williamstown 11 @ 17.0, williamstown
   north tiler 2 @ 15.5, tiler williamstown north 1 @ 13.0 — about
   35 impressions at positions 12 to 36, already attached to THIS url.
   The page serves them honestly with a cleaning versus regrouting
   decision section and proper tile regrouting depth.
   Primary keyword: shower regrouting williamstown north.
   Secondary: tile regrouting williamstown north, grout repair
   williamstown north, leaking shower repair williamstown north.
   NOT targeted: plain williamstown head terms (the Williamstown page
   owns the suburb name), shower regrouting melbourne (homepage),
   malvern and caulfield scatter (their own pages).
   Local entities: postcode 3016, City of Hobsons Bay, Kororoit Creek
   and Kororoit Creek Road, Melbourne Road, Champion Road, Newport
   next door, the bay. Core angle: an older housing stock of
   weatherboard cottages and brick homes, plus coastal wear — salt
   air and damp sea air perish silicone and grout sooner than inland.
   PATTERN: deliberately DIFFERENT from the Maribyrnong to Melton
   pages, per Edeel's instruction of 24 Nov 2026 (no repeated content
   pattern, no cannibalisation). New order: hero, signs your grout is
   failing, local intro, cleaning versus regrouting decision section,
   shower, Real Work, leaking, services strip mid page, floors,
   balconies and verandahs, areas, mid CTA, why, cost, FAQ, final CTA.
   No stats strip, no full width balcony image band.
   Images: ALL already live in public/ — no uploads in this pack.
   Sliders use the latest before/after pairs built 19–20 Nov 2026,
   per Edeel. Rating fully dynamic via useGoogleRating() (301 reviews).
   No invented jobs, reviews or locations. The only price figure is the
   $550 to $1,500 range already live in the site cost FAQs, mirrored
   word for word in FAQ 1.
   Route title: "Shower Regrouting Williamstown North | Free Quote"
   (route file is delivered whole in this pack). */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, ChevronDown } from "lucide-react";
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
    q: "How much does shower regrouting cost in Williamstown North?",
    a: "Most standard single showers cost about $550 to $1,500 to regrout. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    q: "Does living near the bay really wear grout and silicone out faster?",
    a: "Yes. Salt air and damp sea air are harder on seals than inland air, and silicone in a bayside bathroom usually perishes sooner: it hardens, shrinks back from the edges and lets mould in earlier. It is one reason Williamstown North showers often need attention before a same age bathroom further inland. Epoxy grout stands up to the coastal damp far better than cement grout, which is why we recommend it here.",
  },
  {
    q: "Can you just clean our grout instead of regrouting it?",
    a: "If the grout is sound and only surface stained, yes, a proper clean can be all it needs, and we will tell you that from a photo. But cleaning cannot mend grout that is cracked, crumbling or missing, and it cannot clean mould out of silicone, because the mould grows inside it. When joints have failed, cleaning is money down the drain: the honest fix is to cut the failed grout out and regrout. Send us a photo and we will tell you plainly which one yours is.",
  },
  {
    q: "Our cottage is more than 100 years old. Can its bathroom be regrouted?",
    a: "Usually, yes. Williamstown North has cottages whose tiles cannot be matched or replaced anywhere, and regrouting is how those bathrooms survive: the failed grout is cut out carefully by hand around the old tiles, the joints are rebuilt, and nothing original is disturbed. If tiles have gone loose or drummy, or the boards under them have rotted, we will show you what we found before quoting, because joints alone cannot fix structure.",
  },
  {
    q: "Why does the mould in our shower keep coming back?",
    a: "Because mould grows into silicone, not just on it, so no amount of scrubbing cleans it out, and failed grout lets moisture sit in the joint where mould feeds. Bayside damp makes it worse. The lasting fix is to strip the silicone out completely, cut out the failed grout, and rebuild the joints with epoxy grout and fresh silicone. A fan that runs while you shower and a little while after helps it stay away.",
  },
  {
    q: "Can you put new grout over the old grout?",
    a: "No, and it is the shortcut that fails fastest. New grout does not bond properly to old grout, so a thin layer smeared over the top looks fine for a few months, then lifts and cracks along the same lines. We cut the failed grout out to proper depth first, so the new grout has a clean tile edge to grip.",
  },
  {
    q: "How long does regrouting last, and when can we use the shower again?",
    a: "A proper epoxy regrout lasts well beyond ten years in a domestic shower and never needs sealing. Silicone is the wear item and usually needs renewing after some years of daily use, sooner in bayside air. After the job, silicone needs 24 hours to cure and epoxy grout needs 4 days to cure fully before heavy use, and we confirm the exact timing for your bathroom before we leave.",
  },
  {
    q: "Do you cover Williamstown, Newport and Altona North as well?",
    a: "Yes. This page covers Williamstown North 3016, and the same crew works through Williamstown, Newport, Altona North and Brooklyn, plus the rest of Hobsons Bay. Williamstown has its own page on this site. One visit can cover the shower, the bathroom floor and the verandah tiles together, so the finish matches through the house.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/williamstown-north#service",
      name: "Shower, tile and balcony regrouting in Williamstown North",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Williamstown North VIC 3016" },
      ],
      url: "https://groutix.com/locations/melbourne/williamstown-north",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Williamstown North", item: "https://groutix.com/locations/melbourne/williamstown-north" },
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

export default function WilliamstownNorthPage({
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Williamstown North 3016</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                Regrouting in Williamstown North: Showers, Bathrooms &amp; Balconies
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Shower grout gone grey or silicone peeling in a Williamstown North home? Bayside air is hard on seals, and the cottages and brick homes north of the railway line feel it first. We regrout showers, bathrooms and balconies across Williamstown North, and the tiles stay in place. Waterproof epoxy grout, most jobs done in a single visit, and a 10 year waterproof warranty on complete shower regrouts. Free quote.
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

        {/* ═════════ 2. SIGNS YOUR GROUT IS FAILING (problem led opener) ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Four Signs Your Grout and Silicone Are Failing
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Grout rarely fails all at once. Around Williamstown North it goes the same way in most bathrooms, and the earlier you catch it, the smaller the job. If any of these sound familiar, the joints are asking for help.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Silicone Peeling or Black", text: "Edges lifting, shrinking back, or mould that no scrub brings off. In bayside air this is usually the first thing to go." },
                { title: "Grout Cracked or Missing", text: "Lines crumbling in the shower floor corners or around the base, leaving gaps water can sit in." },
                { title: "Grout Gone Dark for Good", text: "Joints that stay grey or brown a day after cleaning are stained through, not dirty on the surface." },
                { title: "A Musty Smell Next Door", text: "The room beside the bathroom smelling damp, or paint and skirting starting to swell. Water is already through." },
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
              Not sure which stage yours is at? Send us a photo and we will tell you honestly, cleaning, resealing or regrouting. The quote is free either way.
            </p>
          </div>
        </AnimatedSection>

        {/* ═════════ 3. LOCAL INTRO — a working suburb on the bay ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for Williamstown North Homes
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Williamstown North is the working half of Williamstown: weatherboard cottages and brick homes on quiet streets, with the warehouses and workshops of the Kororoit Creek Road side never far away. Its houses are older than most of the west, and plenty of its bathrooms are original, or close to it.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Two things shape a bathroom here. The first is age: tiles laid decades ago, often by hand, that cannot be matched today and deserve to stay. The second is the coast. Salt air drifts in off the bay, damp sits in the joints longer, and silicone perishes years sooner than it does inland. Regrouting answers both: the failed grout is cut out joint by joint and rebuilt in epoxy, the seals are renewed, and the room is watertight again without a renovation. You can see exactly how a job runs on{" "}
                <Link href="/our-process" className="font-bold text-accent hover:underline">our process</Link>{" "}
                page.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is rated {gr.ratingLabel} from {gr.countLabel} Google reviews across Melbourne, and the same crew that works the bay side suburbs will be on your Williamstown North job.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: "3016", label: "Postcode Covered", sub: "Melbourne Road to Kororoit Creek" },
                { value: "Bay Side", label: "Coastal Homes", sub: "Seals renewed for salt air" },
                { value: "100+ Years", label: "Oldest Cottages", sub: "Original tiles kept in place" },
                { value: "10 Year", label: "Waterproof Warranty", sub: "On complete shower regrouts" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-neutral-200 bg-white px-6 py-8 text-center">
                  <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                  <p className="mt-2 text-sm font-bold text-neutral-900">{s.label}</p>
                  <p className="text-[13px] text-neutral-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 4. CLEANING OR REGROUTING? — the honest decision ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Grout Cleaning or Regrouting? How to Tell
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Plenty of people find this page looking for grout cleaning or tile restoration in the Williamstown area, so here is the honest line between them. They are not the same job, and paying for the wrong one helps nobody.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">Cleaning Is Enough When</h3>
                <ul className="space-y-3">
                  {[
                    "The grout is hard, whole and only surface stained.",
                    "The silicone is still soft, sealed and mould free.",
                    "No joints are cracked, sunken or missing.",
                    "The tiles feel firm everywhere you press.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-base text-neutral-700">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white">✓</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-base leading-relaxed text-neutral-600">
                  Sound grout that is only dirty does not need us. A proper clean, and resealing cement grout afterwards, is the right spend.
                </p>
              </div>
              <div className="rounded-sm border-2 border-accent bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">It Needs Regrouting When</h3>
                <ul className="space-y-3">
                  {[
                    "Grout is cracked, crumbling or gone in the corners.",
                    "Mould lives inside the silicone and always returns.",
                    "Water has reached the wall or the floor next door.",
                    "A past repair smeared new grout over old, and it is lifting.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-base text-neutral-700">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[11px] font-black text-neutral-900">!</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-base leading-relaxed text-neutral-600">
                  Failed joints cannot be cleaned back to life. Cutting them out and regrouting is what actually restores the tiles, and it is the job we quote, free, from a photo.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 5. SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in Williamstown North
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a Williamstown North bathroom the tiles are usually worth keeping: solid, well laid, and often impossible to match today. It is the grout between them that has crumbled, stained and let the damp in. A shower regrout replaces the grout and the old silicone in one visit, with every tile left exactly where it is.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, never smeared over.",
                    "Shower, bathroom, floor and wall grout done together if you want one matching finish.",
                    "Old silicone stripped out and replaced, never layered over.",
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link>, which we recommend in bayside air.</>,
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
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Real Work</p>
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Before and After: Real Regrouting Results
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Real Groutix jobs in Melbourne homes, not stock photos. Drag the slider to see the after. This is the standard we bring to every Williamstown North bathroom.
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
                  <Image src="/walk-in-shower-regrouting-wide-view.webp" alt="Shower regrouting in Williamstown North by Groutix, a wide shower with freshly regrouted tiles and sealed edges" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">The finish we work to in every Williamstown North bathroom: clean joints, sealed edges, original tiles untouched.</figcaption>
              </figure>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src="/tile-regrouting-dark-floor-tiles-close-up.webp" alt="Tile regrouting in Williamstown North, dark floor tiles with worn grout replaced joint by joint" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-2 text-sm text-neutral-500">Floor grout up close: cracked and sunken joints are the first path for water to get under the tiles.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ═════════ 8. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Williamstown North
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In an older Williamstown North home a leaking shower rarely announces itself with a drip. It shows up as a wall that will not dry, a musty smell in the room next door, or skirting quietly swelling beside the bathroom. Older homes often have no modern membrane under the tiles, and bayside damp finds every failed joint, so sound grout and silicone are where the fix usually starts.
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
                Before we quote, we check the grout, silicone and tiles for cracks, gaps and movement, and we look at what the water has reached. If the leak has damaged the wall or floor structure, joints alone will not fix it, and we will say so. More on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>
                , and in our guides to a{" "}
                <Link href="/guides/shower-still-leaking-after-regrouting" className="font-bold text-accent hover:underline">shower still leaking after regrouting</Link>{" "}
                and a{" "}
                <Link href="/guides/shower-leaking-into-ceiling-below" className="font-bold text-accent hover:underline">shower leaking into the ceiling below</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 9. SERVICES STRIP (mid page in this pattern) ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting Services in Williamstown North
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
                  className="rounded-sm border border-neutral-200 bg-neutral-50 p-5 font-bold text-neutral-900 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.name}
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-neutral-600">{s.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 10. FLOORS, LAUNDRIES, SPLASHBACKS ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile Regrouting for Floors, Laundries and Splashbacks
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Williamstown North homes put tiles where water works hardest: bathroom floors, laundries and kitchen splashbacks. Those joints darken and crack long after the tiles themselves have settled in for good. Tile regrouting in Williamstown North covers all of them, cut out and replaced without retiling.
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
                  className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6"
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

        {/* ═════════ 11. BALCONIES, VERANDAHS, COURTYARDS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balcony, Verandah and Courtyard Regrouting
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Outdoor tiles in Williamstown North sit on cottage verandahs, in courtyards, and on the balconies of the newer units. Sea air, sun and years of movement open the joints at the edges first, and once water gets under outdoor tiles it tracks towards the house. Regrouting renews those joints before tiles loosen and stains start showing inside.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Verandahs", text: "Cracked verandah joints on the old cottages regrouted so the front of the house looks kept again." },
                { title: "Balconies", text: "Failed grout and silicone at the sill and edges cut out, resealed and regrouted with outdoor grade grout." },
                { title: "Courtyards and Entries", text: "The odd loose tile made good and joints regrouted where suitable. We will tell you if relaying is the honest answer." },
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

        {/* ═════════ 12. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Williamstown North
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Williamstown North 3016, end to end, from the residential streets to the creek side, plus the neighbouring suburbs below. One crew, one visit, same standard.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="williamstown-north-cottages" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">The Residential Streets · Melbourne Road</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in the Older Homes</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Weatherboard cottages and brick homes, many with bathrooms that have served for decades. This is where regrouting earns its keep: the tiles are irreplaceable, the grout is spent, and one careful visit brings the room back without a renovation.
                </p>
              </div>
              <div id="williamstown-north-kororoit" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Kororoit Creek Side · Kororoit Creek Road</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting Near the Creek</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Units, townhouses and worker cottages along the industrial edge. Owners and agents here book regrouting between tenancies and before sales, when a tired shower is the one thing dating an otherwise tidy place.
                </p>
              </div>
              <div id="williamstown-north-champion" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Champion Road · The Newport Border</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting Toward Newport</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Homes on the Newport side of the suburb, a short run from the Newport workshops and the station. First silicone renewals and grout repairs here are caught early, and caught early it is the cheapest regrout there is.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Williamstown", href: "/locations/melbourne/williamstown" },
                { name: "Altona North", href: "/locations/melbourne/altona-north" },
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

        {/* ═════════ 13. MID CTA ═════════ */}
        <section className="bg-[#0d1030] py-12">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-2xl font-black leading-tight">
              Get a Free Quote in Williamstown North
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

        {/* ═════════ 14. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why Williamstown North Owners Choose Groutix
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix is a Melbourne regrouting specialist: showers, floors, balconies, epoxy and silicone. The crew on your Williamstown North job does this work every day, in homes of every age.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs, so sound tiles stay where they are." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Built for Bayside Air", text: "Epoxy grout and fresh silicone, the combination that stands up to salt air and coastal damp best." },
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

        {/* ═════════ 15. COST (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in Williamstown North?
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

        {/* ═════════ 16. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Williamstown North Regrouting FAQs
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
              Tired Grout Anywhere in Williamstown North?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. Regrouting Williamstown North is what we do, from the cottages near Melbourne Road to the creek side streets, with most jobs done in a single visit.
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
