/**
 * Performance optimization regression tests.
 *
 * These tests verify that fast paths are being used by spying on
 * slow-path operations and ensuring they're not called unnecessarily.
 */
import { describe, it, expect, vi } from 'vitest';
import { stripStress, STRESS_MARKER_REGEX } from './phonemes/arpabet';
import { lookupPronunciation } from './dictionary/lookup';
import { lookupPhonemeKey } from './dictionary/reverse';
import { arpabetToIngglish } from './convert/to-ingglish';
import { setupDictionary } from './test-setup';

describe('performance optimizations', () => {
  setupDictionary();

  describe('stripStress charCode optimization', () => {
    it('should use charCode 48-50 for stress markers (not regex)', () => {
      // Verify the charCode range is exactly '0'=48, '1'=49, '2'=50
      expect('0'.charCodeAt(0)).toBe(48);
      expect('1'.charCodeAt(0)).toBe(49);
      expect('2'.charCodeAt(0)).toBe(50);

      // These should strip the stress marker
      expect(stripStress('AH0')).toBe('AH');
      expect(stripStress('EY1')).toBe('EY');
      expect(stripStress('IY2')).toBe('IY');

      // Boundary test: '/' is charCode 47, should NOT be stripped
      expect(stripStress('AH/')).toBe('AH/');
      // Boundary test: '3' is charCode 51, should NOT be stripped
      expect(stripStress('AH3')).toBe('AH3');
    });

    it('should not use regex for stress stripping', () => {
      // Spy on regex methods to ensure they're not called
      const execSpy = vi.spyOn(STRESS_MARKER_REGEX, 'exec');
      const testSpy = vi.spyOn(STRESS_MARKER_REGEX, 'test');

      execSpy.mockClear();
      testSpy.mockClear();

      // Call stripStress multiple times
      stripStress('AH0');
      stripStress('EY1');
      stripStress('B');
      stripStress('SH');

      // Regex should NOT be called (we use charCode instead)
      expect(execSpy).not.toHaveBeenCalled();
      expect(testSpy).not.toHaveBeenCalled();

      execSpy.mockRestore();
      testSpy.mockRestore();
    });
  });

  describe('lookupPronunciation toLowerCase optimization', () => {
    it('should call toLowerCase only once per lookup (not in custom-words too)', () => {
      const toLowerCaseSpy = vi.spyOn(String.prototype, 'toLowerCase');

      // Test with a regular dictionary word (use unique word to avoid cache conflicts)
      toLowerCaseSpy.mockClear();
      lookupPronunciation('Zebra');
      const callsForRegular = toLowerCaseSpy.mock.calls.length;

      // Test with a custom pronunciation word (vs)
      toLowerCaseSpy.mockClear();
      lookupPronunciation('VS');
      const callsForCustom = toLowerCaseSpy.mock.calls.length;

      // Each lookup should only call toLowerCase once
      // (not twice - once in lookupPronunciation and once in getCustomPronunciation)
      expect(callsForRegular).toBe(1);
      expect(callsForCustom).toBe(1);

      toLowerCaseSpy.mockRestore();
    });
  });

  describe('lookupPronunciation pre-split dictionary', () => {
    it('should not call split at runtime (phonemes pre-split at build time)', () => {
      const splitSpy = vi.spyOn(String.prototype, 'split');
      splitSpy.mockClear();

      // Look up multiple words
      lookupPronunciation('hello');
      lookupPronunciation('world');
      lookupPronunciation('test');

      // No space-splitting should happen (dictionary values are already arrays)
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const spaceSplitCalls = splitSpy.mock.calls.filter((call) => String(call[0]) === ' ').length;
      expect(spaceSplitCalls).toBe(0);

      splitSpy.mockRestore();
    });
  });

  describe('lookupPhonemeKey pre-sorted dictionary', () => {
    it('should not call sortByFrequency at runtime (pre-sorted at build time)', async () => {
      const frequencyModule = await import('./dictionary/frequency');
      const sortSpy = vi.spyOn(frequencyModule, 'sortByFrequency');
      sortSpy.mockClear();

      // Look up multiple phoneme keys including homophones
      lookupPhonemeKey('T UW'); // to, too, two
      lookupPhonemeKey('HH AH L OW'); // hello
      lookupPhonemeKey('DH AH'); // the

      // No sorting should happen (pre-sorted at build time)
      expect(sortSpy).not.toHaveBeenCalled();

      sortSpy.mockRestore();
    });

    it('should return words sorted by frequency', () => {
      // "T UW" has homophones: to, too, two
      // "to" should be first (most common)
      const words = lookupPhonemeKey('T UW');
      expect(words).toBeDefined();
      expect(words?.[0]).toBe('to');
    });
  });

  describe('arpabetToIngglish R-coloring optimization', () => {
    it('should check R directly without calling stripStress on next phoneme', async () => {
      // The optimization: instead of calling stripStress(nextPhoneme) to check for R,
      // we compare directly to 'R' since R never has stress markers

      // Import the module to spy on it
      const arpabetModule = await import('./phonemes/arpabet');
      const stripStressSpy = vi.spyOn(arpabetModule, 'stripStress');

      stripStressSpy.mockClear();

      // Convert "star" = S T AA R (4 phonemes)
      const phonemes = ['S', 'T', 'AA1', 'R'];
      const result = arpabetToIngglish(phonemes);
      expect(result).toBe('star');

      // stripStress should be called once per phoneme (4 times)
      // NOT twice per phoneme (which would be 8 times if we called it for next phoneme too)
      expect(stripStressSpy.mock.calls.length).toBe(4);

      stripStressSpy.mockRestore();
    });

    it('should verify R has no stress variants in ARPAbet', () => {
      // This test documents the assumption that makes the optimization valid
      // R is always just 'R', never 'R0', 'R1', or 'R2'
      expect(stripStress('R')).toBe('R');
      expect(stripStress('R0')).toBe('R'); // Would be 'R' if R0 existed
      expect(stripStress('R1')).toBe('R'); // Would be 'R' if R1 existed

      // The actual CMU dictionary never uses R0, R1, R2 - this is just defensive
    });
  });

  describe('isVowel/isConsonant Set optimization', () => {
    it('should use Set.has for O(1) lookup', async () => {
      const { isVowel, isConsonant } = await import('./phonemes/arpabet');

      // Spy on Set.prototype.has to verify it's being used
      const hasSpy = vi.spyOn(Set.prototype, 'has');
      hasSpy.mockClear();

      // Call isVowel and isConsonant
      isVowel('AH0');
      isVowel('EY1');
      isConsonant('B');
      isConsonant('SH');

      // Set.has should be called (O(1) lookup)
      expect(hasSpy).toHaveBeenCalled();
      expect(hasSpy.mock.calls.length).toBeGreaterThanOrEqual(4);

      hasSpy.mockRestore();
    });
  });
});
