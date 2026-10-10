import type { Metadata } from "next";
import BalconyRegroutingClient from "./BalconyRegroutingClient";
import { getBusinessRating } from "@/lib/reviews";

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

export default async function BalconyRegroutingPage() {
  const rating = await getBusinessRating();

  return <BalconyRegroutingClient rating={rating} />;
}
