// Editable site content model (client-safe).
//
// This module holds the TYPES, the DEFAULTS (derived from the existing
// hardcoded values), and a merge helper. The actual persistence/loading lives
// in lib/siteContentServer.ts so this file can be imported from client
// components (provider, admin editor) without pulling in the Mongo driver.

import { BUSINESS } from "@/lib/seo";
import { faqCategories as DEFAULT_FAQS, type FaqCategory } from "@/lib/faqData";
import { SHOWER_SCREEN_MODELS, type ShowerScreenModel } from "@/lib/showerScreensData";

export type { Faq, FaqCategory } from "@/lib/faqData";
export type { ShowerScreenModel } from "@/lib/showerScreensData";

export interface BusinessContent {
  phone: string; // display form, e.g. "7023 8094"
  email: string;
  hours: string; // e.g. "Mon – Fri: 8:00am – 5:00pm"
  address: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
  };
  areasServed: string[];
  social: { facebook: string; instagram: string; google: string };
  rating: { value: number; count: number };
}

export interface HeroContent {
  headline: string;
  subheadline: string;
}

export interface CtaContent {
  heading: string;
  subtext: string;
  buttonLabel: string;
}

export interface WhyUsContent {
  headline: string;
  subheadline: string;
  points: string[];
}

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutValue {
  title: string;
  desc: string;
}

export interface AboutContent {
  headline: string;
  subheadline: string;
  storyTitle: string;
  storyParagraphs: string[];
  stats: AboutStat[];
  values: AboutValue[];
  features: string[];
}

export interface TestimonialItem {
  name: string;
  location: string;
  rating: number;
  title: string;
  content: string;
  date: string;
}

export interface SiteContent {
  business: BusinessContent;
  hero: HeroContent;
  cta: CtaContent;
  whyUs: WhyUsContent;
  about: AboutContent;
  testimonials: TestimonialItem[];
  showerScreens: ShowerScreenModel[];
  faqCategories: FaqCategory[];
}

// Deep-partial for the stored overrides (any subset can be saved).
export type SiteContentOverrides = {
  business?: Partial<BusinessContent> & {
    address?: Partial<BusinessContent["address"]>;
    social?: Partial<BusinessContent["social"]>;
    rating?: Partial<BusinessContent["rating"]>;
  };
  hero?: Partial<HeroContent>;
  cta?: Partial<CtaContent>;
  whyUs?: Partial<WhyUsContent>;
  about?: Partial<AboutContent>;
  testimonials?: TestimonialItem[];
  showerScreens?: ShowerScreenModel[];
  faqCategories?: FaqCategory[];
};

export const DEFAULT_CONTENT: SiteContent = {
  business: {
    phone: BUSINESS.phone,
    email: BUSINESS.email,
    hours: "Mon – Fri: 8:00am – 5:00pm",
    address: {
      street: BUSINESS.address.street,
      locality: BUSINESS.address.locality,
      region: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
    },
    areasServed: [...BUSINESS.areasServed],
    social: {
      google: "https://maps.google.com/?cid=11736395911597271820",
      facebook: "https://www.facebook.com/profile.php?id=61582570358855",
      instagram: "https://www.instagram.com/groutix.au/",
    },
    rating: { value: BUSINESS.rating.value, count: BUSINESS.rating.count },
  },
  hero: {
    headline:
      "Victoria's Highest Rated & Most Trusted Shower Regrouting & Leak Repair Specialists",
    subheadline:
      "Replacing deteriorated grout and failed silicone to repair leaking showers and balconies with long-lasting, 10-year warranty-backed solutions—without the need for a full renovation.",
  },
  cta: {
    heading: "Ready to fix your grout the right way?",
    subtext: "Free quotes, clear advice, and expert shower repair service.",
    buttonLabel: "Get a Free Quote",
  },
  whyUs: {
    headline: "Why Pick Groutix?",
    subheadline:
      "Here's why homeowners and property managers all over Australia trust Groutix for their shower regrouting and repair needs.",
    points: [
      "Specialist materials selected for long-term durability",
      "Experienced shower regrouting technicians",
      "10-year waterproof warranty on eligible full shower regrouting",
      "Fast turnaround with minimal disruption",
      "Honest recommendations based on your shower's condition",
      "Clear, upfront pricing with no hidden surprises",
    ],
  },
  about: {
    headline: "Victoria's shower regrouting experts",
    subheadline:
      "We help homeowners fix leaky showers, broken grout, and worn wet areas with expert repairs backed by a 10-year waterproof warranty.",
    storyTitle: "A Team Focused on Grout & Shower Fixes",
    storyParagraphs: [
      "Groutix started with a simple idea: many leaky showers and failing tiled wet areas can be fixed properly without tearing out the whole bathroom. When grout lines, corners, and seals wear out, an expert repair is often a better choice than a full renovation.",
      "Today we help homeowners across Victoria restore grout lines, stop moisture from getting in, and protect tiled surfaces with a fix-first approach made for long-lasting results.",
    ],
    stats: [
      { value: "10-Year", label: "Waterproof Warranty" },
      { value: "Licensed", label: "& Fully Insured" },
      { value: "8000+", label: "Showers Fixed" },
      { value: "100%", label: "No-Leak Promise" },
    ],
    values: [
      { title: "Honest Advice", desc: "We suggest the repair your wet area actually needs, with clear guidance and no overblown plans." },
      { title: "Expert Work", desc: "Our team focuses on grout fixes, shower regrouting, and wet-area sealing done to a high standard." },
      { title: "Care For Your Space", desc: "We work neatly, protect nearby areas, and leave the place tidy when we're done." },
      { title: "Dependable Service", desc: "We show up ready, communicate clearly, and keep your repair on track without unnecessary waits." },
    ],
    features: [
      "Experts in shower regrouting and grout fixes",
      "Wet-area repairs that keep tiles in place",
      "Written 10-year waterproof warranty",
      "Professional work with clear communication",
    ],
  },
  testimonials: [
    {
      name: "Sarah Jenkins",
      location: "Perth, WA",
      rating: 5,
      title: "Super professional & quick!",
      content:
        "Groutix tech showed up right on time. Our ensuite shower was leaking into the hallway wall. He replaced the old grout in less than 3 hours, and the shower looks brand new. Highly recommend!",
      date: "2 weeks ago",
    },
    {
      name: "David Chen",
      location: "Melbourne, VIC",
      rating: 5,
      title: "Saved us thousands on tiling",
      content:
        "We were told we had to completely retile our bathroom because of a slow leak. Groutix checked it out and said a simple regrout and silicone reseal would fix it. It did, and saved us over $4,000!",
      date: "1 month ago",
    },
    {
      name: "Rebecca Taylor",
      location: "Sydney, NSW",
      rating: 5,
      title: "Mould is totally gone",
      content:
        "Our shower base grout was black with mould that wouldn't come off. The tech stripped it all and laid fresh white grout. It looks completely spotless. Very neat, clean worker.",
      date: "3 weeks ago",
    },
  ],
  showerScreens: SHOWER_SCREEN_MODELS,
  faqCategories: DEFAULT_FAQS,
};

/** Merge stored overrides on top of the defaults. Arrays replace wholesale. */
export function mergeContent(overrides: SiteContentOverrides | null | undefined): SiteContent {
  if (!overrides) return DEFAULT_CONTENT;
  const b = overrides.business ?? {};
  return {
    business: {
      phone: b.phone ?? DEFAULT_CONTENT.business.phone,
      email: b.email ?? DEFAULT_CONTENT.business.email,
      hours: b.hours ?? DEFAULT_CONTENT.business.hours,
      address: { ...DEFAULT_CONTENT.business.address, ...(b.address ?? {}) },
      areasServed:
        b.areasServed && b.areasServed.length
          ? b.areasServed
          : DEFAULT_CONTENT.business.areasServed,
      social: { ...DEFAULT_CONTENT.business.social, ...(b.social ?? {}) },
      rating: { ...DEFAULT_CONTENT.business.rating, ...(b.rating ?? {}) },
    },
    hero: { ...DEFAULT_CONTENT.hero, ...(overrides.hero ?? {}) },
    cta: { ...DEFAULT_CONTENT.cta, ...(overrides.cta ?? {}) },
    whyUs: {
      headline: overrides.whyUs?.headline ?? DEFAULT_CONTENT.whyUs.headline,
      subheadline: overrides.whyUs?.subheadline ?? DEFAULT_CONTENT.whyUs.subheadline,
      points:
        overrides.whyUs?.points && overrides.whyUs.points.length
          ? overrides.whyUs.points
          : DEFAULT_CONTENT.whyUs.points,
    },
    about: {
      headline: overrides.about?.headline ?? DEFAULT_CONTENT.about.headline,
      subheadline: overrides.about?.subheadline ?? DEFAULT_CONTENT.about.subheadline,
      storyTitle: overrides.about?.storyTitle ?? DEFAULT_CONTENT.about.storyTitle,
      storyParagraphs:
        overrides.about?.storyParagraphs && overrides.about.storyParagraphs.length
          ? overrides.about.storyParagraphs
          : DEFAULT_CONTENT.about.storyParagraphs,
      stats:
        overrides.about?.stats && overrides.about.stats.length
          ? overrides.about.stats
          : DEFAULT_CONTENT.about.stats,
      values:
        overrides.about?.values && overrides.about.values.length
          ? overrides.about.values
          : DEFAULT_CONTENT.about.values,
      features:
        overrides.about?.features && overrides.about.features.length
          ? overrides.about.features
          : DEFAULT_CONTENT.about.features,
    },
    testimonials:
      overrides.testimonials && overrides.testimonials.length
        ? overrides.testimonials
        : DEFAULT_CONTENT.testimonials,
    showerScreens:
      overrides.showerScreens && overrides.showerScreens.length
        ? overrides.showerScreens
        : DEFAULT_CONTENT.showerScreens,
    faqCategories:
      overrides.faqCategories && overrides.faqCategories.length
        ? overrides.faqCategories
        : DEFAULT_CONTENT.faqCategories,
  };
}

/** Convert a display phone number into a tel: href. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Convert an email into a mailto: href. */
export function mailHref(email: string): string {
  return `mailto:${email}`;
}

