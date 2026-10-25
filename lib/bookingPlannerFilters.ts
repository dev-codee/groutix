import type { Lead } from "@/components/admin/types";
import { leadBookings, type LeadBooking } from "./leadBookings";
import { matchesDispatchLeadStatus, type DispatchLeadFilter } from "./dispatchLeads";
import { validScheduleDate } from "./scheduleRoutes";

export type PlannerFilters = {
  stage: DispatchLeadFilter | "all";
  visitType: "all" | "inspection" | "job";
  staff: string;
  dateMode: "all" | "range";
  from: string;
  to: string;
  query: string;
  includeUnbooked: boolean;
};

export const defaultPlannerFilters = (): PlannerFilters => ({
  stage: "active", visitType: "all", staff: "all", dateMode: "all",
  from: "", to: "", query: "", includeUnbooked: true,
});
export function validPlannerDates(filters: PlannerFilters) {
  return filters.dateMode === "all" || (validScheduleDate(filters.from) && validScheduleDate(filters.to) && filters.from <= filters.to);
}
export function matchesPlannerLead(lead: Partial<Lead>, filters: PlannerFilters) {
  const query = filters.query.trim().toLowerCase();
  return (filters.stage === "all" || matchesDispatchLeadStatus(lead.status || "", filters.stage))
    && [lead.name, lead.address, lead.city, lead.phone, lead.email, lead.jobNo, lead.id].some(value => value?.toLowerCase().includes(query));
}
export function plannerStaff(visit: Pick<LeadBooking, "type" | "technician" | "assigned">) {
  return (visit.type === "job" ? visit.technician : visit.assigned)?.trim() || "Unassigned";
}
export function matchesPlannerVisit(visit: Pick<LeadBooking, "type" | "date" | "endAt" | "technician" | "assigned">, filters: PlannerFilters) {
  return (filters.visitType === "all" || visit.type === filters.visitType)
    && (filters.staff === "all" || plannerStaff(visit).toLowerCase() === filters.staff)
    && (filters.dateMode === "all" || (validPlannerDates(filters) && visit.date <= filters.to && (visit.endAt?.slice(0, 10) || visit.date) >= filters.from));
}
export function filterPlannerLeads(leads: Lead[], filters: PlannerFilters) {
  return leads.filter(lead => {
    if (!matchesPlannerLead(lead, filters)) return false;
    const visits = leadBookings(lead).filter(visit => visit.status !== "Cancelled");
    return visits.length ? visits.some(visit => matchesPlannerVisit(visit, filters))
      : filters.includeUnbooked && ["all", "unassigned"].includes(filters.staff);
  });
}
