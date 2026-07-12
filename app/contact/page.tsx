import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact & Free Quote",
  description: "Request a free quote for shower regrouting, grout repair, leaking shower repair or tile sealing. Call Groutix or send your details online.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact & Free Quote — Groutix",
    description: "Talk to Groutix about shower regrouting, leaking shower repairs and grout restoration. Fast quotes and clear advice.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <ContactClient />
      <Footer />
    </>
  );
}
