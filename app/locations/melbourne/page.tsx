import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Melbourne | 10 Year Warranty",
  description:
    "Shower regrouting, grout repair and leaking shower repairs across Melbourne. Rated 5.0 from 296 Google reviews, with a 10 year waterproof warranty and free quotes.",
  alternates: { canonical: "/locations/melbourne" },
  openGraph: {
    title: "Shower Regrouting Melbourne | 10 Year Warranty",
    description:
      "Melbourne shower regrouting, grout repair and leaking shower services. Rated 5.0 from 296 Google reviews, 10 year waterproof warranty, free quotes.",
    url: "/locations/melbourne",
    type: "website",
  },
};

const melbourneSuburbs: SuburbGroup[] = [
  {
    title: "Inner Southern Suburbs",
    suburbs: [
      "Albert Park", "Balaclava", "Elwood", "Middle Park", "Port Melbourne",
      "Prahran", "St Kilda", "St Kilda East", "St Kilda West",
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
    title: "Inner Eastern Suburbs",
    suburbs: [
      "Abbotsford", "Camberwell", "Canterbury", "Cremorne", "Glen Iris",
      "Hawthorn", "Hawthorn East", "Kew", "Kew East", "Malvern",
      "Malvern East", "Toorak", "Windsor",
    ],
  },
  {
    title: "Central Melbourne & Inner Suburbs",
    suburbs: [
      "Carlton", "Carlton North", "Collingwood", "Docklands", "East Melbourne",
      "Fitzroy", "Fitzroy North", "Melbourne CBD", "North Melbourne", "Parkville",
      "Richmond", "South Melbourne", "South Yarra", "Southbank", "West Melbourne",
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
    title: "Eastern Suburbs",
    suburbs: [
      "Bayswater", "Boronia", "Croydon", "Croydon Hills", "Croydon North",
      "Croydon South", "Ferntree Gully", "Kilsyth", "Knox", "Lilydale",
      "Mooroolbark", "Mount Evelyn", "Ringwood", "Ringwood East", "Ringwood North",
      "Vermont", "Vermont South", "Wantirna", "Wantirna South",
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
    title: "North-Western Suburbs",
    suburbs: [
      "Airport West", "Ascot Vale", "Avondale Heights", "Essendon", "Essendon North",
      "Essendon West", "Flemington", "Gladstone Park", "Keilor", "Keilor Downs",
      "Keilor East", "Maribyrnong", "Moonee Ponds", "Niddrie", "Oak Park",
      "Strathmore", "Tullamarine",
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
    title: "Western Suburbs",
    suburbs: [
      "Caroline Springs", "Deer Park", "Derrimut", "Melton", "Melton South",
      "Plumpton", "Sunbury", "Sydenham", "Tarneit", "Truganina",
      "Wyndham Vale",
    ],
  }
];

const serviceAreaText = `Regrouting in Melbourne is the work Groutix does every day. From period homes in the inner city and bayside to apartments, townhouses and family homes across the north, west and south east, we restore failed grout and silicone so showers and balconies look right and stay watertight. Shower regrouting in Melbourne homes is our core work, and the same specialist crew handles balcony regrouting, leaking shower repairs, tile regrouting and silicone recaulking across the metro area.

Most jobs start with the same signs. Grout that is cracked, crumbling or missing. Mould that keeps coming back no matter how much you scrub. Silicone that has perished and lifted at the corners. A musty smell that never leaves, damp walls beside the shower, or water showing up where it should not. These are signs the grout and seals have failed and water is getting behind the tiles, where it quietly damages the wall and floor underneath.

The material matters. Standard cement grout is porous, so it absorbs water, stains over time and feeds mould, and it only keeps working if it is sealed again and again. Epoxy grout is water resistant and non porous, it does not need sealing, and it lasts far longer in a wet area, which is why complete Groutix regrouting jobs are finished in epoxy. Epoxy is still not a substitute for the waterproofing membrane behind your tiles, so we check where the water is actually getting in before recommending any repair. If the membrane has failed, we will tell you honestly instead of selling you a regrout that cannot fix it.

Our process is built to fix the cause, not cover it. The old grout is removed mechanically, never smeared over, because new grout over old grout cracks and fails within months. The joints are rebuilt with colour matched epoxy grout, and the corners and wall to floor junctions are resealed with silicone, the way movement joints are meant to be done. In most cases your tiles stay exactly where they are, most showers are finished in a single visit, and the cost is a fraction of a full bathroom renovation.

Beyond showers, Groutix regrouts and reseals balconies for homeowners and owners corporations, regrouts kitchen and laundry tiles, replaces drummy or cracked tiles and renews silicone throughout the bathroom. Landlords and property managers across Melbourne use us to turn leaking bathrooms around between tenants without a renovation.

Most standard single showers cost about $550 to $1,500 to regrout, and your exact price is quoted free before any work starts. Every complete job is backed by a 10 year waterproof warranty, and Groutix is rated 5.0 from 296 Google reviews by Melbourne customers. Find your suburb below or call (03) 7023 8094 for a free quote.`;


const melbourneFaqs: Array<{ question: string; answer: string }> = [
  {
    question: "How much does shower regrouting cost in Melbourne?",
    answer:
      "Most standard single showers cost about $550 to $1,500. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    question: "Will regrouting fix my leaking shower?",
    answer:
      "If the leak comes from failed grout or perished silicone, yes. If the waterproofing membrane behind the tiles has failed, regrouting alone will not fix it. Groutix checks where the water is getting in first and tells you honestly which repair you actually need.",
  },
  {
    question: "Do I need to remove my tiles to regrout a shower?",
    answer:
      "No, in most cases. Only the old grout is removed and rebuilt. Tile work is needed only when tiles are cracked, loose or drummy.",
  },
  {
    question: "How long does shower regrouting take?",
    answer:
      "Most showers are finished in a single visit. Before we start, we tell you exactly when the shower can be used again, so there are no surprises.",
  },
  {
    question: "Epoxy grout or cement grout, which is better for a shower?",
    answer:
      "Epoxy grout is the better choice for most showers. Cement grout is porous, so it absorbs water, stains and grows mould, and it needs regular sealing to keep working. Epoxy is water resistant, does not need sealing and lasts far longer in a wet area.",
  },
  {
    question: "How long does shower regrouting last?",
    answer:
      "Done properly, regrouting holds up for years of daily use, and epoxy grout outlasts cement grout in wet areas. Every complete Groutix regrouting job is backed by a 10 year waterproof warranty.",
  },
  {
    question: "Why does mould keep coming back in my shower grout?",
    answer:
      "Mould that keeps returning usually lives inside failed, porous grout, where cleaning cannot reach it. Replacing the grout and the silicone removes the source instead of covering it up.",
  },
  {
    question: "Can balcony regrouting stop a balcony leak?",
    answer:
      "Often, yes. Many balcony leaks start at failed grout joints and perished seals. Groutix regrouts and reseals the balcony so water sheds off the surface instead of soaking through. If the membrane has failed, we will tell you what repair is actually needed.",
  },
  {
    question: "My balcony leaks into the unit below. Who is responsible in Victoria?",
    answer:
      "In Victoria it depends on the plan of subdivision for your building, and many owners are surprised to learn the balcony tiling and waterproofing can be the lot owner responsibility. Groutix can inspect the balcony, document the cause and quote the repair for you or your owners corporation.",
  },
  {
    question: "Which Melbourne areas does Groutix cover?",
    answer:
      "Groutix covers 44 areas across greater Melbourne, from the inner city and bayside to the north, west and south east, plus the Geelong, Ballarat, Frankston, Casey, Lilydale and Kilmore regions. Find your suburb in the list on this page or call (03) 7023 8094.",
  },
];

export default async function MelbournePage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="Melbourne"
        heroHeading="Shower Regrouting Melbourne"
        heroSubtitle="Groutix restores leaking, mouldy and cracked grout in showers and balconies across Melbourne. Waterproof epoxy grout, no tiles removed, most jobs finished in a single visit, and every full regrout backed by a 10 year waterproof warranty."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        faqs={melbourneFaqs}
        suburbGroups={melbourneSuburbs}
        parentSlug="melbourne"
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}

