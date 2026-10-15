import type { Metadata } from "next";
// Old layout kept in components/EpoxyGroutPage.tsx; point this import back there to roll back.
import EpoxyGroutPage from "@/components/service/EpoxyGroutPageV2";
import { getBusinessRating, getReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Epoxy Grout Installation Victoria | Durable, Mould-Resistant | Groutix",
  description:
    "Upgrade to epoxy grout for a stronger, stain- and mould-resistant finish. Groutix installs premium epoxy grout across Victoria.",
  alternates: { canonical: "/epoxy-grout" },
  openGraph: {
    title: "Epoxy Grout Installation Victoria | Durable, Mould-Resistant | Groutix",
    description:
      "Upgrade to epoxy grout for a stronger, stain- and mould-resistant finish. Groutix installs premium epoxy grout across Victoria.",
    url: "/epoxy-grout",
    type: "website",
  },
};

export default async function Page() {
  const [reviews, rating] = await Promise.all([getReviews(5), getBusinessRating()]);

  return <EpoxyGroutPage reviews={reviews} rating={rating} />;
}
