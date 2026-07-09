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
        question: "What Is Shower Regrouting?",
        answer:
          "Shower regrouting is the process of removing deteriorated grout from between your tiles and replacing it with a new grout system designed for wet areas. This restores the appearance of your shower, improves hygiene and helps prevent water from penetrating behind the tiles.",
      },
      {
        question: "How Long Does Shower Regrouting Take?",
        answer:
          "Most shower regrouting jobs are completed within a single day. The exact timeframe depends on the condition of the existing grout, the size of the shower, the tile size and whether any additional repairs are required. Your GROUTIX technician will confirm the expected timeframe before work begins.",
      },
      {
        question: "Can You Just Do The Walls Or Floors?",
        answer:
          "In most cases, yes. After assessing your shower we'll recommend only the work that is genuinely needed — whether that's the walls, the floor or both. If we identify other issues outside our scope, we'll refer you to the appropriate trade.",
      },
      {
        question: "Do Tiles Need To Be Removed To Regrout A Shower?",
        answer:
          "In most cases, no. Our regrouting process keeps your existing tiles in place while we remove and replace the failing grout. This restores the shower without the cost, mess and disruption of a full bathroom renovation.",
      },
    ],
  },
  {
    title: "Leaking Shower Repairs",
    faqs: [
      {
        question: "How Do I Know If My Shower Is Leaking?",
        answer:
          "Common signs include a musty smell, mould growth, water stains on walls or ceilings outside the bathroom, loose or drummy tiles, and bubbling or peeling paint. Some leaks stay hidden behind tiles, so a professional inspection is the best way to confirm the source.",
      },
      {
        question: "Can A Leaking Shower Be Fixed Without Renovating?",
        answer:
          "Yes. Many leaking showers can be repaired through regrouting and resealing without removing tiles or renovating the bathroom. Addressing the problem early helps prevent hidden moisture damage and more costly repairs down the track.",
      },
      {
        question: "Is Resealing Enough To Fix A Leaking Shower?",
        answer:
          "Resealing can help in some cases, but many leaks are caused by failing grout or weakened junctions rather than the silicone alone. Applying new silicone on its own is often only a temporary fix. A thorough assessment lets us address the real cause for a lasting result.",
      },
    ],
  },
  {
    title: "Tile Regrouting",
    faqs: [
      {
        question: "When Should Grout Be Replaced?",
        answer:
          "Grout should be replaced when it becomes cracked, missing, permanently stained or starts allowing moisture to pass through. Replacing failing grout early helps maintain the integrity of the tiled area and reduces the risk of leaks.",
      },
      {
        question: "Can You Regrout Bathroom Tiles Without Removing Them?",
        answer:
          "Yes. We remove the old grout while your existing tiles stay in place, restoring the joints and improving the overall appearance without demolition.",
      },
      {
        question: "Is Tile Regrouting Suitable For Floors As Well As Walls?",
        answer:
          "Yes. Regrouting can be carried out on both floor and wall tiles in bathrooms, laundries and other wet areas, improving hygiene and helping to protect against water damage.",
      },
      {
        question: "What Areas Can You Regrout?",
        answer:
          "We can regrout most tiled areas, both indoors and outdoors, including bathrooms, laundries, kitchens, balconies and full homes. Mosaic tiles are generally not suitable for regrouting.",
      },
    ],
  },
  {
    title: "Small Tiling Jobs",
    faqs: [
      {
        question: "What Types Of Small Tiling Jobs Do You Do?",
        answer:
          "We carry out small repairs such as replacing loose, cracked or damaged tiles — often alongside regrouting — to restore the appearance and stability of your tiled areas.",
      },
      {
        question: "Do You Do Full Bathroom Retiling?",
        answer:
          "We specialise in small repairs associated with grout and shower issues rather than full bathroom retiling. For a complete bathroom renovation, a general contractor is usually the better fit.",
      },
    ],
  },
  {
    title: "Real Estate & Property Services",
    faqs: [
      {
        question: "Do You Work With Property Managers & Real Estate Agencies?",
        answer:
          "Yes. We regularly carry out repairs and maintenance for rental properties, helping protect bathrooms and reduce ongoing maintenance issues for property managers and agencies.",
      },
      {
        question: "Can You Complete Repairs Between Tenancies?",
        answer:
          "Yes. We can complete work between tenancies to ensure the bathroom is properly maintained before new occupants move in, improving presentation and reducing future issues.",
      },
      {
        question: "Do You Provide Ongoing Maintenance For Managed Properties?",
        answer:
          "Yes. We support single properties and managed portfolios with grout and shower repairs, helping prevent water damage and extend the lifespan of bathrooms.",
      },
    ],
  },
  {
    title: "Pricing, Warranty & General Questions",
    faqs: [
      {
        question: "How Much Does Shower Regrouting Or Repair Cost?",
        answer:
          "Costs vary depending on the condition of the shower, its size and the repairs required. We provide clear, obligation-free quotes after assessing the area so you know exactly what to expect.",
      },
      {
        question: "Do You Offer A Warranty?",
        answer:
          "Yes. All full shower regrouts completed by GROUTIX are backed by our industry-leading 10-year waterproof warranty, subject to the approved scope of work and warranty terms.",
      },
      {
        question: "What Areas Do You Service?",
        answer:
          "We service major metro and regional areas across Australia, including Victoria, New South Wales, Queensland, Western Australia and South Australia.",
      },
      {
        question: "Do You Work On Commercial Properties As Well?",
        answer:
          "Yes. As well as residential work, we handle commercial environments such as gyms, schools and other high-use facilities with durable, long-lasting solutions.",
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
              className="bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-sm text-base transition-colors active:scale-95 border-2 border-accent"
            >
              Request A Quote
            </Link>
            <a
              href="tel:70238094"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white font-black px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
            >
              <Phone className="h-4 w-4" /> 7023 8094
            </a>
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
