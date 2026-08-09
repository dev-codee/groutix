"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Ruler,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Phone,
  ArrowRight,
  Check,
  Sliders,
  Maximize2,
  HelpCircle,
} from "lucide-react";
import CtaBanner from "@/components/CtaBanner";
import AnimatedSection from "@/components/AnimatedSection";
import { useContact } from "@/components/SiteContentProvider";

/* ────── Image Placeholder Component ────── */
function ImgBox({ label, aspect = "aspect-[4/3]" }: { label: string; aspect?: string }) {
  return (
    <div
      className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm`}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1 z-10">
        <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[12px] text-neutral-300">Picture space — add manually</p>
      </div>
    </div>
  );
}

/* ────── Product Model Data Structure ────── */
export interface ShowerScreenModel {
  id: string;
  name: string;
  tagline: string;
  category: "Frameless" | "Semi-Frameless" | "Sliding" | "Wardrobes";
  imageLabel: string;
  highlights: string[];
  summary: string;
  description: string[];
  features: string[];
  specs: {
    glass: string;
    frameFinishes: string;
    doorAction: string;
    dimensions: string;
    coating: string;
  };
}

const MODELS: ShowerScreenModel[] = [
  {
    id: "frameless-pivot",
    name: "Bespoke Frameless Pivot & Hinged Screens",
    tagline: "Unobstructed Luxury & Timeless Architectural Elegance",
    category: "Frameless",
    imageLabel: "Frameless Pivot & Hinged Screen Image Placeholder",
    highlights: ["10mm Toughened Glass", "Pivot & Hinged Action", "Custom Frosted / Low-Iron", "Melbourne Crafted"],
    summary:
      "Engineered from heavy-duty 10mm toughened safety glass with heavy-duty brass hinges for a seamless, floating aesthetic.",
    description: [
      "Bespoke Frameless Pivot and Hinged Screens represent the gold standard in modern bathroom design, offering minimalist luxury without structural compromise. Crafted locally in Melbourne using 10mm clear toughened safety glass, these screens deliver exceptional rigidity, safety, and uninterrupted light flow.",
      "The precision pivot or hinged door configuration provides effortless access while maintaining sleek architectural lines. Customize your screen with low-iron ultra-clear glass or privacy-enhancing frosted finishes, complemented by your choice of premium hardware finishes to seamlessly match your bathroom fixtures.",
      "Each unit is custom-manufactured following a precise on-site measurement. For enduring clarity, enhance your glass with the optional Nano4-Glass ceramic coating to repel water spots, soap scum, and mineral buildup.",
    ],
    features: [
      "10mm premium Australian-standard clear toughened safety glass",
      "Precision pivot or heavy-duty hinged door mechanisms for smooth entry",
      "Frosted, low-iron ultra-clear, or patterned glass choices for privacy control",
      "Designer hardware options: Chrome, Matte Black, Brushed Brass, and Satin",
      "Easy-to-clean smooth glass surfaces for effortless upkeep",
      "Optional Nano4-Glass ceramic protective coating for stain resistance",
    ],
    specs: {
      glass: "10mm Clear Toughened Safety Glass (Optional Frosted or Low-Iron)",
      frameFinishes: "Frameless with Chrome, Matte Black, Brushed Gold & Satin Hardware",
      doorAction: "Pivot or Heavy-Duty Hinged Door Entry",
      dimensions: "Custom On-Site Measurement & Custom Fabrication",
      coating: "Optional Nano4-Glass Ceramic Protective Shield",
    },
  },
  {
    id: "frameless-slider",
    name: "Bespoke Frameless Sliding Screens",
    tagline: "Contemporary Space-Saving Innovation & Smooth Gliding Performance",
    category: "Sliding",
    imageLabel: "Frameless Sliding Screen Image Placeholder",
    highlights: ["10mm Toughened Glass", "Space-Saving Glide", "Heavy-Duty Rollers", "Minimalist Profile"],
    summary:
      "Combines space-efficient sliding door operation with 10mm frameless glass luxury for compact or modern master bathrooms.",
    description: [
      "Redefine modern bathroom layouts with Bespoke Frameless Sliding Screens. Expertly engineered for space efficiency and modern elegance, these sliding enclosures maximize usable bathroom space by eliminating outward door swing constraints.",
      "Built with heavy-duty 10mm toughened safety glass and precision stainless steel roller assemblies, the sliding mechanism delivers whisper-quiet operation and robust structural stability. Choose frosted or low-iron glass options to tailor privacy and ambient light.",
      "Custom-crafted to your exact enclosure dimensions after a professional on-site laser measurement. Elevate your glass durability with our optional Nano4-Glass protective shield for easy cleaning.",
    ],
    features: [
      "10mm heavy-duty toughened safety glass engineered for high stability",
      "Smooth-gliding sliding system designed for compact or luxury layouts",
      "Custom frosted or low-iron glass choices to balance light and privacy",
      "Selection of custom roller and track hardware finishes",
      "Precision-measured on-site for a guaranteed watertight fit",
      "Optional Nano4-Glass ceramic protective shield for water-repelling ease",
    ],
    specs: {
      glass: "10mm Clear Toughened Safety Glass (Optional Frosted/Low-Iron)",
      frameFinishes: "Minimalist Tracks in Bright Silver, Matte Black & Brushed Gold",
      doorAction: "Smooth Stainless Steel Sliding Roller System",
      dimensions: "Custom Tailored Up to 2.2M Heights",
      coating: "Optional Nano4-Glass Ceramic Coating Available",
    },
  },
  {
    id: "neptune-series",
    name: "Neptune Semi-Frameless Series",
    tagline: "Cornerless Modern Aesthetics & Flexible Door Configurations",
    category: "Semi-Frameless",
    imageLabel: "Neptune Series Screen Image Placeholder",
    highlights: ["6mm Toughened Glass", "Cornerless Design", "Inward/Outward Swing", "Custom Dimensions"],
    summary:
      "Features an innovative cornerless glass-to-glass join with no vertical frame, creating an open, spacious bathroom ambience.",
    description: [
      "The Neptune Semi-Frameless Series elevates bathroom spaces through clean lines and clever architectural engineering. Designed without vertical frames where glass panels meet, Neptune achieves a seamless, cornerless appearance that maximizes light and spatial open feel.",
      "Manufactured with 6mm Australian-standard toughened glass, Neptune offers ultimate versatility with inward, outward, or centered door configurations to suit any shower layout. Select from clear or obscured cathedral glass alongside a wide array of frame colors.",
      "Assembled by skilled technicians using state-of-the-art mobile units, Neptune delivers quick installation turnarounds backed by optional Nano4-Glass ceramic protection.",
    ],
    features: [
      "6mm Australian safety toughened glass (or 5mm obscured cathedral glass)",
      "Cornerless design without vertical frame joints at glass meets",
      "Versatile door swing: Inward opening, outward opening, or centered door alignment",
      "Customizable dimensions: Up to 2.2m high x 2.0m wide (plus 2m return)",
      "Frame finishes: Bright Silver, Pearl, White, Barley, Bright Gold & Matte Black",
      "Optional Nano4-Glass ceramic coating for easier cleaning",
    ],
    specs: {
      glass: "6mm Clear Toughened Glass or 5mm Obscured Cathedral Glass",
      frameFinishes: "Bright Silver, Pearl, White, Barley, Gold & Black",
      doorAction: "Inward, Outward or Centered Door Configurations",
      dimensions: "Customizable up to 2.2M Height x 2.0M Width",
      coating: "Optional Nano4-Glass Ceramic Protection",
    },
  },
  {
    id: "swiftcloset-wardrobes",
    name: "SwiftCloset Wardrobe Systems",
    tagline: "Fast 5-10 Day Turnaround & Customizable Sliding Robe Doors",
    category: "Wardrobes",
    imageLabel: "SwiftCloset Wardrobe System Image Placeholder",
    highlights: ["5-10 Day Express Turnaround", "Mirror & Glass Inserts", "Cavity & Built-in Fit", "Sleek Frame Colors"],
    summary:
      "Versatile wardrobe sliding door systems designed for quick installation with mirror, back-painted glass, or timber inserts.",
    description: [
      "Extend your interior upgrades beyond the shower with SwiftCloset Wardrobe Systems. Designed for seamless integration into built-in and cavity wardrobe spaces, SwiftCloset combines rapid manufacturing turnarounds with versatile customization.",
      "Enjoy a fast 5 to 10 business day turnaround without compromising quality. Personalize your robe doors with your choice of insert materials—including full-length safety mirrors, modern painted glass, laminated board, or paint-ready plaster.",
      "Complemented by durable aluminum frames in classic and modern tones, SwiftCloset brings effortless organization and modern style to bedrooms and hallway storage.",
    ],
    features: [
      "Express 5 to 10 business day turnaround for quick installation",
      "Seamless compatibility with built-in and cavity wardrobe openings",
      "Multiple insert options: Safety Mirror, Toughened Glass, Laminated Board & Plaster",
      "Stylish frame palette: White, Barley, White Birch, Matte Black, Bright & Matte Silver",
      "Trouble-free sliding track assembly engineered for long-term daily use",
    ],
    specs: {
      glass: "Safety Mirror, Back-Painted Glass, Laminated Board or Plaster",
      frameFinishes: "White, Barley, White Birch, Matte Black, Bright & Matte Silver",
      doorAction: "Smooth Bottom-Rolling Track System",
      dimensions: "Custom Sized to Fit Inbuilt Robe Cavities",
      coating: "N/A (Durable Anodised / Powder-Coated Aluminium)",
    },
  },
  {
    id: "optima-series",
    name: "Optima Semi-Frameless Series",
    tagline: "Watertight Magnetic Seals & Robust Family-Proof Construction",
    category: "Semi-Frameless",
    imageLabel: "Optima Series Screen Image Placeholder",
    highlights: ["6mm Toughened Front", "6.38mm Laminated Sides", "Magnetic Door Closure", "Splash Deflector"],
    summary:
      "Built for active family bathrooms with full-length magnetic door closures and translucent splash deflectors to prevent water leakage.",
    description: [
      "Optima Shower Screens bring together heavy-duty glass construction, watertight sealing technology, and classic semi-frameless style. Designed to withstand daily family use, Optima provides a secure barrier that keeps water inside the shower enclosure.",
      "Featuring 6mm clear toughened front glass paired with 6.38mm clear laminated safety glass side panels, Optima combines optical transparency with maximum impact resistance. The magnetic door latch and bottom translucent spray flap guarantee a watertight seal.",
      "Available in standard 1850mm and 1950mm heights in White, Matte Black, or Silver frames, Optima offers exceptional durability and easy maintenance.",
    ],
    features: [
      "6mm clear toughened front safety glass + 6.38mm laminated safety glass sides",
      "Continuous magnetic door closure for a secure, watertight seal",
      "Translucent spray flap with splash deflector on pivoting door",
      "Semi-frameless layout for unobstructed forward visibility",
      "Standard height options: 1850mm and 1950mm with wide width options (740mm–1820mm)",
      "Optional Nano4-Glass ceramic coating to shield glass against limescale",
    ],
    specs: {
      glass: "6mm Clear Toughened Front + 6.38mm Clear Laminated Side Panels",
      frameFinishes: "White, Matte Black & Silver Powder-Coated Aluminium",
      doorAction: "Pivoting Door with Magnetic Latch & Splash Deflector",
      dimensions: "1850mm or 1950mm Heights (740mm to 1820mm Widths)",
      coating: "Optional Nano4-Glass Ceramic Protection",
    },
  },
  {
    id: "momentum-series",
    name: "Momentum Sliding Series",
    tagline: "Ultra-Slim Frame Profile & Overlapping Watertight Sliding Doors",
    category: "Sliding",
    imageLabel: "Momentum Series Screen Image Placeholder",
    highlights: ["Ultra-Slim Frame", "Overlapping Glass", "6mm Toughened Glass", "Standard 2000mm Height"],
    summary:
      "Minimalist sliding screen with an ultra-narrow frame profile and overlapping magnetic glass doors for an uncluttered look.",
    description: [
      "The Momentum Series delivers the refined look of a frameless screen alongside the effortless sliding functionality of a framed enclosure. Its ultra-slim frame profile adds modern sophistication to any bathroom space.",
      "Featuring 6mm toughened safety glass and magnetic door seals with overlapping glass alignment, Momentum creates a tight seal against water spillage. The smooth glass surfaces resist soap scum and water spots for easy cleaning.",
      "Choose a standard 2000mm height or request a custom height fit. Available in Chrome, Matte Black, White, and Gold frame accents.",
    ],
    features: [
      "Ultra-slim frame design for an uncluttered, modern bathroom aesthetic",
      "Overlapping glass panels with magnetic closure for watertight protection",
      "6mm toughened safety glass construction for durability and safety",
      "Standard 2000mm height or tailored custom heights",
      "Frame finishes: Chrome, White, Matte Black, and Gold",
      "Optional Nano4-Glass ceramic protective coating for low maintenance",
    ],
    specs: {
      glass: "6mm Clear Toughened Safety Glass",
      frameFinishes: "Chrome, White, Matte Black & Gold Slim Aluminium",
      doorAction: "Sliding Door with Overlapping Magnetic Seals",
      dimensions: "Standard 2000mm Height or Custom Made Heights",
      coating: "Optional Nano4-Glass Ceramic Shield Available",
    },
  },
];

/* ────── FAQ Data ────── */
const FAQS = [
  {
    q: "How does the custom shower screen process work?",
    a: "We begin with a free initial consultation and quote. Once approved, our experienced technician visits your home to conduct precise laser measurements. Your screen is then custom-fabricated and installed on-site by our skilled professionals for a perfect fit.",
  },
  {
    q: "What is the difference between frameless, semi-frameless, and sliding screens?",
    a: "Frameless screens use thick 10mm toughened glass secured with minimal metal brackets for a sleek, luxury look. Semi-frameless screens (like Neptune & Optima) feature a perimeter frame for strength while keeping glass edges clean. Sliding screens (like Momentum & Frameless Sliders) glide along top/bottom tracks, ideal for saving space in compact bathrooms.",
  },
  {
    q: "Can I request frosted or obscured glass for privacy?",
    a: "Yes! Most of our models (including Bespoke Frameless, Neptune, and SwiftCloset) offer frosted, low-iron, or obscured cathedral glass options to provide your desired level of privacy and light diffusion.",
  },
  {
    q: "What is the optional Nano4-Glass ceramic coating?",
    a: "Nano4-Glass is an advanced ultra-thin ceramic hydrophobic coating applied to the glass surface. It repels water, soap scum, grime, and mineral buildup, making your screen drastically easier to clean while protecting it against permanent glass staining.",
  },
  {
    q: "Are all your shower screens compliant with Australian Standards?",
    a: "Absolutely. All glass supplied by Groutix is manufactured in accordance with AS/NZS 2208 safety glass standards, ensuring maximum strength, durability, and safety for your home.",
  },
];

export default function ShowerScreensClient() {
  const { phone, tel } = useContact();
  const [selectedModel, setSelectedModel] = useState<ShowerScreenModel | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const categories = ["All", "Frameless", "Semi-Frameless", "Sliding", "Wardrobes"];

  const filteredModels =
    filterCategory === "All" ? MODELS : MODELS.filter((m) => m.category === filterCategory);

  return (
    <main className="pt-[73px] bg-neutral-50 text-neutral-900 min-h-screen">
      {/* ────── Hero Section ────── */}
      <section className="relative bg-primary text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,214,79,0.15),_transparent_50%)] pointer-events-none" />
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-accent tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Premium Glass & Installation
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              Custom Shower Screens <span className="text-accent">&amp; Enclosures</span>
            </h1>
            <p className="text-white/85 text-lg sm:text-xl leading-relaxed max-w-2xl font-normal">
              Bespoke frameless, semi-frameless, and sliding shower screens custom-measured and installed across Victoria. Built with Australian toughened safety glass for lasting elegance and effortless maintenance.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#models"
                className="bg-accent hover:bg-accent/90 text-primary font-black px-8 py-3.5 rounded shadow-md transition-all duration-200 text-base tracking-wide active:scale-95 border-2 border-accent"
              >
                Explore Screen Models
              </a>
              <a
                href={tel}
                className="flex items-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-7 py-3.5 rounded transition-all duration-200 text-base tracking-wide active:scale-95"
              >
                <Phone className="h-4 w-4" />
                Call {phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ImgBox label="Hero Shower Screen Showcase Image" aspect="aspect-[4/3]" />
          </div>
        </div>
      </section>

      {/* ────── Key Value Pillars ────── */}
      <section className="py-12 bg-white border-b border-neutral-200">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Ruler className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Custom On-Site Laser Fits</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Every screen is custom-measured on-site by our Melbourne specialists for a guaranteed, flawless alignment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">AS/NZS Toughened Glass</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Crafted from 10mm or 6mm certified Australian toughened safety glass for ultimate strength and peace of mind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Optional Nano4-Glass Protection</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Optional ceramic coating repels water spots, soap scum, and hard water stains for effortless cleaning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────── 6-Model Product Catalog Grid ────── */}
      <AnimatedSection className="py-16 lg:py-24" id="models">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight">
                Our Shower Screen <span className="text-accent">Range</span>
              </h2>
              <p className="text-neutral-600 text-base mt-2 max-w-2xl">
                Explore our six distinct screen systems and wardrobe doors. Click any model to view full specifications, frame finishes, and design options.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 bg-neutral-200/60 p-1.5 rounded-lg">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                    filterCategory === cat
                      ? "bg-primary text-white shadow-sm"
                      : "text-neutral-700 hover:bg-white/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col group hover:shadow-xl hover:border-primary transition-all duration-300"
              >
                {/* Image Placeholder */}
                <div className="relative">
                  <ImgBox label={model.imageLabel} aspect="aspect-[4/3]" />
                  <span className="absolute top-3 left-3 bg-primary text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded shadow">
                    {model.category}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-neutral-900 group-hover:text-primary transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {model.tagline}
                    </p>
                    <p className="text-sm text-neutral-600 leading-relaxed pt-1">{model.summary}</p>
                  </div>

                  {/* Highlight badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {model.highlights.map((h, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-100 text-neutral-700 text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200"
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedModel(model)}
                    className="w-full mt-4 bg-neutral-900 hover:bg-primary text-white font-bold py-3 px-4 rounded text-sm tracking-wide transition-colors flex items-center justify-center gap-2 group-hover:shadow"
                  >
                    <span>View Specifications &amp; Details</span>
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ────── Interactive Modal Drawer for Model Details ────── */}
      <AnimatePresence>
        {selectedModel ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedModel(null)}
              className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-y-auto z-10 flex flex-col"
            >
              {/* Modal Sticky Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-20">
                <div>
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    {selectedModel.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900">{selectedModel.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* Image Placeholder */}
                <ImgBox label={`${selectedModel.name} - Detailed View`} aspect="aspect-[16/9]" />

                {/* Description Paragraphs */}
                <div className="space-y-4 text-neutral-700 text-sm sm:text-base leading-relaxed">
                  <h3 className="text-lg font-bold text-neutral-900">Overview &amp; Design Philosophy</h3>
                  {selectedModel.description.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Feature List */}
                <div className="space-y-3 bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent" /> Key Features &amp; Options
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {selectedModel.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specifications Grid */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" /> Technical Specifications
                  </h3>
                  <div className="overflow-hidden border border-neutral-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-neutral-200">
                        <tr className="bg-neutral-50">
                          <td className="px-4 py-3 font-semibold text-neutral-600 w-1/3">Glass Type</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">{selectedModel.specs.glass}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-neutral-600">Hardware &amp; Frame Finishes</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">
                            {selectedModel.specs.frameFinishes}
                          </td>
                        </tr>
                        <tr className="bg-neutral-50">
                          <td className="px-4 py-3 font-semibold text-neutral-600">Door Operation</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">
                            {selectedModel.specs.doorAction}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-neutral-600">Dimensions &amp; Fit</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">{selectedModel.specs.dimensions}</td>
                        </tr>
                        <tr className="bg-neutral-50">
                          <td className="px-4 py-3 font-semibold text-neutral-600">Protective Coating</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">{selectedModel.specs.coating}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer CTA */}
              <div className="sticky bottom-0 bg-neutral-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800">
                <div>
                  <p className="text-xs text-neutral-400">Ready to transform your bathroom?</p>
                  <p className="font-bold text-sm text-white">Get a custom quote for {selectedModel.name}</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Link
                    href={`/contact?enquiry=${encodeURIComponent(selectedModel.name)}`}
                    className="flex-1 sm:flex-initial bg-accent hover:bg-accent/90 text-primary font-black px-6 py-2.5 rounded text-sm text-center transition-colors"
                  >
                    Request Free Quote
                  </Link>
                  <button
                    onClick={() => setSelectedModel(null)}
                    className="px-4 py-2.5 border border-neutral-700 text-neutral-300 hover:text-white rounded text-sm font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* ────── Side-by-Side Model Comparison Table ────── */}
      <AnimatedSection className="py-16 bg-white border-t border-b border-neutral-200">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-neutral-900">
              Model <span className="text-accent">Comparison Matrix</span>
            </h2>
            <p className="text-neutral-600 text-base">
              Compare key specifications across our screen models to choose the perfect system for your bathroom project.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Model Series</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Glass Thickness</th>
                  <th className="p-4 font-bold">Door Operation</th>
                  <th className="p-4 font-bold">Nano4 Coating</th>
                  <th className="p-4 font-bold">Best Suited For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {MODELS.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                    <td className="p-4 font-bold text-neutral-900">{m.name}</td>
                    <td className="p-4 font-medium text-neutral-600">{m.category}</td>
                    <td className="p-4 text-neutral-700">{m.specs.glass.split(" ")[0]}</td>
                    <td className="p-4 text-neutral-700">{m.specs.doorAction.split(" ")[0]}</td>
                    <td className="p-4 text-emerald-600 font-semibold">Optional</td>
                    <td className="p-4 text-neutral-600 text-xs">{m.summary.slice(0, 70)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedSection>

      {/* ────── FAQs Section ────── */}
      <AnimatedSection className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-accent font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="h-4 w-4" /> Got Questions?
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900">
              Shower Screen <span className="text-accent">FAQs</span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left font-bold text-base text-neutral-900 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronDown className="h-5 w-5 text-accent shrink-0" /> : <ChevronRight className="h-5 w-5 text-neutral-400 shrink-0" />}
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ────── CTA Banner ────── */}
      <CtaBanner />
    </main>
  );
}
