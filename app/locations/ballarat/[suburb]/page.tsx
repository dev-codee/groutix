import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

// Helper to format suburb slug to readable name (e.g. fitzroy-north -> Fitzroy North)
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
    title: `Shower Regrouting ${name} | Ballarat | GROUTIX`,
    description: `Specialist shower regrouting, grout repair and leaking shower services in ${name}, Ballarat. Professional wet-area repairs backed by a 10-year waterproof warranty.`,
    alternates: { canonical: `/locations/ballarat/${suburb}` },
    openGraph: {
      title: `Shower Regrouting ${name} | Ballarat — GROUTIX`,
      description: `Local shower regrouting, grout repair and leaking shower solutions in ${name}, Ballarat. Free quotes and specialist workmanship.`,
      url: `/locations/ballarat/${suburb}`,
      type: "website",
    },
  };
}

const ballaratSuburbs: SuburbGroup[] = [
  {
    "title": "Local Ballarat Suburbs",
    "suburbs": [
      "Alfredton",
      "Ballarat Central",
      "Ballarat East",
      "Ballarat North",
      "Black Hill",
      "Buninyong",
      "Delacombe",
      "Eureka",
      "Mount Clear",
      "Mount Helen",
      "Redan",
      "Sebastopol",
      "Wendouree"
    ]
  },
  {
    "title": "Connecting Suburbs (Towards Kilmore)",
    "suburbs": [
      "Creswick",
      "Daylesford",
      "Newlyn"
    ]
  },
  {
    "title": "Connecting Suburbs (Towards Geelong)",
    "suburbs": [
      "Clarendon",
      "Elaine"
    ]
  }
];

function getSuburbExplanation(suburb: string): string {
  return `${suburb} includes a mix of established homes, renovated bathrooms and newer residential developments, all of which can develop grout wear and wet-area sealing issues over time. As bathrooms age, cracked grout joints and tired silicone often become the first signs that moisture is getting where it should not.

In ${suburb}, everyday use, seasonal movement and ongoing exposure to steam and water can lead to leaking showers, stained grout lines and hidden dampness behind tiled surfaces. Early repair work is the best way to avoid more extensive water damage and keep the bathroom functioning properly.

GROUTIX provides specialist grout repair, shower regrouting, leaking shower repair and silicone replacement across ${suburb}. Our team restores tiled wet areas without unnecessary demolition, with full shower regrouting work backed by a 10-year waterproof warranty.`;
}

export default async function SuburbPage({ params }: Props) {
  const { suburb } = await params;
  const suburbName = formatSuburbName(suburb);
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const explanation = getSuburbExplanation(suburbName);

  const serviceAreaText = `GROUTIX provides shower regrouting, grout repair, silicone replacement and leaking shower repairs across ${suburbName} and the greater Ballarat region. We target failed grout joints and worn seals without turning a repair into a full renovation.

Bathrooms in ${suburbName} commonly develop cracked grout, mouldy joints and failed silicone as surfaces age and building movement takes its toll. Addressing these issues early helps protect the substrate behind the tiles and keeps shower areas watertight.

Our specialist team delivers practical wet-area repairs with quality materials, clear advice and workmanship focused on long-term performance. Full shower regrouting work is backed by a 10-year waterproof warranty.`;

  return (
    <>
      <Navbar />
      <CityPageClient
        cityName={suburbName}
        heroHeading={`Shower Regrouting & Grout Repair in ${suburbName}`}
        heroSubtitle={`Professional shower regrouting, grout repair and leaking shower services in ${suburbName}, Ballarat. GROUTIX restores wet areas without unnecessary tile removal and backs full shower regrouting with a 10-year waterproof warranty.`}
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={ballaratSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
        locationExplanation={explanation}
      />
      <Footer />
    </>
  );
}
