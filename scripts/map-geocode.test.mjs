import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../lib/mapGeocode.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText.replace('import { locate } from "./routePlanning";', 'const locate = (text) => text.includes("Gowanbrae") ? { lat: -37.7, lng: 144.9 } : null;');
const { geocodeMapAddress, geocodeMapAddresses } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("key-free geocoding deduplicates requests, preserves order, and marks fallbacks", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(url.toString());
    const query = url.searchParams.get("q");
    if (query.includes("Gowanbrae")) throw new Error("Provider offline");
    if (query.includes("Unknown")) return Response.json({ features: [{ properties: { countrycode: "US" }, geometry: { coordinates: [-80, 40] } }] });
    return Response.json({ features: [{ properties: { countrycode: "AU", housenumber: "82A" }, geometry: { coordinates: [144.9, -37.7] } }] });
  };
  try {
    const results = await geocodeMapAddresses(["82A Test Road, VIC", "82a test road, vic", "Gowanbrae, VIC", "Unknown"]);
    assert.deepEqual(results, [
      { lat: -37.7, lng: 144.9, approximate: false },
      { lat: -37.7, lng: 144.9, approximate: false },
      { lat: -37.7, lng: 144.9, approximate: true },
      null,
    ]);
    assert.equal(requests.length, 3);
    assert.ok(requests.every((url) => url.startsWith("https://photon.komoot.io/api/")));
    await geocodeMapAddress("82A Test Road, VIC");
    assert.equal(requests.length, 3, "cached addresses do not contact the provider again");
    assert.equal(await geocodeMapAddress("  "), null);
  } finally { globalThis.fetch = originalFetch; }
});
