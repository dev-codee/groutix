// Zone rules — the single source of truth for WHERE we go and WHICH DAY we go
// there (service radii, the seven day-wise zones, coastal skips, per-suburb
// overrides).
//
// Managers edit these from the admin dashboard (Settings → Service Zones); they
// are stored in MongoDB (see lib/zoneRulesServer.ts) and every part of the site —
// the customer booking page, the quote form, confirmation emails, the admin slot
// pickers and the dispatch engine — derives its zoning from here.
//
// This file is dependency-free so it can be imported by server routes AND client
// components, and so lib/scheduling.ts can import it without a cycle. The defaults
// reproduce the Inspection Routing & Scheduling Plan exactly.

export type OuterZone =
  | "mon_south_west"
  | "tue_south"
  | "wed_west"
  | "thu_north"
  | "fri_north_east"
  | "sat_east"
  | "sun_south_east";

export type Zone = OuterZone | "inner" | "flexible" | "coastal" | "outside";

/** The seven outer zones, in the plan's weekday order (Mon → Sun). */
export const OUTER_ZONES: OuterZone[] = [
  "mon_south_west",
  "tue_south",
  "wed_west",
  "thu_north",
  "fri_north_east",
  "sat_east",
  "sun_south_east",
];

/** Compass name of each outer zone, with no day attached. */
export const ZONE_DIRECTION: Record<OuterZone, string> = {
  mon_south_west: "South-West",
  tue_south: "South",
  wed_west: "West",
  thu_north: "North",
  fri_north_east: "North-East",
  sat_east: "East",
  sun_south_east: "South-East",
};

/** Short zone name for admin lists, badges and route summaries. */
export const ZONE_SHORT: Record<Zone, string> = {
  ...ZONE_DIRECTION,
  inner: "Daily Flex",
  flexible: "Greater Melb",
  coastal: "Coastal (skip)",
  outside: "Outside area",
};

/** Tailwind colour tokens per zone, matching the routing plan's map colours. */
export const ZONE_COLOR: Record<Zone, { bg: string; text: string; dot: string }> = {
  mon_south_west: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
  tue_south: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  wed_west: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
  thu_north: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-300" },
  fri_north_east: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-400" },
  sat_east: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  sun_south_east: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  inner: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  flexible: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  coastal: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-300" },
  outside: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-300" },
};

/**
 * Which weekday each outer zone is serviced on (0 = Sunday … 6 = Saturday).
 * This is the plan's day-wise zoning; managers may reassign it.
 */
export const DEFAULT_ZONE_DAYS: Record<OuterZone, number> = {
  sun_south_east: 0,
  mon_south_west: 1,
  tue_south: 2,
  wed_west: 3,
  thu_north: 4,
  fri_north_east: 5,
  sat_east: 6,
};

/**
 * The seven outer zones as compass sectors from base, clockwise from North. Each
 * entry is the exclusive upper bound of that sector; the list is scanned in order
 * and `thu_north` wraps around 0°.
 *
 * These cuts are geometry, not policy — they were chosen so every suburb the
 * routing plan names lands in the zone the plan assigns it. Policy changes are
 * made with per-suburb overrides (see ZoneRules.suburbOverrides), which is both
 * safer and easier to reason about than rotating a boundary.
 */
export const SECTORS: { untilDeg: number; zone: OuterZone }[] = [
  { untilDeg: 45, zone: "thu_north" },        // 340° – 45°   N
  { untilDeg: 95, zone: "fri_north_east" },   //  45° – 95°   NE
  { untilDeg: 125, zone: "sat_east" },        //  95° – 125°  E
  { untilDeg: 147, zone: "sun_south_east" },  // 125° – 147°  SE
  { untilDeg: 185, zone: "tue_south" },       // 147° – 185°  S
  { untilDeg: 228, zone: "mon_south_west" },  // 185° – 228°  SW
  { untilDeg: 340, zone: "wed_west" },        // 228° – 340°  W
];

/** The outer zone a compass bearing (degrees clockwise from North) falls in. */
export function sectorZoneFromBearing(bearingDeg: number): OuterZone {
  const b = ((bearingDeg % 360) + 360) % 360;
  for (const s of SECTORS) if (b < s.untilDeg) return s.zone;
  return "thu_north"; // 340° – 360° wraps back into North
}

/**
 * Coastal / Southern Ocean suburbs the routing plan skips ("No Coastal/Southern
 * Ocean Area"). These are beachfront or peninsula suburbs where the job mix isn't
 * worth the drive; the inland neighbours the plan names — Altona, Hampton,
 * Brighton East, Cheltenham, Elsternwick — are deliberately NOT in this list.
 */
export const DEFAULT_COASTAL_EXCLUDED: string[] = [
  // Inner bay strip
  "port melbourne", "albert park", "middle park", "st kilda", "elwood",
  "brighton", "sandringham", "black rock", "beaumaris",
  // Bayside south
  "mentone", "parkdale", "mordialloc", "aspendale", "edithvale", "chelsea",
  "bonbeach", "patterson lakes", "carrum", "seaford",
  // Western shoreline
  "williamstown", "seaholme", "werribee south",
  // Mornington Peninsula
  "frankston", "mount eliza", "mornington", "dromana", "rosebud", "rye",
  "blairgowrie", "sorrento", "portsea", "cape schanck",
  // Bellarine Peninsula
  "queenscliff", "st leonards", "indented head", "ocean grove",
];

/**
 * Suburbs whose zone the plan assigns differently from their raw compass sector.
 * The plan's Day-wise Zone table lists Oakleigh and Clarinda under Tuesday (South)
 * with Bentleigh and Moorabbin, even though they sit a few degrees into the
 * South-East sector; Hughesdale and Huntingdale come along so the pocket isn't
 * split. Clayton, Chadstone, Glen Waverley, Mulgrave and Rowville stay on Sunday
 * (South-East) exactly as the plan lists them.
 */
export const DEFAULT_SUBURB_OVERRIDES: Record<string, OuterZone> = {
  oakleigh: "tue_south",
  "oakleigh east": "tue_south",
  clarinda: "tue_south",
  hughesdale: "tue_south",
  huntingdale: "tue_south",
};

export interface ZoneRules {
  /**
   * Master switch for day-wise zoning. When off, every serviceable address is
   * bookable on any open day — the right setting once there are enough inspectors
   * to cover more than one direction per day (the plan's "Future Expansion").
   */
  dayWiseEnabled: boolean;
  /** Inner "daily flex" circle (km): this close to base, any open day is bookable. */
  flexRadiusKm: number;
  /** Outer edge of the service area (km): nothing beyond this is bookable online. */
  maxRadiusKm: number;
  /** Weekday each outer zone is serviced on (0 = Sunday … 6 = Saturday). */
  zoneDays: Record<OuterZone, number>;
  /** Lower-case suburb names we skip entirely (coastal / ocean areas). */
  coastalExcluded: string[];
  /** Lower-case suburb name → the zone it is serviced in, overriding its sector. */
  suburbOverrides: Record<string, OuterZone>;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_ZONE_RULES: ZoneRules = {
  dayWiseEnabled: true,
  flexRadiusKm: 15,
  maxRadiusKm: 50,
  zoneDays: DEFAULT_ZONE_DAYS,
  coastalExcluded: DEFAULT_COASTAL_EXCLUDED,
  suburbOverrides: DEFAULT_SUBURB_OVERRIDES,
};

// ── Queries ──────────────────────────────────────────────────────────────────

/** Is `zone` one of the seven outer day-wise zones (rather than inner/flexible)? */
export function isOuterZone(zone: Zone): zone is OuterZone {
  return (OUTER_ZONES as string[]).includes(zone);
}

/** The weekday an outer zone runs on, or null for inner/flexible/unserviced. */
export function zoneWeekday(zone: Zone, rules: ZoneRules = DEFAULT_ZONE_RULES): number | null {
  return isOuterZone(zone) ? rules.zoneDays[zone] ?? DEFAULT_ZONE_DAYS[zone] : null;
}

/**
 * Day-wise zoning gate: may this zone be visited on this weekday?
 *
 * Inner (daily-flex) and unclassified "flexible" areas are bookable on any open
 * day. Outer areas are bookable ONLY on their zone's weekday, which is what stops
 * one day's route spanning opposite sides of Melbourne (Key Rule 9: "Do not mix
 * opposite zones on the same day").
 */
export function isZoneDay(zone: Zone, weekday: number, rules: ZoneRules = DEFAULT_ZONE_RULES): boolean {
  if (!rules.dayWiseEnabled) return true;
  const wd = zoneWeekday(zone, rules);
  return wd === null || wd === weekday;
}

const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Mondays" / "Saturdays" — the day an outer zone runs on, else null. */
export function zoneDayName(zone: Zone, rules: ZoneRules = DEFAULT_ZONE_RULES): string | null {
  if (!rules.dayWiseEnabled) return null;
  const wd = zoneWeekday(zone, rules);
  return wd === null ? null : `${WEEKDAY_LONG[wd]}s`;
}

/** Full label for a zone, e.g. "East (15 – 50 km) — Saturdays". */
export function zoneLabel(zone: Zone, rules: ZoneRules = DEFAULT_ZONE_RULES): string {
  if (zone === "inner") return `Daily Flex Area (0 – ${rules.flexRadiusKm} km from base) — any day`;
  if (zone === "flexible") return "Greater Melbourne";
  if (zone === "coastal") return "Coastal / Ocean area — not serviced";
  if (zone === "outside") return `Outside ${rules.maxRadiusKm} km Service Area (from base)`;
  const range = `${rules.flexRadiusKm} – ${rules.maxRadiusKm} km`;
  const day = zoneDayName(zone, rules);
  return day
    ? `${ZONE_DIRECTION[zone]} (${range}) — ${day}`
    : `${ZONE_DIRECTION[zone]} (${range})`;
}

/** Zones grouped by the weekday they run on — the "what do I cover today?" view. */
export function zonesByWeekday(rules: ZoneRules = DEFAULT_ZONE_RULES): Record<number, OuterZone[]> {
  const out: Record<number, OuterZone[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const z of OUTER_ZONES) {
    const wd = zoneWeekday(z, rules);
    if (wd !== null) out[wd].push(z);
  }
  return out;
}

// ── Validation ───────────────────────────────────────────────────────────────

const normName = (s: unknown) => String(s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

/**
 * Coerce untrusted input (DB document or API body) into a complete, valid rules
 * object, filling gaps from the defaults. Never throws.
 */
export function sanitizeZoneRules(input: unknown): ZoneRules {
  const src = (input && typeof input === "object" ? input : {}) as Partial<ZoneRules>;
  const D = DEFAULT_ZONE_RULES;

  const num = (v: unknown, min: number, max: number, fb: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : fb;
  };

  const flexRadiusKm = num(src.flexRadiusKm, 0, 200, D.flexRadiusKm);
  // The outer edge can never sit inside the flex circle, or there'd be no outer
  // area at all and every zone day would be unreachable.
  const maxRadiusKm = Math.max(num(src.maxRadiusKm, 1, 500, D.maxRadiusKm), flexRadiusKm);

  const zoneDays = {} as Record<OuterZone, number>;
  for (const z of OUTER_ZONES) {
    const v = Math.round(Number((src.zoneDays as Record<string, unknown>)?.[z]));
    zoneDays[z] = Number.isFinite(v) && v >= 0 && v <= 6 ? v : D.zoneDays[z];
  }

  const coastalExcluded = Array.isArray(src.coastalExcluded)
    ? [...new Set(src.coastalExcluded.map(normName).filter(Boolean))].sort()
    : D.coastalExcluded;

  const suburbOverrides: Record<string, OuterZone> = {};
  const rawOverrides = (src.suburbOverrides && typeof src.suburbOverrides === "object"
    ? src.suburbOverrides
    : D.suburbOverrides) as Record<string, unknown>;
  for (const [name, zone] of Object.entries(rawOverrides)) {
    const key = normName(name);
    if (key && OUTER_ZONES.includes(zone as OuterZone)) suburbOverrides[key] = zone as OuterZone;
  }

  return {
    dayWiseEnabled: typeof src.dayWiseEnabled === "boolean" ? src.dayWiseEnabled : D.dayWiseEnabled,
    flexRadiusKm,
    maxRadiusKm,
    zoneDays,
    coastalExcluded,
    suburbOverrides,
    updatedAt: typeof src.updatedAt === "string" ? src.updatedAt : undefined,
    updatedBy: typeof src.updatedBy === "string" ? src.updatedBy : undefined,
  };
}

/** Human-readable problems with a rules object (empty = OK to save). */
export function validateZoneRules(rules: ZoneRules): string[] {
  const errors: string[] = [];
  if (rules.flexRadiusKm >= rules.maxRadiusKm) {
    errors.push("The daily-flex radius must be smaller than the service-area radius.");
  }
  if (rules.dayWiseEnabled) {
    // Two zones sharing a weekday is exactly the "opposite zones on the same day"
    // the plan forbids, so it's worth blocking rather than silently allowing.
    const byDay = zonesByWeekday(rules);
    for (const [wd, zones] of Object.entries(byDay)) {
      if (zones.length > 1) {
        errors.push(
          `${WEEKDAY_LONG[Number(wd)]} has ${zones.length} zones (${zones
            .map((z) => ZONE_DIRECTION[z])
            .join(", ")}) — one inspector can't cover opposite zones on the same day.`
        );
      }
    }
  }
  return errors;
}

/** Zones left with no day of their own — unbookable until the clash is fixed. */
export function unreachableZones(rules: ZoneRules): OuterZone[] {
  if (!rules.dayWiseEnabled) return [];
  const byDay = zonesByWeekday(rules);
  return OUTER_ZONES.filter((z) => {
    const wd = zoneWeekday(z, rules);
    return wd !== null && byDay[wd].length > 1 && byDay[wd][0] !== z;
  });
}
