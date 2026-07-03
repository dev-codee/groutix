import React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="bg-secondary py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-white text-center md:text-left">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Ready to fix your shower today?</h2>
          <p className="text-white/80 mt-2 text-base">Free quotes. No obligation. Fast service across Australia.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
          <Link href="/contact" className="bg-white hover:bg-neutral-100 text-primary font-black px-8 py-3.5 rounded shadow-md transition-all duration-200 text-sm tracking-wide text-center">
            Get Free Quote
          </Link>
          <a href="tel:70238094" className="flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-8 py-3.5 rounded transition-all duration-200 text-sm tracking-wide">
            <Phone className="h-4 w-4" />
            7023 8094
          </a>
        </div>
      </div>
    </section>
  );
}
