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
    title: `Shower Regrouting ${name} | Melbourne | GROUTIX`,
    description: `Specialist shower regrouting, grout repair and leaking shower services in ${name}, Melbourne. Professional wet-area repairs backed by a 10-year waterproof warranty.`,
    alternates: { canonical: `/locations/melbourne/${suburb}` },
    openGraph: {
      title: `Shower Regrouting ${name} | Melbourne — GROUTIX`,
      description: `Local shower regrouting, grout repair and leaking shower solutions in ${name}, Melbourne. Free quotes and specialist workmanship.`,
      url: `/locations/melbourne/${suburb}`,
      type: "website",
    },
  };
}

const melbourneSuburbs: SuburbGroup[] = [
  {
    title: "Central Melbourne & Inner Suburbs",
    suburbs: [
      "Carlton", "Carlton North", "Collingwood", "Docklands", "East Melbourne",
      "Fitzroy", "Fitzroy North", "Melbourne CBD", "North Melbourne", "Parkville",
      "Richmond", "South Melbourne", "South Yarra", "Southbank", "West Melbourne",
    ],
  },
  {
    title: "Inner Eastern Suburbs",
    suburbs: [
      "Abbotsford", "Camberwell", "Canterbury", "Cremorne", "Glen Iris",
      "Hawthorn", "Hawthorn East", "Kew", "Kew East", "Malvern",
      "Malvern East", "Prahran", "Toorak", "Windsor",
    ],
  },
  {
    title: "Inner Northern Suburbs",
    suburbs: [
      "Brunswick", "Brunswick East", "Brunswick West", "Coburg", "Coburg North",
      "Northcote", "Princes Hill", "Thornbury", "Clifton Hill", "Fitzroy North",
    ],
  },
  {
    title: "Inner Southern Suburbs",
    suburbs: [
      "Albert Park", "Balaclava", "Elwood", "Middle Park", "Port Melbourne",
      "St Kilda", "St Kilda East", "St Kilda West",
    ],
  },
  {
    title: "Northern Suburbs",
    suburbs: [
      "Broadmeadows", "Bundoora", "Campbellfield", "Coolaroo", "Craigieburn",
      "Dallas", "Epping", "Fawkner", "Glenroy", "Greenvale",
      "Lalor", "Macleod", "Meadow Heights", "Mill Park", "Reservoir",
      "South Morang", "Thomastown", "Wollert",
    ],
  },
  {
    title: "North-Eastern Suburbs",
    suburbs: [
      "Balwyn", "Balwyn North", "Box Hill", "Box Hill North", "Bulleen",
      "Doncaster", "Doncaster East", "Donvale", "Eltham", "Eltham North",
      "Forest Hill", "Greensborough", "Heidelberg", "Lower Plenty", "Montmorency",
      "Nunawading", "Research", "Rosanna", "Templestowe", "Templestowe Lower",
      "Warrandyte",
    ],
  },
  {
    title: "North-Western Suburbs",
    suburbs: [
      "Airport West", "Ascot Vale", "Avondale Heights", "Essendon", "Essendon North",
      "Essendon West", "Flemington", "Gladstone Park", "Keilor", "Keilor Downs",
      "Keilor East", "Maribyrnong", "Moonee Ponds", "Niddrie", "Oak Park",
      "Strathmore", "Tullamarine",
    ],
  },
  {
    title: "Southern Suburbs",
    suburbs: [
      "Bentleigh", "Bentleigh East", "Brighton", "Brighton East", "Cheltenham",
      "Hampton", "Highett", "McKinnon", "Mentone", "Moorabbin",
      "Ormond", "Sandringham",
    ],
  },
  {
    title: "South-Eastern Suburbs",
    suburbs: [
      "Berwick", "Carrum Downs", "Chelsea", "Clayton", "Cranbourne",
      "Dandenong", "Frankston", "Glen Waverley", "Hallam", "Hampton Park",
      "Keysborough", "Mount Waverley", "Mulgrave", "Narre Warren", "Noble Park",
      "Oakleigh", "Pakenham", "Patterson Lakes", "Seaford", "Springvale",
      "Wheelers Hill",
    ],
  },
  {
    title: "South-Western Suburbs",
    suburbs: [
      "Altona", "Altona Meadows", "Altona North", "Brooklyn", "Hoppers Crossing",
      "Laverton", "Point Cook", "Truganina", "Werribee", "Williams Landing",
      "Williamstown", "Williamstown North",
    ],
  },
  {
    title: "Eastern Suburbs",
    suburbs: [
      "Bayswater", "Boronia", "Croydon", "Croydon Hills", "Croydon North",
      "Croydon South", "Ferntree Gully", "Kilsyth", "Knox", "Lilydale",
      "Mooroolbark", "Mount Evelyn", "Ringwood", "Ringwood East", "Ringwood North",
      "Vermont", "Vermont South", "Wantirna", "Wantirna South",
    ],
  },
  {
    title: "Western Suburbs",
    suburbs: [
      "Caroline Springs", "Deer Park", "Derrimut", "Melton", "Melton South",
      "Plumpton", "Sunbury", "Sydenham", "Tarneit", "Truganina",
      "Wyndham Vale",
    ],
  },
];

function getSuburbExplanation(suburb: string): string {
  if (suburb === "Docklands") {
    return `Docklands is a high-density waterfront suburb where apartment living, regular bathroom use and limited ventilation can accelerate grout wear and shower sealing failures. In buildings with smaller-format tiles and more grout joints, deterioration often becomes visible sooner and can allow moisture to travel into surrounding wall and floor areas.

Cooler weather, condensation and waterfront humidity make failed grout, mould growth and worn silicone common maintenance issues in Docklands bathrooms. These conditions can affect both owner-occupied apartments and investment properties, especially where showers are used heavily and maintenance has been delayed.

GROUTIX provides Docklands with specialist shower regrouting, grout repair, leaking shower rectification and silicone replacement. We focus on restoring the waterproof integrity of tiled wet areas without unnecessary tile removal, backed by a 10-year waterproof warranty on full shower regrouting work.`;
  }
  
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

  const serviceAreaText = `GROUTIX provides shower regrouting, grout repair, silicone replacement and leaking shower repairs across ${suburbName} and the greater Melbourne region. We target failed grout joints and worn seals without turning a repair into a full renovation.

Bathrooms in ${suburbName} commonly develop cracked grout, mouldy joints and failed silicone as surfaces age and building movement takes its toll. Addressing these issues early helps protect the substrate behind the tiles and keeps shower areas watertight.

Our specialist team delivers practical wet-area repairs with quality materials, clear advice and workmanship focused on long-term performance. Full shower regrouting work is backed by a 10-year waterproof warranty.`;

  return (
    <>
      <Navbar />
      <CityPageClient
        cityName={suburbName}
        heroHeading={`Shower Regrouting & Grout Repair in ${suburbName}`}
        heroSubtitle={`Professional shower regrouting, grout repair and leaking shower services in ${suburbName}, Melbourne. GROUTIX restores wet areas without unnecessary tile removal and backs full shower regrouting with a 10-year waterproof warranty.`}
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={melbourneSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
        locationExplanation={explanation}
      />
      <Footer />
    </>
  );
}

