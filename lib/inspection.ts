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
    key: "propertyRoom",
    title: "Property / Room",
    items: [
      { id: "main_bathroom", label: "Main Bathroom" },
      { id: "ensuite", label: "Ensuite" },
      { id: "guest_bathroom", label: "Guest Bathroom" },
      { id: "balcony_exterior", label: "Balcony / Exterior" },
      { id: "single_shower", label: "Single Shower" },
      { id: "double_shower", label: "Double Shower" },
    ],
  },
  {
    key: "areaWorkCoverage",
    title: "Area / Work Coverage",
    items: [
      { id: "shower_walls", label: "Shower Walls" },
      { id: "shower_floor", label: "Shower Floor" },
      { id: "bath_area", label: "Bath Area" },
      { id: "shower_pan_base", label: "Shower Pan / Base" },
      { id: "floor_only", label: "Floor Only" },
      { id: "walls_only", label: "Walls Only" },
      { id: "walls_and_floor", label: "Walls & Floor" },
      { id: "walls_to_pan", label: "Walls to Pan" },
      { id: "ceiling_height", label: "Ceiling Height" },
      { id: "shower_screen_height", label: "Shower Screen Height / Approx. 2.1 m" },
    ],
  },
  {
    key: "waterLeakage",
    title: "Water / Leakage",
    items: [
      { id: "leakage_water_ingress", label: "Leakage / Water Ingress" },
      { id: "water_staining", label: "Water Staining / Discolouration" },
      { id: "moisture_shower_base", label: "Moisture Beneath Shower Base" },
      { id: "balcony_water_ingress", label: "Known Balcony Waterproofing / Leak Issue" },
    ],
  },
  {
    key: "groutCondition",
    title: "Grout Condition",
    items: [
      { id: "failed_cracked_grout", label: "Failed / Cracked / Missing Grout" },
      { id: "mould_black_grout", label: "Mould / Black Grout" },
      { id: "grout_joints_prep", label: "Grout Joint Preparation" },
      { id: "movement_joint_condition", label: "Movement Joint Condition" },
    ],
  },
  {
    key: "tilesSurface",
    title: "Tiles / Surface",
    items: [
      { id: "loose_damaged_tiles", label: "Loose / Damaged Tiles" },
      { id: "cracked_tile_repair", label: "Cracked Tile Repair" },
      { id: "mosaic_tiles", label: "Mosaic Tiles" },
      { id: "dirt_surface_contamination", label: "Dirt / Surface Contamination" },
      { id: "deep_staining_contamination", label: "Deep Staining / Embedded Contamination" },
    ],
  },
  {
    key: "siliconeSealing",
    title: "Silicone / Sealing",
    items: [
      { id: "failed_silicone", label: "Failed Silicone / Sealant" },
      { id: "tile_to_tile", label: "Tile-to-Tile" },
      { id: "tile_to_floor", label: "Tile-to-Floor" },
      { id: "tile_to_bath", label: "Tile-to-Bath" },
      { id: "tile_to_pan", label: "Tile-to-Pan" },
      { id: "perimeter_joints", label: "Perimeter Joints" },
      { id: "plumbing_penetrations", label: "Plumbing Penetrations" },
      { id: "shower_screen_vertical_io", label: "Shower Screen Vertical Inside/Outside" },
      { id: "shower_screen_horizontal_io", label: "Shower Screen Horizontal Inside/Outside" },
    ],
  },
  {
    key: "treatmentAdditionalWork",
    title: "Treatment / Additional Work",
    items: [
      { id: "mould_treatment", label: "Mould Treatment" },
      { id: "pressure_washing_prep", label: "Pressure Washing / Surface Preparation" },
      { id: "penetrating_grout_sealer", label: "Penetrating Grout Sealer" },
      { id: "epoxy_grout_upgrade", label: "Epoxy Grout Upgrade" },
      { id: "shower_screen_replacement", label: "Shower Screen Replacement" },
    ],
  },
  {
    key: "junctionsMovement",
    title: "Junctions / Movement",
    items: [
      { id: "wall_to_floor", label: "Wall-to-Floor" },
      { id: "wall_to_wall", label: "Wall-to-Wall / Tile-to-Tile" },
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
  estimatedTime?: string;
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
