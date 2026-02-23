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

  it('treats Japanese /oɯ/ as single long vowel (dict convention for oː)', () => {
    // oɯ is a single OW, not OW+UH — fixes ~48k Japanese dict entries
    expect(ipaToArpabet('oɯ')).toEqual(['OW']);
    // 東京 /toɯkjoɯ/ → T OW K Y OW (not T OW UH K Y OW UH)
    expect(ipaToArpabet('toɯkjoɯ')).toEqual(['T', 'OW', 'K', 'Y', 'OW']);
    // 先生 /seɴdʑoɯ/ → S EH N JH OW
    expect(ipaToArpabet('seɴdʑoɯ')).toEqual(['S', 'EH', 'N', 'JH', 'OW']);
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

  it('maps IPA /y/ to UW vowel, not Y consonant', () => {
    // IPA /y/ is close front rounded vowel (French "tu", German "über"),
    // not the palatal approximant /j/ (which maps to Y via the forward map)
    expect(ipaToArpabet('y')).toEqual(['UW']);
    // French "tu" /ty/ → T UW (→ "too"), not T Y (→ "ty")
    expect(ipaToArpabet('ty')).toEqual(['T', 'UW']);
    // French "musique" /myzik/ → M UW Z IY K
    expect(ipaToArpabet('myzik')).toEqual(['M', 'UW', 'Z', 'IY', 'K']);
  });

  it('treats Finnish /ɑu/ and /ɑi/ as diphthongs', () => {
    // Finnish diphthongs use /ɑ/ (open back), not /a/ (open front)
    expect(ipaToArpabet('ɑu')).toEqual(['AW']);
    expect(ipaToArpabet('ɑi')).toEqual(['AY']);
    // "sauna" /sɑunɑ/ → S AW N AA (not S AA UW N AA = "sooono")
    expect(ipaToArpabet('sɑunɑ')).toEqual(['S', 'AW', 'N', 'AA']);
    // "taivas" /tɑivɑs/ → T AY V AA S (not T AA IY V AA S = "toeevos")
    expect(ipaToArpabet('tɑivɑs')).toEqual(['T', 'AY', 'V', 'AA', 'S']);
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

  it('handles precomposed nasal vowels via NFD normalization', () => {
    // Precomposed ã (U+00E3) should work the same as decomposed a + U+0303
    expect(ipaToArpabet('\u00E3')).toEqual(['AE', 'N']); // ã → a + tilde → AE N
    expect(ipaToArpabet('\u00F5')).toEqual(['OW', 'N']); // õ → o + tilde → OW N
  });

  it('maps /x/ to HH by default, K with German override', () => {
    // Default: x → HH (better for Portuguese, Dutch, Chinese)
    expect(ipaToArpabet('x')).toEqual(['HH']);
    // Chinese 好 /xɑʊ/ → HH AW ("hou" not "kou")
    expect(ipaToArpabet('xɑʊ')).toEqual(['HH', 'AW']);
    // German override: x → K (Bach, Nacht)
    expect(ipaToArpabet('x', { x: 'K' })).toEqual(['K']);
    expect(ipaToArpabet('nɑxt', { x: 'K' })).toEqual(['N', 'AA', 'K', 'T']);
  });

  it('maps Dutch /ɣ/ to HH with override', () => {
    // Default: ɣ → G (generic approximation for voiced velar fricative)
    expect(ipaToArpabet('ɣ')).toEqual(['G']);
    // Dutch override: ɣ → HH (breathy, H-like)
    expect(ipaToArpabet('ɣ', { ɣ: 'HH' })).toEqual(['HH']);
    // Dutch "goed" /ɣut/ → HH UW T (≈ "hoot", not "goot")
    expect(ipaToArpabet('ɣut', { ɣ: 'HH' })).toEqual(['HH', 'UW', 'T']);
  });

  it('deduplicates consecutive identical phonemes', () => {
    // Finnish long vowels: /uu/ → single UW, not UW UW
    expect(ipaToArpabet('tuuli')).toEqual(['T', 'UW', 'L', 'IY']);
    // Finnish geminate consonants: /ss/ → single S
    expect(ipaToArpabet('kissɑ')).toEqual(['K', 'IY', 'S', 'AA']);
    // Non-consecutive identical phonemes are preserved
    expect(ipaToArpabet('papa')).toEqual(['P', 'AE', 'P', 'AE']);
  });

  it('handles ç (palatal fricative) after NFC recomposition', () => {
    // ç decomposes to c+cedilla in NFD — NFC recomposition is needed
    // to match the precomposed map key
    expect(ipaToArpabet('ç')).toEqual(['SH']);
    // German "Mädchen" /mɛːtçən/
    expect(ipaToArpabet('mɛːtçən')).toEqual(['M', 'EH', 'T', 'SH', 'AH0', 'N']);
  });

  it('does not denasalize consonants (w̃ → W, not WN)', () => {
    // Portuguese nasalized glide w̃ should just become W
    expect(ipaToArpabet('w\u0303')).toEqual(['W']);
    // Portuguese "coração" — nasalized w̃ at end should not produce "wn"
    expect(ipaToArpabet('koɾɐsɐ̃w\u0303')).toEqual(['K', 'OW', 'R', 'AH', 'S', 'AH', 'N', 'W']);
  });

  it('expands palatal nasal ɲ to N Y', () => {
    expect(ipaToArpabet('ɲ')).toEqual(['N', 'Y']);
    // Spanish "España" /espaɲa/ → "espanya"
    expect(ipaToArpabet('espaɲa')).toEqual(['EH', 'S', 'P', 'AE', 'N', 'Y', 'AE']);
  });

  it('expands palatal lateral ʎ to L Y', () => {
    expect(ipaToArpabet('ʎ')).toEqual(['L', 'Y']);
    // Spanish "calle" /kaʎe/ → "kalye"
    expect(ipaToArpabet('kaʎe')).toEqual(['K', 'AE', 'L', 'Y', 'EH']);
  });

  it('treats /oi/, /ou/, /ei/, /æi/, /œy/ as diphthongs', () => {
    expect(ipaToArpabet('oi')).toEqual(['OY']);
    expect(ipaToArpabet('ou')).toEqual(['OW']);
    expect(ipaToArpabet('ei')).toEqual(['EY']);
    // Finnish "koira" /koirɑ/ → K OY R AA
    expect(ipaToArpabet('koirɑ')).toEqual(['K', 'OY', 'R', 'AA']);
    // Finnish "koulu" /koulu/ → K OW L UW
    expect(ipaToArpabet('koulu')).toEqual(['K', 'OW', 'L', 'UW']);
    // Finnish "päivä" /pæivæ/ → P AY V AE (not P AE IY V AE)
    expect(ipaToArpabet('pæivæ')).toEqual(['P', 'AY', 'V', 'AE']);
    // Dutch "huis" /hœys/ → HH OY S (not HH AH1 UW S)
    expect(ipaToArpabet('hœys')).toEqual(['HH', 'OY', 'S']);
  });

  it('maps voiced glottal fricative ɦ to HH', () => {
    expect(ipaToArpabet('ɦ')).toEqual(['HH']);
    // Korean 합 in "감사합니다"
    expect(ipaToArpabet('ɦamnida')).toEqual(['HH', 'AE', 'M', 'N', 'IY', 'D', 'AE']);
  });

  it('strips IPA modifier letters (aspiration, tone bars)', () => {
    // Aspiration marker ʰ (U+02B0) should be stripped
    expect(ipaToArpabet('tʰa')).toEqual(['T', 'AE']);
    // Mandarin tone bars should be stripped
    expect(ipaToArpabet('ta\u02E5\u02E9')).toEqual(['T', 'AE']);
    expect(ipaToArpabet('ɕjɛ\u02E5\u02E9')).toEqual(['SH', 'Y', 'EH']);
  });

  it('strips combining diacritics from Korean transcriptions', () => {
    // Korean a̠ (a + U+0320 combining minus below)
    expect(ipaToArpabet('a\u0320')).toEqual(['AE']);
    // Korean ʌ̹ (ʌ + U+0339 combining right half ring)
    expect(ipaToArpabet('ʌ\u0339')).toEqual(['AH']);
    // Korean unreleased k̚ (k + U+031A combining left angle above)
    expect(ipaToArpabet('k\u031A')).toEqual(['K']);
  });

  it('maps Mandarin retroflex approximant ɻ to R', () => {
    expect(ipaToArpabet('ɻ')).toEqual(['R']);
    // Mandarin 二 /aɻ/ → AE R (not just AE with ɻ dropped)
    expect(ipaToArpabet('aɻ')).toEqual(['AE', 'R']);
  });

  it('strips accent marks on loanwords without dropping base letters', () => {
    // é (e + acute) should strip the accent, keep the e → EH
    expect(ipaToArpabet('é')).toEqual(['EH']);
    // Finnish loanword "bébé" — accented e's should still produce EH
    expect(ipaToArpabet('bébé')).toEqual(['B', 'EH', 'B', 'EH']);
  });
});

describe('ipaToArpabetString', () => {
  it('returns space-separated phonemes', () => {
    expect(ipaToArpabetString('həˈɫoʊ')).toBe('HH AH0 L OW');
    expect(ipaToArpabetString('ˈwɝɫd')).toBe('W ER L D');
  });
});
