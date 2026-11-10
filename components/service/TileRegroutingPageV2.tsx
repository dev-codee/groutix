"use client";

// Redesigned /tile-regrouting page (2026-11-04): shower page pattern.
// Results with real before and after sliders, text sign cards, rooms,
// grout types table, process with photo, related services. Visible copy
// carries no hyphens in compound words. FAQs and FAQ schema stay in
// lib/tileRegroutingContent (route adds the schema).
// FINAL (2026-11-06): real alt text on the slider images (SEO) only.
// IMAGES ALIGNED (2026-11-06, Edeel selected the photos himself): wall
// slider = Job 4 bath wall pair, floor slider = Job 20 corner pair,
// hero panel + process photo = Job 20 finished shower photo (hero
// version carries no watermark). Result block headings, text and alts
// rewritten to describe these exact photos. Schema: none in this
// component on purpose, app/[slug]/page.tsx emits Service + FAQPage
// for this slug (live check 2026-11-06: exactly 1 Service block).
// CORRECTED 2026-11-06: the Service schema block first added here was
// removed again, because app/[slug]/page.tsx already emits the Service +
// FAQPage schema for this slug. Adding it in the component would have
// duplicated the Service entity (2 blocks live). Leaking/Epoxy keep
// theirs: their dedicated routes emit FAQ only (Epoxy: none), so the
// component block is their only Service schema.

import Image from "next/image";
import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { Check, Droplets, Footprints, Grid2x2, Home, Paintbrush, Phone, ShieldCheck, Sparkles, Utensils, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { tileGroutRows, tileRegroutingFaqs } from "@/lib/tileRegroutingContent";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, heroWrap, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";

type ResultBlock = { heading: string; text: string; before: string; after: string; beforeAlt: string; afterAlt: string };
type IconCard = { title: string; body: ReactNode; Icon: ComponentType<{ className?: string }> };

const card = `${box} p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`;

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${box} border-l-4 border-l-[#FBBC04] p-6`}>
      <h3 className={cardTitle}>{title}</h3>
      <p className={cardText}>{children}</p>
    </div>
  );
}

/* Image card styled like the homepage "shower grout problems" cards. */

function SignSlider({ before, after, beforeAlt, afterAlt, title }: { before: string; after: string; beforeAlt: string; afterAlt: string; title: string }) {
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const sizes = "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw";
  return (
    <div className="relative aspect-[4/5] select-none overflow-hidden bg-slate-200">
      <div className="absolute inset-0">
        <Image src={before} alt={beforeAlt} fill sizes={sizes} className="object-cover" />
      </div>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <Image src={after} alt={afterAlt} fill sizes={sizes} className="object-cover" />
      </div>
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
  );
}


function IconBox({ c, accent = "border-t-[#001F97]" }: { c: IconCard; accent?: string }) {
  const { Icon } = c;
  return (
    <div className={`${box} border-t-4 ${accent} p-6`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <h3 className={`${cardTitle} mt-4`}>{c.title}</h3>
      <p className={cardText}>{c.body}</p>
    </div>
  );
}

const resultBlocks: ResultBlock[] = [
  {
    heading: "White Wall Tiles and a Dark Tiled Floor, Regrouted and Resealed",
    text: "Grime had built up in the corner joints of this shower, and the grout lines across the white wall tiles and the dark floor tiles had worn thin. We removed the failed grout, regrouted the walls and floor and resealed the corner and floor edges, all with the original tiles left in place.",
    before: "/tile-regrouting-floor-before.webp",
    after: "/tile-regrouting-floor-after.webp",
    beforeAlt: "White wall tiles and dark floor tiles with worn grout and grime in the corner joints before tile regrouting in Melbourne",
    afterAlt: "The same tiled shower corner after tile regrouting in Melbourne, fresh grout lines on the walls and floor and resealed edges",
  },
  {
    heading: "Tired Subway Wall Tiles, Brought Back With Fresh Grout",
    text: "The tiles in this shower over a bath were sound, but the grout between them had worn and discoloured. A full regrout with fresh, even joints made the whole wall look new again, at a fraction of the cost of retiling.",
    before: "/tile-regrouting-wall-before.webp",
    after: "/tile-regrouting-wall-after.webp",
    beforeAlt: "White subway wall tiles over a bath with worn, discoloured grout before tile regrouting in Melbourne",
    afterAlt: "White subway wall tiles over a bath after tile regrouting in Melbourne, fresh even grout lines",
  },
];

const signCards = [
  { title: "Cracked or Crumbling Grout", text: "Grout that cracks or breaks apart when you touch it.", href: "#spot-or-full", link: "Spot repair or full regrout?" },
  { title: "Stains That Stay", text: "Grout that stays stained after a proper clean.", href: "#clean-or-regrout", link: "Clean first, or regrout?" },
  { title: "Sunken or Missing Grout", text: "Low spots, missing grout or gaps between your tiles.", href: "#process", link: "How we regrout" },
  { title: "Returning Mould", text: "Mould or mildew that keeps coming back in the joints.", href: "/epoxy-grout", link: "Epoxy grout" },
  { title: "Loose Tiles", text: "Tiles that feel loose or move underfoot.", href: "/small-tiling-jobs", link: "Small tiling jobs" },
  { title: "Dirty Floor Lines", text: "Dark, dirty lines on kitchen and laundry floors that mopping never lifts.", href: "#grout-types", link: "Which grout suits which area?" },
];

const rooms: IconCard[] = [
  { title: "Kitchens", body: "Floors and splashbacks that face spills, grease and daily traffic.", Icon: Utensils },
  { title: "Laundries", body: "Tiled areas exposed to damp, detergents and water.", Icon: Droplets },
  { title: "Bathroom Floors and Walls", body: "Bathroom tiles outside the shower recess.", Icon: Home },
  { title: "Hallways, Entries and Living Floors", body: "Floor grout worn by dirt and foot traffic.", Icon: Footprints },
  { title: "Commercial and Rental Properties", body: "Tiled spaces in rentals, apartments and commercial properties.", Icon: Home },
  { title: "Balconies and Showers", body: <>See our dedicated <Link className={inlineLink} href="/balcony-leak-repairs">balcony leak repairs</Link> and <Link className={inlineLink} href="/shower-regrouting">shower regrouting</Link> pages.</>, Icon: Droplets },
];

const fixOptions: Array<{ label: string; title: string; body: ReactNode; pill: string }> = [
  { label: "Spot repair", title: "Small area, sound grout around it", body: "Small areas where the surrounding grout is sound may only need a spot repair.", pill: "bg-[#EEF3FF] text-[#001F97]" },
  { label: "Full regrout", title: "Many joints failing", body: "Widespread staining, failing joints or movement need a closer look and may require a full regrout.", pill: "bg-[#E8EDFE] text-[#2F63CC]" },
  { label: "Replace tiles", title: "Cracked, loose or hollow tiles", body: <>These need more than grout. See <Link href="/small-tiling-jobs" className={inlineLink}>small tiling jobs</Link>.</>, pill: "bg-[#FFF4D1] text-[#7A5600]" },
];

const cleanOrRegrout: IconCard[] = [
  { title: "Sound Grout, Surface Stain", body: "A clean may be enough.", Icon: Sparkles },
  { title: "Cracked, Crumbling or Missing", body: "The grout has failed. Regrout.", Icon: Wrench },
  { title: "Mould That Keeps Coming Back", body: "The grout may be holding moisture. We check the cause before recommending regrouting.", Icon: Droplets },
];

const processSteps: Array<[string, string]> = [
  ["Inspect and Match", "We check the grout, tiles and edges and match the colour."],
  ["Protect and Remove", "We protect your floors and fittings and remove old grout."],
  ["Regrout", "New grout is packed into the joints and finished neatly."],
  ["Clean and Seal", "We clean the haze and leave it to cure. We tell you the exact wait before we start."],
];

const priceFactors: IconCard[] = [
  { title: "Area", body: "More floor means more joints.", Icon: Grid2x2 },
  { title: "Tile Size", body: "Small tiles and mosaics have more grout lines.", Icon: Grid2x2 },
  { title: "Grout Type", body: "Epoxy costs more than cement.", Icon: Paintbrush },
  { title: "Condition and Access", body: "Heavy wear or hard to reach areas take longer.", Icon: Wrench },
];

const whyGroutix: IconCard[] = [
  { title: "Honest Advice", body: "We say when a clean is enough.", Icon: Check },
  { title: "Clear Quote First", body: "You know the price before work starts.", Icon: Check },
  { title: "Colour Matched", body: "Grout colour matched to your tiles.", Icon: Paintbrush },
  { title: "10 Year Warranty", body: "On eligible waterproof work. Scope confirmed in your quote.", Icon: ShieldCheck },
];

const relatedServices = [
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/shower-regrouting-tiled-interior.webp", alt: "Shower regrouting in Melbourne, a freshly regrouted tiled shower with waterproof epoxy grout", href: "/shower-regrouting" },
  { title: "Leaking Shower Repair", text: "We find where the water is getting out and seal it at the source.", img: "/corner-shower-regrouting-worn-grout.webp", alt: "Leaking shower repair in Melbourne, a corner shower with worn, failing grout that lets water escape behind the tiles", href: "/leaking-shower-repair" },
  { title: "Balcony Leak Repairs", text: "Balcony regrouting and resealing that stops water before it spreads.", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Balcony leak repairs in Melbourne, herringbone balcony tiles regrouted and resealed with waterproof epoxy grout", href: "/balcony-leak-repairs" },
  { title: "Epoxy Grout", text: "Waterproof, stain resistant epoxy grout for showers and wet areas.", img: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Epoxy grout in Melbourne — a hexagonal mosaic shower floor finished with waterproof epoxy grout", href: "/epoxy-grout" },
  { title: "Silicone Recaulking", text: "Old, mouldy silicone removed and replaced with a clean, watertight seal.", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Silicone recaulking in Melbourne, old failed silicone being removed from a shower base before resealing", href: "/silicone-recaulking" },
  { title: "Small Tiling Jobs", text: "Loose, cracked or drummy tiles repaired and retiled to match.", img: "/shower-regrouting-mosaic-feature-wall.webp", alt: "Small tiling jobs in Melbourne — a mosaic feature strip and tiled shower niche finished by Groutix", href: "/small-tiling-jobs" },
];

export default function TileRegroutingPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  const { phone, tel } = useContact();

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        {/* 1. HERO */}
        <section className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className={`${heroWrap} relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div className="text-center lg:text-left">
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">TILE REGROUTING · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Tile Regrouting Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p>Groutix removes worn grout from floors, kitchens, laundries and bathrooms and rebuilds the joints with fresh grout. Your tiles stay in place, look clean and keep water out. And we tell you honestly when a clean is enough.</p>
              </div>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges />
              </div>
              <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:justify-items-start">
                <div className="flex items-center gap-3.5 text-left">
                  <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                  <div>
                    <b className="block text-lg font-black leading-tight">10 Year Waterproof Warranty</b>
                    <span className="text-sm text-[#D6DCF5]">On eligible waterproof work</span>
                  </div>
                </div>
                <div className="sm:border-l sm:border-white/25 sm:pl-6">
                  <b className="block text-[28px] font-black leading-none">8,000+</b>
                  <b className="block text-base font-bold">Showers &amp; Balconies Restored</b>
                  <span className="text-sm text-[#D6DCF5]">Across Melbourne &amp; regional Victoria</span>
                </div>
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-xl border border-white/25 bg-slate-200 shadow-2xl lg:aspect-[7/5] lg:max-w-none">
              <Image src="/tile-regrouting-hero.webp" alt="Tile regrouting in Melbourne, glossy white shower tiles and a tiled niche finished with fresh grout lines" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Tile Regrouting Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us which room is wearing out and add photos of the grout lines. Photos are required, so we can see the tiles and joints before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "10 year warranty on eligible waterproof work", "Grout colour matched to your tiles"].map((x) => (
                  <li key={x} className="flex items-center gap-3 text-base font-semibold text-slate-800">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /></span>
                    {x}
                  </li>
                ))}
              </ul>
              <a href={tel} className={`${btnNavy} mt-7`}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
            </div>
            <div className="mx-auto w-full max-w-[560px] lg:max-w-none">
              <QuoteFormV2 />
            </div>
          </div>
        </section>

        {/* 2. RESULTS */}
        <Section id="tile-results">
          <SectionHead k="Real Results" title="Tile Regrouting Before and After: Real Melbourne Jobs">
            <p className={lead}>Every photo below is a real Groutix job. Drag the slider to compare the tiles before we started and after the joints were rebuilt. No stock photos, no filters.</p>
          </SectionHead>
          <div className="space-y-14">
            {resultBlocks.map((r, i) => (
              <div key={r.heading} className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <SignSlider before={r.before} after={r.after} beforeAlt={r.beforeAlt} afterAlt={r.afterAlt} title={r.heading} />
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <h3 className="text-[clamp(22px,2.4vw,30px)] font-bold leading-snug text-slate-900">{r.heading}</h3>
                  <p className="mt-3 text-[17px] leading-relaxed text-slate-600">{r.text}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="#quote-form" className={btnNavy}>Book a Free Inspection</Link>
                    <a href={tel} className={btnGold}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-12 max-w-3xl text-center`}>
            Floor grout wears fastest where life happens, under foot traffic in hallways and entries, around kitchen spills and grease, and in laundries that stay damp. Once joints crack or sink, dirt packs in and water follows. Regrouting rebuilds the joints while your tiles are still sound, which is why it costs a fraction of pulling tiles up and retiling. If some tiles have already cracked or come loose, see our <Link href="/small-tiling-jobs" className={inlineLink}>small tiling jobs</Link>.
          </p>
        </Section>

        {/* 3. SIGNS */}
        <Section id="signs" alt>
          <SectionHead k="Signs to Check" title="Signs Your Tile Grout Needs Regrouting">
            <p className={lead}>Grout wears out slowly, so it is easy to miss. Look for these signs.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signCards.map((c) => (
              <div key={c.title} className={card}>
                <h3 className={cardTitle}>{c.title}</h3>
                <p className={cardText}>{c.text}</p>
                <Link href={c.href} className="mt-3 inline-block text-sm font-bold text-[#2F63CC] hover:underline">{c.link} →</Link>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>One or two signs on a small area may only need a spot repair. Widespread wear means a full regrout.</p>
        </Section>

        {/* 4. EVERY ROOM */}
        <Section id="rooms">
          <SectionHead k="Every Room" title="Tile Regrouting for Every Room">
            <p className={lead}>Every room wears grout differently. We match the method to the room.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
        </Section>

        {/* 5. SPOT OR FULL */}
        <Section id="spot-or-full" alt>
          <SectionHead k="Honest Advice" title="Spot Repair or Full Regrout?">
            <p className={lead}>We tell you which one your tiles need, not the biggest job.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {fixOptions.map((o, i) => (
              <div key={o.label} className={`${box} flex flex-col gap-2 border-t-4 p-6 ${i === 1 ? "border-t-[#001F97]" : "border-t-[#C9D6FF]"}`}>
                <span className={`w-fit rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${o.pill}`}>{o.label}</span>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{o.title}</h3>
                <p className="text-base leading-relaxed text-slate-600">{o.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. GROUT TYPES */}
        <Section id="grout-types">
          <SectionHead k="Choosing Grout" title="Which Grout Suits Which Area?">
            <p className={lead}>The right grout depends on what the room faces every day.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1100px]">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-left text-[15px] leading-relaxed">
                <caption className="sr-only">Grout options by tiled area, subject to inspection and material availability.</caption>
                <thead>
                  <tr className="bg-[#001F97] text-white">
                    {["Area", "What it faces", "What we usually suggest"].map((h) => <th key={h} scope="col" className="px-5 py-4 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tileGroutRows.map(([area, faces, suggestion], i) => (
                    <tr key={area} className={`border-t border-slate-200 ${i % 2 ? "bg-[#F4F6FB]" : ""}`}>
                      <th scope="row" className="px-5 py-4 align-top font-bold text-slate-900">{area}</th>
                      <td className="px-5 py-4 align-top text-slate-600">{faces}</td>
                      <td className="px-5 py-4 align-top font-medium text-[#001F97]">{suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-center text-sm leading-relaxed text-slate-600">
              We choose after we inspect and confirm the available materials in your quote. Learn more on our <Link href="/epoxy-grout" className={inlineLink}>epoxy grout</Link> page.
            </p>
          </div>
        </Section>

        {/* 7. CLEAN OR REGROUT */}
        <Section id="clean-or-regrout" alt>
          <SectionHead k="Before You Book" title="Clean First, or Regrout?">
            <p className={lead}>Not every dirty grout line needs replacing. If the grout is solid but stained, a proper clean may be enough.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {cleanOrRegrout.map((c) => <IconBox key={c.title} c={c} accent="border-t-[#2F63CC]" />)}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className={`${box} border-l-4 border-l-[#2F63CC] p-6`}>
              <Paintbrush className="mb-3 h-6 w-6 text-[#2F63CC]" aria-hidden="true" />
              <h3 className={cardTitle}>Grout Colour</h3>
              <p className={cardText}>Epoxy comes in many colours. We can match your existing grout or change the colour for a fresh look. We confirm suitable shades and availability after inspection.</p>
            </div>
            <aside className={`${box} border-l-4 border-l-[#FBBC04] p-6`}>
              <ShieldCheck className="mb-3 h-6 w-6 text-[#2F63CC]" aria-hidden="true" />
              <h3 className={cardTitle}>Natural Stone and Delicate Tiles</h3>
              <p className={cardText}>Some natural stone and polished tiles need gentler products. We check your tile type before we start and test where needed.</p>
            </aside>
          </div>
        </Section>

        {/* 8. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our Process</p>
              <h2 className={h2}>Our Tile Regrouting Process</h2>
              <p className={lead}>Clean, tidy and matched to your tiles. Here is how it works.</p>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {processSteps.map(([title, body], i) => (
                  <li key={title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{body}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-[15px] leading-relaxed text-slate-600">Eligible waterproof work is backed by our 10 year waterproof warranty. We confirm the applicable scope in your quote.</p>
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              <Image src="/tile-regrouting-finished-shower.webp" alt="Finished tile regrouting in Melbourne, white shower tiles with fresh grout lines and a tiled niche" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 9. COST */}
        <Section id="cost">
          <SectionHead k="Pricing" title="What Does Tile Regrouting Cost?">
            <p className={lead}>The price depends on how much grout there is and what condition it is in. We quote after we see it.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">A Clear Quote First</h3>
              <p className="mt-2 text-[#D6DCF5]">We quote by the job after inspection. For shower prices, see <Link href="/shower-regrouting" className="font-bold text-white underline">shower regrouting</Link>.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote →</a>
          </div>
        </Section>

        {/* 10. WHY GROUTIX */}
        <Section id="why-groutix" alt>
          <SectionHead k="Why Groutix" title="Why Choose Groutix" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyGroutix.map((c) => (
              <div key={c.title} className={`${box} flex items-start gap-4 p-6`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><c.Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span>
                  <h3 className={cardTitle}>{c.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{c.body}</p>
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 11. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we have helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 12. PROPERTY */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For Property Professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Commercial</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">Rentals, apartments and commercial floors are regrouted around tenants and trading hours. We confirm the visit schedule and cure time before work begins.</p>
            </div>
            <Link href="/real-estate-property-services" className={`${btnGold} shrink-0`}>Discuss a Property Job →</Link>
          </div>
        </section>

        {/* GUIDES */}
        <Section id="guides">
          <SectionHead k="Helpful Guides" title="Guides From the Repair Team" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link href="/guides/shower-still-leaking-after-regrouting" className={`${box} group block p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
              <h3 className={cardTitle}>Shower Still Leaking After Regrouting?</h3>
              <p className={cardText}>The six causes, from silicone that was never replaced to a failed waterproofing membrane, with simple checks and who fixes what.</p>
              <span className={inlineLink}>Read this guide</span>
            </Link>
            <Link href="/guides/shower-leaking-into-ceiling-below" className={`${box} group block p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
              <h3 className={cardTitle}>Shower Leaking Into the Ceiling Below?</h3>
              <p className={cardText}>What to do first, how to find the source, and who is responsible in a house, a rental property or a unit.</p>
              <span className={inlineLink}>Read this guide</span>
            </Link>
          </div>
        </Section>

        {/* 13. RELATED SERVICES */}
        <Section id="related-services" alt>
          <SectionHead k="Related Services" title="Explore Our Other Services" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedServices.map((s) => (
              <Link key={s.href} href={s.href} className={`${box} group block overflow-hidden transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
                  <Image src={s.img} alt={s.alt} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className={cardTitle}>{s.title}</h3>
                  <p className={cardText}>{s.text}</p>
                  <span className="mt-3 inline-block text-sm font-bold text-[#2F63CC] group-hover:underline">Learn more →</span>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* 14. SERVICE AREAS */}
        <Section id="service-areas">
          <p className={eyebrow}>Service Areas</p>
          <h2 className={`${h2} mb-3`}>Tile Regrouting Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We regrout tiles across Melbourne, including <b>Brunswick</b>, <b>Essendon</b>, <b>Preston</b>, <b>Coburg</b>, <b>Reservoir</b>, <b>Thomastown</b>, <b>Epping</b>, <b>Heidelberg</b>, <b>Ivanhoe</b>, <b>Northcote</b>, <b>Fairfield</b>, <b>Box Hill</b>, <b>Doncaster</b>, <b>Templestowe</b>, <b>Balwyn</b>, <b>Kew</b>, <b>Hawthorn</b>, <b>Richmond</b>, <b>Fitzroy</b>, <b>Carlton</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Altona</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Hoppers Crossing</b>, <b>Frankston</b>, <b>Mornington</b>, <b>Cranbourne</b>, <b>Dandenong</b>, <b>Noble Park</b>, <b>Springvale</b>, <b>Clayton</b>, <b>Oakleigh</b>, <b>Bentleigh</b>, <b>Moorabbin</b>, <b>Cheltenham</b>, <b>Mentone</b>, <b>Ringwood</b>, <b>Croydon</b>, <b>Lilydale</b>, <b>Glen Waverley</b>, <b>Mount Waverley</b>, <b>Burwood</b>, <b>Ashwood</b> and surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 15. FAQ (schema is added by the route from lib/tileRegroutingContent) */}
        <Section id="faq" alt>
          <SectionHead k="Your Questions, Answered" title="Tile Regrouting FAQs" />
          <FaqList items={tileRegroutingFaqs} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href="#quote-form" className={btnNavy}>Still Have Questions? Get a Free Quote →</a>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 16. FINAL CTA */}
        <section className="relative overflow-hidden bg-[#06124F] py-16 text-white md:py-20">
          <div className={`${wrap} relative text-center`}>
            <h2 className="mx-auto max-w-[720px] text-[clamp(28px,3.4vw,44px)] font-black leading-[1.12] [text-wrap:balance]">Get Your Free Quote Today</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Tiles stay in place · Clear quote first · Colour matched</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <Link href="#quote-form" className={btnGold}>Get a Free Quote →</Link>
              <a href={tel} className={btnGhost}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
