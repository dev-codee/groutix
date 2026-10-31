import type { Metadata } from "next";
import CaseyHubPage from "@/components/CaseyHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Regrouting Casey | Shower, Tile & Balcony | Groutix",
  description:
    "Shower, bathroom and balcony regrouting across Casey — Berwick, Cranbourne, Narre Warren and Pakenham. No tile removal, 10-year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/casey" },
  openGraph: {
    title: "Regrouting in Casey | Groutix",
    description:
      "Shower, bathroom and balcony regrouting across Casey — Berwick, Cranbourne, Narre Warren and Pakenham. No tile removal, 10-year waterproof warranty. Free quote.",
    url: "/locations/casey",
    type: "website",
  },
};

export default async function CaseyRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <CaseyHubPage reviews={reviews} rating={rating} />;
}
