import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Geelong | GROUTIX",
  description:
    "Expert shower regrouting and leaking shower repair across Geelong. GROUTIX covers all Geelong suburbs including Bellarine, Surf Coast and the greater region with a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/geelong" },
  openGraph: {
    title: "Shower Regrouting Geelong — GROUTIX",
    description:
      "Expert shower regrouting and leaking shower repair across Geelong and surrounds. 10-year warranty. Free quotes.",
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

const serviceAreaText = `Geelong's diverse housing — from heritage cottages in Newtown and Drumcondra to coastal homes along the Bellarine Peninsula and Surf Coast — brings a wide range of grout and shower challenges. Salt air, coastal humidity and heavily tiled wet areas in older homes make Geelong one of Victoria's most demanding environments for showers and bathrooms.

GROUTIX covers the full Greater Geelong area, from the CBD to the Surf Coast and Bellarine Peninsula. Our team handles tile regrouting and leaking shower repairs without demolition — the tiles stay in place, only the failed grout and silicone are replaced. Most jobs are completed within a single day, with the shower ready to use within 24–48 hours.

Coastal properties face accelerated grout breakdown driven by salt and moisture. Inner suburbs like Newtown and Geelong West have older tile work that requires precise matching. New estates in Highton and Waurn Ponds see rapid silicone failure where builder-grade products were used. Whatever the cause, GROUTIX provides a lasting solution.

Every quote is obligation free, all work is backed by a 10-year waterproof warranty, and our team works around your schedule — contact GROUTIX today for Geelong's specialist shower and grout repair service.`;

export default async function GeelongPage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Geelong"
        heroHeading="Shower Regrouting & Leaking Shower Repair Experts Geelong"
        heroSubtitle="Leaking showers and deteriorating grout are common in Geelong's coastal homes and older properties. GROUTIX provides specialist shower repair and professional regrouting services across Geelong and the Surf Coast, designed to stop leaks and prevent water damage without full bathroom renovations."
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
