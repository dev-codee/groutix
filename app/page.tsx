import type { Metadata } from "next";
// Old layout kept in components/HomePage.tsx; swap the import back to roll back.
import HomePageV2 from "@/components/HomePageV2";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shower Regrouting Melbourne | Epoxy Grout & Grout Repair | Groutix",
    description: "Leaking shower? We regrout and reseal showers, balconies and tiles across Melbourne with waterproof epoxy. 5.0 stars from 301 reviews, 10 year warranty. Free quote.",
  };
}

export default async function Home() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);
  return <HomePageV2 reviews={reviews} rating={rating} />;
}
