interface JobDocument {
  id: string;
  jobNo?: string;
  quoteNumber?: string;
  invoiceNumber?: string;
}

function jobSuffix(jobNo?: string): string | undefined {
  return jobNo?.trim().match(/^(?:(?:job\s*no|job)[\s:#_-]*)?(\d+)$/i)?.[1];
}

/** Customer-facing document numbers always share the job's numeric suffix. */
export function quoteNumberForJob(lead: JobDocument): string {
  const suffix = jobSuffix(lead.jobNo);
  if (suffix) return `QT-${suffix}`;
  if (lead.quoteNumber && !/^GX-/i.test(lead.quoteNumber)) return lead.quoteNumber;
  return `QT-${lead.id.split("~")[0].slice(-6).toUpperCase()}`;
}

export function invoiceNumberForJob(lead: JobDocument): string {
  const suffix = jobSuffix(lead.jobNo);
  if (suffix) return `INV-${suffix}`;
  if (lead.invoiceNumber && !/^GX-/i.test(lead.invoiceNumber)) return lead.invoiceNumber;
  return `INV-${lead.id.split("~")[0].slice(-6).toUpperCase()}`;
}
