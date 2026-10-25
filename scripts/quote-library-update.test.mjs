import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { ObjectId } from 'mongodb';
import { loadTs } from './test-ts-loader.mjs';

const memoryLibrary = () => loadTs('lib/quoteTemplates.ts', { '@/lib/mongodb': { isMongoConfigured: () => false } });
const edit = (targetNo = '57', targetCode = 'MB-SS-WF-SH-PG') => ({ targetNo, targetCode, service: 'Edited service', scope: 'Edited work\n• Additional preparation', price: 1299 });

test('replacing a built-in row persists one override and leaves sibling codes and saved quote snapshots alone', async () => {
  const library = memoryLibrary();
  const original = (await library.getAllQuoteTemplates()).find(item => item.no === '57');
  const snapshot = JSON.parse(JSON.stringify(original));
  await library.replaceQuoteTemplate(edit());
  let items = await library.getAllQuoteTemplates();
  const saved = items.find(item => item.no === '57');
  assert.equal(saved.scope, edit().scope);
  assert.equal(saved.price, 1299);
  assert.equal(saved.no, '57');
  assert.equal(saved.isCustom, false);
  assert.equal(items.find(item => item.no === '49').price, 1400);
  assert.equal(items.find(item => item.no === '68').price, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(original)), snapshot);
  await library.replaceQuoteTemplate({ ...edit(), price: 0, scope: 'Latest scope' });
  items = await library.getAllQuoteTemplates();
  assert.equal(items.filter(item => item.no === '57').length, 1);
  assert.equal(items.find(item => item.no === '57').scope, 'Latest scope');
  assert.equal(items.find(item => item.no === '57').price, 0);
  assert.equal(await library.replaceQuoteTemplate(edit('49', 'OLD-CODE')), null);
});

test('save as new keeps the original and replacing a custom item keeps its identity', async () => {
  const library = memoryLibrary();
  const saved = await library.saveCustomQuoteTemplate({ code: 'MB-SS-WF-SH-PG', service: 'My variant', scope: 'My scope', price: 100, isLibraryCopy: true });
  assert.equal((await library.getAllQuoteTemplates()).filter(item => item.code === saved.code).length, 4);
  const replaced = await library.replaceQuoteTemplate(edit(saved.no, saved.code));
  assert.equal(replaced.id, saved.id);
  assert.equal(replaced.no, saved.no);
  const items = await library.getAllQuoteTemplates();
  assert.equal(items.filter(item => item.no === saved.no).length, 1);
  assert.equal(items.find(item => item.no === saved.no).price, 1299);
  assert.equal(items.find(item => item.no === '49').price, 1400);
});

test('MongoDB replacements are durable across module reloads, update custom documents and propagate failures', async () => {
  const documents = [];
  const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => value?.$exists === false ? doc[key] === undefined : String(doc[key]) === String(value));
  const collection = {
    async findOne(filter) { return documents.find(doc => matches(doc, filter)) || null; },
    find() { return { sort() { return { async toArray() { return documents; } }; } }; },
    async updateOne(filter, update, options) {
      let doc = documents.find(doc => matches(doc, filter));
      if (!doc && options?.upsert) { doc = { _id: new ObjectId(), ...update.$setOnInsert }; documents.push(doc); }
      if (doc) Object.assign(doc, update.$set);
    },
  };
  const overrides = { '@/lib/mongodb': { isMongoConfigured: () => true, getDb: async () => ({ collection: () => collection }) } };
  let library = loadTs('lib/quoteTemplates.ts', overrides);
  await library.replaceQuoteTemplate(edit());
  library = loadTs('lib/quoteTemplates.ts', overrides);
  assert.equal((await library.getAllQuoteTemplates()).find(item => item.no === '57').price, 1299);
  await library.replaceQuoteTemplate({ ...edit(), price: 55 });
  assert.equal(documents.filter(doc => doc.replacesNo === '57').length, 1);
  documents.push({ _id: new ObjectId(), no: 'CUST-OLD', code: 'CUSTOM', service: 'Old custom', scope: 'Old', price: 1, createdAt: new Date() });
  await library.replaceQuoteTemplate(edit('CUST-OLD', 'CUSTOM'));
  assert.equal(documents.find(doc => doc.no === 'CUST-OLD').price, 1299);
  assert.equal(documents.length, 2);
  collection.updateOne = async () => { throw new Error('Database write failed'); };
  await assert.rejects(() => library.replaceQuoteTemplate(edit()), /Database write failed/);
});

test('replacement API checks authentication, input, stale targets and write errors', async () => {
  let authenticated = true;
  let result = { no: '57', ...edit() };
  let writes = 0;
  const api = loadTs('app/api/admin/quote-templates/route.ts', {
    '@/lib/adminAuth': { SESSION_COOKIE: 'session', verifySession: async () => authenticated ? { role: 'manager' } : null },
    '@/lib/quoteTemplates': { replaceQuoteTemplate: async () => { writes++; if (result instanceof Error) throw result; return result; } },
  }, { console: { error() {} } });
  const request = body => ({ cookies: { get: () => ({ value: 'token' }) }, json: async () => body });
  authenticated = false;
  assert.equal((await api.PATCH(request(edit()))).status, 401);
  authenticated = true;
  for (const body of [null, {}, { ...edit(), price: -1 }, { ...edit(), price: '12' }, { ...edit(), service: '' }]) {
    assert.equal((await api.PATCH(request(body))).status, 400);
  }
  assert.equal(writes, 0);
  assert.equal((await api.PATCH(request(edit()))).status, 200);
  result = null;
  assert.equal((await api.PATCH(request(edit()))).status, 404);
  result = new Error('Unavailable');
  assert.equal((await api.PATCH(request(edit()))).status, 503);
});

test('quote builder replaces only on request, handles real API success, and retains quote quantity', async () => {
  const source = fs.readFileSync('app/admin/page.tsx', 'utf8');
  const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleSaveQuoteItemToLibrary') handler = node.getText(tree); ts.forEachChild(node, visit); }
  visit(tree);
  let items = [{ templateNo: '57', code: 'MB-SS-WF-SH-PG', service: 'Edited', scope: 'Edited scope', price: 99, qty: 3 }];
  let confirmed = false;
  const requests = [];
  const feedback = [];
  const context = {
    quoteItems: items, templateSaveInFlight: { current: false }, quoteSaveSession: { current: 1 },
    window: { confirm: () => confirmed, dispatchEvent() {} }, CustomEvent: class {},
    setSavingTemplateIndex() {}, setTemplateSaveFeedback: value => feedback.push(value),
    setQuoteItems: update => { items = typeof update === 'function' ? update(items) : update; },
    fetch: async (_url, options) => { requests.push(options); return { ok: true, json: async () => ({ ok: true, template: { no: options.method === 'PATCH' ? '57' : 'CUST-1', code: 'MB-SS-WF-SH-PG' } }) }; },
  };
  const script = ts.transpileModule(`${handler}; globalThis.run = handleSaveQuoteItemToLibrary`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(script, context);
  await context.run(0, 'replace');
  assert.equal(requests.length, 0);
  confirmed = true;
  await context.run(0, 'replace');
  assert.equal(requests[0].method, 'PATCH');
  assert.equal(JSON.parse(requests[0].body).targetNo, '57');
  assert.equal(items[0].qty, 3);
  assert.equal(items[0].scope, 'Edited scope');
  assert.equal(feedback.at(-1).ok, true);
  await context.run(0, 'new');
  assert.equal(requests[1].method, 'POST');
  assert.equal(items[0].templateNo, 'CUST-1');
  assert.equal(feedback.at(-1).ok, true);
});
