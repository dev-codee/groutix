import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function fixture(enabled) {
  const sent = [];
  const email = loadTs("lib/email.ts", {
    nodemailer: { createTransport: () => ({ sendMail: async message => sent.push(message) }) },
  }, { process: { env: {
    SMTP_USER: "info@example.test", SMTP_PASS: "fixture-only",
    ...(enabled === undefined ? {} : { CRM_EMAIL_ALERTS_ENABLED: enabled }),
  } } });
  return { email, sent };
}

test("internal alerts are disabled by default while customer emails still send", async () => {
  for (const enabled of [undefined, "false"]) {
    const { email, sent } = fixture(enabled);
    await email.sendReplyNotification({ leadName: "Customer", leadEmail: "customer@example.test" });
    await email.sendInternalAlert({ title: "Booking updated", lines: ["Updated in the CRM"] });
    assert.equal(sent.length, 0);
    await email.sendEmail({ toEmail: "customer@example.test", subject: "Your reply", html: "<p>Hello</p>" });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "customer@example.test");
  }
});

test("internal alerts require explicit opt-in", async () => {
  const { email, sent } = fixture("true");
  await email.sendReplyNotification({ leadEmail: "customer@example.test" });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "info@example.test");
});
