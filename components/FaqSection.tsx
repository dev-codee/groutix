"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How Long Does Shower Regrouting Take?",
      answer: "Most shower regrouting jobs are completed within a single day, depending on the condition of the grout and any required repairs. Your technician will explain the full process and timeframe before work begins so you'll know exactly what to expect.",
    },
    {
      question: "Do I Need To Remove My Tiles?",
      answer: "No. We specialize in regrouting and leak repairs that do not require removing tiles. We replace only the failed grout and sealants, preserving your existing tiled surfaces while stopping leaks and restoring waterproofing.",
    },
    {
      question: "Do I Have To Stop Using My Shower?",
      answer: "Yes. We recommend waiting 24 hours after completion before using your shower. This allows the fresh grout and silicone sealants to cure completely, ensuring a watertight and durable result.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-neutral-50 border-b border-neutral-200" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Frequently Asked <span className="text-secondary">Questions</span>
          </h2>
          <p className="text-neutral-600 text-lg">
            Have questions about regrouting, leak detection, or our warranties? Find quick answers below.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow transition-shadow"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-neutral-900 hover:text-primary transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center space-x-3 pr-4">
                    <HelpCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-sm sm:text-base">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-neutral-400 transition-transform duration-300 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[250px] border-t border-neutral-100" : "max-h-0"
                  }`}
                >
                  <p className="p-5 text-sm text-neutral-600 leading-relaxed bg-neutral-50/50">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Contact Help Link */}
        <div className="text-center mt-12 text-sm text-neutral-500">
          Still have questions?{" "}
          <a
            href="/contact"
            className="text-secondary hover:text-secondary-hover font-bold underline transition-colors"
          >
            Contact our customer care team
          </a>
        </div>

      </div>
    </section>
  );
}
