import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './test-ts-loader.mjs';

const items = [
  { service: 'Silicone Replacement', scope: 'SILICONE WORK\n• Remove old silicone\n• Apply new silicone', description: 'Colour: white', qty: 1, price: 45 },
  { service: 'Tile repairs', scope: 'TILE REPAIR WORK\n• Repair two loose tiles', qty: 2, price: 100 },
];
const quote = {
  id: 'test', quoteNumber: 'QT-100', name: 'Customer', address: 'Site address', phone: '12345', email: 'customer@example.com',
  items, jobDescription: 'Bathroom restoration', taxMode: 'inclusive', taxRate: 10,
  subtotal: 222.73, gst: 22.27, total: 245, specialNotes: 'Access via side gate.\nPayment on completion.',
  terms: 'Groutix terms and conditions\n1 Definitions\n1.1 Customer means the purchaser.\n20 Governing law\n20.1 Victorian law applies.',
  issuedAt: '2026-11-17T00:00:00.000Z', bookingUrl: '',
};
function renderPage(data, signed = false) {
  let state = 0;
  const states = [false, null, data, 'font', 'Customer', 0, false, false, signed, ''];
  const { default: Page } = loadTs('app/quote/[id]/page.tsx', {
    react: { ...React, use: x => x, useEffect: () => {}, useRef: () => ({ current: null }), useState: () => [states[state++], () => {}] },
    'next/navigation': { useSearchParams: () => new URLSearchParams('token=test') },
  });
  return renderToStaticMarkup(React.createElement(Page, { params: { id: 'test' } }));
}

test('review page shows every service scope, distinct description, notes and pricing without inline legal terms', () => {
  const html = renderPage(quote);
  for (const text of ['Customer', 'Site address', 'QT-100', 'Bathroom restoration', 'Silicone Replacement', 'Remove old silicone', 'Apply new silicone', 'Colour: white', 'Repair two loose tiles', 'Access via side gate.', 'Payment on completion.', '$245.00', 'Includes 10% GST', 'Issued:']) assert.ok(html.includes(text), text);
  assert.match(html, /<ul[^>]*><li>Remove old silicone<\/li>/);
  assert.match(html, /href="\/terms-conditions"/);
  assert.doesNotMatch(html, /20.1 Victorian law applies.|quote-terms-heading/);
});

test('quote remains readable after signing and tax labels reflect the quote settings', () => {
  const signed = renderPage(quote, true);
  assert.match(signed, /Quotation Accepted &amp; Signed/);
  assert.match(signed, /Remove old silicone/);
  assert.doesNotMatch(signed, /20.1 Victorian law applies./);
  assert.doesNotMatch(signed, /Confirm &amp; Sign Quotation/);
  const noTax = renderPage({ ...quote, taxMode: 'none', taxRate: 0 });
  assert.match(noTax, /No GST/);
  assert.doesNotMatch(noTax, /Includes 10% GST|ex GST/);
  assert.match(renderPage({ ...quote, taxRate: 15 }), /Includes 15% GST/);
});

test('legacy description-only and amount-only quotes still display, and saved text is escaped', () => {
  assert.match(renderPage({ ...quote, items: [{ service: 'Custom work', description: 'Legacy work details', price: 245 }] }), /Legacy work details/);
  assert.match(renderPage({ ...quote, items: [], service: 'Legacy service' }), /Legacy service/);
  const { QuoteText } = loadTs('components/QuoteReviewDetails.tsx');
  const html = renderToStaticMarkup(React.createElement(QuoteText, { text: '<script>alert(1)</script>' }));
  assert.doesNotMatch(html, /<script>/);
});

test('signing API exposes full saved scopes and notes without returning the legal terms', async () => {
  const lead = { id: 'test', quoteNumber: 'QT-100', quoteItems: items, quoteScope: quote.jobDescription, quoteTerms: quote.specialNotes, quoteSentAt: quote.issuedAt };
  const { DEFAULT_QUOTE_CONDITIONS } = loadTs('lib/serviceTemplates.ts');
  const { GET } = loadTs('app/api/quote/sign/route.ts', {
    '@/lib/customerQuotes': { getQuoteSubmission: async () => lead, quoteLeadId: id => id },
    '@/lib/quoteToken': { verifyQuoteToken: (_id, token) => token === 'valid' },
    '@/lib/quoteOpenTracking': { recordQuoteOpen: async () => {} },
    '@/lib/bookingRulesServer': { getBookingRules: async () => ({ job: { days: [] } }) },
  });
  const get = token => GET({ nextUrl: new URL(`https://example.com/api/quote/sign?id=test&token=${token}`) });
  assert.equal((await get('invalid')).status, 401);
  const data = await (await get('valid')).json();
  assert.deepEqual(data.quote.items, items);
  assert.equal(data.quote.specialNotes, quote.specialNotes);
  assert.equal(data.quote.terms, undefined);
  assert.equal(data.quote.issuedAt, quote.issuedAt);
  lead.quoteTerms = 'A long custom condition. '.repeat(30);
  assert.equal((await (await get('valid')).json()).quote.specialNotes, lead.quoteTerms);
  lead.quoteTerms = '';
  assert.equal((await (await get('valid')).json()).quote.specialNotes, DEFAULT_QUOTE_CONDITIONS);
});

test('catalog descriptions that include the title and scope show work bullets once', () => {
  const scope = 'SILICONE WORK\n• Remove old silicone\n• Apply new silicone';
  const html = renderPage({ ...quote, items: [{ service: 'Silicone Replacement', scope, description: `Silicone Replacement\n${scope}`, price: 45 }] });
  assert.equal(html.split('Remove old silicone').length - 1, 1);
  assert.equal(html.split('Apply new silicone').length - 1, 1);
});

test('saved editor formatting renders as bold, italic and underline without executing HTML', () => {
  const { QuoteText } = loadTs('components/QuoteReviewDetails.tsx');
  const html = renderToStaticMarkup(React.createElement(QuoteText, { text: '• **Remove** *old* <u>silicone</u>\n<script>alert(1)</script>' }));
  assert.match(html, /<strong>Remove<\/strong>/);
  assert.match(html, /<em>old<\/em>/);
  assert.match(html, /<u>silicone<\/u>/);
  assert.doesNotMatch(html, /<script>/);
});

test('the exact title-only QT-1707 item cannot be sent as a complete scope', () => {
  const { quoteScopeValidationError } = loadTs('lib/quoteScope.ts');
  const savedItem = { templateNo: '', code: '', service: 'Silicone Replacement', scope: '', price: 45, qty: 1, matchedFrom: 'Silicone Replacement' };
  assert.match(quoteScopeValidationError([savedItem], 'Silicone Replacement'), /Add the detailed scope/);
  assert.equal(quoteScopeValidationError([{ ...savedItem, scope: '• Remove existing silicone from agreed joints' }], 'Silicone Replacement'), undefined);
  assert.equal(quoteScopeValidationError([{ ...savedItem, description: '• Prepare joints and apply new silicone' }]), undefined);
});
