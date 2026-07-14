import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Geelong | Groutix",
  description:
    "Professional shower regrouting, grout repair and leaking shower solutions across Geelong, the Bellarine and Surf Coast, backed by a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/geelong" },
  openGraph: {
    title: "Shower Regrouting Geelong — Groutix",
    description:
      "Geelong shower regrouting, grout repair and leaking shower services with specialist workmanship and free quotes.",
    url: "/locations/geelong",
    type: "website",
  },
};

const geelongSuburbs: SuburbGroup[] = [
  {
    title: "Central Geelong & Inner Suburbs",
    suburbs: [
      "Geelong", "Geelong West", "South Geelong", "Newtown",
      "Drumcondra", "Manifold Heights", "Herne Hill",
    ],
  },
  {
    title: "East Geelong",
    suburbs: [
      "Belmont", "East Geelong", "Grovedale", "Highton",
      "Marshall", "Wandana Heights", "Waurn Ponds", "Fyansford",
    ],
  },
  {
    title: "North Geelong",
    suburbs: [
      "Bell Park", "Bell Post Hill", "Corio", "Norlane",
      "North Geelong", "North Shore",
    ],
  },
  {
    title: "Outer North",
    suburbs: [
      "Anakie", "Lara", "Little River", "Lovely Banks", "Wallington",
    ],
  },
  {
    title: "South Geelong",
    suburbs: [
      "Breakwater", "Hamlyn Heights", "Newcomb",
      "St Albans Park", "Thomson", "Whittington",
    ],
  },
  {
    title: "Surf Coast",
    suburbs: [
      "Aireys Inlet", "Anglesea", "Fairhaven", "Jan Juc",
      "Lorne", "Torquay",
    ],
  },
  {
    title: "Bellarine Peninsula",
    suburbs: [
      "Barwon Heads", "Clifton Springs", "Drysdale", "Indented Head",
      "Leopold", "Ocean Grove", "Point Lonsdale", "Portarlington",
      "Queenscliff", "St Leonards",
    ],
  },
];

const serviceAreaText = `Geelong homes, coastal properties and newer estates all face different grout and shower sealing issues. Salt air, damp conditions and everyday bathroom use can quickly wear down grout joints, silicone edges and shower waterproofing systems.

Groutix services Greater Geelong, the Bellarine Peninsula and the Surf Coast with specialist shower regrouting, grout repair, leaking shower rectification and silicone replacement. We focus on repairing failed wet-area surfaces without pushing clients into unnecessary demolition.

Older homes around Newtown and Geelong West often need careful grout matching, while coastal and newer properties commonly suffer from early seal failure and moisture-related grout breakdown. Our repair process is built to deliver a durable result in these demanding environments.

We provide clear quotes, practical advice and professional workmanship backed by a 10-year waterproof warranty on full shower regrouting work. Contact Groutix for Geelong shower and grout repairs that are built to last.`;

export default async function GeelongPage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Geelong"
        heroHeading="Shower Regrouting & Grout Repair Specialists Geelong"
        heroSubtitle="Groutix provides specialist shower regrouting, grout repair and leaking shower services across Geelong and the Surf Coast, helping restore failed wet areas without full bathroom demolition."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img46.webp"
        heroImage="/img47.jpg"
        suburbGroups={geelongSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}

