import type { Metadata } from "next";
// Old layout kept in components/EpoxyGroutPage.tsx; point this import back there to roll back.
import EpoxyGroutPage from "@/components/service/EpoxyGroutPageV2";
import { getBusinessRating, getReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Epoxy Grouting Melbourne | Non Porous, Mould & Stain Resistant",
  description:
    "Epoxy grouting in Melbourne for showers, bathrooms and balconies. Non porous, mould and stain resistant, never needs sealing. Rated 5.0 from 296 reviews, 10 year warranty. Free quote.",
  alternates: { canonical: "/epoxy-grout" },
  openGraph: {
    title: "Epoxy Grouting Melbourne | Non Porous, Mould & Stain Resistant",
    description:
      "Epoxy grouting in Melbourne for showers, bathrooms and balconies. Non porous, mould and stain resistant, never needs sealing. Rated 5.0 from 296 reviews, 10 year warranty. Free quote.",
    url: "/epoxy-grout",
    type: "website",
  },
};

export default async function Page() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);

  return <EpoxyGroutPage reviews={reviews} rating={rating} />;
}
