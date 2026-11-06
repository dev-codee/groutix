"use client";

// Redesigned /balcony-leak-repairs page (2026-11-04): shower page pattern
// on the CORRECT balcony content. The live file currently carries tile
// regrouting content by mistake; this file restores the balcony page and
// upgrades it: text sign cards, real balcony work photos (no before and
// after slider, no real balcony pair exists), related services, suburb
// line. Visible copy carries no hyphens in compound words. FAQs stay in
// lib/balconyLeakContent (route adds the schema, speakable selectors
// #balcony-intro and .balcony-faq-answer are preserved).
// FINAL (2026-11-06): keyword rich alts on the work photos.
// CORRECTED 2026-11-06: NO Service schema in this component. The first
// FINAL added one, but app/[slug]/page.tsx already emits the Service +
// FAQPage schema (with @id .../#service) for this slug, so it would have
// duplicated the Service entity. Removed before deploy; the route's
// schema stays the single Service block.

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Building2, Check, ClipboardCheck, Clock, Droplets, Eye, Grid2x2, Layers, Phone, Search, ShieldCheck, Sparkles, Sun, Waves, Wind, Wrench,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact } from "@/components/SiteContentProvider";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { balconyFaqs, balconyIntro } from "@/lib/balconyLeakContent";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, heroWrap, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import { useGoogleRating } from "@/components/useGoogleRating";

type IconCard = { title: string; body: string; Icon: ComponentType<{ className?: string }> };

const card = `${box} p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`;

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

const signCards = [
  { title: "White Chalky Stains", text: "On tiles or walls. This is efflorescence. It can indicate water moving through the surface.", href: "#diagnose", link: "How we find the cause" },
  { title: "Mould or Dark Grout", text: "Mould or dark stains in grout lines that return after cleaning.", href: "/tile-regrouting", link: "Mould and stains in grout lines" },
  { title: "Hollow Sounding Tiles", text: "Tiles that sound hollow when tapped. Builders call these drummy tiles.", href: "#no-tile-removal", link: "Can the tiles stay down?" },
  { title: "Ceiling Water Stains", text: "Water stains on the ceiling of the room below your balcony.", href: "#strata", link: "Apartments and strata" },
  { title: "Bubbling or Peeling Paint", text: "Paint that bubbles or peels on walls under the balcony.", href: "#repair-options", link: "Balcony repair options" },
  { title: "Pooling Water", text: "Water that pools for hours after rain instead of draining away.", href: "#causes", link: "What causes balcony leaks" },
];

const causes: IconCard[] = [
  { title: "Failed Waterproof Membrane", body: "Water can pass through a damaged or incorrectly installed membrane beneath the tiles.", Icon: Layers },
  { title: "Cracked or Missing Grout", body: "Open joints let water pass beneath the tiled surface.", Icon: Grid2x2 },
  { title: "Split Movement Joints", body: "Buildings shift with heat and cold. Flexible joints must accommodate that movement.", Icon: Wrench },
  { title: "Poor Drainage", body: "Blocked drains or inadequate falls leave water sitting on the balcony.", Icon: Waves },
  { title: "Worn Sealant", body: "Gaps around edges, drains and balustrade posts create vulnerable entry points.", Icon: Droplets },
  { title: "UV Damage", body: "Harsh sun breaks down unsuitable sealants year after year.", Icon: Sun },
];

const diagnoseSteps = [
  "We check grout lines, joints, drains and edges up close.",
  "We tap tiles to find hollow drummy spots.",
  "We assess moisture and where water may be travelling.",
  "We trace stains back towards the entry point, not just the visible damage.",
];

const repairOptions = [
  { tag: "Grout failed, membrane sound", title: "Epoxy Regrouting With No Tile Removal", body: "We cut out old grout and replace it with epoxy grout suited to the outdoor area. Your tiles stay where they are. Flexible movement joints are repaired separately.", Icon: Grid2x2, pill: "bg-[#EEF3FF] text-[#001F97]" },
  { tag: "Early leaks and tired seals", title: "Waterproof Sealing Treatment", body: "We renew silicone joints and seal vulnerable edges where appropriate. This addresses failed seals without treating a surface seal as a substitute for a sound membrane.", Icon: Droplets, pill: "bg-[#E8EDFE] text-[#2F63CC]" },
  { tag: "The membrane has failed", title: "Full Rebuild With New Membrane and Tiles", body: "Tiles are lifted, the base repaired and a new external waterproofing membrane installed before retiling. We explain the rebuild scope and applicable AS 4654 requirements in your quote.", Icon: Layers, pill: "bg-[#FFF4D1] text-[#7A5600]" },
];

const weatherRisks: Array<[string, string]> = [
  ["Cement grout", "Cement grout can absorb moisture and deteriorate in exposed joints."],
  ["Unsuitable sealants", "Sealants without suitable UV resistance can peel and break down outdoors."],
  ["Rigid repairs", "A rigid repair across a movement joint can crack as the building moves."],
];

const processSteps: Array<[string, string]> = [
  ["Free inspection", "We visit, check the signs and trace the source."],
  ["Fixed quote", "You approve a written price and repair scope before we start."],
  ["Repair day", "We regrout, reseal or plan a rebuild based on the diagnosis."],
  ["Test and tidy", "We check our work, explain the finished repair and leave the place clean."],
];

const priceFactors: IconCard[] = [
  { title: "Size", body: "Size of the balcony and tiled area.", Icon: Grid2x2 },
  { title: "What Failed", body: "Grout, seals, base or membrane.", Icon: Search },
  { title: "Access", body: "High rise access and building requirements can add setup time.", Icon: Building2 },
  { title: "Repair Tier", body: "Regrout, seal or full rebuild.", Icon: Wrench },
];

const strataCards: IconCard[] = [
  { title: "Inspection Documentation", body: "Discuss the photos and written report your committee or insurer needs.", Icon: ClipboardCheck },
  { title: "Relevant Standards", body: "External membrane work is assessed against applicable AS 4654 requirements. AS 3740 relates to internal wet areas.", Icon: ShieldCheck },
  { title: "Building Approved Hours", body: "We discuss access, approvals and the building's permitted work hours.", Icon: Clock },
  { title: "A Clear Contact", body: "Repair scope and scheduling explained from the first call to the final check.", Icon: Phone },
];

const workPhotos = [
  { src: "/balcony-centre-watermark.webp", alt: "Balcony after a balcony leak repair in Melbourne, regrouted and resealed by Groutix", caption: "Balcony regrouted and resealed" },
  { src: "/balcony-regrouting-tiles.webp", alt: "Balcony tiles regrouted and resealed during a balcony leak repair in Melbourne", caption: "Balcony tiles, regrouted" },
];

const relatedServices = [
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/shower-regrouting-tiled-interior.webp", alt: "Freshly regrouted tiled shower with waterproof epoxy grout", href: "/shower-regrouting" },
  { title: "Leaking Shower Repair", text: "We find where the water is getting out and seal it at the source.", img: "/leaking-shower-after.webp", alt: "Shower floor after a leaking shower repair, regrouted and resealed", href: "/leaking-shower-repair" },
  { title: "Tile Regrouting", text: "Floor and wall tile regrouting that brings tired tiles back to life.", img: "/tile-regrouting-dark-floor-tiles-close-up.webp", alt: "Dark floor tiles regrouted with fresh, clean grout lines", href: "/tile-regrouting" },
  { title: "Epoxy Grout", text: "Waterproof, stain resistant epoxy grout for showers and wet areas.", img: "/shower-regrouting-in-progress-close-up.webp", alt: "Epoxy grout being applied to shower floor tiles during regrouting", href: "/epoxy-grout" },
  { title: "Silicone Recaulking", text: "Old, mouldy silicone removed and replaced with a clean, watertight seal.", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Old silicone being removed from a shower joint before recaulking", href: "/silicone-recaulking" },
  { title: "Small Tiling Jobs", text: "Loose, cracked or drummy tiles repaired and retiled to match.", img: "/bath-shower-corner-grout-close-up.webp", alt: "Regrouted corner of a shower over a bath with fresh grout lines", href: "/small-tiling-jobs" },
];

export default function BalconyLeakRepairsPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  const gr = useGoogleRating();

  const { phone, tel } = useContact();
  // Balcony reviews first, same as the approved balcony page.
  const isBalcony = (r: Review) => /balcon(?:y|ies)/i.test(r.review);
  const orderedReviews = [...reviews.filter(isBalcony), ...reviews.filter((r) => !isBalcony(r))];

  const inspectionCta = (label = "Book Your Free Inspection") => (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
      <a href="#quote-form" className={btnNavy}>{label} →</a>
      <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
    </div>
  );

  const whyGroutix: IconCard[] = [
    { title: "10 Year Waterproof Warranty", body: "On eligible completed waterproof work. Scope and terms confirmed in your quote.", Icon: ShieldCheck },
    { title: `${rating.value.toFixed(1)} Star Google Rating`, body: `Based on ${gr.countLabel} Google reviews through our existing business review source.`, Icon: Sparkles },
    { title: "Leak and Grout Specialists", body: "Practical repairs for failed grout, silicone and leaking tiled areas.", Icon: Wrench },
    { title: "Free Inspections", body: "Fixed written quotes before the agreed work starts.", Icon: Search },
    { title: "Real Customer Reviews", body: "Read existing feedback from customers we have helped.", Icon: ClipboardCheck },
    { title: "Finished Work Walkthrough", body: "We explain the completed repair and the care it needs before we leave.", Icon: Eye },
  ];

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
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">BALCONY LEAK REPAIR · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Balcony Leak Repair Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p id="balcony-intro">{balconyIntro}</p>
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
              <Image src="/balcony-regrouting-herringbone-tiles.webp" alt="Balcony leak repairs in Melbourne, herringbone balcony tiles regrouted and resealed with waterproof epoxy grout" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Balcony Leak Repair Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us what your balcony is doing and add photos of the stains, grout lines and drainage. Photos are required, so we can see the problem before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free inspection, no obligation", "10 year waterproof warranty on eligible waterproof work", "Fixed written quote before work starts"].map((x) => (
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

        {/* 2. OUR WORK (real finished balcony work; no before and after pair exists) */}
        <Section id="balcony-work">
          <SectionHead k="Real Work" title="Balcony Leak Repairs: Real Melbourne Work">
            <p className={lead}>Finished Groutix balcony work, photographed on site. Every balcony is inspected first, because the right repair depends on whether the membrane underneath still holds.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {workPhotos.map((p) => (
              <figure key={p.src} className={`${box} overflow-hidden`}>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="p-4 text-[15px] font-bold text-slate-900">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
          {inspectionCta()}
        </Section>

        {/* 3. SIGNS */}
        <Section id="signs" alt>
          <SectionHead k="Signs to Check" title="Signs Your Balcony Needs Leak Repair">
            <p className={lead}>Balconies rarely fail overnight. They warn you first. Here is what to look for.</p>
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
          <p className={`${lead} mt-8 text-center`}>Spot even one sign? Book a free inspection. Small leaks can turn into bigger damage.</p>
          {inspectionCta()}
        </Section>

        {/* 4. CAUSES */}
        <Section id="causes">
          <SectionHead k="Find the Cause" title="What Causes Balconies to Leak in Melbourne">
            <p className={lead}>Melbourne weather punishes outdoor tiles. Summer sun bakes them. Winter rain soaks them. Bay winds drive water into gaps.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {causes.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <p className={`${lead} mt-8 text-center`}>Most leaks have more than one cause. That is why we diagnose before we repair.</p>
        </Section>

        {/* 5. DIAGNOSE */}
        <Section id="diagnose" alt>
          <SectionHead k="An Honest Diagnosis" title="Is It the Grout or the Membrane? How We Diagnose the Real Cause">
            <p className={lead}>This question decides your repair. Get it wrong and the leak returns.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-9">
              <Search className="h-9 w-9 text-[#FBBC04]" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold">The right fix starts with the source</h3>
              <div className="mt-6 space-y-5">
                <div className="border-b border-white/20 pb-5">
                  <p className="font-bold text-[#FBBC04]">Failed grout</p>
                  <p className="mt-2 text-[#D6DCF5]">May need regrouting when the membrane and base remain sound.</p>
                </div>
                <div>
                  <p className="font-bold text-[#FBBC04]">Failed membrane</p>
                  <p className="mt-2 text-[#D6DCF5]">Needs a rebuild. Grout alone cannot repair a failed membrane.</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-5 text-xl font-bold text-slate-900">Our inspection finds the cause</h3>
              <ol className="grid gap-3">
                {diagnoseSteps.map((step, i) => (
                  <li key={step} className={`${box} flex items-start gap-4 p-4`}>
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#001F97] text-sm font-black text-white">{i + 1}</span>
                    <p className="pt-1.5 leading-relaxed text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 leading-relaxed text-slate-600">You get a straight answer. We explain what failed and which fix suits it. Ask us about photos and inspection documentation for your property.</p>
            </div>
          </div>
        </Section>

        {/* 6. REPAIR OPTIONS */}
        <Section id="repair-options">
          <SectionHead k="Repair Options" title="Balcony Leak Repair Options: Choose the Right Fix">
            <p className={lead}>One size never fits all. We match the repair to the cause we found.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {repairOptions.map(({ tag, title, body, Icon, pill }) => (
              <div key={title} className={`${box} flex flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC]`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`w-fit rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${pill}`}>{tag}</span>
                  <Icon className="h-6 w-6 shrink-0 text-[#2F63CC]" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="text-base leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>We only recommend what your balcony needs. The inspection decides, not a sales script. We explain why we picked the repair.</p>
          <p className="mt-4 text-center text-slate-600">
            Learn more about our <Link href="/epoxy-grout" className={inlineLink}>epoxy grout service</Link> and <Link href="/tile-regrouting" className={inlineLink}>tile regrouting</Link>.
          </p>
        </Section>

        {/* 7. WEATHER */}
        <Section id="weather" alt>
          <SectionHead k="Outdoor Durability" title="Built for Melbourne Weather: UV, Heat and Movement">
            <p className={lead}>A balcony can face full sun, cold snaps and salty bay air in one year. The materials must match the exposure.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="grid gap-4">
              {weatherRisks.map(([title, body]) => (
                <div key={title} className={`${box} border-l-4 border-l-[#FBBC04] p-6`}>
                  <h3 className={cardTitle}>{title}</h3>
                  <p className={cardText}>{body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-9">
              <Wind className="h-9 w-9 text-[#FBBC04]" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold">Materials matched to your balcony</h3>
              <p className="mt-5 leading-relaxed text-[#D6DCF5]">We select grout and sealants suited to outdoor exposure and confirm suitable products in your quote. Flexible perimeter and movement joints accommodate building movement; epoxy grout does not replace those joints.</p>
              <p className="mt-5 leading-relaxed text-[#D6DCF5]">Think bay facing apartments in St Kilda. Think sun baked rooftops in the CBD. Drainage, UV exposure and coastal conditions all help determine the repair.</p>
            </div>
          </div>
        </Section>

        {/* 8. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={wrap}>
            <p className={eyebrow}>Our Process</p>
            <h2 className={h2}>Our Balcony Leak Repair Process</h2>
            <p className={lead}>Simple, clean and clearly explained. Here is how it works.</p>
            <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {processSteps.map(([title, body], i) => (
                  <li key={title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{body}</p>
                  </li>
                ))}
              </ol>
            <p className="mt-6 rounded-lg bg-white p-5 text-sm leading-relaxed text-slate-600">The repair timeframe and cure time depend on the scope, materials and weather. We confirm the schedule and when you can use your balcony before we start.</p>
          </div>
          <div className={wrap}>{inspectionCta()}</div>
        </section>

        {/* 9. COST */}
        <Section id="cost" alt>
          <SectionHead k="Pricing" title="Balcony Leak Repair Cost in Melbourne">
            <p className={lead}>No two balconies cost the same. Your price depends on:</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">Fixed Written Quote</h3>
              <p className="mt-2 max-w-[720px] text-[#D6DCF5]">After inspection you get a fixed written quote for the agreed scope. Any additional work is discussed and approved before it proceeds.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote →</a>
          </div>
        </Section>

        {/* 10. STRATA */}
        <Section id="strata">
          <SectionHead k="For Property Professionals" title="Strata, Body Corporate and Property Managers">
            <p className={lead}>Apartment balcony leaks raise a tough question. Who pays for the repair?</p>
          </SectionHead>
          <aside className={`${box} mb-7 border-l-4 border-l-[#2F63CC] bg-[#F4F6FB] p-6 sm:p-8`}>
            <h3 className="text-xl font-bold text-slate-900">Who Maintains What in Victoria</h3>
            <p className="mt-3 leading-relaxed text-slate-600">The owners corporation is responsible for maintaining common property. Whether a balcony membrane or surface is common property depends on the plan of subdivision. Confirm the boundaries and responsibility with your owners corporation before arranging repairs.</p>
            <a href="https://www.consumer.vic.gov.au/housing/owners-corporations/property-maintenance/maintaining-and-improving-common-property" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-bold text-[#2F63CC] hover:underline">Read Consumer Affairs Victoria guidance →</a>
          </aside>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {strataCards.map((c) => <IconBox key={c.title} c={c} accent="border-t-[#2F63CC]" />)}
          </div>
          <p className={`${lead} mt-7 text-center`}>Need a report for a claim or a meeting? Tell us what is required.</p>
          {inspectionCta("Request an Inspection")}
        </Section>

        {/* 11. NO TILE REMOVAL */}
        <Section id="no-tile-removal" alt>
          <SectionHead k="Keep Your Existing Tiles" title="Can a Leaking Balcony Be Fixed Without Removing Tiles?" />
          <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-2">
            <div className={`${box} border-t-4 border-t-[#FBBC04] p-7`}>
              <Check className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
              <h3 className="text-xl font-bold text-slate-900">Yes, in many cases</h3>
              <p className="mt-3 leading-relaxed text-slate-600">When the membrane is sound and only grout or seals failed, regrouting and resealing may fix it. Tiles stay down.</p>
            </div>
            <div className={`${box} border-t-4 border-t-[#001F97] p-7`}>
              <Layers className="mb-4 h-7 w-7 text-[#001F97]" aria-hidden="true" />
              <h3 className="text-xl font-bold text-slate-900">When tiles must come up</h3>
              <p className="mt-3 leading-relaxed text-slate-600">A failed membrane or damaged base needs a rebuild. We tell you upfront. A surface fix cannot restore a failed membrane.</p>
            </div>
          </div>
          <p className={`${lead} mt-7 text-center`}>No pressure. Just an honest diagnosis.</p>
        </Section>

        {/* 12. WHY GROUTIX */}
        <Section id="why-groutix">
          <SectionHead k="Why Groutix" title="Why Melbourne Homeowners Choose Groutix" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyGroutix.map((c) => (
              <div key={c.title} className={`${box} flex items-start gap-4 p-6`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><c.Icon className="h-6 w-6" aria-hidden="true" /></span>
                <span>
                  <h3 className={cardTitle}>{c.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{c.body}</p>
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 13. REVIEWS */}
        <Section id="reviews" alt>
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Google feedback from customers we have helped across Melbourne, in their own words.</p>
          </SectionHead>
          <ReviewsMarquee reviews={orderedReviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 14. RELATED SERVICES */}
        <Section id="related-services">
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
          <p className={`${lead} mt-7 text-center`}>Not sure where your leak starts? Call us to arrange a free inspection.</p>
          {inspectionCta()}
        </Section>

        {/* 15. SERVICE AREAS */}
        <Section id="service-areas" alt>
          <p className={eyebrow}>Service Areas</p>
          <h2 className={`${h2} mb-3`}>Balcony Leak Repairs Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We repair leaking balconies across Melbourne, including <b>Brunswick</b>, <b>Essendon</b>, <b>Preston</b>, <b>Coburg</b>, <b>Reservoir</b>, <b>Thomastown</b>, <b>Epping</b>, <b>Heidelberg</b>, <b>Ivanhoe</b>, <b>Northcote</b>, <b>Fairfield</b>, <b>Box Hill</b>, <b>Doncaster</b>, <b>Templestowe</b>, <b>Balwyn</b>, <b>Kew</b>, <b>Hawthorn</b>, <b>Richmond</b>, <b>Fitzroy</b>, <b>Carlton</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Altona</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Hoppers Crossing</b>, <b>Frankston</b>, <b>Mornington</b>, <b>Cranbourne</b>, <b>Dandenong</b>, <b>Noble Park</b>, <b>Springvale</b>, <b>Clayton</b>, <b>Oakleigh</b>, <b>Bentleigh</b>, <b>Moorabbin</b>, <b>Cheltenham</b>, <b>Mentone</b>, <b>Ringwood</b>, <b>Croydon</b>, <b>Lilydale</b>, <b>Glen Waverley</b>, <b>Mount Waverley</b>, <b>Burwood</b>, <b>Ashwood</b> and surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 16. FAQ (FAQPage + speakable schema are added by the route, as before) */}
        <Section id="balcony-faqs">
          <SectionHead k="Your Questions, Answered" title="Balcony Leak Repair FAQs" />
          <FaqList items={balconyFaqs} answerClassName="balcony-faq-answer" />
          {inspectionCta("Still Have Questions? Get a Free Quote")}
        </Section>

        {/* 17. FINAL CTA */}
        <section className="relative overflow-hidden bg-[#06124F] py-16 text-white md:py-20">
          <div className={`${wrap} relative text-center`}>
            <h2 className="mx-auto max-w-[720px] text-[clamp(28px,3.4vw,44px)] font-black leading-[1.12] [text-wrap:balance]">Book Your Free Balcony Inspection</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#D6DCF5]">For balcony leak repairs across Melbourne, call <a href={tel} className="font-bold text-white underline">{phone}</a> now. Or request a quote online.</p>
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Free inspection · Fixed written quote · 10 year warranty on eligible waterproof work</p>
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
