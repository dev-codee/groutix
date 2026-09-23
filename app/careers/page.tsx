import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Groutix team. We're always looking for skilled technicians and dedicated professionals to help us restore wet areas across Victoria.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers | Groutix",
    description: "Join the Groutix team and build a rewarding career in property maintenance and tiling repairs.",
    url: "/careers",
    type: "website",
  },
};

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        {/* Hero Section */}
        <section className="bg-[#001F97] text-white relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px),linear-gradient(90deg,rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px)] bg-[size:150px_150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_45%)] pointer-events-none" />

          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 text-center relative z-10">
            <p className="inline-flex rounded-sm border border-white/20 bg-white/10 px-4 py-2 text-[13px] uppercase tracking-[0.35em] text-white/90 font-bold">
              Join Our Team
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Careers at Groutix
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
              We're always looking for skilled technicians, customer service superstars, and dedicated professionals to help us provide top-tier shower repair and regrouting services across Victoria.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight">
              Why Work With <span className="text-accent">Groutix?</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed text-lg">
              At Groutix, we take pride in our work. We believe in providing honest advice, expert workmanship, and dependable service. When you join our team, you become part of a growing company that values its employees and invests in their success.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-8 text-left">
              {[
                "Competitive industry rates",
                "Ongoing training and development",
                "Supportive team environment",
                "Stable, consistent work across Victoria",
                "High-quality tools and materials provided",
                "Opportunities for career advancement"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#F3F4F6] px-5 py-4 rounded-sm">
                  <div className="w-6 h-6 flex items-center justify-center bg-[#001F97] text-white rounded-full flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-neutral-800 tracking-wide">{benefit}</span>
                </div>
              ))}
            </div>


          </div>
        </AnimatedSection>
      </main>
      <Footer />
    </>
  );
}
