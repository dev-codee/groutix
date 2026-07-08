import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about GROUTIX — Australia's trusted shower regrouting and tile sealing specialist since 2006.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About GROUTIX",
    description: "Australia's trusted shower regrouting and tile sealing specialist since 2006.",
    url: "/about",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <AboutClient />
      <Footer />
    </>
  );
}
