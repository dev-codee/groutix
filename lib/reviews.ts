// Server-side helper that pulls reviews from the Google Business Profile via the
// Google Places API (New). If the API isn't configured (or the request fails),
// it transparently falls back to the curated reviews below so the site never
// renders an empty testimonials section.
//
// Required env vars (set in .env.local — see .env.example):
//   GOOGLE_PLACES_API_KEY  — a Google Cloud API key with "Places API (New)" enabled
//   GOOGLE_PLACE_ID        — the Place ID of the GROUTIX business profile
//
// This module must only be imported from server components / route handlers so
// the API key is never shipped to the browser.

export type Review = {
  name: string;
  suburb: string;
  stars: number;
  review: string;
};

// Shown when Google reviews aren't configured yet or the API call fails.
export const FALLBACK_REVIEWS: Review[] = [
  {
    name: "Jody Lansdowne",
    suburb: "Posted on Google",
    stars: 5,
    review:
      "Outstanding work! Very happy with the job and service. I would recommend these guys. Very tidy.",
  },
  {
    name: "Veronica",
    suburb: "Posted on Google",
    stars: 5,
    review:
      "I have had 2 showers re-grouted (floor and walls) and am really happy with the end result. The entire bathrooms look so good.",
  },
  {
    name: "Lars Madsen",
    suburb: "Posted on Google",
    stars: 5,
    review:
      "Carlos did a really good job of our ensuite. Come up as if newly tiled. Not bad for a 23 year old bathroom. Great work.",
  },
];

// Shape of the pieces of the Places API (New) response we use.
type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string };
  relativePublishTimeDescription?: string;
};
type PlacesResponse = { reviews?: PlacesReview[] };

// Only show reviews at or above this rating on the marketing site.
const MIN_RATING = 4;

/**
 * Fetch reviews from the configured Google Business Profile.
 *
 * @param limit  Max number of reviews to return (default 3, to match the grid).
 * @returns      Live Google reviews, or FALLBACK_REVIEWS if unavailable.
 *
 * Google's Places API returns at most 5 reviews and picks the "most relevant"
 * ones itself — this is a documented API limitation, not something we control.
 */
export async function getReviews(limit = 3): Promise<Review[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) return FALLBACK_REVIEWS.slice(0, limit);

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews",
        },
        // Cache the result and refresh once a day to stay well within quota.
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      console.error(`Google Places API error: ${res.status} ${await res.text()}`);
      return FALLBACK_REVIEWS.slice(0, limit);
    }

    const data = (await res.json()) as PlacesResponse;

    const reviews = (data.reviews ?? [])
      .map((r): Review | null => {
        const text = r.text?.text ?? r.originalText?.text ?? "";
        const name = r.authorAttribution?.displayName ?? "Google reviewer";
        const stars = Math.round(r.rating ?? 0);
        if (!text.trim() || stars < MIN_RATING) return null;
        return {
          name,
          suburb: r.relativePublishTimeDescription
            ? `Posted on Google · ${r.relativePublishTimeDescription}`
            : "Posted on Google",
          stars,
          review: text,
        };
      })
      .filter((r): r is Review => r !== null)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, limit);

    // If Google returned nothing usable, keep the curated reviews.
    return reviews.length > 0 ? reviews : FALLBACK_REVIEWS.slice(0, limit);
  } catch (err) {
    console.error("Failed to fetch Google reviews:", err);
    return FALLBACK_REVIEWS.slice(0, limit);
  }
}
