import { describe, expect, it } from 'vitest';
import { charsetFromHeader, charsetFromHtml } from './validate-sample-urls';

describe('charsetFromHeader', () => {
  it('extracts charset from Content-Type header', () => {
    expect(charsetFromHeader('text/html; charset=utf-8')).toBe('utf-8');
  });

  it('handles uppercase charset', () => {
    expect(charsetFromHeader('text/html; charset=UTF-8')).toBe('UTF-8');
  });

  it('handles quoted charset', () => {
    expect(charsetFromHeader('text/html; charset="iso-8859-1"')).toBe('iso-8859-1');
  });

  it('returns null for missing charset', () => {
    expect(charsetFromHeader('text/html')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(charsetFromHeader(null)).toBeNull();
  });

  it('handles charset with spaces around equals', () => {
    expect(charsetFromHeader('text/html; charset = utf-8')).toBe('utf-8');
  });
});

describe('charsetFromHtml', () => {
  it('extracts charset from meta charset tag', () => {
    const html = '<html><head><meta charset="utf-8"></head></html>';
    expect(charsetFromHtml(html)).toBe('utf-8');
  });

  it('extracts charset from meta http-equiv', () => {
    const html =
      '<html><head><meta http-equiv="Content-Type" content="text/html;charset=iso-8859-1"></head></html>';
    expect(charsetFromHtml(html)).toBe('iso-8859-1');
  });

  it('extracts encoding from XML declaration', () => {
    const html = '<?xml version="1.0" encoding="Shift_JIS"?><html></html>';
    expect(charsetFromHtml(html)).toBe('Shift_JIS');
  });

  it('returns null when no charset declared', () => {
    const html = '<html><head><title>No charset</title></head></html>';
    expect(charsetFromHtml(html)).toBeNull();
  });

  it('handles single-quoted charset', () => {
    const html = "<html><head><meta charset='windows-1252'></head></html>";
    expect(charsetFromHtml(html)).toBe('windows-1252');
  });
});
