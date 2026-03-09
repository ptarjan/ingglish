import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { translate, setDictLoader } from 'ingglish';
import { describe, expect, it, beforeAll } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import { segmentChineseText, segmentJapaneseText, segmentKhmerText } from './dict';
import {
  type PhoneDict,
  buildReverseMap,
  convertIpaEntries,
  getLanguage,
  lookupDict,
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

/** Helper to create a PhoneDict from IPA entries (converted to ARPAbet) and a language code. */
function mkDict(entries: Record<string, string>, lang = ''): PhoneDict {
  const langMeta = lang ? getLanguage(lang) : undefined;
  return {
    disableRColoring: langMeta?.disableRColoring,
    entries: convertIpaEntries(entries, lang),
    lang,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
}

describe('lookupDict', () => {
  it('looks up a Latin-script word', () => {
    const dict = mkDict({ hello: '/hɛloʊ/' });
    expect(lookupDict(dict, 'hello')).toBeDefined();
  });

  it('looks up Arabic words', () => {
    const dict = mkDict({ مرحبا: '/marhaba/' });
    expect(lookupDict(dict, 'مرحبا')).toBeDefined();
  });

  it('looks up Japanese words', () => {
    const dict = mkDict({ こんにちは: '/konnitɕiwa/' });
    expect(lookupDict(dict, 'こんにちは')).toBeDefined();
  });

  it('returns undefined for unknown words', () => {
    const dict = mkDict({ hello: '/hɛloʊ/' });
    expect(lookupDict(dict, 'unknown')).toBeUndefined();
  });

  it('splits French contractions on apostrophes', () => {
    const frDict = mkDict({ avec: '/avɛk/', essentiel: '/esɑ̃sjɛl/', l: '/ɛl/', qu: '/ky/' }, 'fr');
    expect(lookupDict(frDict, "l'essentiel")).toBeDefined();
    expect(lookupDict(frDict, "qu'avec")).toBeDefined();
  });

  it('looks up clitic+apostrophe entries from real French dictionaries', () => {
    const frDict = mkDict({ homme: '/ɔm/', il: '/il/', "l'": '/l/', "s'": '/s/' }, 'fr');
    expect(lookupDict(frDict, "s'il")).toBeDefined();
    expect(lookupDict(frDict, "l'homme")).toBeDefined();
  });

  it('merges clitic IPA across apostrophes', () => {
    const frDict = mkDict({ "l'": '/l/', ordre: '/ɔʁdʁ/' }, 'fr');
    const result = lookupDict(frDict, "l'ordre");
    expect(result).toBeDefined();
    // Should start with L (from l') not EH1 L (from bare "l")
    expect(result![0]).toBe('L');
  });

  it('finds words after stripping accents', () => {
    const esDict = mkDict({ barrabas: '/baraβas/' }, 'es');
    expect(lookupDict(esDict, 'Barrabás')).toBeDefined();
  });

  it('finds words with ß via ss normalization', () => {
    const deDict = mkDict({ Bewusstsein: '/bəˈvʊstzaɪn/', dass: '/das/' }, 'de');
    expect(lookupDict(deDict, 'daß')).toBeDefined();
    expect(lookupDict(deDict, 'Bewußtsein')).toBeDefined();
    expect(lookupDict(deDict, 'xyzß')).toBeUndefined();
  });

  it('normalizes curly apostrophes in input', () => {
    const frDict = mkDict({ homme: '/ɔm/', "l'": '/l/' }, 'fr');
    // Curly apostrophe in input → normalized to straight
    expect(lookupDict(frDict, 'l\u2019homme')).toBeDefined();
  });

  it('matches straight apostrophes against curly-apostrophe dict keys', () => {
    const deDict = mkDict({ homme: '/ɔm/', 'l\u2019': '/l/' }, 'de');
    expect(lookupDict(deDict, "l'homme")).toBeDefined();
  });

  it('matches whole word with curly apostrophe in dict entry', () => {
    // Dict has "l'homme" stored with curly apostrophe as a single entry
    const dict: PhoneDict = {
      entries: { 'l\u2019homme': ['L', 'AO1', 'M'] },
      lang: '',
    };
    // Input has straight apostrophe → curly matching finds the entry
    expect(lookupDict(dict, "l'homme")).toEqual(['L', 'AO1', 'M']);
  });

  it('applies IPA override for French "est" (silent st)', () => {
    const noLangDict = mkDict({ est: '/ɛst/' });
    const withoutLang = lookupDict(noLangDict, 'est');
    expect(withoutLang).toBeDefined();
    expect(withoutLang!.join(' ')).toContain('S');

    const frDict = mkDict({ est: '/ɛst/' }, 'fr');
    const withLang = lookupDict(frDict, 'est');
    expect(withLang).toBeDefined();
    expect(withLang!.join(' ')).not.toContain('S');
    expect(withLang!.join(' ')).not.toContain('T');
  });

  it('looks up lowercase variant', () => {
    const dict = mkDict({ hello: '/hɛloʊ/' });
    expect(lookupDict(dict, 'Hello')).toBeDefined();
    expect(lookupDict(dict, 'HELLO')).toBeDefined();
  });

  it('returns undefined when apostrophe part is not found', () => {
    const dict: PhoneDict = {
      entries: { "l'": ['L'] },
      lang: '',
    };
    expect(lookupDict(dict, "l'unknown")).toBeUndefined();
  });

  it('apostrophe splitting uses override lookup for parts', () => {
    const frDict: PhoneDict = {
      disableRColoring: true,
      entries: { "l'": ['L'] },
      lang: 'fr',
    };
    const result = lookupDict(frDict, "l'est");
    expect(result).toBeDefined();
  });

  it('apostrophe splitting uses G2P fallback for parts', () => {
    const eoDict: PhoneDict = {
      disableRColoring: true,
      entries: { "l'": ['L'] },
      lang: 'eo',
    };
    const result = lookupDict(eoDict, "l'domo");
    expect(result).toBeDefined();
  });

  it('apostrophe splitting uses word resolver for parts', () => {
    const fiDict: PhoneDict = {
      disableRColoring: true,
      entries: { "l'": ['L'], talo: ['T', 'AH1', 'L', 'OW0'] },
      lang: 'fi',
    };
    const result = lookupDict(fiDict, "l'talossa");
    expect(result).toBeDefined();
    expect(result).toEqual(['L', 'T', 'AH1', 'L', 'OW0']);
  });
});

describe('convertIpaEntries', () => {
  it('passes through already-ARPAbet entries', () => {
    const entries = { hello: ['HH', 'AH0', 'L', 'OW1'] };
    const result = convertIpaEntries(entries, 'en');
    expect(result.hello).toEqual(['HH', 'AH0', 'L', 'OW1']);
  });

  it('handles empty entries', () => {
    const result = convertIpaEntries({}, 'en');
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('converts IPA string entries to ARPAbet arrays', () => {
    const raw: Record<string, string> = {
      bonjour: '/bɔ̃ʒuʁ/',
      merci: '/mɛʁsi/',
    };
    const result = convertIpaEntries(raw, 'fr');
    expect(Array.isArray(result.bonjour)).toBe(true);
    expect(result.bonjour!.length).toBeGreaterThan(0);
    expect(Array.isArray(result.merci)).toBe(true);
  });

  it('applies default stress when IPA has no stress markers', () => {
    const raw: Record<string, string> = { chat: '/ʃa/' };
    const result = convertIpaEntries(raw, 'fr');
    expect(result.chat!.some((p: string) => p.endsWith('1'))).toBe(true);
  });

  it('strips IPA slash delimiters and syllable dots', () => {
    const raw: Record<string, string> = { bonjour: '/bɔ̃.ʒuʁ/' };
    const result = convertIpaEntries(raw, 'fr');
    expect(result.bonjour).toBeDefined();
    expect(result.bonjour!.length).toBeGreaterThan(0);
  });

  it('skips entries that produce empty ARPAbet', () => {
    const raw: Record<string, string> = { empty: '/' };
    const result = convertIpaEntries(raw, 'fr');
    expect(result.empty).toBeUndefined();
  });
});

describe('applyDefaultStress (via convertIpaEntries)', () => {
  it('does not add stress when ARPAbet already has stress digits', () => {
    const raw: Record<string, string> = { hello: '/həˈloʊ/' };
    const result = convertIpaEntries(raw, 'en');
    expect(result.hello).toBeDefined();
    const stressedVowels = result.hello!.filter((p: string) => /\d$/.test(p));
    expect(stressedVowels.length).toBeGreaterThan(0);
  });

  it('adds stress to the last vowel when no stress exists', () => {
    const raw: Record<string, string> = { monde: '/mɔnd/' };
    const result = convertIpaEntries(raw, 'fr');
    expect(result.monde).toBeDefined();
    const stressed = result.monde!.filter((p: string) => p.endsWith('1'));
    expect(stressed.length).toBe(1);
  });

  it('handles consonant-only sequences (no vowel to stress)', () => {
    const raw: Record<string, string> = { hmm: '/m/' };
    const result = convertIpaEntries(raw, 'fr');
    expect(result.hmm).toEqual(['M']);
  });
});

describe('buildReverseMap', () => {
  it('builds a map from stress-free ARPAbet to source words', () => {
    const dict = mkDict({ hello: '/həˈloʊ/', world: '/wɝld/' });
    const reverseMap = buildReverseMap(dict);
    expect(reverseMap.size).toBeGreaterThan(0);
    for (const [, words] of reverseMap) {
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    }
  });

  it('groups homophones under the same key', () => {
    const dict: PhoneDict = {
      entries: {
        bare: ['B', 'EH1', 'R'],
        bear: ['B', 'EH1', 'R'],
      },
      lang: 'en',
    };
    const reverseMap = buildReverseMap(dict);
    const key = 'B EH R';
    expect(reverseMap.get(key)).toContain('bare');
    expect(reverseMap.get(key)).toContain('bear');
  });

  it('includes overrides in reverse map', () => {
    const dict = mkDict({ bonjour: '/bɔ̃ʒuʁ/' }, 'fr');
    const reverseMap = buildReverseMap(dict);
    expect(reverseMap.size).toBeGreaterThan(0);
  });

  it('skips entries with empty phoneme key', () => {
    const dict: PhoneDict = {
      entries: { empty: [] },
      lang: 'en',
    };
    const reverseMap = buildReverseMap(dict);
    expect(reverseMap.size).toBe(0);
  });
});

describe('segmenters', () => {
  it('segmentKhmerText inserts spaces between Khmer words', () => {
    const text = 'សួស្តី';
    const result = segmentKhmerText(text);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('segmentKhmerText normalizes zero-width spaces', () => {
    const text = 'ខ្ញុំ\u200Bស្រលាញ់';
    const result = segmentKhmerText(text);
    expect(result).not.toContain('\u200B');
  });

  it('segmentJapaneseText segments Japanese text', () => {
    const result = segmentJapaneseText('東京タワー');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('segmentChineseText segments Chinese text', () => {
    const result = segmentChineseText('你好世界');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Khmer compound decomposition', () => {
  it('decomposes Khmer compounds via lookupDict', () => {
    const dict: PhoneDict = {
      disableRColoring: true,
      entries: {
        ការ: ['K', 'AA1'],
        ងារ: ['NG', 'AA1'],
      },
      lang: 'km',
      nonLatinScript: true,
      preprocess: segmentKhmerText,
    };
    const result = lookupDict(dict, 'ការងារ');
    expect(result).toEqual(['K', 'AA1', 'NG', 'AA1']);
  });

  it('returns undefined for non-decomposable Khmer words', () => {
    const dict: PhoneDict = {
      disableRColoring: true,
      entries: { ការ: ['K', 'AA1'] },
      lang: 'km',
      nonLatinScript: true,
      preprocess: segmentKhmerText,
    };
    expect(lookupDict(dict, 'xxxxxx')).toBeUndefined();
  });

  it('returns exact match from direct lookup (not compound)', () => {
    const dict: PhoneDict = {
      disableRColoring: true,
      entries: { ការ: ['K', 'AA1'] },
      lang: 'km',
      nonLatinScript: true,
      preprocess: segmentKhmerText,
    };
    expect(lookupDict(dict, 'ការ')).toEqual(['K', 'AA1']);
  });
});

describe('language resolvers via translate', () => {
  it('German ß normalization', async () => {
    const result = await translate('daß', { lang: 'de' });
    expect(result).toBeTruthy();
  }, 30_000);

  it('Swedish suffix stripping', async () => {
    const result = await translate('flickorna', { lang: 'sv' });
    expect(result).toBeTruthy();
  });

  it('Finnish morphology', async () => {
    const result = await translate('talossani', { lang: 'fi' });
    expect(result).toBeTruthy();
  });

  it('Esperanto morphology', async () => {
    const result = await translate('laboris', { lang: 'eo' });
    expect(result).toBeTruthy();
  });

  it('Romanian suffix stripping', async () => {
    const result = await translate('băiatul', { lang: 'ro' });
    expect(result).toBeTruthy();
  });

  it('Norwegian old orthography', async () => {
    const result = await translate('af', { lang: 'nb' });
    expect(result).toBeTruthy();
  });

  it('Malay prefix-suffix', async () => {
    const result = await translate('memakan', { lang: 'ma' });
    expect(result).toBeTruthy();
  });

  it('Persian verb forms', async () => {
    const result = await translate('میکند', { lang: 'fa' });
    expect(result).toBeTruthy();
  });

  it('Swahili verb prefixes', async () => {
    const result = await translate('wanakula', { lang: 'sw' });
    expect(result).toBeTruthy();
  });
});

// Khmer and sample coverage tests are in dict-coverage.test.ts (slow, reads website data files).
// Run separately via: npx vitest run src/dict-coverage.test.ts
