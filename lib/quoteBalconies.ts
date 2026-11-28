export const QUOTE_TILE_SIZES = ["Small", "Medium", "Large", "Extra large"];

export type QuoteBalcony = {
  leakage: string;
  area: string;
  tileSizes: string[];
};

export function parseAdditionalBalconies(raw: string): QuoteBalcony[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Expected a list of balconies");
  return parsed.map((balcony) => {
    if (!balcony || typeof balcony !== "object") throw new Error("Invalid balcony details");
    const { leakage, area, tileSizes } = balcony;
    const squareMetres = typeof area === "string" ? Number(area) : NaN;
    if ((leakage !== "Yes" && leakage !== "No") || !Number.isFinite(squareMetres) || squareMetres <= 0
      || !Array.isArray(tileSizes) || !tileSizes.every((size) => QUOTE_TILE_SIZES.includes(size))) {
      throw new Error("Invalid balcony details");
    }
    return { leakage, area: area.trim(), tileSizes: [...new Set<string>(tileSizes)] };
  });
}
