import type { Lead } from "@/components/admin/types";

export function isPropertyManagerLead(lead: Lead): boolean {
  return /property[\s_-]*manager/i.test(lead.customerType || "") || Boolean(lead.agency?.trim() || lead.tenants?.length);
}

/** Save quote contact edits together with the quote, including site access contacts. */
export function quoteLeadDetails(lead: Lead): Partial<Lead> {
  return {
    name: lead.name || "", phone: lead.phone || "", email: lead.email || "", address: lead.address || "",
    ...(lead.customerType !== undefined ? { customerType: lead.customerType } : {}),
    ...(lead.agency !== undefined ? { agency: lead.agency } : {}),
    ...(lead.tenants !== undefined ? { tenants: lead.tenants.map(tenant => ({ ...tenant })) } : {}),
  };
}
