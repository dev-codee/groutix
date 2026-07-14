const fs = require('fs');
const path = require('path');

const regions = [
  {
    slug: 'frankston',
    name: 'Frankston',
    suburbs: [
      {
        title: "Local Frankston Suburbs",
        suburbs: ["Frankston Central", "Frankston North", "Frankston South", "Karingal", "Langwarrin", "Seaford"]
      },
      {
        title: "Connecting Suburbs (Towards Lilydale)",
        suburbs: ["Beaconsfield", "Berwick", "Clyde", "Cranbourne", "Harkaway", "Officer"]
      }
    ]
  },
  {
    slug: 'lilydale',
    name: 'Lilydale',
    suburbs: [
      {
        title: "Local Lilydale Suburbs",
        suburbs: ["Chirnside Park", "Coldstream", "Lilydale Central", "Mooroolbark", "Mount Evelyn"]
      },
      {
        title: "Connecting Suburbs (From Frankston Route)",
        suburbs: ["Emerald", "Macclesfield", "Monbulk", "Silvan"]
      },
      {
        title: "Connecting Suburbs (From Kilmore Route)",
        suburbs: ["Doreen", "Hurstbridge", "Kangaroo Ground", "Nutfield", "Watsons Creek"]
      }
    ]
  },
  {
    slug: 'kilmore',
    name: 'Kilmore',
    suburbs: [
      {
        title: "Local Kilmore Suburbs",
        suburbs: ["Bylands", "Hidden Valley", "Kilmore Central", "Kilmore East", "Wandong", "Willowmavin"]
      },
      {
        title: "Connecting Suburbs (Towards Lilydale)",
        suburbs: ["Eden Park", "Wallan", "Whittlesea", "Yan Yean"]
      },
      {
        title: "Connecting Suburbs (Towards Ballarat)",
        suburbs: ["Hesket", "Lancefield", "Romsey", "Tylden", "Woodend"]
      }
    ]
  },
  {
    slug: 'ballarat',
    name: 'Ballarat',
    suburbs: [
      {
        title: "Local Ballarat Suburbs",
        suburbs: ["Alfredton", "Ballarat Central", "Ballarat East", "Ballarat North", "Black Hill", "Buninyong", "Delacombe", "Eureka", "Mount Clear", "Mount Helen", "Redan", "Sebastopol", "Wendouree"]
      },
      {
        title: "Connecting Suburbs (Towards Kilmore)",
        suburbs: ["Creswick", "Daylesford", "Newlyn"]
      },
      {
        title: "Connecting Suburbs (Towards Geelong)",
        suburbs: ["Clarendon", "Elaine"]
      }
    ]
  },
  {
    slug: 'yarra-glen',
    name: 'Yarra Glen',
    suburbs: [
      {
        title: "Local Yarra Glen Suburbs",
        suburbs: ["Christmas Hills", "Dixons Creek", "Steels Creek", "Tarrawarra", "Yarra Glen Central"]
      }
    ]
  }
];

const appDir = path.join(__dirname, '..', 'app', 'locations');

regions.forEach(region => {
  const regionDir = path.join(appDir, region.slug);
  const suburbDir = path.join(regionDir, '[suburb]');
  
  fs.mkdirSync(regionDir, { recursive: true });
  fs.mkdirSync(suburbDir, { recursive: true });

  const suburbsJson = JSON.stringify(region.suburbs, null, 2);

  const pageContent = `import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CityPageClient from "@/app/locations/CityPageClient";
import type { SuburbGroup } from "@/app/locations/CityPageClient";
import { getReviews, getBusinessRating } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shower Regrouting ${region.name} | Groutix",
  description:
    "Professional shower regrouting, grout repair and leaking shower solutions across ${region.name}. Groutix services homes and apartments throughout ${region.name} with a 10-year waterproof warranty.",
  alternates: { canonical: "/locations/${region.slug}" },
  openGraph: {
    title: "Shower Regrouting ${region.name} — Groutix",
    description:
      "${region.name} shower regrouting, grout repair and leaking shower services with specialist workmanship and free quotes.",
    url: "/locations/${region.slug}",
    type: "website",
  },
};

const ${region.slug.replace(/-/g, '')}Suburbs: SuburbGroup[] = ${suburbsJson};

const serviceAreaText = \`${region.name} properties place heavy demands on grout joints, silicone seals and shower waterproofing. From older homes to new developments, worn grout and leaking shower bases are common issues that can quickly lead to hidden moisture damage.

Groutix services the full ${region.name} region with specialist shower regrouting, leaking shower repair, silicone replacement and tile restoration. In most cases, we repair the failed grout and sealing system without removing the existing tiles, helping you avoid the cost of a full bathroom renovation.

Cold winters, condensation, daily use and natural movement all contribute to grout cracking and seal breakdown across ${region.name} bathrooms. Our team focuses on resolving the source of the problem so your shower is restored properly, not just cosmetically improved.

Every quote is clear, every repair is completed with long-term performance in mind, and full shower regrouting work is backed by a 10-year waterproof warranty. Book Groutix for specialist grout and shower repairs across ${region.name}.\`;

export default async function ${region.slug.replace(/-/g, '').replace(/^[a-z]/, (m) => m.toUpperCase())}Page() {
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return (
    <>
      <Navbar />
      <CityPageClient
        cityName="${region.name}"
        heroHeading="Shower Regrouting & Grout Repair Specialists ${region.name}"
        heroSubtitle="Groutix provides specialist shower regrouting, grout repair and leaking shower services across ${region.name}. We restore failed grout lines, worn seals and wet-area waterproofing issues without unnecessary tile removal."
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={${region.slug.replace(/-/g, '')}Suburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
      />
      <Footer />
    </>
  );
}
`;

  const suburbContent = `import type { Metadata } from "next";
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
    title: \`Shower Regrouting \${name} | ${region.name} | GROUTIX\`,
    description: \`Specialist shower regrouting, grout repair and leaking shower services in \${name}, ${region.name}. Professional wet-area repairs backed by a 10-year waterproof warranty.\`,
    alternates: { canonical: \`/locations/${region.slug}/\${suburb}\` },
    openGraph: {
      title: \`Shower Regrouting \${name} | ${region.name} — GROUTIX\`,
      description: \`Local shower regrouting, grout repair and leaking shower solutions in \${name}, ${region.name}. Free quotes and specialist workmanship.\`,
      url: \`/locations/${region.slug}/\${suburb}\`,
      type: "website",
    },
  };
}

const ${region.slug.replace(/-/g, '')}Suburbs: SuburbGroup[] = ${suburbsJson};

function getSuburbExplanation(suburb: string): string {
  return \`\${suburb} includes a mix of established homes, renovated bathrooms and newer residential developments, all of which can develop grout wear and wet-area sealing issues over time. As bathrooms age, cracked grout joints and tired silicone often become the first signs that moisture is getting where it should not.

In \${suburb}, everyday use, seasonal movement and ongoing exposure to steam and water can lead to leaking showers, stained grout lines and hidden dampness behind tiled surfaces. Early repair work is the best way to avoid more extensive water damage and keep the bathroom functioning properly.

GROUTIX provides specialist grout repair, shower regrouting, leaking shower repair and silicone replacement across \${suburb}. Our team restores tiled wet areas without unnecessary demolition, with full shower regrouting work backed by a 10-year waterproof warranty.\`;
}

export default async function SuburbPage({ params }: Props) {
  const { suburb } = await params;
  const suburbName = formatSuburbName(suburb);
  const [reviews, rating] = await Promise.all([getReviews(4), getBusinessRating()]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const explanation = getSuburbExplanation(suburbName);

  const serviceAreaText = \`GROUTIX provides shower regrouting, grout repair, silicone replacement and leaking shower repairs across \${suburbName} and the greater ${region.name} region. We target failed grout joints and worn seals without turning a repair into a full renovation.

Bathrooms in \${suburbName} commonly develop cracked grout, mouldy joints and failed silicone as surfaces age and building movement takes its toll. Addressing these issues early helps protect the substrate behind the tiles and keeps shower areas watertight.

Our specialist team delivers practical wet-area repairs with quality materials, clear advice and workmanship focused on long-term performance. Full shower regrouting work is backed by a 10-year waterproof warranty.\`;

  return (
    <>
      <Navbar />
      <CityPageClient
        cityName={suburbName}
        heroHeading={\`Shower Regrouting & Grout Repair in \${suburbName}\`}
        heroSubtitle={\`Professional shower regrouting, grout repair and leaking shower services in \${suburbName}, ${region.name}. GROUTIX restores wet areas without unnecessary tile removal and backs full shower regrouting with a 10-year waterproof warranty.\`}
        serviceAreaText={serviceAreaText}
        serviceAreaMapImage="/img21.jpeg"
        heroImage="/img20.jpeg"
        suburbGroups={${region.slug.replace(/-/g, '')}Suburbs}
        reviews={reviews}
        rating={rating}
        googleMapsApiKey={apiKey}
        locationExplanation={explanation}
      />
      <Footer />
    </>
  );
}
`;

  fs.writeFileSync(path.join(regionDir, 'page.tsx'), pageContent, 'utf-8');
  fs.writeFileSync(path.join(suburbDir, 'page.tsx'), suburbContent, 'utf-8');
});

console.log('Successfully generated all location pages.');
