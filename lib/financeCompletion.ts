import { isFlowInProgress } from "./pipeline";
import type { Lead } from "@/components/admin/types";

export type FinanceCompletionHolds = Record<string, { previousStatus: string }>;

export function financeFilterStatus(lead: Pick<Lead, "id" | "status">, holds: FinanceCompletionHolds, filter: string): string {
  return lead.status === "Completed" && holds[lead.id] && !filter.split("|").includes("Completed")
    ? holds[lead.id].previousStatus : lead.status;
}

/** Only a successful explicit refresh releases completions present when it started. */
export function releaseFinanceCompletions(current: FinanceCompletionHolds, atRefresh: FinanceCompletionHolds): FinanceCompletionHolds {
  return Object.fromEntries(Object.entries(current).filter(([id, hold]) => atRefresh[id] !== hold));
}

export function financeWorkVisible(lead: Lead, holds: FinanceCompletionHolds): boolean {
  return isFlowInProgress("finance", lead.status, lead) || (lead.status === "Completed" && Boolean(holds[lead.id]));
}
