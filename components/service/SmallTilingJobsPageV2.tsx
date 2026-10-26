"use client";

// Redesigned /small-tiling-jobs page. Copy, links and FAQs are the same as
// components/SmallTilingJobsPage.tsx (kept for a one-line rollback); only the
// layout follows the new homepage.
// 2026-10-26 upgrade: shower-style photo hero (quote form moved to its own band
// under the hero); every photo live-verified with SEO alt text.

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Check, Clock, Grid2x2, Hammer, House, Layers, Paintbrush, Phone, Ruler, Search, ShieldCheck, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact } from "@/components/SiteContentProvider";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { smallTilingFaqs, smallTilingSteps } from "@/lib/smallTilingContent";
import {
  BeforeAfter, FaqList, FinalCta, MobileCallBar, PhotoCard, ReviewsMarquee, Section, SectionHead,
  box, btnGold, btnNavy, cardText, cardTitle, eyebrow, h2, heroWrap, inlineLink, lead, wrap, type PhotoCardData,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";

type IconCard = { title: string; body: ReactNode; Icon: ComponentType<{ className?: string }> };

/* ───────────── Content (unchanged from the live page) ───────────── */
// Card title and text are the live copy; the photo and link are new for the card layout.
const signs: PhotoCardData[] = [
  { title: "Cracked Tile", text: "A visible crack across the tile.", img: "/tile-regrouting-cracked-grout-closeup.webp", alt: "Cracked floor tile with broken grout", href: "#what-we-do", link: "Tile replacement" },
  { title: "Chipped Tile", text: "A chipped corner or edge.", img: "/shower-regrouting-rust-stained-tiles.webp", alt: "Floor tiles with chipped edges and damaged grout", href: "#matching", link: "Matching your tile", half: true },
  { title: "Loose Tile", text: "A tile that rocks or moves underfoot.", img: "/shower-regrouting-over-bath-tiles.webp", alt: "Loose tile edge and cracked grout beside a bath", href: "#what-it-means", link: "Loose, cracked or hollow?" },
  { title: "Hollow Sound", text: "A tile that sounds hollow when tapped.", img: "/grey-shower-floor-regrouting-top-view after.webp", alt: "Tiled floor being checked for hollow tiles", href: "#process", link: "How we test and refix" },
  { title: "Raised Edges", text: "An edge or corner that sits higher than the rest.", img: "/tiled-shower-floor-regrouting-wide before.webp", alt: "Floor tiles with uneven, lifted edges", href: "#cost", link: "What it costs", half: true },
  { title: "Missing Tile", text: "A tile that is missing or has fallen off the wall.", img: "/shower-regrouting-stained-grout-corner.webp", alt: "Shower corner with failed grout where tiles have lifted and fallen away", href: "#honest-scope", link: "When it is more than a small job" },
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
  ["Tiles keep coming loose in one area", "Moisture or movement under the tiles", <>We tell you if it needs a leak assessment. See <Link key="l" href="/leaking-shower-repair/" className={inlineLink}>leaking shower repair</Link>.</>],
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

// Real Groutix tile and grout jobs (the live page still shows "photos coming soon" boxes here).
const beforeAfter = [
  { src: "/shower-regrouting-corner-white-wall-tiles.webp", alt: "White corner wall tiles after a small tiling repair in a Melbourne bathroom" },
  { src: "/shower-regrouting-stone-look-wall-tiles.webp", alt: "Dark stone-look wall tiles after tile repair and regrouting" },
  { src: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Hexagonal mosaic floor tiles after repair and regrouting" },
  { src: "/beige-shower-floor-regrouting-top-view after.webp", alt: "Tiled shower floor after a small tiling repair and full regrout" },
];

const related: PhotoCardData[] = [
  { title: "Tile Regrouting", text: "Worn grout on floors, kitchens and laundries.", href: "/tile-regrouting/", img: "/shower-regrouting-beige-wall-tiles.webp", alt: "Beige wall tiles with fresh grout — tile regrouting in Melbourne", link: "View service" },
  { title: "Shower Regrouting", text: "Worn grout throughout the shower.", href: "/shower-regrouting/", img: "/shower-regrouting-tiled-niche.webp", alt: "Tiled shower niche with fresh grout — shower regrouting in Melbourne by Groutix", link: "View service" },
  { title: "Leaking Shower Repair", text: "When water is already getting out.", href: "/leaking-shower-repair/", img: "/leaking-shower-water-damage-wall.webp", alt: "Water damage on a wall next to a leaking shower", link: "View service" },
  { title: "Silicone and Recaulking", text: "Flexible seals at corners and edges.", href: "/silicone-recaulking/", img: "/white-tile-shower-regrouting-overhead after.webp", alt: "Shower screen freshly sealed with new silicone", link: "View service" },
];

// FAQ 7 carries the same in-text link as the live page.
function faqAnswer(index: number, answer: string): ReactNode {
  if (index !== 6) return answer;
  const [before, after] = answer.split("leaking shower repair");
  return <>{before}<Link href="/leaking-shower-repair/" className={inlineLink}>leaking shower repair</Link>{after}</>;
}

/* ───────────── Small pieces ───────────── */
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

/* ───────────── Page ───────────── */
export default function SmallTilingJobsPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  const { phone, tel } = useContact();

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        {/* 1. HERO (homepage style: photo background; photo panel instead of the form) */}
        <section className="relative scroll-mt-28 overflow-hidden bg-[linear-gradient(120deg,#06124F_0%,#0A1F7A_55%,#001F97_100%)] pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/Shower regrouting cover .webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#06124F_0%,#0A1F7A_55%,#001F97_100%)] opacity-85" />
          <div className={`${heroWrap} relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div className="text-center lg:text-left">
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">GROUTIX</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Small Tiling Jobs Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] lg:mx-0 leading-relaxed text-[#D6DCF5] sm:text-base">
                <p>Groutix repairs and replaces broken, cracked and loose tiles, then matches the grout so the repair blends in. No full retile needed for a small problem.</p>
              </div>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges />
              </div>
              <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 lg:justify-items-start sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="flex items-center gap-3.5 text-left">
                  <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                  <div>
                    <b className="block text-lg font-black leading-tight">10-Year Waterproof Warranty</b>
                    <span className="text-sm text-[#D6DCF5]">On eligible completed work</span>
                  </div>
                </div>
                <div className="sm:border-l sm:border-white/25 sm:pl-6">
                  <b className="block text-[28px] font-black leading-none">8,000+</b>
                  <b className="block text-base font-bold">Bathrooms Restored</b>
                  <span className="text-sm text-[#D6DCF5]">Across Melbourne &amp; regional Victoria</span>
                </div>
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-xl border border-white/25 bg-slate-200 shadow-2xl lg:aspect-[7/5] lg:max-w-none">
              <Image src="/shower-regrouting-mosaic-feature-wall.webp" alt="Small tiling jobs in Melbourne — a mosaic feature strip and tiled shower niche finished by Groutix" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM (moved out of the hero; keeps the #quote-form anchor) */}
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

        {/* 2. SIGNS */}
        <Section id="signs" alt>
          <SectionHead k="Signs to check" title="Signs a Tile Needs Repair or Replacing" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((c) => <PhotoCard key={c.title} c={c} imgH="h-[263px] lg:h-[375px]" />)}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>One tile is a small job. A lot of loose tiles in one area needs a closer look.</p>
        </Section>

        {/* 3. WHAT WE DO */}
        <Section id="what-we-do">
          <SectionHead k="What we do" title="Small Tiling Jobs We Do">
            <p className={lead}>Small fixes done properly, so you do not need a full retile.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <p className="mt-6 text-center text-sm leading-relaxed text-slate-500">We inspect the area and confirm the repair scope before work starts.</p>
        </Section>

        {/* 4. WHAT IT MEANS */}
        <Section id="what-it-means" alt>
          <SectionHead k="Reading the problem" title="Loose, Cracked or Hollow: What It Means">
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

        {/* 5. MATCHING */}
        <Section id="matching">
          <SectionHead k="Getting a match" title="Matching Your Tile" />
          <aside className={`${box} mb-6 border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <h3 className="text-xl font-bold text-slate-900">Spare Tiles Match Best</h3>
            <p className="mt-3 leading-relaxed text-slate-600">Spare tiles from the original job are the best match. If you have a few, keep them. If the tile is discontinued, we tell you what the closest options are before we start.</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">Please supply matching spare tiles if you have them. We confirm tile availability and supply arrangements before booking the repair.</p>
          </aside>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {matchCards.map((c) => <IconBox key={c.title} c={c} accent="border-t-[#2F63CC]" />)}
          </div>
        </Section>

        {/* 6. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our process</p>
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
              <Image src="/shower-regrouting-in-progress.webp" alt="Shower floor during a small tiling repair — old grout removed and tiles being refixed" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 7. WAIT TIME */}
        <Section id="wait-time">
          <SectionHead k="After the job" title="How Long Until I Can Use It?" />
          <aside className={`${box} mx-auto max-w-[900px] border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <Clock className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
            <h3 className="text-xl font-bold text-slate-900">Adhesive and Grout Need Time to Set</h3>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">The adhesive and grout need time to set. We tell you the exact wait before we start. Keep foot traffic and water off the repair until we say it is ready.</p>
          </aside>
        </Section>

        {/* 8. COST */}
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

        {/* 9. HONEST SCOPE */}
        <Section id="honest-scope">
          <SectionHead k="Honest scope" title="When It Is More Than a Small Job" />
          <aside className={`${box} mx-auto max-w-[1000px] border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <Search className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
            <h3 className="text-xl font-bold text-slate-900">We Tell You Before We Start</h3>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">
              If many tiles are loose, or there are signs of moisture, it may need more than a repair. A damp wall or a stain below are warning signs. We tell you before any work starts. See <Link href="/leaking-shower-repair/" className={inlineLink}>leaking shower repair</Link> and <Link href="/tile-regrouting/" className={inlineLink}>tile regrouting</Link>.
            </p>
          </aside>
        </Section>

        {/* 10. PROPERTY */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For property professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Property Managers</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">A quick, visible fix before an inspection, a sale or a new tenant. Scheduled around tenants.</p>
            </div>
            <Link href="/real-estate-property-services/" className={`${btnGold} shrink-0`}>Discuss a Property Job →</Link>
          </div>
        </section>

        {/* 11. WHY GROUTIX */}
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

        {/* 12. BEFORE & AFTER */}
        <Section id="before-after" alt>
          <SectionHead k="Our work" title="Before and After" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {beforeAfter.map((p) => <BeforeAfter key={p.src} src={p.src} title="" alt={p.alt} />)}
          </div>
        </Section>

        {/* 13. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 14. RELATED */}
        <Section id="related-services" alt>
          <SectionHead k="More ways we can help" title="Related Services" />
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {related.map((c) => <PhotoCard key={c.href} c={c} imgH="h-[263px]" sizes="(min-width:1024px) 25vw, 50vw" />)}
          </div>
        </Section>

        {/* 15. SERVICE AREAS (homepage layout: map + live suburb check) */}
        <Section id="service-areas">
          <p className={eyebrow}>Service areas</p>
          <h2 className={`${h2} mb-3`}>Which Melbourne Suburbs Do We Repair Tiles In?</h2>
          <p className="mb-8 text-[17px] leading-relaxed text-slate-600">Looking for small tiling jobs near you? Check your suburb below.</p>
          <HomeAreasV2 />
        </Section>

        {/* 16. FAQ (FAQPage schema is added by the route, as before) */}
        <Section id="faqs" alt>
          <SectionHead k="Your questions, answered" title="Small Tiling Jobs FAQs" />
          <FaqList items={smallTilingFaqs.map((f, i) => ({ q: f.q, a: faqAnswer(i, f.a) }))} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href="#quote-form" className={btnNavy}>Still Have Questions? Get a Free Quote →</a>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 17. FINAL CTA */}
        <FinalCta
          title="Get Your Free Quote Today"
          lines={["Honest advice and workmanship you can rely on.", "Single tile repairs · Clear quote first · Matched grout finish"]}
        />
      </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
