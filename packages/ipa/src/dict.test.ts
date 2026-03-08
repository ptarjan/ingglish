import { describe, expect, it } from 'vitest';
import { getStress, isVowel } from '@ingglish/phonemes'; // also registers 'pronunciation' format
import type { PhoneDict } from './index';
import {
  getLanguage,
  ipaToArpabet,
  IPA_LANGUAGE_OVERRIDES,
  lookupDict,
  NOT_FOUND_MARKER,
  translateDict,
  translateDictWithMapping,
} from './index';

/** Convert IPA string → ARPAbet with default stress applied. */
function ipa(ipaStr: string, lang?: string): string[] {
  const clean = ipaStr.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
  const overrides = lang ? IPA_LANGUAGE_OVERRIDES[lang] : undefined;
  const arpabet = ipaToArpabet(clean, overrides);
  const hasStress = arpabet.some((p) => isVowel(p) && getStress(p) !== null);
  if (hasStress) {
    return arpabet;
  }
  const result = [...arpabet];
  for (let i = result.length - 1; i >= 0; i--) {
    if (isVowel(result[i]!)) {
      result[i] = result[i]! + '1';
      break;
    }
  }
  return result;
}

/** Helper to create a PhoneDict from IPA entries (converted to ARPAbet) and a language code. */
function mkDict(entries: Record<string, string>, lang = ''): PhoneDict {
  const arpabetEntries: Record<string, string[]> = {};
  for (const [word, ipaStr] of Object.entries(entries)) {
    arpabetEntries[word] = ipa(ipaStr, lang || undefined);
  }
  const langMeta = lang ? getLanguage(lang) : undefined;
  return {
    disableRColoring: langMeta?.disableRColoring,
    entries: arpabetEntries,
    lang,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
}

describe('translateDict', () => {
  const dict = mkDict({
    hello: '/h\u025Blo\u028A/',
    '\u0645\u0631\u062D\u0628\u0627': '/marhaba/',
    '\u3053\u3093\u306B\u3061\u306F': '/konnit\u0255iwa/',
    '\u4F60\u597D': '/ni\u02E8\u02E9\u02E6xa\u028A\u02E8\u02E9\u02E6/',
  });

  it('translates a Latin-script word', () => {
    const result = translateDict('hello', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('translates Arabic words', () => {
    const result = translateDict('\u0645\u0631\u062D\u0628\u0627', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates Japanese words', () => {
    const result = translateDict('\u3053\u3093\u306B\u3061\u306F', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('translates Chinese words', () => {
    const result = translateDict('\u4F60\u597D', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('strips punctuation around non-Latin words', () => {
    const result = translateDict('(\u0645\u0631\u062D\u0628\u0627)', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result).toMatch(/^\(.+\)$/);
  });

  it('marks unknown words with NOT_FOUND_MARKER', () => {
    const result = translateDict('unknown', dict);
    expect(result).toContain(NOT_FOUND_MARKER);
  });

  it('preserves whitespace between words', () => {
    const result = translateDict('hello  \u0645\u0631\u062D\u0628\u0627', dict);
    expect(result).toContain('  ');
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('splits French contractions on apostrophes', () => {
    const frDict = mkDict(
      { avec: '/av\u025Bk/', essentiel: '/es\u0251\u0303sj\u025Bl/', l: '/\u025Bl/', qu: '/ky/' },
      'fr'
    );
    const result1 = translateDict("l'essentiel", frDict);
    expect(result1).not.toContain(NOT_FOUND_MARKER);

    const result2 = translateDict("qu'avec", frDict);
    expect(result2).not.toContain(NOT_FOUND_MARKER);
  });

  it('looks up clitic+apostrophe entries from real French dictionaries', () => {
    const frDict = mkDict({ homme: '/\u0254m/', il: '/il/', "l'": '/l/', "s'": '/s/' }, 'fr');
    const result1 = translateDict("s'il", frDict);
    expect(result1).not.toContain(NOT_FOUND_MARKER);

    const result2 = translateDict("l'homme", frDict);
    expect(result2).not.toContain(NOT_FOUND_MARKER);
  });

  it('merges clitic IPA across apostrophes instead of translating separately', () => {
    const frDict = mkDict({ "l'": '/l/', ordre: '/\u0254\u0281d\u0281/' }, 'fr');
    const result = translateDict("l'ordre", frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result.toLowerCase()).not.toMatch(/^el/);
    expect(result.toLowerCase()).toMatch(/^l/);
  });

  it('splits hyphenated words', () => {
    const frDict = mkDict({ allez: '/ale/', vous: '/vu/' }, 'fr');
    const result = translateDict('allez-vous', frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('preserves capitalization', () => {
    const deDict = mkDict({ guten: '/\u0261u\u02D0t\u0259n/', tag: '/ta\u02D0k/' }, 'de');
    const result = translateDict('Guten Tag', deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toUpperCase());
  });

  it('preserves all-caps', () => {
    const result = translateDict('HELLO', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result).toBe(result.toUpperCase());
  });

  it('capitalizes sentence-initial words from caseless scripts', () => {
    // Segmenter splits あった→あっ+た, いた→い+た
    const jaDict = mkDict(
      { '\u3042\u3063': '/at\u02D0/', '\u3044': '/i/', '\u305F': '/ta/' },
      'ja'
    );
    const result = translateDict('\u3042\u3063\u305F \u3044\u305F', jaDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toLowerCase());
  });

  it('capitalizes after sentence-ending punctuation in caseless scripts', () => {
    // Use single-character words that won't be split by the segmenter
    const jaDict = mkDict({ '\u3042': '/a/', '\u3044': '/i/' }, 'ja');
    const result = translateDict('\u3042\u3002 \u3044', jaDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(/\s+/);
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toUpperCase());
  });

  it('capitalizes Arabic sentence-initial words', () => {
    const result = translateDict('\u0645\u0631\u062D\u0628\u0627', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result[0]).toBe(result[0]!.toUpperCase());
  });

  it('does not capitalize mid-sentence caseless words', () => {
    // Segmenter splits あった→あっ+た, いた→い+た, その stays whole
    const jaDict = mkDict(
      {
        '\u3042\u3063': '/at\u02D0/',
        '\u3044': '/i/',
        '\u305D\u306E': '/sono/',
        '\u305F': '/ta/',
      },
      'ja'
    );
    const result = translateDict('\u3042\u3063\u305F \u3044\u305F \u305D\u306E', jaDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toLowerCase());
    expect(words[2]![0]).toBe(words[2]![0]!.toLowerCase());
  });

  it('capitalizes sentence-initial hyphenated caseless words', () => {
    const orDict = mkDict(
      {
        '\u0B09\u0B24\u0B4D\u0B15\u0B33': '/ut\u032Ak\u0254\u026D\u0254/',
        '\u0B15\u0B2E\u0B33\u0B3E': '/k\u0254m\u0254\u026Da\u02D0/',
      },
      'or'
    );
    const result = translateDict('\u0B09\u0B24\u0B4D\u0B15\u0B33-\u0B15\u0B2E\u0B33\u0B3E', orDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result[0]).toBe(result[0]!.toUpperCase());
  });

  it('does not double-capitalize Latin-script words (already cased)', () => {
    const deDict = mkDict(
      { guten: '/\u0261u\u02D0t\u0259n/', morgen: '/m\u0254\u0281\u0261\u0259n/' },
      'de'
    );
    const result = translateDict('guten morgen', deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toLowerCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toLowerCase());
  });

  it('applies default last-syllable stress when IPA has no stress markers', () => {
    const frDict = mkDict({ bonjour: '/b\u0254\u0303\u0292u\u0281/' }, 'fr');
    const guide = translateDict('bonjour', frDict, 'pronunciation');
    const parts = guide.split('-');
    const lastPart = parts.at(-1)!;
    expect(lastPart).toBe(lastPart.toUpperCase());
  });

  it('does not override existing IPA stress markers', () => {
    const deDict = mkDict({ hallo: '/ha\u02C8lo\u02D0/' }, 'de');
    const guide = translateDict('hallo', deDict, 'pronunciation');
    const parts = guide.split('-');
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe(parts[0]!.toLowerCase());
    expect(parts[1]).toBe(parts[1]!.toUpperCase());
  });

  it('normalizes curly apostrophes in input text', () => {
    const frDict = mkDict({ homme: '/\u0254m/', "l'": '/l/' }, 'fr');
    const result = translateDict('l\u2019homme', frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('matches straight apostrophes against curly-apostrophe dict keys', () => {
    const deDict = mkDict({ homme: '/\u0254m/', 'l\u2019': '/l/' }, 'de');
    const result = translateDict("l'homme", deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('finds words after stripping accents', () => {
    const esDict = mkDict({ barrabas: '/bara\u03B2as/' }, 'es');
    const result = translateDict('Barrab\u00E1s', esDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('finds words with \u00DF via ss normalization', () => {
    const deDict = mkDict(
      { Bewusstsein: '/b\u0259\u02C8v\u028Astza\u026An/', dass: '/das/' },
      'de'
    );
    expect(translateDict('da\u00DF', deDict)).not.toContain(NOT_FOUND_MARKER);
    expect(lookupDict(deDict, 'Bewu\u00DFtsein')).toBeDefined();
    // Word not in dict or overrides should still be undefined
    expect(lookupDict(deDict, 'xyz\u00DF')).toBeUndefined();
  });

  it('applies IPA override for French "est" (silent st)', () => {
    const noLangDict = mkDict({ est: '/\u025Bst/' });
    const withoutLang = translateDict('est', noLangDict, 'ingglish');
    expect(withoutLang).toContain('s');
    const frDict = mkDict({ est: '/\u025Bst/' }, 'fr');
    const withLang = translateDict('est', frDict, 'ingglish');
    expect(withLang).not.toContain('s');
    expect(withLang).not.toContain('t');
  });
});

describe('translateDictWithMapping', () => {
  it('returns matched token for known word', () => {
    const dict = mkDict({ bonjour: '/b\u0254\u0303\u0292u\u0281/' }, 'fr');
    const tokens = translateDictWithMapping('bonjour', dict);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].isWord).toBe(true);
    expect(tokens[0].matched).toBe(true);
    expect(tokens[0].original).toBe('bonjour');
    expect(tokens[0].translated).not.toBe('bonjour');
  });

  it('returns unmatched token for unknown word', () => {
    const dict: PhoneDict = { entries: {}, lang: 'fr' };
    const tokens = translateDictWithMapping('xyzzy', dict);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].isWord).toBe(true);
    expect(tokens[0].matched).toBe(false);
    expect(tokens[0].original).toBe('xyzzy');
    expect(tokens[0].translated).toBe('xyzzy');
  });

  it('returns whitespace token', () => {
    const dict = mkDict({ a: '/a/', b: '/b/' }, 'fr');
    const tokens = translateDictWithMapping('a  b', dict);
    expect(tokens).toHaveLength(3);
    expect(tokens[1]).toMatchObject({
      isWord: false,
      matched: true,
      original: '  ',
      translated: '  ',
    });
  });

  it('preserves punctuation in original and translated', () => {
    const dict = mkDict({ hello: '/h\u025Blo\u028A/' });
    const tokens = translateDictWithMapping('(hello!)', dict);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].isWord).toBe(true);
    expect(tokens[0].matched).toBe(true);
    expect(tokens[0].original).toBe('(hello!)');
    expect(tokens[0].translated).toMatch(/^\(.+!\)$/);
  });

  it('handles French contraction as single matched token', () => {
    const frDict = mkDict({ "l'": '/l/', ordre: '/\u0254\u0281d\u0281/' }, 'fr');
    const tokens = translateDictWithMapping("l'ordre", frDict);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].isWord).toBe(true);
    expect(tokens[0].matched).toBe(true);
    expect(tokens[0].original).toBe("l'ordre");
  });

  it('backward compat: translateDict output matches token join', () => {
    const dict = mkDict(
      { bonjour: '/b\u0254\u0303\u0292u\u0281/', monde: '/m\u0254\u0303d/' },
      'fr'
    );
    const text = 'bonjour monde unknown';
    const flat = translateDict(text, dict);
    const tokens = translateDictWithMapping(text, dict);
    // Reconstruct from tokens using the same logic as translateDict
    const reconstructed = tokens
      .map((t) => (!t.matched && t.isWord ? NOT_FOUND_MARKER + t.original : t.translated))
      .join('');
    expect(reconstructed).toBe(flat);
  });
});

// Khmer and sample coverage tests are in dict-coverage.test.ts (slow, reads website data files).
// Run separately via: npx vitest run src/dict-coverage.test.ts
