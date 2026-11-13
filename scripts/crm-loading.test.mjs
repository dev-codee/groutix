import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

function loader(fetch) {
  return loadTs('lib/loadCrmLeads.ts', {}, { fetch, URLSearchParams });
}

test('loads every lead beyond 500 with bounded concurrency and no implicit date filter', async () => {
  const records = Array.from({ length: 551 }, (_, i) => ({ id: String(i), status: 'New' }));
  let active = 0, peak = 0;
  const { loadCrmLeads } = loader(async (url, options) => {
    assert.ok(options.signal);
    const query = new URL(url, 'https://example.com').searchParams;
    assert.equal(query.get('view'), 'dashboard');
    assert.equal(query.has('all'), false);
    assert.equal(query.has('to'), false, 'legacy string dates and future-dated records must not disappear');
    const page = Number(query.get('page')), size = Number(query.get('pageSize'));
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setImmediate(resolve));
    --active;
    return { ok: true, status: 200, json: async () => ({ items: records.slice((page - 1) * size, page * size), total: records.length }) };
  });
  const items = await loadCrmLeads(new AbortController().signal);
  assert.equal(items.length, 551);
  assert.equal(items[550].id, '550');
  assert.equal(peak, 3);
});

test('failed, expired, aborted and inconsistent reads never return a partial dashboard', async () => {
  for (const [fetch, expected] of [
    [async () => ({ ok: false, status: 401 }), /session has expired/],
    [async () => ({ ok: false, status: 503 }), /Could not load leads/],
    [async () => ({ ok: true, json: async () => ({ items: [], total: 2 }) }), /changed while loading/],
    [async () => ({ ok: true, json: async () => ({ items: [{ id: 'same' }, { id: 'same' }], total: 2 }) }), /changed while loading/],
    [async () => ({ ok: true, json: async () => ({ items: [] }) }), /incomplete response/],
  ]) await assert.rejects(loader(fetch).loadCrmLeads(new AbortController().signal), expected);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loader(async () => ({ ok: true, json: async () => ({ items: [], total: 0 }) })).loadCrmLeads(controller.signal));
});

test('quote editors fetch complete scopes and preserve the selected booking; failures cannot use summaries', async () => {
  const summary = { id: 'lead', dashboardSummary: true, quoteItems: [{ price: 100 }], activeBooking: { type: 'job', start: '2026-11-15T09:00' } };
  const full = { id: 'lead', quoteItems: [{ price: 100, scope: 'The complete saved scope' }] };
  let calls = 0;
  const { loadLeadDetails } = loader(async () => { ++calls; return { ok: true, json: async () => ({ item: full }) }; });
  const detail = await loadLeadDetails(summary);
  assert.equal(detail.quoteItems[0].scope, full.quoteItems[0].scope);
  assert.equal(detail.activeBooking, summary.activeBooking);
  assert.equal(detail.dashboardSummary, undefined);
  assert.equal(await loadLeadDetails(full), full);
  assert.equal(calls, 1);
  await assert.rejects(loader(async () => ({ ok: false, status: 503 })).loadLeadDetails(summary), /Could not load/);
});

test('real MongoDB summary keeps counts, inbox, prices and acceptance but excludes images and repeated scopes', { skip: !process.env.MONGODB_TEST_BINARY }, async () => {
  const { spawn } = await import('node:child_process');
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { MongoClient, ObjectId } = await import('mongodb');
  const path = await mkdtemp(join(tmpdir(), 'groutix-crm-test-'));
  const port = 27139;
  const processHandle = spawn(process.env.MONGODB_TEST_BINARY, ['--dbpath', path, '--bind_ip', '127.0.0.1', '--port', String(port), '--quiet'], { stdio: 'ignore' });
  const client = new MongoClient(`mongodb://127.0.0.1:${port}`, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db('crm_loading_test');
    const docs = Array.from({ length: 40 }, (_, i) => ({ _id: new ObjectId(), type: 'lead', status: 'Quote Sent', createdAt: new Date(Date.UTC(2026, 10, 1, 0, i)),
      quoteSignature: 'data:image/png;base64,' + 'x'.repeat(10000),
      photos: [{ name: 'photo.jpg', url: 'https://example.com/photo.jpg', dataUrl: 'x'.repeat(20000) }],
      quoteItems: [{ service: 'Regrouting', price: 100, qty: 2, scope: 'scope '.repeat(1000), description: 'description '.repeat(1000) }],
      messages: [{ id: 'message', from: 'customer', text: 'Full searchable message body', read: false, time: '2026-11-01' }],
      activity: [{ action: 'Lead edited', detail: 'private history '.repeat(1000) }, { action: 'Arrived notification sent', time: '2026-11-01', detail: 'Specialist arrived' }],
    }));
    await db.collection('submissions').insertMany(docs);
    await db.collection('customer_quotes').insertOne({ leadId: docs[39]._id.toString(), state: 'accepted' });
    const { listSubmissions, getSubmission } = loadTs('lib/submissions.ts', { '@/lib/mongodb': { getDb: async () => db }, '@/lib/users': {} });
    const result = await listSubmissions({ dashboard: true, pageSize: 25 });
    assert.equal(result.total, 40);
    assert.equal(result.items.length, 25);
    const item = result.items[0];
    assert.equal(item.dashboardSummary, true);
    assert.equal(item.hasQuoteSignature, true);
    assert.equal(item.quoteSignature, undefined);
    assert.equal(item.quoteItems[0].scope, undefined);
    assert.equal(item.quoteItems[0].price * item.quoteItems[0].qty, 200);
    assert.equal(item.photos[0].dataUrl, undefined);
    assert.equal(item.photos[0].url, docs[0].photos[0].url);
    assert.equal(item.messages[0].text, 'Full searchable message body');
    assert.equal(item.messages[0].read, false);
    assert.equal(item.activity.length, 1);
    assert.equal(item.activity[0].action, 'Arrived notification sent');
    assert.equal(item.acceptedCustomerQuoteCount, 1);
    const full = await getSubmission(item.id);
    assert.equal(full.quoteItems[0].scope, docs[0].quoteItems[0].scope);
    assert.ok(full.quoteSignature);
    assert.equal(full.activity.length, 2);
    const { hasAcceptedQuote } = loadTs('lib/quoteAcceptance.ts');
    assert.equal(hasAcceptedQuote(item), true);
    assert.ok(JSON.stringify(result.items).length < JSON.stringify(docs.slice(0, 25)).length / 10);
  } finally {
    await client.close();
    const exited = new Promise(resolve => processHandle.once('exit', resolve));
    processHandle.kill('SIGTERM');
    await exited;
    await rm(path, { recursive: true, force: true });
  }
});
