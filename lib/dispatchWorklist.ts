import type { Lead } from "@/components/admin/types";
import { leadBookings, type LeadBooking } from "./leadBookings";
import { bookingNeedsReminder } from "./bookingStatus";
import { dispatchLeadStage } from "./dispatchLeads";
import { dispatchBase, dispatchLocation, travelLeg, type DispatchPlan, type PlannerSort } from "./dispatchPlanner";
import { distanceKm } from "./scheduling";

export interface WorkRow extends ReturnType<typeof dispatchLocation> {
  id: string;
  lead: Lead;
  bookings: LeadBooking[];
  booking?: LeadBooking;
  group?: string;
}
export interface RoadLeg { km: number; minutes: number }
export interface WorkMeasurement {
  id: string;
  address: string;
  previousId: string | null;
  previousAddress: string;
  fromBase: RoadLeg | null;
  fromPrevious: RoadLeg | null;
  returnToBase: RoadLeg | null;
}
export function workBookingKey(booking: LeadBooking) {
  return `${booking.type}:${booking.bookingId || `${booking.date}T${booking.time}`}`;
}
export function workBookingCandidates(row: WorkRow) {
  return row.bookings.filter(booking => bookingNeedsReminder(booking.status)
    || (booking.status === "Inspection Completed" && dispatchLeadStage(row.lead.status)?.id === "inspection-completed"));
}
export function filterWorkBookings(rows: WorkRow[], options: {
  visitType: string; staff: string; includeUnbooked: boolean; from?: string; to?: string; validDates?: boolean;
}): WorkRow[] {
  return rows.flatMap<WorkRow>(row => {
    const candidates = workBookingCandidates(row);
    if (!candidates.length) return options.includeUnbooked && ["all", "unassigned"].includes(options.staff) ? [{ ...row, booking: undefined }] : [];
    const matching = candidates.filter(booking => (options.visitType === "all" || booking.type === options.visitType)
      && (options.staff === "all" || ((booking.type === "job" ? booking.technician : booking.assigned) || "unassigned").toLowerCase() === options.staff)
      && (!options.from || (options.validDates && booking.date <= options.to! && (booking.endAt?.slice(0, 10) || booking.date) >= options.from)));
    if (!matching.length) return [];
    return [{ ...row, booking: matching.find(booking => row.booking && workBookingKey(booking) === workBookingKey(row.booking)) || matching[0] }];
  });
}
export function workRows(leads: Lead[], plan: DispatchPlan, radius: number, choices: Record<string, string> = {}): WorkRow[] {
  return leads.map(lead => {
    const bookings = leadBookings(lead);
    const stage = dispatchLeadStage(lead.status)?.id;
    const candidates = bookings.filter(booking => booking.status !== "Cancelled"
      && (booking.status !== "Inspection Completed" || stage === "inspection-completed"));
    const phase = stage === "job-booked" ? "job" : stage?.startsWith("inspection-") ? "inspection" : undefined;
    const booking = candidates.find(booking => workBookingKey(booking) === choices[lead.id])
      || candidates.find(booking => bookingNeedsReminder(booking.status) && (!phase || booking.type === phase))
      || candidates.find(booking => bookingNeedsReminder(booking.status))
      || (stage === "inspection-completed" ? candidates.find(booking => booking.type === "inspection") : undefined);
    const location = dispatchLocation(lead.address, lead.city, radius);
    return { ...location, id: lead.id, lead, bookings, booking, zone: plan.zones[lead.id] || location.zone, group: plan.groups[lead.id] };
  });
}
export function sortWorkRows(rows: WorkRow[], sort: PlannerSort, plan: DispatchPlan): WorkRow[] {
  const result = [...rows];
  const rank = new Map(plan.order.map((id, index) => [id, index]));
  if (sort === "manual") return result.sort((a, b) => (rank.get(a.id) ?? plan.order.length) - (rank.get(b.id) ?? plan.order.length));
  if (sort === "schedule") return result.sort((a, b) => (a.booking ? `${a.booking.date}T${a.booking.time}` : "z").localeCompare(b.booking ? `${b.booking.date}T${b.booking.time}` : "z"));
  if (sort === "nearest" || sort === "farthest") return result.sort((a, b) => {
    if (a.baseKm === null) return b.baseKm === null ? 0 : 1;
    if (b.baseKm === null) return -1;
    return (a.baseKm - b.baseKm) * (sort === "nearest" ? 1 : -1);
  });
  const remaining = result.filter(row => row.point), ordered: WorkRow[] = [];
  let previous = dispatchBase;
  while (remaining.length) {
    let nearest = 0;
    remaining.forEach((row, index) => { if (distanceKm(previous, row.point!) < distanceKm(previous, remaining[nearest].point!)) nearest = index; });
    const [row] = remaining.splice(nearest, 1); ordered.push(row); previous = row.point!;
  }
  let index = 0;
  return result.map(row => row.point ? ordered[index++] : row);
}
export function workAddress(row: WorkRow) { return row.lead.address?.trim() || row.lead.city?.trim() || ""; }
/** Road measurements are usable only for these exact adjacent records and addresses. */
export function workDistances(rows: WorkRow[], measurements: Record<string, WorkMeasurement>) {
  return rows.map((row, index) => {
    const previous = rows[index - 1];
    const saved = measurements[row.id];
    const sameAddress = saved?.address === workAddress(row);
    const samePrevious = sameAddress && saved.previousId === (previous?.id || null) && saved.previousAddress === (previous ? workAddress(previous) : "");
    return { row, previous,
      fromBase: sameAddress && saved.fromBase ? { ...saved.fromBase, road: true } : { ...(travelLeg(dispatchBase, row.point) || { km: null, minutes: null }), road: false },
      fromPrevious: samePrevious && saved.fromPrevious ? { ...saved.fromPrevious, road: true } : { ...(travelLeg(previous ? previous.point : dispatchBase, row.point) || { km: null, minutes: null }), road: false },
      returnToBase: sameAddress && saved.returnToBase ? { ...saved.returnToBase, road: true } : { ...(travelLeg(row.point, dispatchBase) || { km: null, minutes: null }), road: false },
    };
  });
}
export function workMinutes(booking?: LeadBooking) {
  if (!booking) return 0;
  return booking.workSegments?.reduce((sum, segment) => sum + segment.scheduledMinutes, 0) || booking.scheduledMinutes || 60;
}
