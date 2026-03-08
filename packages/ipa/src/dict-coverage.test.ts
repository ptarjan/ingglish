/**
 * Slow integration tests that read IPA dictionary files from packages/website.
 * Excluded from the default test run (see vitest.config.ts).
 * Run separately via: npx vitest run src/dict-coverage.test.ts
 * Also run in CI via: npx turbo test:dict-coverage
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isVowel } from '@ingglish/phonemes';
import type { PhoneDict } from './dict';
import { getLanguage, LANGUAGES, lookupDict, NOT_FOUND_MARKER, translateDict } from './dict';
import { ipaToArpabet } from './from-ipa';
import { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';

/** Convert dict entries from IPA strings to ARPAbet arrays if needed. */
function convertIpaEntriesToArpabet(
  raw: Record<string, string | string[]>,
  lang: string
): Record<string, string[]> {
  const firstValue = Object.values(raw)[0];
  if (firstValue === undefined || Array.isArray(firstValue)) {
    return raw as Record<string, string[]>;
  }
  const result: Record<string, string[]> = {};
  for (const [word, val] of Object.entries(raw)) {
    const arpabet = ipa(val as string, lang);
    if (arpabet.length > 0) {
      result[word] = arpabet;
    }
  }
  return result;
}

/** Convert IPA string → ARPAbet with default stress applied. */
function ipa(ipaStr: string, lang?: string): string[] {
  const clean = ipaStr.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
  const overrides = lang ? IPA_LANGUAGE_OVERRIDES[lang] : undefined;
  const arpabet = ipaToArpabet(clean, overrides);
  const hasStress = arpabet.some((p) => isVowel(p));
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

function mkKhmerDict(raw: Record<string, string | string[]>): PhoneDict {
  const langMeta = getLanguage('km')!;
  const entries = convertIpaEntriesToArpabet(raw, 'km');
  return {
    disableRColoring: langMeta.disableRColoring,
    entries,
    lang: 'km',
    nonLatinScript: langMeta.nonLatinScript,
    preprocess: langMeta.preprocess,
  };
}

describe('Khmer compound decomposition', () => {
  const dictsDir = path.resolve(__dirname, '../../website/public/ipa-dicts');
  const kmDictPath = path.join(dictsDir, 'km.json');
  const hasDicts = fs.existsSync(kmDictPath);

  it.skipIf(!hasDicts)('strips slashes from compound IPA parts', () => {
    const raw = JSON.parse(fs.readFileSync(kmDictPath, 'utf8')) as Record<string, string[]>;
    const dict = mkKhmerDict(raw);
    const arpabet = lookupDict(dict, 'លើក្បាលទា');
    expect(arpabet).toBeDefined();
    if (arpabet) {
      expect(arpabet.join(' ')).not.toContain('/');
    }
  });

  it.skipIf(!hasDicts)('translates Khmer phrases that browsers may segment differently', () => {
    const raw = JSON.parse(fs.readFileSync(kmDictPath, 'utf8')) as Record<string, string[]>;
    const dict = mkKhmerDict(raw);
    const browserSegments = [
      'ញាក់',
      'ណាយ',
      'លើក្បាលទា',
      'ធ្វើរបង',
      'សេចក្ដី',
      'ថ្នែក',
      'ថ្នូរ',
      'សតិ',
      'សម្បជញ្ញៈ',
      'ភាតរ',
      'មហេសី',
      'រាជ',
      'បុត្រ',
      'រាជា',
      'រាជបុត្រ',
      'មហា',
      'រុង',
      'ជ័យ',
      'មង្គល',
      'ថ្កើង',
      'ថ្កាន',
      'សួ',
      'ស្តី',
      'វេទនា',
      'ហើយឬក្សត្រ',
      'ក្នុងថ្នែក',
      'និងសតិ',
    ];
    const failures: string[] = [];
    for (const word of browserSegments) {
      const result = translateDict(word, dict);
      if (result.includes(NOT_FOUND_MARKER)) {
        failures.push(word);
      }
    }
    expect(failures).toStrictEqual([]);
  });
});

describe('foreign sample coverage', () => {
  const samplesPath = path.resolve(__dirname, '../../website/src/data/language-samples.ts');
  const dictsDir = path.resolve(__dirname, '../../website/public/ipa-dicts');

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
        if (code === 'en') {
          continue;
        }
        const samples: undefined | { text: string }[] = ALL_SAMPLES[code];
        if (!samples) {
          continue;
        }

        const dictPath = path.join(dictsDir, `${code}.json`);
        if (!fs.existsSync(dictPath)) {
          continue;
        }
        const raw = JSON.parse(fs.readFileSync(dictPath, 'utf8')) as Record<string, string[]>;
        const langMeta = getLanguage(code);
        const dict: PhoneDict = {
          disableRColoring: langMeta?.disableRColoring,
          entries: raw,
          lang: code,
          nonLatinScript: langMeta?.nonLatinScript,
          preprocess: langMeta?.preprocess,
        };

        for (const sample of samples) {
          const text = dict.preprocess ? dict.preprocess(sample.text) : sample.text;
          const words = text
            .split(/\s+/)
            .map((w) => w.replace(/^[^\p{L}\p{M}]+/u, '').replace(/[^\p{L}\p{M}]+$/u, ''))
            .filter(Boolean);

          const missing: string[] = [];
          for (const word of words) {
            if (lookupDict(dict, word)) {
              continue;
            }
            const parts = word.split(/(?<=['-])|(?=['-])/);
            if (parts.length > 1) {
              const allFound = parts.every(
                (p) =>
                  p === "'" ||
                  p === '-' ||
                  lookupDict(dict, p) !== undefined ||
                  lookupDict(dict, `${p}'`) !== undefined
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
