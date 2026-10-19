import type { Metadata } from "next";
import { getReviews, getBusinessRating } from "@/lib/reviews";
import OurProcessPage from "@/components/OurProcessPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shower Regrouting Process: How It Works | Groutix",
    description: "How does shower regrouting work? Free inspection, full grout removal, epoxy regrout, seal & clean. No tile removal. 10-year warranty. Melbourne-wide.",
    alternates: { canonical: "/our-process" },
    openGraph: {
      title: "Shower Regrouting Process: How It Works | Groutix",
      description: "How does shower regrouting work? Free inspection, full grout removal, epoxy regrout, seal & clean. No tile removal. 10-year warranty. Melbourne-wide.",
      url: "/our-process",
      type: "website",
    },
    robots: "index, follow",
  };
}

export default async function OurProcessRoute() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return <OurProcessPage reviews={reviews} rating={rating} />;
}
