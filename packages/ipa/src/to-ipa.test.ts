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

  it('should round-trip words through IPA', () => {
    for (const word of ['cat', 'hello', 'world', 'think', 'bird', 'the']) {
      const ipa = translateSync(word, { format: 'ipa' });
      const english = reverseTranslateSync(ipa, { format: 'ipa' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});

describe('IPA format for common words', () => {
  const WJ = '\u2060';

  it('translates hello to IPA', () => {
    expect(translateSync('hello', { format: 'ipa' })).toBe(`hə${WJ}ˈ${WJ}loʊ`);
  });

  it('translates world to IPA', () => {
    expect(translateSync('world', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}wɝld`);
  });

  it('translates the to IPA', () => {
    expect(translateSync('the', { format: 'ipa' })).toBe('ðə');
  });

  it('translates think to IPA', () => {
    expect(translateSync('think', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}θɪŋk`);
  });

  it('translates beautiful to IPA', () => {
    expect(translateSync('beautiful', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bjutəfəl`);
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

  it('translates all vowel sounds to IPA', () => {
    expect(translateSync('hot', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}hɑt`); // AA → ɑ
    expect(translateSync('dog', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}dɔɡ`); // AO → ɔ
    expect(translateSync('out', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}aʊt`); // AW → aʊ
    expect(translateSync('bed', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bɛd`); // EH → ɛ
    expect(translateSync('see', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}si`); // IY → i
    expect(translateSync('book', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bʊk`); // UH → ʊ
  });

  it('translates all consonant sounds to IPA', () => {
    expect(translateSync('pen', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}pɛn`); // P → p
    expect(translateSync('red', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}ɹɛd`); // R → ɹ
    expect(translateSync('say', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}seɪ`); // S → s
    expect(translateSync('very', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}vɛɹi`); // V → v
    expect(translateSync('measure', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}mɛʒɝ`); // ZH → ʒ
    expect(translateSync('go', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}ɡoʊ`); // G → ɡ
    expect(translateSync('yes', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}jɛs`); // Y → j
    expect(translateSync('she', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}ʃi`); // SH → ʃ
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
