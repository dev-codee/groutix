// Canonical inspection report schema and item definitions for Groutix Field Technicians.
// Matches the official "GROUTIX — INSPECTION REPORT" compact field inspection form.

export type CheckValue = "YES" | "NO" | "";

export interface InspectionSectionItem {
  id: string;
  label: string;
}

export interface InspectionSectionDef {
  key: string;
  title: string;
  items: InspectionSectionItem[];
}

export const INSPECTION_SECTIONS: InspectionSectionDef[] = [
  {
    key: "waterLeakage",
    title: "WATER / LEAKAGE",
    items: [
      { id: "leakage_water_ingress", label: "Leakage / Water Ingress" },
      { id: "water_staining", label: "Water Staining / Discolouration" },
      { id: "moisture_shower_base", label: "Moisture / Dampness Beneath Shower Base" },
      { id: "balcony_water_ingress", label: "Existing / Known Balcony Water-Ingress Issue" },
    ],
  },
  {
    key: "groutCondition",
    title: "GROUT CONDITION",
    items: [
      { id: "failed_cracked_grout", label: "Failed / Cracked / Missing Grout" },
      { id: "mould_black_grout", label: "Mould / Black Grout" },
      { id: "grout_joints_prep", label: "Grout Joints Require Preparation" },
      { id: "movement_joints_attention", label: "Movement Joints Require Attention" },
    ],
  },
  {
    key: "tilesSurface",
    title: "TILES / SURFACE",
    items: [
      { id: "loose_damaged_tiles", label: "Loose / Damaged Tiles" },
      { id: "cracked_tile_repair", label: "Cracked Tile / Localised Tile Repair" },
      { id: "mosaic_tiles_present", label: "Mosaic Tiles Present" },
      { id: "surface_dirt_contamination", label: "Surface Dirt / Contamination" },
      { id: "deep_staining_contamination", label: "Deep Staining / Embedded Contamination" },
    ],
  },
  {
    key: "areaLocation",
    title: "AREA / LOCATION",
    items: [
      { id: "shower_walls", label: "Shower Walls" },
      { id: "shower_floor", label: "Shower Floor" },
      { id: "bath_area", label: "Bath Area" },
      { id: "shower_pan_base", label: "Shower Pan / Base" },
      { id: "floor_only", label: "Floor Only" },
      { id: "walls_only", label: "Walls Only" },
      { id: "walls_and_floor", label: "Walls & Floor" },
      { id: "walls_to_pan", label: "Walls to Pan" },
      { id: "ceiling_height_works", label: "Ceiling Height Works" },
      { id: "shower_screen_height", label: "Shower Screen Height / Approx. 2.1 m" },
    ],
  },
  {
    key: "siliconeSealing",
    title: "SILICONE / SEALING",
    items: [
      { id: "failed_silicone", label: "Failed Silicone / Sealant" },
      { id: "tile_to_tile_junctions", label: "Tile-to-Tile Junctions" },
      { id: "tile_to_floor_junctions", label: "Tile-to-Floor Junctions" },
      { id: "tile_to_bath_junction", label: "Tile-to-Bath Junction" },
      { id: "tile_to_pan_junction", label: "Tile-to-Pan Junction" },
      { id: "perimeter_junction_sealing", label: "Perimeter / Junction Sealing" },
      { id: "plumbing_penetrations", label: "Plumbing Penetrations" },
    ],
  },
  {
    key: "showerScreenCaulking",
    title: "SHOWER SCREEN CAULKING",
    items: [
      { id: "vertical_inside", label: "Vertical Inside" },
      { id: "vertical_outside", label: "Vertical Outside" },
      { id: "horizontal_inside", label: "Horizontal Inside" },
      { id: "horizontal_outside", label: "Horizontal Outside" },
    ],
  },
  {
    key: "treatmentAdditionalWork",
    title: "TREATMENT / ADDITIONAL WORK",
    items: [
      { id: "mould_treatment_required", label: "Mould Treatment Required" },
      { id: "cleaning_surface_prep", label: "Cleaning / Surface Preparation Required" },
      { id: "penetrating_grout_sealer", label: "Penetrating Grout Sealer Required" },
      { id: "epoxy_grout_upgrade", label: "Epoxy Grout Upgrade Appropriate" },
      { id: "polymer_flex_grout", label: "Polymer / Flex Grout Appropriate" },
      { id: "shower_screen_replacement", label: "Shower Screen Replacement / Additional Work" },
    ],
  },
  {
    key: "junctionsMovement",
    title: "JUNCTIONS / MOVEMENT",
    items: [
      { id: "wall_to_floor_junctions", label: "Wall-to-Floor Junctions" },
      { id: "wall_to_wall_junctions", label: "Wall-to-Wall / Tile-to-Tile Junctions" },
      { id: "movement_joints", label: "Movement Joints" },
    ],
  },
];

export interface InspectionReportDoc {
  // Header details
  customerName?: string;
  inspectionDate?: string;
  inspectorName?: string;
  propertyAddress?: string;
  leadJobNo?: string;
  room?: string;

  // Answers keyed by itemId ("YES" | "NO" | "")
  findings: Record<string, CheckValue>;

  // Additional freeform fields
  otherDetails?: string;
  quoteBuildFromReport?: CheckValue;
  inspectorNotes?: string;
  inspectorSignature?: string;
  customerAcknowledgement?: string;

  // Metadata
  status?: "draft" | "completed";
  completedAt?: string;
  updatedAt?: string;
}

/** Calculate findings count (YES, NO, Unanswered) */
export function calculateInspectionSummary(findings: Record<string, CheckValue> = {}) {
  let yesCount = 0;
  let noCount = 0;
  let totalItems = 0;

  for (const section of INSPECTION_SECTIONS) {
    for (const item of section.items) {
      totalItems++;
      const val = findings[item.id];
      if (val === "YES") yesCount++;
      else if (val === "NO") noCount++;
    }
  }

  const unansweredCount = totalItems - (yesCount + noCount);

  return {
    yesCount,
    noCount,
    unansweredCount,
    totalItems,
  };
}
