"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Phone } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";

type Faq = { question: string; answer: string };
type FaqCategory = { title: string; faqs: Faq[] };

const categories: FaqCategory[] = [
  {
    title: "Shower Regrouting",
    faqs: [
      {
        question: "How Do I Know If My Shower Needs Regrouting or Recaulking?",
        answer:
          "Cracked, missing or discoloured grout, peeling silicone, water escaping the shower, damp walls or persistent mould are all signs your shower may need attention. Repairing these issues early can help prevent further water damage and more expensive repairs.",
      },
      {
        question: "What Is Shower Regrouting?",
        answer:
          "Shower regrouting involves removing deteriorated grout and replacing it with a new, durable grout system suitable for wet areas. This improves the appearance of your shower, strengthens the tile joints and helps reduce water penetration.",
      },
      {
        question: "How Long Does Shower Regrouting Take?",
        answer:
          "Most shower regrouting projects are completed within one day. After inspecting your shower, your technician will explain the repair process, expected timeframe and any additional work that may be required before getting started.",
      },
      {
        question: "Can You Regrout Just The Shower Walls or Floor?",
        answer:
          "Yes. Every shower is different, so we tailor the repairs to its condition. Whether only the walls, the floor or the entire shower requires regrouting, we'll recommend the most appropriate solution.",
      },
      {
        question: "Do Tiles Need To Be Removed To Regrout A Shower?",
        answer:
          "No, in most cases. Our regrouting process is designed to restore the grout joints while keeping your existing tiles in place, avoiding the time, cost and disruption of replacing the entire shower.",
      },
    ],
  },
  {
    title: "Leaking Shower Repairs",
    faqs: [
      {
        question: "How Do I Know If My Shower Is Leaking?",
        answer:
          "A leaking shower isn't always obvious. Common signs include water stains, peeling paint, mould growth, damp walls, musty odours, or water appearing outside the shower after use. If left untreated, even a small leak can lead to costly structural damage.",
      },
      {
        question: "Can A Leaking Shower Be Repaired Without Removing The Tiles?",
        answer:
          "Yes, in many cases. If the leak is caused by failed grout, silicone or movement joints, we can often repair your leaking shower without removing the tiles or renovating the bathroom. An inspection will determine the most suitable solution.",
      },
      {
        question: "What Causes A Shower To Leak?",
        answer:
          "Leaking showers are commonly caused by cracked grout, deteriorated silicone, movement in tile joints, damaged waterproofing or plumbing defects. Identifying the exact cause is the first step towards a long-lasting repair.",
      },
      {
        question: "How Do You Find The Source Of A Shower Leak?",
        answer:
          "Our technicians carry out a thorough inspection of the shower and surrounding areas to identify where the water is escaping. Once the cause has been confirmed, we'll explain the issue and recommend the most appropriate repair solution.",
      },
      {
        question: "Can A Leaking Shower Get Worse If Left Unrepaired?",
        answer:
          "Yes. Water can continue spreading behind tiles, damaging walls, floors and surrounding structures. Repairing a leaking shower early can help prevent more extensive damage and significantly reduce future repair costs.",
      },
    ],
  },
  {
    title: "Tile Regrouting",
    faqs: [
      {
        question: "When Should Tile Grout Be Replaced?",
        answer:
          "Grout should be replaced when it becomes cracked, missing, discoloured or begins allowing moisture to penetrate. Replacing deteriorated grout early helps protect your tiled surfaces and extends their lifespan.",
      },
      {
        question: "Can You Regrout Tiles Without Removing Them?",
        answer:
          "Yes. We remove the old grout while keeping your existing tiles in place, restoring the grout joints without the cost, mess or disruption of replacing the tiles.",
      },
      {
        question: "What Areas Can Be Regrouted?",
        answer:
          "We can regrout most tiled areas, including bathrooms, showers, laundries, kitchens, balconies, floors and walls. During your inspection, we'll confirm whether your tiled area is suitable for regrouting.",
      },
      {
        question: "Can You Match My Existing Grout Colour?",
        answer:
          "Yes. We stock a wide range of grout colours and will recommend the closest match to your existing grout wherever possible. If you're updating the look of your tiles, we can also help you choose a new grout colour.",
      },
      {
        question: "Is Tile Regrouting Better Than Retiling?",
        answer:
          "If your tiles are still in good condition, regrouting is often a faster and more cost-effective alternative to replacing them. It refreshes the appearance of your tiled area while restoring the grout joints without the need for demolition.",
      },
    ],
  },
  {
    title: "Epoxy Grout",
    faqs: [
      {
        question: "What Is Epoxy Grout?",
        answer:
          "Epoxy grout is a premium grout specifically designed for wet areas and demanding environments. It offers superior stain resistance, water resistance and durability, making it an excellent long-term solution for tiled surfaces.",
      },
      {
        question: "Is Epoxy Grout Better Than Cement Grout?",
        answer:
          "Both have their advantages, but epoxy grout offers greater durability, superior stain resistance and enhanced water resistance. It's a popular upgrade for customers looking for a longer-lasting, lower-maintenance finish.",
      },
      {
        question: "Can My Existing Shower Or Tiled Area Be Upgraded To Epoxy Grout?",
        answer:
          "In many cases, yes. Existing grout can often be removed and replaced with epoxy grout, provided the tiles and surrounding area are suitable. We'll assess your tiled area and recommend the most appropriate solution.",
      },
      {
        question: "How Long Does Epoxy Grout Take To Cure?",
        answer:
          "Epoxy grout requires approximately 72 hours to fully cure before the area can be used. Your technician will confirm the recommended curing time after the installation is complete.",
      },
      {
        question: "Where Do You Recommend Epoxy Grout?",
        answer:
          "We recommend epoxy grout for showers, bathrooms, balconies, laundries, kitchens, and other high-moisture or high-traffic tiled areas. Its superior durability, stain resistance and water resistance make it an excellent long-term solution for both residential and commercial properties.",
      },
    ],
  },
  {
    title: "Silicone & Recaulking",
    faqs: [
      {
        question: "When Should Shower Silicone Be Replaced?",
        answer:
          "Shower silicone should be replaced if it is cracked, peeling, mouldy, separating from the tiles, or no longer forming a watertight seal. Replacing failed silicone helps prevent water leaks and keeps your shower protected.",
      },
      {
        question: "Why Does Shower Silicone Turn Black?",
        answer:
          "Black stains are usually caused by mould growing on or beneath deteriorated silicone in damp environments. Once silicone has deteriorated, cleaning alone may not restore it, and replacement is often the best long-term solution.",
      },
      {
        question: "Can You Match My Existing Silicone Colour?",
        answer:
          "Yes. We stock a wide range of silicone colours and will recommend the closest match to your existing grout, tiles or fixtures wherever possible.",
      },
      {
        question: "How Long Before New Silicone Cures?",
        answer:
          "New silicone typically requires 24 hours to fully cure before the shower can be used. Your technician will confirm the recommended curing time after the installation is complete.",
      },
      {
        question: "Why Is Silicone Important In A Shower?",
        answer:
          "Silicone creates a flexible, waterproof seal around movement joints, corners and fixtures where grout should not be used. It helps prevent water penetration while allowing for normal movement between surfaces.",
      },
    ],
  },
  {
    title: "Small Tiling Jobs",
    faqs: [
      {
        question: "Can You Match My Existing Tiles?",
        answer:
          "We'll do our best to match your existing tiles where possible. If you have spare tiles or can provide the tile brand, model or supplier, it can help us source a closer match. If an exact match isn't available, we'll discuss the most suitable replacement options with you before proceeding.",
      },
      {
        question: "Do You Replace Just A Few Tiles?",
        answer:
          "Yes. Whether it's one damaged tile or several, we can replace individual tiles without requiring a complete renovation, provided the surrounding tiles are suitable for repair.",
      },
      {
        question: "Do You Supply Tiles?",
        answer:
          "We can install customer-supplied tiles or discuss suitable replacement options if matching tiles are available. Your technician will explain the best approach during the assessment.",
      },
      {
        question: "Do You Do Full Bathroom Retiling?",
        answer:
          "No. We specialise in small tiling repairs, tile replacements and regrouting rather than complete bathroom renovations. This allows us to focus on fast, high-quality repairs without the cost and disruption of a full bathroom remodel.",
      },
    ],
  },
  {
    title: "Real Estate & Property Services",
    faqs: [
      {
        question: "Do You Work With Property Managers & Real Estate Agencies?",
        answer:
          "Yes. We work with property managers, real estate agencies, landlords and body corporates, providing professional shower repairs, regrouting and small tiling repairs across Melbourne.",
      },
      {
        question: "Can You Complete Repairs Between Tenancies?",
        answer:
          "Yes. Completing repairs between tenancies helps prepare the property for new occupants while reducing the risk of future maintenance issues. We always aim to minimise downtime and complete the work efficiently.",
      },
      {
        question: "Do You Provide Quotes For Rental Property Repairs?",
        answer:
          "Yes. We can provide detailed quotes for rental properties, helping property managers and owners make informed maintenance decisions before work begins.",
      },
      {
        question: "Can You Work Directly With Tenants?",
        answer:
          "Yes. With the owner's or property manager's approval, we can arrange access directly with tenants to help simplify the repair process and reduce administration.",
      },
      {
        question: "Can You Handle Multiple Properties?",
        answer:
          "Yes. Whether you manage a single investment property or a large portfolio, we can assist with ongoing shower repairs, regrouting and small tiling works across multiple locations.",
      },
    ],
  },
  {
    title: "Pricing, Warranty & General Questions",
    faqs: [
      {
        question: "How Much Does Shower Regrouting Or Repair Cost?",
        answer:
          "The cost depends on the condition of your shower, its size and the repairs required. We provide a detailed quote after assessing your shower, so you know exactly what's included before any work begins.",
      },
      {
        question: "Do You Offer A Warranty?",
        answer:
          "Yes. Eligible works completed by Groutix are backed by our workmanship warranty, with warranty periods varying depending on the type of repair and materials used. Your technician will explain the applicable warranty before work begins.",
      },
      {
        question: "What Areas Do You Service?",
        answer:
          "We service Melbourne and surrounding suburbs across Victoria. If you're unsure whether we cover your area, simply contact our team and we'll be happy to assist.",
      },
      {
        question: "Do You Work On Commercial Properties?",
        answer:
          "Yes. We carry out shower repairs, regrouting and small tiling works for commercial properties, including offices, gyms, schools, aged care facilities, apartment buildings, hotels, and other commercial premises.",
      },
      {
        question: "How Can I Request A Quote?",
        answer:
          "Simply contact our team by phone, email or through our online enquiry form. We'll discuss your requirements and arrange an inspection or provide a quote based on the information available.",
      },
    ],
  },
];

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
  const activeCategory = categories[activeIndex];

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
            GROUTIX FAQs
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
              {categories.map((category, i) => {
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

