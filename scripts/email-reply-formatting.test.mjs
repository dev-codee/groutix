import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';
const { formatEmailReplyToHtml } = loadTs('lib/emailReplyFormatting.ts');

test('AI Markdown renders bold, italic, combined emphasis, headings and lists', () => {
 const html = formatEmailReplyToHtml('## Your booking\n\n**Bold** and *italic* and ***both***\n__Also bold__ and _also italic_\n\n- First\n- Second\n\n1. Confirm\n2. Reply');
 assert.match(html, /<h2[^>]*>Your booking<\/h2>/);
 assert.match(html, /<strong[^>]*>Bold<\/strong>/);
 assert.match(html, /<em[^>]*>italic<\/em>/);
 assert.match(html, /<strong[^>]*><em[^>]*>both<\/em><\/strong>/);
 assert.match(html, /<strong[^>]*>Also bold<\/strong>/);
 assert.match(html, /<em[^>]*>also italic<\/em>/);
 assert.match(html, /<ul/); assert.match(html, /<ol/);
 assert.doesNotMatch(html, /\*\*|__Also/);
});

test('nested pasted emphasis remains formatted in previews and sent replies', () => {
 const html = formatEmailReplyToHtml('<strong>Bold with <em>italic inside</em></strong> and <u>underlined</u>');
 assert.match(html, /<strong[^>]*>Bold with <em[^>]*>italic inside<\/em><\/strong>/);
 assert.match(html, /<u[^>]*>underlined<\/u>/);
});

test('pasted text cannot execute HTML or break link attributes', () => {
 const html = formatEmailReplyToHtml('<img src=x onerror=alert(1)> <script>alert(1)</script> [link](https://example.com/"test)');
 assert.doesNotMatch(html, /<img|<script|href="[^"]*"test/);
 assert.match(html, /&lt;img/);
});

test('the email endpoint delivers the same formatted body as the composer preview and retains it in history', async () => {
 const delivered = [], stored = [];
 const text = '**Booking confirmed**\n\nPlease read the *important details*.\n- First item';
 const { POST } = loadTs('app/api/admin/lead/[id]/email/route.ts', {
  '@/lib/submissions': { getSubmission: async () => ({ email: 'customer@example.com' }), appendActivity: async () => {} },
  '@/lib/email': { sendEmail: async message => delivered.push(message), cleanEmailText: value => value, wrapEmailHtml: html => html, getEmailLogoUrl: async () => '' },
  '@/lib/mongodb': { getDb: async () => ({ collection: () => ({ updateOne: async (_filter, update) => stored.push(update.$push.messages) }) }) },
 });
 const response = await POST({ json: async () => ({ subject: 'Your booking', text }) }, { params: Promise.resolve({ id: '6ae940975d149b5c4e9c19e3' }) });
 assert.equal(response.status, 200);
 assert.equal(delivered[0].html, formatEmailReplyToHtml(text));
 assert.equal(stored[0].text, text);
 assert.equal((await response.json()).message.text, text);
});
