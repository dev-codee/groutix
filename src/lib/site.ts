export const site = {
  name: "Groutix",
  tagline: "Stay Sealed. Stay Smiling.",
  description:
    "Melbourne's trusted leaking shower specialists. Permanent repairs backed by a 10-year waterproof warranty.",
  url: "https://groutix.com",
  email: "info@groutix.com",
  website: "groutix.com",
  phone: "0370 238 094",
  phoneHref: "tel:0370238094",
  address: "82A Marigold Crescent, Gowanbrae VIC 3043, Melbourne",
  region: "Melbourne, VIC",
  warrantyYears: 10,
} as const;

export type NavItem = { label: string; href: string };

export const services = [
  {
    slug: "leaking-showers",
    title: "Leaking Shower Repairs",
    short: "Showers",
    blurb:
      "We trace the true source of the leak and seal it for good — usually without lifting a single tile.",
  },
  {
    slug: "shower-base-repairs",
    title: "Shower Base Repairs",
    short: "Shower Bases",
    blurb:
      "Cracked or leaking shower bases repaired and resealed so water drains away properly — not into your floor.",
  },
  {
    slug: "regrouting",
    title: "Regrouting",
    short: "Regrouting",
    blurb:
      "Tired, cracked grout removed and replaced with a hard-wearing waterproof finish that lasts.",
  },
  {
    slug: "retiling",
    title: "Retiling",
    short: "Retiling",
    blurb:
      "Full or partial retiling done cleanly when tiles are beyond repair, with a crisp, even finish.",
  },
  {
    slug: "bathroom-renovations",
    title: "Bathroom Renovations",
    short: "Bathroom Renovations",
    blurb:
      "Complete bathroom makeovers managed end to end, from waterproofing through to the final fixtures.",
  },
  {
    slug: "leak-detection",
    title: "Leak Detection",
    short: "Leak Detection",
    blurb:
      "Pinpoint moisture mapping that finds hidden leaks fast, so you only fix what actually needs fixing.",
  },
  {
    slug: "balconies",
    title: "Balcony Waterproofing",
    short: "Balconies",
    blurb:
      "Leaking balconies sealed and protected to stop water damage spreading through your home.",
  },
] as const;

export type Service = (typeof services)[number];

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Reviews", href: "/reviews" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const issueOptions = [
  "Leaking shower",
  "Cracked or missing grout",
  "Mould or black silicone",
  "Loose or hollow tiles",
  "Cracked or leaking shower base",
  "Waterproofing",
  "Balcony leak",
  "Bathroom renovation",
  "Something else",
];

export const stats = [
  { value: "10-Year", label: "Waterproof Warranty" },
  { value: "Licensed", label: "& Fully Insured" },
  { value: "500+", label: "Showers Repaired" },
  { value: "100%", label: "Leak-Free Guarantee" },
];
