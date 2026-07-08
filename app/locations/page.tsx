import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsClient from "./LocationsClient";
import { getReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Locations — GROUTIX",
  description: "Find your local GROUTIX specialist in Melbourne and across Australia.",
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
