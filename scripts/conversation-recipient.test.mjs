import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';

function fixture(email = 'customer@example.com') {
 const lead = { email }, sent = [], saved = [], audit = [];
 const { POST } = loadTs('app/api/admin/lead/[id]/email/route.ts', {
  '@/lib/submissions': { getSubmission: async () => lead, appendActivity: async (_id, entry) => audit.push(entry) },
  '@/lib/email': { sendEmail: async args => sent.push(args), cleanEmailText: value => value, wrapEmailHtml: value => value, getEmailLogoUrl: async () => '' },
  '@/lib/mongodb': { getDb: async () => ({ collection: () => ({ updateOne: async (filter, update) => saved.push({filter, message: update.$push.messages}) }) }) },
 });
 return { lead, sent, saved, audit, post: body => POST({ json: async () => ({ text: 'Please confirm the tenant details.', ...body }) }, { params: Promise.resolve({id:'6ae940975d149b5c4e9c19e3'}) }) };
}

test('sending to a property manager stays on the customer and preserves the actual recipient and email thread ID', async () => {
 const f = fixture();
 const response = await f.post({ toEmail: ' manager@example.com ', subject: 'Tenant details' });
 assert.equal(response.status, 200);
 assert.equal(f.sent[0].toEmail, 'manager@example.com');
 assert.equal(f.lead.email, 'customer@example.com');
 assert.equal(f.saved[0].filter._id.toString(), '6ae940975d149b5c4e9c19e3');
 assert.equal(f.saved[0].message.toEmail, 'manager@example.com');
 assert.equal(f.saved[0].message.emailMessageId, f.sent[0].messageId);
 assert.match(f.audit[0].detail, /manager@example.com/);
 assert.equal((await response.json()).message.toEmail, 'manager@example.com');
});

test('older callers default to the customer email and a customer without an email can still contact a tenant', async () => {
 const customer = fixture(); await customer.post({});
 assert.equal(customer.sent[0].toEmail, 'customer@example.com');
 const noEmail = fixture('');
 assert.equal((await noEmail.post({toEmail:'tenant@example.com'})).status, 200);
 assert.equal(noEmail.sent[0].toEmail, 'tenant@example.com');
});

test('invalid explicit recipients are rejected without falling back to the customer or sending anything', async () => {
 for(const toEmail of ['', 'invalid', 'manager@example.com,other@example.com', 'manager@example.com\r\nBcc: other@example.com', ['manager@example.com']]) {
  const f = fixture();
  assert.equal((await f.post({toEmail})).status, 400);
  assert.equal(f.sent.length, 0); assert.equal(f.saved.length, 0);
 }
});

test('the SMTP transport receives the saved message ID used to associate replies', async () => {
 const sent=[];
 const { sendEmail } = loadTs('lib/email.ts', { nodemailer: { createTransport: () => ({sendMail: async value => sent.push(value)}) } }, { process: {env:{SMTP_USER:'info@example.com',SMTP_PASS:'test-only'}} });
 await sendEmail({toEmail:'tenant@example.com',subject:'Details',html:'<p>Hi</p>',messageId:'<thread-id@groutix.com>'});
 assert.equal(sent[0].to, 'tenant@example.com');
 assert.equal(sent[0].messageId, '<thread-id@groutix.com>');
});
