import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

// All words below are NOT in the CMU dictionary, so translateSync
// exercises the G2P pipeline. Strip the not-found marker to get just
// the phonetic output.
const g2p = (word: string) => translateSync(word).replace(/^\uFFFD/, '');

describe('G2P basic rules', () => {
  it.each([
    ['gub', 'guhb', 'simple CVC'],
    ['shug', 'shuhg', 'SH digraph'],
    ['chub', 'chuhb', 'CH digraph'],
    ['thub', 'thuhb', 'TH digraph'],
    ['bluzz', 'bluhz', 'doubled ZZ'],
    ['smutt', 'smuht', 'doubled TT'],
  ])('converts %s → %s (%s)', (word, expected) => {
    expect(g2p(word)).toBe(expected);
  });

  it.each([
    ['knib', 'nib'],
    ['gnab', 'nab'],
    ['pnib', 'nib'],
    ['psar', 'sar'],
  ])('handles word-initial silent letter in %s → %s', (word, expected) => {
    expect(g2p(word)).toBe(expected);
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
