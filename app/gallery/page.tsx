import type { Metadata } from "next";
import { getReviews, getBusinessRating } from "@/lib/reviews";
import GalleryPage from "@/components/GalleryPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Regrouting Gallery — Before & After Photos Melbourne | Groutix",
    description:
      "Real Groutix regrouting results from Melbourne homes: shower regrouting, balcony regrouting and leak repairs — before and after photos from real jobs, backed by a 10-year waterproof warranty.",
    alternates: { canonical: "/gallery" },
    openGraph: {
      title: "Regrouting Gallery — Before & After Photos Melbourne | Groutix",
      description:
        "Real Groutix regrouting results from Melbourne homes: shower regrouting, balcony regrouting and leak repairs — before and after photos from real jobs, backed by a 10-year waterproof warranty.",
      url: "/gallery",
      type: "website",
      images: ["/Shower regrouting cover .webp"],
    },
    robots: "index, follow",
  };
}

export default async function GalleryRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <GalleryPage reviews={reviews} rating={rating} />;
}
