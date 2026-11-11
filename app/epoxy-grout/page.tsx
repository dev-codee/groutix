import type { Metadata } from "next";
// Old layout kept in components/EpoxyGroutPage.tsx; point this import back there to roll back.
import EpoxyGroutPage from "@/components/service/EpoxyGroutPageV2";
import { getBusinessRating, getReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Epoxy Grout Melbourne | Showers & Balconies",
  description:
    "Epoxy versus cement grout explained for Melbourne bathrooms and balconies: lifespan, stain resistance, cost drivers. Free quote.",
  alternates: { canonical: "/epoxy-grout" },
  openGraph: {
    title: "Epoxy Grout Melbourne | Showers & Balconies",
    description:
      "Epoxy versus cement grout explained for Melbourne bathrooms and balconies: lifespan, stain resistance, cost drivers. Free quote.",
    url: "/epoxy-grout",
    type: "website",
  },
};

export default async function Page() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);

  return <EpoxyGroutPage reviews={reviews} rating={rating} />;
}
