// Categories and validation of saved data. Kept free of Expo imports so it runs under `node --test`.
import { isISODate } from './dates.js';
import { cycles } from './subscriptions.js';

export const categories = [
  { name: 'Food', icon: '🍔', color: '#F97316' },
  { name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { name: 'Bills', icon: '🧾', color: '#10B981' },
  { name: 'Other', icon: '✨', color: '#8B5CF6' },
];
export const categoryByName = Object.fromEntries(categories.map(c => [c.name, c]));

const isAmount = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
const isText = v => typeof v === 'string';
const category = name => (Object.hasOwn(categoryByName, name) ? name : 'Other');

// Saved data comes back through JSON from device storage; keep only well-formed records,
// so one bad entry can't break totals or the charge schedule.
export const sanitizeState = raw => {
  const data = raw && typeof raw === 'object' ? raw : {};
  const list = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : []);
  const expenses = list(data.expenses)
    .filter(e => isText(e.id) && isText(e.desc) && isAmount(e.amount) && isISODate(e.date))
    .map(e => ({
      id: e.id,
      desc: e.desc,
      amount: e.amount,
      category: category(e.category),
      date: e.date,
      ...(isText(e.subscriptionId) && { subscriptionId: e.subscriptionId }),
    }));
  const subscriptions = list(data.subscriptions)
    .filter(s => isText(s.id) && isText(s.name) && isAmount(s.amount) && cycles.includes(s.cycle) && isISODate(s.startDate))
    .map(s => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      category: category(s.category),
      cycle: s.cycle,
      startDate: s.startDate,
      postedThrough: isISODate(s.postedThrough) ? s.postedThrough : null,
    }));
  return { expenses, subscriptions, lang: isText(data.lang) ? data.lang : null };
};
