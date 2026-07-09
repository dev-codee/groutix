"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Review, BusinessRating } from "@/lib/reviews";

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
    <div className={`relative ${aspect} w-full overflow-hidden ${className} rounded-xl border-2 border-transparent hover:border-accent transition-all duration-300 shadow-md hover:shadow-xl`}>
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />

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
    desc: "Shower regrouting is our core specialty. We remove failing grout and regrout the shower using durable, moisture-resistant grout designed specifically for wet areas.",
  },
  {
    slug: "tile-regrouting",
    title: "Tile Regrouting",
    desc: "Our tile regrouting service refreshes tired or stained grout lines throughout bathrooms, laundries, kitchens, balconies and other tiled surfaces.",
  },
  {
    slug: "shower-base-repair",
    title: "Shower Base Repair",
    desc: "We repair cracked and leaking shower bases to restore the waterproof floor without full demolition.",
  },
  {
    slug: "leaking-shower-repair",
    title: "Leaking Shower Repair",
    desc: "Leaking showers require more than sealant. We identify where water is escaping, repair compromised grout and seals and fully regrout to stop the leak at the source.",
  },
  {
    slug: "small-tiling-jobs",
    title: "Small Tiling Jobs",
    desc: "For loose, cracked or damaged tiles, we provide small tiling repairs that integrate seamlessly with existing finishes.",
  },
  {
    slug: "real-estate-property-services",
    title: "Real Estate & Property Services",
    desc: "We partner with residential property managers, mum-and-dad investors, strata companies and commercial owners to provide fast, reliable maintenance solutions.",
  },
];

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "shower-regrouting": Droplets,
  "tile-regrouting": Grid2x2,
  "shower-base-repair": Wrench,
  "leaking-shower-repair": ShowerHead,
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
                    Stop Your Leaking Shower &amp; Balcony Without Removing Tiles
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    className="max-w-2xl text-lg leading-relaxed text-white/85 sm:text-[22px]"
                  >
                    Restore your shower &amp; balcony in as little as one day with Melbourne&apos;s highest-rated
                    regrouting and waterproofing specialists.
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
                      Specialists in shower regrouting and<br className="hidden md:block" /> leaking shower repair
                    </>
                  ),
                },
                {
                  icon: ShieldCheck,
                  text: (
                    <>
                      10-year waterproof warranty for total<br className="hidden md:block" /> peace of mind
                    </>
                  ),
                },
                {
                  icon: MapPin,
                  text: (
                    <>
                      Proven systems and expert technicians<br className="hidden md:block" /> across Melbourne &amp;
                      surrounds
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
            SECTION 2 — TRUSTED ACROSS AUSTRALIA
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-10 border-b border-neutral-100">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 flex flex-col items-center gap-6">
            <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">
              TRUSTED ACROSS AUSTRALIA
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14 opacity-50 grayscale">
              {[
                "Nelson Alexander",
                "Ardex",
                "Barry Plant",
                "Biggin & Scott",
                "Harcourts",
                "LJ Hooker",
                "Ray White",
                "McGrath",
              ].map((l) => (
                <span key={l} className="text-base font-black tracking-wider text-neutral-600 uppercase">
                  {l}
                </span>
              ))}
            </div>

            {/* Stats strip */}
            <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 lg:grid-cols-4 lg:divide-y-0">
                {[
                  {
                    Icon: Droplets,
                    value: "8,000+",
                    label: "Bathrooms Restored",
                    color: "text-secondary",
                    fill: false,
                  },
                  {
                    Icon: Star,
                    value: `${rating.count}+`,
                    label: "5 Star Reviews",
                    color: "text-accent",
                    fill: true,
                  },
                  {
                    Icon: ThumbsUp,
                    value: "100%",
                    label: "Customer Satisfaction",
                    color: "text-secondary",
                    fill: false,
                  },
                  {
                    Icon: ShieldCheck,
                    value: "10 Year",
                    label: "Waterproof Warranty",
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
                Our <span className="text-accent">Services</span>
              </h2>
              <span className="mx-auto block h-1.5 w-20 rounded-full bg-accent" />
              <p className="text-neutral-600 text-lg leading-relaxed">
                GROUTIX specialises in shower and balcony repairs, regrouting, tile repairs and leak rectification for residential and commercial properties. Our focused repair-first approach helps resolve failed grout, deteriorated sealants and water ingress without unnecessary full renovations.
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
                src="/img4.avif"
                label="Leaking Shower Image"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
            </motion.div>
            {/* Right */}
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Small Grout Problems Can Lead to <span className="text-accent">  Serious Water Damage</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                Cracked, missing or deteriorated grout can allow moisture to penetrate into vulnerable areas around your shower. What starts as a small visible defect can develop into hidden water damage, mould and costly repairs if left untreated.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "COSTLY WATER DAMAGE",
                    desc: "A small unresolved leak can spread beyond the shower, damaging surrounding walls, floors and adjoining rooms",
                    img: "/img23.jpeg",
                  },
                  {
                    title: "MOULD & MOISTURE",
                    desc: "Persistent moisture can create ideal conditions for mould growth and ongoing bathroom deterioration.",
                    img: "/img16.jpeg",
                  },
                  {
                    title: "EXPENSIVE REPAIRS",
                    desc: "The longer water ingress continues, the greater the risk of damaged materials and a much larger repair bill.",
                    img: "/img9.jpeg",
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
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 max-w-4xl">
            <div className="max-w-4xl space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                A Permanent Solution, <span className="text-accent">Not a Temporary Patch</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                At GROUTIX, we don’t cover up failing grout with surface sealers or quick cosmetic fixes. We remove the failed material, properly prepare the affected areas and rebuild the shower’s protective grout and sealant system using professional-grade materials designed for wet environments.
                Our goal is simple: stop the problem at its source, deliver a long-lasting repair and help you avoid repeated call-outs and costly damage.
              </p>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                That’s why completed leaking shower repairs are backed by our 10-year waterproof warranty.
              </p>
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
              Fix the problem properly the first time — and enjoy long-term peace of mind.
            </h2>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/contact"
                className="bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-sm text-base transition-colors active:scale-95 border-2 border-accent"
              >
                Request A Quote
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
              Client Reviews <span className="text-accent">&amp; Testimonials</span>
            </h2>
            <div className="review-marquee-wrap overflow-hidden -mx-6 lg:-mx-10">
              <div className="review-marquee flex w-max px-6 lg:px-10">
                {[...reviews, ...reviews].map((r, i) => (
                  <div
                    key={i}
                    aria-hidden={i >= reviews.length}
                    className="mr-6 shrink-0 w-[85vw] sm:w-[360px] bg-white border border-neutral-200 rounded-sm p-6 space-y-4 hover:shadow-md transition-shadow hover:border-accent relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.stars }).map((_, j) => (
                        <svg
                          key={j}
                          className="h-5 w-5 text-accent fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-base text-neutral-600 leading-relaxed">&ldquo;{r.review}&rdquo;</p>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{r.name}</p>
                      <p className="text-[13px] text-neutral-400">{r.suburb}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 9 — GROUTIX GUARANTEE
            Left: Text + 2 images
            Right: Big image
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                GROUTIX <span className="text-accent">Guarantee</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                Full shower regrouting repairs completed by GROUTIX are backed by our 10-year waterproof warranty. We stand behind our workmanship because our repair systems are designed for long-term performance — giving you confidence that the problem has been repaired properly, not simply covered up.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/contact"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  Request A Quote
                </Link>
                <a
                  href="tel:70238094"
                  className="flex items-center gap-2 border border-neutral-300 hover:border-primary text-neutral-900 font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  <Phone className="h-4 w-4" /> 7023 8094
                </a>
              </div>
            </div>
            <div>
              <ImgBox
                src="/img11.jpeg"
                label="Guarantee Image"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
            </div>
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
                Why <span className="text-accent">Choose Us?</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">
                Here&apos;s why homeowners and property managers across Australia trust GROUTIX.
              </p>
              <ul className="space-y-3">
                {[
                  "Australia's largest dedicated shower regrouting specialist",
                  "Proven systems refined over decades",
                  "High performance grout options available",
                  "10-year waterproof warranty for peace of mind",
                  "Specialist technicians – not general tilers or handymen",
                  "Obligation-free quotes with no hidden fees",
                  "Professional, ethical and friendly service",
                  "Trusted by homeowners, strata managers & commercial clients nationwide",
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
                src="/img5.avif"
                label="Why Choose Us Image"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
            </div>
          </div>
        </AnimatedSection>

      </main>
      <Footer />
    </>
  );
}
