import { describe, expect, it } from 'vitest';
import { arpabetToPronunciation, syllabify } from './to-pronunciation';

describe('syllabify', () => {
  it('should handle single-syllable words', () => {
    // "cat" = K AE1 T
    expect(syllabify(['K', 'AE1', 'T'])).toEqual([{ phonemes: ['K', 'AE1', 'T'], stress: 1 }]);
  });

  it('should split two-syllable words using maximal onset', () => {
    // "hello" = HH AH0 L OW1
    expect(syllabify(['HH', 'AH0', 'L', 'OW1'])).toEqual([
      { phonemes: ['HH', 'AH0'], stress: 0 },
      { phonemes: ['L', 'OW1'], stress: 1 },
    ]);
  });

  it('should handle three-syllable words', () => {
    // "beautiful" = B Y UW1 T AH0 F AH0 L
    expect(syllabify(['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'])).toEqual([
      { phonemes: ['B', 'Y', 'UW1'], stress: 1 },
      { phonemes: ['T', 'AH0'], stress: 0 },
      { phonemes: ['F', 'AH0', 'L'], stress: 0 },
    ]);
  });

  it('should handle consonant clusters between vowels', () => {
    // "extra" = EH1 K S T R AH0
    expect(syllabify(['EH1', 'K', 'S', 'T', 'R', 'AH0'])).toEqual([
      { phonemes: ['EH1', 'K'], stress: 1 },
      { phonemes: ['S', 'T', 'R', 'AH0'], stress: 0 },
    ]);
  });

  it('should handle words with no consonants between vowels', () => {
    // "chaos" = K EY1 AA0 S
    expect(syllabify(['K', 'EY1', 'AA0', 'S'])).toEqual([
      { phonemes: ['K', 'EY1'], stress: 1 },
      { phonemes: ['AA0', 'S'], stress: 0 },
    ]);
  });

  it('should handle words with no vowels', () => {
    expect(syllabify(['S', 'T'])).toEqual([{ phonemes: ['S', 'T'], stress: 0 }]);
  });

  it('should treat secondary stress as stressed', () => {
    // "understand" = AH2 N D ER0 S T AE1 N D
    const result = syllabify(['AH2', 'N', 'D', 'ER0', 'S', 'T', 'AE1', 'N', 'D']);
    expect(result[0]!.stress).toBe(2);
    expect(result[2]!.stress).toBe(1);
  });
});

describe('arpabetToPronunciation', () => {
  it('should convert "hello" to guide format', () => {
    expect(arpabetToPronunciation(['HH', 'AH0', 'L', 'OW1'])).toBe('ha-LOH');
  });

  it('should convert "beautiful" to guide format', () => {
    expect(arpabetToPronunciation(['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'])).toBe(
      'BYOO-ta-fal'
    );
  });

  it('should convert single-syllable stressed word', () => {
    // "world" = W ER1 L D
    expect(arpabetToPronunciation(['W', 'ER1', 'L', 'D'])).toBe('WERLD');
  });

  it('should convert single-syllable unstressed word', () => {
    // "the" = DH AH0
    expect(arpabetToPronunciation(['DH', 'AH0'])).toBe('dha');
  });

  it('should handle R-colored vowels within a syllable', () => {
    // "star" = S T AA1 R
    expect(arpabetToPronunciation(['S', 'T', 'AA1', 'R'])).toBe('STAR');
  });

  it('should convert "computer" correctly', () => {
    // K AH0 M P Y UW1 T ER0
    expect(arpabetToPronunciation(['K', 'AH0', 'M', 'P', 'Y', 'UW1', 'T', 'ER0'])).toBe(
      'kam-PYOO-ter'
    );
  });

  it('should uppercase secondary stress syllables', () => {
    // "understand" = AH2 N D ER0 S T AE1 N D
    const result = arpabetToPronunciation(['AH2', 'N', 'D', 'ER0', 'S', 'T', 'AE1', 'N', 'D']);
    expect(result).toBe('UHN-der-STAND');
  });

  it('should handle words starting with a vowel', () => {
    // "about" = AH0 B AW1 T
    expect(arpabetToPronunciation(['AH0', 'B', 'AW1', 'T'])).toBe('a-BOUT');
  });

  it('should handle single vowel', () => {
    // "a" = AH0
    expect(arpabetToPronunciation(['AH0'])).toBe('a');
  });
});
