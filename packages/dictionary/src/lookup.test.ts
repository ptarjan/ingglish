import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { lookupPronunciation } from './index';

describe('lookupPronunciation', () => {
  it('translates known words', async () => {
    expect(await translate('hello')).toBe('haloh');
  });

  it('is case-insensitive', async () => {
    expect(await translate('Hello')).toBe('Haloh');
    expect(await translate('The')).toBe('Dha');
  });

  it('translates unknown words via G2P fallback', async () => {
    const result = await translate('xyzzyqwop');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('custom pronunciations override dictionary', async () => {
    expect(await translate('read')).toBe('reed');
  });

  it('returns custom pronunciation for words not in CMU', async () => {
    expect(await translate('emoji')).toBe('imohjee');
  });

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

  it.each([
    ['think', 'thingk', 'N before K → NG'],
    ['finger', 'fingger', 'N before G → NG'],
  ])('normalizes velar nasal: %s → %s (%s)', async (word, expected) => {
    expect(await translate(word)).toBe(expected);
  });
});
