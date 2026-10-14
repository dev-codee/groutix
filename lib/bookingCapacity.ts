import { isStaffScheduling } from "./staffBookingRules";
import { technicianWorksOnDate } from "./technicianAvailability";
import { appointmentDurationMinutes } from "./bookingDuration";
import { toMinutes, type BookingRules, type BookingType } from "./bookingRules";

export interface BookingTechnician {
  id: string;
  name: string;
  active: boolean;
  username?: string;
  aliases?: string[];
  workDays?: number[];
  dateOverrides?: Record<string, boolean>;
}

export interface TechnicianAssignment {
  inspectorId?: string;
  assigned?: string;
  inspectorUsername?: string;
  technicianId?: string;
  technician?: string;
  technicianUsername?: string;
}

export interface CapacityAppointment extends TechnicianAssignment {
  leadId: string;
  type: BookingType;
  date: string;
  time: string;
  durationMinutes?: number;
  scheduledMinutes?: number;
}

const normalize = (value?: string) => value?.trim().toLowerCase() || "";

export function assignedTechnicianId(assignment: TechnicianAssignment, technicians: BookingTechnician[]): string | undefined {
  const values = [assignment.technicianId, assignment.technicianUsername, assignment.technician].map(normalize).filter((value) => value && value !== "unassigned");
  for (const value of values) {
    const match = technicians.find((tech) => [tech.id, tech.name, tech.username, ...(tech.aliases || [])].some((alias) => normalize(alias) === value));
    if (match) return match.id;
    if (value === normalize(assignment.technicianId)) return assignment.technicianId;
  }
  return undefined;
}

export function techniciansOnDate(technicians: BookingTechnician[], date: string): BookingTechnician[] {
  return technicians.filter((tech) => technicianWorksOnDate(tech, date));
}

/** Resolve names, usernames and IDs so one person cannot overlap across job types. */
export function appointmentAssigneeKeys(appointment: TechnicianAssignment & { type: BookingType }, technicians: BookingTechnician[]): string[] {
  const values = (appointment.type === "job"
    ? [appointment.technicianId, appointment.technicianUsername, appointment.technician]
    : [appointment.inspectorId, appointment.inspectorUsername, appointment.assigned]).map(normalize).filter(value => value && value !== "unassigned");
  const keys = new Set(values);
  for (const person of technicians) {
    const aliases = [person.id, person.name, person.username, ...(person.aliases || [])].map(normalize).filter(Boolean);
    if (aliases.some(value => keys.has(value))) aliases.forEach(value => keys.add(value));
  }
  return [...keys];
}

/** Assigned bookings reserve a person, not a shared company-wide slot. */
export function bookingAvailability(
  appointments: CapacityAppointment[], candidate: CapacityAppointment, rules: BookingRules, technicians: BookingTechnician[],
) {
  const working = isStaffScheduling(rules) ? technicians.filter(person => person.active) : techniciansOnDate(technicians, candidate.date);
  const limit = rules[candidate.type].maxBookingsPerSlot;
  const customerLimit = !isStaffScheduling(rules) && limit !== undefined ? limit : undefined;
  const capacity = candidate.type === "inspection" ? (customerLimit ?? 1)
    : Math.min(customerLimit ?? working.length, working.length);
  const start = toMinutes(candidate.time);
  const end = start + appointmentDurationMinutes(candidate, rules);
  const overlapping = appointments.filter(entry => entry.date === candidate.date &&
    !(entry.leadId === candidate.leadId && entry.type === candidate.type) &&
    toMinutes(entry.time) < end && toMinutes(entry.time) + appointmentDurationMinutes(entry, rules) > start);
  const sameType = overlapping.filter(entry => entry.type === candidate.type);
  const events = sameType.flatMap(entry => [
    { time: Math.max(start, toMinutes(entry.time)), change: 1 },
    { time: Math.min(end, toMinutes(entry.time) + appointmentDurationMinutes(entry, rules)), change: -1 },
  ]).sort((a, b) => a.time - b.time || a.change - b.change);
  let used = 0, peak = 0;
  for (const event of events) { used += event.change; peak = Math.max(peak, used); }
  const keys = appointmentAssigneeKeys(candidate, technicians);
  const conflicts = (personKeys: string[]) => overlapping.some(entry => appointmentAssigneeKeys(entry, technicians).some(key => personKeys.includes(key)));
  const technicianId = candidate.type === "job" ? assignedTechnicianId(candidate, technicians) : undefined;
  let reason: string | null = null;
  if (end > 24 * 60) reason = "The booking would run past midnight. Choose an earlier start time.";
  else if (candidate.type === "job" && capacity === 0) reason = "No active job technicians are working on this date.";
  else if (technicianId && !working.some(tech => tech.id === technicianId)) reason = "The selected technician is not available to work on this date.";
  else if (keys.length && conflicts(keys)) reason = "The assigned person already has an overlapping booking. Choose another person or time.";
  else if (customerLimit !== undefined && peak >= customerLimit) reason = `This slot has reached its limit of ${customerLimit} ${candidate.type} booking${customerLimit === 1 ? "" : "s"}. Choose another time.`;
  else if (!keys.length && peak >= capacity) reason = "No unassigned booking capacity remains during this time. Choose a free person or another time.";
  else if (!keys.length && candidate.type === "job" && working.every(person => conflicts(appointmentAssigneeKeys({ type: "job", technicianId: person.id }, technicians)))) reason = "No technician is free for the entire job. Choose another time.";
  return { available: reason === null, capacity, remaining: reason ? 0 : keys.length ? 1 : Math.max(0, capacity - peak), reason, overlapping, technicianId };
}
