import type { Metadata } from "next";
import LilydaleHubPage from "@/components/LilydaleHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Regrouting Lilydale | Shower, Tile & Balcony | Groutix",
  description:
    "Shower, bathroom and balcony regrouting in Lilydale, Mooroolbark and Chirnside Park. No tile removal, 10-year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/lilydale" },
  openGraph: {
    title: "Regrouting in Lilydale | Groutix",
    description:
      "Shower, bathroom and balcony regrouting in Lilydale, Mooroolbark and Chirnside Park. No tile removal, 10-year waterproof warranty. Free quote.",
    url: "/locations/lilydale",
    type: "website",
  },
};

export default async function LilydaleRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <LilydaleHubPage reviews={reviews} rating={rating} />;
}
