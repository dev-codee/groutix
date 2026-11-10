"use client";

// Redesigned /small-tiling-jobs page (2026-11-04): shower page pattern.
// Results as a real work photo strip (no slider on this page),
// text sign cards, what we do, matching, process, related services.
// Visible copy carries no hyphens in compound words. FAQs and steps
// stay in lib/smallTilingContent (route adds the schema).
// FINAL (2026-11-06): real alt text on the slider images (SEO) only.
// NO Service schema in this component (checked again for FINAL): the
// app/[slug]/page.tsx route already emits the Service + FAQPage schema
// for this slug, so adding one here would duplicate it (same standard
// as the Tile, Balcony and Silicone FINAL packs, 2026-11-06).

import Image from "next/image";
import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { Check, Clock, Grid2x2, Hammer, House, Layers, Paintbrush, Phone, Ruler, Search, ShieldCheck, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { smallTilingFaqs, smallTilingSteps } from "@/lib/smallTilingContent";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, heroWrap, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";

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


const recentWork = [
  { src: "/shower-niche-regrouting-close-up.webp", alt: "Tiled shower niche up close after repair and regrouting", caption: "Shower niches and shelves" },
  { src: "/shower-regrouting-mosaic-strip-linear-drain.webp", alt: "Mosaic strip tiling with a linear drain after repair", caption: "Mosaic strips and drains" },
  { src: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Hexagonal mosaic floor tiles after repair and regrouting", caption: "Mosaic floor tiles" },
];

const signCards = [
  { title: "Cracked Tile", text: "A visible crack across the tile.", href: "#what-we-do", link: "Tile replacement" },
  { title: "Chipped Tile", text: "A chipped corner or edge.", href: "#matching", link: "Matching your tile" },
  { title: "Loose Tile", text: "A tile that rocks or moves underfoot.", href: "#what-it-means", link: "Loose, cracked or hollow?" },
  { title: "Hollow Sound", text: "A tile that sounds hollow when tapped.", href: "#process", link: "How we test and refix" },
  { title: "Raised Edges", text: "An edge or corner that sits higher than the rest.", href: "#cost", link: "What it costs" },
  { title: "Missing Tile", text: "A tile that is missing or has fallen off the wall.", href: "#honest-scope", link: "When it is more than a small job" },
];

const jobs: IconCard[] = [
  { title: "Replace a Cracked or Chipped Tile", body: "Remove the damaged tile and fit a replacement.", Icon: Hammer },
  { title: "Refix a Loose Tile", body: "Clean, re-bed and set a sound tile level again.", Icon: Layers },
  { title: "Replace a Missing Tile", body: "Replace a missing tile on a wall or floor.", Icon: Grid2x2 },
  { title: "Repair Lifted Edges", body: "Assess tiles lifted at an edge or corner.", Icon: Ruler },
  { title: "Patch After Other Trades", body: "Patch tiles after a tap or fitting change, where suitable.", Icon: Wrench },
  { title: "Match the Grout", body: "Colour match the grout around the repair.", Icon: Paintbrush },
];

const meaningRows: Array<[string, string, ReactNode]> = [
  ["Hollow sound when tapped", "The tile may have lost its bond underneath", "We tap test nearby tiles and lift one if needed."],
  ["Tile moves or rocks", "The adhesive has let go", "Refix or replace."],
  ["Cracked tile", "Impact or movement", "Replace the tile."],
  ["Raised or lifted edge", "Movement or bond failure", "Refix, and check the surrounding tiles."],
  ["Tiles keep coming loose in one area", "Moisture or movement under the tiles", <>We tell you if it needs a leak assessment. See <Link key="l" href="/leaking-shower-repair" className={inlineLink}>leaking shower repair</Link>.</>],
];

const matchCards: IconCard[] = [
  { title: "Size and Thickness", body: "The repaired tile needs to sit level with the rest.", Icon: Ruler },
  { title: "Colour and Finish", body: "Colour, texture and finish matched as closely as possible.", Icon: Grid2x2 },
  { title: "Grout Colour", body: "The grout around the repair is matched to the surrounding joints.", Icon: Paintbrush },
];

const priceFactors: IconCard[] = [
  { title: "Number of Tiles", body: "One tile or several in the same area.", Icon: Grid2x2 },
  { title: "Tile Type and Availability", body: "The type of tile and whether a matching replacement is available.", Icon: Layers },
  { title: "Wall or Floor, and Access", body: "Tight or awkward areas can take longer.", Icon: House },
  { title: "Condition Underneath", body: "A damaged bed needs more preparation.", Icon: Wrench },
];

const whyGroutix: IconCard[] = [
  { title: "Honest Advice", body: "We tell you when it is not a small job.", Icon: Search },
  { title: "Clear Quote First", body: "You know the price before work starts.", Icon: Check },
  { title: "Matched Finish", body: "Tile and grout matched as closely as possible.", Icon: Paintbrush },
  { title: "Clear Warranty Scope", body: "The applicable workmanship warranty is confirmed in your quote.", Icon: ShieldCheck },
];

const relatedServices = [
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/shower-regrouting-tiled-interior.webp", alt: "Shower regrouting in Melbourne, a freshly regrouted tiled shower with waterproof epoxy grout", href: "/shower-regrouting" },
  { title: "Leaking Shower Repair", text: "We find where the water is getting out and seal it at the source.", img: "/corner-shower-regrouting-worn-grout.webp", alt: "Leaking shower repair in Melbourne, a corner shower with worn, failing grout that lets water escape behind the tiles", href: "/leaking-shower-repair" },
  { title: "Balcony Leak Repairs", text: "Balcony regrouting and resealing that stops water before it spreads.", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Balcony leak repairs in Melbourne, herringbone balcony tiles regrouted and resealed with waterproof epoxy grout", href: "/balcony-leak-repairs" },
  { title: "Tile Regrouting", text: "Floor and wall tile regrouting that brings tired tiles back to life.", img: "/tile-regrouting-hero.webp", alt: "Tile regrouting in Melbourne, glossy white shower tiles and a tiled niche finished with fresh grout lines", href: "/tile-regrouting" },
  { title: "Epoxy Grout", text: "Waterproof, stain resistant epoxy grout for showers and wet areas.", img: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Epoxy grout in Melbourne — a hexagonal mosaic shower floor finished with waterproof epoxy grout", href: "/epoxy-grout" },
  { title: "Silicone Recaulking", text: "Old, mouldy silicone removed and replaced with a clean, watertight seal.", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Silicone recaulking in Melbourne, old failed silicone being removed from a shower base before resealing", href: "/silicone-recaulking" },
];

// FAQ 7 carries the same in-text link as the live page.
function faqAnswer(index: number, answer: string): ReactNode {
  if (index !== 6) return answer;
  const [before, after] = answer.split("leaking shower repair");
  return <>{before}<Link href="/leaking-shower-repair" className={inlineLink}>leaking shower repair</Link>{after}</>;
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

export default function SmallTilingJobsPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
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
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">SMALL TILING JOBS · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Small Tiling Jobs Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p>Groutix repairs and replaces broken, cracked and loose tiles, then matches the grout so the repair blends in. No full retile needed for a small problem.</p>
              </div>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges />
              </div>
              <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:justify-items-start">
                <div className="flex items-center gap-3.5 text-left">
                  <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                  <div>
                    <b className="block text-lg font-black leading-tight">10 Year Waterproof Warranty</b>
                    <span className="text-sm text-[#D6DCF5]">On eligible completed work</span>
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
              <Image src="/shower-regrouting-mosaic-feature-wall.webp" alt="Small tiling jobs in Melbourne, a mosaic feature strip and tiled shower niche finished by Groutix" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Small Tiling Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us which tile is cracked, loose or missing and add photos of the area. Photos are required, so we can see the tile and the match before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "Tile and grout matched as closely as possible", "Most small jobs finished in a single visit"].map((x) => (
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
        <Section id="tiling-results">
          <SectionHead k="Real Work" title="Small Tiling Repairs: Real Melbourne Work">
            <p className={lead}>Real Groutix repairs, photographed on the job across Melbourne. One tile, one corner or one patch, most small tiling work is a single problem area fixed properly so the tiles around it stay sound. No stock photos, no filters.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {recentWork.map((p) => (
              <figure key={p.src} className={`${box} overflow-hidden`}>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="p-4 text-[15px] font-bold text-slate-900">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-10 max-w-3xl text-center`}>
            Most small tiling jobs are one tile, one corner or one patch. Fixing them early stops water getting under the surrounding tiles, which is what turns a small repair into a <Link href="/leaking-shower-repair" className={inlineLink}>leaking shower repair</Link>.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="#quote-form" className={btnNavy}>Book a Free Inspection</Link>
            <a href={tel} className={btnGold}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 3. SIGNS */}
        <Section id="signs" alt>
          <SectionHead k="Signs to Check" title="Signs a Tile Needs Repair or Replacing" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signCards.map((c) => (
              <div key={c.title} className={card}>
                <h3 className={cardTitle}>{c.title}</h3>
                <p className={cardText}>{c.text}</p>
                <Link href={c.href} className="mt-3 inline-block text-sm font-bold text-[#2F63CC] hover:underline">{c.link} →</Link>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>One tile is a small job. A lot of loose tiles in one area needs a closer look.</p>
        </Section>

        {/* 4. WHAT WE DO */}
        <Section id="what-we-do">
          <SectionHead k="What We Do" title="Small Tiling Jobs We Do">
            <p className={lead}>Small fixes done properly, so you do not need a full retile.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <p className="mt-6 text-center text-sm leading-relaxed text-slate-500">We inspect the area and confirm the repair scope before work starts.</p>
        </Section>

        {/* 5. WHAT IT MEANS */}
        <Section id="what-it-means" alt>
          <SectionHead k="Reading the Problem" title="Loose, Cracked or Hollow: What It Means">
            <p className={lead}>A tile can fail for different reasons. Here is how we read it.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1100px]">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-left text-[15px] leading-relaxed">
                <caption className="sr-only">Tile symptoms, possible causes and the repair assessment.</caption>
                <thead>
                  <tr className="bg-[#001F97] text-white">
                    {["What you notice", "What it could mean", "What we do"].map((h) => <th key={h} scope="col" className="px-5 py-4 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {meaningRows.map(([notice, meaning, action], i) => (
                    <tr key={notice} className={`border-t border-slate-200 ${i % 2 ? "bg-[#F4F6FB]" : ""}`}>
                      <th scope="row" className="px-5 py-4 align-top font-bold text-slate-900">{notice}</th>
                      <td className="px-5 py-4 align-top text-slate-600">{meaning}</td>
                      <td className="px-5 py-4 align-top font-medium text-[#001F97]">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`${lead} mx-auto mt-7 max-w-3xl text-center`}>A hollow sound alone is not always a problem. We check before we recommend anything.</p>
          </div>
        </Section>

        {/* 6. MATCHING */}
        <Section id="matching">
          <SectionHead k="Getting a Match" title="Matching Your Tile" />
          <aside className={`${box} mb-6 border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <h3 className="text-xl font-bold text-slate-900">Spare Tiles Match Best</h3>
            <p className="mt-3 leading-relaxed text-slate-600">Spare tiles from the original job are the best match. If you have a few, keep them. If the tile is discontinued, we tell you what the closest options are before we start.</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">Please supply matching spare tiles if you have them. We confirm tile availability and supply arrangements before booking the repair.</p>
          </aside>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {matchCards.map((c) => <IconBox key={c.title} c={c} accent="border-t-[#2F63CC]" />)}
          </div>
        </Section>

        {/* 7. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our Process</p>
              <h2 className={h2}>Our Small Tiling Process</h2>
              <p className={lead}>Careful removal, a solid bed and a neat finish. Here is how it works.</p>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {smallTilingSteps.map(({ title, body }, i) => (
                  <li key={title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{body}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm leading-relaxed text-slate-500">We confirm the applicable workmanship warranty and repair scope in your quote.</p>
              <a href="#quote-form" className={`${btnNavy} mt-6`}>Book Your Free Quote →</a>
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              <Image src="/shower-regrouting-in-progress.webp" alt="Shower floor during a small tiling repair in Melbourne, old grout removed and tiles being refixed" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 8. WAIT TIME */}
        <Section id="wait-time">
          <SectionHead k="After the Job" title="How Long Until I Can Use It?" />
          <aside className={`${box} mx-auto max-w-[900px] border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <Clock className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
            <h3 className="text-xl font-bold text-slate-900">Adhesive and Grout Need Time to Set</h3>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">The adhesive and grout need time to set. We tell you the exact wait before we start. Keep foot traffic and water off the repair until we say it is ready.</p>
          </aside>
        </Section>

        {/* 9. COST */}
        <Section id="cost" alt>
          <SectionHead k="Pricing" title="What Does a Small Tiling Job Cost?">
            <p className={lead}>The price depends on the job, so we quote after we see it.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">A Clear Quote First</h3>
              <p className="mt-2 text-[#D6DCF5]">We quote by the job so you know the price before work starts.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote →</a>
          </div>
        </Section>

        {/* 10. HONEST SCOPE */}
        <Section id="honest-scope">
          <SectionHead k="Honest Scope" title="When It Is More Than a Small Job" />
          <aside className={`${box} mx-auto max-w-[1000px] border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <Search className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
            <h3 className="text-xl font-bold text-slate-900">We Tell You Before We Start</h3>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">
              If many tiles are loose, or there are signs of moisture, it may need more than a repair. A damp wall or a stain below are warning signs. We tell you before any work starts. See <Link href="/leaking-shower-repair" className={inlineLink}>leaking shower repair</Link> and <Link href="/tile-regrouting" className={inlineLink}>tile regrouting</Link>.
            </p>
          </aside>
        </Section>

        {/* 11. WHY GROUTIX */}
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

        {/* 12. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we have helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 13. PROPERTY */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For Property Professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Property Managers</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">A quick, visible fix before an inspection, a sale or a new tenant. Scheduled around tenants.</p>
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

        {/* 14. RELATED SERVICES */}
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

        {/* 15. SERVICE AREAS */}
        <Section id="service-areas">
          <p className={eyebrow}>Service Areas</p>
          <h2 className={`${h2} mb-3`}>Small Tiling Jobs Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We repair tiles across Melbourne, including <b>Brunswick</b>, <b>Essendon</b>, <b>Preston</b>, <b>Coburg</b>, <b>Reservoir</b>, <b>Thomastown</b>, <b>Epping</b>, <b>Heidelberg</b>, <b>Ivanhoe</b>, <b>Northcote</b>, <b>Fairfield</b>, <b>Box Hill</b>, <b>Doncaster</b>, <b>Templestowe</b>, <b>Balwyn</b>, <b>Kew</b>, <b>Hawthorn</b>, <b>Richmond</b>, <b>Fitzroy</b>, <b>Carlton</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Altona</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Hoppers Crossing</b>, <b>Frankston</b>, <b>Mornington</b>, <b>Cranbourne</b>, <b>Dandenong</b>, <b>Noble Park</b>, <b>Springvale</b>, <b>Clayton</b>, <b>Oakleigh</b>, <b>Bentleigh</b>, <b>Moorabbin</b>, <b>Cheltenham</b>, <b>Mentone</b>, <b>Ringwood</b>, <b>Croydon</b>, <b>Lilydale</b>, <b>Glen Waverley</b>, <b>Mount Waverley</b>, <b>Burwood</b>, <b>Ashwood</b> and surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 16. FAQ (schema is added by the route from lib/smallTilingContent) */}
        <Section id="faqs" alt>
          <SectionHead k="Your Questions, Answered" title="Small Tiling Jobs FAQs" />
          <FaqList items={smallTilingFaqs.map((f, i) => ({ q: f.q, a: faqAnswer(i, f.a) }))} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href="#quote-form" className={btnNavy}>Still Have Questions? Get a Free Quote →</a>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 17. FINAL CTA */}
        <section className="relative overflow-hidden bg-[#06124F] py-16 text-white md:py-20">
          <div className={`${wrap} relative text-center`}>
            <h2 className="mx-auto max-w-[720px] text-[clamp(28px,3.4vw,44px)] font-black leading-[1.12] [text-wrap:balance]">Get Your Free Quote Today</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Single tile repairs · Clear quote first · Matched grout finish</p>
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
