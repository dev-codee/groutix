export const QUOTE_PHOTO_CATEGORIES = [
  "Shower Area Inside",
  "Outside Shower, Bath & Walls",
  "Shower Screen Height with Wall Tiles",
  "Number of Walls with Height & Tile Size",
  "Mosaic Tiles",
  "Cracked / Loose / Drummy / Lifted Tiles",
  "Other Areas (Bathtub, Niche, Kitchen, Vanity etc.)",
  "Balcony Full View",
  "Balcony Full View Damaged / Leaking Area",
] as const;

// Cached forms may still submit the earlier labels.
const previousCategories = [
  "Inside shower",
  "Outside shower, bath and walls",
  "Shower screen height and wall tiles",
  "Tiled walls, height and tile size",
  "Mosaic tiles",
  "Cracked, loose, drummy or lifted tiles",
  "Other areas (bath, niche, kitchen or vanity)",
  "Balcony full view",
  "Balcony damage or leak",
];

export function quotePhotoCategory(value: unknown): string | undefined {
  const current = QUOTE_PHOTO_CATEGORIES.find((category) => category === value);
  if (current || typeof value !== "string") return current;
  return QUOTE_PHOTO_CATEGORIES[previousCategories.indexOf(value)];
}
