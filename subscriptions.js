// Recurring charges. A subscription is { id, name, amount, category, cycle, startDate,
// postedThrough }: it charges `amount` on `startDate` and then every week, month or year.
// Kept free of Expo imports so it runs under `node --test`.
import { toDays, fromDays, daysInMonth } from './dates.js';

export const cycles = ['weekly', 'monthly', 'yearly'];

const pad = n => String(n).padStart(2, '0');

// The k-th charge date (k = 0 is the start date). Monthly and yearly charges keep the
// start's day of the month, moved back in shorter months: a subscription started on
// Jan 31 charges on Feb 28, then Mar 31.
const chargeDate = ({ startDate, cycle }, k) => {
  if (cycle === 'weekly') return fromDays(toDays(startDate) + 7 * k);
  const [y, m, d] = startDate.split('-').map(Number);
  const total = y * 12 + (m - 1) + (cycle === 'monthly' ? k : 12 * k);
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${String(year).padStart(4, '0')}-${pad(month)}-${pad(Math.min(d, daysInMonth(year, month)))}`;
};

// Charge dates after `after` (exclusive; null for no lower bound) up to `until` (inclusive).
export const chargesBetween = (sub, after, until) => {
  const dates = [];
  for (let k = 0; ; k++) {
    const date = chargeDate(sub, k);
    if (date > until) return dates;
    if (!after || date > after) dates.push(date);
  }
};

export const nextCharge = (sub, today) => {
  for (let k = 0; ; k++) {
    const date = chargeDate(sub, k);
    if (date > today) return date;
  }
};

// Average cost per month: a year has 52 weekly charges.
export const monthlyCost = sub =>
  sub.cycle === 'weekly' ? (sub.amount * 52) / 12 : sub.cycle === 'yearly' ? sub.amount / 12 : sub.amount;

// Adds an expense for every charge due since each subscription's `postedThrough`, up to
// `today`. Charges get the id "<subscription id>:<date>", so none is added twice, and a
// charge the user deleted is not added back. Returns null when nothing changed.
export const postCharges = (subscriptions, expenses, today) => {
  const ids = new Set(expenses.map(e => e.id));
  const added = [];
  let changed = false;
  const updated = subscriptions.map(sub => {
    if (sub.postedThrough && sub.postedThrough >= today) return sub;
    for (const date of chargesBetween(sub, sub.postedThrough, today)) {
      const id = `${sub.id}:${date}`;
      if (ids.has(id)) continue;
      added.push({ id, desc: sub.name, amount: sub.amount, category: sub.category, date, subscriptionId: sub.id });
    }
    changed = true;
    return { ...sub, postedThrough: today };
  });
  return changed ? { subscriptions: updated, expenses: added.length ? [...expenses, ...added] : expenses } : null;
};
