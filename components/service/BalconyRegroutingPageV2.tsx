"use client";

// New dedicated /balcony-regrouting page (2026-11-19): the SERVICE page for
// the head term "balcony regrouting melbourne", built on the balcony leak
// repairs page pattern. Intent split: this page owns regrouting (failed
// grout replaced, tiles stay); /balcony-leak-repairs owns active leaks and
// damage. The two pages cross link and never chase each other's terms.
// No before and after slider: no real balcony pair exists, finished work
// photos only. Visible copy carries no hyphens in compound words. FAQs stay
// in lib/balconyRegroutingContent (the route adds the FAQPage schema;
// speakable selectors #balcony-regrouting-intro and
// .balcony-regrouting-faq-answer are preserved).
// NO Service schema in this component: app/[slug]/page.tsx emits the
// Service + FAQPage schema for this slug, as it does for balcony leak
// repairs, so the component must not duplicate it.

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Building2, Check, ClipboardCheck, Clock, Droplets, Eye, Grid2x2, Layers, Phone, Search, ShieldCheck, Sparkles, Sun, Wrench,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact } from "@/components/SiteContentProvider";
import { BUSINESS } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { balconyRegroutingFaqs, balconyRegroutingIntro } from "@/lib/balconyRegroutingContent";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, heroWrap, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import { useGoogleRating } from "@/components/useGoogleRating";

type IconCard = { title: string; body: string; Icon: ComponentType<{ className?: string }> };

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
  { title: "Cracked or Crumbling Grout", text: "Grout lines that crack, flake or turn to powder when you run a key along them.", href: "#process", link: "How we replace it" },
  { title: "Grout Missing From the Joints", text: "Gaps where grout has fallen out, leaving open joints for rain to pour into.", href: "#what-is", link: "What regrouting does" },
  { title: "Stains That Never Clean Up", text: "Dark, stained joints that stay dirty no matter how hard you scrub.", href: "#epoxy", link: "Why epoxy stays clean" },
  { title: "White Chalky Stains", text: "White powdery marks on tiles or grout. Builders call it efflorescence, and it means water is moving through the surface.", href: "#why-grout-fails", link: "Why balcony grout fails" },
  { title: "Tiles That Sound Hollow", text: "A hollow sound when you tap the tiles can mean water has been getting under them.", href: "/small-tiling-jobs", link: "Loose and drummy tile repairs" },
  { title: "Water Sitting After Rain", text: "Puddles that sit for hours, or damp marks on the ceiling below, point to more than tired grout.", href: "/balcony-leak-repairs", link: "When it is a leak, not just grout" },
];

const whyFails: IconCard[] = [
  { title: "Sun and UV Damage", body: "Cement grout and cheap sealants dry out and crack under Melbourne sun, especially on north and west facing balconies.", Icon: Sun },
  { title: "Rain and Pooling Water", body: "Outdoor joints take every storm. Water sitting in cracked joints works its way under the tiles a little more each time.", Icon: Droplets },
  { title: "Movement in the Slab", body: "Balconies expand in summer heat and contract on cold nights. Rigid cement grout cannot flex with that movement, so it cracks along the joints.", Icon: Layers },
  { title: "The Wrong Grout Outdoors", body: "Plenty of balconies were grouted with indoor cement grout that was never made for weather. It is porous from day one and wears out fast outside.", Icon: Wrench },
];

const costFactors: IconCard[] = [
  { title: "Balcony Size", body: "More tiles means more joints to remove and rebuild.", Icon: Grid2x2 },
  { title: "Tile Size and Joint Width", body: "Small tiles and wide joints use more epoxy and take longer to finish neatly.", Icon: Layers },
  { title: "Condition of the Old Grout", body: "Hard, deep old grout takes longer to remove than grout that is already crumbling.", Icon: Wrench },
  { title: "Access and Building Rules", body: "Apartment access, lift bookings and permitted work hours can add setup time on high rise jobs.", Icon: Building2 },
];

const strataCards: IconCard[] = [
  { title: "Written Scope and Photos", body: "Discuss the photos and written scope your owners corporation, manager or insurer needs before work starts.", Icon: ClipboardCheck },
  { title: "Building Approved Hours", body: "We plan the work around your building's permitted hours, lift bookings and access rules.", Icon: Clock },
  { title: "Balcony Specialists", body: "Regrouting and leak work on tiled balconies is our core trade, in houses and towers alike.", Icon: Building2 },
  { title: "One Clear Contact", body: "Scope, scheduling and the finished result explained from the first call to the final check.", Icon: Phone },
];

const relatedServices = [
  { title: "Balcony Leak Repairs", text: "Active leak, water damage below or a membrane question? Start with a leak diagnosis.", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Balcony leak repairs in Melbourne, herringbone balcony tiles regrouted and resealed with waterproof epoxy grout", href: "/balcony-leak-repairs" },
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/shower-regrouting-tiled-interior.webp", alt: "Shower regrouting in Melbourne, a freshly regrouted tiled shower with waterproof epoxy grout", href: "/shower-regrouting" },
  { title: "Leaking Shower Repair", text: "We find where the water is getting out and seal it at the source.", img: "/corner-shower-regrouting-worn-grout.webp", alt: "Leaking shower repair in Melbourne, a corner shower with worn, failing grout that lets water escape behind the tiles", href: "/leaking-shower-repair" },
  { title: "Epoxy Grout", text: "Waterproof, stain resistant epoxy grout for showers, balconies and wet areas.", img: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Epoxy grout in Melbourne, a hexagonal mosaic shower floor finished with waterproof epoxy grout", href: "/epoxy-grout" },
  { title: "Tile Regrouting", text: "Floor and wall tile regrouting that brings tired tiles back to life.", img: "/tile-regrouting-hero.webp", alt: "Tile regrouting in Melbourne, glossy white shower tiles and a tiled niche finished with fresh grout lines", href: "/tile-regrouting" },
  { title: "Silicone Recaulking", text: "Old, mouldy silicone removed and replaced with a clean, watertight seal.", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Silicone recaulking in Melbourne, old failed silicone being removed from a shower base before resealing", href: "/silicone-recaulking" },
];

export default function BalconyRegroutingPageV2({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  const gr = useGoogleRating();

  const { phone, tel } = useContact();
  // Balcony reviews first, same as the balcony leak repairs page.
  const isBalcony = (r: Review) => /balcon(?:y|ies)/i.test(r.review);
  const orderedReviews = [...reviews.filter(isBalcony), ...reviews.filter((r) => !isBalcony(r))];

  const inspectionCta = (label = "Book Your Free Inspection") => (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
      <a href="#quote-form" className={btnNavy}>{label} →</a>
      <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
    </div>
  );

  const whyGroutix: IconCard[] = [
    { title: "10 Year Warranty", body: "On eligible completed work. Scope and terms confirmed in your written quote.", Icon: ShieldCheck },
    { title: `${rating.value.toFixed(1)} Star Google Rating`, body: `Based on ${gr.countLabel} Google reviews through our existing business review source.`, Icon: Sparkles },
    { title: "Grout and Leak Specialists", body: "Regrouting and sealing tiled balconies and wet areas is the work we do every day.", Icon: Wrench },
    { title: "Free Inspections", body: "Fixed written quotes before the agreed work starts. No obligation.", Icon: Search },
    { title: "Real Customer Reviews", body: "Read existing feedback from customers we have helped across Melbourne.", Icon: ClipboardCheck },
    { title: "Finished Work Walkthrough", body: "We explain the completed work and the cure time before we leave.", Icon: Eye },
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
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">BALCONY REGROUTING · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Balcony Regrouting Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p id="balcony-regrouting-intro">{balconyRegroutingIntro}</p>
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
              <Image src="/balcony-regrouting-tiles.webp" alt="Balcony regrouting in Melbourne, balcony tiles with fresh weatherproof epoxy grout after regrouting" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Balcony Regrouting Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us about your balcony and add photos of the grout lines, joints and edges. Photos help us see the condition before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free inspection, no obligation", "10 year warranty on eligible work", "Fixed written quote before work starts"].map((x) => (
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
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <figure className={`${box} overflow-hidden`}>
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
                <Image src="/balcony-leak-repair-watermarked.webp" alt="Finished balcony regrouting in Melbourne, fresh epoxy grout lines and resealed edges by Groutix" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="p-4 text-[15px] font-bold text-slate-900">Balcony regrouted and resealed with epoxy</figcaption>
            </figure>
            <div>
              <p className={eyebrow}>Real Work</p>
              <h2 className={h2}>Balcony Regrouting: Real Melbourne Work</h2>
              <p className={lead}>Finished Groutix balcony work, photographed on site. Every balcony is inspected first, because the right job depends on the condition of the grout, the joints and the surface underneath.</p>
            </div>
          </div>
          {inspectionCta()}
        </Section>

        {/* 3. SIGNS */}
        <Section id="signs" alt>
          <SectionHead k="Signs to Check" title="Signs Your Balcony Grout Is Failing">
            <p className={lead}>Outdoor grout rarely fails in a day. It warns you first. Here is what to look for on your own balcony.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signCards.map((c) => (
              <Link key={c.title} href={c.href} className={`${box} group block p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
                <h3 className={cardTitle}>{c.title}</h3>
                <p className={cardText}>{c.text}</p>
                <span className={inlineLink}>{c.link}</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* 4. WHAT IS BALCONY REGROUTING */}
        <Section id="what-is">
          <SectionHead k="The Service" title="What Balcony Regrouting Is, and What It Is Not">
            <p className={lead}>Regrouting is joint work. The failed grout comes out of the joints and new grout goes in. Your tiles, and the waterproofing under them, stay where they are.</p>
          </SectionHead>
          <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-2">
            <div className={`${box} border-t-4 border-t-[#FBBC04] p-7`}>
              <Check className="mb-4 h-7 w-7 text-[#2F63CC]" aria-hidden="true" />
              <h3 className="text-xl font-bold text-slate-900">What regrouting does</h3>
              <p className="mt-3 leading-relaxed text-slate-600">Failed, cracked grout is removed from every joint. The joints are cleaned out and rebuilt with weatherproof epoxy grout, and the movement joints and edges are resealed. The surface sheds water again and the balcony looks new, with the same tiles.</p>
            </div>
            <div className={`${box} border-t-4 border-t-[#001F97] p-7`}>
              <Layers className="mb-4 h-7 w-7 text-[#001F97]" aria-hidden="true" />
              <h3 className="text-xl font-bold text-slate-900">What it does not do</h3>
              <p className="mt-3 leading-relaxed text-slate-600">Regrouting cannot restore a failed waterproof membrane under the tiles. If your membrane has failed, the honest fix is a <Link href="/balcony-leak-repairs" className={inlineLink}>balcony leak repair</Link> or a rebuild. Our free inspection tells you which one your balcony needs before you spend anything.</p>
            </div>
          </div>
        </Section>

        {/* 5. WHY GROUT FAILS */}
        <Section id="why-grout-fails" alt>
          <SectionHead k="Outdoor Wear" title="Why Balcony Grout Fails in Melbourne">
            <p className={lead}>A balcony cops the weather that a bathroom never sees. Four forces wear the joints out.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyFails.map((c) => (
              <IconBox key={c.title} c={c} />
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>Apartment balconies in Southbank, Docklands and the CBD take wind driven rain at height. Bayside balconies in Brighton and St Kilda add salt air. Western suburbs balconies bake through summer. The joint wear is the same story in every postcode.</p>
        </Section>

        {/* 6. REGROUT OR REPAIR */}
        <Section id="regrout-or-repair">
          <SectionHead k="Which Fix?" title="Balcony Regrouting or Balcony Leak Repair?">
            <p className={lead}>The two services fix different problems. This is how to tell which one your balcony needs.</p>
          </SectionHead>
          <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-2">
            <div className={`${box} border-t-4 border-t-[#FBBC04] p-7`}>
              <h3 className="text-xl font-bold text-slate-900">Regrouting is likely enough if</h3>
              <ul className="mt-4 space-y-2.5">
                {["The grout is cracked, stained or crumbling but the tiles are firm", "There is no damp, staining or damage showing inside or below", "The balcony still drains and dries after rain", "You want the surface restored before small gaps become leaks"].map((x) => (
                  <li key={x} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /></span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${box} border-t-4 border-t-[#001F97] p-7`}>
              <h3 className="text-xl font-bold text-slate-900">Get a leak repair first if</h3>
              <ul className="mt-4 space-y-2.5">
                {["Water stains show on the ceiling or walls of the room below", "Paint bubbles or peels on walls under the balcony", "Tiles sound hollow or feel loose underfoot", "Water pools for hours instead of draining away"].map((x) => (
                  <li key={x} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#001F97] text-white"><Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /></span>
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">Start with <Link href="/balcony-leak-repairs" className={inlineLink}>balcony leak repairs</Link>. Once the cause is fixed, regrouting finishes the surface properly.</p>
            </div>
          </div>
        </Section>

        {/* 7. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={wrap}>
            <p className={eyebrow}>Our Process</p>
            <h2 className={h2}>Our Balcony Regrouting Process</h2>
            <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Inspect and Quote", desc: "We check the grout, movement joints, tiles and drainage, then give you a fixed written quote. Free, with no obligation." },
                { title: "Remove the Failed Grout", desc: "Cracked and crumbling grout is taken out of the joints and the joints are cleaned back to a sound base." },
                { title: "Rebuild With Epoxy Grout", desc: "Fresh weatherproof epoxy grout is packed into every joint in a colour matched to your tiles, or a new colour if you prefer." },
                { title: "Reseal the Joints and Edges", desc: "Movement joints, edges and junctions are resealed with flexible, weatherproof sealant made for outdoor use." },
                { title: "Cure and Handover", desc: "Epoxy needs 4 days to cure after completion before furniture and foot traffic return. We confirm the timing for your balcony and walk you through the finished work." },
              ].map((s, i) => (
                <li key={s.title} className={`${box} p-5`}>
                  <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.desc}</p>
                </li>
              ))}
              <li className={`${box} flex items-center p-5`}>
                <p className="font-semibold text-slate-700">Eligible work is backed by our 10 year warranty.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* 8. EPOXY */}
        <Section id="epoxy" alt>
          <SectionHead k="The Material" title="Why We Regrout Balconies With Epoxy Grout">
            <p className={lead}>Cement grout is porous. Outdoors, that is the whole problem. <Link href="/epoxy-grout" className={inlineLink}>Epoxy grout</Link> is a resin grout that sets hard, absorbs no water and shrugs off the weather that eats cement joints.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { title: "Absorbs No Water", body: "Rain sits on the surface and sheds off instead of soaking into the joint and under the tiles." },
              { title: "Built for Weather", body: "Made to handle sun, storms and the expansion and contraction of an outdoor slab through Melbourne seasons." },
              { title: "Stays Clean Longer", body: "Dirt and mould have nothing porous to grow into, so the joints keep their colour with a simple wash down." },
            ].map((c) => (
              <div key={c.title} className={`${box} p-6`}>
                <h3 className={cardTitle}>{c.title}</h3>
                <p className={cardText}>{c.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 9. COST */}
        <Section id="cost">
          <SectionHead k="Pricing" title="What Does Balcony Regrouting Cost in Melbourne?">
            <p className={lead}>Every balcony is quoted after we see it. These are the things that set the price.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {costFactors.map((c) => (
              <IconBox key={c.title} c={c} />
            ))}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">A Clear Quote First</h3>
              <p className="mt-2 text-[#D6DCF5]">Free inspection, then a fixed written quote before any work starts.</p>
            </div>
            <a href="#quote-form" className={`${btnGold} shrink-0`}>Get a Free Quote</a>
          </div>
        </Section>

        {/* 10. STRATA */}
        <Section id="strata" alt>
          <SectionHead k="For Property Professionals" title="Apartments, Owners Corporations and Landlords">
            <p className={lead}>Balcony grout failure is one of the most common maintenance items in Melbourne apartment buildings. We make the paperwork and the access easy.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {strataCards.map((c) => (
              <IconBox key={c.title} c={c} accent="border-t-[#FBBC04]" />
            ))}
          </div>
        </Section>

        {/* 11. WHY GROUTIX */}
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

        {/* 12. REVIEWS */}
        <Section id="reviews" alt>
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Google feedback from customers we have helped across Melbourne, in their own words.</p>
          </SectionHead>
          <ReviewsMarquee reviews={orderedReviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Reviews on Google →</a>
          </div>
        </Section>

        {/* 13. RELATED SERVICES */}
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
          <p className={`${lead} mt-7 text-center`}>Not sure if your balcony needs regrouting or a leak repair? Call us to arrange a free inspection.</p>
          {inspectionCta()}
        </Section>

        {/* 14. SERVICE AREAS */}
        <Section id="service-areas" alt>
          <p className={eyebrow}>Service Areas</p>
          <h2 className={`${h2} mb-3`}>Balcony Regrouting Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We regrout balconies across Melbourne, from apartment towers in the <b>Melbourne CBD</b>, <b>Southbank</b> and <b>Docklands</b> to bayside homes in <b>Brighton</b>, <b>St Kilda</b> and <b>Port Melbourne</b>, and family homes in <b>Richmond</b>, <b>Hawthorn</b>, <b>South Yarra</b>, <b>Carlton</b>, <b>Brunswick</b>, <b>Northcote</b>, <b>Preston</b>, <b>Coburg</b>, <b>Essendon</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Heidelberg</b>, <b>Box Hill</b>, <b>Glen Waverley</b>, <b>Clayton</b>, <b>Dandenong</b>, <b>Frankston</b>, <b>Mornington</b> and <b>Ringwood</b>, plus surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 15. FAQ (FAQPage + speakable schema are added by the route) */}
        <Section id="balcony-regrouting-faqs">
          <SectionHead k="Your Questions, Answered" title="Balcony Regrouting FAQs" />
          <FaqList items={balconyRegroutingFaqs} answerClassName="balcony-regrouting-faq-answer" />
          {inspectionCta("Still Have Questions? Get a Free Quote")}
        </Section>

        {/* 16. FINAL CTA */}
        <section className="relative overflow-hidden bg-[#06124F] py-16 text-white md:py-20">
          <div className={`${wrap} relative text-center`}>
            <h2 className="mx-auto max-w-[720px] text-[clamp(28px,3.4vw,44px)] font-black leading-[1.12] [text-wrap:balance]">Book Your Free Balcony Regrouting Quote</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#D6DCF5]">For balcony regrouting across Melbourne, call <a href={tel} className="font-bold text-white underline">{phone}</a> now. Or request a quote online.</p>
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Free inspection · Fixed written quote · 10 year warranty on eligible work</p>
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
