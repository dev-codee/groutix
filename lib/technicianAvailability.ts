import { weekdayOf } from "./bookingRules";
import { validScheduleDate } from "./scheduleRoutes";

export interface TechnicianSchedule {
  active: boolean;
  /** Undefined means every weekday; [] means no regular shifts. */
  workDays?: number[];
  /** A date overrides the recurring week: true = extra shift, false = day off. */
  dateOverrides?: Record<string, boolean>;
}

export function technicianWorksOnDate(technician: TechnicianSchedule, date: string): boolean {
  if (!technician.active) return false;
  if (Object.hasOwn(technician.dateOverrides || {}, date)) return technician.dateOverrides![date];
  return !technician.workDays || technician.workDays.includes(weekdayOf(date));
}

export function validateTechnicianSchedule(updates: { workDays?: unknown; dateOverrides?: unknown; active?: unknown }): string | null {
  if (updates.active !== undefined && typeof updates.active !== "boolean") return "Active must be true or false.";
  if (updates.workDays !== undefined && updates.workDays !== null &&
      (!Array.isArray(updates.workDays) || updates.workDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))) {
    return "Choose valid working weekdays.";
  }
  if (updates.dateOverrides !== undefined && updates.dateOverrides !== null) {
    if (typeof updates.dateOverrides !== "object" || Array.isArray(updates.dateOverrides)) return "Invalid date exceptions.";
    for (const [date, available] of Object.entries(updates.dateOverrides)) {
      if (!validScheduleDate(date) || typeof available !== "boolean") return "Choose a valid date and availability for each exception.";
    }
  }
  return null;
}
