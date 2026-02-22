/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from '@ingglish/phonemes';
import { useCustomMapping, hasExperimentMapping, registerExperiment } from './useCustomMapping';

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

const DEFAULT_PHONEME_MAP: Record<string, string> = {
  ...ARPABET_TO_INGGLISH_MAP,
  AH0: 'a',
};
const DEFAULT_R_COLORED: Record<string, string> = Object.fromEntries(R_COLORED_FORWARD);

const STORAGE_KEY = 'experimentMapping';

describe('useCustomMapping', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset URL hash
    window.history.replaceState(null, '', window.location.pathname);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('defaults: hasCustomizations is false, phonemeMap matches defaults, version is 0', () => {
      const { result } = renderHook(() => useCustomMapping());
      expect(result.current.hasCustomizations).toBe(false);
      expect(result.current.phonemeMap).toEqual(DEFAULT_PHONEME_MAP);
      expect(result.current.version).toBe(0);
    });

    it('initializes from URL hash when present', () => {
      window.history.replaceState(null, '', '#m=AA:test');
      const { result } = renderHook(() => useCustomMapping());
      expect(result.current.hasCustomizations).toBe(true);
      expect(result.current.phonemeMap.AA).toBe('test');
    });

    it('initializes from localStorage when no hash', () => {
      const config = { phonemeMap: { AA: 'stored' }, rColoredPrefixes: {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

      const { result } = renderHook(() => useCustomMapping());
      expect(result.current.hasCustomizations).toBe(true);
      expect(result.current.phonemeMap.AA).toBe('stored');
    });

    it('URL hash takes priority over localStorage', () => {
      const config = { phonemeMap: { AA: 'stored' }, rColoredPrefixes: {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.history.replaceState(null, '', '#m=AA:fromhash');

      const { result } = renderHook(() => useCustomMapping());
      expect(result.current.phonemeMap.AA).toBe('fromhash');
    });
  });

  describe('setPhonemeSpelling', () => {
    it('updates phonemeMap and increments version', () => {
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.setPhonemeSpelling('AA', 'ah');
      });

      expect(result.current.phonemeMap.AA).toBe('ah');
      expect(result.current.version).toBe(1);
      expect(result.current.hasCustomizations).toBe(true);
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.setPhonemeSpelling('AA', 'ah');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as {
        phonemeMap: Record<string, string>;
      };
      expect(stored.phonemeMap.AA).toBe('ah');
    });

    it('empty spelling removes the override', () => {
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.setPhonemeSpelling('AA', 'ah');
      });
      expect(result.current.phonemeMap.AA).toBe('ah');

      act(() => {
        result.current.setPhonemeSpelling('AA', '');
      });
      // Should revert to default
      expect(result.current.phonemeMap.AA).toBe(DEFAULT_PHONEME_MAP.AA);
    });
  });

  describe('setRColoredPrefix', () => {
    it('updates rColoredPrefixes and increments version', () => {
      const { result } = renderHook(() => useCustomMapping());

      // Pick a key from the default R_COLORED map
      const vowel = Object.keys(DEFAULT_R_COLORED)[0]!;
      act(() => {
        result.current.setRColoredPrefix(vowel, 'test');
      });

      expect(result.current.rColoredPrefixes[vowel]).toBe('test');
      expect(result.current.version).toBe(1);
      expect(result.current.hasCustomizations).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears all customizations and increments version', () => {
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.setPhonemeSpelling('AA', 'ah');
      });
      expect(result.current.hasCustomizations).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.hasCustomizations).toBe(false);
      expect(result.current.phonemeMap).toEqual(DEFAULT_PHONEME_MAP);
      expect(result.current.version).toBe(2); // one for set, one for reset
    });

    it('clears URL hash via history.replaceState', () => {
      window.history.replaceState(null, '', '#m=AA:test');
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.reset();
      });

      expect(window.location.hash).toBe('');
    });

    it('removes localStorage entry', () => {
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.setPhonemeSpelling('AA', 'ah');
      });
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      act(() => {
        result.current.reset();
      });
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('shareUrl', () => {
    it('returns base URL without hash when no customizations', () => {
      const { result } = renderHook(() => useCustomMapping());
      expect(result.current.shareUrl).toBe(window.location.origin + '/experiment');
      expect(result.current.shareUrl).not.toContain('#');
    });

    it('returns URL with encoded hash when customizations exist', () => {
      const { result } = renderHook(() => useCustomMapping());

      act(() => {
        result.current.setPhonemeSpelling('AA', 'ah');
      });

      expect(result.current.shareUrl).toContain('#');
      expect(result.current.shareUrl).toContain('m=AA:ah');
    });
  });
});

describe('hasExperimentMapping', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when no mapping in localStorage', () => {
    expect(hasExperimentMapping()).toBe(false);
  });

  it('returns true when mapping exists in localStorage', () => {
    const config = { phonemeMap: { AA: 'test' }, rColoredPrefixes: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    expect(hasExperimentMapping()).toBe(true);
  });

  it('returns false for empty diffs in localStorage', () => {
    const config = { phonemeMap: {}, rColoredPrefixes: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    expect(hasExperimentMapping()).toBe(false);
  });
});

describe('registerExperiment', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('works without stored mapping (registers defaults)', () => {
    expect(() => {
      registerExperiment();
    }).not.toThrow();
  });

  it('works with stored mapping', () => {
    const config = { phonemeMap: { AA: 'test' }, rColoredPrefixes: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    expect(() => {
      registerExperiment();
    }).not.toThrow();
  });
});
