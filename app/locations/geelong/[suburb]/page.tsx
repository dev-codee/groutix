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
    description: `Expert shower regrouting, leaking shower repair and tile sealing services in ${name}, Geelong. Standard 10-year waterproof warranty. Get a free quote today!`,
    alternates: { canonical: `/locations/geelong/${suburb}` },
    openGraph: {
      title: `Shower Regrouting ${name} | Geelong — GROUTIX`,
      description: `Expert shower regrouting, leaking shower repair and tile sealing services in ${name}, Geelong. 10-year warranty. Free quotes.`,
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
  return `${suburb} is a key residential and community hub within the greater Geelong region, known for its unique coastal influence, local parks, and active community life. Over the years, the area has grown to accommodate both established families and holidaymakers, blending seaside charm with modern residential developments.

For properties in ${suburb}, bathroom dampness, leaking showers, and grout deterioration are common challenges. Daily use and natural building movement cause traditional grout to crack, leading to hidden moisture build-up behind tiles. The temperature fluctuations and coastal salt air across the seasons in Victoria accelerate this wear, making regular inspection of seals and joints essential to protect home structures.

GROUTIX provides specialized grout repair, tile regrouting, silicone sealing, and leaking shower repair across all streets and residential estates in ${suburb}. Our local specialists restore your tiled areas to pristine condition, stopping leaks without the need to remove tiles, backed by our fully certified 10-Year Waterproof Warranty.`;
}

export default async function GeelongSuburbPage({ params }: Props) {
  const { suburb } = await params;
  const suburbName = formatSuburbName(suburb);
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const explanation = getSuburbExplanation(suburbName);

  const serviceAreaText = `GROUTIX provides professional shower regrouting and leaking shower repair services across ${suburbName} and the greater Geelong area. We handle tile regrouting, silicone seal replacements, and leaking shower fixes without the cost or hassle of full bathroom demolition.

Many homes in ${suburbName} experience common bathroom grout deterioration and silicone cracking over time. Whether it's an older classic residence or a modern Surf Coast property development, temperature fluctuations and daily usage inevitably cause grout to leak and seals to fail.

Our local GROUTIX specialist team is equipped to inspect, restore, and seal your bathroom tiles and grout to perfection, protecting your property value with our industry-leading 10-year waterproof guarantee. Most jobs are completed in just one day.`;

  return (
    <>
      <Navbar />
      <CityPageClient
        cityName={suburbName}
        heroHeading={`Shower Regrouting & Leaking Shower Repair in ${suburbName}`}
        heroSubtitle={`Professional grout and shower sealing services in ${suburbName}, Geelong. GROUTIX resolves leaking showers, cracked tiles, and mouldy grout lines with zero tiling demolition and a 10-year waterproof warranty.`}
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

