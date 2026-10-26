/** Quote acceptance survives later booking, payment and completion stages. */
export const QUOTE_ACCEPTED_FILTER = "Quote Accepted";
export const QUOTE_WAITING_FILTER = "Quote waiting for approval";

type QuoteLead = {
  status?: string;
  quoteAcceptedAt?: string;
  quoteSignedAt?: string;
  quoteSignature?: string;
  acceptedCustomerQuoteCount?: number;
  jobAt?: string | null;
  inspectionReport?: { status?: string; completedAt?: string };
  bookings?: { type: string; status?: string }[];
};

export function hasAcceptedQuote(lead: QuoteLead): boolean {
  return Boolean(lead.quoteAcceptedAt || lead.quoteSignedAt || lead.quoteSignature
    || (lead.acceptedCustomerQuoteCount || 0) > 0
    || ["won", "quote accepted"].includes(lead.status?.trim().toLowerCase() || ""));
}

export function isQuoteWaiting(lead: QuoteLead): boolean {
  return ["Quote Sent", "Negotiation"].includes(lead.status || "") && !hasAcceptedQuote(lead);
}

const BEFORE_JOB_STATUSES = ["Inspection Completed", "Quote Pending", "Quote Sent", "Negotiation", "Won", "Quote Accepted"];

/** Include legacy booked leads whose summary status has not caught up yet. */
export function isJobBooked(lead: QuoteLead): boolean {
  if (["Job Booked", "Scheduled", "Job Confirmed"].includes(lead.status || "")) return true;
  return BEFORE_JOB_STATUSES.includes(lead.status || "") && (Boolean(lead.jobAt)
    || Boolean(lead.bookings?.some(booking => booking.type === "job" && (!booking.status || booking.status === "Job Booked"))));
}

/** Current work queue: inspection finished, quote accepted, job still to book. */
export function isAcceptedQuoteAwaitingBooking(lead: QuoteLead): boolean {
  const inspectionCompleted = lead.status === "Inspection Completed"
    || lead.inspectionReport?.status === "completed"
    || (lead.inspectionReport?.status !== "draft" && Boolean(lead.inspectionReport?.completedAt))
    || lead.bookings?.some(booking => booking.type === "inspection" && booking.status === "Inspection Completed");
  const jobBooked = Boolean(lead.jobAt)
    || lead.bookings?.some(booking => booking.type === "job" && booking.status !== "Cancelled");
  const beforeJob = BEFORE_JOB_STATUSES.includes(lead.status || "");
  return hasAcceptedQuote(lead) && Boolean(inspectionCompleted) && !jobBooked && beforeJob;
}

/** Used by both dashboard cards and their destination lead list. */
export function matchesQuoteStatusFilter(lead: QuoteLead, filter: string): boolean {
  return filter.split("|").some(status => status === QUOTE_ACCEPTED_FILTER ? isAcceptedQuoteAwaitingBooking(lead)
    : status === QUOTE_WAITING_FILTER ? isQuoteWaiting(lead)
    : status === "Job Booked" ? isJobBooked(lead) : lead.status === status);
}
