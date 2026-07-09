import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsClient from "./LocationsClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Locations",
  description: "Find your local GROUTIX specialist in Melbourne and across Australia.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Locations — GROUTIX",
    description: "Find your local GROUTIX specialist in Melbourne and across Australia.",
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
