import { describe, expect, it } from 'vitest';
import { ipaToArpabet, ipaToArpabetString } from './from-ipa';

describe('ipaToArpabet', () => {
  it('converts simple consonants', () => {
    expect(ipaToArpabet('p')).toEqual(['P']);
    expect(ipaToArpabet('b')).toEqual(['B']);
    expect(ipaToArpabet('t')).toEqual(['T']);
    expect(ipaToArpabet('d')).toEqual(['D']);
  });

  it('converts vowels', () => {
    expect(ipaToArpabet('æ')).toEqual(['AE']);
    expect(ipaToArpabet('ɑ')).toEqual(['AA']);
    expect(ipaToArpabet('ɛ')).toEqual(['EH']);
    expect(ipaToArpabet('ɪ')).toEqual(['IH']);
  });

  it('converts diphthongs', () => {
    expect(ipaToArpabet('aɪ')).toEqual(['AY']);
    expect(ipaToArpabet('aʊ')).toEqual(['AW']);
    expect(ipaToArpabet('ɔɪ')).toEqual(['OY']);
    expect(ipaToArpabet('oʊ')).toEqual(['OW']);
    expect(ipaToArpabet('eɪ')).toEqual(['EY']);
  });

  it('converts affricates', () => {
    expect(ipaToArpabet('tʃ')).toEqual(['CH']);
    expect(ipaToArpabet('dʒ')).toEqual(['JH']);
  });

  it('converts fricatives', () => {
    expect(ipaToArpabet('θ')).toEqual(['TH']);
    expect(ipaToArpabet('ð')).toEqual(['DH']);
    expect(ipaToArpabet('ʃ')).toEqual(['SH']);
    expect(ipaToArpabet('ʒ')).toEqual(['ZH']);
  });

  it('strips stress markers', () => {
    expect(ipaToArpabet('ˈhɛˌloʊ')).toEqual(['HH', 'EH', 'L', 'OW']);
  });

  it('converts complete words', () => {
    expect(ipaToArpabet('həˈɫoʊ')).toEqual(['HH', 'AH0', 'L', 'OW']);
    expect(ipaToArpabet('ˈwɝɫd')).toEqual(['W', 'ER', 'L', 'D']);
    expect(ipaToArpabet('ˈθɔt')).toEqual(['TH', 'AO', 'T']);
  });

  it('handles both g variants', () => {
    expect(ipaToArpabet('g')).toEqual(['G']);
    expect(ipaToArpabet('ɡ')).toEqual(['G']);
  });

  it('handles both l variants', () => {
    expect(ipaToArpabet('l')).toEqual(['L']);
    expect(ipaToArpabet('ɫ')).toEqual(['L']);
  });
});

describe('ipaToArpabetString', () => {
  it('returns space-separated phonemes', () => {
    expect(ipaToArpabetString('həˈɫoʊ')).toBe('HH AH0 L OW');
    expect(ipaToArpabetString('ˈwɝɫd')).toBe('W ER L D');
  });
});
