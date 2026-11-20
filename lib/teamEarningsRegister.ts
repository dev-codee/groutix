import type { EarningsJob } from "./teamEarnings";
import { estimatedEarningsShares } from "./teamEarningsCsv";

export const registerFilters = ["All Jobs", "Booked", "Scheduled", "In Progress", "Completed", "Invoiced", "Paid", "Pending", "Cancelled"] as const;
export type RegisterFilter = typeof registerFilters[number];
export function matchesRegisterFilter(job: EarningsJob, filter: RegisterFilter): boolean {
  const visits = job.workVisits.filter(visit => visit.type === "job");
  const cancelled = ["Cancelled", "Lost"].includes(job.status);
  switch (filter) {
    case "All Jobs": return true;
    case "Cancelled": return cancelled;
    case "Booked": return !cancelled && (job.status === "Job Booked" || visits.some(v => v.status === "Job Booked"));
    case "Scheduled": return !cancelled && !!job.scheduledAt && (!visits.length || visits.some(v => v.status !== "Job Done"));
    case "In Progress": return !cancelled && (["Job Started", "In Progress", "Job In Progress", "Job En Route", "Job Arrived"].includes(job.status) || visits.some(v => ["Job In Progress", "Job En Route", "Job Arrived"].includes(v.status)) || visits.some(v => v.status === "Job Done") && visits.some(v => v.status !== "Job Done"));
    case "Completed": return !cancelled && (visits.length ? visits.every(v => v.status === "Job Done") : ["Job Done", "Invoice Sent", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(job.status));
    case "Invoiced": return !cancelled && !!job.invoice;
    case "Paid": return !cancelled && !!job.invoice && job.invoicePaid;
    case "Pending": return !cancelled && !!job.invoice && !job.invoicePaid;
  }
}
export function registerTotals(jobs: EarningsJob[]) {
  return jobs.reduce((sum, job) => {
    sum.invoices += job.receipts?.length || job.invoice?.items?.length || (job.invoice ? 1 : 0);
    sum.value += job.invoice?.totalCents || 0;
    sum.received += (job.receipts || []).reduce((total, invoice) => total + invoice.paidCents, 0);
    for (const share of estimatedEarningsShares(job)) {
      if (job.ledger?.status === "approved") { sum.earned += share.earnedCents; sum.paid += share.paidCents; }
      else sum.estimated += share.earnedCents;
    }
    return sum;
  }, { invoices: 0, value: 0, received: 0, earned: 0, paid: 0, estimated: 0 });
}
