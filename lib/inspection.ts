// Groutix Simplified Site Inspection — data model matching the PDF form.
// Rooms repeat per work area; parking is recorded once for the property.

export type CheckValue = "YES" | "NO" | "";

// ── Room types ────────────────────────────────────────────────────────────────

export type RoomType = "main_bathroom" | "ensuite" | "guest_bathroom" | "other";
export type WorkAreaType = "shower" | "bathroom_floor" | "bath" | "vanity" | "other";
export type ShowerSizeType = "single" | "double" | "custom_extended";
export type WorkConfigType =
  | "walls_and_tiled_floor"
  | "walls_to_pan"
  | "walls_to_bath"
  | "walls_only"
  | "shower_floor_only";
export type WallHeightType = "shower_screen_height" | "to_ceiling" | "custom_section";

export type IssueType =
  | "cracked_missing_grout"
  | "deteriorated_missing_silicone"
  | "mould_staining"
  | "cracked_chipped_tiles"
  | "loose_drummy_tiles"
  | "visible_water_damage"
  | "other";

export type LeakReportedType = "yes" | "no" | "unknown";
export type LeakObservedType = "yes" | "no" | "inconclusive" | "not_assessed";

export type RecommendedWorkType =
  | "regrout"
  | "replace_silicone"
  | "tile_repair"
  | "additional_caulking"
  | "other_work"
  | "further_investigation";

export type GroutType = "polymer" | "epoxy" | "quote_both" | "to_confirm";

export interface IssueDetail {
  type: IssueType;
  where?: string;
  extraNote?: string;
}

export interface RoomInspection {
  id: string;
  roomType: RoomType;
  roomName?: string;
  workAreas: WorkAreaType[];

  // Shower details (shown only when "shower" in workAreas)
  showerSize?: ShowerSizeType;
  showerWidthMm?: number;
  showerDepthMm?: number;
  workConfig?: WorkConfigType;
  wallHeight?: WallHeightType;
  wallHeightMm?: number;
  wallHeightCustomSection?: string;

  // Section 3 — Issues
  issues: IssueType[];
  noVisibleDefects?: boolean;
  notInspected?: boolean;
  issueDetails?: IssueDetail[];

  // Leaks
  leakReportedByCustomer?: LeakReportedType;
  leakObserved?: LeakObservedType;

  // Section 4 — Recommended work
  recommendedWork: RecommendedWorkType[];
  noWorkRecommended?: boolean;
  groutType?: GroutType;
  groutColour?: string;
  siliconeColour?: string;
  accessLimitations?: string;
  additionalNotes?: string;
}

// ── Parking ───────────────────────────────────────────────────────────────────

export type ParkingType =
  | "client_allocated"
  | "driveway_onsite"
  | "visitor_parking"
  | "free_street"
  | "paid_street"
  | "paid_car_park"
  | "building_basement"
  | "loading_dropoff"
  | "no_suitable"
  | "to_be_confirmed"
  | "other";

export type ParkingRestrictionType =
  | "none_known"
  | "time_limit"
  | "permit_required"
  | "building_approval"
  | "gate_concierge"
  | "height_restriction"
  | "long_walk";

export type CostArrangementType =
  | "included_in_quote"
  | "charged_separately"
  | "client_pays_directly"
  | "to_be_confirmed";

export interface ParkingInfo {
  types: ParkingType[];
  spaceLocation?: string;
  // Paid parking (shown when paid_street | paid_car_park | building_basement selected)
  paidCostPerHour?: number;
  paidFlatFee?: number;
  paidEstimatedTotal?: number;
  costArrangement?: CostArrangementType;
  chargedSeparatelyAllowance?: number;
  chargedSeparatelyToConfirm?: boolean;
  // Restrictions
  restrictions: ParkingRestrictionType[];
  timeLimit?: string;
  allowedHours?: string;
  heightClearanceM?: number;
  permitArrangedBy?: string;
  permitStatus?: "confirmed" | "pending";
  entryInstructions?: string;
}

// ── Top-level report ──────────────────────────────────────────────────────────

export interface InspectionReportDoc {
  // Header (prefilled from lead)
  customerName?: string;
  inspectionDate?: string;
  inspectorName?: string;
  propertyAddress?: string;
  leadJobNo?: string;

  // Multi-room inspections
  rooms?: RoomInspection[];

  // Parking (once for the property)
  parking?: ParkingInfo;

  // Kept from before — estimated time and tech suggestion
  estimatedTime?: string;
  suggestedTechnician?: string;
  quoteBuildFromReport?: CheckValue;
  warrantyEligible?: CheckValue;
  inspectorNotes?: string;
  inspectorSignature?: string;
  customerAcknowledgement?: string;

  // Legacy backward-compat (old checklist data)
  findings?: Record<string, CheckValue>;
  otherDetails?: string;
  room?: string;

  // Metadata
  status?: "draft" | "completed";
  completedAt?: string;
  updatedAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function makeRoom(overrides: Partial<RoomInspection> = {}): RoomInspection {
  return {
    id: Math.random().toString(36).slice(2),
    roomType: "main_bathroom",
    workAreas: [],
    issues: [],
    recommendedWork: [],
    ...overrides,
  };
}

export function calculateInspectionSummary(report: InspectionReportDoc) {
  const rooms = report.rooms || [];
  const totalRooms = rooms.length;
  const roomsWithIssues = rooms.filter((r) => r.issues.length > 0 || r.noVisibleDefects).length;
  const roomsWithWork = rooms.filter((r) => r.recommendedWork.length > 0 || r.noWorkRecommended).length;
  return { totalRooms, roomsWithIssues, roomsWithWork };
}

// Keep old signature for any callers that pass findings record
export function calculateInspectionSummaryLegacy(findings: Record<string, CheckValue> = {}) {
  let yesCount = 0;
  let noCount = 0;
  let total = 0;
  for (const v of Object.values(findings)) {
    total++;
    if (v === "YES") yesCount++;
    else if (v === "NO") noCount++;
  }
  return { yesCount, noCount, unansweredCount: total - yesCount - noCount, totalItems: total };
}

// ── Label maps ────────────────────────────────────────────────────────────────

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  main_bathroom: "Main Bathroom",
  ensuite: "Ensuite",
  guest_bathroom: "Guest Bathroom",
  other: "Other",
};

export const WORK_AREA_LABELS: Record<WorkAreaType, string> = {
  shower: "Shower",
  bathroom_floor: "Bathroom Floor",
  bath: "Bath",
  vanity: "Vanity",
  other: "Other",
};

export const SHOWER_SIZE_LABELS: Record<ShowerSizeType, string> = {
  single: "Single",
  double: "Double",
  custom_extended: "Custom / Extended",
};

export const WORK_CONFIG_LABELS: Record<WorkConfigType, string> = {
  walls_and_tiled_floor: "Walls and Tiled Floor",
  walls_to_pan: "Walls to Pan / Tray",
  walls_to_bath: "Walls to Bath",
  walls_only: "Walls Only",
  shower_floor_only: "Shower Floor Only",
};

export const WALL_HEIGHT_LABELS: Record<WallHeightType, string> = {
  shower_screen_height: "Shower-Screen Height",
  to_ceiling: "To Ceiling",
  custom_section: "Custom Section",
};

export const ISSUE_LABELS: Record<IssueType, string> = {
  cracked_missing_grout: "Cracked / Missing Grout",
  deteriorated_missing_silicone: "Deteriorated / Missing Silicone",
  mould_staining: "Mould / Staining",
  cracked_chipped_tiles: "Cracked / Chipped Tiles",
  loose_drummy_tiles: "Loose / Drummy Tiles",
  visible_water_damage: "Visible Water Damage",
  other: "Other",
};

export const RECOMMENDED_WORK_LABELS: Record<RecommendedWorkType, string> = {
  regrout: "Regrout Selected Area",
  replace_silicone: "Replace Silicone",
  tile_repair: "Tile Repair / Replacement",
  additional_caulking: "Additional Caulking",
  other_work: "Other Work",
  further_investigation: "Further Investigation",
};

export const GROUT_TYPE_LABELS: Record<GroutType, string> = {
  polymer: "Polymer",
  epoxy: "Epoxy",
  quote_both: "Quote Both Separately",
  to_confirm: "To Confirm",
};

export const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
  client_allocated: "Client Allocated Space",
  driveway_onsite: "Driveway / Onsite",
  visitor_parking: "Visitor Parking",
  free_street: "Free Street Parking",
  paid_street: "Paid Street Parking",
  paid_car_park: "Paid Car Park",
  building_basement: "Building / Basement Parking",
  loading_dropoff: "Loading / Drop-Off Only",
  no_suitable: "No Suitable Parking",
  to_be_confirmed: "To Be Confirmed",
  other: "Other",
};

export const PARKING_RESTRICTION_LABELS: Record<ParkingRestrictionType, string> = {
  none_known: "None Known",
  time_limit: "Time Limit",
  permit_required: "Permit / Booking Required",
  building_approval: "Building Approval",
  gate_concierge: "Gate / Remote / Concierge Access",
  height_restriction: "Height / Vehicle-Size Restriction",
  long_walk: "Long Walk / Difficult Unloading",
};

export const COST_ARRANGEMENT_LABELS: Record<CostArrangementType, string> = {
  included_in_quote: "Included in Quote",
  charged_separately: "Charged Separately",
  client_pays_directly: "Client Pays Directly",
  to_be_confirmed: "To Be Confirmed",
};
