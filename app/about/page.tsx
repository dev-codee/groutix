import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn how Groutix helps homeowners solve grout failure, leaking showers and worn wet areas with specialist regrouting and sealing services.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Groutix",
    description: "Meet the team behind Groutix and our specialist approach to shower regrouting, grout repair and wet-area restoration.",
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
