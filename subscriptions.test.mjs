import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isISODate, addMonths, monthEnd } from './dates.js';
import { chargesBetween, nextCharge, monthlyCost, postCharges } from './subscriptions.js';

const sub = (cycle, startDate, extra = {}) => ({
  id: 's1', name: 'Music', amount: 10, category: 'Bills', cycle, startDate, postedThrough: null, ...extra,
});

test('isISODate accepts only real calendar dates', () => {
  for (const ok of ['2026-10-29', '2028-02-29', '2026-12-31']) assert.ok(isISODate(ok), ok);
  for (const bad of ['2026-02-29', '2026-13-01', '2026-00-10', '2026-4-1', '20261029', '', null, 42]) {
    assert.ok(!isISODate(bad), String(bad));
  }
});

test('month helpers cross year boundaries', () => {
  assert.equal(addMonths('2026-11', 2), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
  assert.equal(monthEnd('2028-02'), '2028-02-29');
});

test('monthly charges keep the day, moved back in short months', () => {
  assert.deepEqual(chargesBetween(sub('monthly', '2026-01-31'), null, '2026-05-01'), [
    '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
  ]);
});

test('yearly charges on Feb 29 fall on Feb 28 outside leap years', () => {
  assert.deepEqual(chargesBetween(sub('yearly', '2024-02-29'), null, '2028-12-31'), [
    '2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29',
  ]);
});

test('weekly charges and the after/until bounds', () => {
  const weekly = sub('weekly', '2026-10-01');
  assert.deepEqual(chargesBetween(weekly, '2026-10-08', '2026-10-22'), ['2026-10-15', '2026-10-22']);
  assert.equal(nextCharge(weekly, '2026-10-29'), '2026-11-05');
  assert.equal(nextCharge(weekly, '2026-09-01'), '2026-10-01');
});

test('monthlyCost normalises every cycle to a month', () => {
  assert.equal(monthlyCost(sub('monthly', '2026-01-01')), 10);
  assert.equal(monthlyCost(sub('yearly', '2026-01-01', { amount: 120 })), 10);
  assert.equal(monthlyCost(sub('weekly', '2026-01-01', { amount: 3 })), 13);
});

test('postCharges adds past charges once and remembers how far it got', () => {
  const first = postCharges([sub('monthly', '2026-08-15')], [], '2026-10-29');
  assert.deepEqual(first.expenses.map(e => [e.id, e.date, e.amount, e.subscriptionId]), [
    ['s1:2026-08-15', '2026-08-15', 10, 's1'],
    ['s1:2026-09-15', '2026-09-15', 10, 's1'],
    ['s1:2026-10-15', '2026-10-15', 10, 's1'],
  ]);
  assert.equal(first.subscriptions[0].postedThrough, '2026-10-29');
  assert.equal(postCharges(first.subscriptions, first.expenses, '2026-10-29'), null);

  // A deleted charge is not added back, and the next one arrives on its date.
  const kept = first.expenses.filter(e => e.date !== '2026-09-15');
  const before = postCharges(first.subscriptions, kept, '2026-11-14');
  assert.equal(before.expenses, kept);
  assert.equal(before.subscriptions[0].postedThrough, '2026-11-14');
  const later = postCharges(first.subscriptions, kept, '2026-11-15');
  assert.deepEqual(later.expenses.map(e => e.date), ['2026-08-15', '2026-10-15', '2026-11-15']);
});

test('postCharges uses the latest amount and skips subscriptions that start later', () => {
  const posted = { ...sub('monthly', '2026-08-15'), postedThrough: '2026-10-29', amount: 12 };
  const future = { ...sub('monthly', '2026-12-01'), id: 's2' };
  const result = postCharges([posted, future], [], '2026-11-20');
  assert.deepEqual(result.expenses.map(e => [e.id, e.amount]), [['s1:2026-11-15', 12]]);
  assert.equal(result.subscriptions[1].postedThrough, '2026-11-20');
});
