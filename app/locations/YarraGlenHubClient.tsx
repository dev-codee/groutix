"use client";
import HeroContactBadges from "@/components/HeroContactBadges";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, ChevronLeft, ChevronRight, ChevronDown, Droplets, Grid2x2, Wrench, ShowerHead, Hammer, Building2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import type { Review, BusinessRating } from "@/lib/reviews";
import TrustedMarquee from "@/components/TrustedMarquee";
import FaqSection from "@/components/FaqSection";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import { BUSINESS } from "@/lib/seo";
import { useContact } from "@/components/SiteContentProvider";
import { useGoogleRating } from "@/components/useGoogleRating";

/* ─── Hero badge icons (match service page style) ─── */
const LocationIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <path d="M16 6a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" stroke="#001F97" strokeWidth="1.8" fill="#2F63CC" fillOpacity="0.25" />
    <circle cx="16" cy="13" r="2.5" fill="#001F97" />
  </svg>
);

const ShowerBadgeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <path d="M8 14h16M8 14c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#001F97" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 16v4M13 16v6M16 16v4M19 16v6M22 16v4" stroke="#2F63CC" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const WarrantyBadgeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <path d="M16 5l8 3v8c0 5-4 9-8 10-4-1-8-5-8-10V8l8-3z" stroke="#001F97" strokeWidth="1.8" fill="#2F63CC" fillOpacity="0.2" strokeLinejoin="round" />
    <path d="M12 16l3 3 5-5" stroke="#001F97" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Types ─── */
export type SuburbGroup = {
  title: string;
  suburbs: string[];
};

export type YarraGlenHubProps = {
  cityName: string;
  heroHeading: string;
  heroSubtitle: string;
  serviceAreaText: string;
  serviceAreaMapImage: string;
  heroImage: string;
  suburbGroups: SuburbGroup[];
  reviews: Review[];
  rating: BusinessRating;
  googleMapsApiKey?: string;
  parentSlug?: string;
  locationExplanation?: string;
  faqs?: Array<{ question: string; answer: string }>;
};

/* ─── ImgBox ─── */
function ImgBox({
  label,
  aspect = "aspect-[4/3]",
  className = "",
  src,
  objectClass = "object-cover",
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
  objectClass?: string;
}) {
  return (
    <div
      className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center ${className} rounded-xl border-2 border-transparent hover:border-accent transition-all duration-300 shadow-md hover:shadow-xl`}
    >
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />
      {src ? (
        <Image src={src} alt={label} fill className={`${objectClass} transition-transform duration-500 hover:scale-105`} />
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="relative text-center px-4 space-y-1 z-10">
            <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
            <p className="text-[12px] text-neutral-300">Add photo manually</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── PhotoSlider ─── */
function PhotoSlider({ cityName }: { cityName: string }) {
  const [idx, setIdx] = useState(0);
  const sliderImages = ["/epoxy-grout-shower-after.webp", "/silicone-shower-base-after.webp", "/leaking-shower-repaired-after.webp", "/balcony-centre-watermark.webp", "/shower-regrouting-tiled-interior.webp", "/tile-regrouting-hero.webp"];
  const total = sliderImages.length;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total], sliderImages[(idx + 2) % total]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleImages.map((img, i) => (
          <AnimatedImage key={`${idx}-${i}`} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`${cityName} Photo ${idx + i + 1}`}
              aspect="aspect-[4/3]"
              className="rounded-sm"
            />
          </AnimatedImage>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-sm bg-[#001F97] hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="h-9 w-9 rounded-sm bg-[#001F97] hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex-1 max-w-[120px] h-1 bg-neutral-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#001F97] rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Suburb Accordion ─── */
function SuburbAccordion({
  groups,
  cityName,
  parentSlug,
  onSelectQuery,
}: {
  groups: SuburbGroup[];
  cityName: string;
  parentSlug: string;
  onSelectQuery: (query: string) => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
      {groups.map((group, i) => (
        <div key={i}>
          <button
            onClick={() => {
              setOpenIdx(openIdx === i ? null : i);
              onSelectQuery(`${group.title}, ${cityName}, VIC, Australia`);
            }}
            className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-[#F8FAFF] transition-colors group"
          >
            <span className="font-bold text-neutral-900 text-base group-hover:text-primary transition-colors">
              {group.title}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-neutral-400 group-hover:text-primary transition-all duration-300 flex-shrink-0 ${
                openIdx === i ? "rotate-180 text-primary" : ""
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
            {openIdx === i && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden bg-[#F8FAFF]"
              >
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    {group.suburbs.map((suburb, j) => {
                      const slug = suburb.toLowerCase().replace(/\s+/g, "-");
                      return (
                        <Link
                          key={j}
                          href={`/locations/${parentSlug}/${slug}`}
                          className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0 group/suburb cursor-pointer hover:bg-white px-2 rounded-xl transition-colors"
                        >
                          <span className="text-base text-neutral-700 group-hover/suburb:text-primary transition-colors">
                            {suburb}
                          </span>
                          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ─── Services data ─── */
const SERVICES = [
  {
    slug: "shower-regrouting",
    title: "Shower Regrouting",
    desc: "We remove old, worn shower grout and install new, durable grout formulated specifically for moisture-prone environments, breathing new life into both your shower’s appearance and its waterproofing capabilities.",
  },
  {
    slug: "tile-regrouting",
    title: "Tile Regrouting",
    desc: "Refresh discolored, cracked, or worn-out grout lines across bathrooms, laundries, kitchens, balconies, and other tiled surfaces with a crisp, long-lasting result.",
  },
  {
    slug: "shower-base-repair",
    title: "Shower Base Repair",
    desc: "Repair cracked or leaking shower floors with targeted base restoration that rebuilds waterproofing integrity without requiring a full tear-out.",
  },
  {
    slug: "leaking-shower-repair",
    title: "Leaking Shower Repair",
    desc: "We trace shower leak causes to damaged grout lines, corner joints, and seals, then permanently repair the wet area instead of simply masking the issue.",
  },
  {
    slug: "balcony-leak-repairs",
    title: "Balcony Leak Repairs",
    desc: "Diagnose and repair balcony leaks by removing failed grout and deteriorated sealants, then restoring the area with weatherproof materials to protect your property from water damage.",
  },
  {
    slug: "silicone-recaulking",
    title: "Silicone & Recaulking",
    desc: "Remove old, mouldy silicone and apply fresh, mould-resistant sealant to wet area joints, delivering a clean, professional finish that protects against water ingress.",
  },
  {
    slug: "epoxy-grout",
    title: "Epoxy Grout",
    desc: "Upgrade to durable, non-porous epoxy grout that resists stains, mould, and water penetration, ideal for showers, balconies, and high-traffic tiled areas.",
  },
  {
    slug: "small-tiling-jobs",
    title: "Small Tiling Jobs",
    desc: "Swap out broken tiles, resecure loose tiles, and repair damaged grout to resolve isolated tile issues neatly and professionally.",
  },
  {
    slug: "real-estate-property-services",
    title: "Real Estate & Property Services",
    desc: "Assist landlords, property managers, and strata groups with efficient grout, shower, and wet-area repairs that reduce disruption and protect your investment.",
  },
];

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "shower-regrouting": Droplets,
  "tile-regrouting": Grid2x2,
  "shower-base-repair": Wrench,
  "leaking-shower-repair": ShowerHead,
  "balcony-leak-repairs": ShieldCheck,
  "silicone-recaulking": Wrench,
  "epoxy-grout": Grid2x2,
  "small-tiling-jobs": Hammer,
  "real-estate-property-services": Building2,
};

function getRegionSlug(cityName: string, heroSubtitle: string, suburbGroups: SuburbGroup[]): string {
  const text = `${cityName} ${heroSubtitle} ${suburbGroups.map((g) => g.title).join(" ")}`.toLowerCase();
  if (text.includes("frankston")) return "frankston";
  if (text.includes("lilydale")) return "lilydale";
  if (text.includes("kilmore")) return "kilmore";
  if (text.includes("ballarat")) return "ballarat";
  if (text.includes("yarra glen") || text.includes("yarra-glen") || text.includes("yarraglen")) return "yarra-glen";
  if (text.includes("geelong")) return "geelong";
  return "melbourne";
}


/* ─── Homepage pattern pieces (services, sliders, reviews) ─── */
const hubWrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-20 xl:px-28";
const hubEyebrow = "mb-2.5 text-[13px] font-bold uppercase tracking-[2px] text-[#2F63CC]";
const hubH2 = "text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.15] tracking-[-0.01em] text-slate-900 [text-wrap:balance]";
const hubLead = "mt-3 text-[17px] leading-relaxed text-slate-600";
const hubBox = "rounded-lg border border-slate-200 bg-white";
const hubBtn = "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 text-base font-bold transition-colors";

const CORE = [
  { slug: "shower-regrouting", title: "Shower Regrouting", tag: "Most booked", img: "/shower-regrouting-tiled-interior.webp",
    alt: "Shower regrouting in Yarra Glen, a freshly regrouted tiled shower with waterproof epoxy grout", desc: "Cracked or crumbling grout removed and rebuilt with waterproof epoxy, so your shower seals properly again." },
  { slug: "leaking-shower-repair", title: "Leaking Shower Repair", tag: "Leak repair", img: "/corner-shower-regrouting-worn-grout.webp",
    alt: "Leaking shower repair in Yarra Glen, a corner shower with worn, failing grout that lets water escape behind the tiles", desc: "We remove the failed grout and silicone and regrout your shower with waterproof epoxy, usually without removing tiles." },
  { slug: "balcony-leak-repairs", title: "Balcony Leak Repairs", tag: "Outdoor", img: "/balcony-centre-watermark.webp",
    alt: "Long balcony with herringbone tiles and a black metal railing after leak repairs", desc: "Failed grout and sealant rebuilt with weatherproof epoxy to stop water reaching the areas below." },
];
const MORE = [
  { slug: "tile-regrouting", title: "Tile Regrouting", desc: "Kitchens, laundries & floors", img: "/tile-regrouting-hero.webp", alt: "Tile regrouting in Yarra Glen, glossy white shower tiles and a tiled niche finished with fresh grout lines" },
  { slug: "silicone-recaulking", title: "Silicone & Recaulking", desc: "Mould resistant reseal", img: "/shower-regrouting-silicone-removal-in-progress.webp", alt: "Silicone recaulking in Yarra Glen, old failed silicone being removed from a shower base before resealing" },
  { slug: "epoxy-grout", title: "Epoxy Grout", desc: "Stain resistant upgrade", img: "/shower-floor-regrouting-hex-mosaic-tiles.webp", alt: "Epoxy grout in Yarra Glen, a hexagonal mosaic shower floor finished with waterproof epoxy grout" },
  { slug: "small-tiling-jobs", title: "Small Tiling Jobs", desc: "Cracked or loose tiles", img: "/shower-regrouting-mosaic-feature-wall.webp", alt: "Small tiling jobs in Yarra Glen, a mosaic feature strip and tiled shower niche finished by Groutix" },
];
const JOBS = [
  { before: "/epoxy-grout-shower-before.webp", after: "/epoxy-grout-shower-after.webp", title: "Shower regrout" },
  { before: "/epoxy-grout-floor-before.webp", after: "/epoxy-grout-floor-after.webp", title: "Shower floor regrout" },
  { before: "/leaking-shower-failed-grout-before.webp", after: "/leaking-shower-repaired-after.webp", title: "Leaking shower repair" },
];
const CORE_SLIDERS: Record<string, { before: string; after: string }> = {
  "shower-regrouting": { before: "/shower-regrouting-before.webp", after: "/shower-regrouting-after.webp" },
  "leaking-shower-repair": { before: "/leaking-shower-before.webp", after: "/leaking-shower-after.webp" },
};

function Stars({ n = 5, className = "" }: { n?: number; className?: string }) {
  return <span className={`tracking-[1px] text-[#FBBC04] ${className}`} aria-label={`${n} out of 5 stars`}>{"★".repeat(Math.round(n))}</span>;
}

function HubBeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const layer = (src: string) => (
    <div className="absolute inset-0">
      <Image src={src} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
    </div>
  );
  return (
    <figure className="m-0">
      <div className="relative aspect-square select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:aspect-[4/4.2]">
        <div className="absolute inset-0 overflow-hidden" role="img" aria-label={`${title}, before`}>{layer(before)}</div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} role="img" aria-label={`${title}, after`}>{layer(after)}</div>
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
        <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${handle}%` }} aria-hidden="true" />
        <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-black text-[#001F97] shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ left: `${handle}%` }} aria-hidden="true">↔</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`Drag to compare before and after: ${title}`} className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0" />
      </div>
      <figcaption className="mt-3 font-bold text-slate-900">{title}</figcaption>
    </figure>
  );
}

function HubCoreSlider({ before, after, title, flip }: { before: string; after: string; title: string; flip?: boolean }) {
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const layer = (src: string) => (
    <div className="absolute inset-0">
      <Image src={src} alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
    </div>
  );
  return (
    <div className={`relative aspect-[5/4] w-full select-none overflow-hidden ${flip ? "lg:order-2" : ""}`}>
      <div className="absolute inset-0 overflow-hidden" role="img" aria-label={`${title}, before`}>{layer(before)}</div>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} role="img" aria-label={`${title}, after`}>{layer(after)}</div>
      <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
      <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${handle}%` }} aria-hidden="true" />
      <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-black text-[#001F97] shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ left: `${handle}%` }} aria-hidden="true">↔</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`Drag to compare before and after: ${title}`} className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0" />
    </div>
  );
}

/* ─── Main Component ─── */

const yarraGlenJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/yarra-glen#service",
      name: "Shower, tile and balcony regrouting in Yarra Glen",
      serviceType: ["Shower regrouting", "Tile regrouting", "Balcony regrouting", "Leaking shower repair"],
      provider: { "@id": "https://groutix.com/#business" },
      areaServed: [
        { "@type": "Place", name: "Yarra Glen VIC 3775" },
        { "@type": "Place", name: "Christmas Hills VIC 3771" },
        { "@type": "Place", name: "Dixons Creek VIC 3775" },
        { "@type": "Place", name: "Steels Creek VIC 3775" },
        { "@type": "Place", name: "Tarrawarra VIC 3775" },
      ],
      url: "https://groutix.com/locations/yarra-glen",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Yarra Glen", item: "https://groutix.com/locations/yarra-glen" },
      ],
    },
  ],
};

export default function YarraGlenHubClient({
  cityName,
  heroHeading,
  heroSubtitle,
  serviceAreaText,
  serviceAreaMapImage,
  heroImage,
  suburbGroups,
  reviews,
  rating,
  googleMapsApiKey,
  parentSlug,
  locationExplanation,
  faqs,
}: YarraGlenHubProps) {
  const gr = useGoogleRating();
  const { phone, tel } = useContact();
  const [mapQuery, setMapQuery] = useState(`${cityName}, VIC, Australia`);
  const parent = parentSlug || getRegionSlug(cityName, heroSubtitle, suburbGroups);
  return (
    <main className="public-page min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(yarraGlenJsonLd) }} />
      {/* ── Hero + Quote Form (homepage pattern) ── */}
      <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-black pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
        <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.62)_55%,rgba(0,0,0,0.72)_100%)]" />
        <div className="relative mx-auto grid w-full max-w-[1248px] grid-cols-1 items-start gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]">
          <div className="text-center lg:text-left">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Yarra Valley Wet Area Specialists</p>
            <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
              {heroHeading}
            </h1>
            <p className="mx-auto mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#D6DCF5] sm:text-base lg:mx-0">
              {heroSubtitle}
            </p>
            <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
              <HeroContactBadges rating={rating} />
            </div>
            <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:justify-items-start">
              <div className="flex items-center gap-3.5 text-left">
                <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                <div>
                  <b className="block text-lg font-black leading-tight">10 Year Waterproof Warranty</b>
                  <span className="text-sm text-[#D6DCF5]">On every complete shower regrout</span>
                </div>
              </div>
              <div className="sm:border-l sm:border-white/25 sm:pl-6">
                <b className="block text-[28px] font-black leading-none">8,000+</b>
                <b className="block text-base font-bold">Showers &amp; Balconies Restored</b>
                <span className="text-sm text-[#D6DCF5]">Across the Yarra Valley &amp; regional Victoria</span>
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[560px] lg:max-w-none lg:self-start">
            <QuoteFormV2 />
          </div>
        </div>
      </section>

      <div>
        <TrustedMarquee />
      </div>


      {/* ── Section 2: Services (for Suburb) or Service Area (for City) ── */}
      {locationExplanation ? (
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-4xl lg:text-[52px] font-bold text-neutral-900 leading-tight">
                What <span className="text-accent">We Do</span>
              </h2>
              <span className="mx-auto block h-1.5 w-20 rounded-full bg-accent" />
              <p className="text-neutral-600 text-lg leading-relaxed">
                Groutix delivers shower regrouting, grout repair, leaky shower fixes, and tile renewal services for both residential and commercial spaces in {cityName}. Our priority-first approach addresses deteriorating grout joints, aging sealants, and water infiltration concerns before they evolve into costly, extensive bathroom problems.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((s, i) => {
                const Icon = SERVICE_ICONS[s.slug] ?? Droplets;
                return (
                  <motion.div
                    key={s.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={`/${s.slug}`}
                      className="group border border-neutral-200 rounded-sm p-6 hover:border-accent hover:shadow-md transition-all flex flex-col justify-between gap-6 bg-white relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="space-y-4">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-primary">
                          <Icon className="h-7 w-7" />
                        </span>
                        <h3 className="font-bold text-neutral-900 text-xl group-hover:text-primary transition-colors">
                          {s.title}
                        </h3>
                        <p className="text-base text-neutral-600 leading-relaxed">{s.desc}</p>
                      </div>
                      <span className="text-base font-bold text-accent group-hover:underline">
                        Learn more →
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/contact"
                className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
              >
                Request A Quote
              </Link>
              <a
                href={tel}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold px-6 py-3 rounded-sm text-base transition-colors flex items-center gap-2 active:scale-95"
              >
                <Phone className="h-4 w-4" /> Get In Touch
              </a>
            </div>
          </div>
        </AnimatedSection>
      ) : (
        <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedImage className="relative">
              <ImgBox
                src={serviceAreaMapImage}
                label={`${cityName} Service Area Map`}
                aspect="aspect-[4/3]"
                className="rounded-xl"
              />
              <div className="relative mt-4 mx-4 lg:mx-0 lg:absolute lg:bottom-4 lg:left-4 lg:right-4 bg-accent text-primary-dark p-6 rounded-xl shadow-xl z-10">
                <p className="text-base sm:text-lg font-bold leading-relaxed">
                  Clear advice, specialist workmanship and proven repair systems on every wet-area project.
                </p>
              </div>
            </AnimatedImage>
            <div className="space-y-6 text-neutral-800">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-[42px] font-black text-[#001F97] leading-tight tracking-tight"
              >
                Our Service Area
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                {serviceAreaText.split("\n\n").map((para, i) => (
                  <p key={i} className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                    {para}
                  </p>
                ))}
                <p className="text-base leading-relaxed text-neutral-600">For worn grout in kitchens, laundries and floors, see our <Link href="/tile-regrouting/" className="font-bold text-accent underline">kitchen and laundry regrouting</Link> service.</p>
              </motion.div>
              <Link
                href="#suburbs"
                className="inline-flex items-center text-base font-bold text-primary hover:underline transition-colors"
              >
                Find Your Suburb →
              </Link>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ── What We Do: Services (homepage pattern) ── */}
      <section id="services" className="scroll-mt-28 bg-white py-14 md:py-20">
        <div className={hubWrap}>
          <div className="mx-auto mb-10 max-w-[760px] text-left md:text-center">
            <p className={hubEyebrow}>What we do</p>
            <h2 className={hubH2}>Shower and Balcony Regrouting Services</h2>
            <p className={hubLead}>Fix the cause of the leak, not the whole bathroom.</p>
          </div>
          <div className="mb-10 flex flex-col gap-6 lg:gap-8">
            {CORE.map((sv, i) => (
              <div key={sv.slug} className={`${hubBox} grid grid-cols-1 overflow-hidden ${i === 1 ? "lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]" : "lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]"}`}>
                {CORE_SLIDERS[sv.slug] ? (
                  <HubCoreSlider before={CORE_SLIDERS[sv.slug].before} after={CORE_SLIDERS[sv.slug].after} title={sv.title} flip={i === 1} />
                ) : (
                  <div className={`relative aspect-[5/4] w-full overflow-hidden ${i === 1 ? "lg:order-2" : ""}`}>
                    <Image src={sv.img} alt={sv.alt} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
                  </div>
                )}
                <div className={`flex flex-col items-center justify-center p-7 text-center sm:p-10 lg:p-12 ${i === 1 ? "lg:order-1" : ""}`}>
                  <p className={hubEyebrow}>{sv.tag}</p>
                  <h3 className={hubH2}>{sv.title}</h3>
                  <p className={`${hubLead} max-w-[52ch]`}>{sv.desc}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href={`/${sv.slug}`} className={`${hubBtn} bg-[#001F97] text-white hover:bg-[#00167A]`}>Learn more →</Link>
                    <a href="#quote-form" className={`${hubBtn} bg-[#FBBC04] text-[#0F172A] hover:bg-[#E5AA00]`}>Get a Free Quote</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MORE.map(({ slug, title, desc, img, alt }) => (
              <Link key={slug} href={`/${slug}`} className={`${hubBox} group flex items-start gap-4 p-5 text-slate-900 transition hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200"><Image src={img} alt={alt} fill sizes="48px" className="object-cover" /></span>
                <span>
                  <b className="block text-[17px]">{title}</b>
                  <span className="block text-sm text-slate-600">{desc}</span>
                  <span className="mt-2 block text-sm font-bold text-[#2F63CC] group-hover:underline">Learn more →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real Jobs: Before and After (homepage pattern) ── */}
      <section id="before-after" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
        <div className={hubWrap}>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={hubEyebrow}>Real work</p>
              <h2 className={hubH2}>Before and After: Real Regrouting Results</h2>
              <p className={hubLead}>Real Groutix jobs, not stock photos. Drag the slider to see the after.</p>
            </div>
            <Link href="/shower-regrouting" className={`${hubBtn} border border-slate-300 bg-white text-[#001F97] hover:border-[#001F97]`}>See more jobs</Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {JOBS.map((jb) => <HubBeforeAfter key={jb.title} before={jb.before} after={jb.after} title={jb.title} />)}
          </div>
        </div>
      </section>

      {/* ── Suburb Categories Accordion or Location Explanation ── */}
      <AnimatedSection id="suburbs" className="bg-white py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-10">
          {locationExplanation ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              {/* Map Column */}
              <div className="lg:col-span-5 w-full">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square w-full rounded-xl overflow-hidden border border-neutral-200 shadow-md">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      mapQuery
                    )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  />
                  
                  {/* Custom Open in Maps Button */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 left-3 bg-white text-neutral-800 text-xs font-bold px-3 py-2 rounded-xl shadow hover:bg-neutral-100 transition-all flex items-center gap-1.5 border border-neutral-200 z-10"
                  >
                    <span>Open in Maps</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Accordion / Content Column */}
              <div className="lg:col-span-7 w-full space-y-6 text-neutral-800">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl lg:text-[42px] font-black text-[#001F97] leading-tight tracking-tight"
                >
                  {cityName}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal"
                >
                  {locationExplanation.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </motion.div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10 space-y-3">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight"
                >
                  Suburbs We Service in <span className="text-accent">{cityName}</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-neutral-600 text-base leading-relaxed max-w-2xl"
                >
                  Groutix services the full {cityName} region. Select a suburb area below to view the locations we cover.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Map Column */}
                <div className="lg:col-span-5 w-full">
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square w-full rounded-xl overflow-hidden border border-neutral-200 shadow-md">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        mapQuery
                      )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    />
                    
                    {/* Custom Open in Maps Button */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 left-3 bg-white text-neutral-800 text-xs font-bold px-3 py-2 rounded-xl shadow hover:bg-neutral-100 transition-all flex items-center gap-1.5 border border-neutral-200 z-10"
                    >
                      <span>Open in Maps</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Accordion Column */}
                <div className="lg:col-span-7 w-full">
                  <SuburbAccordion
                    groups={suburbGroups}
                    cityName={cityName}
                    parentSlug={parent}
                    onSelectQuery={(query) => setMapQuery(query)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </AnimatedSection>

      {/* ── Reviews (homepage pattern) ── */}
      <section id="reviews" className="scroll-mt-28 bg-white py-14 md:py-20">
        <div className={hubWrap}>
          <div className="mx-auto mb-10 max-w-[760px] text-left md:text-center">
            <p className={hubEyebrow}>Customer feedback</p>
            <h2 className={hubH2}>What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2.5 rounded-lg bg-[#001F97] p-7 text-white">
              <span className="flex items-center gap-2.5 font-medium">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Image src="/google-logo.svg" alt="" width={18} height={18} /></span>
                Google Rating
              </span>
              <span className="text-[60px] font-black leading-none">{rating.value.toFixed(1)}</span>
              <Stars n={rating.value} className="text-[22px]" />
              <span className="text-[15px] text-[#D6DCF5]">Based on {gr.countLabel} Google reviews</span>
              <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={`${hubBtn} mt-auto bg-[#FBBC04] text-[#0F172A] hover:bg-[#E5AA00]`}>Read Verified Reviews</a>
            </div>
            <div className="review-marquee-wrap min-w-0 overflow-hidden rounded-lg [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
              <div className="review-marquee flex w-max py-1" style={{ ["--marquee-duration" as string]: `${Math.max(30, reviews.length * 8)}s` }}>
                {[...reviews, ...reviews].map((r, i) => (
                  <blockquote key={`${r.name}-${i}`} aria-hidden={i >= reviews.length || undefined}
                    className={`${hubBox} m-0 mr-5 flex w-[82vw] shrink-0 flex-col gap-3.5 p-6 sm:w-[340px]`}>
                    <div className="flex items-center gap-3">
                      {r.photoUri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoUri} alt="" referrerPolicy="no-referrer" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF3FF] font-bold text-[#001F97]">{r.name.charAt(0).toUpperCase()}</span>
                      )}
                      <span className="min-w-0">
                        <b className="block truncate text-slate-900">{r.name}</b>
                        <span className="text-[13px] text-slate-500">{r.suburb}</span>
                      </span>
                      <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="ml-auto shrink-0" />
                    </div>
                    <Stars n={r.stars} />
                    <p className="line-clamp-6 text-[15px] leading-[1.65] text-slate-700">&ldquo;{r.review}&rdquo;</p>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Slider Section ── */}
      <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-20">
        <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-[38px] font-bold text-neutral-900 leading-tight"
            >
              Get Your <span className="text-accent">Free Quote Today</span>
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-3 flex-shrink-0"
            >
              <a
                href="#quote-form"
                className="bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-5 py-2.5 rounded-xl text-base transition-all active:scale-95"
              >
                Request A Quote
              </a>
              <a
                href={tel}
                className="flex items-center gap-2 bg-primary hover:bg-[#2F63CC] text-white font-bold px-5 py-2.5 rounded-xl text-base transition-all active:scale-95"
              >
                <Phone className="h-4 w-4" /> {phone}
              </a>
            </motion.div>
          </div>
          <PhotoSlider cityName={cityName} />
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <FaqSection faqs={faqs} />

      {/* ── CTA Banner ── */}
      <AnimatedSection className="bg-[#3D68D8] py-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl lg:text-3xl font-black text-white leading-tight"
          >
            Get Your <span className="text-white/80">Free Quote Today</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 flex-shrink-0"
          >
            <Link
              href="#quote-form"
              className="bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-xl text-base transition-all active:scale-95 border-2 border-accent"
            >
              Request A Quote
            </Link>
            <a
              href={tel}
              className="flex items-center gap-2 bg-primary hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-xl text-base transition-all border border-white/20 active:scale-95"
            >
              <Phone className="h-4 w-4" /> {phone}
            </a>
          </motion.div>
        </div>
      </AnimatedSection>

    </main>
  );
}

