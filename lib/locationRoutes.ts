// Location routes for the sitemap — generated 2026-10-31 from the suburb
// lists served by app/locations/<region>/[suburb]/page.tsx (melbourneSuburbs,
// geelongSuburbs, ballaratSuburbs, frankstonSuburbs, kilmoreSuburbs,
// lilydaleSuburbs). If a suburb is added or removed in one of those page
// files, update the matching list here too, or the sitemap will drift.
// The Step-2 route gating (allowlist) should reuse these same arrays so the
// sitemap and the served pages can never disagree.

export const MELBOURNE_SUBURB_SLUGS = [
  "carnegie", "carlton", "carlton-north", "collingwood", "docklands", "east-melbourne", "fitzroy",
  "fitzroy-north", "footscray", "melbourne-cbd", "north-melbourne", "parkville", "richmond", "south-melbourne",
  "south-yarra", "southbank", "west-melbourne", "abbotsford", "camberwell", "canterbury", "caulfield",
  "cremorne", "glen-iris", "hawthorn", "hawthorn-east", "kew", "kew-east",
  "malvern", "malvern-east", "toorak", "windsor", "brunswick", "brunswick-east",
  "brunswick-west", "coburg", "coburg-north", "northcote", "princes-hill", "thornbury",
  "clifton-hill", "albert-park", "balaclava", "elwood", "middle-park", "port-melbourne",
  "prahran", "st-kilda", "st-kilda-east", "st-kilda-west", "broadmeadows", "bundoora",
  "campbellfield", "coolaroo", "craigieburn", "dallas", "epping", "fawkner",
  "glenroy", "greenvale", "lalor", "macleod", "meadow-heights", "mill-park",
  "reservoir", "south-morang", "thomastown", "wollert", "balwyn", "balwyn-north",
  "box-hill", "box-hill-north", "bulleen", "doncaster", "doncaster-east", "donvale",
  "eltham", "eltham-north", "forest-hill", "greensborough", "heidelberg", "lower-plenty",
  "montmorency", "nunawading", "research", "rosanna", "templestowe", "templestowe-lower",
  "warrandyte", "airport-west", "ascot-vale", "avondale-heights", "essendon", "essendon-north",
  "essendon-west", "flemington", "gladstone-park", "keilor", "keilor-downs", "keilor-east",
  "maribyrnong", "moonee-ponds", "niddrie", "oak-park", "strathmore", "tullamarine",
  "bentleigh", "bentleigh-east", "brighton", "brighton-east", "cheltenham", "hampton",
  "highett", "mckinnon", "mentone", "moorabbin", "ormond", "sandringham",
  "berwick", "carrum-downs", "chelsea", "clayton", "cranbourne", "dandenong",
  "frankston", "glen-waverley", "hallam", "hampton-park", "keysborough", "mount-waverley",
  "mulgrave", "narre-warren", "noble-park", "oakleigh", "pakenham", "patterson-lakes",
  "seaford", "springvale", "wheelers-hill", "altona", "altona-meadows", "altona-north",
  "brooklyn", "hobsons-bay", "hoppers-crossing", "laverton", "point-cook", "truganina", "werribee",
  "williams-landing", "williamstown", "williamstown-north", "bayswater", "boronia", "croydon",
  "croydon-hills", "croydon-north", "croydon-south", "ferntree-gully", "kilsyth", "knox",
  "lilydale", "mooroolbark", "mount-evelyn", "ringwood", "ringwood-east", "ringwood-north",
  "vermont", "vermont-south", "wantirna", "wantirna-south", "caroline-springs", "deer-park",
  "derrimut", "melton", "melton-south", "plumpton", "st-albans", "sunbury", "sydenham",
  "tarneit", "wyndham-vale",
] as const;
export const GEELONG_SUBURB_SLUGS = [
  "geelong", "geelong-west", "south-geelong", "newtown", "drumcondra", "manifold-heights",
  "herne-hill", "belmont", "east-geelong", "grovedale", "highton", "marshall",
  "wandana-heights", "waurn-ponds", "fyansford", "bell-park", "bell-post-hill", "corio",
  "norlane", "north-geelong", "north-shore", "anakie", "lara", "lovely-banks",
  "wallington", "breakwater", "hamlyn-heights", "newcomb", "st-albans-park", "thomson",
  "whittington", "aireys-inlet", "anglesea", "fairhaven", "jan-juc", "lorne",
  "torquay", "barwon-heads", "clifton-springs", "drysdale", "indented-head", "leopold",
  "ocean-grove", "point-lonsdale", "portarlington", "queenscliff", "st-leonards",
] as const;
export const BALLARAT_SUBURB_SLUGS = [
  "alfredton", "ballarat-central", "ballarat-east", "ballarat-north", "black-hill", "buninyong",
  "delacombe", "eureka", "mount-clear", "mount-helen", "redan", "sebastopol",
  "wendouree", "creswick", "daylesford", "newlyn", "clarendon", "elaine",
] as const;
export const FRANKSTON_SUBURB_SLUGS = [
  "frankston-central", "frankston-north", "frankston-south", "karingal", "langwarrin", "seaford",
  "beaconsfield", "berwick", "clyde", "cranbourne", "harkaway", "officer",
] as const;
export const KILMORE_SUBURB_SLUGS = [
  "bylands", "hidden-valley", "kilmore-central", "kilmore-east", "wandong", "willowmavin",
  "eden-park", "wallan", "whittlesea", "yan-yean", "hesket", "lancefield",
  "romsey", "tylden", "woodend",
] as const;
export const LILYDALE_SUBURB_SLUGS = [
  "chirnside-park", "coldstream", "lilydale-central", "mooroolbark", "mount-evelyn", "emerald",
  "macclesfield", "monbulk", "silvan", "doreen", "hurstbridge", "kangaroo-ground",
  "nutfield", "watsons-creek",
] as const;

// Every location URL on the site: the /locations index itself is already in
// STATIC_ROUTES; this list adds each region hub plus every suburb page.
export const LOCATION_ROUTES: string[] = [
  "/locations/melbourne",
  ...MELBOURNE_SUBURB_SLUGS.map((s) => `/locations/melbourne/${s}`),
  "/locations/geelong",
  ...GEELONG_SUBURB_SLUGS.map((s) => `/locations/geelong/${s}`),
  "/locations/ballarat",
  ...BALLARAT_SUBURB_SLUGS.map((s) => `/locations/ballarat/${s}`),
  "/locations/frankston",
  ...FRANKSTON_SUBURB_SLUGS.map((s) => `/locations/frankston/${s}`),
  "/locations/kilmore",
  ...KILMORE_SUBURB_SLUGS.map((s) => `/locations/kilmore/${s}`),
  "/locations/lilydale",
  ...LILYDALE_SUBURB_SLUGS.map((s) => `/locations/lilydale/${s}`),
];
