import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { registerPronunciation } from '@ingglish/phonemes';
import type { IpaDict } from './foreign';
import { LANGUAGES, lookupIpa, translateForeign, NOT_FOUND_MARKER } from './foreign';

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

  it('finds words after stripping accents', () => {
    const esDict: IpaDict = { barrabas: '/baraβas/' };
    const result = translateForeign('Barrabás', esDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
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

describe('foreign sample coverage', () => {
  // Load samples dynamically (the file is TS but we can import it)
  const samplesPath = path.resolve(__dirname, '../../website/src/data/foreign-samples.ts');
  const dictsDir = path.resolve(__dirname, '../../website/public/ipa-dicts');

  // Skip if sample file or dicts don't exist (CI without website package)
  const hasSamples = fs.existsSync(samplesPath);
  const hasDicts = fs.existsSync(dictsDir);

  // Minimum per-language word coverage (found / total).
  // TODO: improve IPA dictionary coverage and raise these thresholds.
  const MIN_COVERAGE: Record<string, number> = {
    ar: 0.4,
    de: 0.85,
    es: 0.9,
    fi: 0.75,
    fr: 0.9,
    is: 0.95,
    ja: 0.3,
    ko: 0.6,
    nl: 0.6,
    pt: 0.5,
    ro: 0.9,
    sv: 0.95,
    sw: 0.95,
    vi: 0.95,
    yue: 0.8,
    zh: 0.8,
  };

  it.skipIf(!hasSamples || !hasDicts)(
    'sample words meet minimum dictionary coverage',
    { timeout: 30_000 },
    async () => {
      const { FOREIGN_SAMPLES } = await import('../../website/src/data/foreign-samples');

      const failures: string[] = [];

      for (const { code } of LANGUAGES) {
        const samples: undefined | { text: string }[] = FOREIGN_SAMPLES[code];
        if (!samples) {
          continue;
        }

        const dictPath = path.join(dictsDir, `${code}.json`);
        if (!fs.existsSync(dictPath)) {
          continue;
        }
        const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8')) as IpaDict;

        let total = 0;
        let found = 0;

        for (const sample of samples) {
          // Extract words: split on whitespace, strip punctuation
          const words = sample.text
            .split(/\s+/)
            .map((w) => w.replace(/^\P{L}+/u, '').replace(/\P{L}+$/u, ''))
            .filter(Boolean);

          for (const word of words) {
            total++;
            // Use lookupIpa which tries exact, lower, title, accent-stripped + overrides
            if (lookupIpa(dict, word, code)) {
              found++;
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
                found++;
              }
            }
          }
        }

        if (total === 0) {
          continue;
        }
        const coverage = found / total;
        const min = MIN_COVERAGE[code] ?? 0.8;
        if (coverage < min) {
          failures.push(
            `${code}: ${(coverage * 100).toFixed(1)}% coverage (${found}/${total}), minimum ${(min * 100).toFixed(0)}%`
          );
        }
      }

      expect(failures).toStrictEqual([]);
    }
  );
});
