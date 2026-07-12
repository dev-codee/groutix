import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Melbourne | Groutix",
  description:
    "Professional shower regrouting, grout repair and leaking shower solutions across Melbourne. Groutix services homes and apartments throughout Melbourne with a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/melbourne" },
  openGraph: {
    title: "Shower Regrouting Melbourne — Groutix",
    description:
      "Melbourne shower regrouting, grout repair and leaking shower services with specialist workmanship and free quotes.",
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

const serviceAreaText = `Melbourne properties place heavy demands on grout joints, silicone seals and shower waterproofing. From older inner-city homes to new apartment developments, worn grout and leaking shower bases are common issues that can quickly lead to hidden moisture damage.

Groutix services the full Melbourne metro region with specialist shower regrouting, leaking shower repair, silicone replacement and tile restoration. In most cases, we repair the failed grout and sealing system without removing the existing tiles, helping you avoid the cost of a full bathroom renovation.

Cold winters, condensation, daily use and natural movement all contribute to grout cracking and seal breakdown across Melbourne bathrooms. Our team focuses on resolving the source of the problem so your shower is restored properly, not just cosmetically improved.

Every quote is clear, every repair is completed with long-term performance in mind, and full shower regrouting work is backed by a 10-year waterproof warranty. Book Groutix for specialist grout and shower repairs across Melbourne.`;

export default async function MelbournePage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Melbourne"
        heroHeading="Shower Regrouting & Grout Repair Specialists Melbourne"
        heroSubtitle="Groutix provides specialist shower regrouting, grout repair and leaking shower services across Melbourne. We restore failed grout lines, worn seals and wet-area waterproofing issues without unnecessary tile removal."
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

