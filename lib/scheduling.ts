// Melbourne smart-route scheduling.
//
// Operational Rules:
//   • Within 15 km of Tullamarine  → Available EVERY DAY (Monday to Sunday).
//     Inner leads are nudged toward days that already have bookings in that
//     direction to cluster technician travel.
//   • Outside 15 km (approx. 35–40 km boundary) → Divided into 7 weekday corridors:
//       - Monday:    Lower Area 1 (Brunswick → Melbourne → St Kilda → Brighton)
//       - Tuesday:   Lower Area 2 (Melbourne → Inner East → Eastern Suburbs)
//       - Wednesday: Lower Area 3 (Eastern Suburbs → Ringwood → Croydon → Lilydale → Mt Evelyn)
//       - Thursday:  Bundoora / North-East Corridor
//       - Friday:    Upper North (Craigieburn / Mickleham / Epping Corridor)
//       - Saturday:  Melton / West Corridor
//       - Sunday:    St Albans / West-Central Corridor
//   • Unknown/unlisted suburbs fall back to "flexible" (all 7 days offered).

export const TULLAMARINE = { lat: -37.7008, lng: 144.8869 };
export const RADIUS_KM = 15;
export const MAX_INSPECTION_RADIUS_KM = 50;

// Standard appointment start times (Mon–Thu & Sat: 9:00 AM – 5:00 PM)
export const STANDARD_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// Friday-specific start times (strictly 10:00 AM – 3:00 PM: 10:00, 11:00, 12:00, 13:00, 14:00)
export const FRIDAY_TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00"];

// All available appointment start times offered across any open business day
export const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

/** Friendly 1-hour window label: "09:00" → "9:00 AM – 10:00 AM" */
export function formatSlotRange(t: string): string {
  const [h, m = 0] = t.split(":").map(Number);
  const endH = h + 1;
  const startAmpm = h >= 12 ? "PM" : "AM";
  const endAmpm = endH >= 12 ? "PM" : "AM";
  const startHr = h % 12 === 0 ? 12 : h % 12;
  const endHr = endH % 12 === 0 ? 12 : endH % 12;
  const minStr = m !== 0 ? `:${String(m).padStart(2, "0")}` : ":00";
  return `${startHr}${minStr} ${startAmpm} – ${endHr}:00 ${endAmpm}`;
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

// Earliest date (YYYY-MM-DD) from which inspection and job bookings can be scheduled.
// Any timings before this date are not offered.
export const MIN_BOOKING_DATE = "2026-09-28";

// How far ahead we let a customer book (days from today).
export const BOOKING_HORIZON_DAYS = 35;

export type OuterZone =
  | "mon_lower1"
  | "tue_lower2"
  | "wed_lower3"
  | "thu_bundoora"
  | "fri_north"
  | "sat_melton"
  | "sun_stalbans";

export type Zone = OuterZone | "inner" | "flexible" | "outside";

export interface AreaInfo {
  suburb: string | null;
  zone: Zone;
  distanceKm: number | null;
  inner: boolean;
  serviced: boolean; // true if within 50 km straight-line radius of Tullamarine HQ
  label: string;
}

export const ZONE_LABEL: Record<Zone, string> = {
  inner: "Inner Melbourne (Within 15 km — Saturday & Sunday)",
  mon_lower1: "Lower Area 1 — Brunswick, CBD, St Kilda, Brighton (Mondays)",
  tue_lower2: "Lower Area 2 — Inner East, Hawthorn, Kew, Doncaster (Tuesdays)",
  wed_lower3: "Lower Area 3 — Ringwood, Croydon, Lilydale, Mt Evelyn (Wednesdays)",
  thu_bundoora: "Bundoora & North-East Corridor (Thursdays)",
  fri_north: "Upper North & Craigieburn Corridor (Fridays)",
  sat_melton: "Melton & West Corridor (Saturdays)",
  sun_stalbans: "St Albans & West-Central Corridor (Saturdays)",
  flexible: "Greater Melbourne (Monday to Saturday Available)",
  outside: "Outside 50 km Service Area (From Tullamarine HQ)",
};

const ZONE_WEEKDAY: Record<OuterZone, number> = {
  mon_lower1: 1, // Mon
  tue_lower2: 2, // Tue
  wed_lower3: 3, // Wed
  thu_bundoora: 4, // Thu
  fri_north: 5, // Fri
  sat_melton: 6, // Sat
  sun_stalbans: 6, // Sat (Sunday bookings closed)
};

// Melbourne suburbs mapped to their centroid coordinates and assigned outer zone.
export const SUBURBS: { name: string; lat: number; lng: number; outerZone: OuterZone }[] = [
  { name: "abbotsford", lat: -37.808, lng: 144.999, outerZone: "tue_lower2" },
  { name: "aberfeldie", lat: -37.76, lng: 144.896, outerZone: "mon_lower1" },
  { name: "aintree", lat: -37.721, lng: 144.686, outerZone: "sat_melton" },
  { name: "airport west", lat: -37.7211, lng: 144.8836, outerZone: "mon_lower1" },
  { name: "albanvale", lat: -37.755, lng: 144.782, outerZone: "sun_stalbans" },
  { name: "albert park", lat: -37.844, lng: 144.955, outerZone: "mon_lower1" },
  { name: "albion", lat: -37.775, lng: 144.819, outerZone: "sun_stalbans" },
  { name: "alphington", lat: -37.779, lng: 145.03, outerZone: "tue_lower2" },
  { name: "altona", lat: -37.8686, lng: 144.8306, outerZone: "sun_stalbans" },
  { name: "altona meadows", lat: -37.878, lng: 144.788, outerZone: "sun_stalbans" },
  { name: "altona north", lat: -37.842, lng: 144.848, outerZone: "sun_stalbans" },
  { name: "ardeer", lat: -37.781, lng: 144.809, outerZone: "sun_stalbans" },
  { name: "ascot vale", lat: -37.776, lng: 144.916, outerZone: "mon_lower1" },
  { name: "attwood", lat: -37.67, lng: 144.877, outerZone: "fri_north" },
  { name: "avondale heights", lat: -37.761, lng: 144.862, outerZone: "sun_stalbans" },
  { name: "bacchus marsh", lat: -37.676, lng: 144.439, outerZone: "sat_melton" },
  { name: "balaclava", lat: -37.871, lng: 144.996, outerZone: "mon_lower1" },
  { name: "ballan", lat: -37.6, lng: 144.23, outerZone: "sat_melton" },
  { name: "balwyn", lat: -37.811, lng: 145.082, outerZone: "tue_lower2" },
  { name: "balwyn north", lat: -37.794, lng: 145.086, outerZone: "tue_lower2" },
  { name: "bangholme", lat: -38.038, lng: 145.166, outerZone: "mon_lower1" },
  { name: "bayswater", lat: -37.848, lng: 145.267, outerZone: "wed_lower3" },
  { name: "bayswater north", lat: -37.832, lng: 145.285, outerZone: "wed_lower3" },
  { name: "beaumaris", lat: -37.986, lng: 145.035, outerZone: "mon_lower1" },
  { name: "belgrave", lat: -37.908, lng: 145.355, outerZone: "wed_lower3" },
  { name: "berwick", lat: -38.031, lng: 145.346, outerZone: "mon_lower1" },
  { name: "beveridge", lat: -37.476, lng: 144.992, outerZone: "fri_north" },
  { name: "black rock", lat: -37.969, lng: 145.016, outerZone: "mon_lower1" },
  { name: "blackburn", lat: -37.82, lng: 145.152, outerZone: "tue_lower2" },
  { name: "blackburn north", lat: -37.806, lng: 145.153, outerZone: "tue_lower2" },
  { name: "blackburn south", lat: -37.839, lng: 145.148, outerZone: "tue_lower2" },
  { name: "blairgowrie", lat: -38.361, lng: 144.777, outerZone: "mon_lower1" },
  { name: "bonnie brook", lat: -37.71, lng: 144.712, outerZone: "sat_melton" },
  { name: "boronia", lat: -37.861, lng: 145.287, outerZone: "wed_lower3" },
  { name: "box hill", lat: -37.8194, lng: 145.1219, outerZone: "tue_lower2" },
  { name: "box hill north", lat: -37.806, lng: 145.131, outerZone: "tue_lower2" },
  { name: "box hill south", lat: -37.834, lng: 145.126, outerZone: "tue_lower2" },
  { name: "braybrook", lat: -37.788, lng: 144.861, outerZone: "sun_stalbans" },
  { name: "briar hill", lat: -37.71, lng: 145.125, outerZone: "thu_bundoora" },
  { name: "brighton", lat: -37.9061, lng: 144.9922, outerZone: "mon_lower1" },
  { name: "brighton east", lat: -37.91, lng: 145.016, outerZone: "mon_lower1" },
  { name: "broadmeadows", lat: -37.6803, lng: 144.9188, outerZone: "fri_north" },
  { name: "brookfield", lat: -37.698, lng: 144.548, outerZone: "sat_melton" },
  { name: "brooklyn", lat: -37.818, lng: 144.845, outerZone: "sun_stalbans" },
  { name: "brunswick", lat: -37.7667, lng: 144.9603, outerZone: "mon_lower1" },
  { name: "brunswick east", lat: -37.766, lng: 144.978, outerZone: "mon_lower1" },
  { name: "brunswick west", lat: -37.761, lng: 144.945, outerZone: "mon_lower1" },
  { name: "bulla", lat: -37.633, lng: 144.805, outerZone: "fri_north" },
  { name: "bulleen", lat: -37.774, lng: 145.094, outerZone: "tue_lower2" },
  { name: "bundoora", lat: -37.7003, lng: 145.0669, outerZone: "thu_bundoora" },
  { name: "burnside", lat: -37.761, lng: 144.764, outerZone: "sat_melton" },
  { name: "burnside heights", lat: -37.747, lng: 144.757, outerZone: "sat_melton" },
  { name: "burwood", lat: -37.85, lng: 145.105, outerZone: "tue_lower2" },
  { name: "burwood east", lat: -37.852, lng: 145.147, outerZone: "tue_lower2" },
  { name: "cairnlea", lat: -37.767, lng: 144.809, outerZone: "sun_stalbans" },
  { name: "camberwell", lat: -37.8261, lng: 145.0586, outerZone: "tue_lower2" },
  { name: "campbellfield", lat: -37.671, lng: 144.954, outerZone: "fri_north" },
  { name: "canterbury", lat: -37.824, lng: 145.081, outerZone: "tue_lower2" },
  { name: "cape schanck", lat: -38.487, lng: 144.887, outerZone: "mon_lower1" },
  { name: "carlton", lat: -37.8, lng: 144.967, outerZone: "mon_lower1" },
  { name: "carlton north", lat: -37.786, lng: 144.972, outerZone: "mon_lower1" },
  { name: "caroline springs", lat: -37.734, lng: 144.741, outerZone: "sat_melton" },
  { name: "carrum", lat: -38.077, lng: 145.127, outerZone: "mon_lower1" },
  { name: "caulfield", lat: -37.878, lng: 145.023, outerZone: "mon_lower1" },
  { name: "cheltenham", lat: -37.967, lng: 145.056, outerZone: "mon_lower1" },
  { name: "chirnside park", lat: -37.755, lng: 145.319, outerZone: "wed_lower3" },
  { name: "clarkefield", lat: -37.495, lng: 144.747, outerZone: "fri_north" },
  { name: "clayton", lat: -37.925, lng: 145.121, outerZone: "wed_lower3" },
  { name: "cobblebank", lat: -37.719, lng: 144.606, outerZone: "sat_melton" },
  { name: "coburg", lat: -37.7439, lng: 144.9631, outerZone: "mon_lower1" },
  { name: "coburg north", lat: -37.727, lng: 144.966, outerZone: "mon_lower1" },
  { name: "coldstream", lat: -37.728, lng: 145.378, outerZone: "wed_lower3" },
  { name: "collingwood", lat: -37.803, lng: 144.988, outerZone: "mon_lower1" },
  { name: "coolaroo", lat: -37.6603, lng: 144.9236, outerZone: "fri_north" },
  { name: "craigieburn", lat: -37.6008, lng: 144.9403, outerZone: "fri_north" },
  { name: "craigieburn north", lat: -37.575, lng: 144.942, outerZone: "fri_north" },
  { name: "cranbourne", lat: -38.099, lng: 145.283, outerZone: "mon_lower1" },
  { name: "cremorne", lat: -37.83, lng: 144.995, outerZone: "tue_lower2" },
  { name: "croydon", lat: -37.794, lng: 145.281, outerZone: "wed_lower3" },
  { name: "croydon hills", lat: -37.778, lng: 145.268, outerZone: "wed_lower3" },
  { name: "croydon north", lat: -37.772, lng: 145.287, outerZone: "wed_lower3" },
  { name: "croydon south", lat: -37.811, lng: 145.283, outerZone: "wed_lower3" },
  { name: "dallas", lat: -37.676, lng: 144.931, outerZone: "fri_north" },
  { name: "dandenong", lat: -37.987, lng: 145.215, outerZone: "mon_lower1" },
  { name: "deanside", lat: -37.729, lng: 144.726, outerZone: "sat_melton" },
  { name: "deer park", lat: -37.768, lng: 144.781, outerZone: "sun_stalbans" },
  { name: "delahey", lat: -37.726, lng: 144.789, outerZone: "sun_stalbans" },
  { name: "derrimut", lat: -37.798, lng: 144.786, outerZone: "sun_stalbans" },
  { name: "diamond creek", lat: -37.674, lng: 145.157, outerZone: "thu_bundoora" },
  { name: "diggers rest", lat: -37.628, lng: 144.721, outerZone: "sat_melton" },
  { name: "doncaster", lat: -37.7869, lng: 145.1247, outerZone: "tue_lower2" },
  { name: "doncaster east", lat: -37.783, lng: 145.153, outerZone: "tue_lower2" },
  { name: "donnybrook", lat: -37.534, lng: 144.975, outerZone: "fri_north" },
  { name: "donvale", lat: -37.782, lng: 145.184, outerZone: "tue_lower2" },
  { name: "doreen", lat: -37.593, lng: 145.132, outerZone: "thu_bundoora" },
  { name: "dromana", lat: -38.337, lng: 144.965, outerZone: "mon_lower1" },
  { name: "eaglemont", lat: -37.761, lng: 145.062, outerZone: "tue_lower2" },
  { name: "elsternwick", lat: -37.885, lng: 145.004, outerZone: "mon_lower1" },
  { name: "eltham", lat: -37.7139, lng: 145.1478, outerZone: "thu_bundoora" },
  { name: "eltham north", lat: -37.695, lng: 145.152, outerZone: "thu_bundoora" },
  { name: "elwood", lat: -37.882, lng: 144.987, outerZone: "mon_lower1" },
  { name: "emerald", lat: -37.933, lng: 145.441, outerZone: "wed_lower3" },
  { name: "epping", lat: -37.6497, lng: 145.0203, outerZone: "fri_north" },
  { name: "epping north", lat: -37.618, lng: 145.025, outerZone: "fri_north" },
  { name: "essendon", lat: -37.7529, lng: 144.9075, outerZone: "mon_lower1" },
  { name: "essendon fields", lat: -37.729, lng: 144.901, outerZone: "mon_lower1" },
  { name: "essendon north", lat: -37.74, lng: 144.907, outerZone: "mon_lower1" },
  { name: "essendon west", lat: -37.748, lng: 144.887, outerZone: "mon_lower1" },
  { name: "exford", lat: -37.742, lng: 144.558, outerZone: "sat_melton" },
  { name: "eynesbury", lat: -37.792, lng: 144.564, outerZone: "sat_melton" },
  { name: "fairfield", lat: -37.778, lng: 145.016, outerZone: "tue_lower2" },
  { name: "fawkner", lat: -37.707, lng: 144.962, outerZone: "mon_lower1" },
  { name: "ferntree gully", lat: -37.882, lng: 145.293, outerZone: "wed_lower3" },
  { name: "fitzroy", lat: -37.801, lng: 144.978, outerZone: "mon_lower1" },
  { name: "fitzroy north", lat: -37.783, lng: 144.982, outerZone: "mon_lower1" },
  { name: "flemington", lat: -37.788, lng: 144.928, outerZone: "mon_lower1" },
  { name: "footscray", lat: -37.8003, lng: 144.9003, outerZone: "sun_stalbans" },
  { name: "forest hill", lat: -37.84, lng: 145.167, outerZone: "wed_lower3" },
  { name: "frankston", lat: -38.143, lng: 145.122, outerZone: "mon_lower1" },
  { name: "fraser rise", lat: -37.704, lng: 144.743, outerZone: "sat_melton" },
  { name: "gardenvale", lat: -37.896, lng: 145.006, outerZone: "mon_lower1" },
  { name: "geelong", lat: -38.1499, lng: 144.3617, outerZone: "sat_melton" },
  { name: "gisborne", lat: -37.489, lng: 144.593, outerZone: "sat_melton" },
  { name: "gladstone park", lat: -37.6903, lng: 144.8886, outerZone: "fri_north" },
  { name: "glen iris", lat: -37.857, lng: 145.06, outerZone: "tue_lower2" },
  { name: "glen waverley", lat: -37.8783, lng: 145.1642, outerZone: "wed_lower3" },
  { name: "glenbervie", lat: -37.743, lng: 144.923, outerZone: "mon_lower1" },
  { name: "glenroy", lat: -37.7047, lng: 144.9186, outerZone: "mon_lower1" },
  { name: "gowanbrae", lat: -37.712, lng: 144.897, outerZone: "mon_lower1" },
  { name: "grangefields", lat: -37.725, lng: 144.695, outerZone: "sat_melton" },
  { name: "greensborough", lat: -37.7042, lng: 145.1017, outerZone: "thu_bundoora" },
  { name: "greenvale", lat: -37.643, lng: 144.881, outerZone: "fri_north" },
  { name: "hadfield", lat: -37.713, lng: 144.939, outerZone: "mon_lower1" },
  { name: "hampton", lat: -37.936, lng: 145.004, outerZone: "mon_lower1" },
  { name: "harkness", lat: -37.667, lng: 144.561, outerZone: "sat_melton" },
  { name: "hawthorn", lat: -37.8219, lng: 145.0347, outerZone: "tue_lower2" },
  { name: "hawthorn east", lat: -37.828, lng: 145.053, outerZone: "tue_lower2" },
  { name: "healesville", lat: -37.656, lng: 145.514, outerZone: "wed_lower3" },
  { name: "heathmont", lat: -37.832, lng: 145.244, outerZone: "wed_lower3" },
  { name: "heidelberg", lat: -37.755, lng: 145.061, outerZone: "tue_lower2" },
  { name: "heidelberg heights", lat: -37.747, lng: 145.051, outerZone: "tue_lower2" },
  { name: "heidelberg west", lat: -37.739, lng: 145.043, outerZone: "tue_lower2" },
  { name: "hillside", lat: -37.702, lng: 144.762, outerZone: "sat_melton" },
  { name: "hoppers crossing", lat: -37.884, lng: 144.7, outerZone: "sun_stalbans" },
  { name: "indented head", lat: -38.146, lng: 144.71, outerZone: "sat_melton" },
  { name: "ivanhoe", lat: -37.77, lng: 145.042, outerZone: "tue_lower2" },
  { name: "ivanhoe east", lat: -37.773, lng: 145.06, outerZone: "tue_lower2" },
  { name: "jacana", lat: -37.692, lng: 144.919, outerZone: "fri_north" },
  { name: "kalkallo", lat: -37.525, lng: 144.948, outerZone: "fri_north" },
  { name: "kealba", lat: -37.737, lng: 144.825, outerZone: "sun_stalbans" },
  { name: "keilor", lat: -37.7186, lng: 144.8339, outerZone: "sat_melton" },
  { name: "keilor downs", lat: -37.73, lng: 144.808, outerZone: "sun_stalbans" },
  { name: "keilor east", lat: -37.736, lng: 144.862, outerZone: "sun_stalbans" },
  { name: "keilor lodge", lat: -37.718, lng: 144.808, outerZone: "sun_stalbans" },
  { name: "keilor park", lat: -37.714, lng: 144.858, outerZone: "sat_melton" },
  { name: "kensington", lat: -37.794, lng: 144.929, outerZone: "mon_lower1" },
  { name: "kew", lat: -37.806, lng: 145.032, outerZone: "tue_lower2" },
  { name: "kew east", lat: -37.799, lng: 145.052, outerZone: "tue_lower2" },
  { name: "keysborough", lat: -37.999, lng: 145.163, outerZone: "mon_lower1" },
  { name: "kilmore", lat: -37.294, lng: 144.952, outerZone: "fri_north" },
  { name: "kilsyth", lat: -37.808, lng: 145.319, outerZone: "wed_lower3" },
  { name: "kilsyth south", lat: -37.827, lng: 145.318, outerZone: "wed_lower3" },
  { name: "kinglake", lat: -37.521, lng: 145.356, outerZone: "thu_bundoora" },
  { name: "kinglake west", lat: -37.498, lng: 145.296, outerZone: "thu_bundoora" },
  { name: "kings park", lat: -37.749, lng: 144.776, outerZone: "sun_stalbans" },
  { name: "kingsbury", lat: -37.717, lng: 145.045, outerZone: "thu_bundoora" },
  { name: "kingsville", lat: -37.812, lng: 144.881, outerZone: "sun_stalbans" },
  { name: "knoxfield", lat: -37.892, lng: 145.25, outerZone: "wed_lower3" },
  { name: "kurunjang", lat: -37.663, lng: 144.589, outerZone: "sat_melton" },
  { name: "lalor", lat: -37.666, lng: 145.018, outerZone: "thu_bundoora" },
  { name: "lancefield", lat: -37.28, lng: 144.73, outerZone: "sat_melton" },
  { name: "lara", lat: -38.019, lng: 144.409, outerZone: "sat_melton" },
  { name: "laverton", lat: -37.862, lng: 144.772, outerZone: "sun_stalbans" },
  { name: "laverton north", lat: -37.834, lng: 144.796, outerZone: "sun_stalbans" },
  { name: "leopold", lat: -38.188, lng: 144.463, outerZone: "sat_melton" },
  { name: "lilydale", lat: -37.7561, lng: 145.3492, outerZone: "wed_lower3" },
  { name: "little river", lat: -37.969, lng: 144.498, outerZone: "sat_melton" },
  { name: "lower plenty", lat: -37.739, lng: 145.128, outerZone: "thu_bundoora" },
  { name: "macedon", lat: -37.42, lng: 144.563, outerZone: "sat_melton" },
  { name: "macleod", lat: -37.728, lng: 145.068, outerZone: "thu_bundoora" },
  { name: "maidstone", lat: -37.781, lng: 144.876, outerZone: "sun_stalbans" },
  { name: "manor lakes", lat: -37.906, lng: 144.595, outerZone: "sun_stalbans" },
  { name: "maribyrnong", lat: -37.777, lng: 144.892, outerZone: "sun_stalbans" },
  { name: "meadow heights", lat: -37.647, lng: 144.916, outerZone: "fri_north" },
  { name: "melbourne", lat: -37.8136, lng: 144.9631, outerZone: "mon_lower1" },
  { name: "melbourne airport", lat: -37.669, lng: 144.841, outerZone: "fri_north" },
  { name: "melbourne cbd", lat: -37.8136, lng: 144.9631, outerZone: "mon_lower1" },
  { name: "melton", lat: -37.6839, lng: 144.5861, outerZone: "sat_melton" },
  { name: "melton south", lat: -37.708, lng: 144.579, outerZone: "sat_melton" },
  { name: "melton west", lat: -37.686, lng: 144.558, outerZone: "sat_melton" },
  { name: "mentone", lat: -37.983, lng: 145.067, outerZone: "mon_lower1" },
  { name: "mernda", lat: -37.604, lng: 145.103, outerZone: "thu_bundoora" },
  { name: "mickleham", lat: -37.535, lng: 144.912, outerZone: "fri_north" },
  { name: "middle park", lat: -37.85, lng: 144.961, outerZone: "mon_lower1" },
  { name: "mill park", lat: -37.667, lng: 145.068, outerZone: "thu_bundoora" },
  { name: "mitcham", lat: -37.817, lng: 145.195, outerZone: "wed_lower3" },
  { name: "monbulk", lat: -37.878, lng: 145.419, outerZone: "wed_lower3" },
  { name: "monegeetta", lat: -37.417, lng: 144.75, outerZone: "sat_melton" },
  { name: "montmorency", lat: -37.719, lng: 145.127, outerZone: "thu_bundoora" },
  { name: "montrose", lat: -37.807, lng: 145.347, outerZone: "wed_lower3" },
  { name: "moonee ponds", lat: -37.7647, lng: 144.9203, outerZone: "mon_lower1" },
  { name: "moorabbin", lat: -37.934, lng: 145.051, outerZone: "mon_lower1" },
  { name: "mooroolbark", lat: -37.785, lng: 145.312, outerZone: "wed_lower3" },
  { name: "mordialloc", lat: -37.999, lng: 145.086, outerZone: "mon_lower1" },
  { name: "mornington", lat: -38.221, lng: 145.039, outerZone: "mon_lower1" },
  { name: "mount cottrell", lat: -37.801, lng: 144.618, outerZone: "sat_melton" },
  { name: "mount eliza", lat: -38.188, lng: 145.093, outerZone: "mon_lower1" },
  { name: "mount evelyn", lat: -37.783, lng: 145.385, outerZone: "wed_lower3" },
  { name: "mount waverley", lat: -37.874, lng: 145.13, outerZone: "wed_lower3" },
  { name: "mulgrave", lat: -37.925, lng: 145.174, outerZone: "wed_lower3" },
  { name: "narre warren", lat: -38.016, lng: 145.304, outerZone: "mon_lower1" },
  { name: "narre warren south", lat: -38.056, lng: 145.297, outerZone: "mon_lower1" },
  { name: "newport", lat: -37.844, lng: 144.883, outerZone: "sun_stalbans" },
  { name: "niddrie", lat: -37.7353, lng: 144.8944, outerZone: "mon_lower1" },
  { name: "noble park", lat: -37.966, lng: 145.18, outerZone: "mon_lower1" },
  { name: "north melbourne", lat: -37.798, lng: 144.945, outerZone: "mon_lower1" },
  { name: "northcote", lat: -37.771, lng: 144.998, outerZone: "mon_lower1" },
  { name: "nunawading", lat: -37.819, lng: 145.176, outerZone: "wed_lower3" },
  { name: "oak park", lat: -37.718, lng: 144.922, outerZone: "mon_lower1" },
  { name: "oaklands junction", lat: -37.607, lng: 144.862, outerZone: "fri_north" },
  { name: "ocean grove", lat: -38.267, lng: 144.52, outerZone: "sat_melton" },
  { name: "officer", lat: -38.062, lng: 145.417, outerZone: "mon_lower1" },
  { name: "pakenham", lat: -38.071, lng: 145.488, outerZone: "mon_lower1" },
  { name: "panton hill", lat: -37.643, lng: 145.238, outerZone: "thu_bundoora" },
  { name: "parkville", lat: -37.786, lng: 144.951, outerZone: "mon_lower1" },
  { name: "parwan", lat: -37.706, lng: 144.471, outerZone: "sat_melton" },
  { name: "pascoe vale", lat: -37.7268, lng: 144.9384, outerZone: "mon_lower1" },
  { name: "pascoe vale south", lat: -37.742, lng: 144.939, outerZone: "mon_lower1" },
  { name: "plumpton", lat: -37.713, lng: 144.726, outerZone: "sat_melton" },
  { name: "point cook", lat: -37.9142, lng: 144.7514, outerZone: "sun_stalbans" },
  { name: "port melbourne", lat: -37.838, lng: 144.933, outerZone: "mon_lower1" },
  { name: "portsea", lat: -38.319, lng: 144.714, outerZone: "mon_lower1" },
  { name: "preston", lat: -37.7411, lng: 144.9992, outerZone: "thu_bundoora" },
  { name: "queenscliff", lat: -38.268, lng: 144.659, outerZone: "sat_melton" },
  { name: "ravenhall", lat: -37.771, lng: 144.758, outerZone: "sat_melton" },
  { name: "reservoir", lat: -37.7169, lng: 145.0064, outerZone: "thu_bundoora" },
  { name: "richmond", lat: -37.8233, lng: 144.9981, outerZone: "tue_lower2" },
  { name: "riddells creek", lat: -37.465, lng: 144.68, outerZone: "sat_melton" },
  { name: "ringwood", lat: -37.8147, lng: 145.2294, outerZone: "wed_lower3" },
  { name: "ringwood east", lat: -37.814, lng: 145.257, outerZone: "wed_lower3" },
  { name: "ringwood north", lat: -37.797, lng: 145.236, outerZone: "wed_lower3" },
  { name: "ringwood south", lat: -37.828, lng: 145.231, outerZone: "wed_lower3" },
  { name: "ripponlea", lat: -37.877, lng: 144.997, outerZone: "mon_lower1" },
  { name: "rockbank", lat: -37.73, lng: 144.654, outerZone: "sat_melton" },
  { name: "romsey", lat: -37.35, lng: 144.743, outerZone: "sat_melton" },
  { name: "rosanna", lat: -37.742, lng: 145.069, outerZone: "tue_lower2" },
  { name: "rosebud", lat: -38.358, lng: 144.908, outerZone: "mon_lower1" },
  { name: "rowville", lat: -37.924, lng: 145.244, outerZone: "wed_lower3" },
  { name: "roxburgh park", lat: -37.6389, lng: 144.9236, outerZone: "fri_north" },
  { name: "rye", lat: -38.371, lng: 144.821, outerZone: "mon_lower1" },
  { name: "sandringham", lat: -37.951, lng: 145.007, outerZone: "mon_lower1" },
  { name: "scoresby", lat: -37.904, lng: 145.234, outerZone: "wed_lower3" },
  { name: "seabrook", lat: -37.886, lng: 144.757, outerZone: "sun_stalbans" },
  { name: "seaford", lat: -38.103, lng: 145.132, outerZone: "mon_lower1" },
  { name: "seddon", lat: -37.807, lng: 144.893, outerZone: "sun_stalbans" },
  { name: "somerton", lat: -37.64, lng: 144.95, outerZone: "fri_north" },
  { name: "sorrento", lat: -38.339, lng: 144.743, outerZone: "mon_lower1" },
  { name: "south melbourne", lat: -37.833, lng: 144.957, outerZone: "mon_lower1" },
  { name: "south morang", lat: -37.644, lng: 145.074, outerZone: "thu_bundoora" },
  { name: "south yarra", lat: -37.839, lng: 144.99, outerZone: "mon_lower1" },
  { name: "southbank", lat: -37.826, lng: 144.964, outerZone: "mon_lower1" },
  { name: "springvale", lat: -37.951, lng: 145.152, outerZone: "wed_lower3" },
  { name: "st albans", lat: -37.7447, lng: 144.8028, outerZone: "sun_stalbans" },
  { name: "st albans north", lat: -37.735, lng: 144.795, outerZone: "sun_stalbans" },
  { name: "st andrews", lat: -37.601, lng: 145.271, outerZone: "thu_bundoora" },
  { name: "st kilda", lat: -37.8678, lng: 144.9808, outerZone: "mon_lower1" },
  { name: "st kilda east", lat: -37.867, lng: 145.003, outerZone: "mon_lower1" },
  { name: "st leonards", lat: -38.172, lng: 144.717, outerZone: "sat_melton" },
  { name: "strathmore", lat: -37.7392, lng: 144.9203, outerZone: "mon_lower1" },
  { name: "strathmore heights", lat: -37.716, lng: 144.889, outerZone: "mon_lower1" },
  { name: "strathtulloh", lat: -37.728, lng: 144.602, outerZone: "sat_melton" },
  { name: "sunbury", lat: -37.5811, lng: 144.7278, outerZone: "sat_melton" },
  { name: "sunshine", lat: -37.7883, lng: 144.8331, outerZone: "sun_stalbans" },
  { name: "sunshine north", lat: -37.77, lng: 144.837, outerZone: "sun_stalbans" },
  { name: "sunshine west", lat: -37.802, lng: 144.821, outerZone: "sun_stalbans" },
  { name: "surrey hills", lat: -37.825, lng: 145.101, outerZone: "tue_lower2" },
  { name: "tarneit", lat: -37.833, lng: 144.66, outerZone: "sun_stalbans" },
  { name: "taylors hill", lat: -37.713, lng: 144.777, outerZone: "sat_melton" },
  { name: "taylors lakes", lat: -37.702, lng: 144.789, outerZone: "sat_melton" },
  { name: "templestowe", lat: -37.753, lng: 145.131, outerZone: "tue_lower2" },
  { name: "templestowe lower", lat: -37.766, lng: 145.124, outerZone: "tue_lower2" },
  { name: "the basin", lat: -37.855, lng: 145.32, outerZone: "wed_lower3" },
  { name: "thomastown", lat: -37.683, lng: 145.016, outerZone: "thu_bundoora" },
  { name: "thornbury", lat: -37.756, lng: 144.998, outerZone: "thu_bundoora" },
  { name: "thornhill park", lat: -37.719, lng: 144.636, outerZone: "sat_melton" },
  { name: "toolern vale", lat: -37.613, lng: 144.571, outerZone: "sat_melton" },
  { name: "toorak", lat: -37.842, lng: 145.016, outerZone: "mon_lower1" },
  { name: "tottenham", lat: -37.804, lng: 144.856, outerZone: "sun_stalbans" },
  { name: "travancore", lat: -37.781, lng: 144.936, outerZone: "mon_lower1" },
  { name: "truganina", lat: -37.838, lng: 144.721, outerZone: "sun_stalbans" },
  { name: "tullamarine", lat: -37.7008, lng: 144.8869, outerZone: "fri_north" },
  { name: "upper ferntree gully", lat: -37.895, lng: 145.321, outerZone: "wed_lower3" },
  { name: "vermont", lat: -37.836, lng: 145.195, outerZone: "wed_lower3" },
  { name: "vermont south", lat: -37.854, lng: 145.191, outerZone: "wed_lower3" },
  { name: "viewbank", lat: -37.741, lng: 145.093, outerZone: "tue_lower2" },
  { name: "wallan", lat: -37.4167, lng: 144.9833, outerZone: "fri_north" },
  { name: "wantirna", lat: -37.852, lng: 145.228, outerZone: "wed_lower3" },
  { name: "wantirna south", lat: -37.873, lng: 145.229, outerZone: "wed_lower3" },
  { name: "warrandyte", lat: -37.74, lng: 145.22, outerZone: "tue_lower2" },
  { name: "watsonia", lat: -37.712, lng: 145.083, outerZone: "thu_bundoora" },
  { name: "watsonia north", lat: -37.697, lng: 145.085, outerZone: "thu_bundoora" },
  { name: "weir views", lat: -37.712, lng: 144.569, outerZone: "sat_melton" },
  { name: "werribee", lat: -37.9006, lng: 144.6614, outerZone: "sun_stalbans" },
  { name: "werribee south", lat: -37.969, lng: 144.693, outerZone: "sun_stalbans" },
  { name: "west footscray", lat: -37.805, lng: 144.879, outerZone: "sun_stalbans" },
  { name: "west melbourne", lat: -37.808, lng: 144.942, outerZone: "mon_lower1" },
  { name: "westmeadows", lat: -37.674, lng: 144.886, outerZone: "fri_north" },
  { name: "wheelers hill", lat: -37.901, lng: 145.189, outerZone: "wed_lower3" },
  { name: "whittlesea", lat: -37.514, lng: 145.115, outerZone: "thu_bundoora" },
  { name: "wildwood", lat: -37.567, lng: 144.792, outerZone: "sat_melton" },
  { name: "williamstown", lat: -37.8656, lng: 144.8969, outerZone: "sun_stalbans" },
  { name: "wollert", lat: -37.598, lng: 145.034, outerZone: "fri_north" },
  { name: "wyndham", lat: -37.9006, lng: 144.6614, outerZone: "sun_stalbans" },
  { name: "wyndham vale", lat: -37.889, lng: 144.62, outerZone: "sun_stalbans" },
  { name: "yallambie", lat: -37.726, lng: 145.105, outerZone: "thu_bundoora" },
  { name: "yarra glen", lat: -37.653, lng: 145.373, outerZone: "wed_lower3" },
  { name: "yarraville", lat: -37.816, lng: 144.891, outerZone: "sun_stalbans" },
  { name: "yuroke", lat: -37.599, lng: 144.896, outerZone: "fri_north" },
];

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

// The designated 15 KM Tullamarine Service Area suburbs list
export const INNER_15KM_SUBURBS = new Set([
  // North / North-East
  "tullamarine", "melbourne airport", "gladstone park", "westmeadows", "attwood",
  "broadmeadows", "jacana", "dallas", "campbellfield", "coolaroo", "meadow heights",
  "roxburgh park", "greenvale", "somerton", "fawkner", "glenroy", "oak park",
  // East / North-East
  "gowanbrae", "hadfield", "pascoe vale", "pascoe vale south", "coburg north",
  "coburg", "brunswick west", "brunswick", "brunswick east", "reservoir", "preston", "thornbury",
  // South / South-East
  "strathmore heights", "airport west", "essendon fields", "niddrie", "essendon north",
  "essendon west", "essendon", "strathmore", "glenbervie", "aberfeldie", "moonee ponds",
  "ascot vale", "travancore", "flemington", "kensington", "maribyrnong", "avondale heights",
  // West / South-West
  "keilor park", "keilor", "keilor east", "kealba", "keilor downs", "st albans",
  "albion", "sunshine", "sunshine north", "braybrook", "maidstone", "footscray", "west footscray",
]);

/** Match a lead's address/suburb text to our catalog and classify into 15km Inner or 7-Day Outer Zone. */
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
    // Unlisted / non-Melbourne address -> outside 50 km inspection boundary
    return { suburb: null, zone: "outside", distanceKm: null, inner: false, serviced: false, label: "Outside 50 km Service Area" };
  }

  const dist = distanceKm(TULLAMARINE, match);
  const serviced = dist <= MAX_INSPECTION_RADIUS_KM;

  if (!serviced) {
    return {
      suburb: match.name,
      zone: "outside",
      distanceKm: dist,
      inner: false,
      serviced: false,
      label: `Outside 50 km Service Area (~${Math.round(dist)} km from Tullamarine)`,
    };
  }

  // Tullamarine 15 km inner circle rule: Available Every Day if in 15km list & within radius
  const isInner = INNER_15KM_SUBURBS.has(match.name) && dist <= RADIUS_KM;
  if (isInner) {
    return {
      suburb: match.name,
      zone: "inner",
      distanceKm: dist,
      inner: true,
      serviced: true,
      label: ZONE_LABEL.inner,
    };
  }

  // Outside 15 km but within 50 km: Assigned to its designated regional day
  const zone = match.outerZone;
  return {
    suburb: match.name,
    zone,
    distanceKm: dist,
    inner: false,
    serviced: true,
    label: ZONE_LABEL[zone],
  };
}

/**
 * Resolve a customer's area from precise GPS coordinates (e.g. captured via the
 * browser "use my location" button on the booking page). This is the most
 * accurate classifier: the 15 km "every day" rule is applied as a true distance
 * to Tullamarine, and the corridor day is taken from the nearest known suburb.
 */
export function resolveAreaByCoords(lat: number, lng: number): AreaInfo {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { suburb: null, zone: "outside", distanceKm: null, inner: false, serviced: false, label: "Outside 50 km Service Area" };
  }
  const pt = { lat, lng };

  // Nearest catalogued suburb (for the outer-zone day assignment).
  let nearest = SUBURBS[0];
  let best = Infinity;
  for (const s of SUBURBS) {
    const d = distanceKm(pt, s);
    if (d < best) {
      best = d;
      nearest = s;
    }
  }

  const distToTulla = distanceKm(TULLAMARINE, pt);
  const serviced = distToTulla <= MAX_INSPECTION_RADIUS_KM;

  if (!serviced) {
    return {
      suburb: nearest.name,
      zone: "outside",
      distanceKm: distToTulla,
      inner: false,
      serviced: false,
      label: `Outside 50 km Service Area (~${Math.round(distToTulla)} km from Tullamarine)`,
    };
  }

  // 15 km Tullamarine rule as a real geographic circle → available every day.
  if (distToTulla <= RADIUS_KM) {
    return {
      suburb: nearest.name,
      zone: "inner",
      distanceKm: distToTulla,
      inner: true,
      serviced: true,
      label: ZONE_LABEL.inner,
    };
  }

  const zone = nearest.outerZone;
  return {
    suburb: nearest.name,
    zone,
    distanceKm: distToTulla,
    inner: false,
    serviced: true,
    label: ZONE_LABEL[zone],
  };
}

/** Weekdays (0=Sun, 1=Mon … 6=Sat) a given area may be booked on.
 *  @param allWeekdays  Pass true for job bookings (every day); false/omitted = inspection Sat+Sun only.
 */
export function allowedWeekdays(area: AreaInfo, allWeekdays = false): Set<number> {
  if (!area.serviced || area.zone === "outside" || (area.distanceKm != null && area.distanceKm > MAX_INSPECTION_RADIUS_KM)) {
    return new Set();
  }
  // Job bookings run every day of the week; inspection bookings are Sat+Sun only.
  if (allWeekdays) return new Set([0, 1, 2, 3, 4, 5, 6]);
  return new Set([0, 6]);
}

/** Human-friendly availability text for customer emails and SMS. */
export function getAvailableDaysSummary(area: AreaInfo): string {
  if (!area.serviced || area.zone === "outside" || (area.distanceKm != null && area.distanceKm > MAX_INSPECTION_RADIUS_KM)) {
    return "Outside 50 km Service Area (Free inspection timing not available online)";
  }
  return "Saturday & Sunday (Inspections available on weekends)";
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
 * @param allWeekdays   true for job bookings (every day); omit/false for inspection Sat+Sun only
 */
export function computeAvailability(
  area: AreaInfo,
  bookedByDate: Map<string, Set<string>>,
  sameZoneDates: Set<string>,
  allWeekdays = false
): DayOption[] {
  // Do NOT show free inspection timing outside 50 km radius from Tullamarine
  if (!area.serviced || area.zone === "outside" || (area.distanceKm != null && area.distanceKm > MAX_INSPECTION_RADIUS_KM)) {
    return [];
  }

  const weekdays = allowedWeekdays(area, allWeekdays);
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

  for (let i = 1; i <= BOOKING_HORIZON_DAYS; i++) {
    const d = new Date(baseNoonUtc + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    // Do not show timings before 28 Sept 2026
    if (MIN_BOOKING_DATE && dateStr < MIN_BOOKING_DATE) continue;

    const wd = d.getUTCDay();
    if (!weekdays.has(wd)) continue;

    const locked = bookedByDate.get(dateStr) || new Set<string>();
    // Friday timing: strictly 10:00 AM – 3:00 PM; Other days: 9:00 AM – 5:00 PM
    const daySlots = wd === 5 ? FRIDAY_TIME_SLOTS : STANDARD_TIME_SLOTS;

    // Keep every slot, flagging the ones already taken so the customer can see
    // them as "Booked" rather than them silently disappearing.
    const slots: TimeSlot[] = daySlots.map((t) => ({ time: t, booked: locked.has(t) }));
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

/** Is a chosen date/time actually offered for this area (defensive server check)?
 *  @param allWeekdays  true for job bookings (every day); omit/false for inspection Sat+Sun only
 */
export function isSlotOffered(area: AreaInfo, date: string, time: string, allWeekdays = false): boolean {
  if (!area.serviced || area.zone === "outside" || (area.distanceKm != null && area.distanceKm > MAX_INSPECTION_RADIUS_KM)) return false;
  if (MIN_BOOKING_DATE && date < MIN_BOOKING_DATE) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12, 0, 0));
  if (Number.isNaN(d.getTime())) return false;
  const wd = d.getUTCDay();
  if (!allowedWeekdays(area, allWeekdays).has(wd)) return false;

  // Friday is strictly 10:00 AM – 3:00 PM; Other days are 9:00 AM – 5:00 PM
  const allowedSlots = wd === 5 ? FRIDAY_TIME_SLOTS : STANDARD_TIME_SLOTS;
  if (!allowedSlots.includes(time)) return false;

  // Must be within the booking horizon, compared against the Melbourne calendar
  // date (not the server's local date) so the boundary is correct everywhere.
  const melToday = melbourneYmd();
  if (date <= melToday) return false;
  const [ty, tm, td] = melToday.split("-").map(Number);
  const todayNoon = Date.UTC(ty, tm - 1, td, 12, 0, 0);
  const diffDays = Math.round((d.getTime() - todayNoon) / 86400000);
  return diffDays >= 1 && diffDays <= BOOKING_HORIZON_DAYS;
}
