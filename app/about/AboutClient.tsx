"use client";
import Image from "next/image";
import { useState } from "react";
import { ShieldCheck, Award, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";

/* ─── Image placeholder ─── */
function ImgBox({
  label,
  aspect = "aspect-[3/4]",
  className = "",
  src,
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
}) {
  return (
    <div className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center ${className} rounded-xl border-2 border-transparent hover:border-accent transition-all duration-300 shadow-md hover:shadow-xl`}>
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />
      
      {src ? (
        <Image src={src} alt={label} fill className="object-cover transition-transform duration-500 hover:scale-105" />
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sliderImages.map((img, i) => (
          <AnimatedImage key={i} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`${serviceTitle} Photo ${i + 1}`}
              aspect="aspect-[3/4]"
              className="rounded-sm"
            />
          </AnimatedImage>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-sm bg-primary hover:bg-secondary text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="h-9 w-9 rounded-sm bg-primary hover:bg-secondary text-white flex items-center justify-center transition-colors"
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

export default function AboutClient() {
  const values = [
    { icon: <ShieldCheck className="h-7 w-7 text-primary" />, title: "Honest advice", desc: "We only recommend what your bathroom actually needs — no upselling, no scare tactics." },
    { icon: <Award className="h-7 w-7 text-primary" />, title: "Done properly", desc: "We fix the root cause with quality materials so the problem stays fixed for the long run." },
    { icon: <Users className="h-7 w-7 text-primary" />, title: "Clean & respectful", desc: "We treat your home with care and leave every job site tidy when we're finished." },
    { icon: <Clock className="h-7 w-7 text-primary" />, title: "Local & reliable", desc: "A Melbourne-based team that turns up on time and does what we say we'll do." },
  ];

  const stats = [
    { value: "10-Year", label: "Waterproof Warranty" },
    { value: "Licensed", label: "& Fully Insured" },
    { value: "500+", label: "Showers Repaired" },
    { value: "100%", label: "Leak-Free Guarantee" },
  ];

  return (
    <main className="pt-[73px]">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-primary bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%)] text-white py-24"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] uppercase tracking-[0.35em] text-white/90"
          >
            About GROUTIX
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          >
            Melbourne's leaking shower specialists
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed"
          >
            Melbourne's trusted leaking shower specialists. Permanent repairs backed by a 10-year waterproof warranty.
          </motion.p>
        </div>
      </motion.section>

      {/* Who We Are Section */}
      <AnimatedSection className="bg-[#071E5D] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-16 lg:grid-cols-2 items-center">
          <div className="space-y-8 text-white">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-base uppercase tracking-[0.35em] text-[#97B1E5]"
            >
              Who we are
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-black leading-tight"
            >
              A team that takes leaks seriously
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              {`We built GROUTIX around a simple idea: most leaking showers can be fixed properly without tearing the whole bathroom apart. Too many homeowners are told they need a full renovation when a targeted, expert repair would do the job for a fraction of the cost.

Today we help households right across Melbourne stop leaks, beat mould and protect their homes — with workmanship we're proud to stand behind for a decade.`.split("\n\n").map((para, i) => (
                <p key={i} className="text-white/80 leading-relaxed text-base sm:text-lg">
                  {para}
                </p>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                "Specialists in tile and bathroom waterproofing",
                "Repairs that usually keep your tiles in place",
                "Backed by a written 10-year warranty",
                "Fully licensed and insured",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 text-base text-white/80 cursor-default"
                >
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
          <AnimatedImage className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 h-[500px] flex items-center justify-center shadow-md hover:shadow-xl transition-shadow">
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />
              
              <Image
                src="/img21.jpeg"
                alt="Team / workshop"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
          </AnimatedImage>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <AnimatedSection className="bg-[#071E5D] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <p className="text-4xl font-black text-accent">{stat.value}</p>
                <p className="mt-3 text-base uppercase tracking-[0.25em] text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection className="bg-[#0A1F5D] py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-base uppercase tracking-[0.35em] text-[#97B1E5]"
          >
            What we stand for
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-5xl font-black leading-tight"
          >
            The values behind every job
          </motion.h2>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl hover:bg-[#0F2C6E] transition-colors relative overflow-hidden"
            >
              {/* Decorative accent element */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              
              <div className="mb-6 h-14 w-14 rounded-3xl bg-accent/20 flex items-center justify-center text-xl font-black text-accent">✓</div>
              <h3 className="text-xl font-black text-white">{item.title}</h3>
              <p className="mt-3 text-base text-white/70 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-12 xl:grid-cols-[1.03fr_0.97fr] items-start">
          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-base uppercase tracking-[0.35em] text-primary"
            >
              Request A Quote
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black text-neutral-900"
            >
              Ready to fix your shower for good?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-neutral-600 leading-relaxed text-lg"
            >
              Tell us about your bathroom issue and we'll provide a same-day quote with clear pricing, realistic timing and a waterproof guarantee that stands behind the work.
            </motion.p>
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
                className="rounded-3xl border border-neutral-200 bg-[#F8FAFF] p-6"
              >
                <p className="text-sm uppercase tracking-[0.35em] text-[#5C8AFE]">Fast response</p>
                <p className="mt-3 text-base text-neutral-600 leading-relaxed">Our team reaches out quickly so your repair is booked fast.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
                className="rounded-3xl border border-neutral-200 bg-[#F8FAFF] p-6"
              >
                <p className="text-sm uppercase tracking-[0.35em] text-[#5C8AFE]">Fixed pricing</p>
                <p className="mt-3 text-base text-neutral-600 leading-relaxed">No hidden charges — just transparent service from start to finish.</p>
              </motion.div>
            </div>
          </div>
          <AnimatedImage className="rounded-[32px] border border-neutral-200 bg-[#F8FAFF] p-8 shadow-xl relative overflow-hidden">
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />
            
            <div className="mb-6">
              <p className="text-base uppercase tracking-[0.35em] text-primary">Get a free quote</p>
              <h3 className="mt-3 text-3xl font-black text-neutral-900">Start your repair today</h3>
            </div>
            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="text" placeholder="First Name" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <input type="text" placeholder="Last Name" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="email" placeholder="Email" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <input type="tel" placeholder="Phone" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="text" placeholder="Suburb / Postcode" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <select className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <option>Select State</option>
                  <option>VIC</option>
                  <option>NSW</option>
                  <option>QLD</option>
                  <option>WA</option>
                  <option>SA</option>
                </select>
              </div>
              <textarea rows={4} placeholder="Tell us how we can help" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              <button
                type="submit"
                className="w-full rounded-2xl bg-primary px-6 py-3 text-base font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
              >
                Submit Request
              </button>
            </form>
          </AnimatedImage>
          <div className="xl:col-span-2">
            <PhotoSlider serviceTitle="GROUTIX" />
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
