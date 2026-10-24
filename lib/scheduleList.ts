import { appointmentAssigneeKeys, type BookingTechnician, type TechnicianAssignment } from "./bookingCapacity";
import { locate } from "./routePlanning";
import { distanceKm, TULLAMARINE } from "./scheduling";
import type { RouteStop } from "./scheduleRoutes";

export interface ScheduleListStop extends RouteStop, TechnicianAssignment {
  type: "inspection" | "job";
  customer?: { address: string; name?: string } | null;
}

interface ScheduleListDetail {
  assignee: string;
  previous?: ScheduleListStop;
  km: number | null;
  assigned: boolean;
}

/** Use the full saved visit order, before applying any display filters. */
export function scheduleListDetails<T extends ScheduleListStop>(entries: T[], roster: BookingTechnician[] = []): Map<string, ScheduleListDetail> {
  const previousByPerson = new Map<string, T>();
  return new Map(entries.map(entry => {
    const keys = appointmentAssigneeKeys(entry, roster);
    const person = roster.find(person => keys.includes(person.id.trim().toLowerCase()));
    const name = (entry.type === "job" ? entry.technician : entry.assigned)?.trim();
    const username = (entry.type === "job" ? entry.technicianUsername : entry.inspectorUsername)?.trim();
    const assignee = person?.name || (name?.toLowerCase() !== "unassigned" ? name : undefined)
      || (username?.toLowerCase() !== "unassigned" ? username : undefined) || (keys.length ? "Assigned staff" : "Unassigned");
    const previous = keys.map(key => previousByPerson.get(`${entry.date}:${key}`)).find(Boolean);
    const from = previous ? locate(previous.customer?.address) || locate(previous.suburb) : locate("Gowanbrae") || TULLAMARINE;
    const to = locate(entry.customer?.address) || locate(entry.suburb);
    const km = keys.length && from && to ? Math.round(distanceKm(from, to) * 10) / 10 : null;
    // Unknown locations still become the previous stop; do not silently skip them.
    for (const key of keys) previousByPerson.set(`${entry.date}:${key}`, entry);
    return [entry.id, { assignee, previous, km, assigned: keys.length > 0 }] as const;
  }));
}

export function scheduleDistanceLabel(detail: ScheduleListDetail): string {
  if (!detail.assigned) return "Assign a person to calculate travel";
  const origin = detail.previous ? detail.previous.customer?.name || "previous customer" : "Gowanbrae base";
  return detail.km === null ? `Distance unavailable from ${origin}` : `~${detail.km.toFixed(1)} km from ${origin}`;
}
