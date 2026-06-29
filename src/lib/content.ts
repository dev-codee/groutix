export type ServiceDetail = {
  intro: string;
  overview: string[];
  includes: string[];
  idealFor: string;
  signs: string[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "leaking-showers": {
    intro:
      "Stop water escaping where it shouldn't — usually without disturbing a single tile.",
    overview: [
      "A leaking shower rarely fixes itself. Left alone, trapped moisture works its way into walls, floors and the rooms next door, turning a minor repair into a major one.",
      "We start by finding the real source of the leak, then seal it properly using high-grade waterproofing products. In most cases your tiles stay exactly where they are, so the job is faster, cleaner and far cheaper than a rebuild.",
    ],
    includes: [
      "Full moisture inspection to locate the leak",
      "Grout and silicone renewal where needed",
      "Waterproof sealing of the shower base and joints",
      "Tidy work area with minimal disruption",
      "Backed by our 10-year waterproof warranty",
    ],
    idealFor: "Showers that leak into adjoining walls, floors or rooms below.",
    signs: [
      "Water pooling outside the shower screen",
      "Damp patches on nearby walls or floors",
      "Peeling paint or swollen skirting boards",
      "A musty smell that won't go away",
    ],
    steps: [
      { title: "Inspect", body: "We assess the shower and surrounding areas to confirm exactly where the water is escaping." },
      { title: "Reseal", body: "We renew grout and silicone and apply waterproof sealing to the joints and base." },
      { title: "Test & protect", body: "We check the repair holds and leave the area sealed and ready to use." },
    ],
    faqs: [
      { q: "Will you need to remove my tiles?", a: "Usually not. Most leaking showers can be sealed from the surface, keeping your existing tiles in place." },
      { q: "How soon can I use the shower again?", a: "In most cases the shower is ready to use within about 24 hours, depending on the products applied." },
      { q: "What if the leak returns?", a: "Our waterproofing repairs are covered by a 10-year written warranty, so you're protected." },
    ],
  },
  regrouting: {
    intro: "Worn, cracked grout replaced with a durable, watertight finish.",
    overview: [
      "Grout is the first line of defence against water — and the first thing to fail. Once it cracks or crumbles, moisture has a clear path behind your tiles.",
      "We remove the old, tired grout and replace it with a hard-wearing product that resists water, staining and mould, leaving your tiling looking sharp and sealed again.",
    ],
    includes: [
      "Removal of old and failing grout",
      "Deep clean of tile joints",
      "Premium, water-resistant regrout",
      "Optional colour matching or refresh",
      "Mould-resistant finish",
    ],
    idealFor: "Tiled showers and floors with cracked, missing or discoloured grout.",
    signs: [
      "Cracked, crumbling or missing grout lines",
      "Dark staining or mould along the joints",
      "Grout that feels soft or powdery",
      "Water seeping between the tiles",
    ],
    steps: [
      { title: "Remove", body: "We carefully rake out the old, failing grout without damaging your tiles." },
      { title: "Clean", body: "The joints are cleaned and prepped so the new grout bonds strongly." },
      { title: "Regrout", body: "We apply a premium, water-resistant grout and finish it neatly." },
    ],
    faqs: [
      { q: "Can you match my existing grout colour?", a: "Yes — we can colour-match the existing grout or refresh the look with a new shade if you prefer." },
      { q: "Is regrouting enough to stop a leak?", a: "Often yes, but if the waterproofing beneath the tiles has failed we'll let you know what's required." },
      { q: "How long does regrouting take?", a: "Most regrouting jobs are completed within a single day." },
    ],
  },
  retiling: {
    intro: "A clean, even retile when tiles are past saving.",
    overview: [
      "Sometimes a repair isn't enough — tiles are cracked, drummy or simply beyond their best. When that's the case, a fresh retile gives you a watertight, great-looking result.",
      "We handle the lot: careful removal, proper waterproofing underneath, and a precise new tile finish that's built to last.",
    ],
    includes: [
      "Removal of damaged or failed tiles",
      "Re-waterproofing of the substrate",
      "Accurate tiling and grouting",
      "Clean, level, professional finish",
      "Help selecting suitable tiles",
    ],
    idealFor: "Showers and wet areas where tiles are cracked, loose or failing.",
    signs: [
      "Cracked, chipped or lifting tiles",
      "Tiles that sound hollow when tapped",
      "Leaks that keep returning after repairs",
      "Dated or water-damaged tiling",
    ],
    steps: [
      { title: "Strip", body: "We remove the old tiles and check the condition of the surface underneath." },
      { title: "Waterproof", body: "We apply a compliant waterproof membrane before any tiling begins." },
      { title: "Tile & finish", body: "We lay the new tiles, grout and finish for a clean, watertight result." },
    ],
    faqs: [
      { q: "Do you supply the tiles?", a: "We can help you choose suitable tiles, or work with tiles you've already purchased." },
      { q: "Is waterproofing included?", a: "Yes — proper waterproofing of the substrate is a core part of every retile we do." },
      { q: "How long will a retile take?", a: "It depends on the size of the area; we'll give you a clear timeframe before we start." },
    ],
  },
  "bathroom-renovations": {
    intro: "Full bathroom makeovers, managed from start to finish.",
    overview: [
      "Whether you're updating a dated bathroom or starting fresh, we manage the whole project so you don't have to juggle trades.",
      "From waterproofing and tiling through to fixtures and finishing touches, we keep things on schedule and built to a standard that lasts.",
    ],
    includes: [
      "Design guidance and planning",
      "Compliant waterproofing",
      "Tiling, fixtures and fit-off",
      "Coordinated, reliable trades",
      "A finish made to last",
    ],
    idealFor: "Homeowners wanting a complete, hassle-free bathroom upgrade.",
    signs: [
      "A dated or worn-out bathroom",
      "Recurring leaks or water damage",
      "An awkward layout or failing fixtures",
      "Planning to update before selling",
    ],
    steps: [
      { title: "Plan", body: "We help you plan the layout, finishes and scope to suit your budget." },
      { title: "Build", body: "We manage waterproofing, tiling and trades from start to finish." },
      { title: "Finish", body: "We complete the fit-off and hand back a bathroom built to last." },
    ],
    faqs: [
      { q: "Do you manage all the trades?", a: "Yes, we coordinate the trades involved so you have a single point of contact throughout." },
      { q: "Can you work to my budget?", a: "We'll tailor the scope and finishes to suit your budget and priorities." },
      { q: "How long does a renovation take?", a: "Timeframes vary with scope; we'll provide a clear schedule before work begins." },
    ],
  },
  "leak-detection": {
    intro: "Pinpoint the leak before you pay to fix it.",
    overview: [
      "Guesswork is expensive. Our detection process maps moisture accurately so we know exactly where the water is coming from — and where it isn't.",
      "That means a targeted repair instead of unnecessary demolition, saving you time, money and mess.",
    ],
    includes: [
      "Moisture mapping and inspection",
      "Identification of the leak's source",
      "Clear report on what needs doing",
      "Honest, no-pressure advice",
      "A repair plan that fits the problem",
    ],
    idealFor: "Unexplained damp, water stains or leaks with no obvious cause.",
    signs: [
      "Unexplained damp or water stains",
      "Rising water bills with no clear cause",
      "Mould that returns after cleaning",
      "Soft or discoloured walls and floors",
    ],
    steps: [
      { title: "Assess", body: "We inspect the affected areas and gather the clues about what's happening." },
      { title: "Map", body: "We use moisture mapping to pinpoint exactly where the water is coming from." },
      { title: "Report", body: "We explain what's happening and what the fix involves — clearly and honestly." },
    ],
    faqs: [
      { q: "Is detection worth it before repairs?", a: "Absolutely — it prevents unnecessary demolition by targeting the real source of the leak." },
      { q: "Will you fix the leak too?", a: "Yes — once we've located it, we can carry out the repair for you." },
      { q: "How accurate is the process?", a: "Our moisture mapping is highly accurate, so you only pay to fix what actually needs fixing." },
    ],
  },
  balconies: {
    intro: "Leaking balconies sealed and protected for good.",
    overview: [
      "A leaking balcony doesn't just damage the deck — water travels into ceilings, walls and the spaces below, often before you notice it.",
      "We reseal and waterproof balcony surfaces and junctions to stop water in its tracks and protect the rest of your home.",
    ],
    includes: [
      "Inspection of the balcony surface and joints",
      "Grout and silicone renewal",
      "High-performance waterproof sealing",
      "Protection for rooms below",
      "Long-term, warranty-backed result",
    ],
    idealFor: "Tiled balconies leaking into ceilings, walls or rooms underneath.",
    signs: [
      "Water stains on the ceiling below",
      "Damp or bubbling paint near the balcony",
      "Cracked grout or perished silicone outside",
      "Water that pools instead of draining",
    ],
    steps: [
      { title: "Inspect", body: "We examine the balcony surface, joints and drainage to find the problem." },
      { title: "Seal", body: "We renew grout and silicone and apply high-performance waterproofing." },
      { title: "Protect", body: "We make sure water is kept out and the rooms below stay dry." },
    ],
    faqs: [
      { q: "Do you need to remove balcony tiles?", a: "Often the balcony can be sealed from the surface without removing tiles." },
      { q: "Can a leaking balcony damage my home?", a: "Yes — left alone it can damage ceilings, walls and rooms below, so early action really pays off." },
      { q: "Is the work guaranteed?", a: "Yes — our waterproofing is backed by a 10-year written warranty." },
    ],
  },
};

export const serviceImage: Record<string, string> = {
  "leaking-showers": "/images/shower-clean.jpeg",
  regrouting: "/images/regrouting-1.jpeg",
  retiling: "/images/tiling-1.png",
  "bathroom-renovations": "/images/bathroom-finished.jpeg",
  "leak-detection": "/images/damage-rust.jpeg",
  balconies: "/images/tiles-slate.jpeg",
};

export const gallery = [
  { src: "/images/ba-bathroom.jpeg", label: "Full bathroom leak repair" },
  { src: "/images/ba-walls-beige.jpeg", label: "Shower wall regrout" },
  { src: "/images/ba-floor-green.jpeg", label: "Shower floor restoration" },
  { src: "/images/ba-shower-charcoal.jpeg", label: "Charcoal tile reseal" },
  { src: "/images/ba-floor-white.jpeg", label: "Tiled floor clean-up" },
  { src: "/images/shower-clean.jpeg", label: "Sealed and watertight" },
];

export const serviceAreas = [
  "Melbourne CBD",
  "Northern Suburbs",
  "Eastern Suburbs",
  "Southern Suburbs",
  "Western Suburbs",
  "Bayside",
  "Inner Suburbs",
  "Mornington Peninsula",
];

export const serviceBenefits = [
  {
    title: "Fixed at the source",
    body: "We treat the cause, not just the symptom, so the problem doesn't keep coming back.",
    icon: "Tools" as const,
  },
  {
    title: "Tiles usually stay",
    body: "Most repairs are completed without removing your existing tiles.",
    icon: "Grid" as const,
  },
  {
    title: "10-year warranty",
    body: "Every waterproofing repair is backed in writing for a full decade.",
    icon: "Shield" as const,
  },
  {
    title: "Fast & tidy",
    body: "Most jobs are done in a single visit, with minimal mess left behind.",
    icon: "Clock" as const,
  },
];

export const faqs = [
  {
    q: "Do you really fix leaks without removing the tiles?",
    a: "In the majority of cases, yes. Our approach targets the source of the leak and reseals it, which usually avoids the cost and mess of a full tile removal. If tiles do need replacing, we'll tell you upfront.",
  },
  {
    q: "How long does a typical repair take?",
    a: "Most leaking shower repairs are completed within a single visit. Larger jobs like retiling or renovations take longer, and we'll give you a clear timeframe before we start.",
  },
  {
    q: "Is the work guaranteed?",
    a: "Every waterproofing repair we carry out is backed by our written 10-year warranty, so you can have real peace of mind.",
  },
  {
    q: "When can I use the shower again?",
    a: "It depends on the products used and the job, but many repairs are ready to use within around 24 hours. We'll let you know the exact curing time on the day.",
  },
  {
    q: "How much will it cost?",
    a: "Pricing depends on the size and condition of the area. We provide a free, no-obligation assessment so you get a clear, honest quote before any work begins.",
  },
  {
    q: "Which areas do you service?",
    a: "We service Melbourne and the surrounding suburbs. If you're unsure whether we cover your area, just get in touch and we'll let you know.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. We're fully licensed and insured, and we take pride in leaving every job clean, tidy and done right.",
  },
  {
    q: "How do I book an assessment?",
    a: "Call us or fill in the quote form on any page. We'll get back to you quickly to arrange a convenient time.",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  suburb: string;
  initials: string;
  rating: number;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "From the first call to the finished job, the whole experience was easy. Our shower was fixed without pulling up any tiles.",
    name: "Sarah M.",
    suburb: "Brunswick",
    initials: "SM",
    rating: 5,
  },
  {
    quote:
      "On time, tidy and genuinely good at what they do. The shower looks and works better than it has in years.",
    name: "James T.",
    suburb: "Glen Iris",
    initials: "JT",
    rating: 5,
  },
  {
    quote:
      "Clear pricing, great communication and a quality result. I'd happily recommend them to anyone with a leak.",
    name: "Linda K.",
    suburb: "Footscray",
    initials: "LK",
    rating: 4,
  },
  {
    quote:
      "Our balcony had been leaking into the lounge for months. They found the cause quickly and sorted it properly.",
    name: "Mark R.",
    suburb: "Reservoir",
    initials: "MR",
    rating: 5,
  },
  {
    quote:
      "Honestly the easiest tradies we've dealt with. Explained everything, no surprises, great finish.",
    name: "Priya N.",
    suburb: "Doncaster",
    initials: "PN",
    rating: 5,
  },
  {
    quote:
      "Regrouted our main bathroom and it looks brand new. You'd never know it was the same shower.",
    name: "Daniel W.",
    suburb: "Werribee",
    initials: "DW",
    rating: 5,
  },
  {
    quote:
      "Quick to respond, fair quote and a tidy job. The leak is gone and the warranty gives us peace of mind.",
    name: "Aisha B.",
    suburb: "Preston",
    initials: "AB",
    rating: 5,
  },
  {
    quote:
      "They saved us from a full renovation we thought we needed. Smart, honest and skilled work.",
    name: "Tom H.",
    suburb: "Hawthorn",
    initials: "TH",
    rating: 5,
  },
];
