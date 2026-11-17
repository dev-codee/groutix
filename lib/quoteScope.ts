/** Section labels supplied in the quote catalog are headings, not work bullets. */
export function isQuoteScopeHeading(line: string): boolean {
  return /^(GROUTING WORK|SILICONE WORK|COMPLETION \/ OTHER|COLOURS:|TILE REPAIR WORK|EPOXY REGROUTING WORK)$/.test(line.trim());
}

interface ScopeItem { service?: string; scope?: string; description?: string }

/** Preserve every distinct saved detail, removing only repeated title/scope text. */
export function quoteItemDetailTexts(item: ScopeItem): string[] {
  const title = item.service?.trim();
  const candidates = [item.scope, item.description].map(text => {
    const lines = (text || "").trim().split(/\r?\n/);
    if (lines[0]?.trim() === title) lines.shift();
    return lines.join("\n").trim();
  });
  const unique = [...new Set(candidates.filter(Boolean))];
  return unique.filter(text => !unique.some(other => other !== text && other.includes(text)));
}

/** A service title alone is not a work description. */
export function quoteScopeValidationError(items: ScopeItem[], overview?: string): string | undefined {
  const missing = items.find(item => {
    if (quoteItemDetailTexts(item).length) return false;
    // Older single-line quotes can keep their complete scope in the overview.
    return !(items.length === 1 && overview?.trim() && overview.trim() !== item.service?.trim());
  });
  return missing ? `Add the detailed scope of work for "${missing.service || "Restoration Work"}" before sending this quote.` : undefined;
}
