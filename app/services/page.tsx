import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Our Services — GROUTIX",
  description: "Explore our full range of shower regrouting, silicone resealing, tile repair, and grout colour change services across Australia.",
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
