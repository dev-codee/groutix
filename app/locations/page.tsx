import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsClient from "./LocationsClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Locations",
  description: "Find local Groutix service areas for shower regrouting, grout repair and leaking shower solutions across Victoria.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Locations — Groutix",
    description: "See where Groutix provides specialist shower regrouting and grout repair services across Victoria.",
    url: "/locations",
    type: "website",
  },
};

export default async function LocationsPage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  return (
    <>
      <Navbar />
      <LocationsClient reviews={reviews} rating={rating} />
      <Footer />
    </>
  );
}
