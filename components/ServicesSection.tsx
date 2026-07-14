import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";

/* ─── Shared image placeholder ─── */
function ImgBox({ label, src }: { label: string; src?: string }) {
  return (
    <div className="relative aspect-[4/3] w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm">
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
            <p className="text-[12px] text-neutral-300">Picture space - add manually</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ServicesSection() {
  const services = [
    {
      id: "shower-regrouting",
      title: "Shower Regrouting",
      description: "Take out worn-out shower grout and swap it with fresh, damp-area grout made to boost both looks and waterproofing.",
      imageLabel: "Shower Regrouting Service Image",
      imageSrc: "/img8.jpeg"
    },
    {
      id: "shower-base-repair",
      title: "Shower Base Repair",
      description: "Fix cracked or leaking shower floors with precise base restoration that brings back waterproof integrity without complete demolition.",
      imageLabel: "Shower Base Repair Service Image",
      imageSrc: "/img4.avif"
    },
    {
      id: "tile-regrouting",
      title: "Tile Regrouting",
      description: "Give stained, broken, or outdated grout lines a refresh in bathrooms, laundries, kitchens, balconies, and other tiled areas.",
      imageLabel: "Tile Regrouting Service Image",
      imageSrc: "/img40.jpeg"
    },
    {
      id: "leaking-shower-repair",
      title: "Leaking Shower Repair",
      description: "Track leaky shower issues to faulty grout lines and seals, then properly restore the wet area instead of just hiding the problem.",
      imageLabel: "Leaking Shower Repair Image",
      imageSrc: "/img23.jpeg"
    },
    {
      id: "small-tiling-jobs",
      title: "Small Tiling Jobs",
      description: "Replace broken tiles, reattach loose tiles, and patch up damaged grout so isolated tile issues are fixed cleanly and expertly.",
      imageLabel: "Small Tiling Jobs Image",
      imageSrc: "/img16.jpeg"
    },
    {
      id: "real-estate-property-services",
      title: "Real Estate & Property Services",
      description: "Help landlords, property managers, and strata teams with effective grout, shower, and wet-area repairs that protect the property.",
      imageLabel: "Real Estate & Property Image",
      imageSrc: "/img9.jpeg"
    },
  ];

  return (
    <AnimatedSection className="py-16 lg:py-24 bg-white border-t border-neutral-100" id="services">
      <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="space-y-3 mb-12">
          <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
            What <span className="text-accent">We Offer</span>
          </h2>
          <p className="text-neutral-500 text-base sm:text-[18px]">
            Groutix focuses on shower regrouting, grout fixes, leaky shower repairs, and tile restoration for homes and businesses. Our fix-first method is made to solve broken grout and sealing problems without unnecessary demolition.
          </p>
        </div>

        {/* Services Grid — image top, content below (matching reference site cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white border border-neutral-200 overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-sm hover:border-accent"
            >
              {/* Image Placeholder */}
              <div className="relative">
                <ImgBox label={service.imageLabel} src={service.imageSrc} />
                <div className="absolute top-3 left-3 bg-accent text-primary px-3 py-1 rounded-sm text-xs font-bold">
                  Service
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-neutral-900 group-hover:text-primary transition-colors duration-200">
                  {service.title}
                </h3>
                <p className="text-base text-neutral-600 leading-relaxed flex-1">
                  {service.description}
                </p>
                <Link
                  href={`/${service.id}`}
                  className="inline-flex items-center gap-1.5 text-accent group-hover:text-primary font-semibold text-base tracking-wide transition-colors mt-2"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </motion.div>
          ))}

          {/* 6th Card: Request A Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: services.length * 0.1, duration: 0.4 }}
            className="relative border border-primary rounded-sm overflow-hidden flex flex-col justify-end p-8 bg-primary text-white min-h-[350px] hover:bg-primary-hover transition-all duration-300"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
              <span className="text-white/10 font-bold text-sm uppercase tracking-widest">Bathroom Photo Place</span>
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-3xl font-black tracking-tight text-white">Get a Quote</h3>
              <Link
                href="/contact"
                className="inline-block bg-white hover:bg-neutral-100 text-primary font-bold px-6 py-3 rounded-sm text-base tracking-wide transition-colors shadow active:scale-95"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
