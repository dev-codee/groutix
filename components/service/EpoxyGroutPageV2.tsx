"use client";

// FINAL (2026-11-06, updated 2026-11-07): Nov 4 pack + real alt text on the slider images (SEO)
// + an end Before and After section (section 13) with the original Job 1
// and Job 21 photos, as Edeel asked. The shared BeforeAfter component was
// NOT used: it fakes a pair from one photo. These are real separate photos.
// and the ReactNode import fix. Service and FAQ JSON-LD stay in this
// file, as on the live page. Results with real before and after sliders,
// honest benefits and trade offs, myths, process, related services.
// Visible copy carries no hyphens in compound words.

import Image from "next/image";
import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { AlertTriangle, Building2, Check, ClipboardCheck, Droplets, Grid2x2, Home, Layers, Phone, Search, ShieldCheck, ShowerHead } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { faqJsonLd } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, heroWrap, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";

const SITE_URL = "https://groutix.com";

type Icon = ComponentType<{ className?: string }>;
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
    heading: "Cement Grout Out, Waterproof Epoxy Grout In",
    text: "This corner shower had cement grout that kept absorbing water and feeding mould. We removed every joint down to a clean base and rebuilt them with two part epoxy grout, so the joints no longer soak up water at all.",
    before: "/epoxy-grout-shower-before.webp",
    after: "/epoxy-grout-shower-after.webp",
    beforeAlt: "Corner shower in Melbourne with stained, water damaged cement grout before epoxy grout regrouting",
    afterAlt: "The same corner shower in Melbourne after epoxy grout regrouting, clean even joints that do not absorb water",
  },
  {
    heading: "A Floor Transformed With an Epoxy Colour Change",
    text: "The tiles on this shower floor were sound, but the old grout had stained beyond cleaning. A full epoxy regrout in a fresh dark colour gave the floor a new look and a non porous finish that wipes clean.",
    before: "/epoxy-grout-floor-before.webp",
    after: "/epoxy-grout-floor-after.webp",
    beforeAlt: "Shower floor tiles in Melbourne with stained, worn cement grout before an epoxy grout colour change",
    afterAlt: "The same shower floor in Melbourne after epoxy grout regrouting in a dark colour, fresh even joints",
  },
];

const WHAT_IS: { Icon: Icon; title: string; desc: string }[] = [
  { Icon: Layers, title: "Resin, Not Cement", desc: "Epoxy grout is a two part resin grout, not a cement one." },
  { Icon: Droplets, title: "Does Not Absorb Water", desc: "Once it sets, it does not soak up water." },
  { Icon: ShieldCheck, title: "Resists Stains and Mould", desc: "There is nothing inside the joint for mould to grow in." },
];

const BENEFITS = ["Stain resistant.", "Non porous.", "Handles grease and cleaning products better.", "Colour stays even."];
const TRADE_OFFS = [
  "Costs more upfront than cement.",
  "Sets quickly, so it needs skilled application.",
  "Not right for every outdoor or stone surface. We check first.",
];

const WORKS_BEST: { Icon: Icon; title: string; link?: string }[] = [
  { Icon: ShowerHead, title: "Showers and bathrooms", link: "/shower-regrouting" },
  { Icon: Grid2x2, title: "Kitchens and splashbacks" },
  { Icon: Droplets, title: "Laundries" },
  { Icon: Layers, title: "Busy floors" },
  { Icon: Building2, title: "Commercial kitchens and food areas" },
  { Icon: Home, title: "Rentals and property managers" },
];

const COLOURS = ["Match the Existing", "Refresh with a New Colour", "Choose a Contrast"];

const MYTHS = [
  { myth: "Epoxy replaces waterproofing.", truth: "It does not. It seals the joint. It is not a membrane." },
  { myth: "It never needs cleaning.", truth: "Dirt can still sit on the surface. A gentle clean keeps it fresh." },
  { myth: "You can put it over old grout.", truth: "No. The old grout is removed first." },
  { myth: "All epoxy jobs are the same.", truth: "It sets fast, so the result depends on who applies it." },
];

const PROCESS = [
  { title: "Inspect and Match", desc: "Check the joints, tiles and colour." },
  { title: "Remove the Old Grout", desc: "All old grout is taken out, not covered." },
  { title: "Apply the Epoxy", desc: "Small batches, applied and cleaned off the same day, before it sets." },
  { title: "Cure and Recheck", desc: "The epoxy cures before water. We tell you the exact wait before we start." },
];

const CARE = ["Wait for the cure.", "Use gentle cleaners.", "Wipe dirt off the surface early."];

const COST_FACTORS: Array<[string, string]> = [
  ["Area", "More area means more joints and more product."],
  ["Tile size and joint width", "Small tiles and wide joints use more epoxy."],
  ["Colour and product", "Some colours and products cost more."],
  ["Condition of the old grout", "Hard, deep old grout takes longer to remove."],
];

const WHY: { Icon: Icon; title: string; desc?: string }[] = [
  { Icon: Search, title: "Honest Advice", desc: "Including where epoxy is not right." },
  { Icon: Layers, title: "Full Removal" },
  { Icon: ClipboardCheck, title: "Colour Matched" },
  { Icon: ShieldCheck, title: "10 Year Warranty", desc: "On eligible work." },
];

const relatedServices = [
  { title: "Shower Regrouting", text: "Full shower regrouting with waterproof epoxy grout and fresh seals.", img: "/shower-regrouting-tiled-interior.webp", alt: "Shower regrouting in Melbourne, a freshly regrouted tiled shower with waterproof epoxy grout", href: "/shower-regrouting" },
  { title: "Leaking Shower Repair", text: "We find where the water is getting out and seal it at the source.", img: "/corner-shower-regrouting-worn-grout.webp", alt: "Leaking shower repair in Melbourne, a corner shower with worn, failing grout that lets water escape behind the tiles", href: "/leaking-shower-repair" },
  { title: "Balcony Leak Repairs", text: "Balcony regrouting and resealing that stops water before it spreads.", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Balcony leak repairs in Melbourne, herringbone balcony tiles regrouted and resealed with waterproof epoxy grout", href: "/balcony-leak-repairs" },
  { title: "Tile Regrouting", text: "Floor and wall tile regrouting that brings tired tiles back to life.", img: "/tile-regrouting-hero.webp", alt: "Tile regrouting in Melbourne, glossy white shower tiles and a tiled niche finished with fresh grout lines", href: "/tile-regrouting" },
  { title: "Silicone Recaulking", text: "Old, mouldy silicone removed and replaced with a clean, watertight seal.", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Silicone recaulking in Melbourne, old failed silicone being removed from a shower base before resealing", href: "/silicone-recaulking" },
  { title: "Small Tiling Jobs", text: "Loose, cracked or drummy tiles repaired and retiled to match.", img: "/shower-regrouting-mosaic-feature-wall.webp", alt: "Small tiling jobs in Melbourne — a mosaic feature strip and tiled shower niche finished by Groutix", href: "/small-tiling-jobs" },
];

/* `link` only renders an in-text link on the page. `a` stays plain text for the FAQPage schema. */
const EPOXY_FAQS: { q: string; a: string; link?: { text: string; href: string } }[] = [
  { q: "What is epoxy grout?", a: "A two part resin grout. Once set, it does not absorb water." },
  {
    q: "Is epoxy grout better than cement grout?",
    a: "In wet areas, usually, because it does not absorb water or stain easily. It costs more and needs skilled application. See shower regrouting for the shower detail.",
    link: { text: "shower regrouting", href: "/shower-regrouting" },
  },
  { q: "Can you put epoxy over my existing grout?", a: "No. The old grout is removed first so the epoxy bonds." },
  { q: "Does epoxy grout need sealing?", a: "Not like cement grout does. We tell you how to care for it." },
  { q: "Will epoxy grout still get dirty?", a: "Dirt can sit on the surface, but it scrubs off. Mould has nothing to grow in inside the joint." },
  { q: "What colours does epoxy grout come in?", a: "Many. We can match your current colour or change it." },
  { q: "Does epoxy grout change colour over time?", a: "Epoxy is colourfast, so the colour you choose stays even instead of patching and darkening the way cement grout does as it absorbs water and dirt." },
  {
    q: "Can epoxy grout be used outdoors?",
    a: "Sometimes. Direct sun can affect how epoxy sets, so we check first. For balconies, see balcony leak repairs.",
    link: { text: "balcony leak repairs", href: "/balcony-leak-repairs" },
  },
  { q: "How long does epoxy grout last?", a: "Done properly, it holds up well in wet areas. Eligible completed work is backed by our 10 year waterproof warranty." },
  { q: "How long before I can use the area?", a: "It depends on the product. We tell you the exact wait before we start." },
  { q: "Why does epoxy grout cost more than cement grout?", a: "The material costs more, and it is applied in small batches by a skilled hand because it sets fast. The trade off is a joint that does not absorb water or stain." },
  { q: "How much does epoxy grout cost in Melbourne?", a: "It depends on the area, tile size, colour and condition. We quote after we see it." },
];

function faqAnswer(a: string, link?: { text: string; href: string }) {
  if (!link || !a.includes(link.text)) return a;
  const [before, ...rest] = a.split(link.text);
  return <>{before}<Link href={link.href} className={inlineLink}>{link.text}</Link>{rest.join(link.text)}</>;
}

/* The fixed Kirat Singh review shown on the live page. */
const KIRAT: Review = {
  name: "Kirat Singh",
  suburb: "Epoxy Regrouting",
  stars: 5,
  review: "Bathroom looks amazing after epoxy regrouting. Johnny did a great job. Highly professional and polite.",
};

export default function EpoxyGroutPageV2({ reviews = [], rating }: { reviews?: Review[]; rating?: BusinessRating }) {
  const { phone, tel } = useContact();

  const isKirat = (r: Review) => JSON.stringify(r).toLowerCase().includes("kirat");
  const mentionsEpoxy = (r: Review) => JSON.stringify(r).toLowerCase().includes("epoxy");
  const orderedReviews = [
    KIRAT,
    ...reviews.filter((r) => mentionsEpoxy(r) && !isKirat(r)),
    ...reviews.filter((r) => !mentionsEpoxy(r) && !isKirat(r)),
  ];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Epoxy grouting",
    name: "Epoxy Grout Melbourne",
    areaServed: { "@type": "City", name: "Melbourne" },
    provider: { "@type": "LocalBusiness", name: "Groutix", url: SITE_URL },
    url: `${SITE_URL}/epoxy-grout`,
  };

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(EPOXY_FAQS)) }} />

        {/* 1. HERO */}
        <section className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/dark-grey-shower-floor-regrouting.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_55%,rgba(0,0,0,0.68)_100%)]" />
          <div className={`${heroWrap} relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div className="text-center lg:text-left">
              <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">EPOXY GROUT · MELBOURNE</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">Epoxy Grout Melbourne</h1>
              <div className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] lg:mx-0 sm:text-base">
                <p>Groutix removes old cement grout and replaces it with epoxy grout. It is a resin grout that does not absorb water and resists stains and mould. We tell you honestly where epoxy is the right choice and where it is not.</p>
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
              <Image src="/shower-floor-regrouting-hex-mosaic-tiles.webp" alt="Epoxy grout in Melbourne, a hexagonal mosaic shower floor finished with waterproof epoxy grout" fill priority sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 1b. QUOTE FORM */}
        <section id="quote-form" className="scroll-mt-28 bg-slate-100 py-14 md:py-[72px]">
          <div className={`${heroWrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div>
              <p className={eyebrow}>Free Quote</p>
              <h2 className={h2}>Get Your Free Epoxy Grout Quote</h2>
              <p className={`${lead} mt-3.5`}>Tell us where the old grout is failing and add photos of the joints. Photos are required, so we can check the tiles and grout colour before we quote.</p>
              <ul className="mt-6 space-y-2.5">
                {["Free quote, no obligation", "10 year warranty on eligible completed work", "Grout colour matched to your tiles"].map((x) => (
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
        <Section id="epoxy-results">
          <SectionHead k="Real Results" title="Epoxy Regrouting Before and After: Real Melbourne Jobs">
            <p className={lead}>Every photo below is a real Groutix job. Drag the slider to compare the joints before we started and after the epoxy went in. No stock photos, no filters.</p>
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
            Cement grout is porous, so it drinks in water, stains and soap scum year after year. Epoxy is a resin, so the finished joint stays sealed and colour true, and a wipe brings it back. That is why most of our <Link href="/shower-regrouting" className={inlineLink}>shower regrouting</Link> is finished in epoxy.
          </p>
        </Section>

        {/* 3. WHAT IS EPOXY GROUT */}
        <Section id="what-is" alt>
          <SectionHead k="The Basics" title="What Is Epoxy Grout?">
            <p className={lead}>Epoxy grout is a two part resin grout, not a cement one. Once it sets, it does not soak up water.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {WHAT_IS.map(({ Icon, title, desc }) => (
              <div key={title} className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className={`${cardTitle} mt-4`}>{title}</h3>
                <p className={cardText}>{desc}</p>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>Dirt can still sit on the surface, but it scrubs off. There is nothing inside the joint for mould to grow in.</p>
        </Section>

        {/* 4. BENEFITS AND TRADE OFFS */}
        <Section id="benefits">
          <SectionHead k="The Honest Picture" title="Benefits and Trade Offs">
            <p className={lead}>Epoxy is not the answer to everything. Here is the honest picture.</p>
          </SectionHead>
          <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-8 md:grid-cols-2">
            <div className="grid content-start gap-3">
              <p className="text-[13px] font-bold uppercase tracking-[2px] text-[#001F97]">Benefits</p>
              {BENEFITS.map((b) => (
                <div key={b} className={`${box} flex items-center gap-4 p-5`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#001F97] text-white"><Check className="h-5 w-5" aria-hidden="true" /></span>
                  <p className="text-base font-bold text-slate-900">{b}</p>
                </div>
              ))}
            </div>
            <div className="grid content-start gap-3">
              <p className="text-[13px] font-bold uppercase tracking-[2px] text-[#7A5600]">Trade Offs</p>
              {TRADE_OFFS.map((t) => (
                <div key={t} className={`${box} flex items-center gap-4 border-l-4 border-l-[#FBBC04] p-5`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF4D1] text-[#7A5600]"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
                  <p className="text-base font-bold text-slate-900">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-center text-base text-slate-600">For the full shower comparison, see <Link href="/shower-regrouting" className={inlineLink}>shower regrouting</Link>.</p>
        </Section>

        {/* 5. WHERE IT WORKS BEST */}
        <Section id="where" alt>
          <SectionHead k="Where It Fits" title="Where Epoxy Grout Works Best" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WORKS_BEST.map(({ Icon, title, link }) => {
              const inner = (
                <>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <h3 className="text-lg font-bold leading-snug text-slate-900">{title}{link && <span className="ml-1 text-[#2F63CC]">→</span>}</h3>
                </>
              );
              return link ? (
                <Link key={title} href={link} className={`${box} flex items-center gap-4 p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC]`}>{inner}</Link>
              ) : (
                <div key={title} className={`${box} flex items-center gap-4 p-6`}>{inner}</div>
              );
            })}
          </div>
          <div className={`${box} mx-auto mt-6 max-w-[1000px] border-l-4 border-l-[#FBBC04] p-6`}>
            <h3 className={cardTitle}>Where We Are Careful</h3>
            <p className={cardText}>Outdoors in direct sun, and some natural or polished stone, need a closer look first. For balconies, see <Link href="/balcony-leak-repairs" className={inlineLink}>balcony leak repairs</Link>.</p>
          </div>
        </Section>

        {/* 6. COLOURS */}
        <Section id="colours">
          <SectionHead k="Colour" title="Epoxy Grout Colours">
            <p className={lead}>Epoxy comes in many colours. We match your current grout or change it.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {COLOURS.map((c, i) => (
              <div key={c} className={`${box} flex items-center gap-4 p-6`}>
                <span className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className={cardTitle}>{c}</h3>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl text-center`}>Colours look different on screen and on the wall, so we show you a sample before we start.</p>
        </Section>

        {/* 7. MYTHS */}
        <Section id="myths" alt>
          <SectionHead k="Clearing It Up" title="Myths About Epoxy Grout" />
          <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-2">
            {MYTHS.map((m) => (
              <div key={m.myth} className={`${box} p-6`}>
                <span className="inline-block rounded bg-[#FFF4D1] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#7A5600]">Myth</span>
                <h3 className={`${cardTitle} mt-3`}>&ldquo;{m.myth}&rdquo;</h3>
                <p className={cardText}>{m.truth}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 8. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our Process</p>
              <h2 className={h2}>Our Epoxy Grout Process</h2>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PROCESS.map((s, i) => (
                  <li key={s.title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.desc}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-l-[3px] border-[#FBBC04] pl-3 font-semibold text-slate-700">Eligible work is backed by our 10 year waterproof warranty.</p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              <Image src="/shower-regrouting-in-progress-close-up.webp" alt="Epoxy grout being applied to shower floor tiles during regrouting" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 9. AFTERCARE */}
        <Section id="aftercare" alt>
          <SectionHead k="Aftercare" title="Looking After Epoxy Grout" />
          <div className={`${box} mx-auto mb-6 max-w-[1000px] border-l-4 border-l-[#2F63CC] p-6`}>
            <p className="text-[17px] leading-relaxed text-slate-700">Epoxy does not need sealing the way cement grout does. A gentle clean is usually enough.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CARE.map((c) => (
              <div key={c} className={`${box} flex items-center gap-4 p-6`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
                <h3 className="text-lg font-bold leading-snug text-slate-900">{c}</h3>
              </div>
            ))}
          </div>
        </Section>

        {/* 10. COST */}
        <Section id="cost">
          <SectionHead k="Pricing" title="What Does Epoxy Grout Cost?">
            <p className={lead}>Epoxy costs more upfront than cement because the material and the application are more demanding. We quote after we see the job.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COST_FACTORS.map(([title, desc]) => (
              <div key={title} className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                <h3 className={cardTitle}>{title}</h3>
                <p className={cardText}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-2xl font-bold">A Clear Quote First</h3>
              <p className="mt-2 text-[#D6DCF5]">For shower prices, see <Link href="/shower-regrouting" className="font-bold text-white underline">shower regrouting</Link>.</p>
            </div>
            <Link href="/contact" className={`${btnGold} shrink-0`}>Get a Free Quote</Link>
          </div>
        </Section>

        {/* 11. WHY GROUTIX */}
        <Section id="why-groutix" alt>
          <SectionHead k="Why Groutix" title="Why Choose Groutix" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className={`${box} flex items-start gap-4 p-6`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><w.Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span>
                  <h3 className={cardTitle}>{w.title}</h3>
                  {w.desc && <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{w.desc}</p>}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 12. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Reviews" title="Customer Feedback" />
          <ReviewsMarquee reviews={orderedReviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href="https://www.google.com/maps/place/Groutix" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Verified Reviews on Google →</a>
          </div>
        </Section>

        {/* 13. BEFORE AND AFTER */}
        <Section id="before-after" alt>
          <SectionHead k="Real Work" title="Before and After">
            <p className={lead}>The same two showers, before we started and after the epoxy went in. Every photo is an original Groutix job photo, no stock and no filters.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <figure className="m-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                <Image src="/epoxy-grout-shower-before.webp" alt="Shower floor and wall tiles with stained, worn cement grout before epoxy grout regrouting in Melbourne" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
              </div>
              <figcaption className="mt-2.5 text-sm font-semibold text-slate-700">Stained, worn cement grout</figcaption>
            </figure>
            <figure className="m-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                <Image src="/epoxy-grout-shower-after.webp" alt="The same shower after epoxy grout regrouting in Melbourne, fresh even grout lines that do not absorb water" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
              </div>
              <figcaption className="mt-2.5 text-sm font-semibold text-slate-700">Fresh epoxy grout, sealed and even</figcaption>
            </figure>
            <figure className="m-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                <Image src="/epoxy-grout-floor-before.webp" alt="Shower base with old silicone stripped out and stained grout before an epoxy grout colour change in Melbourne" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
              </div>
              <figcaption className="mt-2.5 text-sm font-semibold text-slate-700">Old seal stripped, grout stained and tired</figcaption>
            </figure>
            <figure className="m-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                <Image src="/epoxy-grout-floor-after.webp" alt="The same shower after an epoxy grout colour change in Melbourne, regrouted and resealed with a bright finish" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
              </div>
              <figcaption className="mt-2.5 text-sm font-semibold text-slate-700">Colour changed epoxy grout, resealed edges</figcaption>
            </figure>
          </div>
        </Section>

        {/* 14. PROPERTY */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For Property Professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Commercial</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">Easy to clean grout suits rentals and commercial kitchens.</p>
              <p className="mt-4 flex items-start gap-3 text-lg font-bold">
                <Home className="mt-1 h-5 w-5 shrink-0 text-[#FBBC04]" aria-hidden="true" />
                <span>Most jobs are completed in a single visit<span className="block text-base font-normal text-[#D6DCF5]">Scheduled around tenants and trading hours.</span></span>
              </p>
            </div>
            <Link href="/real-estate-property-services" className={`${btnGold} shrink-0`}>Discuss a Property Job</Link>
          </div>
        </section>

        {/* 15. RELATED SERVICES */}
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

        {/* 16. SERVICE AREAS */}
        <Section id="service-areas">
          <p className={eyebrow}>Service Areas</p>
          <h2 className={`${h2} mb-3`}>Epoxy Grout Across Melbourne</h2>
          <p className="mb-8 max-w-3xl text-[17px] leading-relaxed text-slate-600">
            We apply epoxy grout across Melbourne, including <b>Brunswick</b>, <b>Essendon</b>, <b>Preston</b>, <b>Coburg</b>, <b>Reservoir</b>, <b>Thomastown</b>, <b>Epping</b>, <b>Heidelberg</b>, <b>Ivanhoe</b>, <b>Northcote</b>, <b>Fairfield</b>, <b>Box Hill</b>, <b>Doncaster</b>, <b>Templestowe</b>, <b>Balwyn</b>, <b>Kew</b>, <b>Hawthorn</b>, <b>Richmond</b>, <b>Fitzroy</b>, <b>Carlton</b>, <b>Footscray</b>, <b>Sunshine</b>, <b>Williamstown</b>, <b>Altona</b>, <b>Werribee</b>, <b>Point Cook</b>, <b>Hoppers Crossing</b>, <b>Frankston</b>, <b>Mornington</b>, <b>Cranbourne</b>, <b>Dandenong</b>, <b>Noble Park</b>, <b>Springvale</b>, <b>Clayton</b>, <b>Oakleigh</b>, <b>Bentleigh</b>, <b>Moorabbin</b>, <b>Cheltenham</b>, <b>Mentone</b>, <b>Ringwood</b>, <b>Croydon</b>, <b>Lilydale</b>, <b>Glen Waverley</b>, <b>Mount Waverley</b>, <b>Burwood</b>, <b>Ashwood</b> and surrounding suburbs.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 17. FAQ */}
        <Section id="faq" alt>
          <SectionHead title="Epoxy Grout FAQs" />
          <FaqList items={EPOXY_FAQS.map((f) => ({ q: f.q, a: faqAnswer(f.a, f.link) }))} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <Link href="/contact" className={btnNavy}>Still Have Questions? Get a Free Quote</Link>
            <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </Section>

        {/* 18. FINAL CTA */}
        <section className="relative overflow-hidden bg-[#06124F] py-16 text-white md:py-20">
          <div className={`${wrap} relative text-center`}>
            <h2 className="mx-auto max-w-[720px] text-[clamp(28px,3.4vw,44px)] font-black leading-[1.12] [text-wrap:balance]">Get Your Free Quote Today</h2>
            <p className="mx-auto mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
            <p className="mt-2 text-[15px] font-semibold text-[#FBBC04]">Full removal · Colour matched · 10 year warranty on eligible work</p>
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
