import { describe, it, expect } from 'vitest';
import { wordToArpabet, translateWithRules } from './g2p-rules';

describe('wordToArpabet', () => {
  it('converts simple words to ARPAbet', () => {
    const phonemes = wordToArpabet('cat');
    expect(phonemes).toContain('K');
    expect(phonemes).toContain('T');
    // Should have a vowel with stress marker
    expect(phonemes.some((p) => p.startsWith('AE'))).toBe(true);
  });

  it('handles silent letters (knight)', () => {
    const phonemes = wordToArpabet('knight');
    // K should be silent before N
    expect(phonemes[0]).toBe('N');
    expect(phonemes.some((p) => p.startsWith('AY'))).toBe(true);
    expect(phonemes).toContain('T');
  });

  it('handles digraphs (sh, ch, th)', () => {
    const sh = wordToArpabet('ship');
    expect(sh).toContain('SH');

    const ch = wordToArpabet('chip');
    expect(ch).toContain('CH');

    const th = wordToArpabet('thin');
    expect(th).toContain('TH');
  });

  it('handles word-initial silent letters (gnat, psalm, knife)', () => {
    const gnat = wordToArpabet('gnat');
    expect(gnat[0]).toBe('N');

    const psalm = wordToArpabet('psalm');
    expect(psalm[0]).toBe('S');

    const knife = wordToArpabet('knife');
    expect(knife[0]).toBe('N');
  });

  it('handles doubled consonants (bb, dd, tt)', () => {
    const rabbit = wordToArpabet('rabbit');
    // BB should collapse to single B
    const bCount = rabbit.filter((p) => p === 'B').length;
    expect(bCount).toBe(1);
  });

  it('returns empty array for empty string', () => {
    expect(wordToArpabet('')).toEqual([]);
  });

  it('applies stress prediction for multi-syllable words', () => {
    const phonemes = wordToArpabet('computer');
    // Should have at least one stressed vowel (stress-1)
    expect(phonemes.some((p) => p.endsWith('1'))).toBe(true);
    // Should have at least one unstressed vowel (stress-0 or AH0)
    expect(phonemes.some((p) => p.endsWith('0'))).toBe(true);
  });
});

describe('translateWithRules', () => {
  it('returns an Ingglish spelling by default', () => {
    const result = translateWithRules('cat');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('respects the format parameter', () => {
    const ingglish = translateWithRules('hello', 'ingglish');
    const ipa = translateWithRules('hello', 'ipa');
    // IPA uses different characters (slashes, diacritics)
    expect(ingglish).not.toBe(ipa);
  });

  it('produces stable output for the same word', () => {
    const first = translateWithRules('example');
    const second = translateWithRules('example');
    expect(first).toBe(second);
  });
});
