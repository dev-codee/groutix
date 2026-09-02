import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TermsContent from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions | Groutix Australia",
  description:
    "Official Terms and Conditions for Groutix Pty Ltd — covering quotations, shower regrouting services, 10-year warranty, payment terms, and cancellation policies.",
  alternates: { canonical: "/terms-conditions" },
};

export default function TermsConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[73px] min-h-screen bg-slate-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#001F97] via-[#001777] to-[#000f50] text-white py-14 lg:py-20 border-b border-blue-900/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_60%)]" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-white/90 mb-4 border border-white/15">
              <span>Groutix Pty Ltd</span>
              <span>•</span>
              <span>ACN 687 415 005</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
              Terms &amp; Conditions
            </h1>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl">
              Please review the binding terms and conditions governing all quotations, bookings, shower regrouting works, waterproof warranties, and services provided by Groutix Pty Ltd.
            </p>
          </div>
        </section>

        {/* Main Content & Interactive Table of Contents */}
        <TermsContent />
      </main>
      <Footer />
    </>
  );
}
