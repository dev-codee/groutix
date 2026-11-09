import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import YarraGlenHubClient from "@/app/locations/YarraGlenHubClient";
import type { SuburbGroup } from "@/app/locations/YarraGlenHubClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting Yarra Glen",
  description:
    "Shower regrouting in Yarra Glen by Groutix. Leaking shower repairs, epoxy grout and silicone replacement across Yarra Glen, Christmas Hills, Dixons Creek, Steels Creek and Tarrawarra. Rated 5.0 from 296 Google reviews, with a 10 year waterproof warranty on eligible work.",
  alternates: { canonical: "/locations/yarra-glen" },
  openGraph: {
    title: "Shower Regrouting Yarra Glen | Groutix",
    description:
      "Yarra Glen shower regrouting, grout repair and leaking shower services with specialist workmanship and free quotes.",
    url: "/locations/yarra-glen",
    type: "website",
  },
};

const yarraglenSuburbs: SuburbGroup[] = [
  {
    "title": "Local Yarra Glen Suburbs",
    "suburbs": [
      "Christmas Hills",
      "Dixons Creek",
      "Steels Creek",
      "Tarrawarra",
      "Yarra Glen Central"
    ]
  }
];

const yarraGlenFaqs = [
  {
    question: "How much does shower regrouting cost in Yarra Glen?",
    answer: "Most standard single showers cost about $550 to $1,500 to regrout. The price depends on the size of the shower, the tile type and the condition of the grout. Groutix quotes the exact price for free before any work starts, and complete regrouting is backed by a 10 year waterproof warranty.",
  },
  {
    question: "Will regrouting fix our leaking shower, or has the waterproofing failed?",
    answer: "Regrouting fixes leaks caused by cracked grout and split silicone, which is most leaking showers in Yarra Glen. If the waterproofing membrane under the tiles has failed, regrouting alone will not stop the leak, and we will tell you straight before any work starts rather than sell you a repair that cannot hold.",
  },
  {
    question: "Can you regrout without removing our tiles?",
    answer: "Yes. On most Yarra Glen jobs the tiles stay exactly where they are. The old grout is removed mechanically, the joints are rebuilt, and the corners are resealed with flexible silicone. Tiles only come up if one is already loose, cracked or drummy underneath.",
  },
  {
    question: "Why do our shower seals keep splitting?",
    answer: "Yarra Glen gets cold winters and warm summers, and that swing makes silicone expand and contract until it splits and lets water through. Cement grout cracks the same way in homes that move with the seasons. A proper regrout rebuilds the joints and finishes the movement points in flexible silicone, which is made to handle that movement.",
  },
  {
    question: "Epoxy or cement grout for a Yarra Valley home?",
    answer: "Epoxy grout suits valley homes well. It is non porous, so the damp valley air and mould have nowhere to settle, and it never needs sealing. Cement grout with a penetrating sealer costs less and suits drier bathrooms. We will recommend honestly for each room.",
  },
  {
    question: "Which areas around Yarra Glen do you cover?",
    answer: "Groutix regrouts across Yarra Glen, Christmas Hills, Dixons Creek, Steels Creek and Tarrawarra. Every locality listed on this page is in our service area and gets the same crew and the same standard, and quotes are free.",
  },
  {
    question: "We run a holiday stay. Can a leaking shower be fixed between guests?",
    answer: "Usually, yes. Most showers are finished in a single visit, so the work can be planned around your bookings instead of taking the bathroom out of action for weeks. Before we start, we tell you exactly when the shower can be used again.",
  },
  {
    question: "Can you regrout around the original tiles in an older farmhouse?",
    answer: "Yes. In older Yarra Glen homes we work joint by joint with care around original tiles, cut the failed grout out and rebuild it, so the tiling survives and looks like itself again. Tiles are only disturbed if one is already loose or drummy.",
  },
  {
    question: "How long does a shower regrout take?",
    answer: "Most showers are finished in a single visit, including homes where the ensuite and main bathroom are done together for a matching finish. Before we start, we tell you exactly when the shower can be used again, so there are no surprises.",
  },
  {
    question: "How long will a regrout last?",
    answer: "A proper regrout, where the old grout is fully removed and the joints are rebuilt, is made to last for years, and eligible complete shower regrouting is backed by our 10 year waterproof warranty. Surface jobs that smear new grout over old grout are the ones that fail early, which is why we never do them.",
  },
];

const serviceAreaText = `Yarra Glen sits on the Yarra River flats at the heart of the Yarra Valley, and its homes place their own demands on grout and silicone. Farmhouses and weatherboard cottages around the town, family homes along the Melba Highway corridor and newer builds at Tarrawarra all share the same pattern. Cold winters and warm summers expand and contract silicone seals until they split, valley damp feeds mould into porous cement grout, and daily use wears the base joints where the shower floor meets the walls.

The first question on any leaking shower in Yarra Glen is what has actually failed. Most leaks here are failed grout and perished silicone, and those are fixed by regrouting and resealing with the tiles left in place. Epoxy grout suits valley homes especially well because it is non porous, so damp and mould have nowhere to live and it never needs sealing. Cement grout with a penetrating sealer costs less and suits drier bathrooms. If the waterproofing membrane under the tiles has failed, regrouting alone will not stop the leak, and we will tell you that honestly before any work starts.

Our process is built to fix the cause, not cover it. The old grout is removed mechanically, never smeared over, because new grout over old grout cracks and fails within months. The joints are rebuilt with colour matched grout, and the corners and wall to floor junctions are resealed with flexible silicone, the way movement joints are meant to be done in homes that shift with the seasons. In most cases your tiles stay exactly where they are, and most showers are finished in a single visit.

Groutix covers shower regrouting, leaking shower repair, tile regrouting, epoxy grout, silicone recaulking and balcony regrouting across Yarra Glen, Christmas Hills, Dixons Creek, Steels Creek and Tarrawarra. The same service suits the family bathroom, the farmhouse ensuite and the guest bathroom in a holiday stay or rental property, where a leaking shower cannot wait for a full renovation.

Most standard single showers cost about $550 to $1,500 to regrout, and your exact price is quoted free before any work starts. Every complete job is backed by a 10 year waterproof warranty, and Groutix is rated 5.0 from 296 Google reviews. Find your suburb below or call (03) 7023 8094 for a free quote.`;

export default async function YarraglenPage() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <YarraGlenHubClient
        cityName="Yarra Glen"
        heroHeading="Shower Regrouting Yarra Glen"
        heroSubtitle="Cold valley winters, warm summers and homes that move with the seasons are hard on grout in Yarra Glen. We regrout leaking and mouldy showers across Yarra Glen, Christmas Hills, Dixons Creek, Steels Creek and Tarrawarra, tiles in place, with a 10 year waterproof warranty on eligible shower regrouting."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/balcony-centre-watermark.webp"
        heroImage="/dark-grey-shower-floor-regrouting.webp"
        suburbGroups={yarraglenSuburbs}
        parentSlug="yarra-glen"
        faqs={yarraGlenFaqs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}
