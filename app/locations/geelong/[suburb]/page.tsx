import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

// Helper to format suburb slug to readable name
function formatSuburbName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type Props = {
  params: Promise<{ suburb: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { suburb } = await params;
  const name = formatSuburbName(suburb);
  return {
    title: `Shower Regrouting ${name} | Geelong | GROUTIX`,
    description: `Specialist shower regrouting, grout repair and leaking shower services in ${name}, Geelong. Professional wet-area repairs backed by a 10-year waterproof warranty.`,
    alternates: { canonical: `/locations/geelong/${suburb}` },
    openGraph: {
      title: `Shower Regrouting ${name} | Geelong — GROUTIX`,
      description: `Local shower regrouting, grout repair and leaking shower solutions in ${name}, Geelong. Free quotes and specialist workmanship.`,
      url: `/locations/geelong/${suburb}`,
      type: "website",
    },
  };
}

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
      "Anakie", "Lara", "Lovely Banks", "Lovely Banks", "Wallington",
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

function getSuburbExplanation(suburb: string): string {
  return `${suburb} combines coastal or regional living with a wide mix of established homes, renovated bathrooms and newer developments. Over time, those wet areas can suffer from cracked grout, tired silicone and moisture-related wear that affects both appearance and waterproof performance.

In ${suburb}, daily use, seasonal changes and coastal conditions can speed up grout deterioration and shower seal failure. When moisture gets behind tiled surfaces, small grout issues can quickly turn into bigger repair work if they are ignored.

GROUTIX provides specialist grout repair, shower regrouting, leaking shower repair and silicone replacement across ${suburb}. We restore tiled wet areas without unnecessary demolition, with full shower regrouting work backed by a 10-year waterproof warranty.`;
}

export default async function GeelongSuburbPage({ params }: Props) {
  const { suburb } = await params;
  const suburbName = formatSuburbName(suburb);
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const explanation = getSuburbExplanation(suburbName);

  const serviceAreaText = `GROUTIX provides shower regrouting, grout repair, silicone replacement and leaking shower repairs across ${suburbName} and the greater Geelong region. We repair failed wet-area surfaces without pushing you toward full bathroom demolition.

Homes in ${suburbName} often deal with cracked grout, worn silicone and hidden shower moisture issues caused by age, daily use and coastal exposure. Fixing these defects early helps protect the tiled surface and the substrate underneath.

Our specialist team delivers practical repairs using quality materials and a process designed for long-term performance. Full shower regrouting work is backed by a 10-year waterproof warranty.`;

  return (
    <>
      <Navbar />
      <CityPageClient
        cityName={suburbName}
        heroHeading={`Shower Regrouting & Grout Repair in ${suburbName}`}
        heroSubtitle={`Professional shower regrouting, grout repair and leaking shower services in ${suburbName}, Geelong. GROUTIX restores wet areas without unnecessary tile removal and backs full shower regrouting with a 10-year waterproof warranty.`}
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={geelongSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
        locationExplanation={explanation}
      />
      <Footer />
    </>
  );
}

