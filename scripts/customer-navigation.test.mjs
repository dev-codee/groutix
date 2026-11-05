import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const { customerDrivingDirections } = loadTs('lib/customerNavigation.ts');

test('Navigate uses the complete property address, driving mode and the device location as origin', () => {
  const lead = { address: '4/12 Smith Street, Doncaster VIC 3108, Australia', city: 'Melbourne', gps: { lat: 31.5, lng: 74.3 } };
  const url = new URL(customerDrivingDirections(lead));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('destination'), lead.address);
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.equal(url.searchParams.get('dir_action'), 'navigate');
  assert.equal(url.searchParams.has('origin'), false, 'never use a stale staff check-in or the customer city as the origin');
});

test('street-only records include their saved suburb and Australian region', () => {
  const url = new URL(customerDrivingDirections({ address: '17 O’Connor Road', city: 'Gowanbrae', state: 'VIC' }));
  assert.equal(url.searchParams.get('destination'), '17 O’Connor Road, Gowanbrae, VIC, Australia');
});

test('a city-only or missing address cannot route the inspector to the centre of Melbourne', () => {
  for (const address of ['', ' ', 'Melbourne', 'Melbourne, Victoria, Australia', 'Melbourne VIC 3000', 'Gowanbrae VIC 3043', 'N/A']) {
    assert.equal(customerDrivingDirections({ address, city: 'Melbourne' }), undefined, address);
  }
});

test('the saved inspection property is used when the lead contains only a locality', () => {
  const inspectionReport = { propertyAddress: '82A Marigold Crescent, Gowanbrae VIC 3043' };
  const url = new URL(customerDrivingDirections({ address: 'Melbourne', city: 'Melbourne', inspectionReport }));
  assert.equal(url.searchParams.get('destination'), `${inspectionReport.propertyAddress}, Australia`);
  const current = new URL(customerDrivingDirections({ address: '10 New Street, Carlton VIC 3053', inspectionReport }));
  assert.equal(current.searchParams.get('destination'), '10 New Street, Carlton VIC 3053, Australia', 'the current lead address wins over an older report');
});

test('the actual inspector and technician Navigate links contain the complete customer destination', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const ctx = { role: 'inspection', jobWorkflowLeads: [], jobBookingsSaving: {} };
  const overrides = {
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => ctx },
    '@/lib/useDistanceKm': { useDistanceKm: () => null },
  };
  const { FieldLeadRow } = loadTs('components/admin/rows/FieldLeadRow.tsx', overrides);
  const { TechnicianLeadRow } = loadTs('components/admin/rows/TechnicianLeadRow.tsx', overrides);
  for (const Row of [FieldLeadRow, TechnicianLeadRow]) {
    const lead = { id: 'customer-1', status: 'Inspection Booked', createdAt: '2026-11-05', name: 'Sam', address: 'Melbourne',
      inspectionReport: { propertyAddress: '4/12 Smith Street, Doncaster VIC 3108' } };
    const html = renderToStaticMarkup(createElement(Row, { l: lead }));
    const link = html.match(/href="(https:\/\/www\.google\.com\/maps\/dir\/\?[^\"]+)"/);
    assert.ok(link, 'Navigate links to the saved inspection property');
    const url = new URL(link[1].replaceAll('&amp;', '&'));
    assert.equal(url.searchParams.get('destination'), '4/12 Smith Street, Doncaster VIC 3108, Australia');
    assert.equal(url.searchParams.get('travelmode'), 'driving');
    assert.ok(html.includes('4/12 Smith Street'), 'show the address being used for navigation');
    const missing = renderToStaticMarkup(createElement(Row, { l: { ...lead, inspectionReport: undefined } }));
    assert.equal(missing.includes('google.com/maps/dir/'), false);
    assert.ok(missing.includes('Property address required'));
  }
});
