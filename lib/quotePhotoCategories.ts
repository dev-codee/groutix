export const QUOTE_PHOTO_CATEGORIES = [
  "Inside shower",
  "Outside shower, bath and walls",
  "Shower screen height and wall tiles",
  "Tiled walls, height and tile size",
  "Mosaic tiles",
  "Cracked, loose, drummy or lifted tiles",
  "Other areas (bath, niche, kitchen or vanity)",
  "Balcony full view",
  "Balcony damage or leak",
] as const;

export function quotePhotoCategory(value: unknown): string | undefined {
  return QUOTE_PHOTO_CATEGORIES.find((category) => category === value);
}
