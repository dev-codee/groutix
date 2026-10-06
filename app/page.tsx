import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting & Balcony Leak Repair Melbourne | Groutix",
  description:
    "Shower regrouting & balcony leak repair in Melbourne — fix leaking showers without costly retiling. 10-year warranty, 5.0-star rated, 290+ reviews. Free quote today.",
};

export default async function Home() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);
  return <HomePage reviews={reviews} rating={rating} />;
}
