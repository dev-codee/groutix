import type { Lead } from "@/components/admin/types";

export function quickbooksStatus(lead: Pick<Lead, "invoiceParentId" | "invoiceNumber" | "qboInvoiceId" | "customerInvoiceCount" | "customerInvoiceSyncedCount">) {
  const total = !lead.invoiceParentId && lead.customerInvoiceCount ? lead.customerInvoiceCount : lead.invoiceNumber || lead.qboInvoiceId ? 1 : 0;
  const synced = lead.invoiceParentId || !lead.customerInvoiceCount ? Number(Boolean(lead.qboInvoiceId))
    : Math.max(lead.customerInvoiceSyncedCount || 0, Number(Boolean(lead.invoiceNumber && lead.qboInvoiceId)));
  return { sent: total > 0 && synced >= total, total, synced };
}
