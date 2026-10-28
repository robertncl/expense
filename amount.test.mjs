import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDigits, parseAmount, amountInput } from './amount.js';

const languages = ['en', 'zh', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'ru', 'ur', 'id', 'de', 'ja'];

test('normalizeDigits maps native digits to ASCII', () => {
  assert.equal(normalizeDigits('١٢٣'), '123');
  assert.equal(normalizeDigits('۴۵۶'), '456');
  assert.equal(normalizeDigits('७८९'), '789');
  assert.equal(normalizeDigits('০১২'), '012');
  assert.equal(normalizeDigits('2026-10-28'), '2026-10-28');
});

test('parseAmount reads grouping and decimal marks', () => {
  const cases = [
    ['12', '.', 12],
    ['12.50', '.', 12.5],
    ['12,50', '.', 12.5], // comma keyboard, English UI
    ['12,50', ',', 12.5],
    ['1,234', '.', 1234],
    ['1,234', ',', 1.234],
    ['1.234', ',', 1234],
    ['1.234', '.', 1.234],
    ['1,234.50', '.', 1234.5],
    ['1.234,50', ',', 1234.5],
    ['1,234.50', ',', 1234.5], // both marks: the last one wins regardless of locale
    ['1,234,567', '.', 1234567],
    ['12,34,567.89', '.', 1234567.89], // Indian grouping
    ['1 234,50', ',', 1234.5],
    ['1 234,50', ',', 1234.5], // French narrow no-break space
    ["1'234.50", '.', 1234.5],
    ['١٬٢٣٤٫٥', '٫', 1234.5],
    ['١٢٫٥', '.', 12.5],
    ['.5', '.', 0.5],
    ['12.', '.', 12],
  ];
  for (const [input, decimal, expected] of cases) {
    assert.equal(parseAmount(input, decimal), expected, `${input} with "${decimal}"`);
  }
});

test('parseAmount rejects malformed input', () => {
  for (const input of ['', '.', 'abc', '1.2.3', '1,234.5,6', '1e400', '-5', '12abc', '1,2345,678']) {
    assert.ok(Number.isNaN(parseAmount(input, '.')), input);
  }
});

test('amountInput output parses back to the same number in every language', () => {
  for (const lang of languages) {
    const { decimal, format } = amountInput(lang);
    for (const n of [0.5, 1.234, 12.5, 1234.5, 1234567.89]) {
      assert.equal(parseAmount(format(n), decimal), n, `${lang}: ${format(n)}`);
    }
  }
});
