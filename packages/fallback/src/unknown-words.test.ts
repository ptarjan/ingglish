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
    it('should handle consonant digraphs (SH, CH, TH, PH, QU)', () => {
      expect(g2p('shug')).toBe('shuhg');
      expect(g2p('chub')).toBe('chuhb');
      expect(g2p('thub')).toBe('thuhb');
      expect(g2p('phig')).toBe('fig'); // PH → F
      expect(g2p('quib')).toBe('kwib'); // QU → KW
    });

    it('should handle vowel digraphs', () => {
      expect(g2p('taig')).toBe('tayg'); // AI → EY
      expect(g2p('soat')).toBe('soht'); // OA → OW
      expect(g2p('spreed')).toBe('spreed'); // EE → IY
      expect(g2p('fleeble')).toBe('fleebal'); // EE in context
    });

    it('should handle R-controlled vowels', () => {
      expect(g2p('birg')).toBe('berg'); // IR → ER
      expect(g2p('slurk')).toBe('slerk'); // UR → ER
    });

    it('should handle trigraphs (IGH, TCH, DGE)', () => {
      expect(g2p('snight')).toBe('snait'); // IGH → AY
      expect(g2p('skight')).toBe('skait');
      expect(g2p('splotch')).toBe('sploch'); // TCH → CH
      expect(g2p('blodge')).toBe('bloj'); // DGE → JH
      expect(g2p('spludge')).toBe('spluhj');
    });

    it('should handle EIGH as long A', () => {
      expect(g2p('deveigh')).toBe('divay');
      expect(g2p('spleigh')).toBe('splay');
    });

    it('should handle AUGH as AO', () => {
      expect(g2p('splaugh')).toBe('splaw');
    });

    it('should handle SSION as SH', () => {
      expect(g2p('blossion')).toBe('bloshan');
      expect(g2p('cession')).toBe('seshan');
    });

    it('should handle TION/SION', () => {
      expect(g2p('blation')).toBe('blayshan'); // TION → SH
      expect(g2p('gresion')).toBe('grayzhan'); // SION → ZH
    });

    it('should handle silent consonant pairs', () => {
      expect(g2p('wrib')).toBe('rib'); // WR → R
      expect(g2p('knib')).toBe('nib'); // KN → N
      expect(g2p('gnab')).toBe('nab'); // GN → N (word-initial)
      expect(g2p('psar')).toBe('sar'); // PS → S
      expect(g2p('pnib')).toBe('nib'); // PN → N
    });

    it('should not silence GN mid-word', () => {
      const result = g2p('oppugnant');
      expect(result).toContain('g');
    });

    it('should handle magic-e (long vowels)', () => {
      expect(g2p('brike')).toBe('braik'); // I_E → AY
      expect(g2p('blone')).toBe('blohn'); // O_E → OW
      expect(g2p('frube')).toBe('froob'); // U_E → UW
      expect(g2p('sprene')).toBe('spreen'); // E_E → IY
    });

    it('should collapse doubled consonants', () => {
      expect(g2p('bluzz')).toBe('bluhz'); // ZZ → Z
      expect(g2p('smutt')).toBe('smuht'); // TT → T
    });

    it('should treat Y as vowel mid-word', () => {
      expect(g2p('glyb')).toBe('glib');
      expect(g2p('spyn')).toBe('spin');
      expect(g2p('snylk')).toBe('snilk');
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

    it('should handle -ed suffix after voiced → D', () => {
      expect(g2p('clobbed')).toBe('klobd');
      expect(g2p('brummed')).toBe('bruhmd');
      expect(g2p('spugged')).toBe('spuhgd');
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

    it('should handle SC before e/i as single S', () => {
      expect(g2p('scerg')).toBe('serg');
      expect(g2p('scib')).toBe('sib');
    });

    it('should handle -ture as CH ER', () => {
      expect(g2p('blicture')).toBe('blikcher');
    });

    it('should handle consonant+le endings', () => {
      expect(g2p('spiffle')).toBe('spifal');
      expect(g2p('snortle')).toBe('snortal');
    });

    it('should handle OUGH variations', () => {
      expect(g2p('snough')).toBe('snuhf'); // tough pattern
      expect(g2p('blought')).toBe('blawt'); // thought pattern
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

    it('should handle WH digraph', () => {
      // WHO-like: WH before O → HH
      expect(g2p('whoob')).toBe('hoo-ob');
      // Other: WH → W
      expect(g2p('whub')).toBe('wuhb');
      expect(g2p('whag')).toBe('wag');
    });

    it('should handle AU/AW as AO', () => {
      expect(g2p('clawb')).toBe('klawb');
    });

    it('should handle soft C before front vowels', () => {
      expect(g2p('cerg')).toBe('serg');
    });

    it('should handle soft G before front vowels', () => {
      expect(g2p('gerce')).toBe('jers');
      expect(g2p('gerb')).toBe('jerb');
    });

    it('should handle EA variations', () => {
      expect(g2p('fleam')).toBe('fleem'); // EA → IY
      expect(g2p('spead')).toBe('sped'); // EAD → EH
      expect(g2p('blealth')).toBe('blelth'); // EALTH → EH
    });

    it('should handle WAR as AO R', () => {
      expect(g2p('warb')).toBe('worb');
      expect(g2p('swark')).toBe('swork');
    });

    it('should handle WOR as ER', () => {
      expect(g2p('worb')).toBe('werb');
      expect(g2p('worg')).toBe('werg');
    });

    it('should handle ALM with silent L', () => {
      expect(g2p('bralm')).toBe('brom');
      expect(g2p('spalm')).toBe('spom');
    });

    it('should handle ALK with silent L', () => {
      expect(g2p('spalk')).toBe('spawk');
    });

    it('should handle -AGE suffix', () => {
      expect(g2p('clunkage')).toBe('kluhngkij');
    });

    it('should handle -ENCE/-ANCE suffixes', () => {
      expect(g2p('blondence')).toBe('blondans');
      expect(g2p('sprunkance')).toBe('spruhngkans');
    });

    it('should handle -ISM suffix', () => {
      expect(g2p('bunkism')).toBe('buhngkizam');
    });

    it('should handle TIAL/CIAL as SH', () => {
      expect(g2p('blartial')).toBe('blarshal');
      expect(g2p('spruncial')).toBe('spruhnshal');
    });

    it('should handle EIGN with silent G', () => {
      expect(g2p('spleign')).toBe('splayn');
      expect(g2p('bleign')).toBe('blayn');
    });

    it('should handle word-final IGN with silent G', () => {
      expect(g2p('blign')).toBe('blain');
    });

    it('should handle OLD/OLT/OLK patterns', () => {
      expect(g2p('skold')).toBe('skohld'); // OLD → OW L D
      expect(g2p('prolt')).toBe('prohlt'); // OLT → OW L T
      expect(g2p('splolk')).toBe('splohk'); // OLK → OW K (silent L)
    });

    it('should handle word-final O as OW', () => {
      expect(g2p('spungo')).toBe('spuhnggoh');
      expect(g2p('blimbo')).toBe('blimboh');
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
    it('should translate words without recognizable stems via G2P', () => {
      // 'xyzzy' has no recognizable stem, falls through to G2P
      const result = translateSync('xyzzy');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should translate short words without prefix stripping', () => {
      // 'una' is too short for prefix removal, falls through to G2P
      const result = translateSync('una');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('British spelling handling', () => {
    it('should translate British -our as American -or', () => {
      // 'colour' → American 'color' → dictionary lookup
      const british = translateSync('colour');
      const american = translateSync('color');
      expect(british).toBe(american);
    });

    it('should translate British -ise as American -ize', () => {
      // 'organise' → American 'organize' → dictionary lookup
      const british = translateSync('organise');
      const american = translateSync('organize');
      expect(british).toBe(american);
    });
  });

  describe('unknown word translation', () => {
    it('should always produce output for unknown words', () => {
      const result = translateSync('xyzzy');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should translate words with recognizable suffixes', () => {
      const result = translateSync('blargification');
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
    it('should spell out nfl as enefel', () => {
      expect(translateSync('nfl')).toBe('enefel');
    });

    it('should spell out npm correctly', () => {
      expect(translateSync('npm')).toBe('enpee-em');
    });

    it('should not spell out regular words as acronyms', () => {
      const result = translateSync('blorg');
      expect(result).not.toContain('beeeloh');
    });
  });

  describe('IPA output format', () => {
    it('should output IPA for unknown words', () => {
      const result = translateSync('blorg', { format: 'ipa' });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/[bɡʃʒθðŋɹɑæʌɔɛɪʊəaeoiuˈˌ]/);
    });

    it('should output IPA for acronyms', () => {
      const result = translateSync('nfl', { format: 'ipa' });
      expect(result).toBeDefined();
      // NFL spelled out should contain IPA characters
      expect(result).toMatch(/[ɛnfl]/);
    });

    it('should output IPA for spelled-out words', () => {
      const result = translateSync('npm', { format: 'ipa' });
      expect(result).toBeDefined();
      expect(result).toMatch(/[ɛnpiːm]/);
    });

    it('should output IPA for known words', () => {
      const result = translateSync('quickly', { format: 'ipa' });
      expect(result).toBeDefined();
      expect(result).toMatch(/[ɪəʌɛæɑɔʊuiŋʃʒθðɹ]/);
    });
  });
});
