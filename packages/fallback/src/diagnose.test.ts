import { describe, it, expect } from 'vitest';
import { lookupPronunciation } from '@ingglish/dictionary';
import { diagnoseFallback } from './index';

// These tests use words NOT in the CMU dictionary, so they actually reach
// diagnoseFallback in the Word Explorer. Words already in the dictionary
// show "dictionary" or "custom override" badges instead.

describe('diagnoseFallback', () => {
  it('returns "initialism" for spelled-out letter sequences', () => {
    // omg, diy, eta, faq — not in CMU dictionary
    for (const w of ['omg', 'diy', 'eta', 'faq']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      expect(diagnoseFallback(w)).toBe('initialism');
    }
  });

  it('returns "british" for British spellings with American equivalents', () => {
    // organise, specialise, categorise, normalise — not in CMU
    for (const w of ['organise', 'specialise', 'categorise', 'normalise']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      expect(diagnoseFallback(w)).toBe('british');
    }
  });

  it('returns "compound" for words that split into known parts', () => {
    // treehouse — not in CMU dictionary
    for (const w of ['treehouse']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      expect(diagnoseFallback(w)).toBe('compound');
    }
  });

  it('returns "stemming" for words with known base + known suffix', () => {
    // retweet, youtubing, adulting, ghosting, onboarding — not in CMU
    for (const w of ['retweet', 'youtubing', 'adulting', 'ghosting', 'onboarding']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      expect(diagnoseFallback(w)).toBe('stemming');
    }
  });

  it('returns "g2p" for unknown words handled by grapheme-to-phoneme rules', () => {
    for (const w of ['splonk', 'blorft', 'zazzle', 'crebbit']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      expect(diagnoseFallback(w)).toBe('g2p');
    }
  });

  it('returns null for obvious non-words (passthrough)', () => {
    // 3+ consecutive identical characters
    expect(diagnoseFallback('ssssssss')).toBeNull();
    expect(diagnoseFallback('brrr')).toBeNull();
    // No vowels (a/e/i/o/u/y)
    expect(diagnoseFallback('bcdfg')).toBeNull();
    expect(diagnoseFallback('tsk')).toBeNull();
    expect(diagnoseFallback('pfft')).toBeNull();
  });
});
