// Melbourne inspection routing & scheduling — 1 inspector, 50 km service area.
//
// Operational rules (Inspection Routing & Scheduling Plan):
//   • Base: 82A Marigold Cres, Gowanbrae VIC 3043.
//   • Total service area: within 50 km of base. Anything further is not bookable.
//   • Inner 0 – 15 km ("daily flex", green circle) → bookable on ANY open day
//     (Mon – Sun). Inner leads are nudged toward days that already have bookings
//     nearby so the inspector's travel stays clustered.
//   • Outer 15 – 50 km → split into seven compass sectors, one per weekday, so the
//     inspector only ever drives one direction on a given day:
//       - Monday:    South-West  (Sunshine, Albion, Brooklyn, Altona inland,
//                                 Laverton, Hoppers Crossing, Werribee)
//       - Tuesday:   South       (Bentleigh, Moorabbin, Clarinda, Oakleigh,
//                                 Hampton inland)
//       - Wednesday: West        (Melton, Caroline Springs, St Albans, Keilor,
//                                 Deer Park, Rockbank, Taylors Hill, Tarneit)
//       - Thursday:  North       (Craigieburn, Mickleham, Donnybrook, Kalkallo,
//                                 Wallan)
//       - Friday:    North-East  (Epping, Lalor, Thomastown, Bundoora, Reservoir,
//                                 Mill Park, South Morang)
//       - Saturday:  East        (Ringwood, Croydon, Lilydale, Mount Evelyn,
//                                 Mooroolbark, Kilsyth, Wantirna)
//       - Sunday:    South-East  (Glen Waverley, Chadstone, Clayton, Mulgrave,
//                                 Rowville)
//   • Coastal / Southern Ocean areas are skipped entirely (Port Melbourne,
//     St Kilda beachfront, Brighton, Sandringham, the Mornington Peninsula and the
//     Bellarine), even when they fall inside 50 km.
//   • Unknown/unlisted suburbs inside the radius fall back to "flexible" (any day).

import {
  DEFAULT_BOOKING_RULES,
  formatHHmm,
  fromMinutes,
  nextChangeover,
  openDaysSummary,
  slotsForDate,
  toMinutes,
  weekdayOf,
  WEEKDAY_NAMES,
  type BookingRules,
  type BookingType,
} from "./bookingRules";

// HQ base location: 82A Marigold Cres, Gowanbrae VIC 3043, Australia (exact
// street address, not the Tullamarine suburb centroid).
export const BASE_LOCATION = { lat: -37.6988298, lng: 144.9004405 };
/** @deprecated Historical name for BASE_LOCATION — kept so existing imports keep working. */
export const TULLAMARINE = BASE_LOCATION;

/** Inner "daily flex" circle: anywhere this close to base is bookable on any open day. */
export const DAILY_FLEX_RADIUS_KM = 15;
/** @deprecated Historical name for DAILY_FLEX_RADIUS_KM. */
export const RADIUS_KM = DAILY_FLEX_RADIUS_KM;
/** Outer edge of the service area — nothing beyond this is bookable online. */
export const MAX_INSPECTION_RADIUS_KM = 50;

// Open days, daily hours, slot length, booking window and closures are NOT
// hard-coded here — they come from the manager-editable BookingRules
// (lib/bookingRules.ts, stored via lib/bookingRulesServer.ts). The day-wise zoning
// below narrows those open days further for outer-area customers.

/** Friendly slot window label: "09:00" → "9:00 AM – 10:00 AM" */
export function formatSlotRange(t: string, durationMinutes: number = 60): string {
  const start = toMinutes(t);
  return `${formatHHmm(t)} – ${formatHHmm(fromMinutes((start + durationMinutes) % (24 * 60)))}`;
}

/**
 * Format an appointment timestamp for display.
 *
 * Appointment fields (`inspectionAt`, `jobAt`, customer bookings) are stored as
 * NAIVE local Melbourne wall-clock strings, e.g. "2026-10-05T09:00" — there is no
 * timezone designator and the HH:mm is exactly the time the customer/staff picked.
 *
 * The old display code did `new Date(str).toLocaleString(..., { timeZone })`, which
 * reinterprets the string in the VIEWER's timezone and then re-renders it in
 * another zone — so a 9:00 AM slot showed a shifted hour on any machine not set to
 * Melbourne time (and shifted again across the AU DST boundary). We format the
 * stored wall-clock directly instead, with zero timezone conversion.
 *
 * Values that genuinely carry a timezone (ending in "Z" or a "+hh:mm" offset, e.g.
 * `createdAt = new Date().toISOString()`) are still converted to Melbourne time,
 * which is correct for those absolute instants.
 */
const NAIVE_DT_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
const HAS_TZ_RE = /(Z|[+-]\d{2}:?\d{2})$/;

export function formatAppt(
  value: string | null | undefined,
  opts: Intl.DateTimeFormatOptions
): string {
  if (!value) return "";
  const str = String(value).trim();
  const m = NAIVE_DT_RE.exec(str);
  if (m && !HAS_TZ_RE.test(str)) {
    // Naive Melbourne wall-clock: render the literal components with no shift by
    // placing them into UTC and reading them back out in UTC.
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    return d.toLocaleString("en-AU", { ...opts, timeZone: "UTC" });
  }
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString("en-AU", { timeZone: "Australia/Melbourne", ...opts });
}

/** Appointment date, e.g. "5 Oct 2026" (pass extra opts to tweak). */
export function formatApptDate(
  value: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  return formatAppt(value, opts);
}

/** Appointment time, e.g. "9:00 AM". */
export function formatApptTime(value: string | null | undefined): string {
  return formatAppt(value, { hour: "numeric", minute: "2-digit", hour12: true });
}

/** 1-hour appointment window, e.g. "9:00 AM – 10:00 AM". */
export function formatApptTimeRange(
  value: string | null | undefined,
  durationHours: number = 1
): string {
  if (!value) return "";
  const str = String(value).trim();
  if (HAS_TZ_RE.test(str)) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      const start = d.toLocaleString("en-AU", {
        timeZone: "Australia/Melbourne",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const endD = new Date(d.getTime() + durationHours * 3600 * 1000);
      const end = endD.toLocaleString("en-AU", {
        timeZone: "Australia/Melbourne",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${start} – ${end}`;
    }
  }
  const start = formatApptTime(value);
  if (!start) return "";
  const m = NAIVE_DT_RE.exec(str);
  if (!m) return start;
  const endH = (+m[4] + durationHours) % 24;
  const pad = (n: number) => String(n).padStart(2, "0");
  const endValue = `${m[1]}-${m[2]}-${m[3]}T${pad(endH)}:${m[5]}`;
  const end = formatApptTime(endValue);
  return end ? `${start} – ${end}` : start;
}

// Melbourne's UTC offset (ms) at a given absolute instant — DST-aware (AEST/AEDT).
function melbourneOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Melbourne",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asUtc - utcMs;
}

/**
 * Convert a stored appointment value to a real UTC instant (ms since epoch), for
 * timing math (e.g. "how long until the appointment?"). Naive wall-clock strings
 * ("YYYY-MM-DDTHH:mm", no offset) are interpreted as Melbourne local time so the
 * instant is correct no matter what timezone the server runs in. Values that
 * already carry a timezone are parsed as-is.
 */
export function apptInstantMs(value: string | null | undefined): number {
  if (!value) return NaN;
  const str = String(value).trim();
  const m = NAIVE_DT_RE.exec(str);
  if (!m || HAS_TZ_RE.test(str)) return new Date(str).getTime();
  // Treat the wall-clock as UTC first, then subtract Melbourne's offset at that
  // instant. Bookings are daytime (well clear of the 2–3am DST switch), so a
  // single correction pass is exact here.
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return guess - melbourneOffsetMs(guess);
}

/**
 * Canonicalise an appointment value for STORAGE → naive Melbourne wall-clock
 * "YYYY-MM-DDTHH:mm". This is the single write-side guard: appointment times are
 * always naive wall-clock (see formatAppt), so we drop any seconds / milliseconds
 * / "Z" / "+hh:mm" offset a caller might accidentally include. In particular it
 * neutralises the classic `new Date("...T12:00").toISOString()` mistake, which on
 * a UTC server would otherwise persist "12:00:00.000Z" and shift the appointment
 * by the Melbourne offset on display.
 *
 * Returns undefined for empty input (so clearing a field still works), and passes
 * through anything that isn't a recognisable date-time untouched.
 */
export function normalizeApptString(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/.exec(s);
  return m ? `${m[1]}T${m[2]}:${m[3]}` : s;
}

export type OuterZone =
  | "mon_south_west"
  | "tue_south"
  | "wed_west"
  | "thu_north"
  | "fri_north_east"
  | "sat_east"
  | "sun_south_east";

export type Zone = OuterZone | "inner" | "flexible" | "coastal" | "outside";

export interface AreaInfo {
  suburb: string | null;
  zone: Zone;
  distanceKm: number | null;
  /** True when the address sits in the 0–15 km daily-flex circle (any open day). */
  inner: boolean;
  /** True when we service the address at all (inside 50 km and not a coastal skip). */
  serviced: boolean;
  label: string;
}

export const ZONE_LABEL: Record<Zone, string> = {
  inner: "Daily Flex Area (0 – 15 km from base) — any day",
  mon_south_west: "South-West (15 – 50 km) — Mondays",
  tue_south: "South (15 – 50 km) — Tuesdays",
  wed_west: "West (15 – 50 km) — Wednesdays",
  thu_north: "North (15 – 50 km) — Thursdays",
  fri_north_east: "North-East (15 – 50 km) — Fridays",
  sat_east: "East (15 – 50 km) — Saturdays",
  sun_south_east: "South-East (15 – 50 km) — Sundays",
  flexible: "Greater Melbourne",
  coastal: "Coastal / Ocean area — not serviced",
  outside: "Outside 50 km Service Area (from base)",
};

/** Short zone name for admin lists and route summaries. */
export const ZONE_SHORT: Record<Zone, string> = {
  inner: "Daily Flex",
  mon_south_west: "South-West",
  tue_south: "South",
  wed_west: "West",
  thu_north: "North",
  fri_north_east: "North-East",
  sat_east: "East",
  sun_south_east: "South-East",
  flexible: "Greater Melb",
  coastal: "Coastal (skip)",
  outside: "Outside area",
};

/** The one weekday each outer zone is serviced on (0 = Sunday … 6 = Saturday). */
export const ZONE_WEEKDAY: Record<OuterZone, number> = {
  sun_south_east: 0,
  mon_south_west: 1,
  tue_south: 2,
  wed_west: 3,
  thu_north: 4,
  fri_north_east: 5,
  sat_east: 6,
};

/**
 * The seven outer sectors as compass bearings from base, clockwise from North.
 * Each entry is the exclusive upper bound of that sector; the list is scanned in
 * order and `thu_north` wraps around 0°. The cuts were chosen so every suburb the
 * routing plan names lands in the zone the plan assigns it to.
 */
const SECTORS: { untilDeg: number; zone: OuterZone }[] = [
  { untilDeg: 45, zone: "thu_north" },        // 340° – 45°   N
  { untilDeg: 95, zone: "fri_north_east" },   //  45° – 95°   NE
  { untilDeg: 125, zone: "sat_east" },        //  95° – 125°  E
  { untilDeg: 147, zone: "sun_south_east" },  // 125° – 147°  SE
  { untilDeg: 185, zone: "tue_south" },       // 147° – 185°  S
  { untilDeg: 228, zone: "mon_south_west" },  // 185° – 228°  SW
  { untilDeg: 340, zone: "wed_west" },        // 228° – 340°  W
];

/** Initial bearing (degrees clockwise from North) from base to a point. */
export function bearingFromBase(to: { lat: number; lng: number }): number {
  const phi1 = toRad(BASE_LOCATION.lat);
  const phi2 = toRad(to.lat);
  const dLng = toRad(to.lng - BASE_LOCATION.lng);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Which day-wise outer zone a point falls in, by its compass sector from base. */
export function sectorZone(to: { lat: number; lng: number }): OuterZone {
  const b = bearingFromBase(to);
  for (const s of SECTORS) if (b < s.untilDeg) return s.zone;
  return "thu_north"; // 340° – 360° wraps back into North
}

/**
 * Coastal / Southern Ocean suburbs we skip entirely (plan: "No Coastal/Southern
 * Ocean Area"). These are beachfront or peninsula suburbs where the job mix isn't
 * worth the drive; the inland neighbours listed in the plan — Altona, Hampton,
 * Brighton East, Cheltenham, Elsternwick, Williamstown's inland streets — stay
 * serviceable and are deliberately NOT in this set.
 */
export const COASTAL_EXCLUDED = new Set([
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
]);

// Melbourne suburb centroids and the day-wise outer zone each one belongs to.
// `outerZone` only takes effect beyond the 15 km daily-flex circle, and is this
// table that resolveArea()/resolveAreaByCoords() read — so it is the single source
// of truth for which day a suburb is visited on.
//
// Values are the suburb's compass sector from base (see sectorZone()), except for
// the Oakleigh/Clarinda pocket: the routing plan's Day-wise Zone table lists those
// under Tuesday (South) with Bentleigh and Moorabbin, even though they sit a few
// degrees into the South-East sector. Clayton, Chadstone, Glen Waverley, Mulgrave
// and Rowville stay on Sunday (South-East) exactly as the plan lists them.
export const SUBURBS: { name: string; lat: number; lng: number; outerZone: OuterZone }[] = [
  { name: "abbotsford", lat: -37.808, lng: 144.999, outerZone: "sun_south_east" },
  { name: "aberfeldie", lat: -37.76, lng: 144.896, outerZone: "tue_south" },
  { name: "aintree", lat: -37.721, lng: 144.686, outerZone: "wed_west" },
  { name: "airport west", lat: -37.7211, lng: 144.8836, outerZone: "mon_south_west" },
  { name: "albanvale", lat: -37.755, lng: 144.782, outerZone: "wed_west" },
  { name: "albert park", lat: -37.844, lng: 144.955, outerZone: "tue_south" },
  { name: "albion", lat: -37.775, lng: 144.819, outerZone: "mon_south_west" },
  { name: "alphington", lat: -37.779, lng: 145.03, outerZone: "sun_south_east" },
  { name: "altona", lat: -37.8686, lng: 144.8306, outerZone: "mon_south_west" },
  { name: "altona east", lat: -37.8419, lng: 144.8381, outerZone: "mon_south_west" },
  { name: "altona meadows", lat: -37.878, lng: 144.788, outerZone: "mon_south_west" },
  { name: "altona north", lat: -37.842, lng: 144.848, outerZone: "mon_south_west" },
  { name: "ardeer", lat: -37.781, lng: 144.809, outerZone: "mon_south_west" },
  { name: "armadale", lat: -37.8564, lng: 145.0194, outerZone: "tue_south" },
  { name: "ascot vale", lat: -37.776, lng: 144.916, outerZone: "tue_south" },
  { name: "ashburton", lat: -37.8633, lng: 145.0806, outerZone: "sun_south_east" },
  { name: "ashwood", lat: -37.8675, lng: 145.1008, outerZone: "sun_south_east" },
  { name: "aspendale", lat: -38.0269, lng: 145.1011, outerZone: "tue_south" },
  { name: "attwood", lat: -37.67, lng: 144.877, outerZone: "wed_west" },
  { name: "avondale heights", lat: -37.761, lng: 144.862, outerZone: "mon_south_west" },
  { name: "bacchus marsh", lat: -37.676, lng: 144.439, outerZone: "wed_west" },
  { name: "balaclava", lat: -37.871, lng: 144.996, outerZone: "tue_south" },
  { name: "ballan", lat: -37.6, lng: 144.23, outerZone: "wed_west" },
  { name: "balwyn", lat: -37.811, lng: 145.082, outerZone: "sun_south_east" },
  { name: "balwyn north", lat: -37.794, lng: 145.086, outerZone: "sat_east" },
  { name: "bangholme", lat: -38.038, lng: 145.166, outerZone: "tue_south" },
  { name: "bayswater", lat: -37.848, lng: 145.267, outerZone: "sat_east" },
  { name: "bayswater north", lat: -37.832, lng: 145.285, outerZone: "sat_east" },
  { name: "beaumaris", lat: -37.986, lng: 145.035, outerZone: "tue_south" },
  { name: "belgrave", lat: -37.908, lng: 145.355, outerZone: "sat_east" },
  { name: "bentleigh", lat: -37.9178, lng: 145.0356, outerZone: "tue_south" },
  { name: "bentleigh east", lat: -37.9183, lng: 145.0583, outerZone: "tue_south" },
  { name: "bentleigh west", lat: -37.9178, lng: 145.0236, outerZone: "tue_south" },
  { name: "berwick", lat: -38.031, lng: 145.346, outerZone: "sun_south_east" },
  { name: "beveridge", lat: -37.476, lng: 144.992, outerZone: "thu_north" },
  { name: "black rock", lat: -37.969, lng: 145.016, outerZone: "tue_south" },
  { name: "blackburn", lat: -37.82, lng: 145.152, outerZone: "sat_east" },
  { name: "blackburn north", lat: -37.806, lng: 145.153, outerZone: "sat_east" },
  { name: "blackburn south", lat: -37.839, lng: 145.148, outerZone: "sun_south_east" },
  { name: "blairgowrie", lat: -38.361, lng: 144.777, outerZone: "mon_south_west" },
  { name: "bonbeach", lat: -38.0647, lng: 145.1189, outerZone: "tue_south" },
  { name: "bonnie brook", lat: -37.71, lng: 144.712, outerZone: "wed_west" },
  { name: "boronia", lat: -37.861, lng: 145.287, outerZone: "sat_east" },
  { name: "box hill", lat: -37.8194, lng: 145.1219, outerZone: "sat_east" },
  { name: "box hill north", lat: -37.806, lng: 145.131, outerZone: "sat_east" },
  { name: "box hill south", lat: -37.834, lng: 145.126, outerZone: "sun_south_east" },
  { name: "braeside", lat: -37.9981, lng: 145.1222, outerZone: "tue_south" },
  { name: "braybrook", lat: -37.788, lng: 144.861, outerZone: "mon_south_west" },
  { name: "briar hill", lat: -37.71, lng: 145.125, outerZone: "fri_north_east" },
  { name: "brighton", lat: -37.9061, lng: 144.9922, outerZone: "tue_south" },
  { name: "brighton east", lat: -37.91, lng: 145.016, outerZone: "tue_south" },
  { name: "broadmeadows", lat: -37.6803, lng: 144.9188, outerZone: "thu_north" },
  { name: "brookfield", lat: -37.698, lng: 144.548, outerZone: "wed_west" },
  { name: "brooklyn", lat: -37.818, lng: 144.845, outerZone: "mon_south_west" },
  { name: "brunswick", lat: -37.7667, lng: 144.9603, outerZone: "sun_south_east" },
  { name: "brunswick east", lat: -37.766, lng: 144.978, outerZone: "sun_south_east" },
  { name: "brunswick west", lat: -37.761, lng: 144.945, outerZone: "tue_south" },
  { name: "bulla", lat: -37.633, lng: 144.805, outerZone: "wed_west" },
  { name: "bulleen", lat: -37.774, lng: 145.094, outerZone: "sat_east" },
  { name: "bundoora", lat: -37.7003, lng: 145.0669, outerZone: "fri_north_east" },
  { name: "burnside", lat: -37.761, lng: 144.764, outerZone: "wed_west" },
  { name: "burnside heights", lat: -37.747, lng: 144.757, outerZone: "wed_west" },
  { name: "burwood", lat: -37.85, lng: 145.105, outerZone: "sun_south_east" },
  { name: "burwood east", lat: -37.852, lng: 145.147, outerZone: "sun_south_east" },
  { name: "cairnlea", lat: -37.767, lng: 144.809, outerZone: "mon_south_west" },
  { name: "camberwell", lat: -37.8261, lng: 145.0586, outerZone: "sun_south_east" },
  { name: "campbellfield", lat: -37.671, lng: 144.954, outerZone: "fri_north_east" },
  { name: "canterbury", lat: -37.824, lng: 145.081, outerZone: "sun_south_east" },
  { name: "cape schanck", lat: -38.487, lng: 144.887, outerZone: "tue_south" },
  { name: "carlton", lat: -37.8, lng: 144.967, outerZone: "tue_south" },
  { name: "carlton north", lat: -37.786, lng: 144.972, outerZone: "tue_south" },
  { name: "carnegie", lat: -37.8872, lng: 145.0578, outerZone: "sun_south_east" },
  { name: "caroline springs", lat: -37.734, lng: 144.741, outerZone: "wed_west" },
  { name: "carrum", lat: -38.077, lng: 145.127, outerZone: "tue_south" },
  { name: "caulfield", lat: -37.878, lng: 145.023, outerZone: "tue_south" },
  { name: "chadstone", lat: -37.8853, lng: 145.0858, outerZone: "sun_south_east" },
  { name: "chadstone east", lat: -37.8858, lng: 145.0983, outerZone: "sun_south_east" },
  { name: "chelsea", lat: -38.0514, lng: 145.1178, outerZone: "tue_south" },
  { name: "cheltenham", lat: -37.967, lng: 145.056, outerZone: "tue_south" },
  { name: "chirnside park", lat: -37.755, lng: 145.319, outerZone: "sat_east" },
  { name: "clarinda", lat: -37.9447, lng: 145.1061, outerZone: "tue_south" },
  { name: "clarkefield", lat: -37.495, lng: 144.747, outerZone: "wed_west" },
  { name: "clayton", lat: -37.925, lng: 145.121, outerZone: "sun_south_east" },
  { name: "clayton south", lat: -37.9458, lng: 145.1222, outerZone: "sun_south_east" },
  { name: "cobblebank", lat: -37.719, lng: 144.606, outerZone: "wed_west" },
  { name: "coburg", lat: -37.7439, lng: 144.9631, outerZone: "sun_south_east" },
  { name: "coburg north", lat: -37.727, lng: 144.966, outerZone: "sat_east" },
  { name: "coldstream", lat: -37.728, lng: 145.378, outerZone: "fri_north_east" },
  { name: "collingwood", lat: -37.803, lng: 144.988, outerZone: "sun_south_east" },
  { name: "coolaroo", lat: -37.6603, lng: 144.9236, outerZone: "thu_north" },
  { name: "craigieburn", lat: -37.6008, lng: 144.9403, outerZone: "thu_north" },
  { name: "craigieburn north", lat: -37.575, lng: 144.942, outerZone: "thu_north" },
  { name: "cranbourne", lat: -38.099, lng: 145.283, outerZone: "sun_south_east" },
  { name: "cremorne", lat: -37.83, lng: 144.995, outerZone: "tue_south" },
  { name: "croydon", lat: -37.794, lng: 145.281, outerZone: "sat_east" },
  { name: "croydon hills", lat: -37.778, lng: 145.268, outerZone: "sat_east" },
  { name: "croydon north", lat: -37.772, lng: 145.287, outerZone: "sat_east" },
  { name: "croydon south", lat: -37.811, lng: 145.283, outerZone: "sat_east" },
  { name: "dallas", lat: -37.676, lng: 144.931, outerZone: "fri_north_east" },
  { name: "dandenong", lat: -37.987, lng: 145.215, outerZone: "sun_south_east" },
  { name: "deanside", lat: -37.729, lng: 144.726, outerZone: "wed_west" },
  { name: "deer park", lat: -37.768, lng: 144.781, outerZone: "wed_west" },
  { name: "delahey", lat: -37.726, lng: 144.789, outerZone: "wed_west" },
  { name: "derrimut", lat: -37.798, lng: 144.786, outerZone: "mon_south_west" },
  { name: "diamond creek", lat: -37.674, lng: 145.157, outerZone: "fri_north_east" },
  { name: "diggers rest", lat: -37.628, lng: 144.721, outerZone: "wed_west" },
  { name: "dingley village", lat: -37.9808, lng: 145.1333, outerZone: "sun_south_east" },
  { name: "doncaster", lat: -37.7869, lng: 145.1247, outerZone: "sat_east" },
  { name: "doncaster east", lat: -37.783, lng: 145.153, outerZone: "sat_east" },
  { name: "donnybrook", lat: -37.534, lng: 144.975, outerZone: "thu_north" },
  { name: "donvale", lat: -37.782, lng: 145.184, outerZone: "sat_east" },
  { name: "doreen", lat: -37.593, lng: 145.132, outerZone: "fri_north_east" },
  { name: "dromana", lat: -38.337, lng: 144.965, outerZone: "tue_south" },
  { name: "eaglemont", lat: -37.761, lng: 145.062, outerZone: "sat_east" },
  { name: "edithvale", lat: -38.0439, lng: 145.1086, outerZone: "tue_south" },
  { name: "elsternwick", lat: -37.885, lng: 145.004, outerZone: "tue_south" },
  { name: "eltham", lat: -37.7139, lng: 145.1478, outerZone: "fri_north_east" },
  { name: "eltham north", lat: -37.695, lng: 145.152, outerZone: "fri_north_east" },
  { name: "elwood", lat: -37.882, lng: 144.987, outerZone: "tue_south" },
  { name: "emerald", lat: -37.933, lng: 145.441, outerZone: "sat_east" },
  { name: "epping", lat: -37.6497, lng: 145.0203, outerZone: "fri_north_east" },
  { name: "epping north", lat: -37.618, lng: 145.025, outerZone: "fri_north_east" },
  { name: "essendon", lat: -37.7529, lng: 144.9075, outerZone: "tue_south" },
  { name: "essendon fields", lat: -37.729, lng: 144.901, outerZone: "tue_south" },
  { name: "essendon north", lat: -37.74, lng: 144.907, outerZone: "tue_south" },
  { name: "essendon west", lat: -37.748, lng: 144.887, outerZone: "mon_south_west" },
  { name: "exford", lat: -37.742, lng: 144.558, outerZone: "wed_west" },
  { name: "eynesbury", lat: -37.792, lng: 144.564, outerZone: "wed_west" },
  { name: "fairfield", lat: -37.778, lng: 145.016, outerZone: "sun_south_east" },
  { name: "fawkner", lat: -37.707, lng: 144.962, outerZone: "sat_east" },
  { name: "ferntree gully", lat: -37.882, lng: 145.293, outerZone: "sat_east" },
  { name: "fitzroy", lat: -37.801, lng: 144.978, outerZone: "tue_south" },
  { name: "fitzroy north", lat: -37.783, lng: 144.982, outerZone: "sun_south_east" },
  { name: "flemington", lat: -37.788, lng: 144.928, outerZone: "tue_south" },
  { name: "footscray", lat: -37.8003, lng: 144.9003, outerZone: "tue_south" },
  { name: "forest hill", lat: -37.84, lng: 145.167, outerZone: "sat_east" },
  { name: "frankston", lat: -38.143, lng: 145.122, outerZone: "tue_south" },
  { name: "fraser rise", lat: -37.704, lng: 144.743, outerZone: "wed_west" },
  { name: "gardenvale", lat: -37.896, lng: 145.006, outerZone: "tue_south" },
  { name: "geelong", lat: -38.1499, lng: 144.3617, outerZone: "mon_south_west" },
  { name: "gisborne", lat: -37.489, lng: 144.593, outerZone: "wed_west" },
  { name: "gladstone park", lat: -37.6903, lng: 144.8886, outerZone: "wed_west" },
  { name: "glen iris", lat: -37.857, lng: 145.06, outerZone: "sun_south_east" },
  { name: "glen waverley", lat: -37.8783, lng: 145.1642, outerZone: "sun_south_east" },
  { name: "glenbervie", lat: -37.743, lng: 144.923, outerZone: "tue_south" },
  { name: "glenroy", lat: -37.7047, lng: 144.9186, outerZone: "sat_east" },
  { name: "gowanbrae", lat: -37.712, lng: 144.897, outerZone: "mon_south_west" },
  { name: "grangefields", lat: -37.725, lng: 144.695, outerZone: "wed_west" },
  { name: "greensborough", lat: -37.7042, lng: 145.1017, outerZone: "fri_north_east" },
  { name: "greenvale", lat: -37.643, lng: 144.881, outerZone: "thu_north" },
  { name: "hadfield", lat: -37.713, lng: 144.939, outerZone: "sat_east" },
  { name: "hampton", lat: -37.936, lng: 145.004, outerZone: "tue_south" },
  { name: "hampton east", lat: -37.9325, lng: 145.0222, outerZone: "tue_south" },
  { name: "harkness", lat: -37.667, lng: 144.561, outerZone: "wed_west" },
  { name: "hawthorn", lat: -37.8219, lng: 145.0347, outerZone: "sun_south_east" },
  { name: "hawthorn east", lat: -37.828, lng: 145.053, outerZone: "sun_south_east" },
  { name: "hawthorn south", lat: -37.8319, lng: 145.0347, outerZone: "sun_south_east" },
  { name: "healesville", lat: -37.656, lng: 145.514, outerZone: "fri_north_east" },
  { name: "heatherton", lat: -37.9442, lng: 145.0756, outerZone: "tue_south" },
  { name: "heathmont", lat: -37.832, lng: 145.244, outerZone: "sat_east" },
  { name: "heidelberg", lat: -37.755, lng: 145.061, outerZone: "sat_east" },
  { name: "heidelberg heights", lat: -37.747, lng: 145.051, outerZone: "sat_east" },
  { name: "heidelberg west", lat: -37.739, lng: 145.043, outerZone: "sat_east" },
  { name: "highett", lat: -37.9456, lng: 145.0411, outerZone: "tue_south" },
  { name: "hillside", lat: -37.702, lng: 144.762, outerZone: "wed_west" },
  { name: "hoppers crossing", lat: -37.884, lng: 144.7, outerZone: "mon_south_west" },
  { name: "hughesdale", lat: -37.8953, lng: 145.0836, outerZone: "tue_south" },
  { name: "huntingdale", lat: -37.9114, lng: 145.1036, outerZone: "tue_south" },
  { name: "indented head", lat: -38.146, lng: 144.71, outerZone: "mon_south_west" },
  { name: "ivanhoe", lat: -37.77, lng: 145.042, outerZone: "sat_east" },
  { name: "ivanhoe east", lat: -37.773, lng: 145.06, outerZone: "sat_east" },
  { name: "jacana", lat: -37.692, lng: 144.919, outerZone: "fri_north_east" },
  { name: "kalkallo", lat: -37.525, lng: 144.948, outerZone: "thu_north" },
  { name: "kealba", lat: -37.737, lng: 144.825, outerZone: "wed_west" },
  { name: "keilor", lat: -37.7186, lng: 144.8339, outerZone: "wed_west" },
  { name: "keilor downs", lat: -37.73, lng: 144.808, outerZone: "wed_west" },
  { name: "keilor east", lat: -37.736, lng: 144.862, outerZone: "mon_south_west" },
  { name: "keilor lodge", lat: -37.718, lng: 144.808, outerZone: "wed_west" },
  { name: "keilor park", lat: -37.714, lng: 144.858, outerZone: "wed_west" },
  { name: "kensington", lat: -37.794, lng: 144.929, outerZone: "tue_south" },
  { name: "kew", lat: -37.806, lng: 145.032, outerZone: "sun_south_east" },
  { name: "kew east", lat: -37.799, lng: 145.052, outerZone: "sun_south_east" },
  { name: "keysborough", lat: -37.999, lng: 145.163, outerZone: "sun_south_east" },
  { name: "kilmore", lat: -37.294, lng: 144.952, outerZone: "thu_north" },
  { name: "kilsyth", lat: -37.808, lng: 145.319, outerZone: "sat_east" },
  { name: "kilsyth south", lat: -37.827, lng: 145.318, outerZone: "sat_east" },
  { name: "kinglake", lat: -37.521, lng: 145.356, outerZone: "fri_north_east" },
  { name: "kinglake west", lat: -37.498, lng: 145.296, outerZone: "fri_north_east" },
  { name: "kings park", lat: -37.749, lng: 144.776, outerZone: "wed_west" },
  { name: "kingsbury", lat: -37.717, lng: 145.045, outerZone: "sat_east" },
  { name: "kingsville", lat: -37.812, lng: 144.881, outerZone: "mon_south_west" },
  { name: "knoxfield", lat: -37.892, lng: 145.25, outerZone: "sun_south_east" },
  { name: "kurunjang", lat: -37.663, lng: 144.589, outerZone: "wed_west" },
  { name: "lalor", lat: -37.666, lng: 145.018, outerZone: "fri_north_east" },
  { name: "lancefield", lat: -37.28, lng: 144.73, outerZone: "thu_north" },
  { name: "lara", lat: -38.019, lng: 144.409, outerZone: "wed_west" },
  { name: "laverton", lat: -37.862, lng: 144.772, outerZone: "mon_south_west" },
  { name: "laverton north", lat: -37.834, lng: 144.796, outerZone: "mon_south_west" },
  { name: "leopold", lat: -38.188, lng: 144.463, outerZone: "mon_south_west" },
  { name: "lilydale", lat: -37.7561, lng: 145.3492, outerZone: "sat_east" },
  { name: "little river", lat: -37.969, lng: 144.498, outerZone: "wed_west" },
  { name: "lower plenty", lat: -37.739, lng: 145.128, outerZone: "sat_east" },
  { name: "macedon", lat: -37.42, lng: 144.563, outerZone: "wed_west" },
  { name: "macleod", lat: -37.728, lng: 145.068, outerZone: "sat_east" },
  { name: "maidstone", lat: -37.781, lng: 144.876, outerZone: "mon_south_west" },
  { name: "malvern", lat: -37.8617, lng: 145.0283, outerZone: "tue_south" },
  { name: "malvern east", lat: -37.8706, lng: 145.0506, outerZone: "sun_south_east" },
  { name: "manor lakes", lat: -37.906, lng: 144.595, outerZone: "wed_west" },
  { name: "maribyrnong", lat: -37.777, lng: 144.892, outerZone: "tue_south" },
  { name: "mckinnon", lat: -37.9083, lng: 145.0392, outerZone: "tue_south" },
  { name: "meadow heights", lat: -37.647, lng: 144.916, outerZone: "thu_north" },
  { name: "melbourne", lat: -37.8136, lng: 144.9631, outerZone: "tue_south" },
  { name: "melbourne airport", lat: -37.669, lng: 144.841, outerZone: "wed_west" },
  { name: "melbourne cbd", lat: -37.8136, lng: 144.9631, outerZone: "tue_south" },
  { name: "melton", lat: -37.6839, lng: 144.5861, outerZone: "wed_west" },
  { name: "melton south", lat: -37.708, lng: 144.579, outerZone: "wed_west" },
  { name: "melton west", lat: -37.686, lng: 144.558, outerZone: "wed_west" },
  { name: "mentone", lat: -37.983, lng: 145.067, outerZone: "tue_south" },
  { name: "mernda", lat: -37.604, lng: 145.103, outerZone: "fri_north_east" },
  { name: "mickleham", lat: -37.535, lng: 144.912, outerZone: "thu_north" },
  { name: "middle park", lat: -37.85, lng: 144.961, outerZone: "tue_south" },
  { name: "mill park", lat: -37.667, lng: 145.068, outerZone: "fri_north_east" },
  { name: "mitcham", lat: -37.817, lng: 145.195, outerZone: "sat_east" },
  { name: "monbulk", lat: -37.878, lng: 145.419, outerZone: "sat_east" },
  { name: "monegeetta", lat: -37.417, lng: 144.75, outerZone: "wed_west" },
  { name: "montmorency", lat: -37.719, lng: 145.127, outerZone: "sat_east" },
  { name: "montrose", lat: -37.807, lng: 145.347, outerZone: "sat_east" },
  { name: "moonee ponds", lat: -37.7647, lng: 144.9203, outerZone: "tue_south" },
  { name: "moorabbin", lat: -37.934, lng: 145.051, outerZone: "tue_south" },
  { name: "mooroolbark", lat: -37.785, lng: 145.312, outerZone: "sat_east" },
  { name: "mordialloc", lat: -37.999, lng: 145.086, outerZone: "tue_south" },
  { name: "mornington", lat: -38.221, lng: 145.039, outerZone: "tue_south" },
  { name: "mount cottrell", lat: -37.801, lng: 144.618, outerZone: "wed_west" },
  { name: "mount eliza", lat: -38.188, lng: 145.093, outerZone: "tue_south" },
  { name: "mount evelyn", lat: -37.783, lng: 145.385, outerZone: "sat_east" },
  { name: "mount waverley", lat: -37.874, lng: 145.13, outerZone: "sun_south_east" },
  { name: "mulgrave", lat: -37.925, lng: 145.174, outerZone: "sun_south_east" },
  { name: "murrumbeena", lat: -37.8886, lng: 145.0717, outerZone: "sun_south_east" },
  { name: "narre warren", lat: -38.016, lng: 145.304, outerZone: "sun_south_east" },
  { name: "narre warren south", lat: -38.056, lng: 145.297, outerZone: "sun_south_east" },
  { name: "newport", lat: -37.844, lng: 144.883, outerZone: "mon_south_west" },
  { name: "niddrie", lat: -37.7353, lng: 144.8944, outerZone: "mon_south_west" },
  { name: "noble park", lat: -37.966, lng: 145.18, outerZone: "sun_south_east" },
  { name: "north melbourne", lat: -37.798, lng: 144.945, outerZone: "tue_south" },
  { name: "northcote", lat: -37.771, lng: 144.998, outerZone: "sun_south_east" },
  { name: "notting hill", lat: -37.9078, lng: 145.1264, outerZone: "sun_south_east" },
  { name: "nunawading", lat: -37.819, lng: 145.176, outerZone: "sat_east" },
  { name: "oak park", lat: -37.718, lng: 144.922, outerZone: "sun_south_east" },
  { name: "oaklands junction", lat: -37.607, lng: 144.862, outerZone: "thu_north" },
  { name: "oakleigh", lat: -37.8997, lng: 145.0886, outerZone: "tue_south" },
  { name: "oakleigh east", lat: -37.8928, lng: 145.1081, outerZone: "tue_south" },
  { name: "oakleigh south", lat: -37.9247, lng: 145.0797, outerZone: "tue_south" },
  { name: "ocean grove", lat: -38.267, lng: 144.52, outerZone: "mon_south_west" },
  { name: "officer", lat: -38.062, lng: 145.417, outerZone: "sun_south_east" },
  { name: "ormond", lat: -37.9033, lng: 145.0397, outerZone: "tue_south" },
  { name: "pakenham", lat: -38.071, lng: 145.488, outerZone: "sun_south_east" },
  { name: "panton hill", lat: -37.643, lng: 145.238, outerZone: "fri_north_east" },
  { name: "parkdale", lat: -37.9908, lng: 145.0789, outerZone: "tue_south" },
  { name: "parkville", lat: -37.786, lng: 144.951, outerZone: "tue_south" },
  { name: "parwan", lat: -37.706, lng: 144.471, outerZone: "wed_west" },
  { name: "pascoe vale", lat: -37.7268, lng: 144.9384, outerZone: "sun_south_east" },
  { name: "pascoe vale south", lat: -37.742, lng: 144.939, outerZone: "sun_south_east" },
  { name: "patterson lakes", lat: -38.0697, lng: 145.1372, outerZone: "tue_south" },
  { name: "plumpton", lat: -37.713, lng: 144.726, outerZone: "wed_west" },
  { name: "point cook", lat: -37.9142, lng: 144.7514, outerZone: "mon_south_west" },
  { name: "port melbourne", lat: -37.838, lng: 144.933, outerZone: "tue_south" },
  { name: "portsea", lat: -38.319, lng: 144.714, outerZone: "mon_south_west" },
  { name: "prahran", lat: -37.8514, lng: 144.9922, outerZone: "tue_south" },
  { name: "preston", lat: -37.7411, lng: 144.9992, outerZone: "sat_east" },
  { name: "queenscliff", lat: -38.268, lng: 144.659, outerZone: "mon_south_west" },
  { name: "ravenhall", lat: -37.771, lng: 144.758, outerZone: "wed_west" },
  { name: "reservoir", lat: -37.7169, lng: 145.0064, outerZone: "sat_east" },
  { name: "richmond", lat: -37.8233, lng: 144.9981, outerZone: "tue_south" },
  { name: "riddells creek", lat: -37.465, lng: 144.68, outerZone: "wed_west" },
  { name: "ringwood", lat: -37.8147, lng: 145.2294, outerZone: "sat_east" },
  { name: "ringwood east", lat: -37.814, lng: 145.257, outerZone: "sat_east" },
  { name: "ringwood north", lat: -37.797, lng: 145.236, outerZone: "sat_east" },
  { name: "ringwood south", lat: -37.828, lng: 145.231, outerZone: "sat_east" },
  { name: "ripponlea", lat: -37.877, lng: 144.997, outerZone: "tue_south" },
  { name: "rockbank", lat: -37.73, lng: 144.654, outerZone: "wed_west" },
  { name: "romsey", lat: -37.35, lng: 144.743, outerZone: "thu_north" },
  { name: "rosanna", lat: -37.742, lng: 145.069, outerZone: "sat_east" },
  { name: "rosebud", lat: -38.358, lng: 144.908, outerZone: "tue_south" },
  { name: "rowville", lat: -37.924, lng: 145.244, outerZone: "sun_south_east" },
  { name: "roxburgh park", lat: -37.6389, lng: 144.9236, outerZone: "thu_north" },
  { name: "rye", lat: -38.371, lng: 144.821, outerZone: "mon_south_west" },
  { name: "sandringham", lat: -37.951, lng: 145.007, outerZone: "tue_south" },
  { name: "scoresby", lat: -37.904, lng: 145.234, outerZone: "sun_south_east" },
  { name: "seabrook", lat: -37.886, lng: 144.757, outerZone: "mon_south_west" },
  { name: "seaford", lat: -38.103, lng: 145.132, outerZone: "tue_south" },
  { name: "seaholme", lat: -37.8653, lng: 144.8464, outerZone: "mon_south_west" },
  { name: "seddon", lat: -37.807, lng: 144.893, outerZone: "tue_south" },
  { name: "somerton", lat: -37.64, lng: 144.95, outerZone: "thu_north" },
  { name: "sorrento", lat: -38.339, lng: 144.743, outerZone: "mon_south_west" },
  { name: "south kingsville", lat: -37.8231, lng: 144.8711, outerZone: "mon_south_west" },
  { name: "south melbourne", lat: -37.833, lng: 144.957, outerZone: "tue_south" },
  { name: "south morang", lat: -37.644, lng: 145.074, outerZone: "fri_north_east" },
  { name: "south yarra", lat: -37.839, lng: 144.99, outerZone: "tue_south" },
  { name: "southbank", lat: -37.826, lng: 144.964, outerZone: "tue_south" },
  { name: "spotswood", lat: -37.8294, lng: 144.8872, outerZone: "tue_south" },
  { name: "springvale", lat: -37.951, lng: 145.152, outerZone: "sun_south_east" },
  { name: "st albans", lat: -37.7447, lng: 144.8028, outerZone: "wed_west" },
  { name: "st albans north", lat: -37.735, lng: 144.795, outerZone: "wed_west" },
  { name: "st andrews", lat: -37.601, lng: 145.271, outerZone: "fri_north_east" },
  { name: "st kilda", lat: -37.8678, lng: 144.9808, outerZone: "tue_south" },
  { name: "st kilda east", lat: -37.867, lng: 145.003, outerZone: "tue_south" },
  { name: "st leonards", lat: -38.172, lng: 144.717, outerZone: "mon_south_west" },
  { name: "strathmore", lat: -37.7392, lng: 144.9203, outerZone: "tue_south" },
  { name: "strathmore heights", lat: -37.716, lng: 144.889, outerZone: "mon_south_west" },
  { name: "strathtulloh", lat: -37.728, lng: 144.602, outerZone: "wed_west" },
  { name: "sunbury", lat: -37.5811, lng: 144.7278, outerZone: "wed_west" },
  { name: "sunshine", lat: -37.7883, lng: 144.8331, outerZone: "mon_south_west" },
  { name: "sunshine east", lat: -37.7861, lng: 144.8508, outerZone: "mon_south_west" },
  { name: "sunshine north", lat: -37.77, lng: 144.837, outerZone: "mon_south_west" },
  { name: "sunshine west", lat: -37.802, lng: 144.821, outerZone: "mon_south_west" },
  { name: "surrey hills", lat: -37.825, lng: 145.101, outerZone: "sun_south_east" },
  { name: "tarneit", lat: -37.833, lng: 144.66, outerZone: "wed_west" },
  { name: "taylors hill", lat: -37.713, lng: 144.777, outerZone: "wed_west" },
  { name: "taylors lakes", lat: -37.702, lng: 144.789, outerZone: "wed_west" },
  { name: "templestowe", lat: -37.753, lng: 145.131, outerZone: "sat_east" },
  { name: "templestowe lower", lat: -37.766, lng: 145.124, outerZone: "sat_east" },
  { name: "the basin", lat: -37.855, lng: 145.32, outerZone: "sat_east" },
  { name: "thomastown", lat: -37.683, lng: 145.016, outerZone: "fri_north_east" },
  { name: "thornbury", lat: -37.756, lng: 144.998, outerZone: "sun_south_east" },
  { name: "thornhill park", lat: -37.719, lng: 144.636, outerZone: "wed_west" },
  { name: "toolern vale", lat: -37.613, lng: 144.571, outerZone: "wed_west" },
  { name: "toorak", lat: -37.842, lng: 145.016, outerZone: "tue_south" },
  { name: "tottenham", lat: -37.804, lng: 144.856, outerZone: "mon_south_west" },
  { name: "travancore", lat: -37.781, lng: 144.936, outerZone: "tue_south" },
  { name: "truganina", lat: -37.838, lng: 144.721, outerZone: "mon_south_west" },
  // Kept in sync with the BASE (HQ) constant above — "Tullamarine" is the
  // stand-in name used throughout dispatch/travel code for our base.
  { name: "tullamarine", lat: -37.6988298, lng: 144.9004405, outerZone: "thu_north" },
  { name: "upper ferntree gully", lat: -37.895, lng: 145.321, outerZone: "sat_east" },
  { name: "vermont", lat: -37.836, lng: 145.195, outerZone: "sat_east" },
  { name: "vermont south", lat: -37.854, lng: 145.191, outerZone: "sat_east" },
  { name: "viewbank", lat: -37.741, lng: 145.093, outerZone: "sat_east" },
  { name: "wallan", lat: -37.4167, lng: 144.9833, outerZone: "thu_north" },
  { name: "wantirna", lat: -37.852, lng: 145.228, outerZone: "sat_east" },
  { name: "wantirna south", lat: -37.873, lng: 145.229, outerZone: "sat_east" },
  { name: "warrandyte", lat: -37.74, lng: 145.22, outerZone: "sat_east" },
  { name: "watsonia", lat: -37.712, lng: 145.083, outerZone: "sat_east" },
  { name: "watsonia north", lat: -37.697, lng: 145.085, outerZone: "fri_north_east" },
  { name: "weir views", lat: -37.712, lng: 144.569, outerZone: "wed_west" },
  { name: "werribee", lat: -37.9006, lng: 144.6614, outerZone: "mon_south_west" },
  { name: "werribee south", lat: -37.969, lng: 144.693, outerZone: "mon_south_west" },
  { name: "west footscray", lat: -37.805, lng: 144.879, outerZone: "mon_south_west" },
  { name: "west melbourne", lat: -37.808, lng: 144.942, outerZone: "tue_south" },
  { name: "westmeadows", lat: -37.674, lng: 144.886, outerZone: "wed_west" },
  { name: "wheelers hill", lat: -37.901, lng: 145.189, outerZone: "sun_south_east" },
  { name: "whittlesea", lat: -37.514, lng: 145.115, outerZone: "thu_north" },
  { name: "wildwood", lat: -37.567, lng: 144.792, outerZone: "wed_west" },
  { name: "williamstown", lat: -37.8656, lng: 144.8969, outerZone: "tue_south" },
  { name: "windsor", lat: -37.8556, lng: 144.9906, outerZone: "tue_south" },
  { name: "wollert", lat: -37.598, lng: 145.034, outerZone: "fri_north_east" },
  { name: "wyndham", lat: -37.9006, lng: 144.6614, outerZone: "mon_south_west" },
  { name: "wyndham vale", lat: -37.889, lng: 144.62, outerZone: "wed_west" },
  { name: "yallambie", lat: -37.726, lng: 145.105, outerZone: "sat_east" },
  { name: "yarra glen", lat: -37.653, lng: 145.373, outerZone: "fri_north_east" },
  { name: "yarraville", lat: -37.816, lng: 144.891, outerZone: "tue_south" },
  { name: "yuroke", lat: -37.599, lng: 144.896, outerZone: "thu_north" },
];

/** suburb name → its day-wise outer zone, from the catalogue above. */
const SUBURB_ZONE = new Map<string, OuterZone>(SUBURBS.map((s) => [s.name, s.outerZone]));

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Suburbs inside the 0 – 15 km daily-flex circle. Derived from the catalogue
 * rather than hand-maintained, so moving DAILY_FLEX_RADIUS_KM can never leave a
 * stale list behind.
 */
export const INNER_RADIUS_SUBURBS = new Set(
  SUBURBS.filter((s) => distanceKm(BASE_LOCATION, s) <= DAILY_FLEX_RADIUS_KM).map((s) => s.name)
);

/** Is this a coastal / ocean suburb the routing plan tells us to skip? */
export function isCoastalExcluded(suburb: string | null | undefined): boolean {
  return !!suburb && COASTAL_EXCLUDED.has(suburb);
}

function coastalArea(suburb: string, dist: number | null): AreaInfo {
  return {
    suburb,
    zone: "coastal",
    distanceKm: dist,
    inner: false,
    serviced: false,
    label: ZONE_LABEL.coastal,
  };
}

/** Build the AreaInfo for a point we know the distance of, applying every plan rule in order. */
function classify(suburb: string, point: { lat: number; lng: number }, dist: number): AreaInfo {
  // 1. Coastal / Southern Ocean areas are skipped regardless of distance.
  if (isCoastalExcluded(suburb)) return coastalArea(suburb, dist);

  // 2. Beyond the 50 km service area → not bookable online.
  if (dist > MAX_INSPECTION_RADIUS_KM) {
    return {
      suburb,
      zone: "outside",
      distanceKm: dist,
      inner: false,
      serviced: false,
      label: `Outside 50 km Service Area (~${Math.round(dist)} km from base)`,
    };
  }

  // 3. Inner 0 – 15 km daily-flex circle → bookable on any open day.
  if (dist <= DAILY_FLEX_RADIUS_KM) {
    return { suburb, zone: "inner", distanceKm: dist, inner: true, serviced: true, label: ZONE_LABEL.inner };
  }

  // 4. Outer 15 – 50 km → the one weekday its zone is serviced on. The suburb
  // table wins (it carries the plan's hand-checked exceptions); the raw compass
  // sector is the fallback for a point with no catalogued suburb.
  const zone = SUBURB_ZONE.get(suburb) ?? sectorZone(point);
  return { suburb, zone, distanceKm: dist, inner: false, serviced: true, label: ZONE_LABEL[zone] };
}

/** Match a lead's address/suburb text to our catalogue and classify it. */
export function resolveArea(addressText: string | undefined | null): AreaInfo {
  const text = (addressText || "").toLowerCase().trim();
  if (!text) {
    return { suburb: null, zone: "outside", distanceKm: null, inner: false, serviced: false, label: "Please enter your address" };
  }

  // Find longest matching suburb name to avoid substring collisions
  let match: (typeof SUBURBS)[number] | null = null;
  for (const s of SUBURBS) {
    if (text.includes(s.name)) {
      if (!match || s.name.length > match.name.length) match = s;
    }
  }

  if (!match) {
    // Unlisted / non-Melbourne address -> outside the 50 km inspection boundary
    return { suburb: null, zone: "outside", distanceKm: null, inner: false, serviced: false, label: "Outside 50 km Service Area" };
  }

  return classify(match.name, match, distanceKm(BASE_LOCATION, match));
}

/**
 * Resolve a customer's area from precise GPS coordinates (e.g. captured via the
 * browser "use my location" button on the booking page). This is the most
 * accurate classifier: both the 15 km daily-flex circle and the outer sector are
 * measured from the real point rather than a suburb centroid. The nearest
 * catalogued suburb is still used for naming and for the coastal skip list.
 */
export function resolveAreaByCoords(lat: number, lng: number): AreaInfo {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { suburb: null, zone: "outside", distanceKm: null, inner: false, serviced: false, label: "Outside 50 km Service Area" };
  }
  const pt = { lat, lng };

  // Nearest catalogued suburb — names the area and drives the coastal skip check.
  let nearest = SUBURBS[0];
  let best = Infinity;
  for (const s of SUBURBS) {
    const d = distanceKm(pt, s);
    if (d < best) {
      best = d;
      nearest = s;
    }
  }

  return classify(nearest.name, pt, distanceKm(BASE_LOCATION, pt));
}

function isServiceable(area: AreaInfo): boolean {
  if (!area.serviced) return false;
  if (area.zone === "outside" || area.zone === "coastal") return false;
  return !(area.distanceKm != null && area.distanceKm > MAX_INSPECTION_RADIUS_KM);
}

/** Is `zone` an outer 15 – 50 km day-wise zone (as opposed to inner / flexible)? */
export function isOuterZone(zone: Zone): zone is OuterZone {
  return zone in ZONE_WEEKDAY;
}

/**
 * Day-wise zoning gate: may this area be visited on this weekday?
 *
 * Inner (0 – 15 km) and unclassified "flexible" areas are bookable on any open
 * day. Outer areas are bookable ONLY on their zone's weekday, which is what keeps
 * the inspector from driving to opposite sides of Melbourne on the same day
 * (Key Rule 9: "Do not mix opposite zones on the same day").
 */
export function isZoneDay(zone: Zone, weekday: number): boolean {
  if (!isOuterZone(zone)) return true;
  return ZONE_WEEKDAY[zone] === weekday;
}

/** Same check against a YYYY-MM-DD calendar date. */
export function isZoneDate(zone: Zone, date: string): boolean {
  return isZoneDay(zone, weekdayOf(date));
}

/** "Mondays" / "Saturdays" — the day an outer zone is serviced on, else null. */
export function zoneDayName(zone: Zone): string | null {
  return isOuterZone(zone) ? `${WEEKDAY_NAMES[ZONE_WEEKDAY[zone]]}s` : null;
}

/** Human-friendly inspection availability text for customer emails and SMS. */
export function getAvailableDaysSummary(area: AreaInfo, rules: BookingRules = DEFAULT_BOOKING_RULES): string {
  if (area.zone === "coastal") {
    return "Coastal / ocean area — not covered by our inspection routes";
  }
  if (!isServiceable(area)) {
    return "Outside 50 km Service Area (Free inspection timing not available online)";
  }
  const day = zoneDayName(area.zone);
  if (day) {
    // Outer area: only its own zone day, and only when that weekday is open.
    return `Inspections in ${ZONE_SHORT[area.zone]} run on ${day}`;
  }
  return `Inspections available ${inspectionDaysText(rules)}`;
}

/**
 * Open-days wording for the current booking window: the days in force on the
 * earliest bookable date, plus a note when a changeover lands inside the horizon
 * (e.g. "Saturday & Sunday, and every day from 7 Oct").
 */
export function inspectionDaysText(rules: BookingRules = DEFAULT_BOOKING_RULES): string {
  const today = melbourneYmd();
  const earliest = addDaysYmd(today, Math.max(rules.minNoticeDays, 0));
  const from = rules.minDate && rules.minDate > earliest ? rules.minDate : earliest;
  const now = openDaysSummary(rules, "inspection", from);
  const next = nextChangeover(rules, "inspection", from);
  if (!next || next.from > addDaysYmd(today, rules.horizonDays)) return now;
  const then = openDaysSummary({ ...rules, inspection: { ...rules.inspection, days: next.days } }, "inspection");
  if (then === now) return now;
  const label = formatApptDate(`${next.from}T00:00`, { day: "numeric", month: "short" });
  return `${now}, and ${then} from ${label}`;
}

/** Shift a YYYY-MM-DD calendar date by whole days, timezone-independently. */
export function addDaysYmd(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12) + days * 86400000).toISOString().slice(0, 10);
}

export interface TimeSlot {
  time: string; // "HH:mm"
  booked: boolean; // already locked by another customer
}

export interface DayOption {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Monday, 08 Sep"
  weekday: string;
  times: string[]; // free start times (kept for email/SMS summaries)
  slots: TimeSlot[]; // every offered slot with its booked status (for the UI)
  recommended: boolean; // route-grouping nudge
}

/**
 * Build the list of bookable days/times for an area.
 * @param bookedByDate  date(YYYY-MM-DD) → set of already-locked times
 * @param sameZoneDates dates that already have a job in this area (route nudge)
 * @param type          which rule set to apply ("inspection" or "job")
 * @param rules         manager-configured booking rules (load via getBookingRules())
 */
export function computeAvailability(
  area: AreaInfo,
  bookedByDate: Map<string, Set<string>>,
  sameZoneDates: Set<string>,
  type: BookingType = "inspection",
  rules: BookingRules = DEFAULT_BOOKING_RULES
): DayOption[] {
  // Do NOT show inspection timing outside the 50 km radius, or for coastal areas.
  if (!isServiceable(area)) return [];

  const out: DayOption[] = [];

  // Anchor every offered day to the MELBOURNE calendar date, so the stored
  // `date` value and the customer-facing `label` can never disagree. Previously
  // `date` was built from the server's local timezone (UTC on Vercel) while the
  // label used Australia/Sydney — on a UTC server that pushed the label to the
  // next day, so picking "Wed 30 Sept" actually booked (and locked) 29 Sept.
  // We build each day from a UTC-noon anchor representing the Melbourne date and
  // read date/weekday/label all back in UTC so they always match.
  const melToday = melbourneYmd(new Date());
  const [by, bm, bd] = melToday.split("-").map(Number);
  const baseNoonUtc = Date.UTC(by, bm - 1, bd, 12, 0, 0);

  for (let i = Math.max(rules.minNoticeDays, 0); i <= rules.horizonDays; i++) {
    const d = new Date(baseNoonUtc + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);

    // Day-wise zoning: an outer 15 – 50 km area is only offered on its own day,
    // so one day's route never spans opposite sides of Melbourne. Inner (daily
    // flex) and flexible areas pass straight through.
    if (!isZoneDate(area.zone, dateStr)) continue;

    // Honours open weekdays, daily hours, closed dates and the earliest date.
    const daySlots = slotsForDate(rules, type, dateStr);
    if (!daySlots.length) continue;

    const locked = bookedByDate.get(dateStr) || new Set<string>();
    // Keep every slot, flagging the ones already taken so the customer can see
    // them as "Booked" rather than them silently disappearing.
    const slots: TimeSlot[] = daySlots.map((t) => ({ time: t, booked: locked.has(t) }));
    // Same-day bookings (minNoticeDays = 0): hide slots that have already started.
    if (i === 0) {
      const nowHHmm = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Australia/Melbourne",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      for (const s of slots) if (s.time <= nowHHmm) s.booked = true;
    }
    const times = slots.filter((s) => !s.booked).map((s) => s.time);

    out.push({
      date: dateStr,
      label: d.toLocaleDateString("en-AU", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "short" }),
      weekday: d.toLocaleDateString("en-AU", { timeZone: "UTC", weekday: "long" }),
      times,
      slots,
      recommended: sameZoneDates.has(dateStr),
    });
  }

  // Always sort in ascending chronological order by date.
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

/** Current calendar date (YYYY-MM-DD) in Melbourne, regardless of server timezone. */
export function melbourneYmd(at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Is a chosen date/time actually offered for this area (defensive server check)? */
export function isSlotOffered(
  area: AreaInfo,
  date: string,
  time: string,
  type: BookingType = "inspection",
  rules: BookingRules = DEFAULT_BOOKING_RULES
): boolean {
  if (!isServiceable(area)) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12, 0, 0));
  if (Number.isNaN(d.getTime())) return false;

  // Outer areas are only serviced on their own zone day (see isZoneDay).
  if (!isZoneDate(area.zone, date)) return false;

  // Weekday open, within hours, not a closed date, not before the earliest date.
  if (!slotsForDate(rules, type, date).includes(time)) return false;

  // Must be within the booking window, compared against the Melbourne calendar
  // date (not the server's local date) so the boundary is correct everywhere.
  const melToday = melbourneYmd();
  const [ty, tm, td] = melToday.split("-").map(Number);
  const todayNoon = Date.UTC(ty, tm - 1, td, 12, 0, 0);
  const diffDays = Math.round((d.getTime() - todayNoon) / 86400000);
  if (diffDays < rules.minNoticeDays || diffDays > rules.horizonDays) return false;
  if (diffDays === 0) {
    const nowHHmm = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Australia/Melbourne",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    if (time <= nowHHmm) return false;
  }
  return true;
}
