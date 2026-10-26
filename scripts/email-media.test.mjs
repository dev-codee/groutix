import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadTs } from "./test-ts-loader.mjs";

const { emailDisplayText } = loadTs("lib/emailMedia.ts");
const { EmailMessageText } = loadTs("components/admin/EmailMessageText.tsx");

test("only resolved photo placeholders are removed and customer text is preserved", () => {
  const text = "Here are the photos\n[cid:uploaded]\n[cid:missing]\nThanks";
  const clean = emailDisplayText(text, [{ contentId: "<uploaded>", secureUrl: "https://example.com/photo.jpg" }]);
  assert.equal(clean, "Here are the photos\n\n[cid:missing]\nThanks");
  assert.equal(emailDisplayText("[cid:missing]", [{ contentId: "missing" }]), "[cid:missing]");
});

test("Outlook cloud icons are removed and OneDrive shares become safe clickable links", () => {
  const html = renderToStaticMarkup(createElement(EmailMessageText, {
    text: "[https://res-1.cdn.office.net/assets/mail/file-icon/v2/cloud_blue_16x16.png]Ensuite 2.jpg\n<https://1drv.ms/i/c/example/photo>\n<script>alert(1)</script>",
  }));
  assert.ok(!html.includes("cdn.office.net"));
  assert.ok(html.includes("Ensuite 2.jpg"));
  assert.ok(html.includes('href="https://1drv.ms/i/c/example/photo"'));
  assert.ok(html.includes("Open shared OneDrive photo"));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(!html.includes("<script>"));
});
