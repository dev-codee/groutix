import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './test-ts-loader.mjs';

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}

test('each technician job has a camera button opening its customer photo gallery', () => {
  const opened = [];
  const ctx = { role: 'technician', jobWorkflowLeads: [], jobBookingsSaving: {}, openPhotosModal: lead => opened.push(lead) };
  const { TechnicianLeadRow } = loadTs('components/admin/rows/TechnicianLeadRow.tsx', {
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => ctx },
    '@/lib/useDistanceKm': { useDistanceKm: () => null },
  });
  for (const count of [0, 3]) {
    const lead = { id: `customer-${count}`, status: 'Job Booked', createdAt: '2026-10-17', technician: 'Alex', jobAt: '2026-10-20T09:00', photosCount: count };
    const button = elements(TechnicianLeadRow({ l: lead })).find(node => node.type === 'button' && node.props['aria-label'] === 'Add / View Photos');
    assert.ok(button, 'camera button is visible even without existing photos');
    assert.ok(elements(button).some(node => node.type?.displayName === 'Camera' || node.type?.name === 'Camera' || node.props?.className === 'w-3.5 h-3.5 shrink-0'));
    const html = renderToStaticMarkup(createElement('div', null, button));
    assert.ok(html.includes('Add / View Photos'));
    if (count) assert.ok(html.includes('>3</span>'));
    button.props.onClick();
    assert.equal(opened.at(-1), lead);
  }
});
