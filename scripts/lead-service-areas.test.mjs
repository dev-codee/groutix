import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadTs } from "./test-ts-loader.mjs";

const { LeadServiceAreas } = loadTs("components/admin/LeadServiceAreas.tsx");

test("lead cards display every saved room and do not invent missing selections", () => {
  const html = renderToStaticMarkup(createElement(LeadServiceAreas, { areas: "Ensuite Bathroom, Main Bathroom, Other" }));
  for (const value of ["Areas to service:", "Ensuite Bathroom", "Main Bathroom", "Other"]) assert.ok(html.includes(value));
  for (const areas of [undefined, "", "   "]) {
    const empty = renderToStaticMarkup(createElement(LeadServiceAreas, { areas }));
    assert.ok(empty.includes("Not provided"));
    assert.ok(!empty.includes("Ensuite"));
  }
});
