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

export default function ContactClient() {
  const contactInfo = [
    { icon: <Phone className="h-5 w-5 text-secondary" />, label: "Call Today", value: "7023 8094", href: "tel:70238094" },
    { icon: <Mail className="h-5 w-5 text-secondary" />, label: "Email", value: "info@groutix.com", href: "mailto:info@groutix.com" },
    { icon: <Clock className="h-5 w-5 text-secondary" />, label: "Office Hours", value: "Mon – Fri: 8:00am – 5:00pm", href: null },
    { icon: <MapPin className="h-5 w-5 text-secondary" />, label: "Locations", value: "Perth, Melbourne, Sydney, Brisbane, Adelaide, Geelong", href: "/locations" },
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
            Get a Free Quote
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            Fill out the form below or call us free. We will contact you within 1 business hour.
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
              <h2 className="text-2xl font-black text-neutral-900">Contact Information</h2>
              <p className="text-neutral-600 leading-relaxed">
                Our friendly team is ready to help you solve your shower leak or tile issue. Contact us by phone, email, or use the quote form and we will get back to you fast.
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
                  title="GROUTIX location on Google Maps"
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
          <PhotoSlider serviceTitle="GROUTIX" />
        </div>
      </AnimatedSection>
    </main>
  );
}
