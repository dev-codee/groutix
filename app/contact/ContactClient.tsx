"use client";
import Image from "next/image";
import { useState } from "react";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import { Phone, Mail, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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

/* ─── Image slider component (matches service page style) ─── */
function PhotoSlider({ serviceTitle }: { serviceTitle: string }) {
  const [idx, setIdx] = useState(0);
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg", "/img57.jpeg", "/img58.jpeg", "/img59.jpeg", "/img60.jpeg", "/img61.jpeg", "/img62.jpeg"];
  const total = sliderImages.length;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total], sliderImages[(idx + 2) % total]];

  return (
    <div className="space-y-4">
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
      <div className="flex items-center gap-3 pt-2 max-w-5xl mx-auto">
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

export default function ContactClient() {
  const contactInfo = [
    { icon: <Phone className="h-5 w-5 text-secondary" />, label: "Call Us", value: "7023 8094", href: "tel:70238094" },
    { icon: <Mail className="h-5 w-5 text-secondary" />, label: "Email Us", value: "info@Groutix.com", href: "mailto:info@Groutix.com" },
    { icon: <Clock className="h-5 w-5 text-secondary" />, label: "Our Hours", value: "Mon – Fri: 8:00am – 5:00pm", href: null },
    { icon: <MapPin className="h-5 w-5 text-secondary" />, label: "Areas We Serve", value: "Perth, Melbourne, Sydney, Brisbane, Adelaide, Geelong", href: "/locations" },
  ];

  return (
    <main className="pt-[73px]">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-primary py-20 text-white text-center"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl font-black tracking-tight"
              >
                Get a Free Grout Fix Quote
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/80 text-lg max-w-2xl mx-auto"
              >
                Send us your shower, grout, or tile repair question and our team will get back to you quickly with the next steps.
              </motion.p>
        </div>
      </motion.section>

      {/* Content */}
      <AnimatedSection className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-neutral-900">Get in Touch with Groutix</h2>
              <p className="text-neutral-600 leading-relaxed">
                Contact us about shower regrouting, grout fixes, leaky shower problems, or tile restoration. Tell us about the issue by phone, email, or the quote form and we'll help you find the right repair solution.
              </p>
            </div>
            <ul className="space-y-6">
              {contactInfo.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-bold text-neutral-900 hover:text-primary transition-colors">{item.value}</a>
                    ) : (
                      <p className="font-bold text-neutral-900">{item.value}</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* Google Maps location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
                <iframe
                  title="Groutix location on Google Maps"
                  src="https://www.google.com/maps?q=Groutix%2C%2082A%20Marigold%20Cres%2C%20Gowanbrae%20VIC%203043&z=14&output=embed"
                  className="block w-full h-56"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a
                href="https://maps.google.com/?cid=11736395911597271820"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-secondary transition-colors"
              >
                <MapPin className="h-4 w-4" /> Get directions
              </a>
            </motion.div>
          </motion.div>

          {/* Right: Quote Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <HeroQuoteForm />
          </motion.div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <PhotoSlider serviceTitle="Groutix" />
        </div>
      </AnimatedSection>
    </main>
  );
}

