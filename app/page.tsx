import type { Metadata } from "next";
// Old layout kept in components/HomePage.tsx; swap the import back to roll back.
import HomePageV2 from "@/components/HomePageV2";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shower Regrouting Melbourne | Epoxy & Leaking Shower Repairs | Groutix",
    description: "The Groutix team restores leaking showers & balconies professionally in Melbourne with epoxy regrouting & resealing. No tiles removed. 10-year warranty. Book a free inspection today.",
  };
}

export default async function Home() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);
  return <HomePageV2 reviews={reviews} rating={rating} />;
}
