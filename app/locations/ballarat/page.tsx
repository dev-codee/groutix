import type { Metadata } from "next";
import BallaratHubPage from "@/components/BallaratHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Ballarat | Leaking Shower Repairs",
  description:
    "Ballarat showers, floors and balconies regrouted and resealed, tiles kept in place. 5.0 stars from 296 reviews, 10 year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/ballarat" },
  openGraph: {
    title: "Shower Regrouting Ballarat | Leaking Shower Repairs | Groutix",
    description:
      "Ballarat showers, floors and balconies regrouted and resealed, tiles kept in place. 5.0 stars from 296 reviews, 10 year waterproof warranty. Free quote.",
    url: "/locations/ballarat",
    type: "website",
  },
};

export default async function BallaratRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <BallaratHubPage reviews={reviews} rating={rating} />;
}
