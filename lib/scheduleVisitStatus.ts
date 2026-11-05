import type { Lead } from "@/components/admin/types";
import { leadBookings } from "./leadBookings";
import type { TechnicianAssignment } from "./bookingCapacity";

type ScheduleVisit = TechnicianAssignment & {
  leadId: string;
  type: "inspection" | "job";
  bookingId?: string;
  bookingStart?: string;
  date: string;
  time: string;
  status?: string;
};

/** Reflect CRM status saves without reloading or discarding an unsaved route. */
export function withScheduleVisitStatuses<T extends ScheduleVisit>(entries: T[], leads: Lead[]): T[] {
  const visits = new Map(leads.map(lead => [lead.id, leadBookings(lead)]));
  return entries.map(entry => {
    const candidates = (visits.get(entry.leadId) || []).filter(visit => visit.type === entry.type);
    const byId = entry.bookingId ? candidates.find(visit => visit.bookingId === entry.bookingId) : undefined;
    const start = (entry.bookingStart || `${entry.date}T${entry.time}`).slice(0, 16);
    const byStart = candidates.filter(visit => {
      if ((entry.bookingId && visit.bookingId) || `${visit.date}T${visit.time}` !== start) return false;
      const fields = entry.type === "job"
        ? ["technicianId", "technicianUsername", "technician"] as const
        : ["inspectorId", "inspectorUsername", "assigned"] as const;
      const known = (value?: string) => Boolean(value?.trim() && value.trim().toLowerCase() !== "unassigned");
      const comparable = fields.find(field => known(entry[field]) && known(visit[field]));
      return !comparable || entry[comparable]?.trim().toLowerCase() === visit[comparable]?.trim().toLowerCase();
    });
    // Shared times can belong to different crews. Never guess between visits.
    const matching = byId || (byStart.length === 1 ? byStart[0] : undefined);
    return matching?.status ? { ...entry, status: matching.status } : entry;
  });
}
