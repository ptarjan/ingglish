import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { arpabetPhonemeToIPA, arpabetToIPARaw } from './index';

describe('IPA translation', () => {
  it.each([
    ['cat', '\u2060\u02C8\u2060k\u00E6t'],
    ['hello', 'h\u0259\u2060\u02C8\u2060lo\u028A'],
  ])('translates %s to IPA', (word, expected) => {
    expect(translateSync(word, { format: 'ipa' })).toBe(expected);
  });

  it.each(['cat', 'hello', 'world', 'think', 'bird', 'the'])(
    'should round-trip %s through IPA',
    (word) => {
      const ipa = translateSync(word, { format: 'ipa' });
      const english = reverseTranslateSync(ipa, { format: 'ipa' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  );
});

describe('IPA format for common words', () => {
  const WJ = '\u2060';

  it.each([
    ['hello', `hə${WJ}ˈ${WJ}loʊ`],
    ['world', `${WJ}ˈ${WJ}wɝld`],
    ['the', 'ðə'],
    ['think', `${WJ}ˈ${WJ}θɪŋk`],
    ['beautiful', `${WJ}ˈ${WJ}bjutəfəl`],
    ['church', `${WJ}ˈ${WJ}tʃɝtʃ`],
    ['judge', `${WJ}ˈ${WJ}dʒʌdʒ`],
    ['time', `${WJ}ˈ${WJ}taɪm`],
    ['coin', `${WJ}ˈ${WJ}kɔɪn`],
    ['examination', `ɪɡ${WJ}ˌ${WJ}zæmə${WJ}ˈ${WJ}neɪʃən`],
    ['hot', `${WJ}ˈ${WJ}hɑt`],
    ['dog', `${WJ}ˈ${WJ}dɔɡ`],
    ['out', `${WJ}ˈ${WJ}aʊt`],
    ['bed', `${WJ}ˈ${WJ}bɛd`],
    ['see', `${WJ}ˈ${WJ}si`],
    ['book', `${WJ}ˈ${WJ}bʊk`],
    ['pen', `${WJ}ˈ${WJ}pɛn`],
    ['red', `${WJ}ˈ${WJ}ɹɛd`],
    ['say', `${WJ}ˈ${WJ}seɪ`],
    ['very', `${WJ}ˈ${WJ}vɛɹi`],
    ['measure', `${WJ}ˈ${WJ}mɛʒɝ`],
    ['go', `${WJ}ˈ${WJ}ɡoʊ`],
    ['yes', `${WJ}ˈ${WJ}jɛs`],
    ['she', `${WJ}ˈ${WJ}ʃi`],
  ])('translates %s to IPA', (word, expected) => {
    expect(translateSync(word, { format: 'ipa' })).toBe(expected);
  });
});

describe('arpabetPhonemeToIPA edge cases', () => {
  const WJ = '\u2060';
  it.each([
    ['XX', 'xx', 'unknown phoneme'],
    ['AH0', 'ə', 'unstressed schwa'],
    ['AE1', `${WJ}ˈ${WJ}æ`, 'primary stress'],
    ['AE2', `${WJ}ˌ${WJ}æ`, 'secondary stress'],
    ['AE', 'æ', 'unstressed non-schwa vowel'],
    ['B', 'b', 'consonant'],
    ['TH', 'θ', 'digraph consonant'],
  ])('arpabetPhonemeToIPA(%s) → %s (%s)', (input, expected) => {
    expect(arpabetPhonemeToIPA(input)).toBe(expected);
  });
});

describe('arpabetToIPA/arpabetToIPARaw unknown phoneme handling', () => {
  it('lowercases unknown phonemes in array conversion (lines 78-79)', () => {
    // An unknown phoneme like "XX" should be lowercased in the output
    const result = arpabetToIPARaw(['HH', 'XX', 'AH0', 'L']);
    expect(result).toContain('xx');
  });
});
