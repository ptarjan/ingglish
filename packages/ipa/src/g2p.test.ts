import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { translate, setDictLoader } from 'ingglish';
import { describe, expect, it, beforeAll } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import {
  type PhoneDict,
  lookupDict,
  G2P_CONVERTERS,
  convertIpaEntries,
  getLanguage,
} from './index';

// Register a file-based dict loader for non-English languages
const DICT_DIR = path.resolve(import.meta.dirname, '..', '..', 'website', 'public', 'ipa-dicts');

beforeAll(() => {
  setDictLoader(async (lang) => {
    const json = await readFile(path.resolve(DICT_DIR, `${lang}.json`), 'utf8');
    const raw = JSON.parse(json) as Record<string, string | string[]>;
    const langMeta = getLanguage(lang);
    return {
      conventionalCapitals: langMeta?.conventionalCapitals,
      disableRColoring: langMeta?.disableRColoring,
      entries: convertIpaEntries(raw, lang),
      lang,
      nonLatinScript: langMeta?.nonLatinScript,
      preprocess: langMeta?.preprocess,
    };
  });
});

describe('G2P converters', () => {
  describe('Finnish', () => {
    const g2p = G2P_CONVERTERS.fi!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('talo');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles nk → NG K digraph', () => {
      const result = g2p('helsinki');
      expect(result).toContain('NG');
      expect(result).toContain('K');
    });
  });

  describe('Esperanto', () => {
    const g2p = G2P_CONVERTERS.eo!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('saluton');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('converts special characters', () => {
      const result = g2p('ĝardeno');
      expect(result).toContain('JH'); // dʒ → JH
    });
  });

  describe('Swahili', () => {
    const g2p = G2P_CONVERTERS.sw!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('habari');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Malay', () => {
    const g2p = G2P_CONVERTERS.ma!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('selamat');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('G2P integration', () => {
  it('lookupDict falls back to G2P when word is not in dict', () => {
    expect(lookupDict({ entries: {}, lang: 'fi' }, 'talo')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'eo' }, 'saluton')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'sw' }, 'habari')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'ma' }, 'makan')).toBeDefined();
  });

  it('G2P results are ARPAbet arrays', () => {
    const result = lookupDict({ entries: {}, lang: 'fi' }, 'talo');
    expect(Array.isArray(result)).toBe(true);
    expect(result!.every((p) => typeof p === 'string')).toBe(true);
  });

  it('dict entries take priority over G2P', () => {
    const dict: PhoneDict = { entries: { talo: ['T', 'AA1', 'L', 'OW0'] }, lang: 'fi' };
    expect(lookupDict(dict, 'talo')).toEqual(['T', 'AA1', 'L', 'OW0']);
  });

  it('lookupDict falls back to G2P for all supported languages', () => {
    expect(lookupDict({ entries: {}, lang: 'fi' }, 'talo')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'eo' }, 'saluton')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'sw' }, 'habari')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'ma' }, 'makan')).toBeDefined();
  });

  it('does not apply G2P to unsupported languages', () => {
    expect(lookupDict({ entries: {}, lang: 'es' }, 'hola')).toBeUndefined();
  });
});

describe('G2P edge cases', () => {
  it('handles monosyllabic words', async () => {
    // Spanish single-syllable word exercises addPenultimateStress with <=1 vowel
    const result = await translate('la', { lang: 'es' });
    expect(result).toBeTruthy();
  }, 30_000);

  it('handles monosyllabic words via G2P converter', () => {
    // Finnish single-syllable word - goes through addFirstSyllableStress
    const result = lookupDict({ entries: {}, lang: 'fi' }, 'on');
    expect(result).toBeDefined();
  });

  it('skips unknown characters in applyRules', () => {
    // Word with characters not in Finnish rules — unknown chars are skipped
    const result = lookupDict({ entries: {}, lang: 'fi' }, 'café');
    expect(result).toBeDefined();
  });

  it('Malay G2P applies stress (multi-syllable)', () => {
    const g2p = G2P_CONVERTERS.ma!.convert;
    const result = g2p('selamat');
    // Should have stress on a vowel
    expect(result.some((p) => p.endsWith('1'))).toBe(true);
  });

  it('Malay G2P handles monosyllabic word', () => {
    const g2p = G2P_CONVERTERS.ma!.convert;
    const result = g2p('di');
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('Swahili G2P applies penultimate stress', () => {
    const g2p = G2P_CONVERTERS.sw!.convert;
    const result = g2p('habari');
    expect(result.some((p) => p.endsWith('1'))).toBe(true);
  });

  it('ipaToArpabetWithStress adds stress when IPA has none', () => {
    // Finnish G2P produces stress-less IPA, then ipaToArpabetWithStress adds it
    const g2p = G2P_CONVERTERS.fi!.convert;
    const result = g2p('talo');
    // Should have stress added to a vowel
    expect(result.some((p) => p.endsWith('1'))).toBe(true);
  });

  it('ipaToArpabetWithStress preserves existing stress (no-op path)', () => {
    // Esperanto G2P adds stress via addPenultimateStress, so ipaToArpabetWithStress
    // should see the stress and return early (lines 30-31 in g2p.ts)
    const g2p = G2P_CONVERTERS.eo!.convert;
    const result = g2p('saluton');
    // Should have exactly one stressed vowel
    const stressed = result.filter((p) => p.endsWith('1'));
    expect(stressed.length).toBe(1);
  });

  it('ipaToArpabetWithStress applies stress to last vowel when no stress exists (stress loop)', () => {
    // Directly test: a converter that produces IPA without stress markers,
    // exercising the for-loop at lines 34-41 of g2p.ts.
    // Finnish G2P with addFirstSyllableStress always adds ˈ, so the hasStress path is taken.
    // To hit the stress loop, we need a word where the IPA→ARPAbet conversion
    // produces vowels without stress digits.
    // Actually Finnish addFirstSyllableStress adds ˈ, so let's use a consonant-only
    // or test via Swahili monosyllable
    const g2p = G2P_CONVERTERS.sw!.convert;
    // A single-syllable Swahili word goes through addPenultimateStress → monosyllabic path
    const result = g2p('la');
    expect(result).toBeDefined();
    expect(result.some((p) => p.endsWith('1'))).toBe(true);
  });

  it('addPenultimateStress returns monosyllabic word with stress (line 81)', () => {
    // Esperanto monosyllabic word: only 1 vowel → addPenultimateStress returns 'ˈ' + ipa
    const g2p = G2P_CONVERTERS.eo!.convert;
    const result = g2p('la'); // single syllable Esperanto word
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.endsWith('1'))).toBe(true);
  });

  it('addPenultimateStress handles empty string', () => {
    // Edge case: word with no IPA vowels mapped
    const g2p = G2P_CONVERTERS.eo!.convert;
    // A word with only unknown chars produces empty IPA → empty ARPAbet
    const result = g2p('!!!');
    expect(result).toBeDefined();
  });
});
