// Editable site content model (client-safe).
//
// This module holds the TYPES, the DEFAULTS (derived from the existing
// hardcoded values), and a merge helper. The actual persistence/loading lives
// in lib/siteContentServer.ts so this file can be imported from client
// components (provider, admin editor) without pulling in the Mongo driver.

import { BUSINESS } from "@/lib/seo";
import { faqCategories as DEFAULT_FAQS, type FaqCategory } from "@/lib/faqData";

export type { Faq, FaqCategory } from "@/lib/faqData";

export interface BusinessContent {
  phone: string; // display form, e.g. "7023 8094"
  email: string;
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

export interface SiteContent {
  business: BusinessContent;
  hero: HeroContent;
  cta: CtaContent;
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
  faqCategories?: FaqCategory[];
};

export const DEFAULT_CONTENT: SiteContent = {
  business: {
    phone: BUSINESS.phone,
    email: BUSINESS.email,
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
