import type { Metadata } from "next";
import BallaratHubPage from "@/components/BallaratHubPage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Regrouting Ballarat | Shower, Tile & Balcony | Groutix",
  description:
    "Shower, bathroom and balcony regrouting in Ballarat, Wendouree and Sebastopol. No tile removal, 10-year waterproof warranty. Free quote.",
  alternates: { canonical: "/locations/ballarat" },
  openGraph: {
    title: "Regrouting in Ballarat | Groutix",
    description:
      "Shower, bathroom and balcony regrouting in Ballarat, Wendouree and Sebastopol. No tile removal, 10-year waterproof warranty. Free quote.",
    url: "/locations/ballarat",
    type: "website",
  },
};

export default async function BallaratRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <BallaratHubPage reviews={reviews} rating={rating} />;
}
