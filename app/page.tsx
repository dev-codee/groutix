import HomePage from "@/components/HomePage";
import { getReviews } from "@/lib/reviews";

export default async function Home() {
  const reviews = await getReviews(5);
  return <HomePage reviews={reviews} />;
}
