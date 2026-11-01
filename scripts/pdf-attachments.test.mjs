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

test("Cloudinary PDF originals use a short-lived signed API download for this account only", () => {
  const calls = [];
  const { getCloudinaryOriginalDownloadUrl } = loadTs("lib/cloudinary.ts", {
    cloudinary: { v2: {
      config() {},
      utils: { private_download_url: (...args) => { calls.push(args); return "https://api.cloudinary.com/signed"; } },
    } },
  }, { process: { env: { CLOUDINARY_CLOUD_NAME: "test", CLOUDINARY_API_KEY: "key", CLOUDINARY_API_SECRET: "secret" } } });
  assert.equal(getCloudinaryOriginalDownloadUrl("https://res.cloudinary.com/test/raw/upload/v123/inbound/customer%20report.pdf"), "https://api.cloudinary.com/signed");
  assert.equal(calls[0][0], "inbound/customer report.pdf");
  assert.equal(calls[0][1], "");
  assert.equal(calls[0][2].resource_type, "raw");
  assert.equal(calls[0][2].type, "upload");
  assert.ok(calls[0][2].expires_at > Date.now() / 1000);
  assert.ok(calls[0][2].expires_at <= Date.now() / 1000 + 60);
  getCloudinaryOriginalDownloadUrl("https://res.cloudinary.com/test/image/upload/v123/inbound/report.pdf");
  assert.equal(calls[1][0], "inbound/report");
  assert.equal(calls[1][1], "pdf");
  for (const url of [
    "https://res.cloudinary.com/other/raw/upload/file.pdf",
    "https://example.test/test/raw/upload/file.pdf",
    "https://res.cloudinary.com.evil.test/test/raw/upload/file.pdf",
    "http://res.cloudinary.com/test/raw/upload/file.pdf",
    "https://res.cloudinary.com/test/raw/upload/file.jpg",
  ]) assert.equal(getCloudinaryOriginalDownloadUrl(url), null);
  assert.equal(calls.length, 2);
});

test("dashboard PDF downloads and previews proxy signed original bytes without exposing the signed URL", async () => {
  const requests = [];
  const signedUrl = "https://api.cloudinary.com/signed?signature=server-only";
  const { GET } = loadTs("app/api/admin/download-photo/route.ts", {
    "@/lib/cloudinary": { getCloudinaryOriginalDownloadUrl: () => signedUrl },
  }, {
    fetch: async (url) => {
      requests.push(url);
      return new Response(pdf, { headers: { "content-type": "application/octet-stream" } });
    },
  });
  for (const inline of [false, true]) {
    const response = await GET({ nextUrl: new URL(`https://example.test/api?url=https://res.cloudinary.com/test/raw/upload/report.pdf&name=report.pdf${inline ? "&inline=1" : ""}`) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.equal(response.headers.get("content-disposition"), `${inline ? "inline" : "attachment"}; filename="report.pdf"`);
    assert.equal(response.headers.get("location"), null);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
  }
  assert.deepEqual(requests, [signedUrl, signedUrl]);
});
