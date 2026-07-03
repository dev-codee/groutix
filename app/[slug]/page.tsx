import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/ServicePageTemplate";

const services: Record<string, {
  title: string;
  metaTitle: string;
  metaDesc: string;
  h1Desc: string;
  failHeading: string;
  failHeadingBlue: string;
  failText: string;
  fixHeading: string;
  fixHeadingBlue: string;
  fixText: string;
  pillars: { title: string; desc: string }[];
  processIntro: string;
  steps: { title: string; desc: string }[];
  workWithUsText: string;
  workWithUsBullets: string[];
  guaranteeText: string;
  faqs: { q: string; a: string }[];
}> = {

  "shower-regrouting": {
    title: "Shower Regrouting",
    metaTitle: "Shower Regrouting Specialists | GROUTIX Australia",
    metaDesc: "Professional shower regrouting that stops leaks and removes mould without tile removal. 10-year waterproof warranty. Book online or call 7023 8094.",
    h1Desc: "Shower regrouting is the most effective way to stop leaks, remove mould and restore the appearance of a tired shower without the expense or disruption of a full renovation. At GROUTIX, shower regrouting is our specialty — it's not just about how your shower looks, it's about protecting what's behind it.",
    failHeading: "When Shower Grout Fails,",
    failHeadingBlue: "Leaks Follow",
    failText: "Cracked, porous or deteriorated grout allows water ingress behind your shower tiles. Once moisture penetrates the grout lines, it can travel unseen behind walls and under floors, leading to leaks, mould growth, unpleasant odours and damage outside the bathroom.\n\nGrout acts like your bathroom's protective skin. When that barrier breaks down, the damage begins behind the scenes.\n\nMany homeowners attempt surface fixes such as silicone or sealers, but these only mask the issue temporarily. Without addressing the underlying grout failure, the problem continues and generally becomes more expensive and disruptive to repair the longer it's left untreated.",
    fixHeading: "Specialist Shower Regrouting That",
    fixHeadingBlue: "Fixes the Cause",
    fixText: "Our shower regrouting service is designed to address grout failure at the source, not just fix visible symptoms. We remove deteriorated grout throughout the shower, assess vulnerable areas such as wall junctions and shower floors, and regrout the shower to restore full waterproof integrity using proven methods and materials.\n\nRegrouting is your shower's first line of defence against leaks, mould and hidden structural damage. We don't rely on temporary sealers or cosmetic patches. Every shower regrout job involves removing and replacing grout across the shower using a structured process refined specifically for wet areas.",
    pillars: [
      { title: "Shower Specialists", desc: "We focus on showers, grout and wet areas — not general tiling or renovations." },
      { title: "Proven Regrouting Systems", desc: "Our methods are designed to prevent repeated grout failure using commercial-grade waterproof formulas." },
      { title: "Warranty Backing", desc: "Every shower regrouting job is supported by our 10-year waterproof guarantee." },
    ],
    processIntro: "We've refined our shower regrouting process to make fixing your shower efficient, straightforward and free from stress. Each step is focused on identifying why the grout has failed and delivering a durable, lasting solution.",
    steps: [
      { title: "Inspect & Assess", desc: "We inspect the shower grout, tiles, seals and floor to determine why the grout has failed and whether leaks are present." },
      { title: "Repair & Regrout", desc: "Failed grout is removed, affected areas are repaired and the shower is regrouted and resealed using materials designed for wet environments." },
      { title: "Finish & Guarantee", desc: "The shower is cleaned, finished and backed by our 10-year waterproof warranty for your complete peace of mind." },
    ],
    workWithUsText: "Choosing GROUTIX means working with a specialist team focused entirely on shower regrouting and wet area repairs. We provide clear advice, practical recommendations and workmanship designed to last. When we're done, your shower doesn't just look better — it's properly protected.",
    workWithUsBullets: [
      "High-quality materials suited for use in wet areas",
      "Efficient turnaround with minimal disturbance to your home",
      "Experienced technicians specialising in shower regrouting",
      "Clear advice and upfront recommendations",
      "10-year waterproof warranty on every full regrout",
      "Available in all major Australian capital cities",
    ],
    guaranteeText: "Every shower regrouting job completed by GROUTIX is backed by our industry-leading 10-year waterproof warranty. If water penetrates through our workmanship, we fix it with no questions asked. This guarantee reflects the confidence we have in our technicians, systems and materials.\n\nCombined with our specialised approach to shower repairs, it gives you peace of mind knowing your regrouting has been done properly and is built to last over time.",
    faqs: [
      { q: "How long does shower regrouting take?", a: "Most standard shower regrouting jobs are completed within 3 to 4 hours. Larger or more complex showers may take a full day." },
      { q: "How long before I can use the shower?", a: "We recommend waiting 24 hours after completion to allow the grout and silicone sealants to cure fully." },
      { q: "Do you match the existing grout colour?", a: "Yes. We carry a wide range of grout shades — white, off-white, light grey, dark grey and charcoal — to match your existing tiles as closely as possible." },
      { q: "Will you need to remove my tiles?", a: "No. Shower regrouting is a non-invasive process. We remove only the grout between tiles, not the tiles themselves." },
      { q: "What areas do you service?", a: "We operate in Perth, Melbourne, Sydney, Brisbane, Adelaide, Geelong and surrounding regions." },
    ],
  },

  "leaking-shower-repair": {
    title: "Leaking Shower Repair",
    metaTitle: "Leaking Shower Repair | Stop Leaks Without Retiling | GROUTIX",
    metaDesc: "Fix your leaking shower permanently without removing tiles. GROUTIX locates leaks and seals them with a 10-year waterproof warranty.",
    h1Desc: "A leaking shower is more than a nuisance — left unrepaired, water behind your tiles can rot wall studs, damage sub-floors and cost thousands in structural repairs. GROUTIX specialises in stopping shower leaks at the source, without tile removal or a full bathroom renovation.",
    failHeading: "Shower Leaks Cause",
    failHeadingBlue: "Serious Hidden Damage",
    failText: "When grout and silicone sealants fail, water finds its way behind your tiles. It travels silently through wall cavities, under floors and into ceiling spaces below. By the time water staining appears on adjacent walls or below the bathroom, significant structural damage has usually already occurred.\n\nSurface patches and cheap sealers only delay the problem. Without removing the failed grout and resealing the shower properly, moisture will continue to penetrate and the damage will escalate.",
    fixHeading: "Leaking Shower Repairs That",
    fixHeadingBlue: "Solve the Root Cause",
    fixText: "Our leaking shower repair service identifies where water is getting in and fixes it permanently — without tile removal. We strip out failed grout and sealants, prepare the surfaces correctly and regrout the shower using waterproof materials designed specifically for wet areas.\n\nWe don't apply surface sealers over failing grout. We remove the problem entirely and restore the shower's waterproof barrier from the ground up, giving you a properly repaired shower backed by a 10-year warranty.",
    pillars: [
      { title: "Leak Detection", desc: "We inspect the shower base, walls, corners and screen to pinpoint exactly where water is penetrating." },
      { title: "Non-Invasive Repair", desc: "We seal leaks by removing and replacing grout and silicone — no tile demolition, no mess, no retiling costs." },
      { title: "10-Year Warranty", desc: "All leaking shower repairs are backed by our industry-leading waterproof guarantee for long-term protection." },
    ],
    processIntro: "Our leaking shower repair process is systematic and efficient, targeting the actual failure points rather than applying cosmetic fixes.",
    steps: [
      { title: "Diagnose & Locate", desc: "We inspect grout lines, corner joints, shower floor and drain areas to identify every leak entry point." },
      { title: "Strip & Prepare", desc: "All failed grout and sealants are removed, surfaces are cleaned and prepared for new materials." },
      { title: "Regrout & Reseal", desc: "We apply waterproof grout throughout the shower and seal all corners with flexible sanitary silicone." },
    ],
    workWithUsText: "Our team specialises entirely in shower repairs and wet area resealing. We provide an honest assessment of what's actually causing your leak and a clear, fixed-price quote to fix it properly — no unnecessary upselling, no surprises.",
    workWithUsBullets: [
      "Accurate leak diagnosis before any work begins",
      "No tile removal required in the vast majority of cases",
      "Commercial-grade waterproof grout and sealants",
      "Fixed-price quotes with no hidden charges",
      "10-year waterproof warranty on completed repairs",
      "Fast turnaround — most jobs completed in one visit",
    ],
    guaranteeText: "All leaking shower repairs completed by GROUTIX are backed by our 10-year waterproof warranty. If the leak returns through our workmanship, we'll return and fix it at no charge.\n\nWe use flexible polyurethane sealants and epoxy-modified waterproof grouts that accommodate building movement, preventing future seal failure and keeping your shower watertight long-term.",
    faqs: [
      { q: "Can you fix the leak without removing tiles?", a: "Yes. In the vast majority of cases, shower leaks are caused by failed grout or silicone — both of which we repair without removing any tiles." },
      { q: "What if it's a plumbing leak behind the wall?", a: "If the leak is from internal pipes, you'll need a licensed plumber. We specialise in fixing leaks caused by grout and sealant failure at the tile surface." },
      { q: "How quickly can you attend?", a: "We aim to inspect and quote within 1–3 business days of your enquiry. Repairs are usually scheduled shortly after quote approval." },
      { q: "Does the leak need to be active to be diagnosed?", a: "No. We can assess your shower's condition visually and identify failure points even when the leak is intermittent." },
    ],
  },

  "shower-base-repair": {
    title: "Shower Base Repair",
    metaTitle: "Shower Base Repair Specialists | GROUTIX Australia",
    metaDesc: "Repair damaged shower bases, cracked pans and leaking shower floors without full demolition. Durable waterproof restoration backed by a 10-year warranty.",
    h1Desc: "A damaged shower base can lead to leaks, mould and hidden structural damage long before the tiles show the first obvious signs. GROUTIX repairs shower bases with specialist waterproof systems to restore a strong, watertight floor without a full demolition.",
    failHeading: "A Failing Shower Base",
    failHeadingBlue: "Can Leak Everywhere",
    failText: "When the shower base is cracked, chipped or poorly formed, water can escape beneath tiles and into the wall cavity, floor structure and the apartment below. Hidden failures often begin in the tile bed, drain area or base substrate — and by the time surface tiles look damp or discoloured, the base may already be compromised.\n\nSuperficial sealers and patch repairs usually fail because they don't fix the underlying base. A shower base repair must restore the substrate and waterproof barrier so the shower can perform reliably again.",
    fixHeading: "Shower Base Repairs That",
    fixHeadingBlue: "Restore The Floor",
    fixText: "Our shower base repair service fixes the substrate beneath the tiles, repairs cracks and tray edges, and reinstates a continuous waterproof barrier. We inspect the base, remove damaged areas where needed, repair the surface with engineered materials and then regrout or reseal the shower floor for long-term protection.\n\nThis service is ideal when the shower floor is still structurally sound overall but the base has failed in one or more spots. We avoid full demolition by targeting the defective areas and restoring the base from the inside out.",
    pillars: [
      { title: "Substrate Repair", desc: "We repair the shower base itself — not just the grout or tiles — so leaks don't return." },
      { title: "Waterproof Reinstatement", desc: "Our base repairs restore the waterproof layer and support the tile bed for durable performance." },
      { title: "No Full Demolition", desc: "We aim to fix the base without ripping out the shower, saving time, cost and disruption." },
    ],
    processIntro: "Our shower base repair process is designed to identify the exact cause of the floor failure and restore the shower for lasting waterproof protection.",
    steps: [
      { title: "Diagnose & Inspect", desc: "We inspect the shower floor, drain connection, tile bed and base substrate to locate cracks, voids and weak spots." },
      { title: "Repair Base & Membrane", desc: "Damaged screed, tray edges and cracks are repaired with engineered waterproof base compounds and flexible membranes." },
      { title: "Regrout & Seal", desc: "Once the base is restored, we regrout the floor, reseal around the drain and apply a final waterproof finish." },
    ],
    workWithUsText: "GROUTIX specialises in shower repairs that start at the base. We deliver structural shower floor repairs with waterproof materials, clear scope and a warranty that covers the underlying waterproofing — not just a surface patch.",
    workWithUsBullets: [
      "Specialist base repair for shower floors and tiled wet areas",
      "Crack and tray-edge repairs without full shower demolition",
      "Waterproof materials designed to bond to existing bases",
      "Professional drain reinstatement and tile bed support",
      "Fast, local service with minimal disruption",
      "10-year waterproof warranty on completed base repairs",
    ],
    guaranteeText: "Shower base repairs completed by GROUTIX are backed by our 10-year waterproof warranty. If any base failure causes leakage through our workmanship, we return and fix it at no extra charge.\n\nOur approach repairs the substrate and restores the shower floor's waterproof barrier, so your shower works as it should for years to come.",
    faqs: [
      { q: "Can you repair a cracked shower base without replacing tiles?", a: "Yes. Many shower base failures can be repaired from the existing tile surface by accessing the base, repairing cracks or voids, and reinstating the waterproof layer." },
      { q: "Will I need to leave the house during the repair?", a: "Most shower base repairs are completed in one visit, and you can stay in your home while we work. We keep the work area clean and separate from living spaces." },
      { q: "How long until the shower can be used again?", a: "We typically recommend waiting 24–48 hours after repairs to allow waterproof compounds and grout to cure fully." },
      { q: "What if the drain is leaking?", a: "We inspect the drain connection as part of the repair. If the leak is at the drain or junction, we repair the base and re-seal the connection to stop water escaping." },
    ],
  },

  "tile-regrouting": {
    title: "Tile Regrouting",
    metaTitle: "Tile Regrouting | GROUTIX Australia",
    metaDesc: "Restore stained, cracked and discoloured grout on tiled floors and walls. Kitchen, laundry, balcony and bathroom tile regrouting across Australia.",
    h1Desc: "Grout lines on floors and walls in high-use areas absorb years of grime, grease and cleaning chemicals, becoming permanently stained and difficult to clean. Our tile regrouting service removes the discoloured grout and replaces it with fresh, durable grout — transforming the appearance of your tiled surfaces without retiling.",
    failHeading: "Stained & Cracked Grout",
    failHeadingBlue: "Ruins the Look of Your Tiles",
    failText: "Floor and wall grout is porous. In kitchens, it absorbs cooking grease and food residues. In bathrooms, it absorbs soap scum, mould and cleaning chemicals. Over time, the grout becomes permanently discoloured — no amount of scrubbing will restore it to its original colour.\n\nCracked grout on outdoor balconies and wet areas also allows water to penetrate beneath tiles, dissolving the adhesive and eventually causing tiles to become loose, drum-like and unsafe.",
    fixHeading: "Tile Regrouting That",
    fixHeadingBlue: "Transforms Your Tiled Surfaces",
    fixText: "We remove the stained or damaged grout layer using specialist raking equipment and replace it with fresh, commercial-grade grout in your choice of colour. The result is a completely transformed surface that looks newly tiled — without the cost or disruption of full retiling.\n\nWe service kitchens, bathrooms, laundries, hallways, balconies and outdoor entertaining areas.",
    pillars: [
      { title: "Stain Removal", desc: "Fresh grout completely eliminates permanently stained, greasy or discoloured lines that can't be scrubbed clean." },
      { title: "Durable Results", desc: "We use high-strength polymer-modified grout formulas designed for high-traffic areas and wet environments." },
      { title: "Colour Options", desc: "Choose from a wide range of grout colours to refresh or completely change the look of your tiled surfaces." },
    ],
    processIntro: "Our tile regrouting process is methodical and clean, minimising dust and disruption while delivering outstanding results.",
    steps: [
      { title: "Joint Raking", desc: "We remove the old grout layer using professional dust-minimising raking equipment." },
      { title: "Vacuum & Clean", desc: "All dust and debris is thoroughly vacuumed from the joint channels before new grout is applied." },
      { title: "Regrout & Polish", desc: "Fresh grout is packed into joints and tiles are sponge-cleaned to a spotless, polished finish." },
    ],
    workWithUsText: "We restore tiled floors and walls in kitchens, bathrooms, laundries and outdoor areas across Australia. Our process is designed to deliver results that look like new tiles, without the cost of a full retile.",
    workWithUsBullets: [
      "Specialist dust-minimising joint raking equipment",
      "High-strength polymer-modified grout formulations",
      "Wide range of grout colours available",
      "Indoor and outdoor areas serviced",
      "Kitchen, laundry, balcony and bathroom tiles all covered",
      "Professional sponge clean of all tiles after grouting",
    ],
    guaranteeText: "Our tile regrouting uses high-strength, commercial-grade grout that provides excellent durability and colour consistency for years. We guarantee the quality of our workmanship and ensure every joint is correctly packed and finished before leaving your home.",
    faqs: [
      { q: "Can you change the colour of my grout?", a: "Yes. We can apply a completely different grout colour when regrouting, giving your tiled surfaces a fresh, updated look." },
      { q: "Is the process dusty?", a: "We use dust-minimising equipment and vacuum all debris as we work to keep your home clean." },
      { q: "Can you regrout balcony and outdoor tiles?", a: "Yes. We service outdoor balconies, alfresco areas and pool surrounds with weatherproof grout formulas." },
      { q: "How long does floor regrouting take?", a: "This depends on the area size. A standard kitchen floor typically takes half a day. We'll provide a time estimate with your quote." },
    ],
  },

  "real-estate-property-services": {
    title: "Real Estate & Property Services",
    metaTitle: "Grout & Shower Repairs for Property Managers | GROUTIX",
    metaDesc: "Fast shower regrouting, leak repair and silicone resealing for real estate agents, landlords and body corporates. Fixed-price quotes. 10-year warranty.",
    h1Desc: "Shower leaks in rental properties are one of the most common — and most damaging — maintenance issues landlords face. GROUTIX provides fast, professional shower repair services that protect your investment, satisfy tenants and meet property management timelines, backed by a 10-year waterproof warranty.",
    failHeading: "Unreported Shower Leaks",
    failHeadingBlue: "Damage Rental Investments",
    failText: "Tenants often don't report slow shower leaks until water damage becomes visible on adjacent walls, ceilings below or floor surfaces. By that point, structural rot, mould remediation and potential repainting can turn a simple $500 grout repair into a $5,000+ job.\n\nRegular bathroom maintenance — particularly regrouting and silicone resealing — is the most cost-effective way to protect rental property from water damage claims.",
    fixHeading: "Property Maintenance Solutions That",
    fixHeadingBlue: "Protect Your Investment",
    fixText: "We provide fast-response shower regrouting, leaking shower repair and silicone resealing for rental properties across Australia. We coordinate directly with tenants to arrange access, provide written fixed-price quotes for landlord approval and issue 10-year waterproof warranties on all completed work.\n\nOur service is designed to work within standard property management workflows, making the process as seamless as possible for both agents and landlords.",
    pillars: [
      { title: "Fast Turnaround", desc: "We prioritise rental property requests to inspect and repair shower leaks before they escalate into major damage." },
      { title: "Tenant Coordination", desc: "We contact tenants directly to arrange access, saving property managers time and simplifying the process." },
      { title: "Written Fixed Quotes", desc: "Clear, itemised fixed-price quotes emailed directly for landlord approval — no hidden charges." },
    ],
    processIntro: "Our property services process is designed to fit seamlessly within standard property management workflows.",
    steps: [
      { title: "Work Order Received", desc: "Submit a work order with tenant contact details. We handle the rest." },
      { title: "Inspect & Quote", desc: "We attend the property, assess the shower and provide a written fixed-price quote within 24 hours." },
      { title: "Repair & Warrant", desc: "Upon approval, we complete the work and issue a 10-year waterproof warranty for your records." },
    ],
    workWithUsText: "We work with leading real estate agencies, strata managers and private landlords throughout Australia. Our streamlined system makes rental property bathroom maintenance simple, transparent and stress-free.",
    workWithUsBullets: [
      "Fast-response attendance for urgent leak situations",
      "Direct tenant communication to arrange access",
      "Written fixed-price quotes emailed within 24 hours",
      "10-year waterproof warranty issued on completion",
      "Experience working with major property management groups",
      "Invoice directly to agency trust accounts on request",
    ],
    guaranteeText: "All shower regrouting and leak repair work completed for rental properties is backed by our 10-year waterproof warranty — giving landlords long-term protection and reducing the likelihood of repeat maintenance call-outs for the same issue.",
    faqs: [
      { q: "Can you invoice the agency trust account?", a: "Yes. We can arrange invoicing through your agency's preferred billing process upon job completion." },
      { q: "Do you provide condition reports or job photos?", a: "Yes. We can provide before-and-after photos and written job summaries for your property records." },
      { q: "What if the tenant is uncooperative with access?", a: "We'll work with you to arrange access in line with the tenant's rights. We're experienced in coordinating around tenancy requirements." },
      { q: "Do you work with strata and body corporates?", a: "Yes. We regularly work in multi-residential apartment buildings and common-area wet areas for strata bodies." },
    ],
  },

  "small-tiling-jobs": {
    title: "Small Tiling Jobs",
    metaTitle: "Minor Tile Repairs & Grout Patching | GROUTIX",
    metaDesc: "Cracked tiles, loose tiles and grout patching. Professional minor tiling repairs for bathrooms, kitchens, laundries and floors across Australia.",
    h1Desc: "A single cracked tile or a patch of missing grout might seem minor, but left unrepaired it can let water under the tile and compromise the waterproofing of the entire surface. GROUTIX provides expert minor tile repair and grout patching services — replacing individual tiles, re-securing loose tiles and patching grout to a professional finish.",
    failHeading: "Damaged Tiles Left Unrepaired",
    failHeadingBlue: "Lead to Bigger Problems",
    failText: "A cracked tile creates a direct pathway for water to reach the tile adhesive and waterproof membrane beneath. Once water gets in, the adhesive dissolves, causing surrounding tiles to become loose and hollow-sounding — what tilers call 'drummy' tiles. Over time, multiple tiles lift and the repair cost grows.\n\nSimilarly, missing or cracked grout patches in shower floors and wet areas allow water ingress that leads to subfloor damage, mould and structural rot.",
    fixHeading: "Minor Tile Repairs Completed to a",
    fixHeadingBlue: "Professional Standard",
    fixText: "We replace cracked or damaged tiles using your existing spare tiles, re-glue loose tiles that have lifted off the wall or floor, and patch missing or deteriorated grout sections to blend seamlessly with the surrounding area.\n\nAll minor tile work is completed with the same waterproof grout and silicone sealants we use in our full shower regrouting service — ensuring a watertight result, not just a cosmetic patch.",
    pillars: [
      { title: "Individual Tile Replacement", desc: "We replace broken or cracked tiles using your spare tiles for a seamless, colour-matched repair." },
      { title: "Loose Tile Re-Securing", desc: "We lift, clean and re-lay hollow or loose tiles with fresh adhesive and regrout the joints." },
      { title: "Grout Patching", desc: "We patch damaged, missing or crumbling grout sections and match the colour to the surrounding grout." },
    ],
    processIntro: "Our tile repair process is careful and precise, ensuring repairs blend naturally with the surrounding tiled surface.",
    steps: [
      { title: "Assess the Damage", desc: "We inspect the damaged tile and surrounding area to check for water ingress and substrate damage." },
      { title: "Remove & Prepare", desc: "We carefully remove the broken tile or lift the loose tile and prepare the substrate for rebonding." },
      { title: "Re-Lay & Regrout", desc: "We set the tile with fresh adhesive, regrout the joints and seal corners where required." },
    ],
    workWithUsText: "We handle small and minor tile repairs across Australia with the same care and quality as our full regrouting services. Every repair is finished to a professional standard with waterproof materials — not cosmetic patching.",
    workWithUsBullets: [
      "Replacement of individual cracked or broken tiles",
      "Re-securing of loose, hollow or drummy tiles",
      "Grout patching to match surrounding colour",
      "Waterproof grout and silicone used on all repairs",
      "Clean, careful work — no unnecessary tile removal",
      "Available in all major Australian cities",
    ],
    guaranteeText: "Minor tile repairs are completed to professional standards using the same waterproof materials we use in our full shower regrouting service. We ensure every repaired tile is level, securely bonded and properly sealed against future water ingress.",
    faqs: [
      { q: "Do you supply the replacement tiles?", a: "We ask that you supply spare matching tiles as dye lots and production runs vary. We supply all adhesive, grout and silicone." },
      { q: "Can you secure a loose tile without replacing it?", a: "Often, yes. If the tile is undamaged, we can lift it, clean the back, apply fresh adhesive and re-lay it securely." },
      { q: "Can you patch just a small section of missing grout?", a: "Yes. Grout patching is one of our core services — we match the colour as closely as possible to the surrounding grout." },
      { q: "What if the substrate is damaged?", a: "If we find water damage or deterioration to the backing board behind a tile, we'll discuss repair options with you before proceeding." },
    ],
  },

};

export async function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = services[slug];
  if (!s) return {};
  return { title: s.metaTitle, description: s.metaDesc };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const s = services[slug];
  if (!s) notFound();

  return (
    <ServicePageTemplate
      title={s.title}
      slug={slug}
      h1Desc={s.h1Desc}
      failHeading={s.failHeading}
      failHeadingBlue={s.failHeadingBlue}
      failText={s.failText}
      fixHeading={s.fixHeading}
      fixHeadingBlue={s.fixHeadingBlue}
      fixText={s.fixText}
      pillars={s.pillars}
      processIntro={s.processIntro}
      steps={s.steps}
      workWithUsText={s.workWithUsText}
      workWithUsBullets={s.workWithUsBullets}
      guaranteeText={s.guaranteeText}
      faqs={s.faqs}
    />
  );
}
