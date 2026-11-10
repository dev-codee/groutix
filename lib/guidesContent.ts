// Guide content for /guides. Keyword maps and outlines from SERP research,
// 2026-11-10 (see groutix-guides-research-2026-11-10.md). Visible copy
// follows the house rule: no hyphens or dashes in prose, compound words
// written with spaces.

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: Array<{ lead: string; text: string }> }
  | { type: "table"; head: [string, string]; rows: Array<[string, string]> }
  | { type: "callout"; title: string; text: string }
  | { type: "image"; src: string; alt: string; caption: string };

export interface GuideSection {
  id: string;
  heading: string;
  blocks: GuideBlock[];
}

export interface Guide {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  quickAnswer: string;
  heroImage: string;
  heroAlt: string;
  cardText: string;
  serviceHref: string;
  serviceLabel: string;
  ctaHeading: string;
  ctaText: string;
  sections: GuideSection[];
  faqs: Array<{ question: string; answer: string }>;
}

export const GUIDES: Guide[] = [
  {
    slug: "shower-still-leaking-after-regrouting",
    metaTitle: "Shower Still Leaking After Regrouting? Causes, Tests and Fixes",
    metaDescription:
      "Shower still leaking after regrouting? The six causes, simple tests that separate grout from waterproofing from plumbing, and what to do next in Melbourne.",
    h1: "Shower Still Leaking After Regrouting? Causes, Tests and What To Do Next",
    intro:
      "It is one of the most frustrating jobs in a Melbourne bathroom. The shower looked brand new after the regrout, the grout lines were clean and bright, and a few weeks later the damp patch is back, the skirting is swelling again, or water is showing up in the [room below](/guides/shower-leaking-into-ceiling-below). You are not alone, and it does not automatically mean the shower needs to be ripped out. It means the real cause was never found. This guide walks through why a shower keeps leaking after regrouting, the tests that separate a surface problem from a waterproofing or plumbing problem, and the order to fix things in so you only pay once.",
    quickAnswer:
      "Regrouting only fixes the surface: the grout lines and the silicone joints. A shower keeps leaking after a regrout when the cause sits deeper, in the waterproofing membrane under the tiles, the waste outlet, a pipe inside the wall, or in silicone and movement joints that were never properly replaced. The right next step is not another regrout or a full rebuild. It is a short sequence of tests that shows which layer is letting the water through.",
    heroImage: "/corner-shower-regrouting-worn-grout.webp",
    heroAlt:
      "Leaking shower in Melbourne, a corner shower with worn and cracked grout that lets water escape behind the tiles",
    cardText:
      "The regrout looked perfect and the leak came back. Causes, the test sequence that finds the real one, and what to do next.",
    serviceHref: "/leaking-shower-repair",
    serviceLabel: "Leaking Shower Repairs",
    ctaHeading: "Think it might be the grout or silicone after all?",
    ctaText:
      "Send us photos of the shower and the damp area. We will tell you honestly which layer we think is leaking and what the right repair is, before you spend anything.",
    sections: [
      {
        id: "can-regrouting-fix",
        heading: "Can Regrouting Fix a Leaking Shower?",
        blocks: [
          {
            type: "p",
            text: "Yes, when the leak is a surface leak and the layers underneath are sound. If the grout has cracked and perished and the silicone has failed, but the waterproofing membrane and the tile bed are in good condition, a [properly scoped regrout](/shower-regrouting) with full silicone replacement is a legitimate and lasting repair, done without removing tiles. Plenty of Melbourne showers are fixed exactly this way.",
          },
          {
            type: "p",
            text: "No, when the water is getting through somewhere else. Regrouting cannot repair a failed membrane, a leaking waste connection or a pipe inside the wall, and anyone who tells you a regrout will fix every leak, or that it never fixes any leak, is selling you something. The honest answer depends on which layer has failed in your shower, and that can be tested.",
          },
          {
            type: "p",
            text: "One more thing to check before anything else: if the regrout was recent, call the company back first. Check what the job actually covered and what warranty came with it. Groutix work carries a 10 year warranty on eligible jobs, and Australian Consumer Law gives you guarantees on services as well. A leak that returns within weeks of a regrout is a conversation with the original company, not a new quote.",
          },
        ],
      },
      {
        id: "causes",
        heading: "Why Does a Shower Keep Leaking After Regrouting?",
        blocks: [
          { type: "h3", text: "The old grout was skimmed, not removed" },
          {
            type: "p",
            text: "New grout spread thinly over old failed grout looks tidy for a few weeks and then lets water through in exactly the places the old grout had already failed. Old grout has to be raked out to a proper depth so the new grout has body and a sound surface to bond to. A cosmetic skim is the most common reason a budget regrout keeps leaking.",
          },
          { type: "h3", text: "The silicone and movement joints were skipped" },
          {
            type: "p",
            text: "This is also why so many showers still leak after resealing alone, or after a regrout that left the seals untouched. The internal corners and the wall to floor junction are movement joints. Buildings move with heat, cold and use, and rigid grout in those joints cracks. They belong to flexible silicone. If perished silicone stayed in the corners, if new silicone went over old silicone, or if grout was packed into joints that should have been siliconed, water keeps entering at exactly the points that move.",
          },
          { type: "h3", text: "Only part of the shower was done" },
          {
            type: "p",
            text: "Sometimes only the walls were regrouted and the floor and base were not, or the other way around. Water only needs one path. A shower is a system: wall grout, floor grout, silicone, the waste and the screen all have to hold at once.",
          },
          { type: "h3", text: "The waste, grate or puddle flange is leaking" },
          {
            type: "p",
            text: "Under the grate, the floor waste connects into a puddle flange and the drain. If that connection is poor or has shifted, water escapes below the floor every time the shower drains, no matter how perfect the surface looks. The clue is a leak that tracks with how much water goes down the drain rather than how much water hits the walls.",
          },
          { type: "h3", text: "Tiles, the base or the falls have failed" },
          {
            type: "p",
            text: "A hairline crack through a tile or a cracked and flexing shower base lets water straight through the surface. Drummy, loose tiles mean the adhesive underneath has let go, often because water has been getting in for a long time. Poor falls that leave water ponding in a corner keep the joints under water pressure they were never meant to hold, and a shower screen with blocked frame drainage or silicone on the wrong side can leak steadily while the tiling is blamed.",
          },
          { type: "h3", text: "A pipe, mixer or shower fitting is leaking inside the wall" },
          {
            type: "p",
            text: "Tap bodies, mixer cartridges, the shower riser and supply pipes can leak slowly inside the wall cavity for months. This is a plumbing leak, not a tiling problem, and it needs a licensed plumber. The strongest clues are damp that spreads even when the shower is not used, and a water meter that keeps moving with every tap in the house turned off.",
          },
        ],
      },
      {
        id: "causes-images",
        heading: "What Failed Seals Look Like",
        blocks: [
          {
            type: "p",
            text: "Perished silicone and cracked grout are easy to spot once you know where to look: the corners, the wall to floor junction and around the shower base. This is the base of a shower part way through a proper repair, with the old failed silicone cut out and the joint cleaned ready for fresh wet area silicone.",
          },
          {
            type: "image",
            src: "/silicone-shower-base-after.webp",
            alt: "Silicone recaulking in Melbourne, a shower base with fresh wet area silicone sealing the wall to floor junction",
            caption: "Fresh silicone in the movement joints, the seal a regrout must never skip.",
          },
        ],
      },
      {
        id: "membrane-signs",
        heading: "Signs Your Waterproofing Membrane Has Failed",
        blocks: [
          {
            type: "p",
            text: "Under every tiled shower built to Australian Standard AS 3740 there is a waterproofing membrane, the last line of defence under the tiles. In many older Melbourne bathrooms, especially in period homes renovated before membrane practice became consistent, that layer is thin, damaged or missing in places. When it fails, water passes into the screed bed, the floor and the walls, and no surface repair will stop it.",
          },
          {
            type: "list",
            items: [
              { lead: "Damp outside the bathroom.", text: "Moisture on the walls beside or behind the shower at floor level, or on the ceiling below." },
              { lead: "Swollen timber.", text: "Skirting boards, architraves and door jambs swelling or going soft, common in Melbourne weatherboard and brick veneer homes where the bathroom sits over timber framing." },
              { lead: "Drummy and lifting tiles.", text: "Tiles that sound hollow when tapped, have started to lift, or grout that keeps cracking in the same place." },
              { lead: "Efflorescence.", text: "White salt deposits appearing on grout lines, left behind by water travelling through the tile bed and evaporating." },
              { lead: "Smell and mould that return.", text: "A musty smell that never clears and mould that comes back within days of cleaning. In bad cases even mushrooms or ants appear around the shower, drawn by damp timber." },
            ],
          },
          {
            type: "p",
            text: "One sign alone is a clue. Several together are a strong indication. When the membrane has failed, the lasting fix is to strip the shower, repair the substrate and re waterproof to AS 3740 before retiling. In Victoria that waterproofing work must be done by a licensed practitioner. It costs more than a regrout, and being talked into a second regrout first costs you twice.",
          },
        ],
      },
      {
        id: "tests",
        heading: "How to Test Whether It Is Grout, Waterproofing or Plumbing",
        blocks: [
          {
            type: "p",
            text: "Run these in order. Each one rules a layer in or out, and together they take the guesswork out of the quote that follows. Photograph the damp area before and after each test.",
          },
          {
            type: "list",
            items: [
              {
                lead: "The rest test.",
                text: "Stop using the shower for a day or two and watch the damp patch. If it keeps spreading with no use at all, suspect plumbing and start there. If it settles, the leak is tied to shower use.",
              },
              {
                lead: "The water meter test.",
                text: "With every tap and appliance off, note the meter, wait an hour without using water, and check it again. A meter that moved means a pressurised pipe is leaking somewhere.",
              },
              {
                lead: "The tap test.",
                text: "Tap the shower tiles with your knuckles or a coin. Solid tiles ring dull and firm. Drummy tiles sound hollow, which points to debonded tiles and water underneath.",
              },
              {
                lead: "The drain run test.",
                text: "Pour buckets of water straight into the open waste so almost nothing touches the walls or floor surface. If the leak appears below, the waste, flange or drain connection is the path.",
              },
              {
                lead: "The zone spray test.",
                text: "Wet one area at a time with a handheld shower or a watering can: the screen and corners first, then one wall, then the base, while someone watches the damp area. The zone that brings the damp back is the zone that is leaking.",
              },
              {
                lead: "The base flood test.",
                text: "Plug the waste, add a few centimetres of water to the base, mark the level, and watch it and the rooms around and below for an hour or two. A falling level or fresh damp points below the surface. Stop straight away if water appears anywhere it should not.",
              },
            ],
          },
          {
            type: "callout",
            title: "A note on Melbourne winters",
            text: "Not every damp patch near a bathroom is a shower leak. Cold Melbourne winters bring condensation on cold walls and windows that can mimic a leak. The timing tests above separate the two: condensation follows cold mornings and steam, a shower leak follows shower use.",
          },
        ],
      },
      {
        id: "tests-image",
        heading: "A Shower That Tests Clean",
        blocks: [
          {
            type: "image",
            src: "/leaking-shower-repaired-after.webp",
            alt: "Leaking shower repair in Melbourne, a repaired shower with fresh grout and silicone and no water escaping",
            caption: "The end point of a proper diagnosis: a shower sealed at every layer that matters.",
          },
        ],
      },
      {
        id: "avoid",
        heading: "What Not To Do Next",
        blocks: [
          {
            type: "list",
            items: [
              { lead: "Do not regrout a second time on hope.", text: "If the first regrout did not hold, repeating it without a diagnosis buys the same result." },
              { lead: "Do not silicone over old silicone.", text: "It does not bond, it peels, and it traps moisture behind the joint." },
              { lead: "Do not seal over a wet shower.", text: "Grout, silicone and clear sealers all need a dry substrate. Work done over a waterlogged screed seals the water in." },
              { lead: "Do not jump straight to a rebuild either.", text: "If the tests show a surface failure on a sound membrane, a rebuild spends far more than the problem needs when a proper regrout would solve it." },
              { lead: "Do not ignore it.", text: "Kept damp, timber floors and framing rot and attract termites, and the repair quietly grows from a surface job into structural work." },
            ],
          },
        ],
      },
      {
        id: "next-steps",
        heading: "Regrouting Did Not Fix the Leak: What To Do Next in Melbourne",
        blocks: [
          {
            type: "p",
            text: "Work up the repair ladder, and stop at the first rung that matches your diagnosis:",
          },
          {
            type: "table",
            head: ["Diagnosis", "The repair that matches it"],
            rows: [
              ["Failed grout or silicone, membrane sound", "A correctly scoped regrout plus full silicone replacement, no tile removal"],
              ["Cracked or drummy tiles in one area", "Tile repair and localised regrout by a tiling specialist"],
              ["Leaking waste or puddle flange", "Waste and flange repair, then resealing of the base"],
              ["Pipe, mixer or riser leak", "Repair by a licensed plumber, then make good the wall"],
              ["Failed membrane or waterlogged screed", "Strip out, substrate repair, licensed re waterproofing to AS 3740, retile"],
              ["Failed base or structure", "Shower rebuild with a builder involved"],
            ],
          },
          {
            type: "p",
            text: "Groutix starts every leaking shower with the cause, not the quote. If the tests point to grout or silicone on a sound membrane, we regrout properly, with the old grout raked out to depth, waterproof epoxy grout in the lines and fresh silicone in every movement joint, and the eligible work carries a 10 year warranty. If the cause is the membrane, the waste or the plumbing, we tell you plainly which trade you need and why. Send us photos of the shower and the damp area and we will tell you honestly which rung of the ladder you are on.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Can regrouting fix a leaking shower?",
        answer:
          "Yes, when the leak is coming through failed grout or silicone and the waterproofing membrane and tile bed underneath are sound. A properly scoped regrout with full silicone replacement seals the surface without removing tiles. It cannot fix a failed membrane, a leaking waste or a pipe leak, which is why diagnosis comes first. Our [leaking shower repair service](/leaking-shower-repair) starts with exactly that diagnosis.",
      },
      {
        question: "Why is my shower still leaking after regrouting?",
        answer:
          "Usually because the cause was never in the grout. The common reasons are old grout skimmed rather than removed, silicone and movement joints skipped, only part of the shower done, a leaking waste or puddle flange, a pipe leaking inside the wall, or a failed waterproofing membrane. The test sequence in this guide separates them.",
      },
      {
        question: "Why does my shower still leak after being resealed?",
        answer:
          "Resealing replaces the silicone only. If the grout has also failed, if the new silicone went over old silicone or a wet joint, or if the leak is at the waste, the membrane or a pipe, fresh silicone changes nothing. Grout and silicone also do different jobs: grout fills rigid joints, silicone seals the joints that move.",
      },
      {
        question: "How do I know if my shower waterproofing membrane has failed?",
        answer:
          "Look for damp on walls outside the bathroom at floor level, swollen skirting boards and architraves, drummy or lifting tiles, white salt deposits called efflorescence on the grout, and a musty smell that never clears. Several signs together are a strong indication, and a proper inspection confirms it before anyone talks about stripping the shower out.",
      },
      {
        question: "Will epoxy grout stop my shower leaking?",
        answer:
          "[Epoxy grout](/epoxy-grout) is waterproof, stain resistant and far more durable than cement grout, so where grout failure is the cause it is the strongest fix. It still only seals the grout lines. It cannot repair a failed membrane, a leaking waste or a pipe, and it is not a substitute for silicone in the movement joints.",
      },
      {
        question: "Do I need a plumber, a tiler, a waterproofer or a regrouting specialist?",
        answer:
          "Follow the diagnosis. Surface grout and silicone failures go to a regrouting specialist. Cracked and drummy tiles go to a tiler. Pipes, mixers and drains under pressure go to a licensed plumber. A failed membrane goes to a licensed waterproofer, and structural or base failures can involve a builder. A good specialist will tell you when the job belongs to someone else.",
      },
      {
        question: "Can a leaking shower be repaired without removing tiles?",
        answer:
          "Often, yes. Where the membrane and substrate are sound, regrouting, silicone replacement, localised tile repairs and waste repairs are all done from the surface. Tile removal and re waterproofing are only needed when the membrane or the structure underneath has failed, which the tests will show.",
      },
    ],
  },
  {
    slug: "shower-leaking-into-ceiling-below",
    metaTitle: "Shower Leaking Through the Ceiling? First Steps and Who Pays",
    metaDescription:
      "Shower leaking through the ceiling? Make it safe, find the real source, and see who pays in a Melbourne house, a Victorian rental or a unit.",
    h1: "Shower Leaking Through the Ceiling? What To Do First and Who Pays",
    intro:
      "A brown stain spreading across the ceiling, paint starting to bubble, or worst of all water dripping through a light fitting after someone showers upstairs. A shower leaking into the room below is worrying, but the order of what you do matters more than speed, and almost nobody explains the whole picture in one place: the first steps, the likely causes, and who is responsible in a house, a rental property and a unit. This guide does.",
    quickAnswer:
      "Stop using the shower and keep water away from lights and power points. The stain shows where the water arrived, not where it entered, so find the source before anyone opens the ceiling or repaints it. In a Victorian rental, a serious shower leak counts as an urgent repair and the rental provider must act straight away. In a unit, tell the owners corporation manager early: the surfaces inside your bathroom are usually yours to maintain, while shared pipes and structure can be common property.",
    heroImage: "/shower-regrouting-tiled-interior.webp",
    heroAlt:
      "Shower regrouting in Melbourne, a freshly regrouted tiled shower with waterproof epoxy grout",
    cardText:
      "Water leaking through the ceiling from a shower. First steps, the causes, and who pays in a house, a rental or a unit.",
    serviceHref: "/leaking-shower-repair",
    serviceLabel: "Leaking Shower Repairs",
    ctaHeading: "Water coming through your ceiling right now?",
    ctaText:
      "Send us photos of the shower and the ceiling below it. We will tell you honestly what the likely source is and which trade you need first.",
    sections: [
      {
        id: "make-safe",
        heading: "Water Coming Through the Ceiling Below? Do These Things First",
        blocks: [
          {
            type: "list",
            items: [
              {
                lead: "Stop using that shower.",
                text: "Every shower adds water to the ceiling cavity. Use another bathroom, or keep use to an absolute minimum, until the source is found.",
              },
              {
                lead: "Treat water near power with respect.",
                text: "If water is coming through a light fitting, a power point or a ceiling fan, do not touch the switches. Turn that circuit off at the switchboard if you can do it safely, and call an electrician before the fitting is used again.",
              },
              {
                lead: "Catch and protect.",
                text: "A bucket under the drip, towels at the edges of the stain, and furniture and rugs moved out from under the area. If the ceiling is bulging with pooled water, keep everyone out from under it and do not puncture it yourself. Waterlogged plaster is heavy, and a professional can release pooled water safely.",
              },
              {
                lead: "Record everything.",
                text: "Photos and short videos of the stain, the drip and the shower above, with dates. This record matters for landlords, owners corporations and insurers alike, and it helps whoever diagnoses the leak.",
              },
            ],
          },
        ],
      },
      {
        id: "source",
        heading: "Why Water Is Leaking Through the Ceiling From Your Shower",
        blocks: [
          {
            type: "p",
            text: "Under a bathroom floor, water travels along joists, pipes and the ceiling lining, and it can appear a room away from where it entered. That is why the stain marks the destination, not the source, and why opening or repainting the ceiling before the source is fixed just hides the evidence and guarantees the stain returns.",
          },
          {
            type: "p",
            text: "The source is almost always one of five things: failed grout, failed silicone in the movement joints, a leaking waste outlet or drain connection, a failed waterproofing membrane under the tiles, or a pipe and fitting leak inside the wall or floor. Each has a different repair and a different trade.",
          },
          {
            type: "p",
            text: "Timing narrows it down fast. A leak that only appears while the shower drains points to the waste and the surface seals. A leak that keeps growing while the shower sits unused points to a pressurised pipe. Our [guide to a shower still leaking after regrouting](/guides/shower-still-leaking-after-regrouting) sets out the full test sequence, from the rest test and the drain run test to the base flood test.",
          },
        ],
      },
      {
        id: "source-image",
        heading: "Where the Water Gets In",
        blocks: [
          {
            type: "image",
            src: "/leaking-shower-failed-grout-before.webp",
            alt: "Leaking shower in Melbourne, failed and cracked grout in a shower base letting water through to the floor below",
            caption: "Failed grout in a shower base, one of the five ways water reaches the ceiling below.",
          },
        ],
      },
      {
        id: "responsible",
        heading: "Bathroom Leaking Through the Ceiling: Who Is Responsible",
        blocks: [
          { type: "h3", text: "Your own home" },
          {
            type: "p",
            text: "The repair is yours to arrange and pay for, and the order matters. Fix the source first, let the ceiling cavity dry properly, then repair the plaster and paint last. Painting over a damp ceiling seals moisture in, and the mould follows.",
          },
          { type: "h3", text: "Renting in Victoria" },
          {
            type: "p",
            text: "A fault that wastes a lot of water, causes damp or makes the property unsafe counts as an urgent repair in Victoria, and a shower leaking through the ceiling fits that description. Tell the rental provider or the agent straight away, and put it in writing the same day so the timeline is on record. The provider must arrange urgent repairs immediately. If they do not act promptly after you have told them, you may arrange the repair yourself for up to $2,500 and ask in writing to be repaid, and the provider must reimburse you within 7 days of receiving your written request. Above $2,500, or if anything is disputed, contact [Consumer Affairs Victoria](https://www.consumer.vic.gov.au/housing/renting) or Rental Dispute Resolution Victoria rather than guessing. No other Melbourne guide we have seen sets these figures out, and they are the ones that matter at midnight with water coming through the light fitting.",
          },
          { type: "h3", text: "An apartment or unit with an owners corporation" },
          {
            type: "p",
            text: "Responsibility follows the source, and the plan of subdivision has the final say for your building. The surfaces inside your bathroom, tiles, grout, silicone and in most buildings the internal shower membrane, are the lot owner to maintain. Balcony membranes more often fall to the owners corporation because they protect the shared slab. Shared pipes and structure are common property. The ceiling of the lot below is often a boundary structure, so one leak can legitimately involve two owners and the corporation. Tell the owners corporation manager as soon as you know, in writing, and do not open floors or ceilings in common property areas without their go ahead. If the unit below is damaged, early notice protects you as much as them.",
          },
          {
            type: "callout",
            title: "General information only",
            text: "This section is general information about how responsibilities usually work in Victoria, not legal advice about your property. Rental questions are covered in detail by Consumer Affairs Victoria, and owners corporation questions by your manager and the plan of subdivision for your building.",
          },
        ],
      },
      {
        id: "insurance",
        heading: "Does Home Insurance Cover a Leaking Shower and the Ceiling Damage?",
        blocks: [
          {
            type: "p",
            text: "Usually not in the way people hope, and it is better to know now. Australian home policies treat a sudden event, like a burst pipe, very differently from a slow leak. Most policies specifically exclude damage caused by water leaking from a shower recess or base, and they exclude gradual damage that built up over time, as well as the cost of repairing the item that leaked. A shower that has been seeping through failed grout for months is the classic excluded case.",
          },
          {
            type: "p",
            text: "What can be covered is sudden resulting damage from an insured event, and every policy words it differently. Notify your insurer early anyway, keep the photos, the diagnosis and the invoices together, and ask what they need before work starts. In a unit, also tell the owners corporation manager, because the building policy may respond to common property damage even when your own policy does not respond to the leak.",
          },
        ],
      },
      {
        id: "repair-path",
        heading: "The Repair Path, in Order",
        blocks: [
          {
            type: "list",
            items: [
              {
                lead: "Diagnose.",
                text: "Simple water tests and an inspection identify which of the five sources you have, before money is spent on the wrong repair.",
              },
              {
                lead: "Fix the cause.",
                text: "Grout and silicone, waste, membrane or plumbing, each by the right trade, with a written quote you approve first.",
              },
              {
                lead: "Dry out.",
                text: "The ceiling cavity and the floor need to dry fully. This takes days to weeks depending how long the leak ran, and how long the ceiling takes to dry is the thing that sets your real timeline.",
              },
              {
                lead: "Make good.",
                text: "Only now the plaster and paint, so the finished ceiling stays finished.",
              },
            ],
          },
          {
            type: "image",
            src: "/dark-grey-shower-floor-regrouting.webp",
            alt: "Shower regrouting in Melbourne, a finished tiled shower floor with fresh waterproof grout and clean silicone joints",
            caption: "A finished repair: fresh grout, fresh silicone, and a ceiling below that stays dry.",
          },
          {
            type: "p",
            text: "Groutix handles the diagnosis, grout and silicone side of this path every week across Melbourne, and we will tell you plainly when the cause is plumbing or membrane and a different trade or a bigger job is the honest answer. Start with our [leaking shower repair service](/leaking-shower-repair), or send photos of the shower and the ceiling below it and we will tell you what we think the source is.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Can I still use my shower if water is coming through the ceiling below?",
        answer:
          "Best not to. Every use pushes more water into the ceiling cavity, the plaster weakens and the repair grows. If it is your only shower, keep use as short as possible, keep an eye on the ceiling, and get the diagnosis booked quickly. If the ceiling is bulging or water is near a light fitting, stop altogether until it is looked at.",
      },
      {
        question: "Why is water leaking through the ceiling from my upstairs shower?",
        answer:
          "Because water escaping the shower upstairs travels through the floor and along the ceiling lining until it finds a weak point, often some distance from the shower itself. The usual sources are failed grout, failed silicone, a leaking waste connection, a failed waterproofing membrane or a pipe leaking inside the wall. Timing helps: leaks that only appear while the shower drains point to the waste and surface seals, while damp that grows with the shower unused points to plumbing.",
      },
      {
        question: "Does home insurance cover a leaking shower and the ceiling damage?",
        answer:
          "For a slow shower leak, usually not. Most Australian policies exclude water leaking from a shower recess or base and exclude gradual damage, as well as the repair of the item that leaked. Sudden events like a burst pipe are treated differently. Check your policy wording, notify the insurer early, and keep photos and invoices either way.",
      },
      {
        question: "Who pays if my shower leaks into the apartment below, me or the owners corporation?",
        answer:
          "It follows the source. The bathroom surfaces inside your lot, including in most buildings the internal shower membrane, are generally yours to maintain. Shared pipes, structure and usually balcony membranes belong to the owners corporation. The plan of subdivision decides the boundaries in your building, so notify the manager in writing and get the source diagnosed before anyone accepts or disputes the bill.",
      },
      {
        question: "I am renting and the shower is leaking through the ceiling. Does my landlord have to fix it urgently?",
        answer:
          "In Victoria, yes. A leak that wastes a lot of water or makes the property unsafe is an urgent repair, and the rental provider must arrange it immediately once notified. Tell them in writing the same day. If they do not act promptly, you can arrange the repair yourself for up to $2,500 and request reimbursement in writing, which must be paid within 7 days. For larger or disputed repairs, contact Rental Dispute Resolution Victoria.",
      },
      {
        question: "How long will the ceiling take to dry after the leak is fixed?",
        answer:
          "It depends how long the leak ran and how much water the ceiling and floor absorbed. A short leak can dry in days. A long running one can take weeks, especially inside a closed ceiling cavity. Plaster should not be closed up or painted until the timber and lining are properly dry, because sealing damp in is how mould starts. Drying time is the part of the job that sets your real timeline.",
      },
    ],
  },
];
