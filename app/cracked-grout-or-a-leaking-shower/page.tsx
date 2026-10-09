import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BalconyRegroutingClient from "../balcony-regrouting/BalconyRegroutingClient";

export const metadata: Metadata = {
  title: "Cracked Grout or a Leaking Shower | Balcony Regrouting Melbourne | Groutix",
  description:
    "Expert balcony regrouting and leak repairs in Melbourne without retiling. Waterproof epoxy grout, perimeter sealing and 10-year warranty. Free quote today.",
  alternates: { canonical: "/cracked-grout-or-a-leaking-shower" },
  openGraph: {
    title: "Cracked Grout or a Leaking Shower | Balcony Regrouting Melbourne | Groutix",
    description:
      "Expert balcony regrouting and leak repairs in Melbourne without retiling. Waterproof epoxy grout, perimeter sealing and 10-year warranty.",
    url: "/cracked-grout-or-a-leaking-shower",
    type: "website",
  },
};

export default function CrackedGroutOrLeakingShowerPage() {
  return (
    <>
      <Navbar />
      <BalconyRegroutingClient />
      <Footer />
    </>
  );
}
