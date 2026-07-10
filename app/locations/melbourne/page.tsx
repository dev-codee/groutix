import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Melbourne | GROUTIX",
  description:
    "Expert shower regrouting and leaking shower repair across Melbourne. GROUTIX covers all Melbourne suburbs with professional grout services and a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/melbourne" },
  openGraph: {
    title: "Shower Regrouting Melbourne — GROUTIX",
    description:
      "Expert shower regrouting and leaking shower repair across Melbourne. 10-year warranty. Free quotes.",
    url: "/locations/melbourne",
    type: "website",
  },
};

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

const serviceAreaText = `Melbourne is home to Australia's biggest housing stock and some of its toughest bathroom challenges. From Federation cottages in Fitzroy and Carlton to art deco apartments in St Kilda, brick homes across the Eastern suburbs and modern family estates spreading through outer Melbourne, every era brings its own grout and silicone problems.

GROUTIX covers the full Melbourne metropolitan area — from the CBD to the outer suburbs. We handle tile regrouting and leaking shower repairs without ripping out tiles or sending you into a renovation. The tiles stay where they are. Only the failed grout and silicone get replaced — most jobs finished in a single day.

Melbourne homes have a real bathroom challenge. The state's climate drives mould straight into grout lines, and silicone seals crack along every shower edge after just a few wet seasons. In high-rise apartments, even a small failure in the silicone can let water track down through the slab to the unit below.

Every quote is free, every job is properly warranted, and our team works around your schedule. If your grout is grey, your shower is leaking, or your bathroom is past its best, book your local GROUTIX specialist in Melbourne today.`;

export default async function MelbournePage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Melbourne"
        heroHeading="Shower Regrouting & Leaking Shower Repair Experts Melbourne"
        heroSubtitle="Leaking showers and deteriorating grout are common problems in Melbourne homes and apartments. GROUTIX provides specialist shower repair and professional regrouting services across Melbourne, designed to stop leaks and prevent further water damage without the need for full bathroom renovations."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={melbourneSuburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}
