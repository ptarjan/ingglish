import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import { segmentChineseText, segmentJapaneseText, segmentKhmerText } from './dict';
import { buildReverseMap, convertIpaEntries, type PhoneDict, lookupDict } from './index';

describe('segmenters', () => {
  it.each([
    ['segmentKhmerText', segmentKhmerText, 'សួស្តី'],
    ['segmentJapaneseText', segmentJapaneseText, '東京タワー'],
    ['segmentChineseText', segmentChineseText, '你好世界'],
  ] as const)('%s produces non-empty output', (_name, fn, input) => {
    const result = fn(input);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('segmentKhmerText normalizes zero-width spaces', () => {
    const result = segmentKhmerText('ខ្ញុំ\u200Bស្រលាញ់');
    expect(result).not.toContain('\u200B');
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

// Language resolvers are covered by packages/ipa/src/resolvers.test.ts

describe('lookupDict edge cases', () => {
  it('matches curly apostrophe entries when word has straight apostrophe', () => {
    const dict: PhoneDict = {
      entries: {
        'l\u2019homme': ['L', 'AO1', 'M'],
      },
      lang: 'test-no-overrides',
    };
    expect(lookupDict(dict, "l'homme")).toEqual(['L', 'AO1', 'M']);
  });

  it('returns undefined when apostrophe-split part is not found', () => {
    const dict: PhoneDict = {
      entries: {
        l: ['L'],
      },
      lang: 'test-no-overrides',
    };
    expect(lookupDict(dict, "l'xyz")).toBeUndefined();
  });

  it('splits apostrophe and looks up each part directly', () => {
    const dict: PhoneDict = {
      entries: { homme: ['AO1', 'M'], l: ['L'] },
      lang: 'test-no-overrides',
    };
    expect(lookupDict(dict, "l'homme")).toEqual(['L', 'AO1', 'M']);
  });

  it('apostrophe split uses curly apostrophe fallback per part', () => {
    const dict: PhoneDict = {
      entries: { homme: ['AO1', 'M'], 'l\u2019': ['L'] },
      lang: 'test-no-overrides',
    };
    expect(lookupDict(dict, "l'homme")).toEqual(['L', 'AO1', 'M']);
  });

  it('apostrophe split uses G2P fallback per part', () => {
    const dict: PhoneDict = {
      entries: { on: ['AO1', 'N'] },
      lang: 'fi',
    };
    expect(lookupDict(dict, "talo'on")).toBeDefined();
  });

  it('apostrophe split resolves part via language override', () => {
    // 'est' is in French overrides (IPA /ɛ/), so lookupDictNoSplit finds it there
    const dict: PhoneDict = {
      entries: { x: ['K', 'S'] },
      lang: 'fr',
    };
    const result = lookupDict(dict, "est'x");
    expect(result).toBeDefined();
  });

  it('apostrophe split resolves part via word resolver', () => {
    // German resolver normalizes ß→ss: 'straße' → 'strasse' (found in entries)
    // 'straße' is NOT in German overrides, so lookupDictNoSplit hits the resolver path
    const dict: PhoneDict = {
      entries: { strasse: ['SH', 'T', 'R', 'AH1', 'S', 'AH0'], x: ['K', 'S'] },
      lang: 'de',
    };
    const result = lookupDict(dict, "straße'x");
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
  });
});

describe('French via translate', () => {
  it('French contraction splitting', async () => {
    const result = await translate("l'essentiel", { lang: 'fr' });
    expect(result).toBeTruthy();
  }, 15_000);

  it('French curly apostrophe same as straight', async () => {
    const curly = await translate('l\u2019homme', { lang: 'fr' });
    const straight = await translate("l'homme", { lang: 'fr' });
    expect(curly).toBe(straight);
  }, 15_000);
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

  it('skips entries with empty phoneme arrays', () => {
    const dict: PhoneDict = {
      entries: {
        empty: [],
        hello: ['HH', 'AH0', 'L', 'OW1'],
      },
      lang: 'test-no-overrides',
    };
    const map = buildReverseMap(dict);
    expect(map.get('HH AH L OW')).toEqual(['hello']);
    // 'empty' should be skipped (no key to map to)
    expect(map.size).toBe(1);
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
