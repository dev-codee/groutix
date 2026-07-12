"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, ChevronLeft, ChevronRight, ChevronDown, Droplets, Grid2x2, Wrench, ShowerHead, Hammer, Building2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import type { Review, BusinessRating } from "@/lib/reviews";
import TrustedMarquee from "@/components/TrustedMarquee";
import FaqSection from "@/components/FaqSection";

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

export type CityPageProps = {
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
  parentSlug?: "melbourne" | "geelong";
  locationExplanation?: string;
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
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg", "/img57.jpeg", "/img58.jpeg", "/img59.jpeg", "/img60.jpeg", "/img61.jpeg", "/img62.jpeg"];
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
  parentSlug: "melbourne" | "geelong";
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
    desc: "Repair cracked or leaking shower floors with targeted base restoration that rebuilds waterproofing integrity—no full tear-out required.",
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

/* ─── Main Component ─── */
export default function CityPageClient({
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
}: CityPageProps) {
  const [mapQuery, setMapQuery] = useState(`${cityName}, VIC, Australia`);
  const isGeelong = cityName.toLowerCase().includes("geelong") || heroSubtitle.toLowerCase().includes("geelong") || (suburbGroups.length > 0 && (suburbGroups[0].title.toLowerCase().includes("geelong") || suburbGroups[0].title.toLowerCase().includes("peninsula") || suburbGroups[0].title.toLowerCase().includes("surf")));
  const parent = parentSlug || (isGeelong ? "geelong" : "melbourne");
  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-primary"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,214,79,0.25),transparent_55%)]" />
        <div className="max-w-[1460px] mx-auto grid grid-cols-1 lg:grid-cols-2 pb-28">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-8 lg:p-16 flex flex-col justify-center text-white space-y-6 relative z-20"
          >
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              {heroHeading}
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="tel:70238094"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-black px-7 py-3.5 rounded-xl text-base hover:bg-accent hover:text-primary transition-all active:scale-95 border-2 border-accent"
              >
                <Phone className="h-4 w-4 text-primary" /> 7023 8094
              </a>
              <Link
                href="#quote-form"
                className="inline-flex items-center justify-center bg-white text-primary font-black px-7 py-3.5 rounded-xl text-base hover:bg-accent hover:text-primary transition-all active:scale-95 border-2 border-accent"
              >
                Request A Quote
              </Link>
            </div>
          </motion.div>
          <AnimatedImage className="w-full self-center p-6 lg:p-12" delay={0.3}>
            <ImgBox
              src={heroImage}
              label={`${cityName} Location Image`}
              aspect="aspect-[4/3]"
              className="rounded-xl shadow-lg bg-white/5 border-white/10"
              objectClass="object-cover object-top"
            />
          </AnimatedImage>
        </div>
        {/* Bottom Badges — floating white cards matching service page style */}
        <div className="absolute left-0 right-0 bottom-0 transform translate-y-1/2 px-6 lg:px-10 z-10 pointer-events-none">
          <div className="max-w-[1460px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-none">
            {[
              { label: `${cityName}-based shower regrouting specialists`, Icon: LocationIcon },
              { label: "Repair systems built for grout failure and leaking showers", Icon: ShowerBadgeIcon },
              { label: "10-year waterproof warranty on full shower regrouting", Icon: WarrantyBadgeIcon },
            ].map(({ label, Icon }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-lg flex items-center gap-4 text-neutral-900 hover:border-accent transition-colors relative overflow-hidden pointer-events-auto"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-accent/10 rounded-xl">
                  <Icon />
                </div>
                <p className="text-sm sm:text-base font-bold leading-snug">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="pt-20">
        <TrustedMarquee />
      </div>


      {/* ── Section 2: Services (for Suburb) or Service Area (for City) ── */}
      {locationExplanation ? (
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
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
                href="tel:70238094"
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold px-6 py-3 rounded-sm text-base transition-colors flex items-center gap-2 active:scale-95"
              >
                <Phone className="h-4 w-4" /> Get In Touch
              </a>
            </div>
          </div>
        </AnimatedSection>
      ) : (
        <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
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
                className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight"
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
                  <p key={i} className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                    {para}
                  </p>
                ))}
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

      {/* ── Suburb Categories Accordion or Location Explanation ── */}
      <AnimatedSection id="suburbs" className="bg-white py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
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
                  className="text-4xl lg:text-[48px] font-black text-neutral-900 leading-tight"
                >
                  {cityName}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-medium"
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

      {/* ── Our Services (only for City pages, hidden on Suburb pages) ── */}
      {!locationExplanation && (
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
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
                href="tel:70238094"
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold px-6 py-3 rounded-sm text-base transition-colors flex items-center gap-2 active:scale-95"
              >
                <Phone className="h-4 w-4" /> Get In Touch
              </a>
            </div>
          </div>
        </AnimatedSection>
      )}



      {/* ── Testimonials ── */}
      <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-neutral-900"
            >
              Client <span className="text-accent">Reviews & Testimonials</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-neutral-600 font-bold text-base sm:text-lg"
            >
              Why {cityName} clients choose Groutix for grout and shower repairs.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <span className="text-accent font-black text-xl tracking-tight">Google</span>
              <span className="text-base font-bold text-neutral-500">Excellent</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg key={j} className="h-4 w-4 text-accent fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-neutral-400 font-bold">
                {rating.value} | {rating.count} reviews
              </span>
            </div>
            <a
              href="https://www.google.com/search?kgmid=%2Fg%2F11xdl581v3&hl=en-PK&q=Groutix%20-%20Epoxy%20Regrouting%2C%20Shower%20%26%20Balcony%20Leak%20Repairs%20Melbourne&shem=epsd1%2Cltae%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=215b884d877423b0"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-[#2F63CC] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-95"
            >
              Write a review
            </a>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 flex flex-col justify-between hover:border-accent hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{r.name}</p>
                        <p className="text-[12px] text-neutral-400">{r.suburb}</p>
                      </div>
                    </div>
                    <span className="text-accent font-black text-sm">G</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className="h-3 w-3 text-accent fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed font-medium">&ldquo;{r.review}&rdquo;</p>
                </div>
                <span className="text-[12px] text-neutral-400 font-bold block pt-2">Read more</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── CTA Slider Section ── */}
      <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-20">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
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
                href="tel:70238094"
                className="flex items-center gap-2 bg-primary hover:bg-[#2F63CC] text-white font-bold px-5 py-2.5 rounded-xl text-base transition-all active:scale-95"
              >
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
            </motion.div>
          </div>
          <PhotoSlider cityName={cityName} />
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <FaqSection />

      {/* ── CTA Banner ── */}
      <AnimatedSection className="bg-[#3D68D8] py-14 px-6 lg:px-10">
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
              href="tel:70238094"
              className="flex items-center gap-2 bg-primary hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-xl text-base transition-all border border-white/20 active:scale-95"
            >
              <Phone className="h-4 w-4" /> 7023 8094
            </a>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ── Final Quote Form ── */}
      <section id="quote-form" className="relative overflow-hidden bg-[#001F97]">
        <div className="absolute inset-0">
          <Image src="/img28.jpeg" alt="Request Quote Background" fill className="object-cover" />
        </div>
        <div className="relative z-10 max-w-[1460px] mx-auto grid grid-cols-1 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative min-h-[150px] lg:min-h-[600px] flex items-start pt-[50px] pr-[50px] pl-8 pb-8"
          >
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Request A Quote
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 lg:p-12 xl:p-16 flex items-center justify-center"
          >
            <div className="w-full max-w-xl">
              <HeroQuoteForm />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

