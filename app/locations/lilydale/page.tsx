import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Lilydale | Groutix",
  description:
    "Professional shower regrouting, grout repair and leaking shower solutions across Lilydale. Groutix services homes and apartments throughout Lilydale with a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/lilydale" },
  openGraph: {
    title: "Shower Regrouting Lilydale — Groutix",
    description:
      "Lilydale shower regrouting, grout repair and leaking shower services with specialist workmanship and free quotes.",
    url: "/locations/lilydale",
    type: "website",
  },
};

const lilydaleSuburbs: SuburbGroup[] = [
  {
    "title": "Local Lilydale Suburbs",
    "suburbs": [
      "Chirnside Park",
      "Coldstream",
      "Lilydale Central",
      "Mooroolbark",
      "Mount Evelyn"
    ]
  },
  {
    "title": "Connecting Suburbs (From Frankston Route)",
    "suburbs": [
      "Emerald",
      "Macclesfield",
      "Monbulk",
      "Silvan"
    ]
  },
  {
    "title": "Connecting Suburbs (From Kilmore Route)",
    "suburbs": [
      "Doreen",
      "Hurstbridge",
      "Kangaroo Ground",
      "Nutfield",
      "Watsons Creek"
    ]
  }
];

const serviceAreaText = `Lilydale properties place heavy demands on grout joints, silicone seals and shower waterproofing. From older homes to new developments, worn grout and leaking shower bases are common issues that can quickly lead to hidden moisture damage.

Groutix services the full Lilydale region with specialist shower regrouting, leaking shower repair, silicone replacement and tile restoration. In most cases, we repair the failed grout and sealing system without removing the existing tiles, helping you avoid the cost of a full bathroom renovation.

Cold winters, condensation, daily use and natural movement all contribute to grout cracking and seal breakdown across Lilydale bathrooms. Our team focuses on resolving the source of the problem so your shower is restored properly, not just cosmetically improved.

Every quote is clear, every repair is completed with long-term performance in mind, and full shower regrouting work is backed by a 10-year waterproof warranty. Book Groutix for specialist grout and shower repairs across Lilydale.`;

export default async function LilydalePage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Lilydale"
        heroHeading="Shower Regrouting & Grout Repair Specialists Lilydale"
        heroSubtitle="Groutix provides specialist shower regrouting, grout repair and leaking shower services across Lilydale. We restore failed grout lines, worn seals and wet-area waterproofing issues without unnecessary tile removal."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={lilydaleSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}
