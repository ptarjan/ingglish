import { describe, expect, it } from 'vitest';
import { arpabetToDeseret } from './to-deseret';

describe('arpabetToDeseret', () => {
  it('converts consonants', () => {
    // "bat" = B AE1 T
    expect(arpabetToDeseret(['B', 'AE1', 'T'])).toBe('𐐺𐐰𐐻');
  });

  it('converts long vowels', () => {
    // "see" = S IY1
    expect(arpabetToDeseret(['S', 'IY1'])).toBe('𐑅𐐨');
    // "go" = G OW1
    expect(arpabetToDeseret(['G', 'OW1'])).toBe('𐑀𐐬');
  });

  it('converts diphthongs', () => {
    // "my" = M AY1
    expect(arpabetToDeseret(['M', 'AY1'])).toBe('𐑋𐐴');
    // "cow" = K AW1
    expect(arpabetToDeseret(['K', 'AW1'])).toBe('𐐿𐐵');
    // "boy" = B OY1
    expect(arpabetToDeseret(['B', 'OY1'])).toBe('𐐺𐑎');
  });

  it('handles AH stress: AH0 → schwa, AH1 → strut', () => {
    // "about" = AH0 B AW1 T
    expect(arpabetToDeseret(['AH0', 'B', 'AW1', 'T'])).toBe('𐐱𐐺𐐵𐐻');
    // "cup" = K AH1 P
    expect(arpabetToDeseret(['K', 'AH1', 'P'])).toBe('𐐿𐐲𐐹');
  });

  it('handles ER: ER0 → schwa+R, ER1 → strut+R', () => {
    // "letter" = L EH1 T ER0
    expect(arpabetToDeseret(['L', 'EH1', 'T', 'ER0'])).toBe('𐑊𐐯𐐻𐐱𐑉');
    // "bird" = B ER1 D
    expect(arpabetToDeseret(['B', 'ER1', 'D'])).toBe('𐐺𐐲𐑉𐐼');
  });

  it('handles Y+UW → Ew ligature', () => {
    // "cute" = K Y UW1 T
    expect(arpabetToDeseret(['K', 'Y', 'UW1', 'T'])).toBe('𐐿𐑏𐐻');
    // "music" = M Y UW1 Z IH0 K
    expect(arpabetToDeseret(['M', 'Y', 'UW1', 'Z', 'IH0', 'K'])).toBe('𐑋𐑏𐑆𐐮𐐿');
  });

  it('converts all consonant phonemes', () => {
    const consonants = [
      ['P', '𐐹'],
      ['B', '𐐺'],
      ['T', '𐐻'],
      ['D', '𐐼'],
      ['K', '𐐿'],
      ['G', '𐑀'],
      ['F', '𐑁'],
      ['V', '𐑂'],
      ['TH', '𐑃'],
      ['DH', '𐑄'],
      ['S', '𐑅'],
      ['Z', '𐑆'],
      ['SH', '𐑇'],
      ['ZH', '𐑈'],
      ['CH', '𐐽'],
      ['JH', '𐐾'],
      ['M', '𐑋'],
      ['N', '𐑌'],
      ['NG', '𐑍'],
      ['L', '𐑊'],
      ['R', '𐑉'],
      ['W', '𐐶'],
      ['Y', '𐐷'],
      ['HH', '𐐸'],
    ] as const;

    for (const [arpabet, deseret] of consonants) {
      // Y alone (not followed by UW) should map normally
      if (arpabet === 'Y') {
        expect(arpabetToDeseret([arpabet, 'AH1'])).toBe(deseret + '𐐲');
      } else {
        expect(arpabetToDeseret([arpabet])).toBe(deseret);
      }
    }
  });
});
