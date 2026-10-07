import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BalconyRegroutingClient from "./BalconyRegroutingClient";

export const metadata: Metadata = {
  title: "Balcony Regrouting & Leak Repairs Melbourne | Groutix",
  description:
    "Expert balcony regrouting and leak repairs in Melbourne without retiling. Waterproof epoxy grout, perimeter sealing and 10-year warranty. Free quote today.",
  alternates: { canonical: "/balcony-regrouting" },
  openGraph: {
    title: "Balcony Regrouting & Leak Repairs Melbourne | Groutix",
    description:
      "Expert balcony regrouting and leak repairs in Melbourne without retiling. Waterproof epoxy grout, perimeter sealing and 10-year warranty.",
    url: "/balcony-regrouting",
    type: "website",
  },
};

export default function BalconyRegroutingPage() {
  return (
    <>
      <Navbar />
      <BalconyRegroutingClient />
      <Footer />
    </>
  );
}
