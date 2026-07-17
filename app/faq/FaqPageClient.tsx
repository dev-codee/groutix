"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Phone } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { faqCategories, type Faq } from "@/lib/faqData";

function FaqItem({ faq }: { faq: Faq }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow transition-shadow">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left font-extrabold text-neutral-900 hover:text-primary transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-lg sm:text-xl leading-snug">{faq.question}</span>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white">
          <Plus
            className={`h-5 w-5 transition-transform duration-300 ${
              isOpen ? "rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[500px] border-t border-neutral-100" : "max-h-0"
        }`}
      >
        <p className="p-5 sm:p-6 text-base text-neutral-600 leading-relaxed bg-neutral-50/50">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export default function FaqPageClient() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCategory = faqCategories[activeIndex];

  return (
    <main className="pt-[73px]">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-primary bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%)] text-white py-24"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] uppercase tracking-[0.35em] text-white/90"
          >
            Groutix FAQs
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          >
            Frequently Asked <span className="text-accent">Questions</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed"
          >
            If you&apos;re dealing with a leaking shower, failing grout or worn bathroom tiles, it&apos;s normal to have questions. Here are answers to the ones we hear most.
          </motion.p>
        </div>
      </motion.section>

      {/* FAQ Categories */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-16 items-start">
          {/* Left: Category selector */}
          <aside className="lg:sticky lg:top-24">
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mb-6">
              What Is Your Question About?
            </h2>
            <nav className="flex flex-col">
              {faqCategories.map((category, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={category.title}
                    onClick={() => setActiveIndex(i)}
                    aria-current={isActive}
                    className={`text-left px-5 py-4 text-base font-bold transition-colors ${
                      isActive
                        ? "bg-primary text-white rounded-md shadow-sm"
                        : "text-neutral-700 hover:text-primary border-b border-neutral-200"
                    }`}
                  >
                    {category.title}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right: Active category questions */}
          <div className="min-w-0">
            <motion.h2
              key={activeCategory.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight mb-8"
            >
              {activeCategory.title}
            </motion.h2>
            <div className="space-y-4">
              {activeCategory.faqs.map((faq) => (
                <FaqItem key={faq.question} faq={faq} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <AnimatedSection className="bg-primary py-14 px-6 lg:px-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
        <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight max-w-2xl">
            Still have questions? Our team is happy to help.
          </h2>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/contact"
              className="bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-xl text-base transition-colors active:scale-95 border-2 border-accent"
            >
              Request A Quote
            </Link>
            <a
              href="tel:70238094"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white font-black px-6 py-3 rounded-xl text-base transition-colors active:scale-95"
            >
              <Phone className="h-4 w-4" /> 7023 8094
            </a>
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
