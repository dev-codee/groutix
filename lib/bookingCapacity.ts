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

/** One inspector pool; jobs use the active technicians working on this date. */
export function bookingAvailability(
  appointments: CapacityAppointment[],
  candidate: CapacityAppointment,
  rules: BookingRules,
  technicians: BookingTechnician[],
) {
  const working = techniciansOnDate(technicians, candidate.date);
  const capacity = candidate.type === "inspection" ? 1 : working.length;
  const start = toMinutes(candidate.time);
  const end = start + appointmentDurationMinutes(candidate, rules);
  const overlapping = appointments.filter((entry) => entry.date === candidate.date && entry.type === candidate.type && entry.leadId !== candidate.leadId &&
    toMinutes(entry.time) < end && toMinutes(entry.time) + appointmentDurationMinutes(entry, rules) > start);
  // End events precede starts at the same minute: back-to-back visits are valid.
  const events = overlapping.flatMap((entry) => [
    { time: Math.max(start, toMinutes(entry.time)), change: 1 },
    { time: Math.min(end, toMinutes(entry.time) + appointmentDurationMinutes(entry, rules)), change: -1 },
  ]).sort((a, b) => a.time - b.time || a.change - b.change);
  let used = 0;
  let peak = 0;
  for (const event of events) { used += event.change; peak = Math.max(peak, used); }
  const remaining = Math.max(0, capacity - peak);
  const technicianId = candidate.type === "job" ? assignedTechnicianId(candidate, technicians) : undefined;
  let reason: string | null = null;
  if (end > 24 * 60) reason = "The job would run past midnight. Choose an earlier start time.";
  else if (candidate.type === "job" && capacity === 0) reason = "No active job technicians are working on this date.";
  else if (technicianId && !working.some((tech) => tech.id === technicianId)) reason = "The selected technician is not available to work on this date.";
  else if (technicianId && overlapping.some((entry) => assignedTechnicianId(entry, technicians) === technicianId)) reason = "The selected technician already has an overlapping job. Choose another technician or time.";
  else if (remaining === 0) reason = candidate.type === "job"
    ? `All ${capacity} job technician${capacity === 1 ? "" : "s"} are booked during this time. Choose another time.`
    : "An inspection is already booked during this time. Choose another time.";
  else if (candidate.type === "job" && !technicianId && working.every((tech) => overlapping.some((entry) => assignedTechnicianId(entry, technicians) === tech.id))) {
    reason = "No technician is free for the entire job. Choose another time.";
  }
  return { available: reason === null, capacity, remaining: reason ? 0 : remaining, reason, overlapping, technicianId };
}
