type EmailPhoto = { contentId?: string; url?: string; secureUrl?: string };

// Only remove CID placeholders when the corresponding file is available.
// Keep unresolved references visible so a failed upload never hides a photo.
export function emailDisplayText(text: string, attachments: EmailPhoto[] = []): string {
  const available = new Set(attachments.filter(att => att.url || att.secureUrl)
    .map(att => att.contentId?.replace(/^<|>$/g, "")).filter(Boolean));
  return text.replace(/\[cid:([^\]]+)\]/gi, (original, id: string) => available.has(id) ? "" : original)
    .replace(/\[https:\/\/res-\d+\.cdn\.office\.net\/assets\/mail\/file-icon\/[^\]\s]+\]/gi, "")
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n").trim();
}
