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
});
