import { describe, expect, it } from 'vitest';
import { createCustomConverter } from './index';

describe('createCustomConverter', () => {
  it.each([
    [
      'empty overrides → default output',
      { phonemeMap: {}, rColoredPrefixes: {} },
      [
        [['HH', 'AH0', 'L', 'OW1'], 'haloh'],
        [['K', 'AE1', 'T'], 'kat'],
      ],
    ],
    [
      'phonemeMap: AA→ah',
      { phonemeMap: { AA: 'ah' }, rColoredPrefixes: {} },
      [[['HH', 'AA1', 'T'], 'haht']],
    ],
    [
      'AH0 override',
      { phonemeMap: { AH0: 'uh' }, rColoredPrefixes: {} },
      [[['HH', 'AH0', 'L', 'OW1'], 'huhloh']],
    ],
    [
      'stress-specific: EY→ay, EY0→eh',
      { phonemeMap: { EY: 'ay', EY0: 'eh' }, rColoredPrefixes: {} },
      [
        [['EY1'], 'ay'],
        [['EY0'], 'eh'],
      ],
    ],
    [
      'rColoredPrefixes: AA→ah',
      { phonemeMap: {}, rColoredPrefixes: { AA: 'ah' } },
      [[['S', 'T', 'AA1', 'R'], 'stahr']],
    ],
    [
      'default r-colored vowels',
      { phonemeMap: {}, rColoredPrefixes: {} },
      [
        [['S', 'T', 'AA1', 'R'], 'star'],
        [['S', 'T', 'AO1', 'R'], 'stor'],
      ],
    ],
    [
      'auto-derive r-colored from phoneme map',
      { phonemeMap: { AH: 'a' }, rColoredPrefixes: {} },
      [[['AH1', 'R'], 'ar']],
    ],
    [
      'explicit rColoredPrefixes wins over auto-derived',
      { phonemeMap: { AA: 'ah' }, rColoredPrefixes: { AA: 'x' } },
      [[['S', 'T', 'AA1', 'R'], 'stxr']],
    ],
    [
      'consonants unchanged',
      { phonemeMap: {}, rColoredPrefixes: {} },
      [[['B', 'EH1', 'D'], 'bed']],
    ],
    ['unknown phonemes → lowercase', { phonemeMap: {}, rColoredPrefixes: {} }, [[['XX'], 'xx']]],
    [
      'multiple overrides together',
      { phonemeMap: { AH0: 'uh', IY: 'i' }, rColoredPrefixes: { AA: 'ah' } },
      [
        [['AH0', 'B', 'AW1', 'T'], 'uhbout'],
        [['S', 'IY1'], 'si'],
      ],
    ],
  ] as const)('%s', (_desc, config, cases) => {
    const convert = createCustomConverter({
      phonemeMap: config.phonemeMap as Record<string, string>,
      rColoredPrefixes: config.rColoredPrefixes as Record<string, string>,
    });
    for (const [phonemes, expected] of cases) {
      expect(convert([...phonemes])).toBe(expected);
    }
  });
});
