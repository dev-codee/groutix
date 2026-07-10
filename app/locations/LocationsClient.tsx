"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Check, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import type { Review, BusinessRating } from "@/lib/reviews";
import TrustedMarquee from "@/components/TrustedMarquee";

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

/* ─── Image placeholder ─── */
function ImgBox({ label, aspect = "aspect-[4/3]", className = "", src, objectClass = "object-cover" }: { label: string; aspect?: string; className?: string; src?: string; objectClass?: string }) {
  return (
    <div className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center ${className} rounded-xl border-2 border-transparent hover:border-accent transition-all duration-300 shadow-md hover:shadow-xl`}>
      {/* Decorative corner elements */}
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

/* ─── Image slider component (Image 2 style) ─── */
function PhotoSlider({ serviceTitle }: { serviceTitle: string }) {
  const [idx, setIdx] = useState(0);
  const total = 4;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg"];
  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total]];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {visibleImages.map((img, i) => (
          <AnimatedImage key={i} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`${serviceTitle} Photo ${idx + i + 1}`}
              aspect="aspect-[4/3]"
              className="rounded-sm"
            />
          </AnimatedImage>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-sm bg-primary hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="h-9 w-9 rounded-sm bg-primary hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex-1 max-w-[120px] h-1 bg-neutral-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const SERVICES = [
  {
    slug: "shower-regrouting",
    title: "Shower Regrouting",
    desc: "Shower regrouting is our core specialty. We remove failing grout and regrout the shower using durable, moisture-resistant grout designed specifically for wet areas.",
  },
  {
    slug: "shower-base-repair",
    title: "Shower Base Repair",
    desc: "We repair cracked and leaking shower bases to restore the waterproof floor without full demolition.",
  },
  {
    slug: "tile-regrouting",
    title: "Tile Regrouting",
    desc: "Our tile regrouting service refreshes tired or stained grout lines throughout bathrooms, laundries, kitchens, balconies and other tiled areas.",
  },
  {
    slug: "leaking-shower-repair",
    title: "Leaking Shower Repair",
    desc: "Leaking showers require more than sealant. We identify where water is escaping, repair compromised grout and seals and fully regrout the shower to restore complete waterproof integrity.",
  },
  {
    slug: "small-tiling-jobs",
    title: "Small Tiling Jobs",
    desc: "For loose, cracked or damaged tiles, we provide small tiling repairs that integrate seamlessly with existing finishes. This service is ideal when isolated tiles need replacement without disturbing the whole bathroom.",
  },
  {
    slug: "real-estate-property-services",
    title: "Real Estate & Property Services",
    desc: "We partner with residential property managers, mum-and-dad investors, strata companies and commercial owners to provide fast, reliable maintenance solutions.",
  },
];

export default function LocationsClient({
  reviews,
  rating,
}: {
  reviews: Review[];
  rating: BusinessRating;
}) {
  return (
    <main>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-primary pt-[73px]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
        <div className="relative z-10 max-w-[1460px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch pb-28">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-8 lg:p-16 flex flex-col justify-center text-white space-y-6 relative z-20"
            >
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                Shower Regrouting & Leaking Shower Repair Experts Victoria
              </h1>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                Leaking showers and deteriorating grout are common problems in homes and apartments across Victoria. GROUTIX provides specialist shower repair and professional regrouting services in Victoria, designed to stop leaks, restore tiled wet areas and prevent further water damage without the need for full bathroom renovations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="tel:70238094"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-black px-7 py-3.5 rounded-sm text-base hover:bg-accent hover:text-primary transition-all active:scale-95 border-2 border-accent"
                >
                  <Phone className="h-4 w-4 text-primary" /> 7023 8094
                </a>
                <Link
                  href="#quote-form"
                  className="inline-flex items-center justify-center bg-white text-primary font-black px-7 py-3.5 rounded-sm text-base hover:bg-accent hover:text-primary transition-all active:scale-95 border-2 border-accent"
                >
                  Request A Quote
                </Link>
              </div>
            </motion.div>
            <AnimatedImage className="w-full self-center p-6 lg:p-12" delay={0.3}>
              <ImgBox
                src="/img44.jpg"
                label="Melbourne Location Bridge Image"
                aspect="aspect-[4/3]"
                className="rounded-sm shadow-lg bg-white/5 border-white/10"
                objectClass="object-cover object-top"
              />
            </AnimatedImage>
          </div>

          {/* Bottom Badges — floating white cards matching service page style */}
          <div className="absolute left-0 right-0 bottom-0 transform translate-y-1/2 px-6 lg:px-10 z-10 pointer-events-none">
            <div className="max-w-[1460px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-none">
              {[
                { label: "Victoria-based shower regrouting specialists", Icon: LocationIcon },
                { label: "Proven solutions for leaking showers and grout failure", Icon: ShowerBadgeIcon },
                { label: "Backed by a 10-year waterproof warranty", Icon: WarrantyBadgeIcon },
              ].map(({ label, Icon }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                  className="bg-white border border-neutral-200 rounded-sm p-5 shadow-lg flex items-center gap-4 text-neutral-900 hover:border-accent transition-colors relative overflow-hidden pointer-events-auto"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-accent/10 rounded-sm">
                    <Icon />
                  </div>
                  <p className="text-sm sm:text-base font-bold leading-snug">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="pt-20">
        <TrustedMarquee />
      </div>

      {/* Service Area */}
      <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <AnimatedImage className="relative">
              <ImgBox src="/img45.webp" label="Victoria Service Area Map" aspect="aspect-[4/3]" className="rounded-sm" />
            <div className="relative mt-4 mx-4 lg:mx-0 lg:absolute lg:bottom-4 lg:left-4 lg:right-4 bg-accent text-primary-dark p-6 rounded-sm shadow-xl z-10">
              <p className="text-base sm:text-lg font-bold leading-relaxed">
                With clear communication and proven repair systems, we ensure every project is completed to the highest professional standard.
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
              {`Victoria is home to Australia's biggest housing stock and some of its toughest bathroom challenges. From Federation cottages in Fitzroy and Carlton to art deco apartments in St Kilda, brick homes across the Eastern suburbs and modern family estates spreading through outer Melbourne, every era brings its own grout and silicone problems. Add the humidity, temperature fluctuations, and the sheer pace of modern living, and you have a state where bathrooms work harder than almost anywhere else in the country.

GROUTIX covers the Melbourne metropolitan area and the wider Victorian region. We handle full tile regrouting and leaking shower repairs without ripping out tiles or sending you into a renovation. The tiles stay where they are. The shower stays in place. Only the failed grout and silicone get replaced — most jobs finished in a single day.

Victoria homes have a real bathroom challenge. The state's climate drives mould straight into grout lines, and silicone seals crack along every shower edge after just a few wet seasons. In high-rise apartments, even a small failure in the silicone lets water track down through the slab to the unit below. We've stopped countless of these problems before they became strata disputes.

Every quote is free, every job is properly warranted, and our team works around your schedule. We treat heritage terraces, brick veneers, and modern apartments with the same standard of care. If your grout is grey, your shower is leaking, or your bathroom is past its best, book your local GROUTIX specialist in Victoria today.`.split("\n\n").map((para, i) => (
                <p key={i} className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                  {para}
                </p>
              ))}
            </motion.div>
            <Link
              href="#service-areas"
              className="inline-flex items-center text-base font-bold text-primary hover:underline transition-colors"
            >
              Find Your Location →
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* View Our Victoria Service Areas Section */}
      <AnimatedSection id="service-areas" className="relative bg-white py-20 border-y border-neutral-200 overflow-hidden text-center">
        {/* Subway tiles background pattern with slightly higher visibility */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 0 120 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h120v60H0z' fill='none'/%3E%3Cpath d='M0 30h120M60 0v30M0 30v30M120 30v30' stroke='%23001F97' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 60px'
        }} />
        
        {/* Soft background radial gradient for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(47,99,204,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 bg-[#F9FBFC] border border-neutral-200/80 rounded-xl shadow-xl space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#001F97] tracking-tight">
              View Our Victoria Service Areas
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
          </div>
          <p className="text-neutral-600 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Select a region below to find comprehensive service coverage and suburbs we serve in Victoria.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/locations/geelong"
              className="w-full sm:w-auto min-w-[200px] bg-[#001F97] text-white hover:bg-accent hover:text-primary font-black py-4 px-8 rounded-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-base border-2 border-transparent hover:border-[#001F97]"
            >
              Geelong Area
            </Link>
            <Link
              href="/locations/melbourne"
              className="w-full sm:w-auto min-w-[200px] bg-[#001F97] text-white hover:bg-accent hover:text-primary font-black py-4 px-8 rounded-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-base border-2 border-transparent hover:border-[#001F97]"
            >
              Melbourne Area
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* Services Section */}
      <AnimatedSection className="bg-[#2F63CC] py-16 lg:py-24 text-white">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="space-y-3 text-center max-w-xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-[42px] font-bold"
            >
              Our Services
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/80 text-base sm:text-lg leading-relaxed"
            >
              GROUTIX provides specialist tile and grout services for residential and commercial properties across Victoria. Our team is solely focused on precision, durability and long term performance, delivering results that general trades cannot match.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-neutral-800">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white rounded-sm p-6 hover:shadow-xl transition-all flex flex-col justify-between gap-6 relative overflow-hidden"
              >
                {/* Decorative accent element */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                
                <div className="space-y-4">
                  <span className="text-2xl">
                    {i === 0 ? "🚿" : i === 1 ? "🧱" : i === 2 ? "💧" : i === 3 ? "🔨" : "🏢"}
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">{s.title}</h3>
                  <p className="text-base text-neutral-600 leading-relaxed">{s.desc}</p>
                </div>
                <Link href={`/${s.slug}`} className="text-base font-bold text-accent hover:underline transition-colors">
                  Learn more →
                </Link>
              </motion.div>
            ))}
            <AnimatedImage className="relative rounded-sm overflow-hidden min-h-[250px] lg:min-h-full" delay={0.6}>
              <ImgBox src="/img20.jpeg" label="Shower Renovation Service Image" aspect="h-full w-full absolute inset-0" className="border-0" />
            </AnimatedImage>
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials Section */}
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
              Here's Why Victoria Customers Choose GROUTIX.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-neutral-200 rounded-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
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
            <Link
              href="#quote-form"
              className="bg-primary hover:bg-[#2F63CC] text-white font-bold px-6 py-2.5 rounded-sm text-sm transition-all active:scale-95"
            >
              Write a review
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4 flex flex-col justify-between hover:border-accent hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Decorative accent element */}
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

      {/* CTA Slider Section */}
      <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-20">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-[38px] font-bold text-neutral-900 leading-tight"
            >
              Request An<br />
              <span className="text-accent">Obligation Free Quote</span>
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
                className="bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-5 py-2.5 rounded-sm text-base transition-all active:scale-95"
              >
                Request A Quote
              </a>
              <a
                href="tel:1300844897"
                className="flex items-center gap-2 bg-primary hover:bg-[#2F63CC] text-white font-bold px-5 py-2.5 rounded-sm text-base transition-all active:scale-95"
              >
                <Phone className="h-4 w-4" /> 1300 844 897
              </a>
            </motion.div>
          </div>
          <PhotoSlider serviceTitle="Melbourne" />
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection className="bg-white py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight"
            >
              Frequently Asked<br />
              <span className="text-accent">Questions</span>
            </motion.h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "How Long Does Shower Regrouting Take?", a: "Most shower regrouting jobs are completed within a single day, depending on the condition of the grout and any required repair work." },
              { q: "Do I Need To Remove My Shower Tiles?", a: "In most cases, no. Our services are designed to fix grout and sealing issues without removing tiles." },
              { q: "Can You Regrout Shower Floors As Well As Walls?", a: "Yes, we handle both floor and wall tile regrouting in shower cubicles and all wet areas." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-neutral-100 bg-[#F8FAFC] rounded-sm p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-neutral-200 transition-colors"
              >
                <span className="font-bold text-neutral-800 text-base leading-snug">{faq.q}</span>
                <div className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  +
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Banner */}
      <AnimatedSection className="bg-[#3D68D8] py-14 px-6 lg:px-10">
        <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl lg:text-3xl font-black text-white leading-tight"
          >
            Request An <span className="text-white/80">Obligation Free Quote</span>
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
              className="bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-sm text-base transition-all active:scale-95 border-2 border-accent"
            >
              Request A Quote
            </Link>
            <a
              href="tel:70238094"
              className="flex items-center gap-2 bg-primary hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-sm text-base transition-all border border-white/20 active:scale-95"
            >
              <Phone className="h-4 w-4" /> 7023 8094
            </a>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Final Quote Form */}
      <section id="quote-form" className="relative overflow-hidden bg-[#001F97]">
        <div className="absolute inset-0">
          <Image src="/img28.jpeg" alt="Request Quote Background" fill className="object-cover" />
        </div>

        {/* Foreground content */}
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
