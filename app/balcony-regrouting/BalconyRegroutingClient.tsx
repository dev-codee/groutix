"use client";

import BalconyDeepDiveSection from "@/components/BalconyDeepDiveSection";
import type { BusinessRating, Review } from "@/lib/reviews";

export default function BalconyRegroutingClient({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  return <BalconyDeepDiveSection rating={rating} reviews={reviews} />;
}
