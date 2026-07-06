"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";

/* ─── Shared image placeholder ─── */
function ImgBox({ label, src }: { label: string; src?: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
      {src ? (
        <Image src={src} alt={label} fill className="object-cover" />
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

export default function GuaranteeSection() {
  return (
    <AnimatedSection className="bg-white py-16 lg:py-24">
      <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-5"
        >
          <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
            GROUTIX <span className="text-accent">Guarantee</span>
          </h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed text-base sm:text-[18px]">
            <p>
              Every job completed by GROUTIX is backed by our industry-leading 10-year waterproof warranty. If water penetrates through our workmanship, we fix it with no questions asked.
            </p>
            <p className="font-semibold text-neutral-800">
              Combined with our proven processes, specialist materials and experienced grout specialists, our guarantee gives you complete confidence that your shower repair is built to last, not just look good on day one.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <a
              href="tel:70238094"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
            >
              <Phone className="h-4 w-4" /> 7023 8094
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
            >
              Request A Quote
            </Link>
          </div>
        </motion.div>
        {/* Right: Image */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ImgBox label="Guarantee Section Image" src="/home-page-2.jpeg" />
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
