/**
 * Strips quoted email reply threads, headers, and boilerplate so only the
 * customer's actual response is displayed.
 */
export function stripQuotedReply(raw?: string): string {
  if (!raw) return "";

  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 1. Standard "On <date/time/person> wrote:" header (Gmail, Apple Mail, etc.)
  // Handles single-line and two-line formats:
  // "On Thu, Sep 10, 2026, 1:15 PM Groutix <info@groutix.com> wrote:"
  // "On 10 Sep 2026, at 1:15 pm, Groutix <info@groutix.com> wrote:"
  const onWroteMatch = text.search(/(?:^|\n)\s*On\s+[^\n]+(?:\n[^\n]+)?wrote:\s*(?:\n|$)/i);
  if (onWroteMatch !== -1) {
    text = text.slice(0, onWroteMatch);
  }

  // 2. Outlook / Windows Mail: "-----Original Message-----"
  const origMsgMatch = text.search(/(?:^|\n)\s*-{3,}\s*Original Message\s*-{3,}/i);
  if (origMsgMatch !== -1) {
    text = text.slice(0, origMsgMatch);
  }

  // 3. Outlook horizontal line divider: "________________________________"
  const lineSeparatorMatch = text.search(/(?:^|\n)\s*_{20,}\s*(?:\n|$)/);
  if (lineSeparatorMatch !== -1) {
    text = text.slice(0, lineSeparatorMatch);
  }

  // 4. Outlook inline header block: "From: ... \n Sent/Date: ..."
  const headerBlockMatch = text.search(/(?:^|\n)\s*From:\s+[^<\n]+(?:<[^>\n]+>)?\s*\n\s*(?:Sent|Date):\s+/i);
  if (headerBlockMatch !== -1) {
    text = text.slice(0, headerBlockMatch);
  }

  // 5. Trailing quoted lines starting with '>'
  const lines = text.split("\n");
  let lastNonQuoteIdx = lines.length - 1;
  while (lastNonQuoteIdx >= 0) {
    const trimmed = lines[lastNonQuoteIdx].trim();
    if (trimmed.startsWith(">") || trimmed === "") {
      lastNonQuoteIdx--;
    } else {
      break;
    }
  }
  if (lastNonQuoteIdx < lines.length - 1) {
    lines.splice(lastNonQuoteIdx + 1);
    text = lines.join("\n");
  }

  // 6. Common mobile signatures at the end of customer messages
  text = text.replace(/(?:^|\n)\s*Sent from my (?:iPhone|iPad|Galaxy|phone)[\s\S]*$/i, "");
  text = text.replace(/(?:^|\n)\s*Get Outlook for (?:iOS|Android)[\s\S]*$/i, "");

  const cleaned = text.trim();
  // Fallback: if stripping removed everything, preserve the raw text trimmed
  return cleaned || raw.trim();
}
