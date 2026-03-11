import { translateSync } from 'ingglish';
import { describe, it, expect } from 'vitest';
import { getDictionary, CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { ARPABET_VOWELS, ARPABET_CONSONANTS, STRESS_MARKER_REGEX } from '@ingglish/phonemes';

// All words used in G2P tests are NOT in the CMU dictionary, so translateSync
// exercises the G2P pipeline. Strip the not-found marker to get just the
// phonetic output.
const g2p = (word: string) => translateSync(word).replace(/^\uFFFD/, '');

describe('unknown-words', () => {
  describe('CUSTOM_PRONUNCIATIONS validation', () => {
    it('should not have identical pronunciations to CMU dictionary', () => {
      // Skip if using stub dictionary (less than 100 entries)
      // Full CMU dict has ~130,000 entries, stub has ~12
      const dict = getDictionary();
      if (Object.keys(dict).length < 100) {
        // Using stub dictionary - can't meaningfully test this
        return;
      }

      const identicalDuplicates: string[] = [];
      for (const word of Object.keys(CUSTOM_PRONUNCIATIONS)) {
        const cmuPronunciation = dict[word];
        if (cmuPronunciation !== undefined) {
          // Word is in both - check if pronunciations are identical
          const customPronunciation = CUSTOM_PRONUNCIATIONS[word]!;
          const cmuPhonemes = cmuPronunciation[0]!; // First pronunciation variant
          if (
            customPronunciation.length === cmuPhonemes.length &&
            customPronunciation.every((p, i) => p === cmuPhonemes[i])
          ) {
            identicalDuplicates.push(word);
          }
        }
      }
      expect(identicalDuplicates).toEqual([]);
    });

    it('should only contain valid ARPAbet phonemes', () => {
      const validPhonemes = new Set<string>([...ARPABET_VOWELS, ...ARPABET_CONSONANTS]);
      const invalid: string[] = [];

      for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
        for (const p of phonemes) {
          const bare = p.replace(STRESS_MARKER_REGEX, '');
          if (!validPhonemes.has(bare)) {
            invalid.push(`${word}: invalid phoneme "${p}"`);
          }
        }
      }

      expect(invalid).toEqual([]);
    });

    it('should have stress markers on vowels only', () => {
      const vowelSet = new Set<string>(ARPABET_VOWELS as readonly string[]);
      const errors: string[] = [];

      for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
        for (const p of phonemes) {
          const bare = p.replace(STRESS_MARKER_REGEX, '');
          const hasStress = STRESS_MARKER_REGEX.test(p);
          if (hasStress && !vowelSet.has(bare)) {
            errors.push(`${word}: stress on consonant "${p}"`);
          }
        }
      }

      expect(errors).toEqual([]);
    });
  });

  describe('normalizeVelarNasal', () => {
    it('should correct N before K to NG K', () => {
      // "think" with velar nasal normalization: TH IH1 NG K → "thingk"
      expect(translateSync('think')).toBe('thingk');
    });

    it('should not change N in other positions', () => {
      // "run" has N at end, stays N → no "ng" in output
      const result = translateSync('run');
      expect(result).not.toContain('ng');
    });
  });

  describe('G2P rules', () => {
    it.each([
      // consonant digraphs
      ['shug', 'shuhg', 'SH'],
      ['chub', 'chuhb', 'CH'],
      ['thub', 'thuhb', 'TH'],
      ['phig', 'fig', 'PH → F'],
      ['quib', 'kwib', 'QU → KW'],
      // vowel digraphs
      ['taig', 'tayg', 'AI → EY'],
      ['soat', 'soht', 'OA → OW'],
      ['spreed', 'spreed', 'EE → IY'],
      ['fleeble', 'fleebal', 'EE in context'],
      // R-controlled vowels
      ['birg', 'berg', 'IR → ER'],
      ['slurk', 'slerk', 'UR → ER'],
      // trigraphs
      ['snight', 'snait', 'IGH → AY'],
      ['skight', 'skait', 'IGH → AY'],
      ['splotch', 'sploch', 'TCH → CH'],
      ['blodge', 'bloj', 'DGE → JH'],
      ['spludge', 'spluhj', 'DGE → JH'],
      // EIGH
      ['deveigh', 'divay', 'EIGH → long A'],
      ['spleigh', 'splay', 'EIGH → long A'],
      ['splaugh', 'splaw', 'AUGH → AO'],
      // SSION/TION/SION
      ['blossion', 'bloshan', 'SSION → SH'],
      ['cession', 'seshan', 'SSION → SH'],
      ['blation', 'blayshan', 'TION → SH'],
      ['gresion', 'grayzhan', 'SION → ZH'],
      // silent consonant pairs
      ['wrib', 'rib', 'WR → R'],
      ['knib', 'nib', 'KN → N'],
      ['gnab', 'nab', 'GN → N (word-initial)'],
      ['psar', 'sar', 'PS → S'],
      ['pnib', 'nib', 'PN → N'],
      // magic-e
      ['brike', 'braik', 'I_E → AY'],
      ['blone', 'blohn', 'O_E → OW'],
      ['frube', 'froob', 'U_E → UW'],
      ['sprene', 'spreen', 'E_E → IY'],
      // doubled consonants
      ['bluzz', 'bluhz', 'ZZ → Z'],
      ['smutt', 'smuht', 'TT → T'],
      // Y rules
      ['glyb', 'glib', 'Y as vowel mid-word'],
      ['spyn', 'spin', 'Y as vowel mid-word'],
      ['snylk', 'snilk', 'Y as vowel mid-word'],
      ['flubby', 'fluhbee', 'word-final Y → /i/'],
      ['bunkify', 'buhngkifai', '-FY suffix → /faɪ/'],
      ['yub', 'yuhb', 'Y as consonant before vowels'],
      // -ed suffix
      ['blunked', 'bluhngkt', '-ed after voiceless → T'],
      ['clobbed', 'klobd', '-ed after voiced → D'],
      ['brummed', 'bruhmd', '-ed after voiced → D'],
      ['spugged', 'spuhgd', '-ed after voiced → D'],
      ['blatted', 'blatid', '-ed after t/d → ID'],
      // final S voicing
      ['blungs', 'bluhngz', 'final S voiced after voiced'],
      ['flacks', 'flaks', 'final S voiceless after voiceless'],
      // NK → NG K
      ['blonk', 'blongk', 'NK → NG K'],
      // SC before front vowel
      ['scerg', 'serg', 'SC before E'],
      ['scib', 'sib', 'SC before I'],
      // -ture
      ['blicture', 'blikcher', '-ture → CH ER'],
      // consonant+le
      ['spiffle', 'spifal', 'consonant+le ending'],
      ['snortle', 'snortal', 'consonant+le ending'],
      // OUGH
      ['snough', 'snuhf', 'OUGH tough pattern'],
      ['blought', 'blawt', 'OUGH thought pattern'],
      // OW
      ['browk', 'brohk', 'OW → OW (show-like)'],
      ['brownd', 'bround', 'OW → AW before N (town-like)'],
      // OO
      ['glook', 'gluk', 'OO → UH before K (book)'],
      ['splood', 'splud', 'OO+D (blood)'],
      // WH
      ['whoob', 'hoo-ob', 'WH before O → HH'],
      ['whub', 'wuhb', 'WH → W'],
      ['whag', 'wag', 'WH → W'],
      // misc
      ['clawb', 'klawb', 'AU/AW → AO'],
      ['cerg', 'serg', 'soft C before front vowels'],
      ['gerce', 'jers', 'soft G before front vowel'],
      ['gerb', 'jerb', 'soft G before front vowel'],
      // EA variations
      ['fleam', 'fleem', 'EA → IY'],
      ['spead', 'sped', 'EAD → EH'],
      ['blealth', 'blelth', 'EALTH → EH'],
      // WAR/WOR
      ['warb', 'worb', 'WAR → AO R'],
      ['swark', 'swork', 'WAR → AO R'],
      ['worb', 'werb', 'WOR → ER'],
      ['worg', 'werg', 'WOR → ER'],
      // ALM/ALK
      ['bralm', 'brom', 'ALM silent L'],
      ['spalm', 'spom', 'ALM silent L'],
      ['spalk', 'spawk', 'ALK silent L'],
      // suffixes
      ['clunkage', 'kluhngkij', '-AGE suffix'],
      ['blondence', 'blondans', '-ENCE suffix'],
      ['sprunkance', 'spruhngkans', '-ANCE suffix'],
      ['bunkism', 'buhngkizam', '-ISM suffix'],
      ['blartial', 'blarshal', 'TIAL → SH'],
      ['spruncial', 'spruhnshal', 'CIAL → SH'],
      // EIGN/IGN
      ['spleign', 'splayn', 'EIGN silent G'],
      ['bleign', 'blayn', 'EIGN silent G'],
      ['blign', 'blain', 'word-final IGN silent G'],
      // OLD/OLT/OLK
      ['skold', 'skohld', 'OLD → OW L D'],
      ['prolt', 'prohlt', 'OLT → OW L T'],
      ['splolk', 'splohk', 'OLK → OW K (silent L)'],
      // word-final O
      ['spungo', 'spuhnggoh', 'word-final O → OW'],
      ['blimbo', 'blimboh', 'word-final O → OW'],
      // misc
      ['xylem', 'zailam', 'word-initial X → Z'],
      ['gladness', 'gladnas', '-NESS suffix'],
      ['oddment', 'odmant', '-MENT suffix'],
      ['artless', 'artlas', '-LESS suffix'],
    ])('G2P: %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should not silence GN mid-word', () => {
      const result = g2p('oppugnant');
      expect(result).toContain('g');
    });
  });

  describe('stemming fallback', () => {
    it.each([
      ['xyzzy', 'zizee'],
      ['una', 'oona'],
    ])('translates "%s" → "%s" via G2P fallback', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('British spelling handling', () => {
    it.each([
      ['colour', 'kuhler'],
      ['organise', 'organaiz'],
    ])('translates British %s → %s', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('unknown word translation', () => {
    it.each([
      ['xyzzy', 'zizee'],
      ['blargification', 'blarjifikayshan'],
    ])('translates "%s" → "%s"', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('compound word handling', () => {
    it.each([
      ['xyzzy', 'zizee'],
      ['abacus', 'abakas'],
    ])('translates "%s" → "%s"', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('acronym translation', () => {
    it.each([
      ['nfl', 'enefel'],
      ['npm', 'enpee-em'],
    ])('spells out %s → %s', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });

    it('should not spell out regular words as acronyms', () => {
      expect(translateSync('blorg')).not.toContain('beeeloh');
    });
  });

  describe('IPA output format', () => {
    it.each([
      ['blorg', '\u2060\u02C8\u2060bl\u0254\u0279\u0261', 'unknown words'],
      [
        'nfl',
        '\u2060\u02C8\u2060\u025B\u2060\u02CC\u2060n\u025B\u2060\u02C8\u2060f\u025Bl',
        'acronyms',
      ],
      [
        'npm',
        '\u2060\u02C8\u2060\u025Bn\u2060\u02C8\u2060pi\u2060\u02C8\u2060\u025Bm',
        'spelled-out words',
      ],
      ['quickly', '\u2060\u02C8\u2060kw\u026Akli', 'known words'],
    ])('outputs IPA for %s (%s)', (word, expected) => {
      expect(translateSync(word, { format: 'ipa' })).toBe(expected);
    });
  });
});
