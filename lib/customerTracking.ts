export const TRACKING_TTL_MS = 4 * 60 * 60 * 1000;
export const TRACKING_FRESH_MS = 2 * 60 * 1000;

export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180;
}

export type CustomerTrackingView = {
  status: "en_route" | "arrived" | "ended" | "expired";
  location: { lat: number; lng: number; updatedAt: string } | null;
};
