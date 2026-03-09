import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

// All words below are NOT in the CMU dictionary, so translateSync
// exercises the G2P pipeline. Strip the not-found marker to get just
// the phonetic output.
const g2p = (word: string) => translateSync(word).replace(/^\uFFFD/, '');

describe('G2P basic rules', () => {
  it('converts simple non-dict words to phonetic output', () => {
    const result = g2p('gub');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe('guhb');
  });

  it('handles silent letters (KN)', () => {
    // K should be silent before N
    expect(g2p('knib')).toBe('nib');
  });

  it('handles digraphs (SH, CH, TH)', () => {
    expect(g2p('shug')).toMatch(/^sh/);
    expect(g2p('chub')).toMatch(/^ch/);
    expect(g2p('thub')).toMatch(/^th/);
  });

  it('handles word-initial silent letters (GN, KN, PN, PS)', () => {
    expect(g2p('gnab')).toBe('nab');
    expect(g2p('knib')).toBe('nib');
    expect(g2p('pnib')).toBe('nib');
    expect(g2p('psar')).toBe('sar');
  });

  it('handles doubled consonants (ZZ, TT)', () => {
    expect(g2p('bluzz')).toBe('bluhz');
    expect(g2p('smutt')).toBe('smuht');
  });

  it('returns empty string for empty input', () => {
    expect(translateSync('')).toBe('');
  });

  it('applies stress prediction for multi-syllable words', () => {
    // Multi-syllable non-dict word should have varied stress in output
    const result = g2p('blicture');
    expect(result).toBe('blikcher');
  });
});

describe('G2P format output', () => {
  it('produces different output for ingglish vs ipa format', () => {
    const ingglish = g2p('gub');
    const ipa = translateSync('gub', { format: 'ipa' }).replace(/^\uFFFD/, '');
    expect(ingglish).not.toBe(ipa);
  });

  it('produces stable output for the same word', () => {
    expect(g2p('blonk')).toBe(g2p('blonk'));
  });
});
