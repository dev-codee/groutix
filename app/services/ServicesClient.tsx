"use client";
import ServicesSection from "@/components/ServicesSection";
import CtaBanner from "@/components/CtaBanner";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";

export default function ServicesClient() {
  return (
    <main className="pt-[73px]">
      {/* Page Header */}
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
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-black tracking-tight"
          >
            What We Do
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            Expert shower regrouting, grout fixes, leaky shower restoration, and tile repair services for homes and managed properties.
          </motion.p>
        </div>
      </motion.section>

      <ServicesSection />

      <AnimatedSection>
        <CtaBanner />
      </AnimatedSection>
    </main>
  );
}
