import type { DayAppointment } from "./bookings";
import { BASE_LOCATION, bearingFromBase, distanceKm } from "./scheduling";
import { locate, driveMinutes, type Point } from "./routePlanning";
import { appointmentKey } from "./scheduleRoutes";

export const DISPATCH_BASE_ADDRESS = "82A Marigold Cres, Gowanbrae VIC 3043";
export const DISPATCH_ZONES = [
  { id: "L1", name: "Left", direction: "West / North-West / West-Central", inner: true, color: "#059669" },
  { id: "R1", name: "Right Upper", direction: "North / North-East", inner: true, color: "#2563eb" },
  { id: "R2", name: "Right Lower", direction: "East / South-East", inner: true, color: "#d97706" },
  { id: "N", name: "Right Outer 1", direction: "North / North-East", inner: false, color: "#e11d48" },
  { id: "E1", name: "Right Outer 2", direction: "East", inner: false, color: "#ea580c" },
  { id: "E2", name: "Right Outer 3", direction: "South-East", inner: false, color: "#9333ea" },
  { id: "W1", name: "Left Outer 1", direction: "North-West", inner: false, color: "#0284c7" },
  { id: "W2", name: "Left Outer 2", direction: "West / South-West", inner: false, color: "#db2777" },
  { id: "unlocated", name: "Unlocated", direction: "Address needs review", inner: false, color: "#64748b" },
] as const;
export type DispatchZone = typeof DISPATCH_ZONES[number]["id"];
export type PlannerSort = "schedule" | "nearest" | "farthest" | "smart" | "manual";
export interface DispatchPlan {
  revision: number;
  order: string[];
  zones: Record<string, DispatchZone>;
  groups: Record<string, string>;
}
export const emptyDispatchPlan = (): DispatchPlan => ({ revision: 0, order: [], zones: {}, groups: {} });
export interface DispatchStop extends DayAppointment {
  id: string;
  point: Point | null;
  zone: DispatchZone;
  baseKm: number | null;
  crew: string;
  crewKey: string;
  group?: string;
}
export function dispatchZoneAt(bearing: number, km: number, radius: number): DispatchZone {
  const angle = ((bearing % 360) + 360) % 360;
  if (km <= radius) return angle >= 180 ? "L1" : angle < 75 ? "R1" : "R2";
  if (angle >= 315 || angle < 45) return "N";
  if (angle < 100) return "E1";
  if (angle < 180) return "E2";
  return angle < 270 ? "W2" : "W1";
}
export function dispatchStop(appointment: DayAppointment, plan: DispatchPlan, radius: number): DispatchStop {
  const id = appointmentKey(appointment);
  const point = locate(appointment.address) || locate(appointment.suburb);
  const km = point ? distanceKm(BASE_LOCATION, point) : null;
  const crew = (appointment.type === "job" ? appointment.technician : appointment.assigned)?.trim() || "Unassigned";
  // Match an inspector and technician by username/name so a dual-role person has one route.
  const crewKey = (appointment.type === "job" ? appointment.technicianUsername : appointment.inspectorUsername)?.toLowerCase()
    || crew.toLowerCase();
  return { ...appointment, id, point, baseKm: km === null ? null : Math.round(km * 10) / 10,
    zone: plan.zones[id] || (point && km !== null ? dispatchZoneAt(bearingFromBase(point), km, radius) : "unlocated"),
    crew, crewKey, group: plan.groups[id] };
}
export function travelLeg(from: Point | null, to: Point | null) {
  if (!from || !to) return null;
  const km = distanceKm(from, to);
  return { km: Math.round(km * 10) / 10, minutes: km < 0.01 ? 0 : driveMinutes(km) };
}
export const dispatchBase: Point = { ...BASE_LOCATION, label: "Base" };
export const stopMinutes = (stop: DispatchStop) => stop.scheduledMinutes || stop.durationMinutes || 60;

/** Each staff member/day is a separate route. Never connect different crews. */
export function routeLanes(stops: DispatchStop[]): DispatchStop[][] {
  const lanes = new Map<string, DispatchStop[]>();
  for (const stop of stops) {
    // Unassigned appointments cannot imply a single driver's route.
    const key = `${stop.date}:${stop.crewKey === "unassigned" ? stop.id : stop.crewKey}`;
    const lane = lanes.get(key) || [];
    lane.push(stop); lanes.set(key, lane);
  }
  return [...lanes.values()].sort((a, b) => a[0].date.localeCompare(b[0].date) || a[0].crew.localeCompare(b[0].crew));
}
function laneDistance(stops: DispatchStop[]) {
  const points = [dispatchBase, ...stops.map(stop => stop.point), dispatchBase];
  return points.slice(1).reduce((sum, point, index) => sum + (travelLeg(points[index], point)?.km || 0), 0);
}
export function sortDispatchStops(stops: DispatchStop[], sort: PlannerSort, plans: Record<string, DispatchPlan>): DispatchStop[] {
  return routeLanes(stops).flatMap(lane => {
    const chronological = [...lane].sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
    if (sort === "schedule") return chronological;
    if (sort === "manual") {
      const order = plans[lane[0].date]?.order || [];
      const rank = new Map(order.map((id, index) => [id, index]));
      return chronological.sort((a, b) => (rank.get(a.id) ?? order.length) - (rank.get(b.id) ?? order.length));
    }
    if (sort === "nearest" || sort === "farthest") return chronological.sort((a, b) => {
      if (a.baseKm === null) return b.baseKm === null ? 0 : 1;
      if (b.baseKm === null) return -1;
      return (a.baseKm - b.baseKm) * (sort === "nearest" ? 1 : -1);
    });
    // Keep unlocated visits fixed; a gap never becomes a fictional leg through base.
    const remaining = chronological.filter(stop => stop.point);
    const ordered: DispatchStop[] = [];
    let previous = dispatchBase;
    while (remaining.length) {
      let closest = 0;
      remaining.forEach((stop, index) => {
        if (distanceKm(previous, stop.point!) < distanceKm(previous, remaining[closest].point!)) closest = index;
      });
      const [next] = remaining.splice(closest, 1);
      ordered.push(next); previous = next.point!;
    }
    let index = 0;
    const proposed = chronological.map(stop => stop.point ? ordered[index++] : stop);
    return laneDistance(proposed) < laneDistance(chronological) ? proposed : chronological;
  });
}
/** Only replace visible positions, preserving hidden bookings in saved plans. */
export function mergeDispatchOrder(all: string[], visibleOrder: string[]): string[] {
  const selected = new Set(visibleOrder);
  let index = 0;
  const merged = all.map(id => selected.has(id) ? visibleOrder[index++] : id);
  return [...merged, ...visibleOrder.slice(index)];
}
export function validDispatchPlan(value: unknown): value is DispatchPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as DispatchPlan;
  const record = (v: unknown) => !!v && typeof v === "object" && !Array.isArray(v);
  const key = (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 250 && !["__proto__", "prototype", "constructor"].includes(v);
  return Number.isSafeInteger(plan.revision) && plan.revision >= 0
    && Array.isArray(plan.order) && plan.order.length <= 500 && plan.order.every(key) && new Set(plan.order).size === plan.order.length
    && record(plan.zones) && Object.keys(plan.zones).length <= 500 && Object.entries(plan.zones).every(([id, zone]) => key(id) && DISPATCH_ZONES.some(z => z.id === zone))
    && record(plan.groups) && Object.keys(plan.groups).length <= 500 && Object.entries(plan.groups).every(([id, group]) => key(id) && typeof group === "string" && group.trim().length > 0 && group.length <= 60);
}
