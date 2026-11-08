import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';

function setup() {
  const leads = new Map([['customer', { id: 'customer', createdAt: '2026-01-01', type: 'lead', name: 'Sam', email: 'sam@example.com', status: 'Job Done',
    invoiceNumber: 'OLD-1', invoiceAmount: 500, invoiceStatus: 'Paid', qboInvoiceId: 'old-qbo', invoiceOpenedAt: 'old-open',
    paymentReceipt: { number: 'old-receipt' }, paymentType: 'full', amountPaid: 500 }], ['other', { id: 'other', createdAt: '2026-01-01', name: 'Other' }]]);
  const quotes = ['a', 'b', 'draft', 'declined'].map(key => ({ _id: `customer~${key}`, leadId: 'customer', state: key === 'draft' || key === 'declined' ? key : 'accepted', values: {
    quoteNumber: `Q-${key}`, quoteScope: `Work ${key}`, service: 'Regrouting', quoteTaxMode: key === 'b' ? 'none' : 'exclusive', quoteTaxRate: 10,
    quoteItems: [{ service: 'Bathroom', description: `Scope ${key}`, price: 100, qty: 2 }, { service: 'Kitchen', price: 50, qty: 1 }],
  } }));
  const docs = new Map(), activity = []; let seq = 0;
  const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => key === 'values.paymentReceipt' ? !doc.values.paymentReceipt : doc[key] === value);
  const col = {
    findOne: async filter => [...docs.values()].find(doc => matches(doc, filter)) || null,
    find: filter => ({ sort: () => ({ toArray: async () => [...docs.values()].filter(doc => matches(doc, filter)) }) }),
    updateOne: async (filter, update, options) => {
      let doc = [...docs.values()].find(doc => matches(doc, filter));
      if (!doc && options?.upsert) { doc = structuredClone(update.$setOnInsert); docs.set(doc._id, doc); }
      if (!doc) return { matchedCount: 0 };
      for (const [key, value] of Object.entries(update.$set || {})) { const field = key.slice('values.'.length); doc.values[field] = structuredClone(value); }
      return { matchedCount: 1 };
    },
  };
  const api = loadTs('lib/customerInvoices.ts', {
    './mongodb': { getDb: async () => ({ collection: () => col }) },
    './submissions': { getSubmission: async id => structuredClone(leads.get(id) || null), updateSubmission: async (id, update) => { const lead = leads.get(id); if (!lead) return false; Object.assign(lead, structuredClone(update)); return true; },
      appendActivity: async (id, entry) => activity.push({ id, ...entry }), getNextSequence: async () => ++seq, formatDocNumber: (prefix, n) => `${prefix}-${n}` },
    './customerQuotes': { listCustomerQuotes: async id => quotes.filter(quote => quote.leadId === id) },
  }, { Error });
  return { ...api, docs, quotes, leads, activity };
}

test('multiple accepted quotes get distinct invoices and isolate legacy invoice/payment/QBO state', async () => {
  const api = setup();
  const a = await api.createQuoteInvoice('customer', 'customer~a');
  const b = await api.createQuoteInvoice('customer', 'customer~b');
  assert.notEqual(a.id, b.id); assert.notEqual(a.invoiceNumber, b.invoiceNumber);
  assert.equal(a.invoiceAmount, 275); assert.equal(b.invoiceAmount, 250);
  assert.equal(a.invoiceDraft.gst, 10); assert.equal(b.invoiceDraft.gst, 0);
  for (const invoice of [a, b]) {
    assert.equal(invoice.invoiceStatus, 'Unpaid');
    for (const key of ['qboInvoiceId', 'paymentReceipt', 'invoiceOpenedAt', 'amountPaid', 'paymentType']) assert.equal(invoice[key], undefined, key);
    assert.equal(invoice.invoiceDraft.lines.reduce((sum, line) => sum + line.amount, 0), invoice.invoiceAmount);
  }
  assert.equal((await api.listCustomerInvoices('customer')).length, 3);
  assert.equal(api.leads.get('customer').customerInvoiceTotal, 1025);
  assert.equal(api.leads.get('customer').customerInvoiceOutstanding, 525);
  assert.equal(api.leads.get('customer').invoiceNumber, 'OLD-1');
  assert.equal(api.leads.get('customer').status, 'Job Done');
});

test('concurrent repeated creation reuses the same invoice, rejects alternatives and foreign quotes', async () => {
  const api = setup();
  const result = await Promise.all(Array.from({ length: 5 }, () => api.createQuoteInvoice('customer', 'customer~a')));
  assert.equal(new Set(result.map(invoice => invoice.invoiceNumber)).size, 1);
  assert.equal(api.docs.size, 1);
  for (const id of ['customer~draft', 'customer~declined', 'other~a']) await assert.rejects(api.createQuoteInvoice('customer', id));
  await assert.rejects(api.createQuoteInvoice('other', 'customer~a'), /not found/);
  assert.equal(await api.getInvoiceSubmission('other~invoice~a'), null);
});

test('receipt, payment status, open tracking and QBO result belong to their invoice only', async () => {
  const api = setup();
  const a = await api.createQuoteInvoice('customer', 'customer~a');
  const b = await api.createQuoteInvoice('customer', 'customer~b');
  await api.updateInvoiceSubmission(a.id, { invoiceStatus: 'Paid', qboInvoiceId: 'qbo-a', invoiceOpenedAt: 'opened-a' });
  const saved = await api.getInvoiceSubmission(a.id);
  assert.equal(saved.paymentReceipt.invoiceNumber, a.invoiceNumber);
  assert.equal(saved.paymentReceipt.total, 275);
  assert.equal(saved.paymentReceipt.number, `RCT-${a.invoiceNumber}`);
  assert.equal((await api.getInvoiceSubmission(b.id)).invoiceStatus, 'Unpaid');
  assert.equal((await api.getInvoiceSubmission(b.id)).qboInvoiceId, undefined);
  assert.equal(api.leads.get('customer').qboInvoiceId, 'old-qbo');
  assert.equal(api.leads.get('customer').customerInvoiceOutstanding, 250);
  await assert.rejects(api.updateInvoiceSubmission(a.id, { invoiceStatus: 'Unpaid' }), /receipt/);
  await api.appendInvoiceActivity(a.id, { time: 'now', actor: 'finance', action: 'Synced' });
  assert.equal(api.activity[0].id, 'customer');
  await api.saveInvoiceCustomerId(a.id, 'shared-qbo-customer');
  assert.equal((await api.getInvoiceSubmission(b.id)).qboCustomerId, 'shared-qbo-customer');
});

test('quote snapshots and amounts are preserved after a source quote changes; legacy invoice is reused', async () => {
  const api = setup();
  const a = await api.createQuoteInvoice('customer', 'customer~a');
  api.quotes[0].values.quoteItems[0].price = 999;
  const again = await api.createQuoteInvoice('customer', 'customer~a');
  assert.equal(again.invoiceAmount, a.invoiceAmount);
  assert.equal(api.docs.get(a.id).sourceQuoteSnapshot.quoteItems[0].price, 100);
  api.leads.get('customer').quoteReference = 'customer~b';
  assert.equal((await api.createQuoteInvoice('customer', 'customer~b')).invoiceNumber, 'OLD-1');
});

test('quote-linked commercial fields cannot be changed, while payment and bank details can', async () => {
  const api = setup(); const a = await api.createQuoteInvoice('customer', 'customer~a');
  const { invoiceChanges } = loadTs('lib/invoiceDraft.ts', {}, { Error });
  assert.throws(() => invoiceChanges(a, { price: 999, gst: 10 }), /locked/);
  assert.throws(() => invoiceChanges(a, { price: 275, gst: 0 }), /locked/);
  const change = invoiceChanges(a, { price: 275, gst: 10, status: 'Paid', bankName: 'ANZ' });
  assert.equal(change.invoiceStatus, 'Paid');
  assert.equal(change.invoiceDraft.lines.length, 2);
});

test('many small quoted lines allocate rounding without negative amounts or drifting totals', async () => {
  const api = setup();
  api.quotes[0].values.quoteTaxMode = 'inclusive';
  api.quotes[0].values.quoteItems = Array.from({ length: 200 }, () => ({ price: 0.005, qty: 1 }));
  const invoice = await api.createQuoteInvoice('customer', 'customer~a');
  assert.equal(invoice.invoiceAmount, 1);
  assert.ok(invoice.invoiceDraft.lines.every(line => line.amount >= 0));
  assert.equal(invoice.invoiceDraft.lines.reduce((sum, line) => sum + Math.round(line.amount * 100), 0), 100);
});

test('PDF, email, QuickBooks and receipt endpoints operate on the selected invoice reference', async () => {
  const api = setup();
  const a = await api.createQuoteInvoice('customer', 'customer~a');
  const b = await api.createQuoteInvoice('customer', 'customer~b');
  const pdfs = [], emails = [], pushes = [];
  const overrides = {
    '@/lib/customerInvoices': api,
    '@/lib/adminAuth': { verifyRequestSession: async () => ({ role: 'manager', username: 'manager' }) },
    '@/lib/quotePdf': { buildQuotePdfBase64: async input => { pdfs.push(input); return Buffer.from('pdf').toString('base64'); } },
    '@/lib/email': { isEmailConfigured: () => true, sendEmail: async input => emails.push(input), getEmailLogoUrl: async () => '', wrapEmailHtml: html => html },
    '@/lib/automations': { invoiceTrackingPixel: id => `tracking:${id}` },
    '@/lib/quickbooks': { isQboConfigured: () => false },
  };
  const pdfRoute = loadTs('app/api/admin/invoice/pdf/[id]/route.ts', overrides);
  const sendRoute = loadTs('app/api/admin/invoice/send/route.ts', overrides);
  for (const invoice of [a, b]) {
    assert.equal((await pdfRoute.GET({ nextUrl: new URL('https://example.com/pdf') }, { params: Promise.resolve({ id: invoice.id }) })).status, 200);
    const response = await sendRoute.POST({ json: async () => ({ id: invoice.id, price: invoice.invoiceAmount, gst: invoice.invoiceDraft.gst, status: 'Unpaid' }) });
    assert.equal(response.status, 200);
  }
  assert.equal(pdfs[0].quoteNumber, a.invoiceNumber);
  assert.equal(pdfs[2].quoteNumber, b.invoiceNumber);
  assert.equal(pdfs[0].total, 275); assert.equal(pdfs[2].total, 250);
  assert.equal(pdfs[0].items.length, 1);
  assert.equal(pdfs[0].items[0].description, '');
  assert.equal(pdfs[0].items[0].price, 275);
  assert.doesNotMatch(emails[0].html, /Scope a|Quantity:|Source quote:|quote Q-a/);
  assert.match(emails[0].html, new RegExp(`tracking:${a.id}`));
  assert.match(emails[1].html, new RegExp(`tracking:${b.id}`));
  const sync = loadTs('lib/quickbooksInvoiceSync.ts', {
    './customerInvoices': api,
    './quickbooks': { isQboConfigured: () => true, pushInvoiceToQbo: async input => { pushes.push(input); await input.onCustomerResolved('shared-customer'); return `qbo-${input.invoiceNumber}`; } },
  }, { Error });
  await sync.syncInvoiceToQuickbooks(await api.getInvoiceSubmission(a.id), 'manager');
  await sync.syncInvoiceToQuickbooks(await api.getInvoiceSubmission(b.id), 'manager');
  assert.equal(pushes[1].customerId, 'shared-customer');
  assert.equal(pushes[0].items.length, 1);
  assert.equal(pushes[0].items[0].amount, 275);
  assert.doesNotMatch(pushes[0].items[0].description, /Scope a|Quantity:/);
  assert.notEqual((await api.getInvoiceSubmission(a.id)).qboInvoiceId, (await api.getInvoiceSubmission(b.id)).qboInvoiceId);
  const saveRoute = loadTs('app/api/admin/invoice/save/route.ts', overrides);
  assert.equal((await saveRoute.POST({ json: async () => ({ id: a.id, price: 275, gst: 10, status: 'Paid' }) })).status, 200);
  const receiptRoute = loadTs('app/api/admin/invoice/receipt/route.ts', overrides);
  const response = await receiptRoute.GET({ nextUrl: new URL(`https://example.com/receipt?id=${encodeURIComponent(a.id)}`) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).receipt.invoiceNumber, a.invoiceNumber);
  assert.equal((await api.getInvoiceSubmission(b.id)).invoiceStatus, 'Unpaid');
  assert.equal(api.leads.get('customer').invoiceNumber, 'OLD-1');
});

test('invoice creation endpoint requires finance access and rejects an unaccepted quote', async () => {
  const api = setup(); let role = null;
  const route = loadTs('app/api/admin/invoice/customer/[id]/route.ts', {
    '@/lib/customerInvoices': api,
    '@/lib/customerQuotes': { listCustomerQuotes: async () => api.quotes },
    '@/lib/adminAuth': { verifyRequestSession: async () => role ? { role } : null },
  }, { Error });
  const ctx = { params: Promise.resolve({ id: 'customer' }) };
  const req = quoteId => ({ json: async () => ({ quoteId }) });
  assert.equal((await route.POST(req('customer~a'), ctx)).status, 401);
  role = 'technician'; assert.equal((await route.POST(req('customer~a'), ctx)).status, 403);
  role = 'finance'; assert.equal((await route.POST(req('customer~draft'), ctx)).status, 400);
  assert.equal((await route.POST(req('customer~a'), ctx)).status, 200);
  assert.equal(api.docs.size, 1);
});

test('legacy job automation does not send an extra unlinked invoice for multiple quotes', async () => {
  let sends = 0, writes = 0; const activities = [];
  const { autoSendInvoice } = loadTs('lib/automations.ts', {
    '@/lib/submissions': { getSubmission: async () => ({ hasCustomerQuotes: true, quoteAmount: 100, email: 'sam@example.com' }), updateSubmission: async () => writes++, appendActivity: async (_id, entry) => activities.push(entry) },
    '@/lib/email': { sendEmail: async () => sends++, isEmailConfigured: () => true },
    '@/lib/sms': { sendSms: async () => sends++ },
    '@/lib/quotePdf': {},
  });
  await autoSendInvoice('customer');
  assert.equal(sends, 0); assert.equal(writes, 0);
  assert.equal(activities[0].action, 'Invoice requires quote selection');
});


test('existing verbose invoice descriptions are displayed minimally without changing source details or money', async () => {
  const api = setup();
  const invoice = await api.createQuoteInvoice('customer', 'customer~a');
  const stored = api.docs.get(invoice.id);
  stored.values.invoiceDraft.description = 'Source quote: Q-a\nFull bathroom scope\nQuantity: 2 — $220.00';
  const reopened = await api.getInvoiceSubmission(invoice.id);
  assert.equal(reopened.invoiceDraft.description, '');
  assert.equal(reopened.invoiceAmount, 275);
  assert.equal(reopened.invoiceNumber, invoice.invoiceNumber);
  assert.equal(stored.sourceQuoteSnapshot.quoteItems.length, 2);
  assert.equal(reopened.invoiceDraft.lines.length, 2);
  assert.match(stored.values.invoiceDraft.description, /Full bathroom scope/);
});

test('delivery endpoint returns per-invoice timestamps without loading quotes or leaking commercial data', async () => {
  const api = setup();
  const a = await api.createQuoteInvoice('customer', 'customer~a');
  const b = await api.createQuoteInvoice('customer', 'customer~b');
  await api.updateInvoiceSubmission(a.id, { invoiceSentAt: 'sent-a', invoiceOpenedAt: 'opened-a' });
  await api.updateInvoiceSubmission(b.id, { invoiceSentAt: 'sent-b' });
  const route = loadTs('app/api/admin/invoice/customer/[id]/route.ts', {
    '@/lib/customerInvoices': api,
    '@/lib/customerQuotes': { listCustomerQuotes: async () => { throw new Error('Delivery status must not load or create quotes'); } },
    '@/lib/adminAuth': { verifyRequestSession: async () => ({ role: 'finance' }) },
  });
  const response = await route.GET({ nextUrl: new URL('https://example.com/customer?delivery=1') }, { params: Promise.resolve({ id: 'customer' }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.invoices.find(invoice => invoice.id === a.id).invoiceOpenedAt, 'opened-a');
  assert.equal(body.invoices.find(invoice => invoice.id === b.id).invoiceOpenedAt, undefined);
  assert.equal(body.invoices.find(invoice => invoice.id === b.id).invoiceSentAt, 'sent-b');
  assert.equal(body.invoices[0].invoiceAmount, undefined);
  assert.equal(body.quotes, undefined);
});

test('email-open tracking writes the selected invoice, leaving other invoices unopened', async () => {
  const api = setup();
  const a = await api.createQuoteInvoice('customer', 'customer~a');
  const b = await api.createQuoteInvoice('customer', 'customer~b');
  await api.updateInvoiceSubmission(a.id, { invoiceSentAt: 'original-send' });
  const alerts = [];
  const route = loadTs('app/api/track/invoice/[id]/route.ts', {
    '@/lib/customerInvoices': api,
    '@/lib/email': { sendInternalAlert: async input => alerts.push(input) },
  });
  assert.equal((await route.GET({}, { params: Promise.resolve({ id: a.id }) })).status, 200);
  assert.equal((await api.getInvoiceSubmission(a.id)).invoiceSentAt, 'original-send');
  assert.ok((await api.getInvoiceSubmission(a.id)).invoiceOpenedAt);
  assert.equal((await api.getInvoiceSubmission(b.id)).invoiceOpenedAt, undefined);
  assert.equal(api.leads.get('customer').invoiceOpenedAt, 'old-open');
  await route.GET({}, { params: Promise.resolve({ id: a.id }) });
  assert.equal(alerts.length, 1); assert.equal(alerts[0].leadId, 'customer');
});
