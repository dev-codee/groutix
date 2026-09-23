"use client";
import React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { useSiteContent, useContact } from "@/components/SiteContentProvider";

export default function CtaBanner() {
  const { cta } = useSiteContent();
  const { phone, tel } = useContact();
  return (
    <section className="bg-secondary py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,214,79,0.25),_transparent_40%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-white text-center md:text-left relative z-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{cta.heading}</h2>
            <p className="text-white/80 mt-2 text-base">{cta.subtext}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
          <Link href="/contact" className="bg-white hover:bg-accent hover:text-primary text-primary font-black px-8 py-3.5 rounded shadow-md transition-all duration-200 text-base tracking-wide text-center active:scale-95 border-2 border-accent">
            {cta.buttonLabel}
          </Link>
          <a href={tel} className="flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-8 py-3.5 rounded transition-all duration-200 text-base tracking-wide active:scale-95">
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
