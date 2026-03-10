import { describe, expect, it } from 'vitest';
import {
  getFormatHandler,
  getFormatIsLatinScript,
  getFormatJoinSeparator,
  getFormatLabel,
  getFormatNativeLabel,
  getFormatPreservesCase,
  registerFormat,
} from './index';

describe('format-registry', () => {
  describe('registerFormat and getFormatHandler', () => {
    it('registers and retrieves a format', () => {
      registerFormat('test-fmt', { label: 'Test Format' });
      const handler = getFormatHandler('test-fmt');
      expect(handler).toBeDefined();
      expect(handler?.label).toBe('Test Format');
    });

    it('returns undefined for unknown format', () => {
      expect(getFormatHandler('nonexistent')).toBeUndefined();
    });

    it('merges with existing registration', () => {
      registerFormat('merge-test', { label: 'Original' });
      registerFormat('merge-test', { nativeLabel: 'Native' });
      const handler = getFormatHandler('merge-test');
      expect(handler?.label).toBe('Original');
      expect(handler?.nativeLabel).toBe('Native');
    });
  });

  describe('getFormatIsLatinScript', () => {
    it.each([
      {
        expected: true,
        format: 'unknown-format',
        options: undefined,
        scenario: 'returns true by default for unknown format',
      },
      {
        expected: false,
        format: 'non-latin',
        options: { isLatinScript: false } as const,
        scenario: 'returns registered value',
      },
      {
        expected: true,
        format: 'latin-default',
        options: { label: 'Latin Default' } as const,
        scenario: 'defaults to true when not specified',
      },
    ])('$scenario', ({ expected, format, options }) => {
      if (options) {
        registerFormat(format, options);
      }
      expect(getFormatIsLatinScript(format)).toBe(expected);
    });
  });

  describe('getFormatJoinSeparator', () => {
    it('returns empty string by default', () => {
      expect(getFormatJoinSeparator('unknown-sep')).toBe('');
    });

    it('returns registered separator', () => {
      registerFormat('hyphen-fmt', { joinSeparator: '-' });
      expect(getFormatJoinSeparator('hyphen-fmt')).toBe('-');
    });
  });

  describe('getFormatLabel', () => {
    it('falls back to format name for unknown format', () => {
      expect(getFormatLabel('my-unknown-fmt')).toBe('my-unknown-fmt');
    });

    it('returns registered label', () => {
      registerFormat('labeled-fmt', { label: 'My Label' });
      expect(getFormatLabel('labeled-fmt')).toBe('My Label');
    });
  });

  describe('getFormatNativeLabel', () => {
    it.each([
      {
        expected: 'no-native',
        format: 'no-native',
        options: undefined,
        scenario: 'falls back to format name for unknown format',
      },
      {
        expected: '𐑖𐑱𐑝',
        format: 'with-native',
        options: { label: 'Standard', nativeLabel: '𐑖𐑱𐑝' } as const,
        scenario: 'returns native label when set',
      },
      {
        expected: 'Fallback Label',
        format: 'no-native-label',
        options: { label: 'Fallback Label' } as const,
        scenario: 'falls back to label when no native label',
      },
    ])('$scenario', ({ expected, format, options }) => {
      if (options) {
        registerFormat(format, options);
      }
      expect(getFormatNativeLabel(format)).toBe(expected);
    });
  });

  describe('getFormatPreservesCase', () => {
    it.each([
      {
        expected: true,
        format: 'unknown-case',
        options: undefined,
        scenario: 'returns true by default for unknown format',
      },
      {
        expected: false,
        format: 'non-latin-case',
        options: { isLatinScript: false } as const,
        scenario: 'defaults to isLatinScript value',
      },
      {
        expected: true,
        format: 'explicit-case',
        options: { isLatinScript: false, preservesCase: true } as const,
        scenario: 'respects explicit preservesCase override',
      },
    ])('$scenario', ({ expected, format, options }) => {
      if (options) {
        registerFormat(format, options);
      }
      expect(getFormatPreservesCase(format)).toBe(expected);
    });
  });
});
