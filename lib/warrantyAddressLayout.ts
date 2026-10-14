/** Fit the complete address to the certificate's narrow first and wide second line. */
export function layoutWarrantyAddress(
  address: string,
  widths: readonly [number, number],
  measure: (text: string, fontSize: number) => number,
  preferredSize: number,
): { lines: string[]; fontSize: number } {
  const words = address.trim().split(/\s+/).filter(Boolean);
  const wrap = (size: number) => {
    const lines: string[] = [];
    let line = "";
    const width = () => widths[Math.min(lines.length, 1)];
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, size) <= width()) {
        line = candidate;
        continue;
      }
      if (line) { lines.push(line); line = ""; }
      // Break an unspaced address component too, so it cannot cross the margin.
      for (const char of Array.from(word)) {
        if (line && measure(line + char, size) > width()) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  const preferred = wrap(preferredSize);
  if (preferred.length <= 2) return { lines: preferred, fontSize: preferredSize };
  let low = 0;
  let high = preferredSize;
  for (let i = 0; i < 24; i++) {
    const size = (low + high) / 2;
    if (wrap(size).length <= 2) low = size;
    else high = size;
  }
  return { lines: wrap(low), fontSize: low };
}
