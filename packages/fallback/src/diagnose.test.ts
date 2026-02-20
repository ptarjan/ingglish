import { describe, it, expect } from 'vitest';
import { diagnoseFallback } from './index';

describe('diagnoseFallback', () => {
  it('returns "custom" for words with custom pronunciations', () => {
    expect(diagnoseFallback('github')).toBe('custom');
    expect(diagnoseFallback('emoji')).toBe('custom');
    expect(diagnoseFallback('webpack')).toBe('custom');
  });

  it('returns "initialism" for spelled-out letter sequences', () => {
    expect(diagnoseFallback('url')).toBe('initialism');
    expect(diagnoseFallback('api')).toBe('initialism');
  });

  it('returns "british" for British spellings with American equivalents', () => {
    expect(diagnoseFallback('colour')).toBe('british');
    expect(diagnoseFallback('honour')).toBe('british');
    expect(diagnoseFallback('defence')).toBe('british');
  });

  it('returns "compound" for words that split into known parts', () => {
    expect(diagnoseFallback('sunflower')).toBe('compound');
    expect(diagnoseFallback('popcorn')).toBe('compound');
  });

  it('returns "stemming" for words with known base + known suffix', () => {
    expect(diagnoseFallback('googling')).toBe('stemming');
    expect(diagnoseFallback('podcasting')).toBe('stemming');
    expect(diagnoseFallback('retweet')).toBe('stemming');
  });

  it('returns "g2p" for unknown words handled by grapheme-to-phoneme rules', () => {
    expect(diagnoseFallback('splonk')).toBe('g2p');
    expect(diagnoseFallback('blorft')).toBe('g2p');
    expect(diagnoseFallback('zazzle')).toBe('g2p');
    expect(diagnoseFallback('crebbit')).toBe('g2p');
  });

  it('returns null for obvious non-words (passthrough)', () => {
    // 3+ consecutive identical characters
    expect(diagnoseFallback('ssssssss')).toBeNull();
    expect(diagnoseFallback('brrr')).toBeNull();
    // No vowels (a/e/i/o/u/y)
    expect(diagnoseFallback('bcdfg')).toBeNull();
    expect(diagnoseFallback('html')).toBeNull();
    expect(diagnoseFallback('sql')).toBeNull();
  });
});
