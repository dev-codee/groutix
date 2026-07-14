import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Our Services",
  description: "Explore Groutix services including shower regrouting, grout repair, leaking shower repair, silicone resealing and minor tile restoration.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Our Services — Groutix",
    description: "Browse specialist grout and shower repair services from Groutix, including regrouting, resealing and tile restoration.",
    url: "/services",
    type: "website",
  },
};

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <ServicesClient />
      <Footer />
    </>
  );
}
