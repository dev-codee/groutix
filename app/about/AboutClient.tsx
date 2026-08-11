"use client";
import Image from "next/image";
import { useState } from "react";
import { ShieldCheck, Award, Users, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import TrustedMarquee from "@/components/TrustedMarquee";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";

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
    <div className={`img-glow relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center ${className} rounded-sm shadow-md transition-all duration-300`}>
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

/* ─── Image slider component ─── */
function PhotoSlider({ serviceTitle }: { serviceTitle: string }) {
  const [idx, setIdx] = useState(0);
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg", "/img58.jpeg", "/img59.jpeg"];
  const total = sliderImages.length;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  
  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total], sliderImages[(idx + 2) % total]];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
          Our <span className="text-accent">Work</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {visibleImages.map((img, i) => (
          <AnimatedImage key={`${idx}-${i}`} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`${serviceTitle} Photo ${idx + i + 1}`}
              aspect="aspect-[4/3]"
              className="rounded-sm"
            />
          </AnimatedImage>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2 justify-center">
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

export default function AboutClient() {
  const { phone, tel } = useContact();
  const siteContent = useSiteContent();
  const aboutData = siteContent.about;

  const valueIcons: Record<string, React.ReactNode> = {
    "Honest Advice": <ShieldCheck className="h-7 w-7 text-[#001F97]" />,
    "Expert Work": <Award className="h-7 w-7 text-[#001F97]" />,
    "Care For Your Space": <Users className="h-7 w-7 text-[#001F97]" />,
    "Dependable Service": <Clock className="h-7 w-7 text-[#001F97]" />,
  };

  const values = aboutData.values.map((v) => ({
    icon: valueIcons[v.title] ?? <ShieldCheck className="h-7 w-7 text-[#001F97]" />,
    title: v.title,
    desc: v.desc,
  }));

  const stats = aboutData.stats;

  return (
    <main className="pt-[73px]">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-[#001F97] text-white relative py-20 lg:py-28 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px),linear-gradient(90deg,rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px)] bg-[size:150px_150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_45%)] pointer-events-none" />

        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 text-center relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex rounded-sm border border-white/20 bg-white/10 px-4 py-2 text-[13px] uppercase tracking-[0.35em] text-white/90 font-bold"
          >
            Who We Are
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          >
            {aboutData.headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed"
          >
            {aboutData.subheadline}
          </motion.p>
        </div>
      </motion.section>

      <TrustedMarquee />

      {/* Our Story Section */}
      <AnimatedSection className="bg-white py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-neutral-800">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-sm font-bold uppercase tracking-[0.35em] text-[#001F97]"
            >
              Our Story
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight"
            >
              {aboutData.storyTitle}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4 text-neutral-600 leading-relaxed text-base sm:text-[16px]"
            >
              {aboutData.storyParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid gap-3 sm:grid-cols-2 pt-2"
            >
              {aboutData.features.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#F3F4F6] px-4 py-2.5 rounded-sm">
                  <div className="w-5 h-5 flex items-center justify-center bg-[#001F97] text-white rounded-full flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-800 tracking-wider">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
          <AnimatedImage className="relative w-full">
            <div className="img-glow relative w-full rounded-sm overflow-hidden shadow-md border-2 border-transparent hover:border-accent transition-all duration-300">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />
              <ImgBox
                src="/img21.jpeg"
                label="Groutix Team"
                aspect="aspect-[4/3]"
                className="rounded-sm"
              />
            </div>
          </AnimatedImage>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-20">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white border border-neutral-200 rounded-sm p-8 text-center shadow-sm hover:shadow-md transition-all"
              >
                <p className="text-4xl lg:text-5xl font-black text-[#001F97]">{stat.value}</p>
                <p className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-neutral-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection className="bg-white py-16 lg:py-24 text-neutral-900">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 text-center mb-14 space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-bold uppercase tracking-[0.35em] text-[#001F97]"
          >
            Our Values
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl lg:text-[40px] font-bold leading-tight"
          >
            What Drives <span className="text-accent">Every Job We Do</span>
          </motion.h2>
        </div>
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#F8FAFC] border border-neutral-200 p-6 rounded-sm flex flex-col gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:border-accent"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-10 h-10 flex items-center justify-center bg-[#EEF2FF] rounded-sm flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-lg mb-2">{item.title}</h3>
                <p className="text-base text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="bg-[#3D68D8] py-8 px-6 lg:px-10">
        <div className="max-w-[1460px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-black text-white"
          >
            Ready To Fix Your Shower Or Grout?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <a href="/contact" className="bg-white text-[#001F97] font-bold px-5 py-2.5 rounded-sm text-base hover:bg-accent hover:text-[#001F97] transition-colors active:scale-95 border-2 border-accent">
              Request A Quote
            </a>
            <a href={tel} className="flex items-center gap-2 bg-[#001F97] text-white font-bold px-5 py-2.5 rounded-sm text-base hover:bg-[#2F63CC] transition-colors border border-white/20 active:scale-95">
              {phone}
            </a>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Photo Showcase */}
      <AnimatedSection className="bg-white py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
          <PhotoSlider serviceTitle="Groutix" />
        </div>
      </AnimatedSection>
    </main>
  );
}

