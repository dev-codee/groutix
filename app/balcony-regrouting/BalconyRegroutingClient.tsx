"use client";

import React from "react";
import BalconyDeepDiveSection from "@/components/BalconyDeepDiveSection";
import type { BusinessRating } from "@/lib/reviews";

export default function BalconyRegroutingClient({ rating }: { rating: BusinessRating }) {
  return (
    <main className="pt-[110px] lg:pt-[125px]">
      {/* Main Balcony Wireframe Section */}
      <BalconyDeepDiveSection rating={rating} />

    </main>
  );
}
