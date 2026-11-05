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

/** Photon stores Melbourne suburbs in district/locality, separately from city. */
export function formatPhotonPropertyAddress(properties: Record<string, string>): string {
  const p = properties;
  if (!p.housenumber?.trim() || !p.street?.trim()) return "";
  if (p.countrycode && p.countrycode.toUpperCase() !== "AU") return "";
  const suburb = [p.suburb, p.locality, p.district, p.city]
    .map(value => value?.trim())
    .find(value => value && !/^(?:city|shire|municipality|borough|council)\b|\bcouncil$/i.test(value));
  if (!suburb) return "";
  // Melbourne is a valid CBD suburb, but not a substitute for a missing outer suburb.
  if (/^melbourne$/i.test(suburb) && !["3000", "3004"].includes(p.postcode || "")) return "";
  const address = [`${p.housenumber.trim()} ${p.street.trim()}`, suburb, p.state, p.postcode].filter(Boolean).join(", ");
  return isCompletePropertyAddress(address) ? address : "";
}

const AUSTRALIAN_STATES: Record<string, string> = {
  victoria: "VIC", vic: "VIC", "new south wales": "NSW", nsw: "NSW", queensland: "QLD", qld: "QLD",
  "south australia": "SA", sa: "SA", "western australia": "WA", wa: "WA", tasmania: "TAS", tas: "TAS",
  "northern territory": "NT", nt: "NT", "australian capital territory": "ACT", act: "ACT",
};

/** Require all postal address parts before offering a provider suggestion. */
export function isCompleteAddressSuggestion(value: string): boolean {
  const genericMelbourne = value.match(/,\s*Melbourne\s*,?\s*(?:VIC|Victoria)\s*,?\s*(\d{4})\b/i);
  if (genericMelbourne && !["3000", "3004"].includes(genericMelbourne[1])) return false;
  return isCompletePropertyAddress(value)
    && /\b(?:VIC|Victoria|NSW|New South Wales|QLD|Queensland|SA|South Australia|WA|Western Australia|TAS|Tasmania|NT|Northern Territory|ACT|Australian Capital Territory)\b/i.test(value)
    && /\b\d{4}(?:\s*,?\s*Australia)?\s*$/i.test(value);
}

type GoogleAddressComponent = { types?: string[]; longText?: string; shortText?: string; long_name?: string; short_name?: string };
export function formatGooglePropertyAddress(place: { addressComponents?: GoogleAddressComponent[]; address_components?: GoogleAddressComponent[] }): string {
  const components = place.addressComponents || place.address_components || [];
  const component = (type: string) => components.find(value => value.types?.includes(type));
  const long = (type: string) => { const c = component(type); return (c?.longText || c?.long_name || "").trim(); };
  const short = (type: string) => { const c = component(type); return (c?.shortText || c?.short_name || "").trim(); };
  if (short("country").toUpperCase() !== "AU") return "";
  const number = long("street_number"), street = long("route"), unit = long("subpremise");
  const suburb = long("sublocality_level_1") || long("locality") || long("postal_town");
  const state = AUSTRALIAN_STATES[(short("administrative_area_level_1") || long("administrative_area_level_1")).toLowerCase()];
  const postcode = long("postal_code");
  if (!number || !street || !suburb || !state || !/^\d{4}$/.test(postcode)) return "";
  if (/^melbourne$/i.test(suburb) && !["3000", "3004"].includes(postcode)) return "";
  return `${unit ? `${unit}/` : ""}${number} ${street}, ${suburb} ${state} ${postcode}`;
}
