/** Customer property navigation, shared by inspector and technician views. */
type PropertyLocation = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  inspectionReport?: { propertyAddress?: string | null } | null;
};

const normalized = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function propertyAddress(value: string | null | undefined, city?: string | null): string {
  const address = value?.trim().replace(/\s+/g, " ") || "";
  if (!address || /^(?:unknown|n\/?a|tbc|not provided|no address provided)$/i.test(address)) return "";
  // A locality/postcode is not a customer property. Do not route to the city centre.
  let locality = normalized(address).replace(/\b(?:australia|victoria|vic|melbourne|\d{4})\b/g, "").replace(/\s+/g, " ").trim();
  if (city && locality === normalized(city)) locality = "";
  if (!locality) return "";
  // A suburb alone (even with its postcode) cannot identify the property.
  const hasStreet = /\b(?:street|st|road|rd|avenue|ave|drive|dr|crescent|cres|court|ct|lane|ln|parade|pde|place|pl|way|close|circuit|circ|terrace|tce|highway|hwy|boulevard|blvd|grove|gr|square|sq)\b/i.test(address);
  const hasStreetNumber = /(?:^|[\s/])\d+[a-z]?(?:[-/]\d+[a-z]?)?\s+\p{L}/iu.test(address);
  return hasStreet || hasStreetNumber ? address : "";
}

export function customerPropertyAddress(lead: PropertyLocation): string {
  const address = propertyAddress(lead.address, lead.city) || propertyAddress(lead.inspectionReport?.propertyAddress, lead.city);
  if (!address) return "";
  const parts = [address];
  const hasState = /\b(?:vic|victoria|nsw|new south wales|qld|queensland|sa|south australia|wa|western australia|act|nt|tas|tasmania)\b/i;
  if (!hasState.test(address) && !/\baustralia\b/i.test(address) && lead.city?.trim() && !normalized(address).includes(normalized(lead.city))) parts.push(lead.city.trim());
  const joined = parts.join(", ");
  if (!hasState.test(joined)) parts.push(lead.state?.trim() || "VIC");
  if (!/\baustralia\b/i.test(joined)) parts.push("Australia");
  return parts.join(", ");
}

export function customerDrivingDirections(lead: PropertyLocation): string | undefined {
  const destination = customerPropertyAddress(lead);
  if (!destination) return undefined;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  url.searchParams.set("dir_action", "navigate");
  // Let Maps use the inspector's device location as the origin; never a saved check-in.
  return url.toString();
}
