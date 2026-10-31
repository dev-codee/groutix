import type { Metadata } from "next";
import FrankstonHubPage from "@/components/FrankstonHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Regrouting Frankston | Shower, Tile & Balcony | Groutix",
  description:
    "Shower, bathroom and balcony regrouting in Frankston, Seaford and Langwarrin. No tile removal, 10-year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/frankston" },
  openGraph: {
    title: "Regrouting in Frankston | Groutix",
    description:
      "Shower, bathroom and balcony regrouting in Frankston, Seaford and Langwarrin. No tile removal, 10-year waterproof warranty. Free quote.",
    url: "/locations/frankston",
    type: "website",
  },
};

export default async function FrankstonRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <FrankstonHubPage reviews={reviews} rating={rating} />;
}
