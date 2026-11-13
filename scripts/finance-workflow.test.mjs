import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './test-ts-loader.mjs';
const { financeFilterStatus, financeWorkVisible, releaseFinanceCompletions } = loadTs('lib/financeCompletion.ts');
const { quickbooksStatus } = loadTs('lib/quickbooksStatus.ts');

test('finance completion remains checked and visible in its prior filter until explicit refresh releases it', () => {
  const lead = { id: 'lead', status: 'Completed' };
  const holds = { lead: { previousStatus: 'Payment Received' } };
  assert.equal(financeWorkVisible(lead, holds), true);
  assert.equal(financeFilterStatus(lead, holds, 'Payment Received'), 'Payment Received');
  assert.equal(financeFilterStatus(lead, holds, 'Completed'), 'Completed');
  assert.equal(lead.status, 'Completed');
  const refreshed = releaseFinanceCompletions(holds, holds);
  assert.equal(financeWorkVisible(lead, refreshed), false);
  assert.equal(financeFilterStatus(lead, refreshed, 'Payment Received'), 'Completed');
  const later = { ...holds, later: { previousStatus: 'Warranty Sent' } };
  assert.equal(releaseFinanceCompletions(later, holds).later, later.later, 'a completion made after clicking refresh stays visible');
});

test('QuickBooks workflow only ticks on actual confirmed sync, including every saved customer invoice', () => {
  assert.equal(quickbooksStatus({ invoiceNumber: 'INV-1' }).sent, false);
  assert.equal(quickbooksStatus({ invoiceNumber: 'INV-1', qboInvoiceId: 'qb-1' }).sent, true);
  assert.equal(quickbooksStatus({ customerInvoiceCount: 2, customerInvoiceSyncedCount: 1 }).sent, false);
  assert.equal(quickbooksStatus({ customerInvoiceCount: 2, customerInvoiceSyncedCount: 2 }).sent, true);
  assert.equal(quickbooksStatus({ invoiceNumber: 'INV-1', qboInvoiceId: 'qb-1', customerInvoiceCount: 1, customerInvoiceSyncedCount: 0 }).sent, true);
  const { QuickBooksWorkflowStatus } = loadTs('components/admin/QuickBooksWorkflowStatus.tsx');
  const render = lead => renderToStaticMarkup(React.createElement(QuickBooksWorkflowStatus, { lead }));
  assert.match(render({ invoiceNumber: 'INV-1', qboInvoiceId: 'qb-1' }), /QuickBooks Sent: confirmed/);
  assert.match(render({ invoiceNumber: 'INV-1' }), /QuickBooks Sent: pending/);
  assert.doesNotMatch(render({ invoiceNumber: 'INV-1' }), /aria-label="Confirmed"/);
});

test('cancelled visits never appear completed in Today and Tomorrow; completed inspections do not complete future jobs', () => {
  const { dashboardVisits, dashboardVisitDone } = loadTs('lib/dashboardVisits.ts');
  const lead = { id: 'lead', status: 'Job Booked', inspectionReport: { status: 'completed' }, bookings: [
    { bookingId: 'cancelled', type: 'job', date: '2026-11-13', time: '09:00', status: 'Cancelled' },
    { bookingId: 'active', type: 'job', date: '2026-11-14', time: '09:00', status: 'Job Booked' },
  ] };
  const visits = dashboardVisits([lead]);
  assert.equal(visits.length, 1);
  assert.equal(visits[0].activeBooking.bookingId, 'active');
  assert.equal(visits[0].inspectionAt, undefined);
  assert.equal(dashboardVisitDone(visits[0]), false);
  assert.equal(dashboardVisits([{ ...lead, status: 'Cancelled' }]).length, 0);
  assert.equal(dashboardVisitDone({ ...lead, status: 'Cancelled' }), false);
  assert.equal(dashboardVisitDone({ ...visits[0], status: 'Job Done' }), true);
});
