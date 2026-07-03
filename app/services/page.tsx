import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesSection from "@/components/ServicesSection";
import CtaBanner from "@/components/CtaBanner";

export const metadata: Metadata = {
  title: "Our Services — GROUTIX",
  description:
    "Explore our full range of shower regrouting, silicone resealing, tile repair, and grout colour change services across Australia.",
};

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        {/* Page Header */}
        <section className="bg-primary py-20 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Our Services</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Professional shower regrouting, tile sealing, and waterproofing solutions for homes and businesses across Australia.
            </p>
          </div>
        </section>

        <ServicesSection />

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
