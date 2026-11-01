export const PROPERTY_ADDRESS_ERROR = "Enter the full property address, including street number, street name and suburb (e.g. 12 Smith Street, Richmond VIC 3121).";

// Check address completeness, not whether a property exists. Manual entry must
// keep working when the autocomplete provider is unavailable.
export function isCompletePropertyAddress(value: string): boolean {
  const address = value.trim().replace(/\s+/g, " ")
    .replace(/^(?:unit|apartment|apt|flat|shop|suite|lot)\s+[a-z0-9-]+\s*[,/]\s*/i, "");
  const numberedStreet = address.match(/^(?:\d+[a-z]?\s*\/\s*)?\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?\s+(.+)$/i);
  if (!numberedStreet) return false;
  const streetAndSuburb = numberedStreet[1];
  const hasSuburb = (text: string) => /[a-z]{2}/i.test(text
    .replace(/\b(?:vic|victoria|nsw|new south wales|qld|queensland|sa|south australia|wa|western australia|tas|tasmania|nt|northern territory|act|australian capital territory|australia)\b/gi, ""));
  const comma = streetAndSuburb.indexOf(",");
  if (comma >= 0) {
    return /[a-z]{2}/i.test(streetAndSuburb.slice(0, comma)) && hasSuburb(streetAndSuburb.slice(comma + 1));
  }
  const street = streetAndSuburb.match(/^.+?\b(?:street|st|road|rd|avenue|ave|av|drive|dr|court|ct|crescent|cres|cr|lane|ln|place|pl|terrace|tce|parade|pde|highway|hwy|way|boulevard|blvd|circuit|cct|close|cl|grove|gr|esplanade|esp|rise|walk|mews|square|sq|track|trk)\.?\s+(.+)$/i);
  return !!street && hasSuburb(street[1]);
}
