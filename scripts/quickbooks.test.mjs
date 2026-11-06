import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const invoice = (extra = {}) => ({ invoiceNumber: 'INV-1820', customerName: "Sam O'Brien", gstRate: 10,
  items: [{ description: 'Regrouting', amount: 3465 }, { description: 'Additional work', amount: 100 }], ...extra });
function harness(options = {}) {
  let token = options.disconnected ? null : { realmId: 'company', accessToken: 'access', refreshToken: 'refresh',
    accessExpiresAt: Date.now() + 3600000, refreshExpiresAt: Date.now() + 86400000, ...options.token };
  const calls = [], invoices = [], requests = new Map(), tokenWrites = [];
  const codes = options.codes ?? [
    { Id: 'purchase', Taxable: true, PurchaseTaxRateList: { TaxRateDetail: [{ TaxRateRef: { value: 'gst' } }] } },
    { Id: 'sales-gst', Active: true, SalesTaxRateList: { TaxRateDetail: [{ TaxRateRef: { value: 'gst' }, TaxTypeApplicable: 'TaxOnAmount' }] } },
    { Id: 'zero', Active: true, Taxable: false },
  ];
  const rates = options.rates ?? [{ Id: 'gst', Active: true, RateValue: 10 }];
  let lostResponse = options.lostResponse;
  const qbo = loadTs('lib/quickbooks.ts', { './mongodb': { getDb: async () => {
    if (options.dbFail) throw new Error('Storage unavailable');
    return { collection: () => ({ findOne: async () => token, updateOne: async (_filter, update) => {
      tokenWrites.push(update.$set); token = { ...token, ...update.$set };
    } }) };
  } } }, { URLSearchParams, process: { env: { QBO_CLIENT_ID: 'id', QBO_CLIENT_SECRET: 'secret', ...options.env } },
    fetch: async (url, request = {}) => {
      calls.push({ url, ...request });
      const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
      if (url.includes('/tokens/bearer')) return options.invalidGrant ? reply({ error: 'invalid_grant' }, 400)
        : reply({ access_token: 'renewed', refresh_token: 'rotated', expires_in: 3600, x_refresh_token_expires_in: 8640000 });
      if (options.networkFail) throw new Error('Network unavailable');
      if (url.includes('/companyinfo/')) return reply({ CompanyInfo: {} }, options.revoked ? 401 : 200);
      const parsed = new URL(url), query = parsed.searchParams.get('query') || '';
      if (query.includes('FROM Invoice')) return reply({ QueryResponse: { Invoice: options.emptyLookups ? [] : invoices } });
      if (query.includes('FROM TaxCode')) return reply({ QueryResponse: { TaxCode: codes } });
      if (query.includes('FROM TaxRate')) return reply({ QueryResponse: { TaxRate: rates } });
      if (query.includes('FROM Customer')) return reply({ QueryResponse: { Customer: [{ Id: 'customer' }] } });
      if (request.method === 'POST' && parsed.pathname.endsWith('/invoice')) {
        const key = parsed.searchParams.get('requestid');
        if (!requests.has(key)) {
          const body = JSON.parse(request.body);
          const created = { Id: String(invoices.length + 1), DocNumber: body.DocNumber, TotalAmt: body.Line.reduce((sum, line) => sum + line.Amount, 0) + body.TxnTaxDetail.TotalTax };
          invoices.push(created); requests.set(key, created);
        }
        if (lostResponse) { lostResponse = false; throw new Error('Response lost after QBO created invoice'); }
        return reply({ Invoice: requests.get(key) });
      }
      throw new Error(`Unexpected request: ${url}`);
    } });
  return { qbo, calls, invoices, tokenWrites };
}

test('GST-inclusive invoices retain the emailed total, correct GST and company sales tax code', async () => {
  const h = harness();
  await h.qbo.pushInvoiceToQbo(invoice());
  const payload = JSON.parse(h.calls.find(call => call.method === 'POST').body);
  assert.equal(payload.GlobalTaxCalculation, 'TaxInclusive');
  assert.equal(payload.TxnTaxDetail.TotalTax, 324.09);
  assert.equal(payload.Line.reduce((sum, line) => sum + Math.round(line.Amount * 100), 0), 324091);
  assert.equal(h.invoices[0].TotalAmt, 3565);
  assert.deepEqual(payload.Line.map(line => line.SalesItemLineDetail.TaxInclusiveAmt), [3465, 100]);
  assert.ok(payload.Line.every(line => line.SalesItemLineDetail.TaxCodeRef.value === 'sales-gst'));
});

test('zero GST uses a non-taxable code, and missing or mismatched codes prevent invoice creation', async () => {
  const zero = harness();
  await zero.qbo.pushInvoiceToQbo(invoice({ gstRate: 0 }));
  const payload = JSON.parse(zero.calls.find(call => call.method === 'POST').body);
  assert.equal(payload.TxnTaxDetail.TotalTax, 0);
  assert.equal(payload.Line[0].SalesItemLineDetail.TaxCodeRef.value, 'zero');
  for (const h of [harness({ codes: [] }), harness({ env: { QBO_SALES_TAX_CODE_ID: 'purchase' } })]) {
    await assert.rejects(h.qbo.pushInvoiceToQbo(invoice()), /No active QuickBooks sales tax code/);
    assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
  }
});

test('resends and lost responses reuse an existing QuickBooks invoice', async () => {
  const h = harness();
  assert.equal(await h.qbo.pushInvoiceToQbo(invoice()), '1');
  assert.equal(await h.qbo.pushInvoiceToQbo(invoice()), '1');
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
  const lost = harness({ lostResponse: true });
  await assert.rejects(lost.qbo.pushInvoiceToQbo(invoice()), /Response lost/);
  assert.equal(await lost.qbo.pushInvoiceToQbo(invoice()), '1');
  assert.equal(lost.invoices.length, 1);
});

test('concurrent creates use the same bounded request ID even before queries see the invoice', async () => {
  const h = harness({ emptyLookups: true });
  const ids = await Promise.all([h.qbo.pushInvoiceToQbo(invoice()), h.qbo.pushInvoiceToQbo(invoice())]);
  assert.deepEqual(ids, ['1', '1']);
  assert.equal(h.invoices.length, 1);
  const keys = h.calls.filter(call => call.method === 'POST').map(call => new URL(call.url).searchParams.get('requestid'));
  assert.equal(new Set(keys).size, 1);
  assert.ok(keys[0].length <= 50);
});

test('expired, revoked and unavailable connections never report connected', async () => {
  for (const options of [{ token: { refreshExpiresAt: Date.now() - 1 } }, { token: { refreshHardExpiresAt: Date.now() - 1 } }, { revoked: true }, { token: { accessExpiresAt: 0 }, invalidGrant: true }]) {
    const h = harness(options), status = await h.qbo.getQboStatus();
    assert.equal(status.connected, false);
    assert.equal(status.reconnectRequired, true);
    assert.ok(status.connectionError);
  }
  for (const options of [{ dbFail: true }, { networkFail: true }]) {
    const status = await harness(options).qbo.getQboStatus();
    assert.equal(status.connected, false);
    assert.equal(status.reconnectRequired, false);
    assert.match(status.connectionError, /Could not verify/);
  }
  assert.equal((await harness({ disconnected: true }).qbo.getQboStatus()).connected, false);
});

test('expired access renews and persists rotated tokens before confirming live access', async () => {
  const h = harness({ token: { accessExpiresAt: 0 } });
  const status = await h.qbo.getQboStatus();
  assert.equal(status.connected, true);
  assert.equal(h.tokenWrites[0].refreshToken, 'rotated');
  assert.equal(h.calls.find(call => call.url.includes('/companyinfo/')).headers.Authorization, 'Bearer renewed');
});

const savedLead = () => ({ id: 'customer123', name: 'Sam', status: 'Job Done', invoiceNumber: 'INV-123', invoiceAmount: 1100,
  invoiceDraft: { service: 'Regrouting', description: 'Saved work', basePrice: 1000, extraWork: 'Extra', extraCharge: 100, gst: 10 } });

test('manual sync uses saved invoice data and records its result without email or workflow changes', async () => {
  const writes = [], activities = [], pushes = [];
  const sync = loadTs('lib/quickbooksInvoiceSync.ts', {
    './quickbooks': { isQboConfigured: () => true, pushInvoiceToQbo: async input => { pushes.push(input); return 'qbo-123'; } },
    './submissions': { updateSubmission: async (_id, updates) => { writes.push(updates); return true; }, appendActivity: async (_id, entry) => activities.push(entry) },
  }, { Error });
  const lead = savedLead();
  const result = await sync.syncInvoiceToQuickbooks(lead, 'finance');
  assert.equal(result.item.qboInvoiceId, 'qbo-123');
  assert.equal(result.item.status, 'Job Done');
  assert.equal(result.item.invoiceSentAt, undefined);
  assert.equal(pushes[0].gstRate, 10);
  assert.equal(pushes[0].items.reduce((sum, item) => sum + item.amount, 0), 1100);
  assert.equal(writes[0].status, undefined);
  assert.equal(writes[0].invoiceSentAt, undefined);
  assert.equal(activities[0].actor, 'finance');
  assert.equal((await sync.syncInvoiceToQuickbooks(result.item, 'finance')).alreadySynced, true);
  assert.equal(pushes.length, 1);
  await assert.rejects(sync.syncInvoiceToQuickbooks({ ...lead, invoiceAmount: 1200 }, 'finance'), /does not match/);
});

test('sync failure is persisted and is available for a manual retry', async () => {
  const writes = [];
  let fail = true;
  const sync = loadTs('lib/quickbooksInvoiceSync.ts', {
    './quickbooks': { isQboConfigured: () => true, pushInvoiceToQbo: async () => { if (fail) throw new Error('Reconnect QuickBooks'); return 'recovered'; } },
    './submissions': { updateSubmission: async (_id, update) => { writes.push(update); return true; }, appendActivity: async () => {} },
  }, { Error });
  await assert.rejects(sync.syncInvoiceToQuickbooks(savedLead(), 'finance'), /Reconnect/);
  assert.equal(writes[0].qboError, 'Reconnect QuickBooks');
  fail = false;
  const result = await sync.syncInvoiceToQuickbooks(savedLead(), 'finance');
  assert.equal(result.item.qboInvoiceId, 'recovered');
  assert.equal(result.item.qboError, '');
});

test('manual endpoint enforces finance access and rejects unsaved invoices before syncing', async () => {
  let role = null, lead = savedLead(), synced = 0;
  const { POST } = loadTs('app/api/admin/invoice/quickbooks/route.ts', {
    '@/lib/adminAuth': { verifyRequestSession: async () => role ? { role, username: 'staff' } : null },
    '@/lib/submissions': { getSubmission: async () => lead },
    '@/lib/quickbooksInvoiceSync': { syncInvoiceToQuickbooks: async item => { synced++; return { item: { ...item, qboInvoiceId: '123' } }; } },
  });
  const request = () => ({ json: async () => ({ id: 'customer123', price: 99999 }) });
  assert.equal((await POST(request())).status, 401);
  for (role of ['intake', 'inspection', 'technician']) assert.equal((await POST(request())).status, 403);
  role = 'finance'; lead = { ...lead, invoiceNumber: undefined };
  assert.equal((await POST(request())).status, 400);
  assert.equal(synced, 0);
  lead = savedLead();
  for (role of ['finance', 'manager', 'super_admin']) {
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).item.invoiceAmount, 1100, 'client cannot override the saved amount');
  }
});

test('finance button blocks rapid double clicks, shows errors and confirms a successful retry', async () => {
  const states = [], requests = [], upserts = [];
  let cursor = 0, fail = true;
  const react = { useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; } };
  const { SendInvoiceToQuickBooksButton } = loadTs('components/admin/SendInvoiceToQuickBooksButton.tsx', {
    react, './AdminPageContext': { useAdminPageCtx: () => ({ role: 'finance', upsertLead: item => upserts.push(item) }) },
  }, { fetch: async (url, options) => { requests.push({ url, ...options }); return { ok: !fail, json: async () => fail ? { error: 'Reconnect QuickBooks' } : { ok: true, item: { ...savedLead(), qboInvoiceId: '123' } } }; } });
  const flatten = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(flatten) : [node, ...flatten(node.props?.children)];
  const render = () => { cursor = 0; return flatten(SendInvoiceToQuickBooksButton({ lead: savedLead() })); };
  let tree = render(), button = tree.find(node => node.type === 'button');
  const pending = button.props.onClick(); await button.props.onClick(); await pending;
  assert.equal(requests.length, 1);
  tree = render(); assert.equal(tree.find(node => node.props?.role === 'alert').props.children, 'Reconnect QuickBooks');
  assert.equal(tree.find(node => node.type === 'button').props.disabled, false);
  fail = false; await tree.find(node => node.type === 'button').props.onClick();
  tree = render(); assert.equal(tree.find(node => node.type === 'button').props.disabled, true);
  assert.equal(upserts[0].qboInvoiceId, '123');
  assert.deepEqual(JSON.parse(requests[0].body), { id: 'customer123' });
});

test('email send awaits shared sync bookkeeping and resending a linked invoice skips creation', async () => {
  const lead = { ...savedLead(), email: 'sam@example.com' };
  let syncCalls = 0, release, completed = false;
  const { POST } = loadTs('app/api/admin/invoice/send/route.ts', {
    '@/lib/submissions': { getSubmission: async () => lead, updateSubmission: async () => true, appendActivity: async () => {} },
    '@/lib/adminAuth': { verifyRequestSession: async () => ({ username: 'finance', role: 'finance' }) },
    '@/lib/email': { isEmailConfigured: () => true, sendEmail: async () => {}, getEmailLogoUrl: async () => '', wrapEmailHtml: html => html },
    '@/lib/quotePdf': { buildQuotePdfBase64: async () => 'cGRm' },
    '@/lib/automations': { invoiceTrackingPixel: () => '' },
    '@/lib/quickbooks': { isQboConfigured: () => true },
    '@/lib/quickbooksInvoiceSync': { syncInvoiceToQuickbooks: async item => {
      syncCalls++; assert.equal(item.invoiceAmount, 1100); assert.equal(item.invoiceDraft.gst, 10);
      await new Promise(resolve => { release = resolve; });
    } },
  });
  const request = () => ({ json: async () => ({ id: lead.id, price: 1100, gst: 10, extraCharge: 100 }) });
  const pending = POST(request()).then(response => { completed = true; return response; });
  await new Promise(setImmediate);
  assert.equal(syncCalls, 1);
  assert.equal(completed, false, 'sync result must be recorded before the request ends');
  release(); assert.equal((await pending).status, 200);
  lead.qboInvoiceId = 'already-synced';
  assert.equal((await POST(request())).status, 200);
  assert.equal(syncCalls, 1, 'resending customer email must not create another QBO invoice');
});
