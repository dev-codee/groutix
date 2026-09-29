// Route-aware slot scoring for staff booking. Given the stops already on a day's
// (shared) calendar and a new customer's location, work out how well each free
// slot fits the route:
//
//   detour = d(prev, new) + d(new, next) − d(prev, next)
//
// i.e. the extra driving the insertion adds, where prev/next are the stops either
// side of the slot (base/HQ at the start and end of the day). This is the
// standard "cheapest insertion" measure — a slot next to a stop in the same area
// costs almost nothing, even if the customer is far from base.
//
// Distances use the suburb catalogue in lib/scheduling.ts (straight-line between
// suburb centroids, same model as lib/dispatch.ts) so scoring is instant and free;
// the planner map shows real Google driving routes for the chosen day.

import { SUBURBS, TULLAMARINE, distanceKm, resolveArea } from "./scheduling";
import { toMinutes, type BookingRules, type BookingType } from "./bookingRules";

export interface PlannerStop {
  time: string; // HH:mm
  type: BookingType;
  leadId: string;
  name: string;
  address?: string;
  suburb?: string;
}

export interface Point {
  lat: number;
  lng: number;
  label: string; // suburb name, or "Base"
}

export type Fit = "best" | "good" | "far" | "empty";

export interface SlotFit {
  time: string;
  prev: { label: string; km: number; minutes: number; name?: string };
  next: { label: string; km: number; name?: string } | null;
  detourKm: number;
  fit: Fit;
  /** Not enough time between the neighbouring visits (visit length + driving) for this slot. */
  tight: boolean;
}

const BASE: Point = { ...TULLAMARINE, label: "Base" };

// Same driving model as calculateTravel() in lib/dispatch.ts.
export function driveMinutes(km: number): number {
  return Math.max(10, Math.round((km / 50) * 60) + 3);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const SUBURB_POINTS = new Map<string, Point>(SUBURBS.map((s) => [s.name, { lat: s.lat, lng: s.lng, label: titleCase(s.name) }]));

/** Locate an address/suburb text using the suburb catalogue; null if unknown. */
export function locate(text: string | undefined | null): Point | null {
  if (!text) return null;
  const suburb = resolveArea(text).suburb;
  return suburb ? SUBURB_POINTS.get(suburb) ?? null : null;
}

export function stopPoint(stop: PlannerStop): Point | null {
  return locate(stop.address) ?? locate(stop.suburb);
}

export function classify(detourKm: number, dayHasStops: boolean): Fit {
  if (!dayHasStops) return "empty";
  if (detourKm <= 8) return "best";
  if (detourKm <= 20) return "good";
  return "far";
}

/**
 * Score one candidate start time for `target` against the day's other stops.
 * Stops with an unknown location are ignored for distance (can't route to them).
 */
export function scoreSlot(
  target: Point,
  time: string,
  stops: PlannerStop[],
  rules: BookingRules,
  slotType: BookingType = "inspection"
): SlotFit {
  const located = stops
    .map((s) => ({ s, p: stopPoint(s) }))
    .filter((x): x is { s: PlannerStop; p: Point } => !!x.p)
    .sort((a, b) => a.s.time.localeCompare(b.s.time));

  const before = located.filter((x) => x.s.time < time);
  const after = located.filter((x) => x.s.time > time);
  const prev = before[before.length - 1];
  const next = after[0];

  const prevP = prev?.p ?? BASE;
  const nextP = next?.p ?? BASE; // end of day: return to base
  const dPrev = distanceKm(prevP, target);
  const dNext = distanceKm(target, nextP);
  const detour = Math.max(0, dPrev + dNext - distanceKm(prevP, nextP));

  // Can the crew get here after the previous visit, and on to the next one in time?
  let tight = false;
  if (prev) {
    const prevEnds = toMinutes(prev.s.time) + rules[prev.s.type].slotMinutes;
    if (prevEnds + driveMinutes(dPrev) > toMinutes(time)) tight = true;
  }
  if (next) {
    const thisEnds = toMinutes(time) + rules[slotType].slotMinutes;
    if (thisEnds + driveMinutes(dNext) > toMinutes(next.s.time)) tight = true;
  }

  return {
    time,
    prev: { label: prevP.label, km: round1(dPrev), minutes: driveMinutes(dPrev), name: prev?.s.name },
    next: next ? { label: nextP.label, km: round1(dNext), name: next.s.name } : null,
    detourKm: round1(detour),
    fit: classify(detour, located.length > 0),
    tight,
  };
}

/** Nearest already-booked stop on a day, for "closest job that day" summaries. */
export function nearestStop(target: Point, stops: PlannerStop[]): { stop: PlannerStop; km: number } | null {
  let best: { stop: PlannerStop; km: number } | null = null;
  for (const s of stops) {
    const p = stopPoint(s);
    if (!p) continue;
    const km = distanceKm(target, p);
    if (!best || km < best.km) best = { stop: s, km: round1(km) };
  }
  return best;
}

export function distanceFromBase(target: Point): number {
  return round1(distanceKm(BASE, target));
}
