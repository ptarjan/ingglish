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
      ['shug', 'shuhg', 'SH'],
      ['chub', 'chuhb', 'CH'],
      ['thub', 'thuhb', 'TH'],
      ['phig', 'fig', 'PH → F'],
      ['quib', 'kwib', 'QU → KW'],
    ])('handles consonant digraph %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['taig', 'tayg', 'AI → EY'],
      ['soat', 'soht', 'OA → OW'],
      ['spreed', 'spreed', 'EE → IY'],
      ['fleeble', 'fleebal', 'EE in context'],
    ])('handles vowel digraph %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['birg', 'berg', 'IR → ER'],
      ['slurk', 'slerk', 'UR → ER'],
    ])('handles R-controlled vowel %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['snight', 'snait', 'IGH → AY'],
      ['skight', 'skait', 'IGH → AY'],
      ['splotch', 'sploch', 'TCH → CH'],
      ['blodge', 'bloj', 'DGE → JH'],
      ['spludge', 'spluhj', 'DGE → JH'],
    ])('handles trigraph %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['deveigh', 'divay', 'deveigh'],
      ['spleigh', 'splay', 'spleigh'],
    ])('handles EIGH as long A %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle AUGH as AO', () => {
      expect(g2p('splaugh')).toBe('splaw');
    });

    it.each([
      ['blossion', 'bloshan', 'blossion'],
      ['cession', 'seshan', 'cession'],
    ])('handles SSION as SH %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['blation', 'blayshan', 'TION → SH'],
      ['gresion', 'grayzhan', 'SION → ZH'],
    ])('handles TION/SION %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['wrib', 'rib', 'WR → R'],
      ['knib', 'nib', 'KN → N'],
      ['gnab', 'nab', 'GN → N (word-initial)'],
      ['psar', 'sar', 'PS → S'],
      ['pnib', 'nib', 'PN → N'],
    ])('handles silent consonant pair %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should not silence GN mid-word', () => {
      const result = g2p('oppugnant');
      expect(result).toContain('g');
    });

    it.each([
      ['brike', 'braik', 'I_E → AY'],
      ['blone', 'blohn', 'O_E → OW'],
      ['frube', 'froob', 'U_E → UW'],
      ['sprene', 'spreen', 'E_E → IY'],
    ])('handles magic-e %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['bluzz', 'bluhz', 'ZZ → Z'],
      ['smutt', 'smuht', 'TT → T'],
    ])('collapses doubled consonant %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['glyb', 'glib', 'glyb'],
      ['spyn', 'spin', 'spyn'],
      ['snylk', 'snilk', 'snylk'],
    ])('treats Y as vowel mid-word %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should treat word-final Y as /i/', () => {
      expect(g2p('flubby')).toBe('fluhbee');
    });

    it('should treat -FY suffix as /faɪ/', () => {
      expect(g2p('bunkify')).toBe('buhngkifai');
    });

    it('should treat Y as consonant before vowels', () => {
      expect(g2p('yub')).toBe('yuhb');
    });

    it('should handle -ed suffix after voiceless → T', () => {
      expect(g2p('blunked')).toBe('bluhngkt');
    });

    it.each([
      ['clobbed', 'klobd', 'clobbed'],
      ['brummed', 'bruhmd', 'brummed'],
      ['spugged', 'spuhgd', 'spugged'],
    ])('handles -ed suffix after voiced → D %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle -ed suffix after t/d → ID', () => {
      expect(g2p('blatted')).toBe('blatid');
    });

    it('should voice final S after voiced sounds', () => {
      expect(g2p('blungs')).toBe('bluhngz');
    });

    it('should keep final S after voiceless sounds', () => {
      expect(g2p('flacks')).toBe('flaks');
    });

    it('should produce NG K for NK', () => {
      expect(g2p('blonk')).toBe('blongk');
    });

    it.each([
      ['scerg', 'serg', 'SC before E'],
      ['scib', 'sib', 'SC before I'],
    ])('handles SC before front vowel %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle -ture as CH ER', () => {
      expect(g2p('blicture')).toBe('blikcher');
    });

    it.each([
      ['spiffle', 'spifal', 'spiffle'],
      ['snortle', 'snortal', 'snortle'],
    ])('handles consonant+le ending %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['snough', 'snuhf', 'tough pattern'],
      ['blought', 'blawt', 'thought pattern'],
    ])('handles OUGH variation %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle OW as OW (show-like)', () => {
      expect(g2p('browk')).toBe('brohk');
    });

    it('should handle OW as AW before N (town-like)', () => {
      expect(g2p('brownd')).toBe('bround');
    });

    it('should handle OO as UH before K (book pattern)', () => {
      expect(g2p('glook')).toBe('gluk');
    });

    it('should handle OO+D (blood pattern)', () => {
      expect(g2p('splood')).toBe('splud');
    });

    it.each([
      ['whoob', 'hoo-ob', 'WH before O → HH'],
      ['whub', 'wuhb', 'WH → W'],
      ['whag', 'wag', 'WH → W'],
    ])('handles WH digraph %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle AU/AW as AO', () => {
      expect(g2p('clawb')).toBe('klawb');
    });

    it('should handle soft C before front vowels', () => {
      expect(g2p('cerg')).toBe('serg');
    });

    it.each([
      ['gerce', 'jers', 'gerce'],
      ['gerb', 'jerb', 'gerb'],
    ])('handles soft G before front vowel %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['fleam', 'fleem', 'EA → IY'],
      ['spead', 'sped', 'EAD → EH'],
      ['blealth', 'blelth', 'EALTH → EH'],
    ])('handles EA variation %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['warb', 'worb', 'warb'],
      ['swark', 'swork', 'swark'],
    ])('handles WAR as AO R %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['worb', 'werb', 'worb'],
      ['worg', 'werg', 'worg'],
    ])('handles WOR as ER %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['bralm', 'brom', 'bralm'],
      ['spalm', 'spom', 'spalm'],
    ])('handles ALM with silent L %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle ALK with silent L', () => {
      expect(g2p('spalk')).toBe('spawk');
    });

    it('should handle -AGE suffix', () => {
      expect(g2p('clunkage')).toBe('kluhngkij');
    });

    it.each([
      ['blondence', 'blondans', '-ENCE'],
      ['sprunkance', 'spruhngkans', '-ANCE'],
    ])('handles -ENCE/-ANCE suffix %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle -ISM suffix', () => {
      expect(g2p('bunkism')).toBe('buhngkizam');
    });

    it.each([
      ['blartial', 'blarshal', 'TIAL'],
      ['spruncial', 'spruhnshal', 'CIAL'],
    ])('handles TIAL/CIAL as SH %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['spleign', 'splayn', 'spleign'],
      ['bleign', 'blayn', 'bleign'],
    ])('handles EIGN with silent G %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle word-final IGN with silent G', () => {
      expect(g2p('blign')).toBe('blain');
    });

    it.each([
      ['skold', 'skohld', 'OLD → OW L D'],
      ['prolt', 'prohlt', 'OLT → OW L T'],
      ['splolk', 'splohk', 'OLK → OW K (silent L)'],
    ])('handles OLD/OLT/OLK pattern %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it.each([
      ['spungo', 'spuhnggoh', 'spungo'],
      ['blimbo', 'blimboh', 'blimbo'],
    ])('handles word-final O as OW %s → %s (%s)', (word, expected) => {
      expect(g2p(word)).toBe(expected);
    });

    it('should handle word-initial X as Z', () => {
      expect(g2p('xylem')).toBe('zailam');
    });

    it('should handle -NESS suffix', () => {
      expect(g2p('gladness')).toBe('gladnas');
    });

    it('should handle -MENT suffix', () => {
      expect(g2p('oddment')).toBe('odmant');
    });

    it('should handle -LESS suffix', () => {
      expect(g2p('artless')).toBe('artlas');
    });
  });

  describe('stemming fallback', () => {
    it.each(['xyzzy', 'una'])('translates "%s" via G2P fallback', (word) => {
      const result = translateSync(word);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('British spelling handling', () => {
    it.each([
      ['colour', 'color'],
      ['organise', 'organize'],
    ])('translates British %s same as American %s', (british, american) => {
      expect(translateSync(british)).toBe(translateSync(american));
    });
  });

  describe('unknown word translation', () => {
    it.each(['xyzzy', 'blargification'])('produces output for "%s"', (word) => {
      const result = translateSync(word);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('compound word handling', () => {
    it('should translate non-compound unknown words via G2P', () => {
      // 'xyzzy' can't be split into known compounds
      const result = translateSync('xyzzy');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should translate dictionary words directly', () => {
      // 'abacus' is in the dictionary, uses direct lookup
      const result = translateSync('abacus');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
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
      ['blorg', /[bɡʃʒθðŋɹɑæʌɔɛɪʊəaeoiuˈˌ]/, 'unknown words'],
      ['nfl', /[ɛnfl]/, 'acronyms'],
      ['npm', /[ɛnpiːm]/, 'spelled-out words'],
      ['quickly', /[ɪəʌɛæɑɔʊuiŋʃʒθðɹ]/, 'known words'],
    ])('outputs IPA for %s (%s)', (word, pattern) => {
      const result = translateSync(word, { format: 'ipa' });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(pattern);
    });
  });
});
