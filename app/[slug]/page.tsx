import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { getReviews } from "@/lib/reviews";
import { faqJsonLd } from "@/lib/seo";

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
  fixBlueBoxText?: string;
  workWithUsBlueBoxText?: string;
  processBlueText?: string;
  heroTitle?: string;
  heroCards?: { title: string; desc: string }[];
  trustedText?: string;
}> = {

  "shower-regrouting": {
    title: "Shower Regrouting",
    metaTitle: "Shower Regrouting Services Victoria | Groutix",
    metaDesc: "Professional shower regrouting in Victoria. Remove mould, stop leaks and refresh your bathroom without a full renovation. Get a free quote today.",
    h1Desc: "Tired, cracked or mouldy grout can make even a clean shower look tired and unhygienic. Groutix specialises in professional shower regrouting across Victoria, removing old, deteriorated grout and replacing it with a durable, mould-resistant finish. Our regrouting service restores the look of your shower without the cost or mess of a full renovation, while helping prevent water damage to the walls and subfloor behind your tiles. Whether it's a few problem areas or a full regrout, we deliver a clean, watertight result that lasts.",
    failHeading: "When Shower Grout Fails,",
    failHeadingBlue: "Leaks Follow",
    failText: "Cracked, porous or worn grout lets water move beyond the tile surface and into vulnerable parts of the shower. Once moisture gets into wall junctions, corners or floor areas, it can contribute to leaks, mould, odours and damage outside the bathroom.\n\nGrout is part of the shower's protective system. When the joints start failing, the risk is not just cosmetic staining, it is the potential for hidden moisture issues to keep spreading.\n\nSurface coatings and quick touch-ups may improve the appearance for a short time, but they do not solve underlying grout failure. Proper repair starts with removing deteriorated material and rebuilding the grout system correctly.",
    fixHeading: "Specialist Shower Regrouting That",
    fixHeadingBlue: "Fixes the Cause",
    fixText: "Our shower regrouting service is built to address failed grout properly, not just improve the way the shower looks. We remove deteriorated grout, assess vulnerable areas such as corners and floor joints, and regrout the shower using materials suited to high-moisture environments.\n\nRather than relying on temporary sealers or cosmetic patching, we rebuild the grout lines through a structured wet-area repair process. The result is a cleaner, stronger and better protected shower surface.",
    pillars: [
      { title: "Shower Specialists", desc: "We focus on showers, grout lines and wet-area repairs rather than general renovation work." },
      { title: "Purpose-Built Repair Systems", desc: "Our regrouting method is designed for durability in bathrooms and other high-moisture areas." },
      { title: "Warranty Backing", desc: "Full shower regrouting work is supported by our 10-year waterproof warranty." },
    ],
    processIntro: "Our shower regrouting process is designed to make grout restoration clear, efficient and durable. Each step focuses on removing failed material and restoring the shower properly.",
    steps: [
      { title: "Inspect & Assess", desc: "We inspect the grout lines, tile joints, corners and floor areas to understand the condition of the shower." },
      { title: "Remove & Regrout", desc: "Failed grout is removed, repair areas are prepared and the shower is regrouted and resealed using wet-area materials." },
      { title: "Finish & Protect", desc: "The shower is cleaned, checked and backed by our 10-year waterproof warranty on full shower regrouting work." },
    ],
    workWithUsText: "Choosing Groutix means working with a team focused on shower regrouting and wet-area repairs every day. We provide practical advice, clear repair scope and workmanship designed to improve both appearance and long-term performance.",
    workWithUsBullets: [
      "Wet-area grout systems selected for long-term durability",
      "Efficient repair turnaround with minimal disruption",
      "Technicians experienced in shower regrouting and grout failure",
      "Clear recommendations based on the condition of the shower",
      "10-year waterproof warranty on full shower regrouting",
      "Servicing Victoria",
    ],
    guaranteeText: "Full shower regrouting work completed by Groutix is backed by our 10-year waterproof warranty. If water returns due to our workmanship, we will come back and rectify it.\n\nWe use specialist grout and sealing materials designed for wet areas to help manage movement, reduce future joint failure and keep the shower performing properly long term.",
    faqs: [
      { q: "How long does shower regrouting take?", a: "Most standard shower regrouting jobs are completed within 3 to 4 hours. Larger or more complex showers may take a full day." },
      { q: "How long before I can use the shower?", a: "We recommend waiting 24 hours after completion to allow the grout and silicone sealants to cure fully." },
      { q: "Do you match the existing grout colour?", a: "Yes. We carry a wide range of grout shades — white, off-white, light grey, dark grey and charcoal — to match your existing tiles as closely as possible." },
      { q: "Will you need to remove my tiles?", a: "No. Shower regrouting is a non-invasive process. We remove only the grout between tiles, not the tiles themselves." },
      { q: "What areas do you service?", a: "We service Victoria." },
    ],
  },

  "leaking-shower-repair": {
    title: "Leaking Shower Repair",
    metaTitle: "Leaking Shower Repairs Victoria | Fast, Reliable Fix | Groutix",
    metaDesc: "Stop a leaking shower before it causes serious damage. Groutix offers prompt, professional leaking shower repairs in Victoria.",
    h1Desc: "A leaking shower is one of the most frequent causes of hidden water damage in Australian homes. Groutix provides fast, reliable leaking shower repairs, pinpointing the exact cause — whether it's failed grout, silicone, waterproofing or the shower base itself — and fixing it properly the first time. Catching and repairing a shower leak early can save you thousands in potential structural or mould remediation costs.",
    failHeading: "Shower Leaks Cause",
    failHeadingBlue: "Serious Hidden Damage",
    failText: "When grout joints and silicone seals break down, water can move behind the tiles and into the structure around the shower. It may travel through walls, floors and ceilings before obvious staining appears, which is why leaking showers often cause more damage than homeowners expect.\n\nQuick patches and low-grade sealers usually only slow the problem down. Unless the failed grout and sealing system are removed and restored properly, moisture will keep getting into the wet area.",
    fixHeading: "Leaking Shower Repairs That",
    fixHeadingBlue: "Solve the Root Cause",
    fixText: "Our leaking shower repair service focuses on the real failure points, whether that is deteriorated grout, broken corner seals or compromised wet-area joints. We remove failed materials, prepare the surfaces correctly and restore the shower with waterproof products designed for bathrooms.\n\nInstead of sealing over the symptom, we rebuild the affected grout and sealing system so the shower is properly repaired and better protected against future water ingress.",
    pillars: [
      { title: "Leak Detection", desc: "We inspect the shower base, walls, corners and junctions to identify where moisture is entering." },
      { title: "Targeted Repair", desc: "We remove failed grout and seals so the shower can be restored without unnecessary tile demolition." },
      { title: "10-Year Warranty", desc: "Completed leaking shower repairs are backed by our waterproof workmanship warranty." },
    ],
    processIntro: "Our leaking shower repair process is methodical and focused on the actual moisture entry points rather than surface-level fixes.",
    steps: [
      { title: "Diagnose & Locate", desc: "We inspect grout lines, corners, the shower floor and other likely entry points for moisture." },
      { title: "Strip & Prepare", desc: "Failed grout and sealants are removed and the wet area is cleaned and prepared for restoration." },
      { title: "Regrout & Reseal", desc: "We rebuild the grout and corner sealing system with waterproof materials suited to shower environments." },
    ],
    workWithUsText: "Our team specialises in shower repairs and wet-area resealing, so we can assess leaking showers with a clear understanding of how grout and seal failure develops. We explain the issue plainly and recommend a repair scope that matches the problem.",
    workWithUsBullets: [
      "Accurate diagnosis before repair work begins",
      "No tile removal required in the vast majority of cases",
      "Waterproof grout and sealants designed for wet areas",
      "Clear quotes with straightforward pricing",
      "10-year waterproof warranty on completed repairs",
      "Fast turnaround for common leaking shower issues",
    ],
    guaranteeText: "Leaking shower repairs completed by Groutix are backed by our 10-year waterproof warranty. If the leak returns due to our workmanship, we will return and rectify it.\n\nWe use specialist waterproof grout and flexible sealants designed for wet areas to help maintain a durable, watertight shower system.",
    faqs: [
      { q: "Can you fix the leak without removing tiles?", a: "Yes. In the vast majority of cases, shower leaks are caused by failed grout or silicone — both of which we repair without removing any tiles." },
      { q: "What if it's a plumbing leak behind the wall?", a: "If the leak is from internal pipes, you'll need a licensed plumber. We specialise in fixing leaks caused by grout and sealant failure at the tile surface." },
      { q: "How quickly can you attend?", a: "We aim to inspect and quote within 1–3 business days of your enquiry. Repairs are usually scheduled shortly after quote approval." },
      { q: "Does the leak need to be active to be diagnosed?", a: "No. We can assess your shower's condition visually and identify failure points even when the leak is intermittent." },
    ],
  },

  "shower-base-repair": {
    title: "Shower Base Repair",
    metaTitle: "Shower Base Repair Victoria | Leak-Proof Solutions | Groutix",
    metaDesc: "Fix a leaking or cracked shower base fast. Groutix offers reliable shower base repairs across Victoria — no full reno required.",
    h1Desc: "A cracked or leaking shower base is more than a cosmetic issue — left unattended, it can lead to serious water damage below the floor. Groutix provides expert shower base repairs, identifying the source of the leak and resealing or restoring the base to a fully watertight standard. We work with tiled bases, acrylic bases and shower trays, offering a cost-effective alternative to ripping out and replacing your entire shower.",
    failHeading: "A Failing Shower Base",
    failHeadingBlue: "Can Leak Everywhere",
    failText: "When the shower base is cracked, uneven or deteriorated, water can move beneath the tiles and into adjoining building materials. Problems often begin around the drain, tile bed or substrate, and visible dampness usually appears only after the base has already started failing.\n\nSurface patching rarely lasts because it does not rebuild the underlying structure that supports the wet area. A proper shower base repair needs to restore both the damaged area and the waterproof barrier.",
    fixHeading: "Shower Base Repairs That",
    fixHeadingBlue: "Restore The Floor",
    fixText: "By targeting the damaged section of the floor, repairing the shower base and restoring waterproof protection where it has failed, we deliver a durable repair without the cost and disruption of a full bathroom rebuild.",
    pillars: [
      { title: "Substrate Repair", desc: "We focus on the damaged shower floor itself, not just the visible grout or tile surface." },
      { title: "Waterproof Reinstatement", desc: "Our repairs are designed to restore support and waterproof performance where the base has failed." },
      { title: "No Full Demolition", desc: "We aim to repair the base without unnecessary strip-out, saving time and disruption." },
    ],
    processIntro: "Our shower base repair process is designed to identify the source of floor failure and restore the shower with lasting waterproof protection.",
    steps: [
      { title: "Diagnose & Inspect", desc: "We inspect the shower floor, drain area, tile bed and substrate to locate cracks and weak sections." },
      { title: "Repair Base & Membrane", desc: "Damaged areas are rebuilt with waterproof repair compounds and flexible membrane systems where required." },
      { title: "Regrout & Seal", desc: "Once the base is restored, we regrout the floor, reseal key joints and complete the final waterproof finish." },
    ],
    workWithUsText: "Groutix specialises in shower repairs that address the floor from the base up. We provide clear repair scope, waterproof materials and workmanship designed to restore the function of the shower rather than just hide the symptoms.",
    workWithUsBullets: [
      "Specialist base repair for shower floors and tiled wet areas",
      "Crack and tray-edge repairs without full shower demolition",
      "Waterproof materials designed to bond to existing bases",
      "Professional drain reinstatement and tile bed support",
      "Fast, local service with minimal disruption",
      "10-year waterproof warranty on completed base repairs",
    ],
    guaranteeText: "Completed shower base repairs from Groutix are backed by our 10-year waterproof warranty. If water returns due to our workmanship, we will return and rectify it.\n\nWe use specialist waterproof materials designed for demanding wet-area conditions to help keep the restored shower base performing properly.",
    faqs: [
      { q: "Can you repair a cracked shower base without replacing tiles?", a: "Yes. Many shower base failures can be repaired from the existing tile surface by accessing the base, repairing cracks or voids, and reinstating the waterproof layer." },
      { q: "Will I need to leave the house during the repair?", a: "Most shower base repairs are completed in one visit, and you can stay in your home while we work. We keep the work area clean and separate from living spaces." },
      { q: "How long until the shower can be used again?", a: "We typically recommend waiting 24–48 hours after repairs to allow waterproof compounds and grout to cure fully." },
      { q: "What if the drain is leaking?", a: "We inspect the drain connection as part of the repair. If the leak is at the drain or junction, we repair the base and re-seal the connection to stop water escaping." },
    ],
    fixBlueBoxText: "By targeting damaged areas, repairing the shower base and restoring protection where it has failed, we deliver a durable solution without the cost and disruption of a full bathroom renovation.",
  },

  "tile-regrouting": {
    title: "Tile Regrouting",
    metaTitle: "Tile Regrouting Victoria | Bathroom & Kitchen Tiles | Groutix",
    metaDesc: "Restore worn or cracked tiles with professional tile regrouting in Victoria. Colour-matched, mould-resistant, long-lasting results.",
    h1Desc: "Old grout doesn't just look dated — it can crumble, stain and let moisture through to the surfaces underneath. Our tile regrouting service covers bathrooms, kitchens, laundries and any tiled area in your home, giving worn tiles a like-new finish. We carefully remove deteriorated grout lines and apply fresh, colour-matched grout for a clean, uniform result that's easier to keep clean and far more resistant to future cracking.",
    failHeading: "Stained & Cracked Grout",
    failHeadingBlue: "Ruins the Look of Your Tiles",
    failText: "Traditional cement-based grout is porous, which means it can absorb grease, soap residue, moisture and daily staining over time. In kitchens, laundries, bathrooms and outdoor areas, those grout lines can quickly start to look tired, patchy or permanently dirty.\n\nWhen grout begins cracking or breaking away, the issue becomes more than cosmetic. Water can penetrate beneath the tiles, contributing to drummy tiles, loose sections and ongoing moisture problems if the area is left untreated.\n\nFor clients wanting a higher-performance finish, Groutix also offers commercial-grade epoxy grout as a non-porous, stain-resistant upgrade for demanding wet areas and long-term durability.",
    fixHeading: "Tile Regrouting That",
    fixHeadingBlue: "Transforms Your Tiled Surfaces",
    fixText: "We remove stained or damaged grout using specialist equipment and replace it with fresh, commercial-grade grout in a colour that suits the tiled area. The result is a cleaner, sharper and more consistent finish without the cost of full retiling.\n\nWe regrout bathrooms, kitchens, laundries, hallways, balconies and other tiled spaces where worn grout is affecting appearance or performance.",
    pillars: [
      { title: "Cleaner Joints", desc: "Fresh grout replaces permanently stained, patchy or discoloured joints that no longer respond to cleaning." },
      { title: "Durable Results", desc: "We use grout systems chosen for high-traffic and wet-area conditions." },
      { title: "Colour Options", desc: "Choose a grout colour that refreshes the tiled surface or changes its look entirely." },
    ],
    processIntro: "Our tile regrouting process is methodical and tidy, helping minimise disruption while restoring the tiled surface properly.",
    steps: [
      { title: "Joint Raking", desc: "We remove the old grout layer using professional dust-minimising raking equipment." },
      { title: "Vacuum & Clean", desc: "All dust and debris is thoroughly vacuumed from the joint channels before new grout is applied." },
      { title: "Regrout & Polish", desc: "Fresh grout is packed into joints and tiles are sponge-cleaned to a spotless, polished finish." },
    ],
    workWithUsText: "We restore tiled floors and walls in kitchens, bathrooms, laundries and outdoor areas with a process designed to improve both appearance and durability, without the cost of a full retile.",
    workWithUsBullets: [
      "Specialist dust-minimising joint raking equipment",
      "High-strength polymer-modified grout formulations",
      "Wide range of grout colours available",
      "Indoor and outdoor areas serviced",
      "Kitchen, laundry, balcony and bathroom tiles all covered",
      "Professional sponge clean of all tiles after grouting",
    ],
    guaranteeText: "Tile regrouting work completed by Groutix is carried out with specialist materials selected for the application area. Where wet-area waterproof work forms part of the repair, eligible workmanship is backed by our warranty coverage.\n\nWe use durable grout systems designed to improve joint strength, appearance and long-term performance in tiled environments.",
    faqs: [
      { q: "Can you change the colour of my grout?", a: "Yes. We can apply a completely different grout colour when regrouting, giving your tiled surfaces a fresh, updated look." },
      { q: "Is the process dusty?", a: "We use dust-minimising equipment and vacuum all debris as we work to keep your home clean." },
      { q: "Can you regrout balcony and outdoor tiles?", a: "Yes. We service outdoor balconies, alfresco areas and pool surrounds with weatherproof grout formulas." },
      { q: "How long does floor regrouting take?", a: "This depends on the area size. A standard kitchen floor typically takes half a day. We'll provide a time estimate with your quote." },
    ],
    fixBlueBoxText: "By removing stained or failing grout and replacing it with durable, high-quality materials, we restore the appearance of your tiled surfaces and deliver a cleaner, longer-lasting finish without the cost or disruption of full retiling.",
    workWithUsBlueBoxText: "With experienced technicians, specialist equipment and durable grout systems, you can trust that your tiled surfaces are restored properly and built to last.",
  },

  "balcony-leak-repairs": {
    title: "Balcony Leak Repairs",
    metaTitle: "Balcony Leak Repairs Victoria | Stop Water Damage | Groutix",
    metaDesc: "Leaking balcony? Groutix locates and repairs the cause of balcony leaks in Victoria, protecting your property from further damage.",
    h1Desc: "Balcony leaks are one of the most common — and costly — problems in Australian homes and apartments, often caused by failed waterproofing membranes, cracked grout or deteriorated silicone joints. Groutix diagnoses the source of the leak and carries out targeted repairs to stop water ingress before it damages walls, ceilings or the property below. Our balcony leak repair service is a practical solution for homeowners, landlords and body corporates looking to avoid expensive structural repairs down the track.",
    failHeading: "A Leaking Balcony Can Cause",
    failHeadingBlue: "Costly Structural Damage",
    failText: "Balcony tiles are exposed to constant weather, UV, thermal movement and water. Over time, grout and sealants crack, shrink and deteriorate — allowing water to penetrate beneath the tile surface and into the balcony slab, walls and the rooms below.\n\nBy the time water staining appears on ceilings or internal walls, the damage has often been building for months or years. Balcony waterproofing failures left untreated can lead to reinforcement corrosion, concrete spalling and significant structural repair costs.\n\nSurface sealers applied over failed grout rarely stop the leak for long. Without removing and replacing the failed grout and movement joints, water will continue to find its way in.",
    fixHeading: "Balcony Leak Repairs That",
    fixHeadingBlue: "Protect Your Property",
    fixText: "Our balcony leak repair service targets the root cause of the leak — not just the visible surface. We remove failed grout and deteriorated sealants, assess the movement joints and tiled surface, and regrout and reseal the balcony using materials specifically designed for outdoor wet areas and thermal movement.\n\nWe aim to complete balcony repairs without tile removal wherever possible, saving time, cost and disruption while restoring the balcony's waterproof integrity.",
    fixBlueBoxText: "By removing failed grout and sealants and replacing them with durable, flexible, weatherproof materials, we help protect your balcony and the structure below from ongoing water damage.",
    pillars: [
      { title: "Weatherproof Materials", desc: "We use flexible, UV-resistant grouts and sealants specifically formulated for outdoor exposed areas." },
      { title: "Movement Joint Repair", desc: "We address perimeter and intermediate movement joints — the most common failure points on balconies." },
      { title: "No Unnecessary Tile Removal", desc: "We repair failed grout and sealants from the surface wherever possible, avoiding costly demolition." },
    ],
    processIntro: "Our balcony leak repair process is systematic and designed to identify and fix every failure point — not just the most visible ones.",
    steps: [
      { title: "Inspect & Assess", desc: "We inspect the balcony grout, movement joints, perimeter sealants and surface to identify all leak entry points." },
      { title: "Remove & Prepare", desc: "Failed grout and deteriorated sealants are removed and surfaces are prepared for new weatherproof materials." },
      { title: "Regrout & Reseal", desc: "We regrout the balcony and reseal all movement joints with flexible, weatherproof sealants designed for outdoor use." },
    ],
    workWithUsText: "Groutix provides professional balcony leak repairs across Victoria. We understand the specific demands of outdoor tiled surfaces and use materials designed to perform in exposed conditions — giving you a properly repaired balcony backed by our workmanship warranty.",
    workWithUsBullets: [
      "Specialist weatherproof grout and sealant systems",
      "Movement joint repair and replacement",
      "Non-invasive repairs — no unnecessary tile removal",
      "Outdoor and exposed area expertise",
      "Fast turnaround with minimal disruption",
      "Workmanship warranty on completed repairs",
    ],
    guaranteeText: "All balcony leak repairs completed by Groutix are backed by our workmanship warranty. We use flexible, weatherproof grouts and sealants designed to accommodate thermal movement and outdoor conditions — helping keep your balcony watertight long-term.",
    faqs: [
      { q: "Can you repair a leaking balcony without removing tiles?", a: "Yes, in most cases. If the leak is caused by failed grout or movement joint sealants, we can repair the balcony surface without removing the tiles." },
      { q: "What causes balcony tiles to leak?", a: "The most common causes are cracked or missing grout, deteriorated movement joint sealants, and failed perimeter sealants at the wall junctions." },
      { q: "How long does a balcony leak repair take?", a: "Most balcony repairs are completed within one to two days depending on the size and extent of the failure. We'll confirm the timeframe with your quote." },
      { q: "How long before the balcony can be used after repair?", a: "We recommend allowing 24–48 hours for grout and sealants to cure before the balcony is used or exposed to water." },
      { q: "Do you service apartment balconies?", a: "Yes. We regularly repair balconies in residential apartment buildings, townhouses and freestanding homes across Victoria." },
    ],
  },

  "silicone-recaulking": {
    title: "Silicone & Recaulking",
    metaTitle: "Silicone & Recaulking Services Victoria | Groutix",
    metaDesc: "Remove mouldy, cracked silicone and reseal your bathroom or kitchen with a durable, mould-resistant finish. Servicing Victoria.",
    h1Desc: "Perished, mouldy or peeling silicone around showers, baths, sinks and benchtops isn't just unsightly — it's a common entry point for water damage. Our silicone and recaulking service removes old, failing silicone and applies a fresh, mould-resistant seal to all wet area joints. It's one of the simplest ways to instantly refresh a bathroom or kitchen and protect against leaks, and it pairs perfectly with our regrouting services for a complete wet area refresh.",
    failHeading: "Deteriorated Silicone Allows",
    failHeadingBlue: "Water Behind Your Tiles",
    failText: "Silicone sealant is the flexible barrier that seals movement joints in showers, baths, kitchens and other wet areas. Unlike grout, silicone is designed to flex with the natural movement of building materials — but over time, it degrades, cracks, peels and becomes a breeding ground for mould.\n\nOnce silicone fails, water can penetrate behind the tiles and into the wall or floor structure beneath. This can lead to hidden moisture build-up, mould growth, damage to wall linings and increasingly costly repairs.\n\nMany homeowners try cleaning black mould off deteriorated silicone, but once the sealant has broken down, surface cleaning only provides temporary relief. The only lasting fix is complete removal and replacement.",
    fixHeading: "Silicone Replacement That",
    fixHeadingBlue: "Seals and Protects",
    fixText: "Our recaulking service completely removes deteriorated silicone and replaces it with premium-grade, mould-resistant sanitary silicone — delivering a clean, professional finish that protects your wet areas from water ingress.\n\nWe service showers, shower screens, baths, kitchen splashbacks, laundries and other tiled wet areas. Whether it's a single bead of failed silicone or a complete shower reseal, we complete the work neatly and efficiently.",
    fixBlueBoxText: "Replacing failed silicone completely — rather than applying new silicone over the top — is the only way to achieve a lasting, watertight seal. We remove every trace of the old sealant before applying premium mould-resistant silicone.",
    pillars: [
      { title: "Complete Removal", desc: "We remove all old and deteriorated silicone before applying new sealant — no layering over failed product." },
      { title: "Mould-Resistant Sealants", desc: "We use premium-grade sanitary silicone designed specifically for wet areas and high-humidity environments." },
      { title: "Colour Matching", desc: "We stock a wide range of silicone colours to match your existing grout, tiles or fixtures." },
    ],
    processIntro: "Our recaulking process ensures the new silicone bonds correctly and delivers a lasting, professional result every time.",
    steps: [
      { title: "Remove Old Silicone", desc: "We carefully remove all traces of deteriorated silicone from the joints using specialist removal tools." },
      { title: "Clean & Prepare", desc: "Surfaces are cleaned and prepared to ensure the new silicone bonds securely and uniformly." },
      { title: "Apply & Finish", desc: "Premium mould-resistant silicone is applied, tooled to a neat profile and left to cure." },
    ],
    workWithUsText: "Groutix provides professional silicone replacement and recaulking for showers, baths, kitchens and wet areas across Victoria. We use premium mould-resistant products and take care to complete every job to a neat, professional standard.",
    workWithUsBullets: [
      "Complete removal of old and deteriorated silicone",
      "Premium-grade mould-resistant sanitary sealants",
      "Colour matching to existing grout and fixtures",
      "Showers, baths, kitchens and laundries serviced",
      "Clean, neat application and professional finish",
      "Servicing Victoria",
    ],
    guaranteeText: "All silicone replacement work completed by Groutix is backed by our workmanship warranty. We use premium mould-resistant sanitary silicone designed for high-moisture environments to help ensure long-lasting performance.",
    faqs: [
      { q: "How long does new silicone take to cure?", a: "New silicone typically requires 24 hours to fully cure before the shower or wet area can be used." },
      { q: "Can you apply new silicone over the existing silicone?", a: "No. Applying new silicone over old deteriorated sealant will not bond correctly and will fail prematurely. We always remove the old silicone completely before applying new product." },
      { q: "Can you match my existing silicone colour?", a: "Yes. We stock a wide range of silicone colours and will recommend the closest match to your existing grout, tiles or fixtures." },
      { q: "Do you reseal the entire shower or just specific joints?", a: "We can reseal the entire shower or target specific joints depending on the condition of the silicone. We'll assess and recommend the appropriate scope before starting work." },
      { q: "Why does shower silicone turn black?", a: "Black staining is caused by mould growing on or beneath deteriorated silicone in damp environments. Replacement with mould-resistant sealant is the most effective long-term solution." },
    ],
  },

  "epoxy-grout": {
    title: "Epoxy Grout",
    metaTitle: "Epoxy Grout Installation Victoria | Durable, Mould-Resistant | Groutix",
    metaDesc: "Upgrade to epoxy grout for a stronger, stain- and mould-resistant finish. Groutix installs premium epoxy grout across Victoria.",
    h1Desc: "For a longer-lasting, more hygienic alternative to standard cement grout, Groutix offers professional epoxy grout installation and replacement. Epoxy grout is highly resistant to stains, mould and water penetration, making it ideal for wet areas like showers, balconies and outdoor tiled spaces. While it's a premium option, epoxy grout significantly reduces the need for future regrouting, making it a smart long-term investment for busy households and rental properties alike.",
    failHeading: "Standard Cement Grout",
    failHeadingBlue: "Stains, Cracks and Deteriorates",
    failText: "Traditional cement-based grout is porous by nature. In showers, bathrooms, kitchens and balconies, it absorbs water, soap residue, cooking grease and everyday spills — becoming permanently stained, discoloured and increasingly difficult to keep clean over time.\n\nIn high-moisture or high-traffic areas, cement grout can crack, crumble and deteriorate faster than expected, allowing water to penetrate beneath the tiles and contribute to ongoing maintenance issues.\n\nFor customers seeking a higher-performance, longer-lasting solution, epoxy grout offers a significant upgrade — delivering a non-porous, stain-resistant and highly durable finish that outperforms standard cement grout across every measure.",
    fixHeading: "Epoxy Grout That",
    fixHeadingBlue: "Outperforms Standard Grout",
    fixText: "Epoxy grout is a resin-based system that creates a hard, dense, non-porous joint between tiles. It resists staining, moisture, mould and chemical attack — making it the preferred choice for demanding wet areas, commercial applications and anywhere long-term performance matters.\n\nGroutix installs and upgrades tiled areas to epoxy grout across Victoria. We remove existing cement grout and replace it with commercial-grade epoxy grout in your choice of colour — transforming the durability and appearance of your tiled surfaces.",
    fixBlueBoxText: "Epoxy grout is a long-term investment in your tiled surfaces. Its superior stain resistance, durability and non-porous finish means less maintenance, fewer repairs and better performance in demanding environments.",
    pillars: [
      { title: "Non-Porous Finish", desc: "Epoxy grout doesn't absorb water, stains or cleaning chemicals — keeping joints cleaner and lasting longer." },
      { title: "Superior Durability", desc: "Commercial-grade epoxy grout is significantly harder and more resilient than standard cement grout." },
      { title: "Ideal for Demanding Areas", desc: "Recommended for showers, balconies, kitchens and commercial environments where performance matters most." },
    ],
    processIntro: "Our epoxy grout installation process is thorough and precise, ensuring the finished result is correctly installed, durable and visually excellent.",
    steps: [
      { title: "Remove Existing Grout", desc: "We rake out and remove the existing cement grout using specialist dust-minimising equipment." },
      { title: "Prepare & Clean Joints", desc: "All joint channels are vacuumed clean to ensure the epoxy grout bonds correctly to the tile edges." },
      { title: "Apply Epoxy Grout", desc: "Commercial-grade epoxy grout is packed into the joints, finished and tiles are cleaned to a polished result." },
    ],
    workWithUsText: "Groutix installs commercial-grade epoxy grout across Victoria for residential and commercial clients. Whether you're upgrading an existing shower, bathroom or balcony, or specifying epoxy grout for a new installation, our experienced team delivers a precise, durable and visually excellent result.",
    workWithUsBullets: [
      "Commercial-grade epoxy grout systems",
      "Full removal of existing cement grout before installation",
      "Wide range of colours available",
      "Showers, bathrooms, balconies and kitchens serviced",
      "Residential and commercial applications",
      "Servicing Victoria",
    ],
    guaranteeText: "All epoxy grout installations completed by Groutix are backed by our workmanship warranty. Epoxy grout's inherent durability and non-porous nature makes it one of the most long-lasting grout solutions available for tiled wet areas and high-traffic environments.",
    faqs: [
      { q: "Is epoxy grout worth the upgrade?", a: "For showers, balconies, kitchens and other demanding wet areas, epoxy grout is an excellent long-term investment. Its non-porous, stain-resistant finish outperforms standard cement grout significantly." },
      { q: "How long does epoxy grout take to cure?", a: "Epoxy grout requires approximately 72 hours to fully cure before the tiled area can be used. Your technician will confirm the recommended curing time on completion." },
      { q: "Can epoxy grout be installed over my existing tiles?", a: "Yes. We remove the existing cement grout and install epoxy grout in its place — the tiles remain in position throughout the process." },
      { q: "Is epoxy grout suitable for floor tiles?", a: "Yes. Epoxy grout performs excellently on both floor and wall tiles, and is particularly recommended for high-traffic floor areas due to its exceptional durability." },
      { q: "Can you match my existing grout colour with epoxy grout?", a: "Yes. We stock a wide range of epoxy grout colours and will recommend the closest match to your existing tiles and fixtures." },
    ],
  },

  "real-estate-property-services": {
    title: "Real Estate & Property Services",
    metaTitle: "Regrouting & Maintenance for Real Estate Agents Victoria | Groutix",
    metaDesc: "Trusted regrouting, silicone and tiling maintenance for real estate agents and property managers in Victoria. Fast, reliable, inspection-ready results.",
    h1Desc: "Groutix partners with real estate agents, property managers and landlords across Victoria to keep rental and sale properties in top condition. From pre-sale regrouting and silicone refreshes to routine maintenance and leak repairs between tenancies, we help properties present their best and pass inspections with confidence. Flexible scheduling and clear reporting make us a reliable go-to for ongoing property maintenance needs.",
    heroTitle: "Real Estate & Property Services",
    heroCards: [
      { title: "Wet-Area Maintenance Specialists", desc: "Experienced in grout, shower and tiled wet-area repairs for rental and managed properties." },
      { title: "Practical Repair Solutions", desc: "Targeted repair work that resolves the issue without unnecessary demolition or disruption." },
      { title: "Clear Communication", desc: "Reliable coordination, written scope and straightforward updates for managers, landlords and owners." },
    ],
    trustedText: "TRUSTED BY PROPERTY OWNERS & MANAGERS",
    failHeading: "Unreported Shower Leaks Can Cost",
    failHeadingBlue: "Landlords Thousands",
    failText: "A small wet-area issue can quickly become a larger property expense when failed grout, mouldy joints or minor shower leaks are left unresolved. By the time staining, damaged skirting, swollen walls or ceiling marks appear, the repair scope is often larger and more disruptive.\n\nGroutix helps landlords and property managers act earlier by identifying visible grout failure, deteriorated silicone and likely moisture entry points before they develop into urgent maintenance problems.\n\nWhether the issue comes from a tenant report, a routine inspection or a suspected leaking shower, our team can assess the area and recommend the right repair path to help protect the property and control costs.",
    fixHeading: "Property Maintenance Solutions That",
    fixHeadingBlue: "Protect Your Investment",
    fixText: "From a small grout defect to a suspected leaking shower, early action can prevent larger repair bills and tenant disruption. Groutix provides inspections, regrouting, silicone replacement, leak repairs and minor tile restoration for rental and managed properties.\n\nWe make the process easier for property managers by coordinating with tenants, assessing the issue, issuing clear written quotes and completing approved repair work efficiently.\n\nWhether the trigger is visible mould, cracked grout, failed silicone or a reported shower leak, we help identify the problem early and move it toward a practical resolution.",
    fixBlueBoxText: "One call takes care of the process. From inspection and tenant access to clear quoting and professional repairs, Groutix helps property managers resolve wet-area maintenance quickly and protect the property from further damage.",
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
    workWithUsText: "We work with real estate agencies, strata managers and private landlords who need wet-area repairs handled efficiently. Our process is designed to keep quoting, access and repair scheduling straightforward.",
    workWithUsBullets: [
      "Fast-response attendance for urgent leak situations",
      "Direct tenant communication to arrange access",
      "Written fixed-price quotes emailed within 24 hours",
      "10-year waterproof warranty issued on completion",
      "Experience working with major property management groups",
      "Invoice directly to agency trust accounts on request",
    ],
    guaranteeText: "Eligible wet-area repair work completed by Groutix is backed by our warranty coverage, including a 10-year waterproof warranty on full shower regrouting. If an issue returns due to our workmanship, we will return and rectify it.\n\nWe use specialist grout and sealing materials designed for wet areas, helping property owners protect bathrooms, ensuites and tiled shower spaces for the long term.",
    faqs: [
      { q: "Can you invoice the agency trust account?", a: "Yes. We can arrange invoicing through your agency's preferred billing process upon job completion." },
      { q: "Do you provide condition reports or job photos?", a: "Yes. We can provide before-and-after photos and written job summaries for your property records." },
      { q: "What if the tenant is uncooperative with access?", a: "We'll work with you to arrange access in line with the tenant's rights. We're experienced in coordinating around tenancy requirements." },
      { q: "Do you work with strata and body corporates?", a: "Yes. We regularly work in multi-residential apartment buildings and common-area wet areas for strata bodies." },
    ],
    workWithUsBlueBoxText: "With direct tenant coordination, clear fixed-price quotes and a streamlined repair process, we make property maintenance easier for agents, landlords and strata managers.",
    processBlueText: "From tenant coordination to inspection, quoting and repairs, we handle the process from start to finish — saving property managers time and keeping maintenance moving.",
  },

  "small-tiling-jobs": {
    title: "Small Tiling Jobs",
    metaTitle: "Small Tiling Jobs & Repairs Victoria | Groutix",
    metaDesc: "Cracked or missing tiles? Groutix handles small tiling jobs and repairs across Victoria — fast turnaround, no job too small.",
    h1Desc: "Not every tiling job needs a full renovation. Groutix happily takes on small tiling jobs — replacing cracked or broken tiles, patching gaps, and completing minor tiling repairs around the home. It's the ideal service for homeowners who need a quick, tidy fix without waiting on a large-scale renovation booking or paying renovation-sized prices.",
    failHeading: "Damaged Tiles Left Unrepaired",
    failHeadingBlue: "Lead to Bigger Problems",
    failText: "A cracked or loose tile may start as a small defect, but leaving it in place can allow moisture into the tile system and contribute to further deterioration. Over time, weakened grout joints, failed adhesive and movement beneath the surface can cause nearby tiles to sound hollow, lift or loosen.\n\nMissing or broken grout can also leave showers and other wet areas vulnerable to continued moisture penetration. Early repair work helps stop damage spreading and reduces the chance of bigger remedial work later.",
    fixHeading: "Minor Tile Repairs Completed to a",
    fixHeadingBlue: "Professional Standard",
    fixText: "From a single cracked tile to a small area of loose or damaged tiles, Groutix provides targeted tile repairs without the cost of retiling the whole area. We carefully replace damaged tiles, resecure loose tiles where suitable and restore missing or deteriorated grout for a clean, durable finish.\n\nWhether the issue is in a bathroom, kitchen, laundry, hallway or another tiled area, our focus is on repairing the affected section properly and blending the finished work with the surrounding surface wherever possible.",
    fixBlueBoxText: "Small tile problems don't always require a full retile. We target the damaged area, replace or re-secure affected tiles and restore the surrounding grout for a clean, professional finish.",
    pillars: [
      { title: "Individual Tile Replacement", desc: "We replace broken or cracked tiles using your spare tiles for a seamless, colour-matched repair." },
      { title: "Loose Tile Re-Securing", desc: "We lift, clean and re-lay hollow or loose tiles with fresh adhesive and regrout the joints." },
      { title: "Grout Patching", desc: "We patch damaged, missing or crumbling grout sections and match the colour to the surrounding grout." },
    ],
    processIntro: "Our tile repair process is careful and precise, ensuring repairs blend naturally with the surrounding tiled surface.",
    processBlueText: "Each project is approached methodically, ensuring the underlying cause of tile damage is addressed properly rather than simply covered up.",
    steps: [
      { title: "Assess the Damage", desc: "We inspect the damaged tile and surrounding area to check for water ingress and substrate damage." },
      { title: "Remove & Prepare", desc: "We carefully remove the broken tile or lift the loose tile and prepare the substrate for rebonding." },
      { title: "Re-Lay & Regrout", desc: "We set the tile with fresh adhesive, regrout the joints and seal corners where required." },
    ],
    workWithUsText: "We handle small tile repairs across Victoria with the same care we bring to larger regrouting projects. Every repair is completed using durable materials and practical methods rather than cosmetic patching alone.",
    workWithUsBlueBoxText: "With experienced technicians, specialist materials and a careful repair process, you can trust that your damaged tiles and grout are repaired properly.",
    workWithUsBullets: [
      "Replacement of individual cracked or broken tiles",
      "Re-securing of loose, hollow or drummy tiles",
      "Grout patching to match surrounding colour",
      "Waterproof grout and silicone used on all repairs",
      "Clean, careful work — no unnecessary tile removal",
      "Servicing Victoria",
    ],
    guaranteeText: "Minor tile repairs completed by Groutix are carried out with quality adhesives, grout and wet-area sealing materials suited to the job. Where waterproof repair work forms part of the scope, eligible workmanship is covered by our applicable warranty terms.\n\nOur aim is to leave the repaired section stable, tidy and properly integrated with the surrounding tiled surface.",
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
  const canonical = `/${slug}`;
  return {
    title: s.metaTitle,
    description: s.metaDesc,
    alternates: { canonical },
    openGraph: {
      title: s.metaTitle,
      description: s.metaDesc,
      url: canonical,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const s = services[slug];
  if (!s) notFound();

  const reviews = await getReviews();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(s.faqs)) }}
      />
      <ServicePageTemplate
        reviews={reviews}
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
        fixBlueBoxText={s.fixBlueBoxText}
        workWithUsBlueBoxText={s.workWithUsBlueBoxText}
        processBlueText={s.processBlueText}
      />
    </>
  );
}

