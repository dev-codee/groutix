"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { faqJsonLd } from "@/lib/seo";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-neutral-200 bg-white cursor-pointer list-none"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="font-semibold text-neutral-900 text-base leading-snug">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#2F63CC] flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="px-5 pb-4 text-base text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function FaqSection() {
  const faqs = [
    {
      question: "How Do I Know If I Need Regrouting or Recaulking?",
      answer: "Cracked, crumbling grout usually means regrouting. Peeling or soft silicone around corners usually means recaulking. Many Melbourne bathrooms need both — catching it early saves money.",
    },
    {
      question: "How Do I Fix Shower Grout Mould?",
      answer: "Cleaning it only masks the smell for a while. If mould keeps coming back in the same spot, the grout underneath has usually failed and needs replacing, not just scrubbing.",
    },
    {
      question: "Will You Need to Remove My Tiles to Regrout a Shower?",
      answer: "No, in most cases. Standard regrouting works around your existing tiles, so there's no full tear out.",
    },
    {
      question: "How Long Does Shower Regrouting Last?",
      answer: "Done properly, it holds up for years of daily use. That's exactly why we back every complete job with a 10 year warranty instead of just saying \"it'll be fine.\"",
    },
    {
      question: "Can You Repair a Shower While Tenants Are Living There?",
      answer: "Yes. Most jobs are completed in a single visit with minimal disruption, which works well for occupied rentals, agents, and strata managers. We work around your timelines.",
    },
    {
      question: "Which Suburbs and Regions Do We Service Across Victoria?",
      answer: "Melbourne and surrounding suburbs, plus regional Victoria. Not sure we cover your area? Contact us to confirm.",
    },
    {
      question: "Do I Have to Stop Using My Shower Afterward?",
      answer: "Yes, for a short period while the grout and silicone cure. We'll tell you exactly how long before we start.",
    },
    {
      question: "Do You Work on Showers, Kitchens, and Balconies?",
      answer: "Yes. We handle grout and silicone repairs across bathrooms, kitchens, laundries, and balconies.",
    },
    {
      question: "Worried About Regrouting Cost Before You Call?",
      answer: "Most shower regrouting jobs are competitively priced. See our full pricing guide for details, or request a free, no-obligation quote.",
    },
  ];

  return (
    <AnimatedSection className="bg-white py-16 lg:py-24" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(faqs.map((f) => ({ q: f.question, a: f.answer })))
          ),
        }}
      />
      <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
        <div className="space-y-6 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight text-center"
          >
            Frequently Asked <span className="text-accent">Questions</span>
          </motion.h2>
          <ul className="divide-y divide-neutral-200 border border-neutral-200 p-0">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.question} a={faq.answer} />
            ))}
          </ul>
        </div>
      </div>
    </AnimatedSection>
  );
}

