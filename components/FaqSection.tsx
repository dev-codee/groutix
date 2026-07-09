"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How Long Does Shower Regrouting Take?",
      answer: "Most shower regrouting jobs can be completed within one day, depending on the size of the shower, the condition of the existing grout and sealants, and whether any additional repairs are required. At GROUTIX, we don't simply apply new grout over failing areas. We remove deteriorated grout and sealants, properly prepare the joints, and install a suitable grout system designed for wet areas. This helps deliver a cleaner, longer-lasting result rather than a temporary cosmetic patch.",
    },
    {
      question: "Do Tiles Need to Be Removed for Shower Regrouting?",
      answer: "In most cases, no tile removal is required. Our shower regrouting process is designed to remove failed or deteriorated grout and sealants while keeping the existing tiles in place. This means many leaking or deteriorated showers can be restored without the cost, mess and disruption of a full bathroom renovation. If we identify loose, damaged or drummy tiles that require separate attention, we'll explain the available repair options before proceeding.",
    },
    {
      question: "Will the New Grout Match My Existing Tiles?",
      answer: "Yes. GROUTIX offers a wide range of grout colours to match or complement your existing tiles and bathroom finishes. Where only part of an area is being repaired, we aim to achieve the closest practical match with the surrounding grout. Your technician can help select the most suitable colour based on the existing tiled area and the type of grout system being installed.",
    },
    {
      question: "How Long Before I Can Use My Shower After Regrouting?",
      answer: "The curing time depends on the grout system used. Polymer grout generally requires 24–48 hours before the shower can be used, while epoxy grout requires approximately 72 hours to fully cure. Your GROUTIX technician will provide clear aftercare instructions based on the specific grout system installed. Following the recommended curing time is important to help protect the new grout and achieve the best long-term result.",
    },
    {
      question: "Do You Offer a Warranty on Shower Regrouting?",
      answer: "Yes. Eligible full shower regrouting and leaking shower repair services completed by GROUTIX are backed by our 10-year waterproof warranty, subject to the approved scope of work and warranty terms. We stand behind our work because our focus is on addressing failed grout and sealants properly, not covering over the problem with a temporary surface fix. Our goal is to give you confidence that your shower repair has been completed for long-term protection.",
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
                    <span className="text-base sm:text-base">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-neutral-400 transition-transform duration-300 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[500px] border-t border-neutral-100" : "max-h-0"
                  }`}
                >
                  <p className="p-5 text-base text-neutral-600 leading-relaxed bg-neutral-50/50">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Contact Help Link */}
        <div className="text-center mt-12 text-base text-neutral-500">
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
