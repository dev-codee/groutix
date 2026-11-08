import { invoiceDraftForLead } from "./invoiceDraft";
import { isQboConfigured, pushInvoiceToQbo } from "./quickbooks";
import type { SubmissionJSON } from "./submissions";
import { saveInvoiceCustomerId, appendInvoiceActivity as appendActivity, updateInvoiceSubmission as updateSubmission } from "./customerInvoices";

/** Sync a saved invoice only; never send email or change its payment/workflow status. */
export async function syncInvoiceToQuickbooks(lead: SubmissionJSON, actor: string) {
  if (lead.qboInvoiceId) return { item: lead, alreadySynced: true };
  if (!isQboConfigured()) throw new Error("QuickBooks is not configured. Ask a manager to connect it in Settings.");
  if (!lead.invoiceNumber || !lead.invoiceAmount || lead.invoiceAmount <= 0) {
    throw new Error("Save the invoice before sending it to QuickBooks.");
  }
  const draft = invoiceDraftForLead(lead);
  if (Math.round((draft.basePrice + draft.extraCharge) * 100) !== Math.round(lead.invoiceAmount * 100)) {
    throw new Error("The saved invoice total does not match its line items. Open and save the invoice before retrying.");
  }
  try {
    const qboInvoiceId = await pushInvoiceToQbo({
      invoiceNumber: lead.invoiceNumber, gstRate: draft.gst,
      customerId: lead.qboCustomerId,
      onCustomerResolved: id => saveInvoiceCustomerId(lead.id, id),
      customerName: lead.name || "Customer", customerEmail: lead.email, customerPhone: lead.phone,
      items: draft.lines || [
        { description: draft.description ? `${draft.service} — ${draft.description}` : draft.service, amount: draft.basePrice },
        ...(draft.extraWork || draft.extraCharge > 0 ? [{ description: `Additional Work — ${draft.extraWork}`, amount: draft.extraCharge }] : []),
      ],
    });
    const updates = { qboInvoiceId, qboSyncedAt: new Date().toISOString(), qboError: "", qboErrorAt: "" };
    if (!await updateSubmission(lead.id, updates)) {
      throw new Error("The invoice reached QuickBooks, but its sync status could not be saved. Retry to recover the existing invoice.");
    }
    await appendActivity(lead.id, { time: updates.qboSyncedAt, actor, action: "QuickBooks invoice synced", detail: `QBO invoice ${qboInvoiceId}` });
    return { item: { ...lead, ...updates }, alreadySynced: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "QuickBooks sync failed. Please retry.";
    await updateSubmission(lead.id, { qboError: message.slice(0, 500), qboErrorAt: new Date().toISOString() }).catch(() => {});
    await appendActivity(lead.id, { time: new Date().toISOString(), actor, action: "QuickBooks sync failed", detail: message.slice(0, 500) }).catch(() => {});
    throw error;
  }
}
