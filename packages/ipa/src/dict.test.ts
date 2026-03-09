import { describe, expect, it } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import { type PhoneDict, convertIpaEntries, getLanguage, lookupDict } from './index';

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

// Khmer and sample coverage tests are in dict-coverage.test.ts (slow, reads website data files).
// Run separately via: npx vitest run src/dict-coverage.test.ts
