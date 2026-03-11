import { describe, expect, it } from 'vitest';
import { lookupPronunciation } from './index';

describe('lookupPronunciation', () => {
  it('returns phonemes for known dictionary words', () => {
    expect(lookupPronunciation('hello')).toEqual(['HH', 'AH0', 'L', 'OW1']);
  });

  it('returns custom pronunciation when available', () => {
    expect(lookupPronunciation('read')).toEqual(['R', 'IY1', 'D']);
  });

  // Prototype safety is not observable through translate — keep direct test
  it.each(['constructor', 'toString'])('is prototype-safe: "%s" returns null', (word) => {
    expect(lookupPronunciation(word)).toBeNull();
  });
});
