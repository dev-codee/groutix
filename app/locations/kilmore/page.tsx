import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Kilmore | Groutix",
  description:
    "Professional shower regrouting, grout repair and leaking shower solutions across Kilmore. Groutix services homes and apartments throughout Kilmore with a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/kilmore" },
  openGraph: {
    title: "Shower Regrouting Kilmore — Groutix",
    description:
      "Kilmore shower regrouting, grout repair and leaking shower services with specialist workmanship and free quotes.",
    url: "/locations/kilmore",
    type: "website",
  },
};

const kilmoreSuburbs: SuburbGroup[] = [
  {
    "title": "Local Kilmore Suburbs",
    "suburbs": [
      "Bylands",
      "Hidden Valley",
      "Kilmore Central",
      "Kilmore East",
      "Wandong",
      "Willowmavin"
    ]
  },
  {
    "title": "Connecting Suburbs (Towards Lilydale)",
    "suburbs": [
      "Eden Park",
      "Wallan",
      "Whittlesea",
      "Yan Yean"
    ]
  },
  {
    "title": "Connecting Suburbs (Towards Ballarat)",
    "suburbs": [
      "Hesket",
      "Lancefield",
      "Romsey",
      "Tylden",
      "Woodend"
    ]
  }
];

const serviceAreaText = `Kilmore properties place heavy demands on grout joints, silicone seals and shower waterproofing. From older homes to new developments, worn grout and leaking shower bases are common issues that can quickly lead to hidden moisture damage.

Groutix services the full Kilmore region with specialist shower regrouting, leaking shower repair, silicone replacement and tile restoration. In most cases, we repair the failed grout and sealing system without removing the existing tiles, helping you avoid the cost of a full bathroom renovation.

Cold winters, condensation, daily use and natural movement all contribute to grout cracking and seal breakdown across Kilmore bathrooms. Our team focuses on resolving the source of the problem so your shower is restored properly, not just cosmetically improved.

Every quote is clear, every repair is completed with long-term performance in mind, and full shower regrouting work is backed by a 10-year waterproof warranty. Book Groutix for specialist grout and shower repairs across Kilmore.`;

export default async function KilmorePage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Kilmore"
        heroHeading="Shower Regrouting & Grout Repair Specialists Kilmore"
        heroSubtitle="Groutix provides specialist shower regrouting, grout repair and leaking shower services across Kilmore. We restore failed grout lines, worn seals and wet-area waterproofing issues without unnecessary tile removal."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={kilmoreSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}
