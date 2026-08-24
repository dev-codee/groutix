// Central SEO/site config, reused by metadata, sitemap, robots and JSON-LD.
//
// IMPORTANT: set NEXT_PUBLIC_SITE_URL in .env.local (and in production) to your
// real canonical domain. Everything below | canonical URLs, sitemap, Open Graph
// and structured data | derives from it.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.Groutix.com.au"
).replace(/\/$/, "");

// Default social-share image (swap for a branded 1200×630 image when you have one).
export const OG_IMAGE = "/img11.jpeg";

export const BUSINESS = {
  name: "Groutix",
  legalName: "Groutix | Epoxy Regrouting, Shower & Balcony Leak Repairs",
  description:
    "Groutix specialises in shower regrouting, epoxy grouting, silicone replacement and leaking shower repairs across Victoria. We help restore tiled wet areas without the need for unnecessary renovations.",
  phone: "7023 8094",
  email: "info@Groutix.com",
  address: {
    street: "82A Marigold Cres",
    locality: "Gowanbrae",
    region: "VIC",
    postalCode: "3043",
    country: "AU",
  },
  geo: { lat: -37.6988292, lng: 144.9004402 },
  areasServed: [
    "Melbourne",
    "Geelong",
    "Ballarat",
    "Frankston",
    "Lilydale",
    "Yarra Glen",
    "Kilmore",
  ],
  // Fallback rating used when live Google data is unavailable. Keep in sync with
  // the Google Business Profile (see getBusinessRating in lib/reviews.ts).
  rating: { value: 5, count: 236 },
  // Google Business Profile listing & official social profiles.
  sameAs: [
    "https://maps.google.com/?cid=11736395911597271820",
    "https://www.facebook.com/profile.php?id=61582570358855",
    "https://www.instagram.com/groutix.au/",
  ],
} as const;

// Service detail routes handled by app/[slug]/page.tsx.
export const SERVICE_SLUGS = [
  "shower-regrouting",
  "leaking-shower-repair",
  "shower-base-repair",
  "tile-regrouting",
  "balcony-leak-repairs",
  "silicone-recaulking",
  "epoxy-grout",
  "real-estate-property-services",
  "small-tiling-jobs",
  "shower-screens",
] as const;

export const STATIC_ROUTES = ["/", "/about", "/services", "/locations", "/faq", "/contact"] as const;

/** Absolute URL helper. */
export function abs(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * LocalBusiness structured data for the whole site. Pass `business` to reflect
 * admin-edited contact info; falls back to the defaults in BUSINESS.
 */
export function localBusinessJsonLd(
  rating: { value: number; count: number } = BUSINESS.rating,
  business?: {
    phone?: string;
    email?: string;
    address?: { street: string; locality: string; region: string; postalCode: string };
    areasServed?: string[];
    social?: { facebook?: string; instagram?: string; google?: string };
  }
) {
  const address = business?.address ?? BUSINESS.address;
  const areasServed = business?.areasServed ?? BUSINESS.areasServed;
  const sameAs = business?.social
    ? [business.social.google, business.social.facebook, business.social.instagram].filter(
        (v): v is string => Boolean(v)
      )
    : BUSINESS.sameAs;
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: SITE_URL,
    image: abs(OG_IMAGE),
    telephone: business?.phone ?? BUSINESS.phone,
    email: business?.email ?? BUSINESS.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    areaServed: areasServed.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating.value,
      reviewCount: rating.count,
    },
    sameAs,
  };
}

/** FAQPage structured data from a list of Q&As (used on service pages). */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
