import { describe, expect, it } from 'vitest';
import { wordToArpabet, wordToPhonetic } from './index';

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

  it('handles word-initial silent letters (gn, kn, pn, ps, pt, pf, mn, dj)', () => {
    expect(wordToArpabet('gnat')[0]).toBe('N');
    expect(wordToArpabet('knife')[0]).toBe('N');
    expect(wordToArpabet('pneumonia')[0]).toBe('N');
    expect(wordToArpabet('psalm')[0]).toBe('S');
    expect(wordToArpabet('pterodactyl')[0]).toBe('T');
    expect(wordToArpabet('pfennig')[0]).toBe('F');
    expect(wordToArpabet('mnemonic')[0]).toBe('N');
    expect(wordToArpabet('djinn')[0]).toBe('JH');
  });

  it('handles silent T in -ften words (often, soften)', () => {
    const often = wordToArpabet('often');
    // T should be silent: often = AO F AH N (no T)
    expect(often).not.toContain('T');
    expect(often.some((p) => p.startsWith('F'))).toBe(true);

    const soften = wordToArpabet('soften');
    expect(soften).not.toContain('T');
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

describe('wordToPhonetic', () => {
  it('returns an Ingglish spelling by default', () => {
    const result = wordToPhonetic('cat');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('respects the format parameter', () => {
    const ingglish = wordToPhonetic('hello', 'ingglish');
    const ipa = wordToPhonetic('hello', 'ipa');
    // IPA uses different characters (slashes, diacritics)
    expect(ingglish).not.toBe(ipa);
  });

  it('produces stable output for the same word', () => {
    const first = wordToPhonetic('example');
    const second = wordToPhonetic('example');
    expect(first).toBe(second);
  });
});
