// Melbourne smart-route scheduling.
//
// Two rules, straight from the SOP:
//   • Within 15 km of Tullamarine  → available every working day (Mon–Sat), and
//     we *nudge* the customer toward days that already have a job in the same
//     direction (route grouping) so a crew's day stays geographically tight.
//   • Outside 15 km                → the suburb's compass direction from
//     Tullamarine maps to one weekday (the pre-divided geographic areas), so
//     outer jobs cluster onto their area's run day.
//
// Coordinates are approximate suburb centroids — precise enough for a 15 km
// radius test and an 8-point compass bearing. Unknown suburbs fall back to
// "flexible" (all working days) so a customer is never blocked from booking.

export const TULLAMARINE = { lat: -37.7008, lng: 144.8869 };
export const RADIUS_KM = 15;
// Closed on Sunday (0). Working days Mon(1)–Sat(6).
const CLOSED_WEEKDAYS = new Set([0]);
// Appointment start times offered each day.
export const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
// How far ahead we let a customer book.
export const BOOKING_HORIZON_DAYS = 21;

export type Compass = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type Zone = Compass | "inner" | "flexible";

// A curated set of Melbourne suburbs Groutix serves (metro + regional hubs).
const SUBURBS: { name: string; lat: number; lng: number }[] = [
  // Inner / north-west near Tullamarine
  { name: "tullamarine", lat: -37.7008, lng: 144.8869 },
  { name: "gladstone park", lat: -37.6903, lng: 144.8886 },
  { name: "broadmeadows", lat: -37.6803, lng: 144.9188 },
  { name: "airport west", lat: -37.7211, lng: 144.8836 },
  { name: "keilor", lat: -37.7186, lng: 144.8339 },
  { name: "essendon", lat: -37.7529, lng: 144.9075 },
  { name: "niddrie", lat: -37.7353, lng: 144.8944 },
  { name: "strathmore", lat: -37.7392, lng: 144.9203 },
  { name: "pascoe vale", lat: -37.7268, lng: 144.9384 },
  { name: "glenroy", lat: -37.7047, lng: 144.9186 },
  { name: "coolaroo", lat: -37.6603, lng: 144.9236 },
  { name: "roxburgh park", lat: -37.6389, lng: 144.9236 },
  { name: "craigieburn", lat: -37.6008, lng: 144.9403 },
  { name: "sunbury", lat: -37.5811, lng: 144.7278 },
  { name: "st albans", lat: -37.7447, lng: 144.8028 },
  { name: "sunshine", lat: -37.7883, lng: 144.8331 },
  { name: "footscray", lat: -37.8003, lng: 144.9003 },
  { name: "moonee ponds", lat: -37.7647, lng: 144.9203 },
  { name: "brunswick", lat: -37.7667, lng: 144.9603 },
  { name: "coburg", lat: -37.7439, lng: 144.9631 },
  { name: "preston", lat: -37.7411, lng: 144.9992 },
  // North / north-east
  { name: "epping", lat: -37.6497, lng: 145.0203 },
  { name: "reservoir", lat: -37.7169, lng: 145.0064 },
  { name: "bundoora", lat: -37.7003, lng: 145.0669 },
  { name: "greensborough", lat: -37.7042, lng: 145.1017 },
  { name: "eltham", lat: -37.7139, lng: 145.1478 },
  // East
  { name: "melbourne", lat: -37.8136, lng: 144.9631 },
  { name: "richmond", lat: -37.8233, lng: 144.9981 },
  { name: "hawthorn", lat: -37.8219, lng: 145.0347 },
  { name: "box hill", lat: -37.8194, lng: 145.1219 },
  { name: "doncaster", lat: -37.7869, lng: 145.1247 },
  { name: "ringwood", lat: -37.8147, lng: 145.2294 },
  { name: "lilydale", lat: -37.7561, lng: 145.3492 },
  { name: "yarra glen", lat: -37.6592, lng: 145.3767 },
  // South-east
  { name: "camberwell", lat: -37.8261, lng: 145.0586 },
  { name: "glen waverley", lat: -37.8783, lng: 145.1642 },
  { name: "clayton", lat: -37.9244, lng: 145.1206 },
  { name: "dandenong", lat: -37.9878, lng: 145.2147 },
  { name: "narre warren", lat: -38.0264, lng: 145.3036 },
  { name: "berwick", lat: -38.0353, lng: 145.3472 },
  { name: "cranbourne", lat: -38.0992, lng: 145.2831 },
  // South
  { name: "st kilda", lat: -37.8678, lng: 144.9808 },
  { name: "brighton", lat: -37.9061, lng: 144.9922 },
  { name: "bentleigh", lat: -37.9178, lng: 145.0361 },
  { name: "cheltenham", lat: -37.9656, lng: 145.0556 },
  { name: "frankston", lat: -38.1436, lng: 145.1228 },
  { name: "mornington", lat: -38.2183, lng: 145.0389 },
  // South-west / west
  { name: "williamstown", lat: -37.8656, lng: 144.8969 },
  { name: "altona", lat: -37.8686, lng: 144.8306 },
  { name: "werribee", lat: -37.9006, lng: 144.6614 },
  { name: "point cook", lat: -37.9142, lng: 144.7514 },
  { name: "geelong", lat: -38.1499, lng: 144.3617 },
  // North-west regional
  { name: "melton", lat: -37.6839, lng: 144.5861 },
  { name: "bacchus marsh", lat: -37.6742, lng: 144.4386 },
  { name: "ballarat", lat: -37.5622, lng: 143.8503 },
  { name: "kilmore", lat: -37.2969, lng: 144.9522 },
];

// Each compass direction runs on one weekday (1=Mon … 6=Sat).
const ZONE_WEEKDAY: Record<Compass, number> = {
  N: 1, // Mon
  NW: 1, // Mon
  NE: 2, // Tue
  E: 3, // Wed
  SE: 4, // Thu
  S: 5, // Fri
  SW: 6, // Sat
  W: 6, // Sat
};

export interface AreaInfo {
  suburb: string | null;
  zone: Zone;
  distanceKm: number | null;
  inner: boolean;
  label: string;
}

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

function bearingToCompass(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Compass {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;
  const dirs: Compass[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(brng / 45) % 8];
}

const ZONE_LABEL: Record<Zone, string> = {
  N: "North", NE: "North-East", E: "East", SE: "South-East",
  S: "South", SW: "South-West", W: "West", NW: "North-West",
  inner: "Inner Melbourne (within 15 km)", flexible: "Greater Melbourne",
};

/** Match a lead's address/suburb text to our suburb table and classify it. */
export function resolveArea(addressText: string | undefined | null): AreaInfo {
  const text = (addressText || "").toLowerCase();
  // Prefer the longest suburb name that appears in the address (so "north
  // melbourne" doesn't shadow "melbourne", etc.).
  let match: (typeof SUBURBS)[number] | null = null;
  for (const s of SUBURBS) {
    if (text.includes(s.name)) {
      if (!match || s.name.length > match.name.length) match = s;
    }
  }
  if (!match) {
    return { suburb: null, zone: "flexible", distanceKm: null, inner: false, label: ZONE_LABEL.flexible };
  }
  const dist = distanceKm(TULLAMARINE, match);
  if (dist <= RADIUS_KM) {
    return { suburb: match.name, zone: "inner", distanceKm: dist, inner: true, label: ZONE_LABEL.inner };
  }
  const compass = bearingToCompass(TULLAMARINE, match);
  return {
    suburb: match.name,
    zone: compass,
    distanceKm: dist,
    inner: false,
    label: `${ZONE_LABEL[compass]} Melbourne run`,
  };
}

/** Weekdays (0–6) a given area may be booked on. */
function allowedWeekdays(area: AreaInfo): Set<number> {
  if (area.inner || area.zone === "flexible") {
    return new Set([1, 2, 3, 4, 5, 6]); // Mon–Sat
  }
  return new Set([ZONE_WEEKDAY[area.zone as Compass]]);
}

export interface DayOption {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Monday, 08 Sep"
  weekday: string;
  times: string[]; // free start times
  recommended: boolean; // route-grouping nudge
}

/**
 * Build the list of bookable days/times for an area.
 * @param bookedByDate  date(YYYY-MM-DD) → set of already-locked times
 * @param sameZoneDates dates that already have a job in this area (route nudge)
 */
export function computeAvailability(
  area: AreaInfo,
  bookedByDate: Map<string, Set<string>>,
  sameZoneDates: Set<string>
): DayOption[] {
  const weekdays = allowedWeekdays(area);
  const out: DayOption[] = [];
  const now = new Date();
  for (let i = 1; i <= BOOKING_HORIZON_DAYS; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const wd = d.getDay();
    if (CLOSED_WEEKDAYS.has(wd)) continue;
    if (!weekdays.has(wd)) continue;
    const dateStr = ymd(d);
    const locked = bookedByDate.get(dateStr) || new Set<string>();
    const times = TIME_SLOTS.filter((t) => !locked.has(t));
    if (times.length === 0) continue;
    out.push({
      date: dateStr,
      label: d.toLocaleDateString("en-AU", { weekday: "long", day: "2-digit", month: "short" }),
      weekday: d.toLocaleDateString("en-AU", { weekday: "long" }),
      times,
      recommended: sameZoneDates.has(dateStr),
    });
  }
  // Surface route-grouped (recommended) days first, otherwise keep date order.
  out.sort((a, b) => (a.recommended === b.recommended ? 0 : a.recommended ? -1 : 1));
  return out;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Is a chosen date/time actually offered for this area (defensive server check)? */
export function isSlotOffered(area: AreaInfo, date: string, time: string): boolean {
  if (!TIME_SLOTS.includes(time)) return false;
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const wd = d.getDay();
  if (CLOSED_WEEKDAYS.has(wd)) return false;
  if (!allowedWeekdays(area).has(wd)) return false;
  // Must be in the future within the horizon.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  return diffDays >= 1 && diffDays <= BOOKING_HORIZON_DAYS;
}
