import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { translate, setDictLoader  } from 'ingglish';
import { describe, expect, it, beforeAll } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import { type PhoneDict, convertIpaEntries, getLanguage, lookupDict } from './index';

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
