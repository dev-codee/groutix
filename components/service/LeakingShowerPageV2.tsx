"use client";

// Redesigned /leaking-shower-repair page (v2, 2026-11-06): shower page pattern,
// hyper local Melbourne housing tone and Grout Guy keyword research woven in.
// Results with real before and after sliders, text sign cards (no broken
// images), sources table, damage cards, process, cost paths, related
// services. Visible copy carries no hyphens in compound words. FAQs and
// FAQ schema stay in lib/leakingShowerContent (route adds the schema).
// FINAL (2026-11-06): real alt text on the slider images (SEO) and a
// Service schema block in the component, mirroring the epoxy page.

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Building2, Check, ClipboardCheck, Droplets, House, Layers, Phone, Search, ShieldCheck, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import type { Review } from "@/lib/reviews";
import { LEAKING_SHOWER_FAQS } from "@/lib/leakingShowerContent";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, heroWrap, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";

const googleReviewsUrl = "https://www.google.com/maps/place/Groutix";
const SITE_URL = "https://groutix.com";

type ResultBlock = { heading: string; text: string; before: string; after: string; beforeAlt: string; afterAlt: string };

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


const resultBlocks: ResultBlock[] = [
  {
    heading: "Failed Grout Letting Water Through, Sealed at the Source",
    text: "This shower was losing water through cracked, worn grout lines and perished silicone. We removed the failed material, rebuilt the joints with waterproof epoxy grout and resealed the edges, so the water stays in the shower where it belongs.",
    before: "/leaking-shower-failed-grout-before.webp",
    after: "/leaking-shower-repaired-after.webp",
    beforeAlt: "Leaking shower floor with cracked, failed grout and an open drain before repair in Melbourne",
    afterAlt: "Shower floor after a leaking shower repair in Melbourne, regrouted with waterproof epoxy grout and resealed",
  },
  {
    heading: "A Shower Base That Leaked at the Edges, Resealed and Watertight",
    text: "The silicone around this shower base had split along the edges, the classic path for water to escape into the wall and the floor. We stripped the old sealant, cleaned the joint and resealed it with silicone made for wet areas.",
    before: "/leaking-shower-base-leak-before.webp",
    after: "/leaking-shower-base-resealed-after.webp",
    beforeAlt: "Shower base with split, peeling silicone around the edges before a leaking shower repair in Melbourne",
    afterAlt: "Shower base after a leaking shower repair in Melbourne, resealed with fresh wet area silicone",
  },
];

const signCards = [
  { title: "Stains or bubbling paint on the wall behind the shower", text: "Paint blisters and plaster swells when water gets behind the tiles and into the wall.", href: "#leak-damage", link: "What a leak can damage" },
  { title: "A damp or musty smell in the bathroom or next room", text: "A musty odour that cleaning never shifts usually means damp materials behind the tiles or under the floor.", href: "#leak-sources", link: "Where the water comes from" },
  { title: "A wet patch, swollen skirting, damp carpet or a lifting floor near the bathroom", text: "Water escaping the shower often shows first beside the bathroom: damp carpet at the ensuite entry, swollen skirting boards and rusting door frames.", href: "#what-to-do", link: "What to do right now" },
  { title: "A stain or drip on the ceiling below the shower", text: "In double storey homes and apartments, a shower leak often announces itself on the ceiling underneath.", href: "#property-services", link: "Leaks in rentals and apartments" },
  { title: "Cracked, crumbling or chalky grout, or black or peeling silicone", text: "Cement grout that has weathered soft and powdery no longer seals the joints, so every shower pushes water through.", href: "/shower-regrouting", link: "Shower regrouting" },
  { title: "Tiles that sound hollow or feel loose", text: "Hollow sounding tiles can mean water has been getting underneath and breaking the bond.", href: "/small-tiling-jobs", link: "Small tiling jobs" },
];

const sources: Array<[string, string, string]> = [
  ["Grout and silicone at the tile surface", "Cracked grout, grout gone soft and chalky, black or peeling silicone, damp near corners and the floor junction", "Groutix"],
  ["Waterproofing membrane under the tiles", "Damp walls or ceiling below with grout that looks fine, repeated leaks after regrouting", "We assess it. Usually needs more than a regrout, and we tell you before work starts"],
  ["Shower base, screen or waste junction", "Water at the base, around the drain or under the screen", "We repair sealing and joint failures. Other faults are referred"],
  ["Pipes, mixer or fittings behind the wall", "Water that keeps flowing when the shower is off, wet wall around the tap", "Licensed plumber"],
];

const damage = [
  { Icon: House, title: "Walls and plasterboard", description: "Swelling, bubbling paint, crumbling lining" },
  { Icon: Layers, title: "Timber framing and floor", description: "Rot can start out of sight while water tracks behind the tiles" },
  { Icon: Building2, title: "Ceiling and rooms below", description: "Stains, drips and damage to the unit or room underneath" },
  { Icon: Droplets, title: "Mould and odours", description: "Damp areas can keep growing mould" },
];

const immediateSteps = [
  "Stop using the shower if water is escaping the screen or coming through a wall or ceiling.",
  "Dry the area and take photos of stains, cracks and damp spots.",
  "Check the room or unit below for stains or drips.",
  "Do not seal over cracks with sealer or silicone. It hides the cause.",
  "If water is flowing when the shower is off, turn off the water to the bathroom and call a licensed plumber.",
];

const processSteps: Array<[string, string]> = [
  ["Inspect and Trace", "We check grout lines, corners, the floor junction, the base, the drain edge and the fittings to see where water is getting out."],
  ["Confirm the Cause", "We explain what we found in plain English. If it is a membrane or pipe problem, we say so before any work."],
  ["Repair the Cause", "Failed grout and silicone are removed and the joints rebuilt with waterproof materials made for wet areas. Tiles stay in place where they are sound."],
  ["Cure and Recheck", "The repair cures before the shower is used. We explain the cure time for your repair before work starts. Eligible repairs are backed by our 10 year waterproof warranty."],
];

const whyGroutix = [
  { Icon: Search, title: "Honest scope", description: "If it is not a grout or silicone leak, we say so before you spend money on the wrong fix." },
  { Icon: ClipboardCheck, title: "A clear cause before any work", description: "You see what we found and why we recommend the repair." },
  { Icon: Wrench, title: "Waterproof materials for wet areas", description: "Failed grout and silicone are replaced with materials made for wet areas." },
];

const relatedServices = [
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/walk-in-shower-regrouting-wide-view.webp", alt: "Walk in shower after regrouting in a Melbourne home, fresh epoxy grout and resealed joints", href: "/shower-regrouting" },
  { title: "Balcony Leak Repairs", text: "Balcony regrouting and resealing that stops water before it spreads.", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Regrouted balcony with herringbone tiles and fresh epoxy grout joints", href: "/balcony-leak-repairs" },
  { title: "Tile Regrouting", text: "Floor and wall tile regrouting that brings tired tiles back to life.", img: "/tile-regrouting-dark-floor-tiles-close-up.webp", alt: "Dark floor tiles regrouted with fresh, clean grout lines", href: "/tile-regrouting" },
  { title: "Epoxy Grout", text: "Waterproof, stain resistant epoxy grout for showers and wet areas.", img: "/shower-regrouting-in-progress-close-up.webp", alt: "Epoxy grout being applied to shower floor tiles during regrouting", href: "/epoxy-grout" },
  { title: "Silicone Recaulking", text: "Old, mouldy silicone removed and replaced with a clean, watertight seal.", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Old silicone being removed from a shower joint before recaulking", href: "/silicone-recaulking" },
  { title: "Small Tiling Jobs", text: "Loose, cracked or drummy tiles repaired and retiled to match.", img: "/bath-shower-corner-grout-close-up.webp", alt: "Regrouted corner of a shower over a bath with fresh grout lines", href: "/small-tiling-jobs" },
];

export default function LeakingShowerPageV2({ reviews }: { reviews: Review[] }) {
  const { phone, tel } = useContact();

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Leaking shower repair",
    name: "Leaking Shower Repair Melbourne",
    description: "Leaking shower repair in Melbourne: failed grout and silicone removed, joints rebuilt with waterproof epoxy grout and resealed, without removing tiles.",
    areaServed: { "@type": "City", name: "Melbourne" },
    provider: { "@type": "LocalBusiness", name: "Groutix", url: SITE_URL },
    url: `${SITE_URL}/leaking-shower-repair`,
  };

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
        {/* 1. HERO */}
        <section className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className={`${heroWrap} relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div className="text-center lg:text-left">
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">LEAKING SHOWERS · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Leaking Shower Repairs Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p>Groutix finds where your shower is leaking and repairs failed grout and silicone, often without removing tiles. From post war brick homes in the outer suburbs to Edwardian bathrooms in the inner north, the pattern is the same: failed grout and seals let water track behind the tiles. If the cause is a pipe or the waterproofing membrane, we tell you before any work starts.</p>
              </div>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges />
              </div>
              <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:justify-items-start">
                <div className="flex items-center gap-3.5 text-left">
                  <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                  <div>
                    <b className="block text-lg font-black leading-tight">10 Year Waterproof Warranty</b>
                    <span className="text-sm text-[#D6DCF5]">On eligible completed repairs</span>
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
              <Image src="/corner-shower-regrouting-worn-grout.webp" alt="Leaking shower repair in Melbourne, a corner shower with worn, failing grout that lets water escape behind the tiles" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Leaking Shower Repair Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us where the water is showing up and add photos of the stains, grout and silicone. Photos are required, so we can see the problem before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "10 year waterproof warranty on eligible completed repairs", "We find the cause before we repair it"].map((x) => (
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
        <Section id="leak-results">
          <SectionHead k="Real Results" title="Leaking Shower Repairs Before and After: Real Melbourne Jobs">
            <p className={lead}>Every photo below is a real Groutix repair. Drag the slider to compare the shower before we started and after the leak was sealed at the source. No stock photos, no filters.</p>
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
            Left alone, a leak like these keeps tracking behind the tiles. Timber framing can start to rot out of sight, plaster swells and paint bubbles, and in apartments the water can reach the ceiling of the unit below. If the grout in your shower has gone soft and chalky, or the silicone has split along the edges, the time to fix it is before the damage spreads. When the whole shower needs rebuilding at the joints, see our <Link href="/shower-regrouting" className={inlineLink}>shower regrouting service</Link>.
          </p>
        </Section>

        {/* 3. SIGNS */}
        <Section id="leak-signs" alt>
          <SectionHead k="Know the Signs" title="Signs Your Shower May Be Leaking">
            <p className={lead}>A leak often shows up away from the shower first. Look for these signs.</p>
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
          <p className={`${lead} mx-auto mt-8 max-w-3xl md:text-center`}>
            One sign is worth checking. Two or more together mean water is probably getting out.
          </p>
        </Section>

        {/* 4. SOURCES */}
        <Section id="leak-sources">
          <SectionHead title="Where Is the Water Coming From?">
            <p className={lead}>Not every leak is a grout leak. Here is how the common sources compare and who fixes each one.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1100px]">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[680px] border-collapse text-left text-[15px] leading-relaxed">
                <caption className="sr-only">Common shower leak sources, signs and who repairs them</caption>
                <thead>
                  <tr className="bg-[#001F97] text-white">
                    {["Source", "What it looks like", "Who fixes it"].map((l) => <th key={l} scope="col" className="px-5 py-4 font-bold">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sources.map(([source, looks, who], i) => (
                    <tr key={source} className={`border-t border-slate-200 ${i === 0 ? "bg-[#EEF3FF]" : ""}`}>
                      <th scope="row" className="w-[30%] px-5 py-4 align-top font-bold text-slate-900">{source}</th>
                      <td className="w-[35%] px-5 py-4 align-top text-slate-600">{looks}</td>
                      <td className={`px-5 py-4 align-top ${i === 0 ? "font-bold text-[#001F97]" : "text-slate-700"}`}>{who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout title="Honest assessment, every time">
              A shower is only as watertight as its weakest junction, which is why we check the corners, the floor junction and the screen seals, not just the grout lines. Plumbing work in Victoria must be done by a licensed plumber. If we suspect a pipe leak, we say so and do not charge for a repair that will not fix it.
            </Callout>
          </div>
        </Section>

        {/* 5. DAMAGE */}
        <Section id="leak-damage" alt>
          <SectionHead title="What a Leaking Shower Can Damage">
            <p className={lead}>Water behind tiles can travel a long way before you see it. A small leak can turn into a big repair.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {damage.map(({ Icon, title, description }) => (
              <div key={title} className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className={`${cardTitle} mt-4`}>{title}</h3>
                <p className={cardText}>{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-base text-slate-600">Covering the problem with sealer or fresh silicone only hides it for a short time.</p>
        </Section>

        {/* 5b. MELBOURNE HOMES (hyper local) */}
        <Section id="melbourne-homes">
          <SectionHead k="Melbourne Homes" title="Why Melbourne Homes Leak the Way They Do">
            <p className={lead}>The housing stock here decides how a shower leak shows up. Melbourne's changeable weather works the joints open over the years, and then the damage follows the way the home was built.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className={`${box} border-t-4 border-t-[#001F97] p-6`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><House className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className={`${cardTitle} mt-4`}>Timber framed and weatherboard homes</h3>
              <p className={cardText}>Common across the inner west and north. Water behind the tiles rots timber framing and skirting boards out of sight, and the damp becomes a breeding ground for mould.</p>
            </div>
            <div className={`${box} border-t-4 border-t-[#2F63CC] p-6`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Layers className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className={`${cardTitle} mt-4`}>Brick veneer family homes</h3>
              <p className={cardText}>The post war and 1970s brick homes of the outer east and south east often show the leak as bubbling paint on the bedroom or hallway wall behind the shower, long before the grout looks bad.</p>
            </div>
            <div className={`${box} border-t-4 border-t-[#FBBC04] p-6`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Building2 className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className={`${cardTitle} mt-4`}>Apartments and double storey homes</h3>
              <p className={cardText}>Here the first sign is usually downstairs: a stain spreading on the ceiling below, sometimes in the unit underneath. Catching it early is the difference between a reseal and a major repair.</p>
            </div>
          </div>
        </Section>

        {/* 6. WHAT TO DO */}
        <Section id="what-to-do">
          <SectionHead k="Limit the Damage" title="What To Do Right Now">
            <p className={lead}>If you think your shower is leaking, these steps limit the damage while you arrange a repair.</p>
          </SectionHead>
          <ol className="mx-auto grid max-w-[900px] gap-4">
            {immediateSteps.map((step, i) => (
              <li key={step} className={`${box} flex items-start gap-4 p-5`}>
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#001F97] text-sm font-black text-white">{i + 1}</span>
                <p className="pt-1 text-base leading-relaxed text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="#quote-form" className={btnNavy}>Get a Free Quote →</Link>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 7. PROCESS */}
        <section id="repair-process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Find It. Explain It. Repair It.</p>
              <h2 className={h2}>Our Leak Repair Process</h2>
              <p className={lead}>Every leak is different, so we start by finding the cause, not by guessing.</p>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {processSteps.map(([title, text], i) => (
                  <li key={title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              <Image src="/leaking-shower-repair-process.webp" alt="Cutting out failed silicone from a shower joint during a leaking shower repair in Melbourne" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 8. COST */}
        <Section id="repair-cost">
          <SectionHead title="What Does Leaking Shower Repair Cost?">
            <p className={lead}>The price depends on where the leak comes from, so we quote after we inspect.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1000px]">
            <div className="flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
              <div>
                <h3 className="flex items-center gap-3 text-2xl font-bold"><ClipboardCheck className="h-7 w-7 shrink-0 text-[#FBBC04]" aria-hidden="true" />A clear quote for the cause of your leak</h3>
                <p className="mt-2 text-[#D6DCF5]">We explain the recommended repair and the price before any work starts.</p>
              </div>
              <Link href="/contact" className={`${btnGold} shrink-0`}>Get a Free Quote</Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                <h3 className={cardTitle}>Grout and silicone repair</h3>
                <p className={cardText}>Priced like a regrout. <Link href="/shower-regrouting" className={inlineLink}>See cost details on our shower regrouting page</Link>.</p>
              </div>
              <div className={`${box} border-t-4 border-t-[#2F63CC] p-6`}>
                <h3 className={cardTitle}>Failed membrane</h3>
                <p className={cardText}>This is a rebuild. Tiles come out and costs rise, and it can run into the thousands. We tell you before any work.</p>
              </div>
              <div className={`${box} border-t-4 border-t-[#FBBC04] p-6`}>
                <h3 className={cardTitle}>Pipe or fitting leak</h3>
                <p className={cardText}>A licensed plumber quotes this.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. WHY GROUTIX */}
        <Section id="why-groutix" alt>
          <SectionHead title="Why Choose Groutix for a Leak">
            <p className={lead}>We only work on grout, silicone and wet area repairs. That focus means we see these failures every day.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {whyGroutix.map(({ Icon, title, description }) => (
              <div key={title} className={`${box} p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className={`${cardTitle} mt-4`}>{title}</h3>
                <p className={cardText}>{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-lg bg-[#001F97] p-6 text-white sm:flex-row sm:items-center">
            <p className="flex items-center gap-3 text-lg font-bold"><ShieldCheck className="h-7 w-7 shrink-0 text-[#FBBC04]" aria-hidden="true" />10 year waterproof warranty on eligible completed repairs.</p>
            <Link href="/terms-conditions" className="shrink-0 text-sm font-semibold underline hover:text-white/80">View warranty terms</Link>
          </div>
        </Section>

        {/* 10. REVIEWS */}
        <Section id="customer-feedback">
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we have helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} />
          <p className="mt-6 text-center">
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Verified Reviews on Google →</a>
          </p>
        </Section>

        {/* 11. PROPERTY */}
        <section id="property-services" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>Landlords, Agents and Strata</p>
              <h2 className={`${h2} text-white`}>Leaking Shower in a Rental or Apartment?</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] leading-relaxed text-[#D6DCF5]">Leaks in rentals and apartments often reach the unit or room below. We work around tenant timelines and explain the cause in plain terms for owners and managers.</p>
            </div>
            <Link href="/real-estate-property-services" className={`${btnGold} shrink-0`}>Discuss a Property Job →</Link>
          </div>
        </section>

        {/* 12. RELATED SERVICES */}
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

        {/* 13. SERVICE AREAS */}
        <Section id="service-areas">
          <p className={eyebrow}>Service Areas</p>
          <h2 className={`${h2} mb-3`}>Leaking Shower Repairs Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We repair leaking showers across Melbourne, including <b>Brunswick</b>, <b>Essendon</b>, <b>Preston</b>, <b>Coburg</b>, <b>Reservoir</b>, <b>Thomastown</b>, <b>Epping</b>, <b>Heidelberg</b>, <b>Ivanhoe</b>, <b>Northcote</b>, <b>Fairfield</b>, <b>Box Hill</b>, <b>Doncaster</b>, <b>Templestowe</b>, <b>Balwyn</b>, <b>Kew</b>, <b>Hawthorn</b>, <b>Richmond</b>, <b>Fitzroy</b>, <b>Carlton</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Altona</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Hoppers Crossing</b>, <b>Frankston</b>, <b>Mornington</b>, <b>Cranbourne</b>, <b>Dandenong</b>, <b>Noble Park</b>, <b>Springvale</b>, <b>Clayton</b>, <b>Oakleigh</b>, <b>Bentleigh</b>, <b>Moorabbin</b>, <b>Cheltenham</b>, <b>Mentone</b>, <b>Ringwood</b>, <b>Croydon</b>, <b>Lilydale</b>, <b>Glen Waverley</b>, <b>Mount Waverley</b>, <b>Burwood</b>, <b>Ashwood</b> and surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 14. FAQ (schema is added by the route from lib/leakingShowerContent) */}
        <Section id="faq" alt>
          <SectionHead title="Frequently Asked Questions" />
          <FaqList items={LEAKING_SHOWER_FAQS} />
          <div className="mt-7 text-center">
            <Link href="#quote-form" className={btnNavy}>Still Have Questions? Get a Free Quote</Link>
          </div>
        </Section>

        {/* 15. FINAL CTA */}
        <section className="relative overflow-hidden bg-[#06124F] py-16 text-white md:py-20">
          <div className={`${wrap} relative text-center`}>
            <h2 className="mx-auto max-w-[720px] text-[clamp(28px,3.4vw,44px)] font-black leading-[1.12] [text-wrap:balance]">Get Your Free Quote Today</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Find the source · Tiles stay in place where sound · 10 year waterproof warranty</p>
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
