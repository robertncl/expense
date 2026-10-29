import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyHistory, dailyRate, projectMonth } from './insights.js';
import { sanitizeState } from './model.js';

const exp = (date, amount, extra = {}) => ({ id: `${date}-${amount}`, desc: 'x', amount, category: 'Food', date, ...extra });

test('monthlyHistory groups by month and category, oldest first, without planned expenses', () => {
  const rows = monthlyHistory(
    [exp('2026-09-03', 20), exp('2026-09-20', 5, { category: 'Bills' }), exp('2026-10-01', 7), exp('2026-10-30', 100)],
    '2026-10', 3, '2026-10-29',
  );
  assert.deepEqual(rows.map(r => [r.month, r.total]), [['2026-08', 0], ['2026-09', 25], ['2026-10', 7]]);
  assert.deepEqual(rows[1].byCategory, { Food: 20, Bills: 5 });
});

test('dailyRate averages one-off spending over 30 to 90 days', () => {
  assert.equal(dailyRate([], '2026-10-29'), 0);
  // A single expense today is spread over the 30-day minimum.
  assert.equal(dailyRate([exp('2026-10-29', 300)], '2026-10-29'), 10);
  // Subscription charges and future-dated expenses are left out.
  assert.equal(dailyRate([exp('2026-10-29', 300), exp('2026-10-20', 50, { subscriptionId: 's1' }), exp('2026-11-02', 90)], '2026-10-29'), 10);
  // Older than 90 days is outside the window, but still stretches it to 90.
  assert.equal(dailyRate([exp('2026-01-01', 1000), exp('2026-10-29', 180)], '2026-10-29'), 2);
});

test('projectMonth adds scheduled charges and the daily rate for the rest of the month', () => {
  const ctx = {
    expenses: [exp('2026-10-05', 40), exp('2026-10-31', 15)],
    subscriptions: [{ id: 's1', amount: 10, cycle: 'weekly', startDate: '2026-10-02', postedThrough: '2026-10-29' }],
    today: '2026-10-29',
    rate: 2,
  };
  // Spent 40; scheduled: the expense on the 31st and the weekly charge on the 30th; 2 days left at 2/day.
  assert.deepEqual(projectMonth('2026-10', ctx), { spent: 40, scheduled: 25, estimated: 4, total: 69 });
  // November: four weekly charges (6, 13, 20, 27) and 30 days at 2/day.
  assert.deepEqual(projectMonth('2026-11', ctx), { spent: 0, scheduled: 40, estimated: 60, total: 100 });
  // Past months are what was spent.
  assert.deepEqual(projectMonth('2026-09', ctx), { spent: 0, scheduled: 0, estimated: 0, total: 0 });
});

test('projectMonth does not count charges already posted ahead of today', () => {
  const ctx = {
    expenses: [exp('2026-10-30', 10, { subscriptionId: 's1' })],
    subscriptions: [{ id: 's1', amount: 10, cycle: 'weekly', startDate: '2026-10-02', postedThrough: '2026-10-30' }],
    today: '2026-10-29',
    rate: 0,
  };
  assert.equal(projectMonth('2026-10', ctx).scheduled, 10);
});

test('sanitizeState keeps well-formed records only', () => {
  assert.deepEqual(sanitizeState(null), { expenses: [], subscriptions: [], lang: null });
  assert.deepEqual(sanitizeState('nonsense'), { expenses: [], subscriptions: [], lang: null });
  const state = sanitizeState({
    lang: 'fr',
    expenses: [
      exp('2026-10-01', 5),
      exp('2026-10-02', 5, { category: 'constructor', subscriptionId: 's1', extra: 'dropped' }),
      exp('2026-02-30', 5),
      { ...exp('2026-10-03', 5), amount: Infinity },
      { ...exp('2026-10-03', 5), amount: '5' },
      null,
    ],
    subscriptions: [
      { id: 's1', name: 'Music', amount: 10, category: 'Bills', cycle: 'monthly', startDate: '2026-01-31', postedThrough: 'soon' },
      { id: 's2', name: 'Bad', amount: 10, category: 'Bills', cycle: 'daily', startDate: '2026-01-31' },
    ],
  });
  assert.equal(state.lang, 'fr');
  assert.deepEqual(state.expenses.map(e => [e.date, e.category, e.subscriptionId]), [
    ['2026-10-01', 'Food', undefined],
    ['2026-10-02', 'Other', 's1'],
  ]);
  assert.equal('extra' in state.expenses[1], false);
  assert.deepEqual(state.subscriptions.map(s => [s.id, s.postedThrough]), [['s1', null]]);
});
