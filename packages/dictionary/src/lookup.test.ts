import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { lookupPronunciation } from './index';

describe('lookupPronunciation', () => {
  it('translates known words', async () => {
    const result = await translate('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', async () => {
    const hello = await translate('Hello');
    const helloLower = await translate('hello');
    expect(hello.toLowerCase()).toBe(helloLower);
    const the = await translate('The');
    const theLower = await translate('the');
    expect(the.toLowerCase()).toBe(theLower);
  });

  it('translates unknown words via G2P fallback', async () => {
    const result = await translate('xyzzyqwop');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('custom pronunciations override dictionary', async () => {
    // "read" is in CUSTOM_PRONUNCIATIONS with R IY1 D → "reed"
    expect(await translate('read')).toBe('reed');
  });

  it('returns custom pronunciation for words not in CMU', async () => {
    // "emoji" is added in custom-words, not in CMU
    const result = await translate('emoji');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  // Prototype safety is not observable through translate — keep direct test
  it('is prototype-safe: "constructor" returns null', () => {
    expect(lookupPronunciation('constructor')).toBeNull();
  });

  it('is prototype-safe: "toString" returns null', () => {
    expect(lookupPronunciation('toString')).toBeNull();
  });

  it('normalizes velar nasal: N before K becomes NG', async () => {
    // "think" with normalization: TH IH1 NG K → "thingk"
    // without normalization: TH IH1 N K → "think"
    expect(await translate('think')).toBe('thingk');
  });

  it('normalizes velar nasal: N before G becomes NG', async () => {
    // "finger" has N before G in CMU, normalized to NG
    const result = await translate('finger');
    expect(result).toContain('ng');
  });
});
