import type { Metadata } from "next";
// Old layout kept in components/HomePage.tsx; swap the import back to roll back.
import HomePageV2 from "@/components/HomePageV2";
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
  return <HomePageV2 reviews={reviews} rating={rating} />;
}
