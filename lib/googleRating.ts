// Formatting helpers for the live Google rating (works on server and client).
// The rating itself is fetched once a day in lib/reviews.ts (getBusinessRating)
// and shared with every page through the root layout.

/** 297 → "297+" (same style the site has always used, e.g. "292+ Google reviews"). */
export function formatReviewCount(count: number): string {
  return `${Math.max(0, Math.floor(count)).toLocaleString("en-AU")}+`;
}

/** 5 → "5.0", 4.86 → "4.9" */
export function formatRating(value: number): string {
  return value.toFixed(1);
}
