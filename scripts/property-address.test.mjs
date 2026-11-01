import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { isCompletePropertyAddress } = loadTs("lib/propertyAddress.ts");

test("rejects suburb-only entries and incomplete street addresses", () => {
  for (const value of ["", "Melbourne", "melbourne", "Richmond VIC 3121", "Melbourne 3000", "3000 Melbourne", "12 Melbourne VIC 3000", "12 Smith Street", "12 Smith Street, VIC 3121 Australia", "Smith Street, Richmond"]) {
    assert.equal(isCompletePropertyAddress(value), false, value);
  }
});

test("accepts full addresses, including units, suffixes, ranges and manual entries", () => {
  for (const value of [
    "12 Smith Street, Richmond VIC 3121",
    "12 Smith St Richmond VIC 3121",
    "4/12 Smith Street, Richmond",
    "Unit 4, 12 Smith Street, Richmond VIC 3121",
    "Apartment 4/12 Smith Street, Richmond",
    "12A Smith Road, Richmond",
    "12-14 Smith Crescent Richmond",
    "12 The Righi, South Yarra VIC 3141",
    "12 Broadway, Camberwell VIC 3124",
    " 12  Smith Street,  Richmond VIC 3121 ",
  ]) assert.equal(isCompletePropertyAddress(value), true, value);
});

test("autocomplete omits suburb-only results and keeps complete Australian addresses", async () => {
  const { GET } = loadTs("app/api/address-autocomplete/route.ts", {}, {
    process: { env: {} },
    fetch: async () => Response.json({ features: [
      { properties: { name: "Melbourne", city: "Melbourne", state: "Victoria", postcode: "3000" } },
      { properties: { street: "Smith Street", city: "Richmond", state: "Victoria", postcode: "3121" } },
      { properties: { housenumber: "12", street: "Smith Street", city: "Richmond", state: "Victoria", postcode: "3121" } },
    ] }),
  });
  const response = await GET({ nextUrl: new URL("https://example.test/api/address-autocomplete?input=Melbourne") });
  assert.deepEqual((await response.json()).predictions, ["12 Smith Street, Richmond, Victoria, 3121"]);
});
