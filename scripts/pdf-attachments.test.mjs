import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const pdf = Buffer.from("%PDF-1.7\noriginal document bytes\n%%EOF");

test("PDF uploads retain bytes and use raw storage without image transformations", async () => {
  let options, uploaded;
  const { uploadBufferToCloudinary } = loadTs("lib/cloudinary.ts", {
    cloudinary: { v2: { uploader: { upload_stream: (opts, done) => {
      options = opts;
      return { end(bytes) { uploaded = bytes; done(null, { secure_url: "https://example.test/file.pdf", public_id: opts.public_id, bytes: bytes.length }); } };
    } } } },
  });
  await uploadBufferToCloudinary(pdf, { filename: "customer.pdf" });
  assert.equal(options.resource_type, "raw");
  assert.equal(options.fetch_format, undefined);
  assert.equal(options.quality, undefined);
  assert.match(options.public_id, /\.pdf$/);
  assert.equal(uploaded, pdf);
  await assert.rejects(uploadBufferToCloudinary(Buffer.from("PNG"), { filename: "broken.pdf" }), /does not contain a PDF/);
});

for (const valid of [true, false]) {
  test(`download ${valid ? "preserves a real PDF" : "rejects an image named as a PDF"}`, async () => {
    const bytes = valid ? pdf : Buffer.from("\x89PNG\r\n");
    const { GET } = loadTs("app/api/admin/download-photo/route.ts", {}, {
      fetch: async () => ({ ok: true, headers: new Headers({ "content-type": valid ? "application/octet-stream" : "image/png" }), arrayBuffer: async () => Uint8Array.from(bytes).buffer }),
    });
    const result = await GET({ nextUrl: new URL("https://example.test/api?url=https://example.test/file&name=customer.pdf") });
    assert.equal(result.status, valid ? 200 : 422);
    if (valid) {
      assert.equal(result.headers.get("content-type"), "application/pdf");
      assert.deepEqual(Buffer.from(await result.arrayBuffer()), pdf);
    } else assert.match((await result.json()).error, /stored as an image/);
  });
}

test("failed downloads show the server error without saving a fake PDF", async () => {
  let message;
  const { downloadAttachment } = loadTs("lib/downloadAttachment.ts", {}, {
    fetch: async () => ({ ok: false, json: async () => ({ error: "Recover the original PDF" }) }),
    alert: value => { message = value; },
    document: { createElement: () => assert.fail("Error responses must not be downloaded") },
  });
  await downloadAttachment("https://example.test/broken.png", "customer.pdf");
  assert.equal(message, "Recover the original PDF");
});
