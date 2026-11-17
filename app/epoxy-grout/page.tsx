import type { Metadata } from "next";
// Old layout kept in components/EpoxyGroutPage.tsx; point this import back there to roll back.
import EpoxyGroutPage from "@/components/service/EpoxyGroutPageV2";
import { getBusinessRating, getReviews } from "@/lib/reviews";
import { OG_SHARE_IMAGE } from "@/lib/seo";

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
    images: [{ url: OG_SHARE_IMAGE, width: 1920, height: 1440, alt: "Shower regrouting in Melbourne by Groutix" }],
  },
};

export default async function Page() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);

  return <EpoxyGroutPage reviews={reviews} rating={rating} />;
}
