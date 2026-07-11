"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";

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
      question: "How Do I Know If My Shower Needs Regrouting or Recaulking?",
      answer: "If you notice cracked, missing or discoloured shower grout, peeling or mouldy silicone, water leaking outside the shower, damp walls, or a musty smell, it may be time for shower regrouting or recaulking. Addressing these issues early can help prevent water damage and costly repairs.",
    },
    {
      question: "Can a Leaking Shower Be Repaired Without Removing the Tiles?",
      answer: "Yes, in many cases. If your leaking shower is caused by failed grout or silicone, we can often repair it without removing the tiles, saving you the cost and disruption of a bathroom renovation. An inspection will determine the exact cause of the leak.",
    },
    {
      question: "How Long Does Shower Regrouting Take?",
      answer: "Most shower regrouting jobs are completed within one day. Before work begins, your technician will inspect the shower, explain the repair process and expected timeframe, then complete the repairs to restore a watertight, long-lasting finish.",
    },
    {
      question: "How Much Does Shower Regrouting Cost?",
      answer: "The cost of shower regrouting depends on the size of your shower, its condition, and the repairs required. We provide a detailed quote after inspecting your shower, so you know exactly what's included before any work begins.",
    },
    {
      question: "How Long Before I Can Use My Shower Again?",
      answer: "Most showers are ready to use 24 hours after regrouting and recaulking. If epoxy grout is installed, we recommend allowing 72 hours for full curing before using the shower. Your technician will confirm the required curing time based on the materials used.",
    },
  ];

  return (
    <AnimatedSection className="bg-white py-16 lg:py-24" id="faq">
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

