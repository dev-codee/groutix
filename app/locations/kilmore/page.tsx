import type { Metadata } from "next";
import KilmoreHubPage from "@/components/KilmoreHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Regrouting Kilmore | Shower, Tile & Balcony | Groutix",
  description:
    "Shower, bathroom and balcony regrouting in Kilmore, Wallan and Broadford. No tile removal, 10-year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/kilmore" },
  openGraph: {
    title: "Regrouting in Kilmore | Groutix",
    description:
      "Shower, bathroom and balcony regrouting in Kilmore, Wallan and Broadford. No tile removal, 10-year waterproof warranty. Free quote.",
    url: "/locations/kilmore",
    type: "website",
  },
};

export default async function KilmoreRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <KilmoreHubPage reviews={reviews} rating={rating} />;
}
