import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { expandArpabetAlternatives, ingglishToArpabet } from './from-ingglish';

describe('reverse Ingglish translation', () => {
  it('handles single consonant input', () => {
    const result = reverseTranslateSync('b');
    expect(typeof result).toBe('string');
  });

  it('handles single vowel input', () => {
    expect(typeof reverseTranslateSync('a')).toBe('string');
  });
});

describe('phoneme alternative expansion in reverse', () => {
  it.each(['but', 'ship', 'shiver'])('round-trips "%s"', (word) => {
    const ingglish = translateSync(word);
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe(word);
  });

  // Schwa+glide junctions ("-awal") render such that "awa" greedily parses as
  // AO + AE; the AO+AE → AH+W+AH sequence alternative fixes the round-trip.
  it.each(['usual', 'casual', 'visual', 'actual', 'sensual'])(
    'round-trips schwa+glide word "%s"',
    (word) => {
      expect(reverseTranslateSync(translateSync(word))).toBe(word);
    }
  );

  // Words that genuinely contain AO must be unaffected (primary parse wins).
  it.each(['thought', 'bought', 'saw', 'draw', 'awkward'])(
    'leaves genuine-AO word "%s" intact',
    (word) => {
      expect(reverseTranslateSync(translateSync(word))).toBe(word);
    }
  );

  // Consonant+H morpheme junctions spell as a digraph (TH/DH/ZH) but are two
  // phonemes; the +HH alternatives recover them.
  it.each(['adhered', 'adhesive', 'althaus', 'alzheimer', 'clotheshorse'])(
    'round-trips consonant+H junction "%s"',
    (word) => {
      expect(reverseTranslateSync(translateSync(word))).toBe(word);
    }
  );

  // Genuine digraph words (TH/DH/ZH) must be unaffected (primary parse wins).
  it.each(['the', 'this', 'thing', 'them', 'vision', 'measure'])(
    'leaves genuine digraph word "%s" intact',
    (word) => {
      expect(reverseTranslateSync(translateSync(word))).toBe(word);
    }
  );

  // The "air" spelling covers AY+R (admire) as well as EH+R (chair).
  it.each(['admire', 'expire', 'inquire', 'esquire', 'umpire'])(
    'round-trips AY+R "air"-spelled word "%s"',
    (word) => {
      expect(reverseTranslateSync(translateSync(word))).toBe(word);
    }
  );

  it.each(['chair', 'care', 'there'])('leaves genuine EH+R word "%s" intact', (word) => {
    expect(reverseTranslateSync(translateSync(word))).toBe(word);
  });
});

describe('expandArpabetAlternatives', () => {
  it('generates all-replaced variant when multiple same-length ambiguous phonemes', () => {
    // Two AE phonemes should produce the all-replaced AH variant (line 73)
    const arpabet = ['AE', 'K', 'AE', 'T'];
    const results = expandArpabetAlternatives(arpabet);
    // Should include original, two single-position AH substitutions, and the all-replaced variant
    expect(results).toContainEqual(['AH', 'K', 'AH', 'T']);
  });

  it('expands an AO+AE junction to AH+W+AH', () => {
    // "yoozhawal" (usual) parses as Y UW ZH AO AE L; the sequence alternative
    // must offer Y UW ZH AH W AH L.
    const results = expandArpabetAlternatives(['Y', 'UW', 'ZH', 'AO', 'AE', 'L']);
    expect(results).toContainEqual(['Y', 'UW', 'ZH', 'AH', 'W', 'AH', 'L']);
  });
});

describe('ingglishToArpabet', () => {
  it('skips unknown characters like digits and symbols', () => {
    // Digits and symbols should be skipped (line 143)
    const result = ingglishToArpabet('b2b');
    // Should parse 'b' and 'b', skipping '2'
    expect(result).toEqual(['B', 'B']);
  });

  it('returns null for input with only unknown characters', () => {
    expect(ingglishToArpabet('123!@#')).toBeNull();
  });
});
