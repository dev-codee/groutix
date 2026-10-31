import type { Metadata } from "next";
import GeelongHubPage from "@/components/GeelongHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Regrouting Geelong | Shower, Tile & Balcony | Groutix",
  description:
    "Shower, bathroom and balcony regrouting in Geelong, Belmont, Highton and Torquay. No tile removal, 10-year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/geelong" },
  openGraph: {
    title: "Regrouting in Geelong | Groutix",
    description:
      "Shower, bathroom and balcony regrouting in Geelong, Belmont, Highton and Torquay. No tile removal, 10-year waterproof warranty. Free quote.",
    url: "/locations/geelong",
    type: "website",
  },
};

export default async function GeelongRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <GeelongHubPage reviews={reviews} rating={rating} />;
}
