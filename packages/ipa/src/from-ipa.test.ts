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

  it('maps plain /a/ to AE for recognizable foreign word output', () => {
    // Plain /a/ (common in Arabic, Spanish, etc.) should map to AE ("a" in cat),
    // not AA ("o" in father), so foreign words stay recognizable:
    // e.g. "salam" not "solom", "ramadan" not "romodon"
    expect(ipaToArpabet('a')).toEqual(['AE']);
    // Full Arabic-style words
    expect(ipaToArpabet('salam')).toEqual(['S', 'AE', 'L', 'AE', 'M']);
    expect(ipaToArpabet('marhaba')).toEqual(['M', 'AE', 'R', 'HH', 'AE', 'B', 'AE']);
  });

  it('maps Japanese ɯ to UH (short "u", not long "oo")', () => {
    expect(ipaToArpabet('ɯ')).toEqual(['UH']);
    // sakura, not "sakoora"
    expect(ipaToArpabet('sakɯɾa')).toEqual(['S', 'AE', 'K', 'UH', 'R', 'AE']);
    // sushi
    expect(ipaToArpabet('sɯɕi')).toEqual(['S', 'UH', 'SH', 'IY']);
  });

  it('maps Japanese moraic ɴ to N (not NG)', () => {
    expect(ipaToArpabet('ɴ')).toEqual(['N']);
    // genki, not "gengkee"
    expect(ipaToArpabet('geɴki')).toEqual(['G', 'EH', 'N', 'K', 'IY']);
  });

  it('converts CJK affricates as two-char sequences', () => {
    // tɕ (Mandarin/Korean palatal) → CH, not T+SH
    expect(ipaToArpabet('tɕ')).toEqual(['CH']);
    // dʑ (Japanese voiced palatal) → JH, not D+ZH
    expect(ipaToArpabet('dʑ')).toEqual(['JH']);
    // ʈʂ (Mandarin retroflex) → CH, not T+SH
    expect(ipaToArpabet('ʈʂ')).toEqual(['CH']);
    // 忍者 ninja: /niɴdʑa/ → N IY N JH AE
    expect(ipaToArpabet('niɴdʑa')).toEqual(['N', 'IY', 'N', 'JH', 'AE']);
    // 茶 cha: /ʈʂa/ → CH AE (after stripping aspiration mark)
    expect(ipaToArpabet('ʈʂa')).toEqual(['CH', 'AE']);
  });

  it('converts nasal vowels to vowel + N', () => {
    // French "enfants" /ɑ̃fɑ̃/
    expect(ipaToArpabet('ɑ̃fɑ̃')).toEqual(['AA', 'N', 'F', 'AA', 'N']);
    // French nasal vowel variants
    expect(ipaToArpabet('ɛ̃')).toEqual(['EH', 'N']);
    expect(ipaToArpabet('ɔ̃')).toEqual(['AO', 'N']);
    // French "bonjour" /bɔ̃ʒuʁ/
    expect(ipaToArpabet('bɔ̃ʒuʁ')).toEqual(['B', 'AO', 'N', 'ZH', 'UW', 'R']);
  });
});

describe('ipaToArpabetString', () => {
  it('returns space-separated phonemes', () => {
    expect(ipaToArpabetString('həˈɫoʊ')).toBe('HH AH0 L OW');
    expect(ipaToArpabetString('ˈwɝɫd')).toBe('W ER L D');
  });
});
