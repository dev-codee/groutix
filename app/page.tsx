import HomePage from "@/components/HomePage";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export default async function Home() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);
  return <HomePage reviews={reviews} rating={rating} />;
}
