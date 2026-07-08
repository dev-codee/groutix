import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Our Services",
  description: "Explore our full range of shower regrouting, silicone resealing, tile repair, and grout colour change services across Australia.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Our Services — GROUTIX",
    description: "Shower regrouting, silicone resealing, tile repair, and grout colour change services across Australia.",
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
