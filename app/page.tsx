import { GOOGLE_REVIEW_COUNT_LABEL } from "@/lib/seo";
import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export async function generateMetadata(): Promise<Metadata> {
  const rating = await getBusinessRating();
  return {
    title: "Shower Regrouting & Balcony Regrouting Melbourne | Groutix",
    description: `Shower regrouting & balcony regrouting in Melbourne. Fix leaking showers without retiling. 10-year warranty, ${rating.value.toFixed(1)}-star rated, ${rating.count}+ reviews. Free quote today.`,
  };
}

export default async function Home() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);
  return <HomePage reviews={reviews} rating={rating} />;
}
