import { geocodeMapAddress } from "./mapGeocode";
import { validCoordinates } from "./customerTracking";
import type { VisitEta } from "./visitNotification";

export async function calculateVisitEta(lat: number | null, lng: number | null, address: string, locationIssue?: string): Promise<VisitEta> {
  const unavailable = (reason: string, nextStep: string): VisitEta => ({ text: null, minutes: null, source: "unavailable", reason, nextStep });
  if (!validCoordinates(lat, lng)) return unavailable(
    locationIssue === "denied" ? "Location permission was denied." : locationIssue === "timeout" ? "Your device timed out while finding its location." : locationIssue === "unsupported" ? "This browser does not support location sharing." : "Your current GPS location is unavailable.",
    "Allow location access in your browser and device settings, move somewhere with a GPS signal, then check the ETA again. Notifications can still be sent without an ETA.");
  if (!address.trim()) return unavailable("The customer has no property address.", "Add the full customer street address, suburb and postcode, then check the ETA again.");
  let destination;
  try { destination = await geocodeMapAddress(address); } catch { /* Report lookup failure without blocking messaging. */ }
  if (!destination || !validCoordinates(destination.lat, destination.lng)) return unavailable("The OpenStreetMap address lookup could not locate the property.", "Check the full street address, suburb and postcode. If correct, retry later; the address service may be unavailable.");
  const osrm = process.env.ROUTING_OSRM_URL;
  let routingUnavailable = false;
  if (osrm && !destination.approximate) {
    try {
      const base = osrm.replace(/\/$/, "");
      const url = new URL(`${base}/route/v1/driving/${lng},${lat};${destination.lng},${destination.lat}`);
      url.searchParams.set("overview", "false"); url.searchParams.set("steps", "false");
      const response = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "GroutixCRM/1.0 (+https://groutix.com)" } });
      const data = await response.json();
      const seconds = data.routes?.[0]?.duration;
      if (response.ok && data.code === "Ok" && Number.isFinite(seconds) && seconds > 0) {
        const minutes = Math.max(1, Math.ceil(seconds / 60));
        return { text: `${minutes} mins`, minutes, source: "osrm", reason: "Road-based estimate using OpenStreetMap routing. Live traffic is not included.", nextStep: "" };
      }
      routingUnavailable = true;
    } catch { routingUnavailable = true; }
  }
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const a = Math.sin(radians(destination.lat - lat!) / 2) ** 2 + Math.cos(radians(lat!)) * Math.cos(radians(destination.lat)) * Math.sin(radians(destination.lng - lng!) / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  if (!Number.isFinite(km) || km > 150) return unavailable("The property is too far away for a reliable distance-based arrival estimate.", "Verify the property address and your current GPS location. Ask an administrator to configure an OSRM routing server for road-based estimates.");
  // Deliberately broad: this is a distance-based estimate, never a traffic or road result.
  const low = Math.max(5, Math.floor(km * 1.3 / 40 * 60 / 5) * 5);
  const high = Math.max(low + 10, Math.ceil(km * 1.6 / 25 * 60 / 5) * 5);
  return { text: `${low}–${high} mins`, minutes: high, source: "distance_estimate", reason: `${routingUnavailable ? "Road routing is unavailable. " : ""}${destination.approximate ? "Only a suburb or street location was found. " : ""}Approximate travel time based on distance; road conditions and live traffic are not included.`, nextStep: "" };
}
