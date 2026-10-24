import type { Metadata } from "next";
import { getReviews, getBusinessRating } from "@/lib/reviews";
import AboutPage from "@/components/AboutPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About Groutix | Melbourne Shower & Balcony Regrouting Specialists",
    description:
      "Meet Groutix, Melbourne's shower and balcony regrouting specialists. Waterproof epoxy regrouting with no tile removal, a 10-year warranty and 8,000+ bathrooms restored across Melbourne.",
    alternates: { canonical: "/about" },
    openGraph: {
      title: "About Groutix | Melbourne Shower & Balcony Regrouting Specialists",
      description:
        "Meet Groutix, Melbourne's shower and balcony regrouting specialists. Waterproof epoxy regrouting with no tile removal, a 10-year warranty and 8,000+ bathrooms restored across Melbourne.",
      url: "/about",
      type: "website",
      images: ["/shower-regrouting-tiled-interior.webp"],
    },
    robots: "index, follow",
  };
}

export default async function AboutRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <AboutPage reviews={reviews} rating={rating} />;
}
