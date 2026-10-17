"use client";

// Live Google rating for client components.
// Value + review count come from the root layout (refreshed daily from Google),
// so every badge, button and sentence that mentions reviews updates automatically
// when new Google reviews come in.

import { useSiteContent } from "@/components/SiteContentProvider";
import { BUSINESS } from "@/lib/seo";
import { formatRating, formatReviewCount } from "@/lib/googleRating";

export function useGoogleRating() {
  const { business } = useSiteContent();
  const value = business.rating?.value ?? BUSINESS.rating.value;
  const count = business.rating?.count ?? BUSINESS.rating.count;
  return {
    value,
    count,
    /** e.g. "5.0" */
    ratingLabel: formatRating(value),
    /** e.g. "297+" */
    countLabel: formatReviewCount(count),
    stars: Math.round(value),
  };
}
