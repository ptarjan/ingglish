import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { arpabetPhonemeToIPA, arpabetToIPARaw } from './index';

describe('IPA translation', () => {
  it('should produce valid IPA output', () => {
    const ipa = translateSync('cat', { format: 'ipa' });
    expect(ipa).toBeDefined();
    expect(typeof ipa).toBe('string');
    expect(ipa).toMatch(/[æɑɛɪɔʊəɹŋʃʒθðˈˌ]/);
  });

  it('should produce non-empty IPA for any word', () => {
    const ipa = translateSync('hello', { format: 'ipa' });
    expect(ipa.length).toBeGreaterThan(0);
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
  ])('translates %s to IPA', (word, expected) => {
    expect(translateSync(word, { format: 'ipa' })).toBe(expected);
  });

  it('translates affricates (church, judge)', () => {
    expect(translateSync('church', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}tʃɝtʃ`);
    expect(translateSync('judge', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}dʒʌdʒ`);
  });

  it('translates diphthongs (time, coin)', () => {
    expect(translateSync('time', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}taɪm`);
    expect(translateSync('coin', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}kɔɪn`);
  });

  it('places secondary stress correctly (examination)', () => {
    expect(translateSync('examination', { format: 'ipa' })).toBe(
      `ɪɡ${WJ}ˌ${WJ}zæmə${WJ}ˈ${WJ}neɪʃən`
    );
  });

  it.each([
    ['hot', `${WJ}ˈ${WJ}hɑt`, 'AA → ɑ'],
    ['dog', `${WJ}ˈ${WJ}dɔɡ`, 'AO → ɔ'],
    ['out', `${WJ}ˈ${WJ}aʊt`, 'AW → aʊ'],
    ['bed', `${WJ}ˈ${WJ}bɛd`, 'EH → ɛ'],
    ['see', `${WJ}ˈ${WJ}si`, 'IY → i'],
    ['book', `${WJ}ˈ${WJ}bʊk`, 'UH → ʊ'],
  ])('translates vowel sound in %s (%s)', (word, expected) => {
    expect(translateSync(word, { format: 'ipa' })).toBe(expected);
  });

  it.each([
    ['pen', `${WJ}ˈ${WJ}pɛn`, 'P → p'],
    ['red', `${WJ}ˈ${WJ}ɹɛd`, 'R → ɹ'],
    ['say', `${WJ}ˈ${WJ}seɪ`, 'S → s'],
    ['very', `${WJ}ˈ${WJ}vɛɹi`, 'V → v'],
    ['measure', `${WJ}ˈ${WJ}mɛʒɝ`, 'ZH → ʒ'],
    ['go', `${WJ}ˈ${WJ}ɡoʊ`, 'G → ɡ'],
    ['yes', `${WJ}ˈ${WJ}jɛs`, 'Y → j'],
    ['she', `${WJ}ˈ${WJ}ʃi`, 'SH → ʃ'],
  ])('translates consonant sound in %s (%s)', (word, expected) => {
    expect(translateSync(word, { format: 'ipa' })).toBe(expected);
  });
});

describe('arpabetPhonemeToIPA edge cases', () => {
  it('returns lowercase for unknown phonemes', () => {
    expect(arpabetPhonemeToIPA('XX')).toBe('xx');
  });

  it('returns schwa for unstressed AH0', () => {
    expect(arpabetPhonemeToIPA('AH0')).toBe('ə');
  });

  it('adds primary stress marker for stress 1', () => {
    const WJ = '\u2060';
    expect(arpabetPhonemeToIPA('AE1')).toBe(`${WJ}ˈ${WJ}æ`);
  });

  it('adds secondary stress marker for stress 2', () => {
    const WJ = '\u2060';
    expect(arpabetPhonemeToIPA('AE2')).toBe(`${WJ}ˌ${WJ}æ`);
  });

  it('returns plain IPA for unstressed non-schwa vowel', () => {
    // AE without stress marker — returns plain æ
    expect(arpabetPhonemeToIPA('AE')).toBe('æ');
  });

  it('returns IPA for consonants (no stress)', () => {
    expect(arpabetPhonemeToIPA('B')).toBe('b');
    expect(arpabetPhonemeToIPA('TH')).toBe('θ');
  });
});

describe('arpabetToIPA/arpabetToIPARaw unknown phoneme handling', () => {
  it('lowercases unknown phonemes in array conversion (lines 78-79)', () => {
    // An unknown phoneme like "XX" should be lowercased in the output
    const result = arpabetToIPARaw(['HH', 'XX', 'AH0', 'L']);
    expect(result).toContain('xx');
  });
});
