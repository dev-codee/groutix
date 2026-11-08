import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './test-ts-loader.mjs';

const records = [
  { id: 'customer~invoice~a', invoiceNumber: 'GX-I-1', invoiceSentAt: '2026-11-08T01:00:00Z', invoiceOpenedAt: '2026-11-08T02:00:00Z' },
  { id: 'customer~invoice~b', invoiceNumber: 'GX-I-2', invoiceSentAt: '2026-11-08T03:00:00Z' },
  { id: 'customer~invoice~c', invoiceNumber: 'GX-I-3' },
];

test('each invoice shows its own sent, opened or unsent state', () => {
  const { InvoiceDeliveryList, InvoiceDeliveryHistory } = loadTs('components/admin/InvoiceDeliveryHistory.tsx');
  const html = renderToStaticMarkup(React.createElement(InvoiceDeliveryList, { invoices: records }));
  assert.match(html, /GX-I-1/); assert.match(html, /GX-I-2/); assert.match(html, /GX-I-3/);
  const first = renderToStaticMarkup(React.createElement(InvoiceDeliveryList, { invoices: [records[0]] }));
  assert.match(first, /Invoice Sent/); assert.match(first, /Invoice Opened/); assert.doesNotMatch(first, /Not opened yet/);
  const second = renderToStaticMarkup(React.createElement(InvoiceDeliveryList, { invoices: [records[1]] }));
  assert.match(second, /Invoice Sent/); assert.match(second, /Not opened yet/);
  const third = renderToStaticMarkup(React.createElement(InvoiceDeliveryList, { invoices: [records[2]] }));
  assert.match(third, /Invoice not sent yet/); assert.doesNotMatch(third, /Invoice Opened/);
  const legacy = renderToStaticMarkup(React.createElement(InvoiceDeliveryHistory, { lead: { ...records[0], id: 'customer' } }));
  assert.match(legacy, /Invoice Sent/); assert.match(legacy, /Invoice Opened/);
});

test('delivery polling, send events and focus refresh keep invoices separate and clean up on close', async () => {
  let result = null, effect, timer, cleared = false, requests = 0, fail = false;
  let payload = records.map(record => ({ ...record }));
  const listeners = new Map(), documentListeners = new Map();
  const window = {
    setInterval: callback => { timer = callback; return 1; }, clearInterval: () => { cleared = true; },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
    dispatchEvent: event => listeners.get(event.type)?.(event),
  };
  const document = { visibilityState: 'visible', addEventListener: (name, fn) => documentListeners.set(name, fn), removeEventListener: name => documentListeners.delete(name) };
  const { useInvoiceDeliveries, notifyInvoiceDeliveryChanged } = loadTs('components/admin/InvoiceDeliveryHistory.tsx', {
    react: { useEffect: callback => { effect = callback; }, useState: () => [null, next => { result = typeof next === 'function' ? next(result) : next; }] },
  }, { window, document, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    fetch: async (url, options) => {
      assert.equal(url, '/api/admin/invoice/customer/customer?delivery=1'); assert.equal(options.cache, 'no-store');
      requests++; return { ok: !fail, json: async () => ({ invoices: payload }) };
    },
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  useInvoiceDeliveries('customer'); const cleanup = effect(); await flush();
  assert.equal(requests, 1); assert.equal(result.invoices[1].invoiceOpenedAt, undefined);
  payload = payload.map(record => record.id === records[1].id ? { ...record, invoiceOpenedAt: '2026-11-08T04:00:00Z' } : record);
  timer(); await flush(); assert.ok(result.invoices[1].invoiceOpenedAt); assert.equal(result.invoices[2].invoiceSentAt, undefined);
  notifyInvoiceDeliveryChanged('other'); await flush(); assert.equal(requests, 2);
  notifyInvoiceDeliveryChanged('customer'); await flush(); assert.equal(requests, 3);
  fail = true; listeners.get('focus')(); await flush(); assert.ok(result.error); assert.equal(result.invoices.length, 3);
  fail = false; listeners.get('focus')(); await flush(); assert.equal(result.error, '');
  document.visibilityState = 'hidden'; timer(); await flush(); assert.equal(requests, 5);
  document.visibilityState = 'visible'; documentListeners.get('visibilitychange')(); await flush(); assert.equal(requests, 6);
  cleanup(); assert.equal(cleared, true); assert.equal(listeners.size, 0); assert.equal(documentListeners.size, 0);
});
