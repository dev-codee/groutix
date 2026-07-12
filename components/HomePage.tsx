"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import {
  Phone,
  Check,
  Droplets,
  ShieldCheck,
  MapPin,
  Star,
  ThumbsUp,
  Grid2x2,
  Wrench,
  ShowerHead,
  Hammer,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import FaqSection from "@/components/FaqSection";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Review, BusinessRating } from "@/lib/reviews";
import TrustedMarquee from "@/components/TrustedMarquee";

/* ─── Image placeholder ─── */
function ImgBox({
  label,
  aspect = "aspect-[4/3]",
  className = "",
  src,
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
}) {
  return (
    <div 
      className={`relative ${aspect} w-full overflow-hidden ${className} rounded-xl border-2 border-transparent hover:border-[#F5A623] transition-all duration-300`}
      style={{
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5A623] z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5A623] z-10 pointer-events-none" />

      {src ? (
        <Image src={src} alt={label} fill className="object-cover transition-transform duration-500 hover:scale-105" />
      ) : (
        <>
          <div className="absolute inset-0 bg-neutral-100 border border-neutral-200" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="relative z-10 flex h-full items-center justify-center text-center px-4">
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
              <p className="text-[12px] text-neutral-300">Add photo manually</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Photo slider (matches service page slider) ─── */
function HomePhotoSlider() {
  const [idx, setIdx] = useState(0);
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg", "/img57.jpeg", "/img58.jpeg", "/img59.jpeg", "/img60.jpeg", "/img61.jpeg", "/img62.jpeg"];
  const total = sliderImages.length;
  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total], sliderImages[(idx + 2) % total]];
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleImages.map((img, i) => (
          <AnimatedImage key={`${idx}-${i}`} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`Before & After Photo ${idx + i + 1}`}
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

/* ─── Droplet icon for bullets ─── */
const DropletIcon = () => (
  <svg width="14" height="20" viewBox="0 0 14 20" fill="none" className="flex-shrink-0 mt-0.5">
    <path d="M7 3V17C3.134 17 0 13.866 0 10C0 6.134 3.134 3 7 3Z" fill="#2F63CC" />
    <path d="M14 10C14 13.866 10.866 17 7 17V3C10.866 3 14 6.134 14 10Z" fill="#97B1E5" />
  </svg>
);

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

export default function HomePage({
  reviews,
  rating,
}: {
  reviews: Review[];
  rating: BusinessRating;
}) {
  return (
    <>
      <Navbar />
      <main>
        {/* ══════════════════════════════════════
            SECTION 1 — HERO
            Split bg: blue tiles left, photo right
            Left: label + title + desc
            Right: glass Quote Form
            Bottom: full-bleed 3-badge strip
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-[73px]">
          {/* Blue tiled background */}
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px),linear-gradient(90deg,rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px)] bg-[size:150px_150px]" />
          <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.08),rgba(0,0,0,0.16)_70%)] bg-[size:150px_150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_45%)] pointer-events-none" />

          {/* Right-side photo panel */}
          <div className="absolute inset-y-0 right-0 hidden w-[38%] lg:block">
            <Image src="/img19.avif" alt="Restored bathroom" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-white/15" />
          </div>

          <div className="relative z-10 flex min-h-[calc(100vh-73px)] flex-col">
            <div className="mx-auto flex w-full max-w-[1460px] flex-1 items-center px-6 py-8 lg:px-10 lg:py-8">
              <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_540px] lg:gap-14">
                {/* Left: label + headline + paragraph */}
                <div className="space-y-6 text-white">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-[72px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]"
                  >
                    Shower Regrouting &amp; Grout Repair Specialists | Groutix
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    className="max-w-2xl text-lg leading-relaxed text-white/85 sm:text-[22px]"
                  >
                    Groutix repairs broken grout, failed seals and leaking wet areas using specialist regrouting techniques — restoring showers and balconies without a full retile or renovation.
                  </motion.p>
                </div>

                {/* Right: Quote Form (overlaps photo) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                  className="w-full"
                >
                  <HeroQuoteForm />
                </motion.div>
              </div>
            </div>

            {/* Bottom badge strip — full bleed */}
            <div className="grid grid-cols-1 divide-y divide-white/20 bg-secondary md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                {
                  icon: Droplets,
                  text: (
                    <>
                      Expert shower regrouting and<br className="hidden md:block" /> grout repair services
                    </>
                  ),
                },
                {
                  icon: ShieldCheck,
                  text: (
                    <>
                      10-year waterproof guarantee on complete<br className="hidden md:block" /> shower regrouting jobs
                    </>
                  ),
                },
                {
                  icon: MapPin,
                  text: (
                    <>
                      Trusted repair methods and professional service<br className="hidden md:block" /> throughout Melbourne &amp;
                      nearby areas
                    </>
                  ),
                },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-4 px-8 py-6 lg:px-12 bg-gradient-to-r from-secondary via-secondary to-secondary/90"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-sm bg-accent text-primary">
                    <b.icon className="h-5 w-5" />
                  </span>
                  <p className="text-[16px] font-bold leading-snug text-white">{b.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 2 — TRUSTED ACROSS AUSTRALIA (Marquee)
        ══════════════════════════════════════ */}
        <TrustedMarquee />

        {/* Stats strip */}
        <AnimatedSection className="bg-white py-6 border-b border-neutral-100">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 lg:grid-cols-4 lg:divide-y-0">
              {[
                {
                  Icon: Droplets,
                  value: "8,000+",
                  label: "Bathrooms Fixed Up",
                  color: "text-secondary",
                  fill: false,
                },
                {
                  Icon: Star,
                  value: `${rating.count}+`,
                  label: "5-Star Testimonials",
                  color: "text-accent",
                  fill: true,
                },
                {
                  Icon: ThumbsUp,
                  value: "100%",
                  label: "Happy Customers",
                  color: "text-secondary",
                  fill: false,
                },
                {
                  Icon: ShieldCheck,
                  value: "10 Year",
                  label: "Waterproof Guarantee",
                  color: "text-secondary",
                  fill: false,
                },
              ].map(({ Icon, value, label, color, fill }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex items-center justify-center gap-3 px-5 py-6"
                  >
                    <Icon
                      className={`h-8 w-8 flex-shrink-0 ${color}`}
                      {...(fill ? { fill: "currentColor" } : {})}
                    />
                    <div>
                      <p className="text-2xl font-black leading-none text-neutral-900">{value}</p>
                      <p className="mt-1 text-[13px] text-neutral-500">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION — OUR SERVICES
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-4xl lg:text-[52px] font-bold text-neutral-900 leading-tight">
                What <span className="text-accent">We Do</span>
              </h2>
              <span className="mx-auto block h-1.5 w-20 rounded-full bg-accent" />
              <p className="text-neutral-600 text-lg leading-relaxed">
                Groutix delivers shower regrouting, grout repair, leaky shower fixes, and tile renewal services for both residential and commercial spaces. Our priority-first approach addresses deteriorating grout joints, aging sealants, and water infiltration concerns before they evolve into costly, extensive bathroom problems.
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

        {/* ══════════════════════════════════════
            SECTION 5 — LEAKING SHOWERS START WITH GROUT PROBLEMS
            Left: Image
            Right: Heading + 3 problem badges
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <ImgBox
                src="/img42.jpeg"
                label="Leaking Shower Image"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
            </motion.div>
            {/* Right */}
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Broken Grout Can Cause <span className="text-accent">Major Water Issues</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                Cracked, loose, or missing grout can let moisture seep behind tiles, around corners, and into nearby building materials. A tiny grout problem can quickly turn into mold, warping, discoloration, and costly fixes if ignored.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "EXPENSIVE WATER HARM",
                    desc: "Even a small shower leak can get into nearby walls, floors, and woodwork if broken grout isn't fixed.",
                    img: "/img37.jpeg",
                  },
                  {
                    title: "MOLD & DAMP",
                    desc: "Constant moisture around faulty grout lines creates perfect conditions for mold, smells, and surface damage.",
                    img: "/img16.jpeg",
                  },
                  {
                    title: "PRICEY FIXES LATER",
                    desc: "Water damage usually costs more to repair the longer it's left to spread under the tiled surface.",
                    img: "/img41.jpeg",
                  },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
                    className="flex items-center gap-4 bg-white border border-neutral-200 rounded-sm p-3"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm">
                      <Image src={b.img} alt={b.title} fill className="object-cover" />
                      <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[13px] font-black text-primary shadow">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-primary uppercase tracking-widest mb-1">
                        {b.title}
                      </p>
                      <p className="text-base text-neutral-600 leading-relaxed">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 6 — A PERMANENT SOLUTION
        ══════════════════════════════════════ */}
        <AnimatedSection 
          className="py-16 lg:py-24 relative overflow-hidden"
          style={{
            backgroundColor: "#EDEBE6",
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        >
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-[48px] font-black leading-tight">
                  <span className="text-[#1B2A5E]">Precise Grout Fixes,</span>{" "}
                  <span className="text-[#F5A623]">Not Quick Fixes</span>
                </h2>
                <p className="text-[#4A4A4A] text-base sm:text-lg leading-relaxed">
                  At Groutix, we don't just cover up failing grout with surface sealers. We take out damaged grout and sealants, prep the wet area correctly, and rebuild the protective grout layer using materials made for bathrooms and other damp spaces.
                  Our aim is to fix the root of the issue, provide a long-lasting result, and help you skip repeated leaks or constant patch-ups.
                </p>
                <p className="text-[#4A4A4A] text-base sm:text-lg leading-relaxed">
                  That's why complete shower regrouting jobs come with our 10-year waterproof guarantee.
                </p>
              </div>
              <HomePhotoSlider />
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 7 — GAIN PEACE OF MIND CTA BANNER
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-primary py-14 px-6 lg:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight max-w-2xl">
              Fix broken grout right the first time and enjoy lasting peace of mind.
            </h2>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/contact"
                className="bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-sm text-base transition-colors active:scale-95 border-2 border-accent"
              >
                Get A Quote
              </Link>
              <a
                href="tel:70238094"
                className="flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
              >
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 8 — CLIENT REVIEWS & TESTIMONIALS
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900">
              What Our Customers <span className="text-accent">Say</span>
            </h2>
            <div className="review-marquee-wrap overflow-hidden -mx-6 lg:-mx-10">
              <div className="review-marquee flex w-max px-6 lg:px-10">
                {[...reviews, ...reviews].map((r, i) => (
                  <ReviewCard key={i} review={r} className="mr-6 shrink-0 w-[85vw] sm:w-[360px]" />
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 9 — Groutix GUARANTEE
            Left: Text + 2 images
            Right: Big image
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Our <span className="text-accent">Promise</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                Complete shower regrouting work done by Groutix comes with our 10-year waterproof guarantee. We stand by our work because our grout repair systems are made for long-lasting wet-area performance, not just quick visual fixes.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/contact"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  Get A Quote
                </Link>
                <a
                  href="tel:70238094"
                  className="flex items-center gap-2 border border-neutral-300 hover:border-primary text-neutral-900 font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  <Phone className="h-4 w-4" /> 7023 8094
                </a>
              </div>
            </div>
            <AnimatedImage className="relative">
              <ImgBox
                src="/img43.jpeg"
                label="Guarantee Image"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 10, x: -10 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-[-20px] left-4 bg-[#001F97] text-white p-6 shadow-xl z-10 w-[190px] text-center border-t-4 border-[#2F63CC]"
              >
                <div className="flex items-start justify-center gap-2">
                  <p className="text-[4rem] font-black leading-none">10</p>
                  <p className="text-[13px] font-black uppercase tracking-[0.6em] mt-2" style={{ writingMode: "vertical-rl" }}>
                    YEAR
                  </p>
                </div>
                <p className="text-[13px] font-black uppercase tracking-widest mt-2">DOUBT</p>
                <p className="text-[13px] font-black uppercase tracking-widest">FREE</p>
                <p className="text-[13px] font-black uppercase tracking-widest mt-2">GUARANTEE</p>
              </motion.div>
            </AnimatedImage>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 10 — WHY CHOOSE US?
            Left: Heading + checklist
            Right: Image
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Why Pick <span className="text-accent">Groutix?</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                Homeowners, landlords, and property managers go with Groutix when they need expert grout and shower repairs done right.
              </p>
              <ul className="space-y-3">
                {[
                  "Expert team focused on shower regrouting and grout fixes",
                  "Repair methods made for long-lasting wet-area use",
                  "High-quality grout and sealing choices for tough spaces",
                  "10-year waterproof guarantee on complete shower regrouting work",
                  "Techs with experience in grout issues and leaky showers",
                  "Transparent quotes and practical advice",
                  "Professional service with neat, respectful work",
                  "Trusted by homeowners, strata managers, and property pros",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <DropletIcon />
                    <span className="text-base text-neutral-700 leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <ImgBox
                src="/img40.jpeg"
                label="Why Choose Us Image"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
            </div>
          </div>
        </AnimatedSection>

        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
