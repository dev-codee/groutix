import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const { photoPreviewUrl } = loadTs('lib/photoPreview.ts');
test('existing cloud HEIC/HEIF photos use JPEG previews and leave originals untouched', () => {
  for (const extension of ['HEIC', 'heif']) {
    const url = `https://res.cloudinary.com/example/image/upload/v123/job/photo.${extension}`;
    assert.equal(photoPreviewUrl({ url }), url.replace('/upload/', '/upload/f_jpg/'));
    assert.equal(photoPreviewUrl({ url: 'https://example.com/photo.HEIC' }), 'https://example.com/photo.HEIC');
  }
  assert.equal(photoPreviewUrl({ url: 'data:image/jpeg;base64,abc' }), 'data:image/jpeg;base64,abc');
  assert.equal(photoPreviewUrl({ url: 'https://res.cloudinary.com/example/image/upload/photo.jpg' }), 'https://res.cloudinary.com/example/image/upload/photo.jpg');
});

test('multi-photo uploads bypass the app payload limit, preserve successes and continue after a failure', async () => {
  const requests = [], saved = [];
  const files = ['one.HEIC', 'broken.png', 'three.jpg'].map(name => new File(['photo'], name, { type: 'image/heic' }));
  const { uploadJobPhotos } = loadTs('lib/uploadJobPhotos.ts', {}, { FormData, fetch: async (url, options) => {
    requests.push({ url, options });
    if (!options?.method) return Response.json({ direct: true, cloudName: 'example', apiKey: 'key', signature: 'signed', uploadParams: { folder: 'groutix/leads/lead', format: 'jpg', timestamp: 1 } });
    if (url.includes('api.cloudinary.com')) {
      assert.equal(options.body.getAll('file').length, 1);
      assert.equal(options.body.get('format'), 'jpg');
      if (options.body.get('file').name === 'broken.png') return Response.json({ error: { message: 'Bad image' } }, { status: 400 });
      return Response.json({ public_id: 'groutix/leads/lead/photo' });
    }
    const metadata = JSON.parse(options.body);
    assert.equal(metadata.name.endsWith('.jpg'), true);
    assert.equal('url' in metadata, false);
    return Response.json({ photos: [{ name: metadata.name }] });
  } });
  const errors = await uploadJobPhotos('lead', files, photos => saved.push(photos));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /broken.png: Bad image/);
  assert.equal(saved.length, 2);
  assert.equal(requests.filter(request => request.url.includes('api.cloudinary.com')).length, 3);
});

test('authenticated photo saves verify cloud assets and append without replacing existing photos', async () => {
  const calls = [];
  const { POST, GET } = loadTs('app/api/admin/submissions/[id]/photos/route.ts', {
    '@/lib/mongodb': { isMongoConfigured: () => true },
    '@/lib/adminAuth': { verifyRequestSession: async req => req.authorized ? { username: 'staff' } : null },
    '@/lib/submissions': { getSubmission: async () => ({ photos: [{ name: 'existing.jpg' }] }), appendSubmissionPhotos: async (_id, photos) => { calls.push(photos); return [{ name: 'existing.jpg' }, ...photos]; }, appendActivity: async () => {} },
    '@/lib/cloudinary': { isCloudinaryConfigured: () => true, getCloudinary: () => ({ api: { resource: async id => ({ public_id: id, secure_url: 'https://res.cloudinary.com/example/image/upload/photo.jpg', format: 'jpg', bytes: 42 }) } }) },
  });
  const ctx = { params: Promise.resolve({ id: 'lead' }) };
  assert.equal((await GET({}, ctx)).status, 401);
  const request = publicId => ({ authorized: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ publicId, name: 'photo.jpg', url: 'https://untrusted.example/file' }) });
  assert.equal((await POST(request('other/customer'), ctx)).status, 400);
  const result = await POST(request('groutix/leads/lead/photo'), ctx);
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.equal(data.photos.length, 2);
  assert.equal(calls[0][0].uploadedBy, 'staff');
  assert.equal(calls[0][0].contentType, 'image/jpeg');
  assert.equal(calls[0][0].url.includes('untrusted'), false);
});

test('multipart HEIC conversion requests JPEG without changing other upload formats', async () => {
  const options = [];
  const { uploadBufferToCloudinary } = loadTs('lib/cloudinary.ts', {
    cloudinary: { v2: { config() {}, uploader: { upload_stream: (parameters, done) => {
      options.push(parameters);
      return { end: () => done(null, { url: 'https://example.com/photo.jpg', secure_url: 'https://example.com/photo.jpg', public_id: 'photo', format: 'jpg', bytes: 42 }) };
    } } } },
  });
  await uploadBufferToCloudinary(Buffer.from('photo'), { filename: 'photo.HEIC', format: 'jpg' });
  await uploadBufferToCloudinary(Buffer.from('photo'), { filename: 'photo.png' });
  assert.equal(options[0].format, 'jpg');
  assert.equal(options[1].format, undefined);
  assert.equal(options[1].fetch_format, 'auto');
});
