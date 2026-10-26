"use client";

// Redesigned /silicone-recaulking page. Copy, links and FAQs are the same as
// components/SiliconeRecaulkingPage.tsx (kept for a one-line rollback); only the
// layout follows the new homepage.
// 2026-10-26 upgrade: shower-style photo hero (quote form moved to its own band
// under the hero); every photo live-verified with SEO alt text.

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Bath, Check, Clock, Droplets, Layers, House, Phone, Ruler, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact } from "@/components/SiteContentProvider";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { siliconeFaqs, siliconeSteps } from "@/lib/siliconeRecaulkingContent";
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
  { title: "Black or Pink Mould", text: "Mould in the silicone bead.", img: "/shower-regrouting-signs-black-mould.webp", alt: "Mould and staining along a shower corner joint", href: "#why-silicone-fails", link: "Why silicone fails" },
  { title: "Peeling or Lifting Edges", text: "The seal pulls away from the surface.", img: "/shower-regrouting-mouldy-grout-corner.webp", alt: "Silicone lifting along the edge of a shower base", href: "#process", link: "How we reseal" },
  { title: "Cracked or Split Silicone", text: "Cracks and splits through the bead.", img: "/shower-regrouting-old-silicone-strips.webp", alt: "Old, cracked silicone stripped from a shower base — split beads let water behind the tiles", href: "/leaking-shower-repair/", link: "Leaking shower repair" },
  { title: "Yellow or Hardened Silicone", text: "Silicone that has gone yellow or hard.", img: "/bath-shower-corner-grout-close-up.webp", alt: "Old, discoloured silicone along a shower screen base", href: "#cost", link: "What it costs", half: true },
  { title: "Gaps at the Tile", text: "Gaps between the bead and the tile.", img: "/shower-regrouting-stained-grout-corner.webp", alt: "Failed silicone and mould at a shower wall junction letting water through the joint", href: "#silicone-or-grout", link: "Silicone or grout?", half: true },
  { title: "Shrinking at Corners", text: "A bead that has shrunk or pulled away at corners.", img: "/shower-over-bath-regrouting-patterned-tiles.webp", alt: "Shower over a bath where the silicone bead has shrunk and pulled away at the corners", href: "/shower-regrouting/", link: "Shower regrouting", half: true },
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

// Real Groutix jobs (the live page still shows "photos coming soon" boxes here).
const beforeAfter = [
  { src: "/shower-base-regrouting-corner-close-up.webp", alt: "Shower base corner after resealing — a clean new silicone bead along the base" },
  { src: "/shower-over-bath-regrouting-heritage-tiles.webp", alt: "Shower over a bath after resealing with fresh mould resistant silicone" },
  { src: "/shower-regrouting-white-tiles-acrylic-base.webp", alt: "Bathroom shower after silicone replacement and grout repairs by Groutix" },
  { src: "/shower-base-regrouting-beige-tiles.webp", alt: "Shower base after resealing — a clean new silicone bead around the acrylic base" },
];

const related: PhotoCardData[] = [
  { title: "Shower Regrouting", text: "Grout joints throughout the shower.", href: "/shower-regrouting/", img: "/shower-regrouting-in-progress.webp", alt: "Shower regrouting in progress with old grout removed", link: "View service" },
  { title: "Leaking Shower Repair", text: "Find and repair where water is getting out.", href: "/leaking-shower-repair/", img: "/leaking-shower-water-damage-wall.webp", alt: "Water damage on a wall next to a leaking shower", link: "View service" },
  { title: "Tile Regrouting", text: "Floors, kitchens and laundries.", href: "/tile-regrouting/", img: "/shower-floor-regrouting-dark-tiles.webp", alt: "Dark floor tiles with fresh grout lines — tile regrouting across Melbourne", link: "View service" },
  { title: "Epoxy Grout", text: "Stain resistant grout for wet areas.", href: "/epoxy-grout/", img: "/grey-shower-floor-envelope-cut-regrouting after.webp", alt: "Floor tiles with epoxy grout", link: "View service" },
];

// FAQ answers 5 and 6 carry the same in-text links as the live page.
function faqAnswer(index: number, answer: string): ReactNode {
  const serviceLink = index === 4 ? { phrase: "shower regrouting", href: "/shower-regrouting/" } : index === 5 ? { phrase: "leaking shower repair", href: "/leaking-shower-repair/" } : null;
  if (!serviceLink) return answer;
  const [before, after] = answer.split(serviceLink.phrase);
  return <>{before}<Link href={serviceLink.href} className={inlineLink}>{serviceLink.phrase}</Link>{after}</>;
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
export default function SiliconeRecaulkingPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
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
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Silicone Replacement Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] lg:mx-0 leading-relaxed text-[#D6DCF5] sm:text-base">
                <p>Groutix removes old, mouldy or peeling silicone and reseals the joint with fresh mould resistant silicone. We take the old bead out completely, so the new one bonds and holds.</p>
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
              <Image src="/shower-regrouting-silicone-removal-in-progress.webp" alt="Silicone recaulking in Melbourne — old, failed silicone being removed from a shower base before resealing" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM (moved out of the hero; keeps the #quote-form anchor) */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Silicone Replacement Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us where the silicone is peeling or mouldy and add photos of the joints. Photos are required, so we can see the bead and the surfaces before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "Old silicone fully removed — never laid over", "Mould resistant silicone finish"].map((x) => (
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
          <SectionHead k="Signs to check" title="Signs Your Silicone Needs Replacing">
            <p className={lead}>Silicone wears out before almost anything else in a bathroom. Look for these signs.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((c) => <PhotoCard key={c.title} c={c} imgH="h-[263px] lg:h-[375px]" />)}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>Mould only on the surface may clean off. Mould through the bead, or a bead that has lifted, means it needs replacing.</p>
        </Section>

        {/* 3. WHERE */}
        <Section id="where">
          <SectionHead k="Around your home" title="Where We Replace Silicone">
            <p className={lead}>Anywhere two surfaces meet and need a flexible, waterproof seal.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whereCards.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
        </Section>

        {/* 4. SILICONE OR GROUT */}
        <Section id="silicone-or-grout" alt>
          <SectionHead k="The right material" title="Silicone or Grout? Which Joint Gets Which">
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
                    <td className="px-5 py-4 align-top text-slate-700">Grout. See <Link href="/shower-regrouting/" className={inlineLink}>shower regrouting</Link> or <Link href="/tile-regrouting/" className={inlineLink}>tile regrouting</Link>.</td>
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

        {/* 5. WHY SILICONE FAILS */}
        <Section id="why-silicone-fails">
          <SectionHead k="The cause" title="Why Silicone Fails" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {failCauses.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <aside className={`${box} mt-6 border-l-4 border-l-[#FBBC04] p-6 sm:p-8`}>
            <h3 className="text-xl font-bold text-slate-900">Why We Remove All of the Old Silicone</h3>
            <p className="mt-3 leading-relaxed text-slate-600">New silicone does not stick to old silicone. A bead laid over the old one looks fine for a few weeks and then peels. We cut out the old bead and clean the joint before we start.</p>
          </aside>
        </Section>

        {/* 6. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our process</p>
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
              <Image src="/white-tile-shower-regrouting-overhead after.webp" alt="White tiled shower freshly resealed with new mould resistant silicone by Groutix Melbourne" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 7. CURE TIME */}
        <Section id="cure-time">
          <SectionHead k="After the job" title="How Soon Can I Use My Shower?" />
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

        {/* 8. COST */}
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
              <p className="mt-2 max-w-[760px] text-[#D6DCF5]">We quote by the job so you know the price before work starts. Often combined with a regrout. For shower prices see <Link href="/shower-regrouting/" className="font-bold text-white underline">shower regrouting</Link>.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote →</a>
          </div>
        </Section>

        {/* 9. PROPERTY */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For property professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Strata</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">Fresh silicone is a quick, visible fix before an inspection, a sale or a new tenant. Scheduled around tenants. Most jobs are completed in a single visit. We confirm the visit schedule and cure time before work begins.</p>
            </div>
            <Link href="/real-estate-property-services/" className={`${btnGold} shrink-0`}>Discuss a Property Job →</Link>
          </div>
        </section>

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

        {/* 11. BEFORE & AFTER */}
        <Section id="before-after" alt>
          <SectionHead k="Our work" title="Before and After" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {beforeAfter.map((p) => <BeforeAfter key={p.src} src={p.src} title="" alt={p.alt} />)}
          </div>
        </Section>

        {/* 12. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer feedback" title="What Our Customers Say" />
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 13. RELATED */}
        <Section id="related-services" alt>
          <SectionHead k="More ways we can help" title="Related Services" />
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {related.map((c) => <PhotoCard key={c.href} c={c} imgH="h-[263px]" sizes="(min-width:1024px) 25vw, 50vw" />)}
          </div>
        </Section>

        {/* 14. SERVICE AREAS (homepage layout: map + live suburb check) */}
        <Section id="service-areas">
          <p className={eyebrow}>Service areas</p>
          <h2 className={`${h2} mb-3`}>Which Melbourne Suburbs Do We Replace Silicone In?</h2>
          <p className="mb-8 text-[17px] leading-relaxed text-slate-600">Looking for silicone replacement near you? Check your suburb below.</p>
          <HomeAreasV2 />
        </Section>

        {/* 15. FAQ (FAQPage schema is added by the route, as before) */}
        <Section id="faqs" alt>
          <SectionHead k="Your questions, answered" title="Silicone Replacement FAQs" />
          <FaqList items={siliconeFaqs.map((f, i) => ({ q: f.q, a: faqAnswer(i, f.a) }))} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href="#quote-form" className={btnNavy}>Still Have Questions? Get a Free Quote →</a>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 16. FINAL CTA */}
        <FinalCta
          title="Get Your Free Quote Today"
          lines={["Honest advice and workmanship you can rely on.", "Full removal of old silicone · Clear quote first · Mould resistant finish"]}
        />
      </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
