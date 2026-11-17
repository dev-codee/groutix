import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const { matchesItemCodeChecklist: matches, selectItemCodeOption: select } = loadTs('lib/itemCodeChecklist.ts');
const { SERVICE_TEMPLATES } = loadTs('lib/serviceTemplates.ts');

test('checklist selects exact code tokens and preserves duplicate catalog rows', () => {
  const selection = { room: 'MB', size: 'SS', surface: 'WF', height: 'SH', grout: 'PG' };
  const results = SERVICE_TEMPLATES.filter(item => matches(item.code, selection));
  assert.deepEqual(Array.from(results, item => item.no), ['49', '57', '68']);
  assert.equal(matches('CUSTOM-MBSS-WF-SH-PG', selection), false);
  assert.equal(matches('BALCONY', {}), true);
  assert.equal(matches('BALCONY', { room: 'MB' }), false);
});

test('floor and walls only clear height and retain all saved height variants', () => {
  for (const surface of ['FO', 'WO']) {
    const selection = select({ room: 'EN', height: 'TC' }, 'surface', surface);
    assert.equal(selection.height, undefined);
    assert.equal(matches(`EN-SS-${surface}-EG`, selection), true);
    assert.equal(matches(`EN-SS-${surface}-SH-EG`, selection), true);
    assert.equal(matches(`EN-SS-${surface}-TC-EG`, selection), true);
    assert.equal(matches('EN-SS-WF-TC-EG', selection), false);
  }
});

test('choices replace within a group and toggle off without changing other groups', () => {
  const changed = select({ room: 'EN', grout: 'EG' }, 'room', 'MB');
  assert.equal(changed.room, 'MB');
  assert.equal(changed.grout, 'EG');
  assert.equal(select(changed, 'room', 'MB').room, undefined);
});

test('missing combinations do not substitute a different scope', () => {
  assert.equal(SERVICE_TEMPLATES.filter(item => matches(item.code, { room: 'MB', size: 'DS', surface: 'WO', height: 'TC', grout: 'PG' })).length, 1);
  assert.equal(SERVICE_TEMPLATES.filter(item => matches(item.code, { room: 'EN', size: 'DS', surface: 'WO', grout: 'PG' })).length, 0);
});
