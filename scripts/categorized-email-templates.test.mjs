import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { CATEGORIZED_EMAIL_TEMPLATES: imported } = loadTs("lib/categorizedEmailTemplates.ts");
const { EMAIL_TEMPLATES, renderEmailTemplate, extractTemplateTags, DYNAMIC_EMAIL_TAGS } = loadTs("lib/emailTemplates.ts");

test("all 44 document templates retain their categories, lists, signatures and supported merge codes", () => {
  assert.equal(imported.length, 44);
  assert.equal(new Set(imported.map(t => t.id)).size, 44);
  assert.deepEqual(Object.values(Object.groupBy(imported, t => t.category)).map(group => group.length), [2, 5, 1, 15, 12, 4, 5]);
  const knownTags = new Set(DYNAMIC_EMAIL_TAGS.map(t => t.tag.slice(1, -1)));
  for (const template of imported) {
    assert.ok(EMAIL_TEMPLATES.some(t => t.id === template.id));
    assert.ok(template.subject && template.body);
    assert.ok(template.body.includes("Kind regards,\nAlex Lee\nOffice Manager\n{company_phone}"));
    assert.ok(!template.body.includes("Dear {company_name}"));
    for (const tag of extractTemplateTags(template.body)) assert.ok(knownTags.has(tag), tag);
  }
  assert.ok(imported.find(t => t.id === "categorized_photo_request_balcony").body.includes("• Clear photos of all drains"));
  assert.ok(imported.find(t => t.id === "categorized_job_scheduled_epoxy_grouting").body.includes("4 full days (96 hours)"));
});

test("customer greetings, separate arrival times, and document links render correctly", () => {
  const ctx = { name: "Jun Yi Li", jobAt: "2026-10-28T09:00", inspectionAt: "2026-10-27T13:00" };
  const booking = imported.find(t => t.id === "categorized_job_scheduled_general");
  const rendered = renderEmailTemplate(booking, ctx);
  assert.ok(rendered.body.startsWith("Dear Jun Yi Li,"));
  assert.match(rendered.body, /Arrival Time: 9:00\s*am/i);
  const inspection = imported.find(t => t.id === "categorized_warranty_inspection_booking_confirmation");
  assert.match(renderEmailTemplate(inspection, ctx).body, /Arrival Time: 1:00\s*pm/i);
  const quote = imported.find(t => t.id === "categorized_quote_ready_photo_assessment_general");
  assert.ok(renderEmailTemplate(quote, ctx).body.includes("{document}"));
  assert.ok(renderEmailTemplate(quote, { ...ctx, document: "https://example.com/quote" }).body.includes("https://example.com/quote"));
  assert.match(renderEmailTemplate(booking, {}).body, /Arrival Time: Arrival time TBC/);
  for (const template of imported) {
    const { body } = renderEmailTemplate(template, ctx);
    assert.equal(extractTemplateTags(body).filter(tag => tag !== "document").length, 0);
  }
});

test("existing installations receive the catalog once without overwriting edits or restoring later deletions", async () => {
  const edited = { ...imported[0], body: "Staff edited this template", isCustom: true };
  let docs = [{ id: "staff", name: "Staff template", category: "General", subject: "Custom", body: "Keep me", isCustom: true }, edited];
  let marker = null;
  let batches = 0;
  const col = {
    countDocuments: async () => docs.length,
    bulkWrite: async ops => {
      batches++;
      for (const { updateOne: op } of ops) if (!docs.some(t => t.id === op.filter.id)) docs.push(op.update.$setOnInsert);
    },
    find: () => ({ sort: () => ({ toArray: async () => docs }) }),
  };
  const { listDbTemplates } = loadTs("lib/emailTemplatesDb.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => ({ collection: name => {
      if (name === "email_templates") return col;
      assert.equal(name, "crm_migrations");
      return { findOne: async () => marker, updateOne: async () => { marker = { appliedAt: "now" }; } };
    } }) },
    "@/lib/email": { cleanEmailText: text => text },
  });
  const first = await listDbTemplates();
  assert.equal(first.length, 45);
  assert.equal(first.find(t => t.id === edited.id).body, edited.body);
  assert.equal(first.find(t => t.id === "staff").body, "Keep me");
  docs = docs.filter(t => t.id !== imported[1].id);
  const second = await listDbTemplates();
  assert.equal(second.length, 44);
  assert.equal(batches, 1);
});

test("quote acceptance sits between quote sent and job booked in manual manager status options", () => {
  const { MANAGER_STATUS_OPTIONS_LIST: options } = loadTs("lib/adminHelpers.ts");
  const i = options.indexOf("Won");
  assert.ok(i > 0);
  assert.equal(options[i - 1], "Quote Sent");
  assert.equal(options[i + 1], "Job Booked");
});
