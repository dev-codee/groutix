"use client";

// Redesigned /tile-regrouting page. Copy, links and FAQs are the same as
// components/TileRegroutingPage.tsx (kept for a one-line rollback); only the
// layout follows the new homepage.
// 2026-10-26 upgrade: shower-style photo hero (quote form moved to its own band
// under the hero); every photo live-verified with SEO alt text.

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Check, Droplets, Footprints, Grid2x2, Home, Paintbrush, Phone, ShieldCheck, Sparkles, Utensils, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact } from "@/components/SiteContentProvider";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { tileGroutRows, tileRegroutingFaqs } from "@/lib/tileRegroutingContent";
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
  { title: "Cracked or Crumbling Grout", text: "Grout that cracks or breaks apart when you touch it.", img: "/tile-regrouting-cracked-grout-closeup.webp", alt: "Cracked, crumbling grout between floor tiles", href: "#spot-or-full", link: "Spot repair or full regrout?" },
  { title: "Stains That Stay", text: "Grout that stays stained after a proper clean.", img: "/beige-shower-floor-regrouting-top-view before.webp", alt: "Stained grout lines on a tiled floor", href: "#clean-or-regrout", link: "Clean first, or regrout?", half: true },
  { title: "Sunken or Missing Grout", text: "Low spots, missing grout or gaps between your tiles.", img: "/shower-regrouting-rust-stained-tiles.webp", alt: "Tiles with rust-stained, cracked and missing grout lines that let water through", href: "#process", link: "How we regrout", half: true },
  { title: "Returning Mould", text: "Mould or mildew that keeps coming back.", img: "/shower-regrouting-mouldy-grout-corner.webp", alt: "Mouldy grout lines on wall tiles", href: "/epoxy-grout/", link: "Epoxy grout", half: true },
  { title: "Loose Tiles", text: "Tiles that feel loose or move underfoot.", img: "/shower-regrouting-stained-grout-corner.webp", alt: "Cracked, failing grout in a tile corner — loose tiles often start with grout failure like this", href: "/small-tiling-jobs/", link: "Small tiling jobs" },
  { title: "Dirty Floor Lines", text: "Dark, dirty lines on kitchen and laundry floors.", img: "/tiled-shower-floor-regrouting-wide before.webp", alt: "Dark, dirty grout lines on kitchen and laundry floor tiles worn by foot traffic", href: "#grout-types", link: "Which grout suits which area?" },
];

const rooms: IconCard[] = [
  { title: "Kitchens", body: "Floors and splashbacks that face spills, grease and daily traffic.", Icon: Utensils },
  { title: "Laundries", body: "Tiled areas exposed to damp, detergents and water.", Icon: Droplets },
  { title: "Bathroom Floors and Walls", body: "Bathroom tiles outside the shower recess.", Icon: Home },
  { title: "Hallways, Entries and Living Floors", body: "Floor grout worn by dirt and foot traffic.", Icon: Footprints },
  { title: "Commercial and Rental Properties", body: "Tiled spaces in rentals, apartments and commercial properties.", Icon: Home },
  { title: "Balconies and Showers", body: <>See our dedicated <Link className={inlineLink} href="/balcony-leak-repairs/">balcony leak repairs</Link> and <Link className={inlineLink} href="/shower-regrouting/">shower regrouting</Link> pages.</>, Icon: Droplets },
];

const fixOptions: Array<{ label: string; title: string; body: ReactNode; pill: string }> = [
  { label: "Spot repair", title: "Small area, sound grout around it", body: "Small areas where the surrounding grout is sound may only need a spot repair.", pill: "bg-[#EEF3FF] text-[#001F97]" },
  { label: "Full regrout", title: "Many joints failing", body: "Widespread staining, failing joints or movement need a closer look and may require a full regrout.", pill: "bg-[#E8EDFE] text-[#2F63CC]" },
  { label: "Replace tiles", title: "Cracked, loose or hollow tiles", body: <>These need more than grout. See <Link href="/small-tiling-jobs/" className={inlineLink}>small tiling jobs</Link>.</>, pill: "bg-[#FFF4D1] text-[#7A5600]" },
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
  { title: "10-Year Warranty", body: "On eligible waterproof work. Scope confirmed in your quote.", Icon: ShieldCheck },
];

// Real Groutix floor regrouting jobs (the live page still shows "photos coming soon" boxes here).
const beforeAfter = [
  { src: "/beige-shower-floor-regrouting-top-view after.webp", alt: "Floor tiles after regrouting — clean, even grout lines across the whole floor" },
  { src: "/beige-shower-floor-regrouting-top-view before.webp", alt: "Stained floor grout before regrouting" },
  { src: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Hexagonal mosaic floor tiles after regrouting with fresh waterproof grout" },
  { src: "/balcony-regrouting-herringbone-tiles.webp", alt: "Herringbone balcony tiles after regrouting in a Melbourne home" },
];

const related: PhotoCardData[] = [
  { title: "Shower Regrouting", text: "Worn grout throughout the shower.", href: "/shower-regrouting/", img: "/shower-regrouting-in-progress-close-up.webp", alt: "Tile regrouting in progress — old grout being removed before the new grout goes in", link: "View service" },
  { title: "Balcony Leak Repairs", text: "Repair options for leaking balconies.", href: "/balcony-leak-repairs/", img: "/balcony-regrouting-tiles.webp", alt: "Tiled balcony after regrouting", link: "View service" },
  { title: "Epoxy Grout", text: "Stain resistant grout for wet areas.", href: "/epoxy-grout/", img: "/grey-shower-floor-envelope-cut-regrouting after.webp", alt: "Floor tiles with epoxy grout", link: "View service" },
  { title: "Small Tiling Jobs", text: "Individual tiles repaired or replaced.", href: "/small-tiling-jobs/", img: "/shower-regrouting-mosaic-strip-linear-drain.webp", alt: "Mosaic strip tiling with a linear drain — small tiling jobs in Melbourne", link: "View service" },
];

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
export default function TileRegroutingPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
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
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Tile Regrouting Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] lg:mx-0 leading-relaxed text-[#D6DCF5] sm:text-base">
                <p>Groutix removes worn grout from floors, kitchens, laundries and bathrooms and rebuilds the joints. Your tiles look clean and keep water out. Your tiles stay in place. We tell you honestly when a clean is enough.</p>
              </div>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges />
              </div>
              <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 lg:justify-items-start sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="flex items-center gap-3.5 text-left">
                  <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                  <div>
                    <b className="block text-lg font-black leading-tight">10-Year Waterproof Warranty</b>
                    <span className="text-sm text-[#D6DCF5]">On eligible waterproof work</span>
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
              <Image src="/tile-regrouting-dark-floor-tiles-close-up.webp" alt="Tile regrouting in Melbourne — dark floor tiles finished with fresh, clean grout lines" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM (moved out of the hero; keeps the #quote-form anchor) */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Tile Regrouting Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us which room is wearing out and add photos of the grout lines. Photos are required, so we can see the tiles and joints before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "10-year warranty on eligible waterproof work", "Grout colour matched to your tiles"].map((x) => (
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
          <SectionHead k="Signs to check" title="Signs Your Tile Grout Needs Regrouting">
            <p className={lead}>Grout wears out slowly, so it is easy to miss. Look for these signs.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((c) => <PhotoCard key={c.title} c={c} imgH="h-[263px] lg:h-[375px]" />)}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>One or two signs on a small area may only need a spot repair. Widespread wear means a full regrout.</p>
        </Section>

        {/* 3. EVERY ROOM */}
        <Section id="rooms">
          <SectionHead k="Every room" title="Tile Regrouting for Every Room">
            <p className={lead}>Every room wears grout differently. We match the method to the room.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
        </Section>

        {/* 4. SPOT OR FULL */}
        <Section id="spot-or-full" alt>
          <SectionHead k="Honest advice" title="Spot Repair or Full Regrout?">
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

        {/* 5. GROUT TYPES */}
        <Section id="grout-types">
          <SectionHead k="Choosing grout" title="Which Grout Suits Which Area?">
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
              We choose after we inspect and confirm the available materials in your quote. Learn more on our <Link href="/epoxy-grout/" className={inlineLink}>epoxy grout</Link> page.
            </p>
          </div>
        </Section>

        {/* 6. CLEAN OR REGROUT */}
        <Section id="clean-or-regrout" alt>
          <SectionHead k="Before you book" title="Clean First, or Regrout?">
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

        {/* 7. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-white py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="Our process" title="Our Tile Regrouting Process">
              <p className={lead}>Clean, tidy and matched to your tiles. Here is how it works.</p>
            </SectionHead>
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="flex flex-col rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-8 text-white sm:p-10">
                <Grid2x2 className="h-10 w-10 text-[#FBBC04]" aria-hidden="true" />
                <h3 className="mt-6 text-3xl font-bold leading-tight">Fresh grout.<br />Your existing tiles.</h3>
                <p className="mt-5 leading-relaxed text-[#D6DCF5]">We inspect first, remove worn grout and rebuild the joints with materials suited to your room.</p>
                <p className="my-7 border-t border-white/20 pt-6 text-sm leading-relaxed text-[#D6DCF5]">Eligible waterproof work is backed by our 10-year waterproof warranty. We confirm the applicable scope in your quote.</p>
                <a href="#quote-form" className={`${btnGold} mt-auto w-fit`}>Book Your Free Quote →</a>
              </div>
              <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {processSteps.map(([title, body], i) => (
                  <li key={title} className={`${box} p-6`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 8. COST */}
        <Section id="cost" alt>
          <SectionHead k="Pricing" title="What Does Tile Regrouting Cost?">
            <p className={lead}>The price depends on how much grout there is and what condition it is in. We quote after we see it.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((c) => <IconBox key={c.title} c={c} />)}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">A Clear Quote First</h3>
              <p className="mt-2 text-[#D6DCF5]">We quote by the job after inspection. For shower prices, see <Link href="/shower-regrouting/" className="font-bold text-white underline">shower regrouting</Link>.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote →</a>
          </div>
        </Section>

        {/* 9. PROPERTY */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For property professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Commercial</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">Rentals, apartments and commercial floors are regrouted around tenants and trading hours. We confirm the visit schedule and cure time before work begins.</p>
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
          <SectionHead k="Our work" title="Before and After: Real Tile Regrouting" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {beforeAfter.map((p) => <BeforeAfter key={p.src} src={p.src} title="" alt={p.alt} />)}
          </div>
        </Section>

        {/* 12. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 13. RELATED */}
        <Section id="related" alt>
          <SectionHead k="More ways we can help" title="Related Services" />
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {related.map((c) => <PhotoCard key={c.href} c={c} imgH="h-[263px]" sizes="(min-width:1024px) 25vw, 50vw" />)}
          </div>
        </Section>

        {/* 14. SERVICE AREAS (homepage layout: map + live suburb check) */}
        <Section id="service-areas">
          <p className={eyebrow}>Service areas</p>
          <h2 className={`${h2} mb-3`}>Which Melbourne Suburbs Do We Regrout Tiles In?</h2>
          <p className="mb-8 text-[17px] leading-relaxed text-slate-600">Looking for tile regrouting near you? Check your suburb below.</p>
          <HomeAreasV2 />
        </Section>

        {/* 15. FAQ (FAQPage schema is added by the route, as before) */}
        <Section id="faq" alt>
          <SectionHead k="Your questions, answered" title="Tile Regrouting FAQs" />
          <FaqList items={tileRegroutingFaqs} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href="#quote-form" className={btnNavy}>Still Have Questions? Get a Free Quote →</a>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 16. FINAL CTA */}
        <FinalCta
          title="Get Your Free Quote Today"
          lines={["Honest advice and workmanship you can rely on.", "Tiles stay in place · Clear quote first · Colour matched"]}
        />
      </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
