// Amount parsing and input formatting. Kept free of Expo imports so it runs under `node --test`.

// Map Arabic-Indic, Extended Arabic-Indic (Urdu), Devanagari and Bengali digits to ASCII.
const digitZeros = [0x0660, 0x06f0, 0x0966, 0x09e6];
export const normalizeDigits = str =>
  str.replace(/[٠-٩۰-۹०-९০-৯]/g, ch => {
    const code = ch.charCodeAt(0);
    return String(code - digitZeros.find(z => code >= z && code <= z + 9));
  });

// Never decimal marks: spaces (incl. no-break), bidi marks, apostrophes, Arabic thousands separator.
const spacing = /[\s\u00a0\u202f\u200e\u200f\u061c'\u2019\u066c]/g;
// 1,234,567 or the Indian 12,34,567: groups of two or three digits, ending in three.
const grouped = /^\d{1,3}(?:[.,]\d{2,3})*[.,]\d{3}$/;

// Parse a typed amount; NaN if it is not a plain positive-or-zero number.
// `decimal` is the UI language's decimal mark. Which "." or "," is the decimal mark:
// - "٫" (Arabic decimal separator) always is.
// - Both "." and "," present: the last one is ("1,234.50", "1.234,50").
// - Only one mark, used once: it is, unless it is not `decimal` and exactly three
//   digits follow ("1,234" in English is 1234, "12,50" is still 12.5).
// - One mark used repeatedly: all grouping ("1,234,567").
export const parseAmount = (str, decimal = '.') => {
  const s = normalizeDigits(str).replace(spacing, '');
  const marks = s.match(/[.,٫]/g) ?? [];
  let int = s;
  let frac = '';
  if (marks.length) {
    const last = marks[marks.length - 1];
    const at = s.lastIndexOf(last);
    const tail = s.slice(at + 1);
    const isDecimal =
      last === '٫' ||
      new Set(marks).size > 1 ||
      (marks.length === 1 && (last === decimal || !/^\d{3}$/.test(tail)));
    if (isDecimal) {
      int = s.slice(0, at) || '0';
      frac = tail;
    }
  }
  if (!/^\d*$/.test(frac) || !(/^\d+$/.test(int) || grouped.test(int))) return NaN;
  if (int === '0' && frac === '' && !/\d/.test(s)) return NaN;
  return Number(`${int.replace(/[.,]/g, '')}.${frac || '0'}`);
};

// The decimal mark for a language, and a formatter whose output parseAmount reads back exactly.
export const amountInput = lang => {
  const plain = new Intl.NumberFormat(lang, { useGrouping: false, maximumFractionDigits: 20 });
  return {
    decimal: plain.format(1.5).match(/[.,٫]/)?.[0] ?? '.',
    format: n => plain.format(n),
  };
};
