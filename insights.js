// Spending history and projections. Kept free of Expo imports so it runs under `node --test`.
import { toDays, addDays, monthOf, monthStart, monthEnd, addMonths } from './dates.js';
import { chargesBetween } from './subscriptions.js';

// Totals for `count` months ending with `lastMonth`, oldest first, split by category.
// Expenses dated after `today` are planned, not spent, so they are left out.
export const monthlyHistory = (expenses, lastMonth, count, today) => {
  const rows = Array.from({ length: count }, (_, i) => ({
    month: addMonths(lastMonth, i - count + 1),
    total: 0,
    byCategory: {},
  }));
  const index = new Map(rows.map((row, i) => [row.month, i]));
  for (const e of expenses) {
    const i = index.get(monthOf(e.date));
    if (i === undefined || e.date > today) continue;
    rows[i].total += e.amount;
    rows[i].byCategory[e.category] = (rows[i].byCategory[e.category] ?? 0) + e.amount;
  }
  return rows;
};

// Average daily spending on one-off expenses (subscription charges are projected from
// their schedule instead). It covers the last 90 days, or the whole history when that is
// shorter, but never fewer than 30 days, so a first large expense doesn't read as a habit.
export const dailyRate = (expenses, today) => {
  const oneOff = expenses.filter(e => !e.subscriptionId && e.date <= today);
  if (!oneOff.length) return 0;
  const first = oneOff.reduce((min, e) => (e.date < min ? e.date : min), today);
  const days = Math.min(90, Math.max(30, toDays(today) - toDays(first) + 1));
  const since = addDays(today, -(days - 1));
  return oneOff.filter(e => e.date >= since).reduce((sum, e) => sum + e.amount, 0) / days;
};

// Expected spending for a month: `spent` (dated up to today), `scheduled` (expenses dated
// after today plus subscription charges still to come) and `estimated` (the daily rate
// for each remaining day). Past months have only `spent`.
export const projectMonth = (month, { expenses, subscriptions, today, rate }) => {
  const start = monthStart(month);
  const end = monthEnd(month);
  // The last day already accounted for: today, or the day before a future month starts.
  const from = today >= start ? today : addDays(start, -1);
  let spent = 0;
  let scheduled = 0;
  for (const e of expenses) {
    if (e.date < start || e.date > end) continue;
    if (e.date <= today) spent += e.amount;
    else scheduled += e.amount;
  }
  for (const sub of subscriptions) {
    // Charges up to postedThrough are already expenses.
    const after = sub.postedThrough && sub.postedThrough > from ? sub.postedThrough : from;
    scheduled += chargesBetween(sub, after, end).length * sub.amount;
  }
  const estimated = rate * Math.max(0, toDays(end) - toDays(from));
  return { spent, scheduled, estimated, total: spent + scheduled + estimated };
};
