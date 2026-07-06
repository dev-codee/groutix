import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us — GROUTIX",
  description: "Learn about GROUTIX — Australia's trusted shower regrouting and tile sealing specialist since 2006.",
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
