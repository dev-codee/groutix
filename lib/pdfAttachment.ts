/** PDF headers may follow a short binary prefix, but must be in the first 1 KB. */
export function hasPdfHeader(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, 1024)).includes(Buffer.from("%PDF-"));
}

export function needsPdfRecovery(attachment: { name?: string; contentType?: string; url?: string; secureUrl?: string }): boolean {
  const isPdf = attachment.contentType === "application/pdf" || /\.pdf$/i.test(attachment.name || "");
  const url = attachment.secureUrl || attachment.url || "";
  // The old auto-format upload converted PDFs to images, losing document pages.
  return isPdf && /res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url) && !/\.pdf(?:\?|$)/i.test(url);
}
