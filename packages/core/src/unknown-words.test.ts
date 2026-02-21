import { describe, it, expect, beforeAll } from 'vitest';
import {
  translateWithStemming,
  translateUnknown,
  translateAsAcronym,
  translateAsCompound,
  translateAsBritish,
  translateWithPhonemize,
  preloadPhonemize,
} from '@ingglish/fallback';
import { translateWithRules, wordToArpabet } from '@ingglish/g2p';
import { lookupPronunciation, getDictionary, CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { ARPABET_VOWELS, ARPABET_CONSONANTS, STRESS_MARKER_REGEX } from '@ingglish/phonemes';
import { translateWord } from './translate/forward';
import { UNKNOWN_TECH_WORDS } from './test-setup';

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
      // "think" in CMU has N K which should be normalized to NG K
      const phonemes = lookupPronunciation('think');
      expect(phonemes).toContain('NG');
      expect(phonemes).not.toContain('N');
    });

    it('should not change N in other positions', () => {
      // "run" has N at end, should stay N
      const phonemes = lookupPronunciation('run');
      expect(phonemes).toContain('N');
    });
  });

  describe('wordToArpabet', () => {
    it('should convert simple words to phonemes', () => {
      const phonemes = wordToArpabet('cat');
      expect(phonemes.length).toBeGreaterThan(0);
    });

    it('should handle consonant digraphs', () => {
      expect(wordToArpabet('ship')).toContain('SH');
      expect(wordToArpabet('chat')).toContain('CH');
      expect(wordToArpabet('think')).toContain('TH');
      expect(wordToArpabet('phone')).toContain('F'); // ph → F
      expect(wordToArpabet('quick')).toContain('K'); // qu → K W
      expect(wordToArpabet('quick')).toContain('W');
    });

    it('should handle vowel digraphs', () => {
      expect(wordToArpabet('see')).toContain('IY1'); // ee
      expect(wordToArpabet('moon')).toContain('UW1'); // oo
      expect(wordToArpabet('rain')).toContain('EY1'); // ai
      expect(wordToArpabet('coin')).toContain('OY1'); // oi
      expect(wordToArpabet('out')).toContain('AW1'); // ou
      expect(wordToArpabet('boat')).toContain('OW1'); // oa
      expect(wordToArpabet('blue')).toContain('UW1'); // ue
      expect(wordToArpabet('vein')).toContain('AY1'); // ei (NRL default — EY would be correct but breaks German names)
    });

    it('should handle R-controlled vowels', () => {
      expect(wordToArpabet('bird')).toContain('ER1'); // ir
      expect(wordToArpabet('burn')).toContain('ER1'); // ur
      expect(wordToArpabet('fern')).toContain('ER1'); // er
    });

    it('should handle trigraphs', () => {
      expect(wordToArpabet('night')).toContain('AY1'); // igh → long I
      expect(wordToArpabet('match')).toContain('CH'); // tch → CH
      expect(wordToArpabet('match')).not.toContain('T'); // t is silent in tch
      expect(wordToArpabet('badge')).toEqual(['B', 'AE1', 'JH']); // dge → JH
    });

    it('should handle eigh as long A', () => {
      expect(wordToArpabet('weigh')).toContain('EY1'); // eigh → long A
      expect(wordToArpabet('neigh')).toContain('EY1');
      expect(wordToArpabet('sleigh')).toContain('EY1');
      // gh should be silent after eigh
      expect(wordToArpabet('weigh')).not.toContain('G');
    });

    it('should handle augh as AA or AO', () => {
      // CMU: caught = K AA1 T, taught = T AO1 T (cot-caught merger)
      const caught = wordToArpabet('caught');
      expect(caught.some((p) => p === 'AO1' || p === 'AA1')).toBe(true);
      expect(wordToArpabet('taught')).toContain('AO1');
      expect(wordToArpabet('faugh')).toContain('AO1');
      // gh should be silent after augh
      expect(wordToArpabet('faugh')).not.toContain('G');
    });

    it('should handle ssion as SH-un', () => {
      expect(wordToArpabet('mission')).toContain('SH');
      expect(wordToArpabet('passion')).toContain('SH');
      // Should not contain ZH (that's for -sion, not -ssion)
      expect(wordToArpabet('mission')).not.toContain('ZH');
    });

    it('should handle tion/sion', () => {
      expect(wordToArpabet('tion')).toEqual(['SH', 'AH0', 'N']);
      // NRL's #[SION] rule requires a preceding vowel; standalone sion doesn't match
      // Test sion in context instead (vision is tested in translateWithRules)
      expect(wordToArpabet('vision')).toContain('ZH');
    });

    it('should handle silent consonant pairs', () => {
      expect(wordToArpabet('write')).not.toContain('W'); // wr → R
      expect(wordToArpabet('knot')).not.toContain('K'); // kn → N
      expect(wordToArpabet('gnat')).not.toContain('G'); // gn → N (word-initial)
      expect(wordToArpabet('rhyme')).not.toContain('HH'); // rh → R
    });

    it('should only silence gn at word start, not mid-word', () => {
      // Word-initial: g is silent (gnome, gnat)
      expect(wordToArpabet('gnat')).not.toContain('G');
      // Mid-word: g is pronounced (signal, oppugnant)
      expect(wordToArpabet('signal')).toContain('G');
      expect(wordToArpabet('oppugnant')).toContain('G');
    });

    it('should handle initial silent p (ps, pn)', () => {
      expect(wordToArpabet('psalm')).not.toContain('P'); // ps → S
      expect(wordToArpabet('psychology')).not.toContain('P');
      expect(wordToArpabet('pneumonia')).not.toContain('P'); // pn → N
    });

    it('should handle final silent consonants (mb, bt, mn)', () => {
      expect(wordToArpabet('lamb')).not.toContain('B'); // mb → M
      expect(wordToArpabet('climb')).not.toContain('B');
      expect(wordToArpabet('thumb')).not.toContain('B');
      expect(wordToArpabet('debt')).not.toContain('B'); // bt → T
      expect(wordToArpabet('hymn')).not.toContain('N'); // mn → M
    });

    it('should produce NG K for nk', () => {
      expect(wordToArpabet('think')).toContain('NG');
      expect(wordToArpabet('bank')).toContain('NG');
      expect(wordToArpabet('drink')).toContain('NG');
    });

    it('should handle sc before e/i as single S', () => {
      const scene = wordToArpabet('scene');
      // Should have exactly one S, not two
      expect(scene.filter((p) => p === 'S').length).toBe(1);
    });

    it('should handle ew as UW', () => {
      expect(wordToArpabet('new')).toContain('UW1');
      expect(wordToArpabet('grew')).toContain('UW1');
    });

    it('should handle -ture as CH ER', () => {
      expect(wordToArpabet('nature')).toContain('CH');
      // ER in unstressed 2nd syllable gets marked unstressed
      expect(wordToArpabet('nature')).toContain('ER0');
      expect(wordToArpabet('picture')).toContain('CH');
    });

    it('should handle consonant+le endings', () => {
      expect(wordToArpabet('apple')).toContain('AH0'); // schwa before L
      expect(wordToArpabet('table')).toContain('AH0');
      expect(wordToArpabet('little')).toContain('AH0');
      expect(wordToArpabet('bottle')).toContain('AH0');
    });

    it('should collapse doubled consonants', () => {
      expect(wordToArpabet('buzz')).toEqual(['B', 'AH1', 'Z']); // zz → Z
      expect(wordToArpabet('bell')).toEqual(['B', 'EH1', 'L']); // ll → L
      expect(wordToArpabet('putt')).toEqual(['P', 'AH1', 'T']); // tt → T
    });

    it('should handle standalone q', () => {
      // Custom: word-final I → IY (qi is /tʃiː/)
      expect(wordToArpabet('qi')).toEqual(['K', 'IY1']);
      expect(wordToArpabet('qat')).toEqual(['K', 'AE1', 'T']);
    });

    it('should treat y as short I when used as vowel mid-word', () => {
      expect(wordToArpabet('gym')).toContain('IH1');
      expect(wordToArpabet('myth')).toContain('IH1');
    });

    it('should treat word-final y as unstressed /i/', () => {
      expect(wordToArpabet('sulky')).toContain('IY0');
      expect(wordToArpabet('ugly')).toContain('IY0');
    });

    it('should treat word-final -fy as /faɪ/', () => {
      // -ify suffix → stressFromEnd: 3, AY gets secondary stress (full vowel)
      expect(wordToArpabet('uglify')).toContain('AY2');
      expect(wordToArpabet('glorify')).toContain('AY2');
    });

    it('should treat y as consonant before vowels', () => {
      expect(wordToArpabet('yell')).toContain('Y');
    });

    it('should handle ar as AA R (car, star)', () => {
      expect(wordToArpabet('car')).toEqual(['K', 'AA1', 'R']);
      expect(wordToArpabet('star')).toEqual(['S', 'T', 'AA1', 'R']);
      expect(wordToArpabet('bark')).toEqual(['B', 'AA1', 'R', 'K']);
    });

    it('should handle or as AO R (for, born)', () => {
      expect(wordToArpabet('fork')).toEqual(['F', 'AO1', 'R', 'K']);
      expect(wordToArpabet('born')).toEqual(['B', 'AO1', 'R', 'N']);
      expect(wordToArpabet('sport')).toEqual(['S', 'P', 'AO1', 'R', 'T']);
    });

    it('should handle word-final o as OW (go, no)', () => {
      expect(wordToArpabet('go')).toContain('OW1');
      expect(wordToArpabet('no')).toContain('OW1');
      // Mid-word o: dog = D AO1 G (CMU)
      const dog = wordToArpabet('dog');
      expect(dog.some((p) => p === 'AA1' || p === 'AO1')).toBe(true);
    });

    it('should handle -ed suffix after voiceless consonants as T', () => {
      const walked = wordToArpabet('walked');
      expect(walked[walked.length - 1]).toBe('T');
      expect(walked).not.toContain('EH1'); // no full vowel for 'e'
    });

    it('should handle -ed suffix after voiced consonants as D', () => {
      const turned = wordToArpabet('turned');
      expect(turned[turned.length - 1]).toBe('D');
      expect(turned).not.toContain('EH1');
    });

    it('should handle -ed suffix after t/d as IH D', () => {
      const wanted = wordToArpabet('wanted');
      // NRL: #:[TED] =/T IH D/ — IH in unstressed syllable marked as IH0
      expect(wanted[wanted.length - 2]).toBe('IH0');
      expect(wanted[wanted.length - 1]).toBe('D');
    });

    it('should not strip -ed from short words (bed, shed)', () => {
      // "bed" should keep its 'e' vowel
      expect(wordToArpabet('bed')).toEqual(['B', 'EH1', 'D']);
    });

    it('should voice final S to Z after voiced sounds', () => {
      const dogs = wordToArpabet('dogs');
      expect(dogs[dogs.length - 1]).toBe('Z');

      const runs = wordToArpabet('runs');
      expect(runs[runs.length - 1]).toBe('Z');
    });

    it('should keep final S after voiceless sounds', () => {
      const cats = wordToArpabet('cats');
      expect(cats[cats.length - 1]).toBe('S');
    });

    it('should handle every letter a-z', () => {
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(97 + i);
        const phonemes = wordToArpabet(letter);
        // NRL: H[H]=/ / means standalone 'h' produces empty (silent)
        if (letter === 'h') {
          expect(phonemes.length).toBe(0);
        } else {
          expect(phonemes.length).toBeGreaterThan(0);
        }
      }
    });

    it('should use long vowels for magic-e words', () => {
      expect(wordToArpabet('bake')).toContain('EY1'); // long A
      expect(wordToArpabet('bike')).toContain('AY1'); // long I
      expect(wordToArpabet('bone')).toContain('OW1'); // long O
      expect(wordToArpabet('cute')).toContain('UW1'); // long U
      expect(wordToArpabet('theme')).toContain('IY1'); // long E (magic-e)
    });

    it('should differentiate short vs long vowels (magic-e)', () => {
      // Without magic-e: short vowel
      expect(wordToArpabet('kit')).toContain('IH1');
      expect(wordToArpabet('strip')).toContain('IH1');
      // With magic-e: long vowel
      expect(wordToArpabet('kite')).toContain('AY1');
      expect(wordToArpabet('stripe')).toContain('AY1');
    });

    it('should handle place with NRL rules', () => {
      // NRL: [A]^%=/EY/ — A before consonant + suffix marker gives long A
      const placePhonemes = wordToArpabet('place');
      expect(placePhonemes).toEqual(['P', 'L', 'EY1', 'S']);
    });

    it('should handle OUGH variations', () => {
      expect(wordToArpabet('through')).toEqual(['TH', 'R', 'UW1']); // ough → UW
      expect(wordToArpabet('tough')).toEqual(['T', 'AH1', 'F']); // ough → AH F
      expect(wordToArpabet('rough')).toEqual(['R', 'AH1', 'F']); // ough → AH F
      expect(wordToArpabet('cough')).toEqual(['K', 'AA1', 'F']); // ough → AA F
      expect(wordToArpabet('bough')).toEqual(['B', 'AW1']); // ough → AW
      expect(wordToArpabet('dough')).toEqual(['D', 'OW1']); // ough → OW
      expect(wordToArpabet('thought')).toEqual(['TH', 'AO1', 'T']); // ought → AO T
      expect(wordToArpabet('sought')).toEqual(['S', 'AO1', 'T']); // ought → AO T
    });

    it('should handle OW as AW in town/down/gown/cow contexts', () => {
      expect(wordToArpabet('town')).toContain('AW1'); // OWN after T → AW
      expect(wordToArpabet('down')).toContain('AW1'); // OWN after D → AW
      expect(wordToArpabet('gown')).toContain('AW1'); // OWN after G → AW
      expect(wordToArpabet('cow')).toContain('AW1'); // OW after C → AW
    });

    it('should handle OW as OW in show/flow/snow', () => {
      expect(wordToArpabet('show')).toContain('OW1');
      expect(wordToArpabet('flow')).toContain('OW1');
      expect(wordToArpabet('snow')).toContain('OW1');
      expect(wordToArpabet('own')).toContain('OW1');
    });

    it('should handle OO variations (book vs food vs blood)', () => {
      // OOK → UH
      expect(wordToArpabet('book')).toContain('UH1');
      expect(wordToArpabet('look')).toContain('UH1');
      // OO default → UW
      expect(wordToArpabet('food')).toContain('UW1');
      expect(wordToArpabet('moon')).toContain('UW1');
      // BLOOD/FLOOD → AH (exceptions)
      expect(wordToArpabet('blood')).toContain('AH1');
      expect(wordToArpabet('flood')).toContain('AH1');
    });

    it('should handle WH digraph (who vs what)', () => {
      // WHO/WHOLE: WH → HH (no W sound)
      expect(wordToArpabet('who')).toContain('HH');
      expect(wordToArpabet('who')).not.toContain('W');
      expect(wordToArpabet('whole')).toContain('HH');
      // WHAT/WHERE: WH → W (in most dialects)
      expect(wordToArpabet('what')).toContain('W');
      expect(wordToArpabet('where')).toContain('W');
    });

    it('should handle AU/AW as AO', () => {
      expect(wordToArpabet('sauce')).toContain('AO1');
      expect(wordToArpabet('dawn')).toContain('AO1');
      expect(wordToArpabet('draw')).toContain('AO1');
    });

    it('should handle WOULD/COULD/SHOULD as UH D', () => {
      expect(wordToArpabet('would')).toEqual(['W', 'UH1', 'D']);
      expect(wordToArpabet('could')).toEqual(['K', 'UH1', 'D']);
      expect(wordToArpabet('should')).toEqual(['SH', 'UH1', 'D']);
    });

    it('should handle soft C before front vowels (e, i, y)', () => {
      // C → S before e, i, y
      expect(wordToArpabet('cell')[0]).toBe('S');
      expect(wordToArpabet('cent')[0]).toBe('S');
      expect(wordToArpabet('cycle')[0]).toBe('S');
      // C → K before a, o, u
      expect(wordToArpabet('cat')[0]).toBe('K');
      expect(wordToArpabet('cup')[0]).toBe('K');
    });

    it('should handle soft G before front vowels', () => {
      // G → JH before e, i (usually)
      expect(wordToArpabet('gem')[0]).toBe('JH');
      expect(wordToArpabet('giant')[0]).toBe('JH');
      expect(wordToArpabet('gentle')[0]).toBe('JH');
      // G stays G in exceptions (get, give)
      expect(wordToArpabet('get')[0]).toBe('G');
      expect(wordToArpabet('give')[0]).toBe('G');
    });

    it('should handle EA variations (beat vs bread vs break)', () => {
      // EA default → IY
      expect(wordToArpabet('beat')).toContain('IY1');
      expect(wordToArpabet('meat')).toContain('IY1');
      // EAD → EH D
      expect(wordToArpabet('bread')).toContain('EH1');
      // BREAK/STEAK → EY (exceptions)
      expect(wordToArpabet('break')).toContain('EY1');
      expect(wordToArpabet('steak')).toContain('EY1');
      // EALTH, DEATH, EATHER → EH
      expect(wordToArpabet('health')).toContain('EH1');
      expect(wordToArpabet('death')).toContain('EH1');
      expect(wordToArpabet('weather')).toContain('EH1');
    });

    it('should handle WAR as AO R and WOR as ER', () => {
      // WAR → W AO R
      expect(wordToArpabet('war')).toEqual(['W', 'AO1', 'R']);
      expect(wordToArpabet('warm')).toContain('AO1');
      // WOR → W ER
      expect(wordToArpabet('worm')).toContain('ER1');
      expect(wordToArpabet('work')).toContain('ER1');
      expect(wordToArpabet('word')).toContain('ER1');
    });

    it('should handle ALM with silent L', () => {
      expect(wordToArpabet('calm')).toEqual(['K', 'AA1', 'M']);
      expect(wordToArpabet('palm')).toEqual(['P', 'AA1', 'M']);
    });

    it('should handle -AGE suffix as IH JH', () => {
      const message = wordToArpabet('message');
      expect(message[message.length - 1]).toBe('JH');
      const village = wordToArpabet('village');
      expect(village[village.length - 1]).toBe('JH');
    });

    it('should handle -ENCE/-ANCE suffixes', () => {
      const evidence = wordToArpabet('evidence');
      expect(evidence.slice(-3)).toEqual(['AH0', 'N', 'S']);
      const balance = wordToArpabet('balance');
      expect(balance.slice(-3)).toEqual(['AH0', 'N', 'S']);
    });

    it('should handle -ISM suffix', () => {
      const mechanism = wordToArpabet('mechanism');
      expect(mechanism.slice(-3)).toEqual(['IH0', 'Z', 'AH0', 'M'].slice(-3));
      // Ends with Z AH0 M
      expect(mechanism[mechanism.length - 1]).toBe('M');
      expect(mechanism[mechanism.length - 2]).toBe('AH0');
      expect(mechanism[mechanism.length - 3]).toBe('Z');
    });

    it('should handle TIAL/CIAL as SH', () => {
      expect(wordToArpabet('partial')).toContain('SH');
      expect(wordToArpabet('special')).toContain('SH');
      expect(wordToArpabet('initial')).toContain('SH');
    });
  });

  describe('translateWithRules', () => {
    it('should produce some output for any word', () => {
      const result = translateWithRules('xyzzy');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should translate basic CVC words', () => {
      expect(translateWithRules('bat')).toBe('bat');
      expect(translateWithRules('kit')).toBe('kit');
      // dog: CMU has D AO1 G → "dawg" in ingglish
      expect(translateWithRules('dog')).toBe('dawg');
      expect(translateWithRules('map')).toBe('map');
    });

    it('should translate words with consonant digraphs', () => {
      expect(translateWithRules('ship')).toBe('ship');
      expect(translateWithRules('chip')).toBe('chip');
      expect(translateWithRules('thin')).toBe('thin');
    });

    it('should translate words with vowel digraphs', () => {
      expect(translateWithRules('boat')).toBe('boht');
      expect(translateWithRules('rain')).toBe('rayn');
      expect(translateWithRules('coin')).toBe('koin');
      expect(translateWithRules('tree')).toBe('tree');
    });

    it('should translate words with new vowel digraphs (oa, ue, ei)', () => {
      expect(translateWithRules('soap')).toBe('sohp');
      expect(translateWithRules('coal')).toBe('kohl');
      expect(translateWithRules('blue')).toBe('bloo');
      expect(translateWithRules('clue')).toBe('kloo');
      expect(translateWithRules('vein')).toBe('vain'); // EI→AY default; EY correct but breaks German names
    });

    it('should translate words with R-controlled vowels', () => {
      expect(translateWithRules('bird')).toBe('berd');
      expect(translateWithRules('burn')).toBe('bern');
      expect(translateWithRules('fern')).toBe('fern');
      expect(translateWithRules('her')).toBe('her');
      expect(translateWithRules('car')).toBe('kar');
      expect(translateWithRules('star')).toBe('star');
      expect(translateWithRules('fork')).toBe('fork');
      expect(translateWithRules('born')).toBe('born');
    });

    it('should translate words with trigraphs', () => {
      expect(translateWithRules('knight')).toBe('nait');
      expect(translateWithRules('flight')).toBe('flait');
      expect(translateWithRules('match')).toBe('mach');
      expect(translateWithRules('badge')).toBe('baj');
    });

    it('should translate words with tion/sion', () => {
      // NRL: A before TIO gets long A treatment → nayshan
      expect(translateWithRules('nation')).toBe('nayshan');
      expect(translateWithRules('vision')).toBe('vizhan');
    });

    it('should translate words with silent consonant pairs', () => {
      expect(translateWithRules('wrong')).toBe('rawng');
      expect(translateWithRules('knot')).toBe('not');
      expect(translateWithRules('gnat')).toBe('nat');
    });

    it('should translate words with doubled consonants', () => {
      expect(translateWithRules('buzz')).toBe('buhz');
      expect(translateWithRules('bell')).toBe('bel');
      expect(translateWithRules('apple')).toBe('apal');
    });

    it('should translate words with y as vowel', () => {
      expect(translateWithRules('gym')).toBe('jim');
      expect(translateWithRules('myth')).toBe('mith');
      expect(translateWithRules('crypt')).toBe('kript');
      expect(translateWithRules('glyph')).toBe('glif');
    });

    it('should translate word-final o as long O', () => {
      expect(translateWithRules('go')).toBe('goh');
      expect(translateWithRules('no')).toBe('noh');
    });

    it('should translate -ed suffix words', () => {
      expect(translateWithRules('walked')).toBe('wawkt');
      expect(translateWithRules('turned')).toBe('ternd');
    });

    it('should voice final s after voiced sounds', () => {
      // NRL gives AO for 'o' in dog → "dawgz" (CMU also has AO)
      expect(translateWithRules('dogs')).toBe('dawgz');
      expect(translateWithRules('runs')).toBe('ruhnz');
      // Voiceless: keep S
      expect(translateWithRules('cats')).toBe('kats');
    });

    it('should translate -ous suffix as schwa', () => {
      // -ous → AH S (not AA AH S)
      const famous = wordToArpabet('famous');
      expect(famous[famous.length - 2]).toBe('AH0');
      expect(famous[famous.length - 1]).toBe('S'); // not voiced to Z
    });

    it('should translate -ness suffix', () => {
      const sadness = wordToArpabet('sadness');
      // Custom: -ness suffix → schwa (AH0)
      expect(sadness.slice(-3)).toEqual(['N', 'AH0', 'S']);
    });

    it('should translate -ment suffix', () => {
      const moment = wordToArpabet('moment');
      // Custom: -ment suffix → schwa (AH0)
      expect(moment.slice(-4)).toEqual(['M', 'AH0', 'N', 'T']);
    });

    it('should translate -less suffix', () => {
      const careless = wordToArpabet('careless');
      // Custom: -less suffix → schwa (AH0)
      expect(careless.slice(-3)).toEqual(['L', 'AH0', 'S']);
    });

    it('should translate alk with silent l', () => {
      expect(translateWithRules('walk')).toBe('wawk');
      expect(translateWithRules('talk')).toBe('tawk');
      // NRL gives AO for 'a' in chalk → "chawk" (CMU also has AO)
      expect(translateWithRules('chalk')).toBe('chawk');
    });

    it('should use IY for word-final y in multi-syllable words', () => {
      const happy = wordToArpabet('happy');
      // NRL: #^:[Y] =/IY/ — y in unstressed final syllable → IY0
      expect(happy[happy.length - 1]).toBe('IY0');
      const baby = wordToArpabet('baby');
      expect(baby[baby.length - 1]).toBe('IY0');
    });

    it('should keep IH for y in single-syllable words', () => {
      // "gym" → y as IH (not at word end preceded by vowel... actually gym ends in 'm')
      expect(wordToArpabet('gym')).toContain('IH1');
    });

    it('should handle old pattern as OW L D', () => {
      expect(wordToArpabet('bold')).toEqual(['B', 'OW1', 'L', 'D']);
      expect(wordToArpabet('cold')).toEqual(['K', 'OW1', 'L', 'D']);
      expect(wordToArpabet('gold')).toEqual(['G', 'OW1', 'L', 'D']);
    });

    it('should handle olt pattern as OW L T', () => {
      expect(wordToArpabet('bolt')).toEqual(['B', 'OW1', 'L', 'T']);
      expect(wordToArpabet('colt')).toEqual(['K', 'OW1', 'L', 'T']);
      // jolt also works
      expect(wordToArpabet('jolt')).toContain('OW1');
    });

    it('should handle olk with silent l', () => {
      expect(wordToArpabet('folk')).toEqual(['F', 'OW1', 'K']);
      expect(wordToArpabet('yolk')).toEqual(['Y', 'OW1', 'K']);
    });

    it('should handle word-final ign with silent g', () => {
      expect(wordToArpabet('sign')).toEqual(['S', 'AY1', 'N']);
      // ign mid-word should NOT match (e.g., ignite)
      expect(wordToArpabet('ignite')).toContain('G');
    });

    it('should use long vowels before consonant+le where NRL matches', () => {
      // table: NRL ABLE rule gives long A
      expect(translateWithRules('table')).toBe('taybal');
      expect(translateWithRules('noble')).toBe('nohbal');
      expect(translateWithRules('title')).toBe('taital');
      // Short vowel (doubled consonant): little, apple, bottle stay short
      expect(translateWithRules('little')).toBe('lital');
      expect(translateWithRules('apple')).toBe('apal');
      expect(translateWithRules('bottle')).toBe('botal');
    });

    it('should translate compound-style words', () => {
      // Unstressed AE reduces to schwa, but EH and AA keep their vowel quality
      expect(translateWithRules('hashtag')).toBe('hashtag');
      // NRL: ^E[CH]=/K/ — ch after consonant+E gives K, EH stays as EH0
      expect(translateWithRules('fintech')).toBe('fintek');
      // NRL gives AA for 'o' in bot → "chatbot" (AA→o is correct)
      expect(translateWithRules('chatbot')).toBe('chatbot');
    });

    it('should translate magic-e words with long vowels', () => {
      expect(translateWithRules('bake')).toBe('bayk');
      expect(translateWithRules('bike')).toBe('baik');
      expect(translateWithRules('bone')).toBe('bohn');
      expect(translateWithRules('write')).toBe('rait');
      expect(translateWithRules('gnome')).toBe('nohm');
      expect(translateWithRules('phone')).toBe('fohn');
      expect(translateWithRules('stripe')).toBe('straip');
      // NRL: A before consonant + suffix-like ending → long A
      expect(translateWithRules('place')).toBe('plays');
    });

    it('should translate words with initial silent p', () => {
      // NRL silences L in ALM context → "som" (L is silent in American English)
      expect(translateWithRules('psalm')).toBe('som');
      expect(translateWithRules('psychology')).not.toMatch(/^p/);
    });

    it('should translate words with final silent consonants', () => {
      expect(translateWithRules('lamb')).toBe('lam');
      expect(translateWithRules('thumb')).toBe('thuhm');
      expect(translateWithRules('debt')).toBe('det');
      expect(translateWithRules('hymn')).toBe('him');
    });

    it('should translate nk as ngk', () => {
      expect(translateWithRules('think')).toBe('thingk');
      expect(translateWithRules('bank')).toBe('bangk');
    });

    it('should translate sc before e/i without double s', () => {
      expect(translateWithRules('scene')).toBe('seen');
    });

    it('should translate ew words', () => {
      expect(translateWithRules('new')).toBe('noo');
      expect(translateWithRules('grew')).toBe('groo');
    });

    it('should translate -ture suffix', () => {
      expect(translateWithRules('picture')).toBe('pikcher');
    });

    it('should translate consonant+le endings', () => {
      expect(translateWithRules('apple')).toBe('apal');
      expect(translateWithRules('little')).toBe('lital');
      expect(translateWithRules('bottle')).toBe('botal');
      expect(translateWithRules('candle')).toBe('kandal');
      expect(translateWithRules('table')).toBe('taybal');
    });

    it('should translate eigh words', () => {
      expect(translateWithRules('inveigh')).toBe('invay');
      expect(translateWithRules('weigh')).toBe('way');
      expect(translateWithRules('sleigh')).toBe('slay');
    });

    it('should translate augh words', () => {
      expect(translateWithRules('faugh')).toBe('faw');
    });

    it('should translate ssion words', () => {
      expect(translateWithRules('mission')).toBe('mishan');
    });

    it('should not silence g before n in mid-word', () => {
      // oppugnant should have G sound, not just N
      const result = translateWithRules('oppugnant');
      expect(result).toContain('g');
    });

    it('should translate OUGH variations correctly', () => {
      expect(translateWithRules('through')).toBe('throo');
      expect(translateWithRules('tough')).toBe('tuhf');
      expect(translateWithRules('rough')).toBe('ruhf');
      expect(translateWithRules('cough')).toBe('kof');
      expect(translateWithRules('bough')).toBe('bou');
      expect(translateWithRules('dough')).toBe('doh');
      expect(translateWithRules('thought')).toBe('thawt');
    });

    it('should translate OW split (town vs show)', () => {
      // OW → AW in town/down/gown/cow contexts
      expect(translateWithRules('town')).toBe('toun');
      expect(translateWithRules('down')).toBe('doun');
      expect(translateWithRules('gown')).toBe('goun');
      expect(translateWithRules('cow')).toBe('kou');
      // OW → OW in other contexts
      expect(translateWithRules('show')).toBe('shoh');
      expect(translateWithRules('flow')).toBe('floh');
      expect(translateWithRules('snow')).toBe('snoh');
    });

    it('should translate OO variations (book vs food vs blood)', () => {
      expect(translateWithRules('book')).toBe('buk');
      expect(translateWithRules('look')).toBe('luk');
      expect(translateWithRules('food')).toBe('food');
      expect(translateWithRules('moon')).toBe('moon');
      expect(translateWithRules('blood')).toBe('bluhd');
      expect(translateWithRules('flood')).toBe('fluhd');
    });

    it('should translate WH digraph', () => {
      expect(translateWithRules('who')).toBe('hoo');
      expect(translateWithRules('whole')).toBe('hohl');
    });

    it('should translate AU/AW words', () => {
      expect(translateWithRules('sauce')).toBe('saws');
      expect(translateWithRules('dawn')).toBe('dawn');
      expect(translateWithRules('draw')).toBe('draw');
    });

    it('should translate would/could/should', () => {
      expect(translateWithRules('would')).toBe('wud');
      expect(translateWithRules('could')).toBe('kud');
      expect(translateWithRules('should')).toBe('shud');
    });

    it('should translate soft C before front vowels', () => {
      expect(translateWithRules('cell')).toBe('sel');
      expect(translateWithRules('cent')).toBe('sent');
    });

    it('should translate soft G before front vowels', () => {
      expect(translateWithRules('gem')).toBe('jem');
      expect(translateWithRules('gentle')).toBe('jental');
    });

    it('should translate EA variations', () => {
      expect(translateWithRules('beat')).toBe('beet');
      expect(translateWithRules('bread')).toBe('bred');
      expect(translateWithRules('break')).toBe('brayk');
      expect(translateWithRules('health')).toBe('helth');
      expect(translateWithRules('death')).toBe('deth');
    });

    it('should translate WAR/WOR patterns', () => {
      expect(translateWithRules('war')).toBe('wor');
      expect(translateWithRules('worm')).toBe('werm');
      expect(translateWithRules('work')).toBe('werk');
      expect(translateWithRules('word')).toBe('werd');
    });

    it('should translate ALM with silent L', () => {
      expect(translateWithRules('calm')).toBe('kom');
      expect(translateWithRules('palm')).toBe('pom');
    });

    it('should translate -AGE suffix', () => {
      expect(translateWithRules('message')).toBe('mesaj');
    });

    it('should translate -ENCE/-ANCE suffixes', () => {
      expect(translateWithRules('evidence')).toBe('evadans');
      expect(translateWithRules('distance')).toBe('distans');
      expect(translateWithRules('balance')).toBe('balans');
    });

    it('should translate TIAL/CIAL as SH', () => {
      expect(translateWithRules('partial')).toBe('parshal');
      expect(translateWithRules('special')).toBe('speshal');
    });

    it('should translate soft C and G at word end (-CE, -GE)', () => {
      expect(translateWithRules('face')).toBe('fays');
      expect(translateWithRules('race')).toBe('rays');
      expect(translateWithRules('age')).toBe('ayj');
      expect(translateWithRules('page')).toBe('payj');
      expect(translateWithRules('stage')).toBe('stayj');
    });
  });

  describe('translateWithStemming', () => {
    it('should handle -ing suffix with known base', () => {
      expect(translateWithStemming('running')).toBe('ruhning');
    });

    it('should handle -ly suffix with known base', () => {
      expect(translateWithStemming('quickly')).toBe('kwiklee');
    });

    it('should handle -ed suffix', () => {
      expect(translateWithStemming('walked')).toBe('wawkt');
    });

    it('should handle un- prefix with known base', () => {
      expect(translateWithStemming('unhappy')).toBe('anhapee');
    });

    it('should handle re- prefix with known base', () => {
      expect(translateWithStemming('rebuild')).toBe('reebild');
    });

    it('should return null for words without recognizable stems', () => {
      expect(translateWithStemming('xyzzy')).toBeNull();
    });

    it('should return null for short prefixed words', () => {
      expect(translateWithStemming('una')).toBeNull();
    });

    it('should handle i→y stem change (loveliest→lovely+est)', () => {
      expect(translateWithStemming('loveliest')).toBe('luhvleeast');
    });

    it('should handle i→y stem change with -ly (happily→happy+ly)', () => {
      expect(translateWithStemming('happily')).toBe('hapeelee');
    });

    it('should handle i→y stem change with -er (easier→easy+er)', () => {
      expect(translateWithStemming('easier')).toBe('eezeeer');
    });

    it('should handle -ify suffix (uglify→ugly+ify)', () => {
      expect(translateWithStemming('uglify')).toBe('uhgleeifai');
    });

    it('should handle -ification suffix (uglification→ugly+ification)', () => {
      expect(translateWithStemming('uglification')).toBe('uhgleeifikayshan');
    });

    it('should handle -ifying suffix (uglifying→ugly+ifying)', () => {
      expect(translateWithStemming('uglifying')).toBe('uhgleeifaiing');
    });
  });

  describe('translateAsBritish', () => {
    it('should convert -our to -or (colour→color)', () => {
      expect(translateAsBritish('colour')).toBe('kuhler');
    });

    it('should convert -ise to -ize (realise→realize)', () => {
      expect(translateAsBritish('realise')).toBe('reealaiz');
    });

    it('should convert -re to -er (centre→center)', () => {
      expect(translateAsBritish('centre')).toBe('senter');
    });

    it('should convert -isation to -ization', () => {
      expect(translateAsBritish('organisation')).toBe('organazayshan');
    });

    it('should convert -ence to -ense (defence→defense)', () => {
      expect(translateAsBritish('defence')).toBe('difens');
    });

    it('should convert -ogue to -og (catalogue→catalog)', () => {
      expect(translateAsBritish('catalogue')).toBe('katalawg');
    });

    it('should return null for words that are not British spellings', () => {
      expect(translateAsBritish('xyzzy')).toBeNull();
    });

    it('should return null when American form is not in dictionary', () => {
      expect(translateAsBritish('blorgour')).toBeNull();
    });

    it('should handle -oured suffix (favoured→favored)', () => {
      expect(translateAsBritish('favoured')).toBe('fayverd');
    });

    it('should convert -ey to -y (curtsey→curtsy)', () => {
      expect(translateAsBritish('curtsey')).toBe('kertsee');
    });

    it('should handle grey→gray', () => {
      expect(translateAsBritish('grey')).toBe('gray');
    });
  });

  describe('translateUnknown', () => {
    it('should always return a string', () => {
      const result = translateUnknown('xyzzy');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should try stemming first then fallback to rules', () => {
      // For a completely made-up word, should use rules
      const result = translateUnknown('blargification');
      expect(result).toBeDefined();
    });

    it('should use custom pronunciations for tech terms', () => {
      // "git" is in our custom dictionary
      const result = translateUnknown('git');
      expect(result).toBe('git'); // G IH1 T -> git
    });

    it('should translate devs correctly (not as de+vs)', () => {
      // "devs" has custom pronunciation to prevent compound split as "de" + "vs" (versus)
      const result = translateUnknown('devs');
      expect(result).toBe('devz'); // D EH1 V Z -> devz
    });

    it('should handle github via custom pronunciation', () => {
      // github is now a custom pronunciation (G IH1 T HH AH1 B)
      expect(translateUnknown('github')).toBe('githuhb');
    });
  });

  describe('translateAsCompound', () => {
    it('should split compound words into known parts', () => {
      if (lookupPronunciation('bed') === null) {
        return; // Skip with stub dictionary
      }
      // "bedpost" = bed (CMU) + post (CMU) — both have high SUBTLEX frequency
      const result = translateAsCompound('bedpost');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should return null for non-compound words', () => {
      const result = translateAsCompound('xyzzy');
      expect(result).toBeNull();
    });

    it('should reject splits with obscure parts', () => {
      // Compound splitter requires parts with SUBTLEX frequency ≥ 500.
      // Words made of obscure dictionary entries should not be split.
      const result = translateAsCompound('abacus');
      expect(result).toBeNull();
    });
  });

  describe('translateAsAcronym', () => {
    it('should spell out URL as yooarel', () => {
      const result = translateAsAcronym('url');
      expect(result).toBe('yooarel');
    });

    it('should spell out HTML correctly', () => {
      const result = translateAsAcronym('html');
      expect(result).toBe('aychteeemel');
    });

    it('should spell out API correctly', () => {
      const result = translateAsAcronym('api');
      expect(result).toBe('aypeeai');
    });

    it('should spell out CSS correctly', () => {
      // C=see, S=es, S=es → "seeeses"
      const result = translateAsAcronym('css');
      expect(result).toBe('seeeses');
    });

    it('should handle uppercase input', () => {
      const result = translateAsAcronym('URL');
      expect(result).toBe('yooarel');
    });
  });

  describe('acronym detection in translateUnknown', () => {
    it('should translate url as spelled-out letters', () => {
      const result = translateUnknown('url');
      expect(result).toBe('yooarel');
    });

    it('should translate URL (uppercase) as spelled-out letters', () => {
      const result = translateUnknown('URL');
      expect(result).toBe('yooarel');
    });

    it('should translate html as spelled-out letters', () => {
      const result = translateUnknown('html');
      expect(result).toBe('aychteeemel');
    });

    it('should translate api as spelled-out letters', () => {
      const result = translateUnknown('api');
      expect(result).toBe('aypeeai');
    });

    it('should not treat regular words as acronyms', () => {
      // "cat" should not be spelled out as c-a-t
      const result = translateUnknown('blorg');
      expect(result).not.toBe('beeelohahrgee'); // not spelled out
    });
  });

  describe('IPA output format', () => {
    it('translateWithRules should output IPA when format is ipa', () => {
      const result = translateWithRules('blorg', 'ipa');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // IPA output should contain IPA characters, not Latin alphabet
      // The word "blorg" should produce something like /blɔɹɡ/
      expect(result).toMatch(/[bɡʃʒθðŋɹɑæʌɔɛɪʊəaɪeɪoʊaʊɔɪuiˈˌ]/);
    });

    it('translateAsAcronym should output IPA when format is ipa', () => {
      // URL = /juː ɑːɹ ɛl/ (you-are-ell)
      const result = translateAsAcronym('url', 'ipa');
      expect(result).toBeDefined();
      // Should contain IPA vowels and consonants
      expect(result).toMatch(/[juɑɹɛl]/);
    });

    it('translateUnknown should output IPA when format is ipa', () => {
      const result = translateUnknown('xyzzy', 'ipa');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should not be plain ASCII letters like ingglish output
      expect(result).not.toMatch(/^[a-zA-Z]+$/);
    });

    it('translateUnknown should output IPA for acronyms', () => {
      const result = translateUnknown('api', 'ipa');
      expect(result).toBeDefined();
      // API = /eɪ piː aɪ/ (ay-pee-eye)
      // Should contain IPA characters
      expect(result).toMatch(/[eɪpiːaɪ]/);
    });

    it('translateWithStemming should output IPA when format is ipa', () => {
      // Test with a word that has a known stem
      const result = translateWithStemming('quickly', 'ipa');
      // May return null if stem not found, otherwise should be IPA
      if (result !== null) {
        expect(result).toMatch(/[ɪəʌɛæɑɔʊuiŋʃʒθðɹ]/);
      }
    });
  });

  describe('phonemize integration', () => {
    beforeAll(async () => {
      await preloadPhonemize();
    });

    describe('handles words not in CMU dictionary', () => {
      // Note: 'url' is now in the CMU dictionary (Y UW2 AA2 R EH1 L)
      const unknownWords = [...UNKNOWN_TECH_WORDS];

      it('unknown words are not in CMU dictionary', () => {
        for (const word of unknownWords) {
          expect(lookupPronunciation(word), `${word} should not be in CMU`).toBeNull();
        }
      });

      it('phonemize produces reasonable translations for tech terms', () => {
        const results: { word: string; phonemize: string | null; rules: string }[] = [];

        for (const word of unknownWords) {
          const phonemizeResult = translateWithPhonemize(word);
          const rulesResult = translateWithRules(word);

          results.push({
            word,
            phonemize: phonemizeResult,
            rules: rulesResult,
          });

          // Phonemize should produce some output for each word
          if (phonemizeResult !== null) {
            expect(phonemizeResult.length).toBeGreaterThan(0);
          }
        }

        // Results are captured in the test - no need to log
      });
    });

    describe('handles proper names better than rules', () => {
      // Names that are tricky to pronounce with simple rules
      const names = [
        'nguyen', // Vietnamese name
        'siobhan', // Irish name
        'bjork', // Icelandic name
        'xiaoming', // Chinese name
        'sergei', // Russian name
      ];

      it('proper names get translated', () => {
        for (const name of names) {
          const phonemizeResult = translateWithPhonemize(name);
          const rulesResult = translateWithRules(name);

          // Both methods should produce output
          expect(rulesResult.length).toBeGreaterThan(0);
          // Phonemize may or may not handle these well, but should produce something
          expect(phonemizeResult === null || phonemizeResult.length > 0).toBe(true);
        }
      });
    });

    describe('translateWord uses phonemize as fallback', () => {
      it('unknown words get translated via fallback', () => {
        // These words are not in CMU dictionary
        const word = 'kubernetes';
        expect(lookupPronunciation(word)).toBeNull();

        // translateWord should still produce output via fallback
        const result = translateWord(word);
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toBe(word); // Should be transformed
      });

      it('known words still use dictionary', () => {
        // "hello" is in CMU dictionary
        expect(lookupPronunciation('hello')).not.toBeNull();

        const result = translateWord('hello');
        expect(result).toBe('haloh'); // Known correct translation
      });
    });

    describe('phonemize vs rules comparison', () => {
      it('compares output quality on made-up words', () => {
        const madeUpWords = ['blorgify', 'schnozzle', 'quixotic', 'zephyrus', 'melodious'];

        const results: { word: string; phonemize: string | null; rules: string; inCmu: boolean }[] =
          [];

        for (const word of madeUpWords) {
          const inCmu = lookupPronunciation(word) !== null;
          const phonemizeResult = translateWithPhonemize(word);
          const rulesResult = translateWithRules(word);

          results.push({
            word,
            phonemize: phonemizeResult,
            rules: rulesResult,
            inCmu,
          });
        }

        // All should produce some output
        for (const r of results) {
          expect(r.rules.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
