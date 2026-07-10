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
    description: `Expert shower regrouting, leaking shower repair and tile sealing services in ${name}, Melbourne. Standard 10-year waterproof warranty. Get a free quote today!`,
    alternates: { canonical: `/locations/melbourne/${suburb}` },
    openGraph: {
      title: `Shower Regrouting ${name} | Melbourne — GROUTIX`,
      description: `Expert shower regrouting, leaking shower repair and tile sealing services in ${name}, Melbourne. 10-year warranty. Free quotes.`,
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
    return `Docklands is Melbourne's most dramatic urban renewal precinct, located immediately west of the CBD along the Yarra River and Victoria Harbour. The suburb's transformation from a disused industrial port into a vibrant residential, commercial, and entertainment destination is one of Australia's most ambitious urban regeneration projects. Iconic landmarks including Etihad Stadium (Marvel Stadium), the Bolte Bridge, and the NewQuay waterfront precinct define the area, which now houses tens of thousands of residents in high-rise apartments alongside major corporate headquarters and dining destinations.

High-density apartment living in Docklands comes with specific bathroom maintenance considerations. In apartments, shower recesses are used intensively and often have smaller tile formats with more grout line area per square metre, meaning grout deterioration is both more common and more visible than in a standard suburban bathroom. Melbourne's cold winters drive condensation in high-rise apartments where ventilation can be limited, and the proximity to Victoria Harbour means ambient humidity levels are elevated by the water.

The suburb's apartment-dominated residential fabric means grout and silicone maintenance is a regular requirement for both owner-occupiers and investors managing rental properties. GROUTIX services Docklands with professional tile regrouting, leaking shower repair, silicone replacement, and tile and grout sealing. A complete regrout is backed by a 10-Year Waterproof Warranty. Contact GROUTIX for a free quote in Docklands.`;
  }
  
  return `${suburb} is a key residential and community hub within the greater Melbourne region, known for its diverse housing types, local parks, and active community life. Over the years, the area has grown to accommodate both established families and young professionals, blending historical charm with modern residential developments.

For properties in ${suburb}, bathroom dampness, leaking showers, and grout deterioration are common challenges. Daily use and natural building movement cause traditional grout to crack, leading to hidden moisture build-up behind tiles. The temperature fluctuations across the seasons in Victoria accelerate this wear, making regular inspection of seals and joints essential to protect home structures.

GROUTIX provides specialized grout repair, tile regrouting, silicone sealing, and leaking shower repair across all streets and residential estates in ${suburb}. Our local specialists restore your tiled areas to pristine condition, stopping leaks without the need to remove tiles, backed by our fully certified 10-Year Waterproof Warranty.`;
}

export default async function SuburbPage({ params }: Props) {
  const { suburb } = await params;
  const suburbName = formatSuburbName(suburb);
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const explanation = getSuburbExplanation(suburbName);

  const serviceAreaText = `GROUTIX provides professional shower regrouting and leaking shower repair services across ${suburbName} and the greater Melbourne area. We handle tile regrouting, silicone seal replacements, and leaking shower fixes without the cost or hassle of full bathroom demolition.

Many homes in ${suburbName} experience common bathroom grout deterioration and silicone cracking over time. Whether it's an older classic residence or a modern townhouse development, temperature fluctuations and daily usage inevitably cause grout to leak and seals to fail.

Our local GROUTIX specialist team is equipped to inspect, restore, and seal your bathroom tiles and grout to perfection, protecting your property value with our industry-leading 10-year waterproof guarantee. Most jobs are completed in just one day.`;

  return (
    <>
      <Navbar />
      <CityPageClient
        cityName={suburbName}
        heroHeading={`Shower Regrouting & Leaking Shower Repair in ${suburbName}`}
        heroSubtitle={`Professional grout and shower sealing services in ${suburbName}, Melbourne. GROUTIX resolves leaking showers, cracked tiles, and mouldy grout lines with zero tiling demolition and a 10-year waterproof warranty.`}
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
