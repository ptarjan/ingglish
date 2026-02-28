import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { registerPronunciation } from '@ingglish/phonemes';
import type { IpaDict } from './foreign';
import {
  LANGUAGES,
  lookupIpa,
  segmentKhmerText,
  translateForeign,
  NOT_FOUND_MARKER,
} from './foreign';

registerPronunciation();

describe('translateForeign', () => {
  const dict: IpaDict = {
    hello: '/hɛloʊ/',
    مرحبا: '/marhaba/',
    こんにちは: '/konnitɕiwa/',
    你好: '/ni˨˩˦xaʊ˨˩˦/',
  };

  it('translates a Latin-script word', () => {
    const result = translateForeign('hello', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('translates Arabic words', () => {
    const result = translateForeign('مرحبا', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates Japanese words', () => {
    const result = translateForeign('こんにちは', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('translates Chinese words', () => {
    const result = translateForeign('你好', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('strips punctuation around non-Latin words', () => {
    const result = translateForeign('(مرحبا)', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result).toMatch(/^\(.+\)$/);
  });

  it('marks unknown words with NOT_FOUND_MARKER', () => {
    const result = translateForeign('unknown', dict);
    expect(result).toContain(NOT_FOUND_MARKER);
  });

  it('preserves whitespace between words', () => {
    const result = translateForeign('hello  مرحبا', dict);
    expect(result).toContain('  ');
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('splits French contractions on apostrophes', () => {
    const frDict: IpaDict = { avec: '/avɛk/', essentiel: '/esɑ̃sjɛl/', l: '/ɛl/', qu: '/ky/' };
    const result1 = translateForeign("l'essentiel", frDict);
    expect(result1).not.toContain(NOT_FOUND_MARKER);

    const result2 = translateForeign("qu'avec", frDict);
    expect(result2).not.toContain(NOT_FOUND_MARKER);
  });

  it('looks up clitic+apostrophe entries from real French dictionaries', () => {
    // Real French ipa-dict has "s'" -> /s/, "l'" -> /l/, not bare "s" or "l"
    const frDict: IpaDict = { homme: '/ɔm/', il: '/il/', "l'": '/l/', "s'": '/s/' };
    const result1 = translateForeign("s'il", frDict);
    expect(result1).not.toContain(NOT_FOUND_MARKER);

    const result2 = translateForeign("l'homme", frDict);
    expect(result2).not.toContain(NOT_FOUND_MARKER);
  });

  it('splits hyphenated words', () => {
    const frDict: IpaDict = { allez: '/ale/', vous: '/vu/' };
    const result = translateForeign('allez-vous', frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('preserves capitalization', () => {
    const deDict: IpaDict = { guten: '/ɡuːtən/', tag: '/taːk/' };
    const result = translateForeign('Guten Tag', deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    // Both words should start with uppercase
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toUpperCase());
  });

  it('preserves all-caps', () => {
    const result = translateForeign('HELLO', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result).toBe(result.toUpperCase());
  });

  it('capitalizes sentence-initial words from caseless scripts', () => {
    // Japanese: first word should be capitalized even though source has no case
    const jaDict: IpaDict = { あった: '/atːa/', いた: '/ita/' };
    const result = translateForeign('あった いた', jaDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    // First word capitalized
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    // Second word lowercase
    expect(words[1]![0]).toBe(words[1]![0]!.toLowerCase());
  });

  it('capitalizes after sentence-ending punctuation in caseless scripts', () => {
    const jaDict: IpaDict = { あった: '/atːa/', いた: '/ita/' };
    const result = translateForeign('あった。 いた', jaDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    // Both words should be capitalized (second is after 。)
    const words = result.split(/\s+/);
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase()); // "Atta。" -> first char 'A'
    expect(words[1]![0]).toBe(words[1]![0]!.toUpperCase());
  });

  it('capitalizes Arabic sentence-initial words', () => {
    const result = translateForeign('مرحبا', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    // Should start with uppercase
    expect(result[0]).toBe(result[0]!.toUpperCase());
  });

  it('does not capitalize mid-sentence caseless words', () => {
    const jaDict: IpaDict = { あった: '/atːa/', いた: '/ita/', その: '/sono/' };
    const result = translateForeign('あった いた その', jaDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    // First capitalized, rest lowercase
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toLowerCase());
    expect(words[2]![0]).toBe(words[2]![0]!.toLowerCase());
  });

  it('capitalizes sentence-initial hyphenated caseless words', () => {
    // Odia-like: first word is a hyphenated compound from a caseless script
    const orDict: IpaDict = { ଉତ୍କଳ: '/ut̪kɔɭɔ/', କମଳା: '/kɔmɔɭaː/' };
    const result = translateForeign('ଉତ୍କଳ-କମଳା', orDict, 'ingglish', 'or');
    expect(result).not.toContain(NOT_FOUND_MARKER);
    // First character should be capitalized
    expect(result[0]).toBe(result[0]!.toUpperCase());
  });

  it('does not double-capitalize Latin-script words (already cased)', () => {
    const deDict: IpaDict = { guten: '/ɡuːtən/', morgen: '/mɔʁɡən/' };
    // lowercase German — should stay lowercase (source has case info)
    const result = translateForeign('guten morgen', deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toLowerCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toLowerCase());
  });

  it('applies default last-syllable stress when IPA has no stress markers', () => {
    // French "bonjour" /bɔ̃ʒuʁ/ — no stress markers in IPA
    // Guide should capitalize the last syllable (French stress rule)
    const frDict: IpaDict = { bonjour: '/bɔ̃ʒuʁ/' };
    const guide = translateForeign('bonjour', frDict, 'pronunciation');
    // Last syllable should be uppercase (stressed)
    const parts = guide.split('-');
    const lastPart = parts.at(-1)!;
    expect(lastPart).toBe(lastPart.toUpperCase());
  });

  it('does not override existing IPA stress markers', () => {
    // German "hallo" with explicit stress — should keep original stress
    const deDict: IpaDict = { hallo: '/haˈloː/' };
    const guide = translateForeign('hallo', deDict, 'pronunciation');
    // Second syllable stressed, first is not
    const parts = guide.split('-');
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe(parts[0]!.toLowerCase());
    expect(parts[1]).toBe(parts[1]!.toUpperCase());
  });

  it('normalizes curly apostrophes in input text', () => {
    const frDict: IpaDict = { homme: '/ɔm/', "l'": '/l/' };
    // U+2019 right single quotation mark in input
    const result = translateForeign('l\u2019homme', frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('matches straight apostrophes against curly-apostrophe dict keys', () => {
    // German dict has curly apostrophe keys (U+2019)
    const deDict: IpaDict = { homme: '/ɔm/', 'l\u2019': '/l/' };
    const result = translateForeign("l'homme", deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('finds words after stripping accents', () => {
    const esDict: IpaDict = { barrabas: '/baraβas/' };
    const result = translateForeign('Barrabás', esDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('finds words with ß via ss normalization', () => {
    const deDict: IpaDict = { Bewusstsein: '/bəˈvʊstzaɪn/', dass: '/das/' };
    // ß→ss: "daß" → "dass" (lowercase)
    expect(translateForeign('daß', deDict)).not.toContain(NOT_FOUND_MARKER);
    // ß→ss with title case: "Bewußtsein" → "Bewusstsein"
    expect(lookupIpa(deDict, 'Bewußtsein')).toBe('/bəˈvʊstzaɪn/');
    // Unrelated conjugation doesn't magically match
    expect(lookupIpa(deDict, 'mußte')).toBeUndefined();
  });

  it('applies IPA override for French "est" (silent st)', () => {
    const frDict: IpaDict = { est: '/ɛst/' };
    // Without lang, uses dict's /ɛst/ which includes S and T sounds
    const withoutLang = translateForeign('est', frDict, 'ingglish');
    expect(withoutLang).toContain('s');
    // With lang='fr', override provides /ɛ/ — no consonants
    const withLang = translateForeign('est', frDict, 'ingglish', 'fr');
    expect(withLang).not.toContain('s');
    expect(withLang).not.toContain('t');
  });
});

describe('Khmer compound decomposition', () => {
  const dictsDir = path.resolve(__dirname, '../../website/public/ipa-dicts');
  const kmDictPath = path.join(dictsDir, 'km.json');
  const hasDicts = fs.existsSync(kmDictPath);

  it.skipIf(!hasDicts)('strips slashes from compound IPA parts', () => {
    const dict = JSON.parse(fs.readFileSync(kmDictPath, 'utf8')) as IpaDict;
    // "លើក្បាលទា" decomposes to លើ + ក្បាល + ទា (all in dict with /.../ values)
    const ipa = lookupIpa(dict, 'លើក្បាលទា', 'km');
    expect(ipa).toBeDefined();
    // Should not contain any slashes — they should be stripped before joining
    expect(ipa).not.toContain('/');
  });

  it.skipIf(!hasDicts)('translates Khmer phrases that browsers may segment differently', () => {
    const dict = JSON.parse(fs.readFileSync(kmDictPath, 'utf8')) as IpaDict;
    // These words may appear as standalone segments in some browsers' Intl.Segmenter
    // even though Node keeps them joined with neighbors. Each component of a
    // compound override must be individually resolvable.
    const browserSegments = [
      // Proverbs — browser splits compounds
      'ញាក់', // part of ញាក់ចិញ្ចើម
      'ណាយ', // part of ណាយចិត្ត
      'លើក្បាលទា', // compound-decomposable
      'ធ្វើរបង', // compound-decomposable
      // UDHR — browser splits compound overrides
      'សេចក្ដី', // part of សេចក្ដីថ្លៃថ្នូរ
      'ថ្នែក', // aspect, class
      'ថ្នូរ', // part of សេចក្ដីថ្លៃថ្នូរ
      'សតិ', // part of សតិសម្បជញ្ញៈ
      'សម្បជញ្ញៈ', // part of សតិសម្បជញ្ញៈ
      'ភាតរ', // part of ភាតរភាព
      // Preah Chinawong — browser splits ព្រះ-prefixed compounds
      'មហេសី', // part of ព្រះមហេសី
      'រាជ', // part of ព្រះរាជបុត្រ
      'បុត្រ', // part of ព្រះរាជបុត្រ
      'រាជា', // part of ព្រះរាជា
      'រាជបុត្រ', // part of ព្រះរាជបុត្រ
      // Nokor Reach / Constitution — browser splits មហា compounds
      'មហា', // part of មហាក្សត្រ, មហាជាតិ
      'រុង', // part of រុងរឿង
      'ជ័យ', // part of ជ័យមង្គល
      'មង្គល', // part of ជ័យមង្គល
      'ថ្កើង', // part of ថ្កើងថ្កាន
      'ថ្កាន', // part of ថ្កើងថ្កាន
      'សួ', // browser splits សួស្តី
      'ស្តី', // browser splits សួស្តី
      'វេទនា', // part of ទុក្ខវេទនា
      // Compound decomposition — these should decompose via merged dict
      'ហើយឬក្សត្រ', // ហើយ(dict) + ឬ(dict) + ក្សត្រ(override)
      'ក្នុងថ្នែក', // ក្នុង(dict) + ថ្នែក(override)
      'និងសតិ', // និង(dict) + សតិ(override)
    ];
    const failures: string[] = [];
    for (const word of browserSegments) {
      const result = translateForeign(word, dict, 'ingglish', 'km');
      if (result.includes(NOT_FOUND_MARKER)) {
        failures.push(word);
      }
    }
    expect(failures).toStrictEqual([]);
  });
});

describe('foreign sample coverage', () => {
  // Load samples dynamically (the file is TS but we can import it)
  const samplesPath = path.resolve(__dirname, '../../website/src/data/language-samples.ts');
  const dictsDir = path.resolve(__dirname, '../../website/public/ipa-dicts');

  // Skip if sample file or dicts don't exist (CI without website package)
  const hasSamples = fs.existsSync(samplesPath);
  const hasDicts = fs.existsSync(dictsDir);
  const kaikkiDir = path.resolve(__dirname, '../../website/data/kaikki');
  const hasKaikki = fs.existsSync(kaikkiDir);

  it.skipIf(!hasSamples || !hasDicts)(
    'all sample words have dictionary coverage',
    { timeout: 30_000 },
    async () => {
      const { ALL_SAMPLES } = await import('../../website/src/data/language-samples');

      const failures: string[] = [];

      for (const { code } of LANGUAGES) {
        const samples: undefined | { text: string }[] = ALL_SAMPLES[code];
        if (!samples) {
          continue;
        }

        const dictPath = path.join(dictsDir, `${code}.json`);
        if (!fs.existsSync(dictPath)) {
          continue;
        }
        const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8')) as IpaDict;

        for (const sample of samples) {
          // Khmer has no inherent word boundaries — segment before splitting
          const text = code === 'km' ? segmentKhmerText(sample.text) : sample.text;
          // Extract words: split on whitespace, strip punctuation
          const words = text
            .split(/\s+/)
            // Preserve combining marks (\p{M}) for scripts like Odia, Khmer
            .map((w) => w.replace(/^[^\p{L}\p{M}]+/u, '').replace(/[^\p{L}\p{M}]+$/u, ''))
            .filter(Boolean);

          const missing: string[] = [];
          for (const word of words) {
            // Use lookupIpa which tries exact, lower, title, accent-stripped + overrides
            if (lookupIpa(dict, word, code)) {
              continue;
            }
            // Also try splitting on apostrophe/hyphen (French contractions)
            const parts = word.split(/(?<=['-])|(?=['-])/);
            if (parts.length > 1) {
              const allFound = parts.every(
                (p) =>
                  p === "'" ||
                  p === '-' ||
                  lookupIpa(dict, p, code) !== undefined ||
                  lookupIpa(dict, `${p}'`, code) !== undefined
              );
              if (allFound) {
                continue;
              }
            }
            missing.push(word);
          }

          if (missing.length > 0) {
            failures.push(
              `${code} [${sample.label}]: ${missing.length} missing — ${missing.join(', ')}`
            );
          }
        }
      }

      if (failures.length > 0 && !hasKaikki) {
        failures.push(
          'HINT: Kaikki (Wiktionary) IPA data not found. Download it and rebuild dicts (in this order):',
          '  1. npx tsx packages/website/scripts/extract-kaikki-ipa.ts',
          '  2. npx tsx packages/website/scripts/build-ipa-dicts.ts'
        );
      }
      expect(failures).toStrictEqual([]);
    }
  );
});
