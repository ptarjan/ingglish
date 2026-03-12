import { describe, expect, it } from 'vitest';
import { charsetFromHeader, charsetFromHtml } from './validate-sample-urls';

describe('charsetFromHeader', () => {
  it.each([
    ['text/html; charset=utf-8', 'utf-8', 'extracts charset from Content-Type header'],
    ['text/html; charset=UTF-8', 'UTF-8', 'handles uppercase charset'],
    ['text/html; charset="iso-8859-1"', 'iso-8859-1', 'handles quoted charset'],
    ['text/html; charset = utf-8', 'utf-8', 'handles charset with spaces around equals'],
  ] as const)('%s -> %s (%s)', (input, expected, _desc) => {
    expect(charsetFromHeader(input)).toBe(expected);
  });

  it('returns null for missing charset', () => {
    expect(charsetFromHeader('text/html')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(charsetFromHeader(null)).toBeNull();
  });
});

describe('charsetFromHtml', () => {
  it.each([
    [
      '<html><head><meta charset="utf-8"></head></html>',
      'utf-8',
      'extracts charset from meta charset tag',
    ],
    [
      '<html><head><meta http-equiv="Content-Type" content="text/html;charset=iso-8859-1"></head></html>',
      'iso-8859-1',
      'extracts charset from meta http-equiv',
    ],
    [
      '<?xml version="1.0" encoding="Shift_JIS"?><html></html>',
      'Shift_JIS',
      'extracts encoding from XML declaration',
    ],
    [
      "<html><head><meta charset='windows-1252'></head></html>",
      'windows-1252',
      'handles single-quoted charset',
    ],
  ] as const)('%s -> %s (%s)', (html, expected, _desc) => {
    expect(charsetFromHtml(html)).toBe(expected);
  });

  it('returns null when no charset declared', () => {
    const html = '<html><head><title>No charset</title></head></html>';
    expect(charsetFromHtml(html)).toBeNull();
  });
});
