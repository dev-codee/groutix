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
  if (primary && type === "job") {
    if (["Job Started", "In Progress"].includes(leadStatus || "")) return "Job In Progress";
    if (["Invoice Sent", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(leadStatus || "")) return "Job Done";
  }
  if (primary && type === "inspection" && leadStatus === "Completed") return "Inspection Completed";
  return type === "job" ? "Job Booked" : "Inspection Booked";
}

export function bookingNeedsReminder(status?: string): boolean {
  return !["Cancelled", "Job Done", "Inspection Completed"].includes(status || "");
}

/** Customer workflow advances to Done only after every active job visit is done. */
export function combinedJobStatus(statuses: readonly string[]): BookingStatus | undefined {
  const active = statuses.filter(status => status !== "Cancelled");
  if (!active.length) return undefined;
  if (active.every(status => status === "Job Done")) return "Job Done";
  return ["Job In Progress", "Job Arrived", "Job En Route", "Job Booked"].find(status => active.includes(status)) as BookingStatus | undefined;
}
