// Central SEO/site config, reused by metadata, sitemap, robots and JSON-LD.
//
// IMPORTANT: set NEXT_PUBLIC_SITE_URL in .env.local (and in production) to your
// real canonical domain. Everything below — canonical URLs, sitemap, Open Graph
// and structured data — derives from it.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.groutix.com.au"
).replace(/\/$/, "");

// Default social-share image (swap for a branded 1200×630 image when you have one).
export const OG_IMAGE = "/img11.jpeg";

export const BUSINESS = {
  name: "GROUTIX",
  legalName: "Groutix — Epoxy Regrouting, Shower & Balcony Leak Repairs",
  description:
    "Australia's shower regrouting and leak repair specialists. Fix leaking showers without removing tiles, backed by a 10-year waterproof warranty.",
  phone: "7023 8094",
  email: "info@groutix.com",
  address: {
    street: "82A Marigold Cres",
    locality: "Gowanbrae",
    region: "VIC",
    postalCode: "3043",
    country: "AU",
  },
  geo: { lat: -37.6988292, lng: 144.9004402 },
  areasServed: ["Perth", "Melbourne", "Sydney", "Brisbane", "Adelaide", "Geelong"],
  // Fallback rating used when live Google data is unavailable. Keep in sync with
  // the Google Business Profile (see getBusinessRating in lib/reviews.ts).
  rating: { value: 5, count: 236 },
  // Google Business Profile listing.
  sameAs: ["https://maps.google.com/?cid=11736395911597271820"],
} as const;

// Service detail routes handled by app/[slug]/page.tsx.
export const SERVICE_SLUGS = [
  "shower-regrouting",
  "leaking-shower-repair",
  "shower-base-repair",
  "tile-regrouting",
  "real-estate-property-services",
  "small-tiling-jobs",
] as const;

export const STATIC_ROUTES = ["/", "/about", "/services", "/locations", "/contact"] as const;

/** Absolute URL helper. */
export function abs(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** LocalBusiness structured data for the whole site. */
export function localBusinessJsonLd(
  rating: { value: number; count: number } = BUSINESS.rating
) {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: SITE_URL,
    image: abs(OG_IMAGE),
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    areaServed: BUSINESS.areasServed.map((name) => ({ "@type": "City", name })),
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
    sameAs: BUSINESS.sameAs,
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
