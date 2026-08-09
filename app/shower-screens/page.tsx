import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShowerScreensClient from "./ShowerScreensClient";

export const metadata: Metadata = {
  title: "Custom Shower Screens & Enclosures Victoria | Groutix",
  description:
    "Bespoke frameless, semi-frameless, and sliding shower screens custom-measured and installed across Victoria. Premium toughened safety glass and expert fitting. Request a free quote.",
  alternates: { canonical: "/shower-screens" },
  openGraph: {
    title: "Custom Shower Screens & Enclosures — Groutix",
    description:
      "Explore bespoke frameless pivot, sliding, semi-frameless Neptune & Optima shower screens, and SwiftCloset wardrobe systems.",
    url: "/shower-screens",
    type: "website",
  },
};

export default function ShowerScreensPage() {
  return (
    <>
      <Navbar />
      <ShowerScreensClient />
      <Footer />
    </>
  );
}
