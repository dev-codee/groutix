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

// Appointment start times offered each day.
export const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];

// How far ahead we let a customer book (days).
export const BOOKING_HORIZON_DAYS = 21;

export type OuterZone =
  | "mon_lower1"
  | "tue_lower2"
  | "wed_lower3"
  | "thu_bundoora"
  | "fri_north"
  | "sat_melton"
  | "sun_stalbans";

export type Zone = OuterZone | "inner" | "flexible";

export interface AreaInfo {
  suburb: string | null;
  zone: Zone;
  distanceKm: number | null;
  inner: boolean;
  label: string;
}

export const ZONE_LABEL: Record<Zone, string> = {
  inner: "Inner Melbourne (Within 15 km — Monday to Sunday Every Day)",
  mon_lower1: "Lower Area 1 — Brunswick, CBD, St Kilda, Brighton (Mondays)",
  tue_lower2: "Lower Area 2 — Inner East, Hawthorn, Kew, Doncaster (Tuesdays)",
  wed_lower3: "Lower Area 3 — Ringwood, Croydon, Lilydale, Mt Evelyn (Wednesdays)",
  thu_bundoora: "Bundoora & North-East Corridor (Thursdays)",
  fri_north: "Upper North & Craigieburn Corridor (Fridays)",
  sat_melton: "Melton & West Corridor (Saturdays)",
  sun_stalbans: "St Albans & West-Central Corridor (Sundays)",
  flexible: "Greater Melbourne (All Days Available)",
};

const ZONE_WEEKDAY: Record<OuterZone, number> = {
  mon_lower1: 1, // Mon
  tue_lower2: 2, // Tue
  wed_lower3: 3, // Wed
  thu_bundoora: 4, // Thu
  fri_north: 5, // Fri
  sat_melton: 6, // Sat
  sun_stalbans: 0, // Sun
};

// Melbourne suburbs mapped to their centroid coordinates and assigned outer zone.
const SUBURBS: { name: string; lat: number; lng: number; outerZone: OuterZone }[] = [
  // ── Inner / North-West (15km circle + close-in) ──
  { name: "tullamarine", lat: -37.7008, lng: 144.8869, outerZone: "fri_north" },
  { name: "melbourne airport", lat: -37.6690, lng: 144.8410, outerZone: "fri_north" },
  { name: "gladstone park", lat: -37.6903, lng: 144.8886, outerZone: "fri_north" },
  { name: "westmeadows", lat: -37.6740, lng: 144.8860, outerZone: "fri_north" },
  { name: "attwood", lat: -37.6700, lng: 144.8770, outerZone: "fri_north" },
  { name: "gowanbrae", lat: -37.7120, lng: 144.8970, outerZone: "mon_lower1" },
  { name: "airport west", lat: -37.7211, lng: 144.8836, outerZone: "mon_lower1" },
  { name: "strathmore heights", lat: -37.7160, lng: 144.8890, outerZone: "mon_lower1" },
  { name: "essendon fields", lat: -37.7290, lng: 144.9010, outerZone: "mon_lower1" },
  { name: "keilor park", lat: -37.7140, lng: 144.8580, outerZone: "sat_melton" },
  { name: "keilor", lat: -37.7186, lng: 144.8339, outerZone: "sat_melton" },
  { name: "keilor east", lat: -37.7360, lng: 144.8620, outerZone: "sun_stalbans" },
  { name: "niddrie", lat: -37.7353, lng: 144.8944, outerZone: "mon_lower1" },
  { name: "essendon north", lat: -37.7400, lng: 144.9070, outerZone: "mon_lower1" },
  { name: "essendon west", lat: -37.7480, lng: 144.8870, outerZone: "mon_lower1" },
  { name: "essendon", lat: -37.7529, lng: 144.9075, outerZone: "mon_lower1" },
  { name: "strathmore", lat: -37.7392, lng: 144.9203, outerZone: "mon_lower1" },
  { name: "glenbervie", lat: -37.7430, lng: 144.9230, outerZone: "mon_lower1" },
  { name: "oak park", lat: -37.7180, lng: 144.9220, outerZone: "mon_lower1" },
  { name: "glenroy", lat: -37.7047, lng: 144.9186, outerZone: "mon_lower1" },
  { name: "jacana", lat: -37.6920, lng: 144.9190, outerZone: "fri_north" },
  { name: "broadmeadows", lat: -37.6803, lng: 144.9188, outerZone: "fri_north" },
  { name: "dallas", lat: -37.6760, lng: 144.9310, outerZone: "fri_north" },
  { name: "campbellfield", lat: -37.6710, lng: 144.9540, outerZone: "fri_north" },
  { name: "coolaroo", lat: -37.6603, lng: 144.9236, outerZone: "fri_north" },
  { name: "meadow heights", lat: -37.6470, lng: 144.9160, outerZone: "fri_north" },
  { name: "greenvale", lat: -37.6430, lng: 144.8810, outerZone: "fri_north" },
  { name: "somerton", lat: -37.6400, lng: 144.9500, outerZone: "fri_north" },
  { name: "roxburgh park", lat: -37.6389, lng: 144.9236, outerZone: "fri_north" },
  { name: "fawkner", lat: -37.7070, lng: 144.9620, outerZone: "mon_lower1" },
  { name: "hadfield", lat: -37.7130, lng: 144.9390, outerZone: "mon_lower1" },
  { name: "pascoe vale south", lat: -37.7420, lng: 144.9390, outerZone: "mon_lower1" },
  { name: "pascoe vale", lat: -37.7268, lng: 144.9384, outerZone: "mon_lower1" },
  { name: "coburg north", lat: -37.7270, lng: 144.9660, outerZone: "mon_lower1" },
  { name: "coburg", lat: -37.7439, lng: 144.9631, outerZone: "mon_lower1" },
  { name: "brunswick west", lat: -37.7610, lng: 144.9450, outerZone: "mon_lower1" },
  { name: "brunswick east", lat: -37.7660, lng: 144.9780, outerZone: "mon_lower1" },
  { name: "brunswick", lat: -37.7667, lng: 144.9603, outerZone: "mon_lower1" },
  { name: "aberfeldie", lat: -37.7600, lng: 144.8960, outerZone: "mon_lower1" },
  { name: "moonee ponds", lat: -37.7647, lng: 144.9203, outerZone: "mon_lower1" },
  { name: "ascot vale", lat: -37.7760, lng: 144.9160, outerZone: "mon_lower1" },
  { name: "travancore", lat: -37.7810, lng: 144.9360, outerZone: "mon_lower1" },
  { name: "flemington", lat: -37.7880, lng: 144.9280, outerZone: "mon_lower1" },
  { name: "kensington", lat: -37.7940, lng: 144.9290, outerZone: "mon_lower1" },
  { name: "maribyrnong", lat: -37.7770, lng: 144.8920, outerZone: "sun_stalbans" },
  { name: "avondale heights", lat: -37.7610, lng: 144.8620, outerZone: "sun_stalbans" },
  { name: "kealba", lat: -37.7370, lng: 144.8250, outerZone: "sun_stalbans" },
  { name: "keilor downs", lat: -37.7300, lng: 144.8080, outerZone: "sun_stalbans" },
  { name: "st albans north", lat: -37.7350, lng: 144.7950, outerZone: "sun_stalbans" },
  { name: "st albans", lat: -37.7447, lng: 144.8028, outerZone: "sun_stalbans" },
  { name: "albion", lat: -37.7750, lng: 144.8190, outerZone: "sun_stalbans" },
  { name: "sunshine north", lat: -37.7700, lng: 144.8370, outerZone: "sun_stalbans" },
  { name: "sunshine west", lat: -37.8020, lng: 144.8210, outerZone: "sun_stalbans" },
  { name: "sunshine", lat: -37.7883, lng: 144.8331, outerZone: "sun_stalbans" },
  { name: "braybrook", lat: -37.7880, lng: 144.8610, outerZone: "sun_stalbans" },
  { name: "maidstone", lat: -37.7810, lng: 144.8760, outerZone: "sun_stalbans" },
  { name: "footscray", lat: -37.8003, lng: 144.9003, outerZone: "sun_stalbans" },
  { name: "west footscray", lat: -37.8050, lng: 144.8790, outerZone: "sun_stalbans" },

  // ── Monday: Lower Area 1 (Brunswick → City → St Kilda → Brighton) ──
  { name: "northcote", lat: -37.7710, lng: 144.9980, outerZone: "mon_lower1" },
  { name: "carlton north", lat: -37.7860, lng: 144.9720, outerZone: "mon_lower1" },
  { name: "carlton", lat: -37.8000, lng: 144.9670, outerZone: "mon_lower1" },
  { name: "parkville", lat: -37.7860, lng: 144.9510, outerZone: "mon_lower1" },
  { name: "fitzroy north", lat: -37.7830, lng: 144.9820, outerZone: "mon_lower1" },
  { name: "fitzroy", lat: -37.8010, lng: 144.9780, outerZone: "mon_lower1" },
  { name: "collingwood", lat: -37.8030, lng: 144.9880, outerZone: "mon_lower1" },
  { name: "north melbourne", lat: -37.7980, lng: 144.9450, outerZone: "mon_lower1" },
  { name: "west melbourne", lat: -37.8080, lng: 144.9420, outerZone: "mon_lower1" },
  { name: "southbank", lat: -37.8260, lng: 144.9640, outerZone: "mon_lower1" },
  { name: "south melbourne", lat: -37.8330, lng: 144.9570, outerZone: "mon_lower1" },
  { name: "port melbourne", lat: -37.8380, lng: 144.9330, outerZone: "mon_lower1" },
  { name: "albert park", lat: -37.8440, lng: 144.9550, outerZone: "mon_lower1" },
  { name: "middle park", lat: -37.8500, lng: 144.9610, outerZone: "mon_lower1" },
  { name: "st kilda east", lat: -37.8670, lng: 145.0030, outerZone: "mon_lower1" },
  { name: "st kilda", lat: -37.8678, lng: 144.9808, outerZone: "mon_lower1" },
  { name: "elwood", lat: -37.8820, lng: 144.9870, outerZone: "mon_lower1" },
  { name: "balaclava", lat: -37.8710, lng: 144.9960, outerZone: "mon_lower1" },
  { name: "ripponlea", lat: -37.8770, lng: 144.9970, outerZone: "mon_lower1" },
  { name: "elsternwick", lat: -37.8850, lng: 145.0040, outerZone: "mon_lower1" },
  { name: "brighton east", lat: -37.9100, lng: 145.0160, outerZone: "mon_lower1" },
  { name: "brighton", lat: -37.9061, lng: 144.9922, outerZone: "mon_lower1" },
  { name: "gardenvale", lat: -37.8960, lng: 145.0060, outerZone: "mon_lower1" },
  { name: "hampton", lat: -37.9360, lng: 145.0040, outerZone: "mon_lower1" },

  // ── Tuesday: Lower Area 2 (Melbourne → Inner East) ──
  { name: "cremorne", lat: -37.8300, lng: 144.9950, outerZone: "tue_lower2" },
  { name: "richmond", lat: -37.8233, lng: 144.9981, outerZone: "tue_lower2" },
  { name: "hawthorn east", lat: -37.8280, lng: 145.0530, outerZone: "tue_lower2" },
  { name: "hawthorn", lat: -37.8219, lng: 145.0347, outerZone: "tue_lower2" },
  { name: "kew east", lat: -37.7990, lng: 145.0520, outerZone: "tue_lower2" },
  { name: "kew", lat: -37.8060, lng: 145.0320, outerZone: "tue_lower2" },
  { name: "abbotsford", lat: -37.8080, lng: 144.9990, outerZone: "tue_lower2" },
  { name: "fairfield", lat: -37.7780, lng: 145.0160, outerZone: "tue_lower2" },
  { name: "alphington", lat: -37.7790, lng: 145.0300, outerZone: "tue_lower2" },
  { name: "ivanhoe east", lat: -37.7730, lng: 145.0600, outerZone: "tue_lower2" },
  { name: "ivanhoe", lat: -37.7700, lng: 145.0420, outerZone: "tue_lower2" },
  { name: "eaglemont", lat: -37.7610, lng: 145.0620, outerZone: "tue_lower2" },
  { name: "heidelberg heights", lat: -37.7470, lng: 145.0510, outerZone: "tue_lower2" },
  { name: "heidelberg west", lat: -37.7390, lng: 145.0430, outerZone: "tue_lower2" },
  { name: "heidelberg", lat: -37.7550, lng: 145.0610, outerZone: "tue_lower2" },
  { name: "rosanna", lat: -37.7420, lng: 145.0690, outerZone: "tue_lower2" },
  { name: "viewbank", lat: -37.7410, lng: 145.0930, outerZone: "tue_lower2" },
  { name: "bulleen", lat: -37.7740, lng: 145.0940, outerZone: "tue_lower2" },
  { name: "balwyn north", lat: -37.7940, lng: 145.0860, outerZone: "tue_lower2" },
  { name: "balwyn", lat: -37.8110, lng: 145.0820, outerZone: "tue_lower2" },
  { name: "canterbury", lat: -37.8240, lng: 145.0810, outerZone: "tue_lower2" },
  { name: "surrey hills", lat: -37.8250, lng: 145.1010, outerZone: "tue_lower2" },
  { name: "camberwell", lat: -37.8261, lng: 145.0586, outerZone: "tue_lower2" },
  { name: "glen iris", lat: -37.8570, lng: 145.0600, outerZone: "tue_lower2" },
  { name: "burwood east", lat: -37.8520, lng: 145.1470, outerZone: "tue_lower2" },
  { name: "burwood", lat: -37.8500, lng: 145.1050, outerZone: "tue_lower2" },
  { name: "box hill north", lat: -37.8060, lng: 145.1310, outerZone: "tue_lower2" },
  { name: "box hill south", lat: -37.8340, lng: 145.1260, outerZone: "tue_lower2" },
  { name: "box hill", lat: -37.8194, lng: 145.1219, outerZone: "tue_lower2" },
  { name: "blackburn north", lat: -37.8060, lng: 145.1530, outerZone: "tue_lower2" },
  { name: "blackburn south", lat: -37.8390, lng: 145.1480, outerZone: "tue_lower2" },
  { name: "blackburn", lat: -37.8200, lng: 145.1520, outerZone: "tue_lower2" },
  { name: "doncaster east", lat: -37.7830, lng: 145.1530, outerZone: "tue_lower2" },
  { name: "doncaster", lat: -37.7869, lng: 145.1247, outerZone: "tue_lower2" },
  { name: "donvale", lat: -37.7820, lng: 145.1840, outerZone: "tue_lower2" },
  { name: "templestowe lower", lat: -37.7660, lng: 145.1240, outerZone: "tue_lower2" },
  { name: "templestowe", lat: -37.7530, lng: 145.1310, outerZone: "tue_lower2" },

  // ── Wednesday: Lower Area 3 (Ringwood → Croydon → Lilydale → Mt Evelyn) ──
  { name: "mitcham", lat: -37.8170, lng: 145.1950, outerZone: "wed_lower3" },
  { name: "nunawading", lat: -37.8190, lng: 145.1760, outerZone: "wed_lower3" },
  { name: "forest hill", lat: -37.8400, lng: 145.1670, outerZone: "wed_lower3" },
  { name: "vermont south", lat: -37.8540, lng: 145.1910, outerZone: "wed_lower3" },
  { name: "vermont", lat: -37.8360, lng: 145.1950, outerZone: "wed_lower3" },
  { name: "mount waverley", lat: -37.8740, lng: 145.1300, outerZone: "wed_lower3" },
  { name: "glen waverley", lat: -37.8783, lng: 145.1642, outerZone: "wed_lower3" },
  { name: "wheelers hill", lat: -37.9010, lng: 145.1890, outerZone: "wed_lower3" },
  { name: "mulgrave", lat: -37.9250, lng: 145.1740, outerZone: "wed_lower3" },
  { name: "wantirna south", lat: -37.8730, lng: 145.2290, outerZone: "wed_lower3" },
  { name: "wantirna", lat: -37.8520, lng: 145.2280, outerZone: "wed_lower3" },
  { name: "ringwood east", lat: -37.8140, lng: 145.2570, outerZone: "wed_lower3" },
  { name: "ringwood north", lat: -37.7970, lng: 145.2360, outerZone: "wed_lower3" },
  { name: "ringwood south", lat: -37.8280, lng: 145.2310, outerZone: "wed_lower3" },
  { name: "ringwood", lat: -37.8147, lng: 145.2294, outerZone: "wed_lower3" },
  { name: "heathmont", lat: -37.8320, lng: 145.2440, outerZone: "wed_lower3" },
  { name: "bayswater north", lat: -37.8320, lng: 145.2850, outerZone: "wed_lower3" },
  { name: "bayswater", lat: -37.8480, lng: 145.2670, outerZone: "wed_lower3" },
  { name: "boronia", lat: -37.8610, lng: 145.2870, outerZone: "wed_lower3" },
  { name: "kilsyth south", lat: -37.8270, lng: 145.3180, outerZone: "wed_lower3" },
  { name: "kilsyth", lat: -37.8080, lng: 145.3190, outerZone: "wed_lower3" },
  { name: "croydon hills", lat: -37.7780, lng: 145.2680, outerZone: "wed_lower3" },
  { name: "croydon north", lat: -37.7720, lng: 145.2870, outerZone: "wed_lower3" },
  { name: "croydon south", lat: -37.8110, lng: 145.2830, outerZone: "wed_lower3" },
  { name: "croydon", lat: -37.7940, lng: 145.2810, outerZone: "wed_lower3" },
  { name: "mooroolbark", lat: -37.7850, lng: 145.3120, outerZone: "wed_lower3" },
  { name: "chirnside park", lat: -37.7550, lng: 145.3190, outerZone: "wed_lower3" },
  { name: "lilydale", lat: -37.7561, lng: 145.3492, outerZone: "wed_lower3" },
  { name: "mount evelyn", lat: -37.7830, lng: 145.3850, outerZone: "wed_lower3" },

  // ── Thursday: Bundoora / North-East Area ──
  { name: "reservoir", lat: -37.7169, lng: 145.0064, outerZone: "thu_bundoora" },
  { name: "preston", lat: -37.7411, lng: 144.9992, outerZone: "thu_bundoora" },
  { name: "thornbury", lat: -37.7560, lng: 144.9980, outerZone: "thu_bundoora" },
  { name: "macleod", lat: -37.7280, lng: 145.0680, outerZone: "thu_bundoora" },
  { name: "watsonia north", lat: -37.6970, lng: 145.0850, outerZone: "thu_bundoora" },
  { name: "watsonia", lat: -37.7120, lng: 145.0830, outerZone: "thu_bundoora" },
  { name: "yallambie", lat: -37.7260, lng: 145.1050, outerZone: "thu_bundoora" },
  { name: "kingsbury", lat: -37.7170, lng: 145.0450, outerZone: "thu_bundoora" },
  { name: "bundoora", lat: -37.7003, lng: 145.0669, outerZone: "thu_bundoora" },
  { name: "greensborough", lat: -37.7042, lng: 145.1017, outerZone: "thu_bundoora" },
  { name: "briar hill", lat: -37.7100, lng: 145.1250, outerZone: "thu_bundoora" },
  { name: "montmorency", lat: -37.7190, lng: 145.1270, outerZone: "thu_bundoora" },
  { name: "eltham north", lat: -37.6950, lng: 145.1520, outerZone: "thu_bundoora" },
  { name: "eltham", lat: -37.7139, lng: 145.1478, outerZone: "thu_bundoora" },
  { name: "lower plenty", lat: -37.7390, lng: 145.1280, outerZone: "thu_bundoora" },
  { name: "diamond creek", lat: -37.6740, lng: 145.1570, outerZone: "thu_bundoora" },
  { name: "lalor", lat: -37.6660, lng: 145.0180, outerZone: "thu_bundoora" },
  { name: "thomastown", lat: -37.6830, lng: 145.0160, outerZone: "thu_bundoora" },
  { name: "mill park", lat: -37.6670, lng: 145.0680, outerZone: "thu_bundoora" },
  { name: "south morang", lat: -37.6440, lng: 145.0740, outerZone: "thu_bundoora" },
  { name: "mernda", lat: -37.6040, lng: 145.1030, outerZone: "thu_bundoora" },
  { name: "doreen", lat: -37.5930, lng: 145.1320, outerZone: "thu_bundoora" },

  // ── Friday: Upper / North Area (Craigieburn Corridor) ──
  { name: "craigieburn north", lat: -37.5750, lng: 144.9420, outerZone: "fri_north" },
  { name: "craigieburn", lat: -37.6008, lng: 144.9403, outerZone: "fri_north" },
  { name: "mickleham", lat: -37.5350, lng: 144.9120, outerZone: "fri_north" },
  { name: "donnybrook", lat: -37.5340, lng: 144.9750, outerZone: "fri_north" },
  { name: "kalkallo", lat: -37.5250, lng: 144.9480, outerZone: "fri_north" },
  { name: "beveridge", lat: -37.4760, lng: 144.9920, outerZone: "fri_north" },
  { name: "bulla", lat: -37.6330, lng: 144.8050, outerZone: "fri_north" },
  { name: "oaklands junction", lat: -37.6070, lng: 144.8620, outerZone: "fri_north" },
  { name: "yuroke", lat: -37.5990, lng: 144.8960, outerZone: "fri_north" },
  { name: "wollert", lat: -37.5980, lng: 145.0340, outerZone: "fri_north" },
  { name: "epping north", lat: -37.6180, lng: 145.0250, outerZone: "fri_north" },
  { name: "epping", lat: -37.6497, lng: 145.0203, outerZone: "fri_north" },

  // ── Saturday: Melton / West Area (Melton Corridor) ──
  { name: "sunbury", lat: -37.5811, lng: 144.7278, outerZone: "sat_melton" },
  { name: "diggers rest", lat: -37.6280, lng: 144.7210, outerZone: "sat_melton" },
  { name: "toolern vale", lat: -37.6130, lng: 144.5710, outerZone: "sat_melton" },
  { name: "melton west", lat: -37.6860, lng: 144.5580, outerZone: "sat_melton" },
  { name: "melton south", lat: -37.7080, lng: 144.5790, outerZone: "sat_melton" },
  { name: "melton", lat: -37.6839, lng: 144.5861, outerZone: "sat_melton" },
  { name: "kurunjang", lat: -37.6630, lng: 144.5890, outerZone: "sat_melton" },
  { name: "brookfield", lat: -37.6980, lng: 144.5480, outerZone: "sat_melton" },
  { name: "harkness", lat: -37.6670, lng: 144.5610, outerZone: "sat_melton" },
  { name: "weir views", lat: -37.7120, lng: 144.5690, outerZone: "sat_melton" },
  { name: "cobblebank", lat: -37.7190, lng: 144.6060, outerZone: "sat_melton" },
  { name: "strathtulloh", lat: -37.7280, lng: 144.6020, outerZone: "sat_melton" },
  { name: "thornhill park", lat: -37.7190, lng: 144.6360, outerZone: "sat_melton" },
  { name: "rockbank", lat: -37.7300, lng: 144.6540, outerZone: "sat_melton" },
  { name: "aintree", lat: -37.7210, lng: 144.6860, outerZone: "sat_melton" },
  { name: "bonnie brook", lat: -37.7100, lng: 144.7120, outerZone: "sat_melton" },
  { name: "fraser rise", lat: -37.7040, lng: 144.7430, outerZone: "sat_melton" },
  { name: "deanside", lat: -37.7290, lng: 144.7260, outerZone: "sat_melton" },
  { name: "burnside heights", lat: -37.7470, lng: 144.7570, outerZone: "sat_melton" },
  { name: "burnside", lat: -37.7610, lng: 144.7640, outerZone: "sat_melton" },
  { name: "hillside", lat: -37.7020, lng: 144.7620, outerZone: "sat_melton" },
  { name: "taylors hill", lat: -37.7130, lng: 144.7770, outerZone: "sat_melton" },
  { name: "plumpton", lat: -37.7130, lng: 144.7260, outerZone: "sat_melton" },
  { name: "grangefields", lat: -37.7250, lng: 144.6950, outerZone: "sat_melton" },
  { name: "ravenhall", lat: -37.7710, lng: 144.7580, outerZone: "sat_melton" },
  { name: "caroline springs", lat: -37.7340, lng: 144.7410, outerZone: "sat_melton" },
  { name: "mount cottrell", lat: -37.8010, lng: 144.6180, outerZone: "sat_melton" },
  { name: "eynesbury", lat: -37.7920, lng: 144.5640, outerZone: "sat_melton" },
  { name: "exford", lat: -37.7420, lng: 144.5580, outerZone: "sat_melton" },
  { name: "parwan", lat: -37.7060, lng: 144.4710, outerZone: "sat_melton" },

  // ── Sunday: St Albans / West-Central Area ──
  { name: "keilor lodge", lat: -37.7180, lng: 144.8080, outerZone: "sun_stalbans" },
  { name: "delahey", lat: -37.7260, lng: 144.7890, outerZone: "sun_stalbans" },
  { name: "kings park", lat: -37.7490, lng: 144.7760, outerZone: "sun_stalbans" },
  { name: "deer park", lat: -37.7680, lng: 144.7810, outerZone: "sun_stalbans" },
  { name: "derrimut", lat: -37.7980, lng: 144.7860, outerZone: "sun_stalbans" },
  { name: "cairnlea", lat: -37.7670, lng: 144.8090, outerZone: "sun_stalbans" },
  { name: "albanvale", lat: -37.7550, lng: 144.7820, outerZone: "sun_stalbans" },
  { name: "ardeer", lat: -37.7810, lng: 144.8090, outerZone: "sun_stalbans" },
  { name: "kingsville", lat: -37.8120, lng: 144.8810, outerZone: "sun_stalbans" },
  { name: "seddon", lat: -37.8070, lng: 144.8930, outerZone: "sun_stalbans" },
  { name: "brooklyn", lat: -37.8180, lng: 144.8450, outerZone: "sun_stalbans" },
  { name: "tottenham", lat: -37.8040, lng: 144.8560, outerZone: "sun_stalbans" },
  { name: "yarraville", lat: -37.8160, lng: 144.8910, outerZone: "sun_stalbans" },
  { name: "laverton north", lat: -37.8340, lng: 144.7960, outerZone: "sun_stalbans" },
  { name: "laverton", lat: -37.8620, lng: 144.7720, outerZone: "sun_stalbans" },
  { name: "altona north", lat: -37.8420, lng: 144.8480, outerZone: "sun_stalbans" },
  { name: "altona meadows", lat: -37.8780, lng: 144.7880, outerZone: "sun_stalbans" },
  { name: "altona", lat: -37.8686, lng: 144.8306, outerZone: "sun_stalbans" },
  { name: "seabrook", lat: -37.8860, lng: 144.7570, outerZone: "sun_stalbans" },
  { name: "truganina", lat: -37.8380, lng: 144.7210, outerZone: "sun_stalbans" },
  { name: "hoppers crossing", lat: -37.8840, lng: 144.7000, outerZone: "sun_stalbans" },
  { name: "tarneit", lat: -37.8330, lng: 144.6600, outerZone: "sun_stalbans" },
  { name: "manor lakes", lat: -37.9060, lng: 144.5950, outerZone: "sun_stalbans" },
  { name: "werribee", lat: -37.9006, lng: 144.6614, outerZone: "sun_stalbans" },
  { name: "point cook", lat: -37.9142, lng: 144.7514, outerZone: "sun_stalbans" },
  { name: "williamstown", lat: -37.8656, lng: 144.8969, outerZone: "sun_stalbans" },
  { name: "melbourne", lat: -37.8136, lng: 144.9631, outerZone: "mon_lower1" },
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
    return { suburb: null, zone: "flexible", distanceKm: null, inner: false, label: ZONE_LABEL.flexible };
  }

  // Find longest matching suburb name to avoid substring collisions
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
  // Tullamarine 15 km inner circle rule: Available Every Day if in 15km list & within radius
  const isInner = INNER_15KM_SUBURBS.has(match.name) && dist <= RADIUS_KM;
  if (isInner) {
    return {
      suburb: match.name,
      zone: "inner",
      distanceKm: dist,
      inner: true,
      label: ZONE_LABEL.inner,
    };
  }

  // Outside 15 km or outer corridor: Assigned to its designated regional day
  const zone = match.outerZone;
  return {
    suburb: match.name,
    zone,
    distanceKm: dist,
    inner: false,
    label: ZONE_LABEL[zone],
  };
}

/** Weekdays (0=Sun, 1=Mon … 6=Sat) a given area may be booked on. */
export function allowedWeekdays(area: AreaInfo): Set<number> {
  if (area.inner || area.zone === "inner" || area.zone === "flexible") {
    return new Set([1, 2, 3, 4, 5, 6, 0]); // Monday through Sunday (All 7 days)
  }
  const wd = ZONE_WEEKDAY[area.zone as OuterZone];
  return new Set(wd !== undefined ? [wd] : [1, 2, 3, 4, 5, 6, 0]);
}

/** Human-friendly availability text for customer emails and SMS. */
export function getAvailableDaysSummary(area: AreaInfo): string {
  switch (area.zone) {
    case "inner":
      return "Monday to Sunday (Available Every Day for Inner Melbourne / 15 km Tullamarine)";
    case "mon_lower1":
      return "Mondays (Lower Area 1 — Brunswick → Melbourne → St Kilda → Brighton)";
    case "tue_lower2":
      return "Tuesdays (Lower Area 2 — Inner East / Hawthorn / Kew / Doncaster)";
    case "wed_lower3":
      return "Wednesdays (Lower Area 3 — Ringwood → Croydon → Lilydale → Mount Evelyn)";
    case "thu_bundoora":
      return "Thursdays (Bundoora & North-East Corridor)";
    case "fri_north":
      return "Fridays (Upper North & Craigieburn Corridor)";
    case "sat_melton":
      return "Saturdays (Melton & West Corridor)";
    case "sun_stalbans":
      return "Sundays (St Albans & West-Central Corridor)";
    default:
      return "Monday to Sunday (All 7 Days Available)";
  }
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
  if (!allowedWeekdays(area).has(wd)) return false;

  // Must be in the future within the horizon.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  return diffDays >= 1 && diffDays <= BOOKING_HORIZON_DAYS;
}
