import type { Metadata } from "next";
import { getReviews, getBusinessRating } from "@/lib/reviews";
import GalleryPage from "@/components/GalleryPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Regrouting Gallery, Real Melbourne Job Photos",
    description:
      "See real Groutix results from Melbourne homes: finished showers, bathrooms and shower bases after regrouting and resealing, every photo from an actual job.",
    alternates: { canonical: "/gallery" },
    openGraph: {
      title: "Regrouting Gallery, Real Melbourne Job Photos",
      description:
        "See real Groutix results from Melbourne homes: finished showers, bathrooms and shower bases after regrouting and resealing, every photo from an actual job.",
      url: "/gallery",
      type: "website",
      images: ["/white-wall-beige-envelope-shower-regrouting-after.webp"],
    },
    robots: "index, follow",
  };
}

export default async function GalleryRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <GalleryPage reviews={reviews} rating={rating} />;
}
