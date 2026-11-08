import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';
const { earningsJobsCsv, earningsMembersCsv } = loadTs('lib/teamEarningsCsv.ts');
const job = {
  jobLabel: 'JOB-12', customer: 'Smith, "Alex"', status: 'Completed', service: 'Regrouting\nResealing', assignedNames: ['Zoë'],
  completedVisits: 2, totalVisits: 2, daysDone: 1.5, daysPlanned: 2, invoice: { number: 'INV-12', totalCents: 110000, baseCents: 100000 }, invoicePaid: true, changed: false,
  ledger: { status: 'approved', shares: [{ name: 'Zoë', memberId: 'member', rateBps: 2500, earnedCents: 25000, paidCents: 10000 }] },
};

test('job export preserves approved cents, outstanding balances and quoted multiline text', () => {
  const csv = earningsJobsCsv([job]);
  assert.match(csv, /"Smith, ""Alex"""/);
  assert.match(csv, /"Regrouting\nResealing"/);
  assert.match(csv, /"1100.00","Yes","Approved","0.00","250.00","100.00","150.00","Zoë: 25%"/);
  const draft = earningsJobsCsv([{ ...job, ledger: { ...job.ledger, status: 'draft' } }]);
  assert.match(draft, /"Draft","250.00","0.00","0.00","0.00"/);
});

test('member export keeps individual balances and protects formula-like names', () => {
  const csv = earningsMembersCsv([{ name: '=HYPERLINK("example")', role: 'technician', active: true, assigned: 2, visits: 3, days: 1.5, estimated: 12345, earned: 25000, paid: 10000 }]);
  assert.match(csv, /"'=HYPERLINK\(""example""\)"/);
  assert.match(csv, /"123.45","250.00","100.00","150.00"\r\n$/);
  assert.equal(earningsJobsCsv([]).split('\r\n').length, 2);
});
