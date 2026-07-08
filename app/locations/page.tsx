import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsClient from "./LocationsClient";
import { getReviews } from "@/lib/reviews";

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
  const reviews = await getReviews(4);
  return (
    <>
      <Navbar />
      <LocationsClient reviews={reviews} />
      <Footer />
    </>
  );
}
