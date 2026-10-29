// Calendar helpers on ISO dates (YYYY-MM-DD) and months (YYYY-MM). Arithmetic runs on
// UTC day numbers, so time zones and daylight saving never shift a date.
// Kept free of Expo imports so it runs under `node --test`.

const DAY = 86400000;
const pad = (n, width = 2) => String(n).padStart(width, '0');

export const toDays = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
};
export const fromDays = days => new Date(days * DAY).toISOString().slice(0, 10);
export const addDays = (iso, n) => fromDays(toDays(iso) + n);

// A real calendar date: "2026-02-30" and "2026-13-01" are rejected.
export const isISODate = str =>
  typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str) && fromDays(toDays(str)) === str;

export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// Midday local time, so formatting the date never lands on a neighbouring day.
export const toLocalDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const monthOf = iso => iso.slice(0, 7);
export const monthStart = ym => `${ym}-01`;
export const monthEnd = ym => {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${pad(daysInMonth(y, m))}`;
};
export const addMonths = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${pad(Math.floor(total / 12), 4)}-${pad((total % 12) + 1)}`;
};
