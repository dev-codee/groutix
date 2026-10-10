"use client";

import BalconyDeepDiveSection from "@/components/BalconyDeepDiveSection";
import type { BusinessRating } from "@/lib/reviews";

export default function BalconyRegroutingClient({ rating }: { rating: BusinessRating }) {
  return <BalconyDeepDiveSection rating={rating} />;
}
