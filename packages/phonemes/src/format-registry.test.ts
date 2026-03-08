import { describe, expect, it } from 'vitest';
import {
  getFormatHandler,
  getFormatIsLatinScript,
  getFormatJoinSeparator,
  getFormatLabel,
  getFormatNativeLabel,
  getFormatPreservesCase,
  registerFormat,
} from './format-registry';

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
    it('returns true by default for unknown format', () => {
      expect(getFormatIsLatinScript('unknown-format')).toBe(true);
    });

    it('returns registered value', () => {
      registerFormat('non-latin', { isLatinScript: false });
      expect(getFormatIsLatinScript('non-latin')).toBe(false);
    });

    it('defaults to true when not specified', () => {
      registerFormat('latin-default', { label: 'Latin Default' });
      expect(getFormatIsLatinScript('latin-default')).toBe(true);
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
    it('falls back to format name for unknown format', () => {
      expect(getFormatNativeLabel('no-native')).toBe('no-native');
    });

    it('returns native label when set', () => {
      registerFormat('with-native', { label: 'Standard', nativeLabel: '𐑖𐑱𐑝' });
      expect(getFormatNativeLabel('with-native')).toBe('𐑖𐑱𐑝');
    });

    it('falls back to label when no native label', () => {
      registerFormat('no-native-label', { label: 'Fallback Label' });
      expect(getFormatNativeLabel('no-native-label')).toBe('Fallback Label');
    });
  });

  describe('getFormatPreservesCase', () => {
    it('returns true by default for unknown format', () => {
      expect(getFormatPreservesCase('unknown-case')).toBe(true);
    });

    it('defaults to isLatinScript value', () => {
      registerFormat('non-latin-case', { isLatinScript: false });
      expect(getFormatPreservesCase('non-latin-case')).toBe(false);
    });

    it('respects explicit preservesCase override', () => {
      registerFormat('explicit-case', { isLatinScript: false, preservesCase: true });
      expect(getFormatPreservesCase('explicit-case')).toBe(true);
    });
  });
});
