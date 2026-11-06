"use client";

// Redesigned /silicone-recaulking page (2026-11-04): shower page pattern.
// Results with real before and after sliders, text sign cards, where we
// reseal, silicone or grout table, why silicone fails, process, related
// services. Visible copy carries no hyphens in compound words. FAQs and
// steps stay in lib/siliconeRecaulkingContent (route adds the schema).
// FINAL (2026-11-06): real alt text on the slider images (SEO) only.
// NO Service schema in this component: app/[slug]/page.tsx already emits
// the Service + FAQPage schema for this slug, so adding one here would
// duplicate it (caught and corrected 2026-11-06, before deploy).
// IMAGES CORRECTED (2026-11-06, visually verified against the job
// library and Edeel's own uploads): slider 1 = Job 8 shower base pair
// (Edeel's originals), slider 2 = Job 16 shower corner pair, process =
// Job 16 corner with the failed sealant cut out. Earlier picks (Job 21
// base pair, Job 13 bath pair, Job 3 and Job 2 process shots) were
// replaced at Edeel's direction on 2026-11-06.

import Image from "next/image";
import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { Bath, Check, Clock, Droplets, Layers, House, Phone, Ruler, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { siliconeFaqs, siliconeSteps } from "@/lib/siliconeRecaulkingContent";
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
    heading: "Split Silicone Around a Shower Base, Stripped and Resealed",
    text: "The bead around this shower base had split along the edges and gone black at the corners, the classic path for water to escape behind the tiles. We cut the old silicone out completely, cleaned the joint and resealed it with fresh mould resistant silicone.",
    before: "/silicone-shower-base-before.webp",
    after: "/silicone-shower-base-after.webp",
    beforeAlt: "Shower base in Melbourne with split, peeling silicone around the edges before silicone recaulking",
    afterAlt: "The same shower base in Melbourne after silicone recaulking, a clean new bead and regrouted wall tiles",
  },
  {
    heading: "Blackened Corner Joints, Stripped Out and Resealed",
    text: "The silicone in this shower corner had gone black along the wall and floor junctions and split away from the tiles, so every shower pushed water straight into the corner. We cut the failed sealant out completely, cleaned the joints and resealed the corner and the floor junctions with fresh mould resistant silicone.",
    before: "/silicone-corner-before.webp",
    after: "/silicone-corner-after.webp",
    beforeAlt: "Shower corner in Melbourne with blackened, split silicone along the wall and floor junctions before silicone recaulking",
    afterAlt: "The same shower corner in Melbourne after silicone recaulking, fresh white seals along the corner and floor junctions",
  },
];

const signCards = [
  { title: "Black or Pink Mould", text: "Mould in the silicone bead that cleaning never shifts.", href: "#why-silicone-fails", link: "Why silicone fails" },
  { title: "Peeling or Lifting Edges", text: "The seal pulls away from the surface and lets water in behind it.", href: "#process", link: "How we reseal" },
  { title: "Cracked or Split Silicone", text: "Cracks and splits through the bead, often along the base and corners.", href: "/leaking-shower-repair", link: "Leaking shower repair" },
  { title: "Yellow or Hardened Silicone", text: "Silicone that has gone yellow or hard has lost its flex and its seal.", href: "#cost", link: "What it costs" },
  { title: "Gaps at the Tile", text: "Gaps between the bead and the tile where the bond has failed.", href: "#silicone-or-grout", link: "Silicone or grout?" },
  { title: "Shrinking at Corners", text: "A bead that has shrunk or pulled away at the corners.", href: "/shower-regrouting", link: "Shower regrouting" },
];

const whereCards: IconCard[] = [
  { title: "Shower Corners and Edges", body: "Flexible seals where shower walls and floors meet.", Icon: Droplets },
  { title: "Around the Bath", body: "A fresh bead along the bath edge.", Icon: Bath },
  { title: "Shower Screen Frames and Base Edges", body: "Seals around screen frames and base edges.", Icon: Layers },
  { title: "Vanities, Basins and Benchtops", body: "Neat joints between fixtures and tiled surfaces.", Icon: House },
  { title: "Kitchen Sinks and Splashbacks", body: "Flexible seals around kitchen wet areas.", Icon: Sparkles },
  { title: "Laundry Tubs and Wet Area Walls", body: "Resealing around tubs and wet area junctions.", Icon: Droplets },
];

const siliconeRows: Array<[string, string]> = [
  ["Inside corners and wall to wall", "Walls move and shrink"],
  ["Wall to floor, base to wall", "Different materials move at different rates"],
  ["Tile to bath, basin, benchtop or screen", "Two surfaces that expand differently"],
];

const failCauses: IconCard[] = [
  { title: "Moisture and Soap Scum", body: "Constant moisture and soap scum wear at the seal.", Icon: Droplets },
  { title: "Movement", body: "Corners and joints move over time.", Icon: Layers },
  { title: "Age", body: "Silicone does not last forever.", Icon: Clock },
  { title: "New Over Old", body: "New silicone laid over old silicone does not bond.", Icon: Wrench },
];

const priceFactors: IconCard[] = [
  { title: "Length of Silicone", body: "How much of the existing bead needs replacing.", Icon: Ruler },
  { title: "Location", body: "A shower corner versus a full bath surround.", Icon: Bath },
  { title: "Condition", body: "The condition of the old silicone and residue.", Icon: Wrench },
  { title: "Access", body: "Screens and fixtures can affect access.", Icon: Layers },
];

const whyGroutix: IconCard[] = [
  { title: "Honest Advice", body: "We tell you if it is grout, not silicone.", Icon: Check },
  { title: "Clear Quote First", body: "You know the price before work starts.", Icon: Check },
  { title: "Full Removal, Not Overlay", body: "The old bead is removed completely before resealing.", Icon: Layers },
  { title: "Clear Warranty Scope", body: "The applicable workmanship warranty is confirmed in your quote.", Icon: ShieldCheck },
];

const relatedServices = [
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/shower-regrouting-tiled-interior.webp", alt: "Freshly regrouted tiled shower with waterproof epoxy grout", href: "/shower-regrouting" },
  { title: "Leaking Shower Repair", text: "We find where the water is getting out and seal it at the source.", img: "/leaking-shower-after.webp", alt: "Shower floor after a leaking shower repair, regrouted and resealed", href: "/leaking-shower-repair" },
  { title: "Balcony Leak Repairs", text: "Balcony regrouting and resealing that stops water before it spreads.", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Regrouted balcony with herringbone tiles and fresh epoxy grout joints", href: "/balcony-leak-repairs" },
  { title: "Tile Regrouting", text: "Floor and wall tile regrouting that brings tired tiles back to life.", img: "/tile-regrouting-dark-floor-tiles-close-up.webp", alt: "Dark floor tiles regrouted with fresh, clean grout lines", href: "/tile-regrouting" },
  { title: "Epoxy Grout", text: "Waterproof, stain resistant epoxy grout for showers and wet areas.", img: "/shower-regrouting-in-progress-close-up.webp", alt: "Epoxy grout being applied to shower floor tiles during regrouting", href: "/epoxy-grout" },
  { title: "Small Tiling Jobs", text: "Loose, cracked or drummy tiles repaired and retiled to match.", img: "/bath-shower-corner-grout-close-up.webp", alt: "Regrouted corner of a shower over a bath with fresh grout lines", href: "/small-tiling-jobs" },
];

// FAQ answers 5 and 6 carry the same in-text links as the live page.
function faqAnswer(index: number, answer: string): ReactNode {
  const serviceLink = index === 4 ? { phrase: "shower regrouting", href: "/shower-regrouting" } : index === 5 ? { phrase: "leaking shower repair", href: "/leaking-shower-repair" } : null;
  if (!serviceLink) return answer;
  const [before, after] = answer.split(serviceLink.phrase);
  return <>{before}<Link href={serviceLink.href} className={inlineLink}>{serviceLink.phrase}</Link>{after}</>;
}

export default function SiliconeRecaulkingPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
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
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">SILICONE REPLACEMENT · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Silicone Replacement Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p>Groutix removes old, mouldy or peeling silicone and reseals the joint with fresh mould resistant silicone. We take the old bead out completely, so the new one bonds and holds.</p>
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
              <Image src="/shower-regrouting-silicone-removal-in-progress.webp" alt="Silicone recaulking in Melbourne, old failed silicone being removed from a shower base before resealing" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Silicone Replacement Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us where the silicone is peeling or mouldy and add photos of the joints. Photos are required, so we can see the bead and the surfaces before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "Old silicone fully removed, never laid over", "Mould resistant silicone finish"].map((x) => (
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
        <Section id="silicone-results">
          <SectionHead k="Real Results" title="Silicone Replacement Before and After: Real Melbourne Jobs">
            <p className={lead}>Every photo below is a real Groutix job. Drag the slider to compare the joint before we started and after the new bead went in. No stock photos, no filters.</p>
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
            Silicone is the flexible seal at every joint that moves, corners, base edges and around the bath. Once it splits or lifts, every shower pushes water behind the tiles, and a new bead smeared over the old one never bonds. If the water has already been getting out, see our <Link href="/leaking-shower-repair" className={inlineLink}>leaking shower repair</Link> page.
          </p>
        </Section>

        {/* 3. SIGNS */}
        <Section id="signs" alt>
          <SectionHead k="Signs to Check" title="Signs Your Silicone Needs Replacing">
            <p className={lead}>Silicone wears out before almost anything else in a bathroom. Look for these signs.</p>
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
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>Mould only on the surface may clean off. Mould through the bead, or a bead that has lifted, means it needs replacing.</p>
        </Section>

        {/* 4. WHERE */}
        <Section id="where">
          <SectionHead k="Around Your Home" title="Where We Replace Silicone">
            <p className={lead}>Anywhere two surfaces meet and need a flexible, waterproof seal.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whereCards.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
        </Section>

        {/* 5. SILICONE OR GROUT */}
        <Section id="silicone-or-grout" alt>
          <SectionHead k="The Right Material" title="Silicone or Grout? Which Joint Gets Which">
            <p className={lead}>Both seal your bathroom, but they do different jobs.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1100px]">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-left text-[15px] leading-relaxed">
                <caption className="sr-only">The right material for each type of tile and fixture joint.</caption>
                <thead>
                  <tr className="bg-[#001F97] text-white">
                    {["Joint", "Why", "What it needs"].map((h) => <th key={h} scope="col" className="px-5 py-4 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="px-5 py-4 align-top font-bold text-slate-900">Flat tile to tile joints</th>
                    <td className="px-5 py-4 align-top text-slate-600">The joint does not move much</td>
                    <td className="px-5 py-4 align-top text-slate-700">Grout. See <Link href="/shower-regrouting" className={inlineLink}>shower regrouting</Link> or <Link href="/tile-regrouting" className={inlineLink}>tile regrouting</Link>.</td>
                  </tr>
                  {siliconeRows.map(([joint, why]) => (
                    <tr key={joint} className="border-t border-slate-200 bg-[#EEF3FF]/60">
                      <th scope="row" className="px-5 py-4 align-top font-bold text-slate-900">{joint}</th>
                      <td className="px-5 py-4 align-top text-slate-600">{why}</td>
                      <td className="px-5 py-4 align-top font-bold text-[#001F97]">Silicone.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`${lead} mx-auto mt-7 max-w-3xl text-center`}>Grout in a corner cracks. Silicone on a flat joint peels. We use the right one in the right place.</p>
          </div>
        </Section>

        {/* 6. WHY SILICONE FAILS */}
        <Section id="why-silicone-fails">
          <SectionHead k="The Cause" title="Why Silicone Fails" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {failCauses.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <aside className={`${box} mt-6 border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <h3 className="text-xl font-bold text-slate-900">Why We Remove All of the Old Silicone</h3>
            <p className="mt-3 leading-relaxed text-slate-600">New silicone does not stick to old silicone. A bead laid over the old one looks fine for a few weeks and then peels. We cut out the old bead and clean the joint before we start.</p>
          </aside>
        </Section>

        {/* 7. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our Process</p>
              <h2 className={h2}>Our Silicone Replacement Process</h2>
              <p className={lead}>Clean, neat and made to last. Here is how it works.</p>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {siliconeSteps.map(({ title, body }, i) => (
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
              <Image src="/silicone-recaulking-process.webp" alt="Shower corner in Melbourne with the failed black silicone cut out during silicone recaulking, removed strips lying on the floor" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 8. CURE TIME */}
        <Section id="cure-time">
          <SectionHead k="After the Job" title="How Soon Can I Use My Shower?" />
          <div className="mx-auto max-w-[900px]">
            <aside className={`${box} border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
              <Clock className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
              <h3 className="text-xl font-bold text-slate-900">It Depends on the Silicone Used</h3>
              <p className="mt-3 text-[17px] leading-relaxed text-slate-600">We tell you the exact wait before we start so you can plan.</p>
            </aside>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[["Do Not Touch the Bead", "Leave it alone while it cures."], ["Keep the Area Dry", "Keep the shower dry until we tell you it is ready."]].map(([title, body]) => (
                <div key={title} className={`${box} flex items-start gap-4 p-6`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
                  <span>
                    <h3 className={cardTitle}>{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{body}</p>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 9. COST */}
        <Section id="cost" alt>
          <SectionHead k="Pricing" title="What Does Silicone Replacement Cost?">
            <p className={lead}>The price depends on how much silicone needs replacing, so we quote after we see it.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">A Clear Quote First</h3>
              <p className="mt-2 max-w-[760px] text-[#D6DCF5]">We quote by the job so you know the price before work starts. Often combined with a regrout. For shower prices see <Link href="/shower-regrouting" className="font-bold text-white underline">shower regrouting</Link>.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote →</a>
          </div>
        </Section>

        {/* 10. WHY GROUTIX */}
        <Section id="why-groutix">
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
        <Section id="reviews" alt>
          <SectionHead k="Customer Feedback" title="What Our Customers Say" />
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
              <h2 className={`${h2} text-white`}>Landlords, Agents and Strata</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">Fresh silicone is a quick, visible fix before an inspection, a sale or a new tenant. Scheduled around tenants. Most jobs are completed in a single visit. We confirm the visit schedule and cure time before work begins.</p>
            </div>
            <Link href="/real-estate-property-services" className={`${btnGold} shrink-0`}>Discuss a Property Job →</Link>
          </div>
        </section>

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
          <h2 className={`${h2} mb-3`}>Silicone Replacement Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We replace silicone across Melbourne, including <b>Brunswick</b>, <b>Essendon</b>, <b>Preston</b>, <b>Coburg</b>, <b>Reservoir</b>, <b>Thomastown</b>, <b>Epping</b>, <b>Heidelberg</b>, <b>Ivanhoe</b>, <b>Northcote</b>, <b>Fairfield</b>, <b>Box Hill</b>, <b>Doncaster</b>, <b>Templestowe</b>, <b>Balwyn</b>, <b>Kew</b>, <b>Hawthorn</b>, <b>Richmond</b>, <b>Fitzroy</b>, <b>Carlton</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Altona</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Hoppers Crossing</b>, <b>Frankston</b>, <b>Mornington</b>, <b>Cranbourne</b>, <b>Dandenong</b>, <b>Noble Park</b>, <b>Springvale</b>, <b>Clayton</b>, <b>Oakleigh</b>, <b>Bentleigh</b>, <b>Moorabbin</b>, <b>Cheltenham</b>, <b>Mentone</b>, <b>Ringwood</b>, <b>Croydon</b>, <b>Lilydale</b>, <b>Glen Waverley</b>, <b>Mount Waverley</b>, <b>Burwood</b>, <b>Ashwood</b> and surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 15. FAQ (schema is added by the route from lib/siliconeRecaulkingContent) */}
        <Section id="faqs" alt>
          <SectionHead k="Your Questions, Answered" title="Silicone Replacement FAQs" />
          <FaqList items={siliconeFaqs.map((f, i) => ({ q: f.q, a: faqAnswer(i, f.a) }))} />
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
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Full removal of old silicone · Clear quote first · Mould resistant finish</p>
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
File 2: lib/siliconeRecaulkingContent.ts (26 lines)

ts


export const SILICONE_META_TITLE = "Silicone Replacement Melbourne | Shower & Bath Recaulking | Groutix";

// Answers are shared by visible FAQs and JSON-LD. Product and warranty details
// stay qualified until silicone-only coverage and the installed product are confirmed.
export const siliconeFaqs = [
  { q: "What is silicone replacement?", a: "Removing old silicone and resealing the joint with new silicone." },
  { q: "Can I just put new silicone over the old?", a: "No. New silicone does not bond to old silicone and peels. The old bead is removed first." },
  { q: "How often should shower silicone be replaced?", a: "There is no fixed date. Replace it when it is mouldy through, peeling, cracked or has gaps." },
  { q: "Can mouldy silicone be cleaned instead?", a: "Surface mould can often be cleaned. Mould through the bead, or a lifted bead, means replacing it." },
  { q: "Silicone or grout: which do I need?", a: "Silicone for corners and edges that move, grout for flat tile joints. If both are failing, see shower regrouting." },
  { q: "Does new silicone fix a leaking shower?", a: "Only if the leak comes from the silicone. If water is getting out elsewhere, see leaking shower repair." },
  { q: "What silicone do you use?", a: "A mould resistant silicone made for wet areas." },
  { q: "How long before I can use my shower?", a: "It depends on the silicone. We tell you before we start." },
  { q: "How much does it cost to replace shower silicone in Melbourne?", a: "It depends on the length, location, condition and access. We quote after we see it." },
  { q: "Can you replace silicone around a bath or vanity?", a: "Yes. We replace silicone anywhere two wet area surfaces meet." },
  { q: "How long does new silicone last?", a: "It varies with the product, the joint and how the area is used and cleaned. A joint that was fully stripped and resealed lasts far longer than a bead laid over old silicone." },
  { q: "Why does silicone go black?", a: "Mould grows into the bead where moisture and soap scum sit. Once mould is through the bead rather than on the surface, cleaning will not shift it and the bead needs replacing." },
];

export const siliconePhotoSlots = ["Shower corner", "Bath edge", "Screen base", "Vanity"];
export const siliconeSteps = [
  { title: "Inspect and Mark", body: "We check the joint, the tile edges and the surface, and note any grout or tile problem." },
  { title: "Remove and Clean", body: "All old silicone and residue is removed. The joint is cleaned and left dry." },
  { title: "Reseal", body: "Fresh mould resistant silicone is applied and neatly tooled." },
  { title: "Cure and Recheck", body: "The bead cures before it meets water. We tell you the exact wait before we start." },
];
