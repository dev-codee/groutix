export const BOOKING_STATUSES = {
  inspection: ["Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed", "Cancelled"],
  job: ["Job Booked", "Job En Route", "Job Arrived", "Job In Progress", "Job Done", "Cancelled"],
} as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[keyof typeof BOOKING_STATUSES][number];

export function validBookingStatus(type: "inspection" | "job", value: unknown): value is BookingStatus {
  return typeof value === "string" && (BOOKING_STATUSES[type] as readonly string[]).includes(value);
}

/** Legacy primary visits inherit their phase; additional visits start booked. */
export function resolveBookingStatus(type: "inspection" | "job", saved?: string, leadStatus?: string, primary = false): BookingStatus {
  if (validBookingStatus(type, saved)) return saved;
  if (primary && validBookingStatus(type, leadStatus)) return leadStatus;
  return type === "job" ? "Job Booked" : "Inspection Booked";
}

export function bookingNeedsReminder(status?: string): boolean {
  return !["Cancelled", "Job Done", "Inspection Completed"].includes(status || "");
}
