import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import { segmentChineseText, segmentJapaneseText, segmentKhmerText } from './dict';
import { type PhoneDict, lookupDict } from './index';

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
  it.each([
    ['daß', 'de', 'German ß normalization'],
    ['flickorna', 'sv', 'Swedish suffix stripping'],
    ['talossani', 'fi', 'Finnish morphology'],
    ['laboris', 'eo', 'Esperanto morphology'],
    ['băiatul', 'ro', 'Romanian suffix stripping'],
    ['af', 'nb', 'Norwegian old orthography'],
    ['memakan', 'ma', 'Malay prefix-suffix'],
    ['میکند', 'fa', 'Persian verb forms'],
    ['wanakula', 'sw', 'Swahili verb prefixes'],
  ])(
    '%s resolves via %s (%s)',
    async (word, lang) => {
      const result = await translate(word, { lang });
      expect(result).toBeTruthy();
    },
    30_000
  );
});

describe('French via translate', () => {
  it('French contraction splitting', async () => {
    const result = await translate("l'essentiel", { lang: 'fr' });
    expect(result).toBeTruthy();
  });

  it('French curly apostrophe same as straight', async () => {
    const curly = await translate('l\u2019homme', { lang: 'fr' });
    const straight = await translate("l'homme", { lang: 'fr' });
    expect(curly).toBe(straight);
  });
});

// Khmer and sample coverage tests are in dict-coverage.test.ts (slow, reads website data files).
// Run separately via: npx vitest run src/dict-coverage.test.ts
