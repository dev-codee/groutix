/** Section labels supplied in the quote catalog are headings, not work bullets. */
export function isQuoteScopeHeading(line: string): boolean {
  return /^(GROUTING WORK|SILICONE WORK|COMPLETION \/ OTHER)$/.test(line.trim());
}
