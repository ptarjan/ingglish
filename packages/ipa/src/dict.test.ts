import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import { segmentChineseText, segmentJapaneseText, segmentKhmerText } from './dict';
import { buildReverseMap, convertIpaEntries, type PhoneDict, lookupDict } from './index';

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

describe('lookupDict edge cases', () => {
  it('matches curly apostrophe entries when word has straight apostrophe', () => {
    const dict: PhoneDict = {
      entries: {
        'l\u2019homme': ['L', 'AO1', 'M'],
      },
      lang: 'test-no-overrides',
    };
    // lookupDict normalizes curly→straight, but also tries straight→curly for dict matching
    expect(lookupDict(dict, "l'homme")).toEqual(['L', 'AO1', 'M']);
  });

  it('returns undefined when apostrophe-split part is not found', () => {
    const dict: PhoneDict = {
      entries: {
        l: ['L'],
        // 'xyz' deliberately missing
      },
      lang: 'test-no-overrides',
    };
    expect(lookupDict(dict, "l'xyz")).toBeUndefined();
  });
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

describe('buildReverseMap', () => {
  it('builds reverse map from dict entries', () => {
    const dict: PhoneDict = {
      entries: {
        hello: ['HH', 'AH0', 'L', 'OW1'],
        world: ['W', 'ER1', 'L', 'D'],
      },
      lang: 'test-no-overrides',
    };
    const map = buildReverseMap(dict);
    expect(map.get('HH AH L OW')).toEqual(['hello']);
    expect(map.get('W ER L D')).toEqual(['world']);
  });

  it('groups words with same pronunciation', () => {
    const dict: PhoneDict = {
      entries: {
        their: ['DH', 'EH1', 'R'],
        there: ['DH', 'EH1', 'R'],
      },
      lang: 'test-no-overrides',
    };
    const map = buildReverseMap(dict);
    expect(map.get('DH EH R')).toEqual(['their', 'there']);
  });

  it('includes language overrides', () => {
    // Use a language that has overrides (e.g. 'fr' has word overrides)
    const dict: PhoneDict = {
      entries: { bonjour: ['B', 'AO1', 'N', 'ZH', 'UH1', 'R'] },
      lang: 'fr',
    };
    const map = buildReverseMap(dict);
    // Should include both dict entry and any French overrides
    expect(map.size).toBeGreaterThan(0);
    expect(map.get('B AO N ZH UH R')).toContain('bonjour');
  });
});

describe('convertIpaEntries', () => {
  it('converts IPA string entries to ARPAbet arrays', () => {
    const raw = {
      bonjour: '/bɔ̃.ʒuʁ/',
      merci: '/mɛʁ.si/',
    };
    const result = convertIpaEntries(raw, 'fr');
    expect(result.bonjour).toBeDefined();
    expect(Array.isArray(result.bonjour)).toBe(true);
    expect(result.merci).toBeDefined();
  });

  it('passes through already-converted ARPAbet arrays', () => {
    const raw = {
      hello: ['HH', 'AH0', 'L', 'OW1'],
    };
    const result = convertIpaEntries(raw, 'en');
    expect(result.hello).toEqual(['HH', 'AH0', 'L', 'OW1']);
  });
});

// Khmer and sample coverage tests are in dict-coverage.test.ts (slow, reads website data files).
// Run separately via: npx vitest run src/dict-coverage.test.ts
