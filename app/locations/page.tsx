import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsClient from "./LocationsClient";

export const metadata: Metadata = {
  title: "Locations — GROUTIX",
  description: "Find your local GROUTIX specialist in Melbourne and across Australia.",
};

export default function LocationsPage() {
  return (
    <>
      <Navbar />
      <LocationsClient />
      <Footer />
    </>
  );
}
