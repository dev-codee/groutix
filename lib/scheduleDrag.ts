import { bookingAvailability, type BookingTechnician, type TechnicianAssignment } from "./bookingCapacity";
import { overlapsSlot } from "./bookingDuration";
import { slotsForDate, type BookingRules, type BookingType } from "./bookingRules";

export type ScheduleDragItem =
  | { kind: "booking"; id: string }
  | { kind: "unassigned"; leadId: string; type: BookingType };

interface DropAppointment extends TechnicianAssignment {
  id: string;
  leadId: string;
  type: BookingType;
  date: string;
  time: string;
  durationMinutes?: number;
}

// Resolve drops without changing appointments. The UI must confirm the returned
// proposal before it changes either a booking or the planned driving order.
export function planScheduleDrop(item: ScheduleDragItem, date: string, entries: DropAppointment[], targetId?: string) {
  if (item.kind === "unassigned") return { kind: "book" as const, leadId: item.leadId, type: item.type, date };
  const entry = entries.find((entry) => entry.id === item.id);
  if (!entry) return null;
  if (entry.date !== date) return { kind: "reschedule" as const, entry, date };
  const target = entries.find((entry) => entry.id === targetId && entry.date === date);
  if (!target || target.id === entry.id) return null;
  return { kind: "reorder" as const, from: entries.indexOf(entry), to: entries.indexOf(target) };
}

export function suggestedPlanningTime(rules: BookingRules, type: BookingType, date: string, entries: DropAppointment[], preferred?: string, technicians?: BookingTechnician[], candidate?: TechnicianAssignment & { leadId?: string; durationMinutes?: number }): string {
  const occupied = (time: string) => technicians ? !bookingAvailability(entries, { ...candidate, date, time, type, leadId: candidate?.leadId || "" }, rules, technicians).available : entries.some((entry) => entry.date === date && overlapsSlot(entry, time, rules[type].slotMinutes, rules));
  const slots = slotsForDate(rules, type, date);
  if (preferred && slots.includes(preferred) && !occupied(preferred)) return preferred;
  return slots.find((time) => !occupied(time)) || preferred || "09:00";
}
