import { translateSync } from 'ingglish';
import { describe, it, expect } from 'vitest';
import { getDictionary, CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { ARPABET_VOWELS, ARPABET_CONSONANTS, STRESS_MARKER_REGEX } from '@ingglish/phonemes';

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
      // Test sion in context instead (vision is tested in wordToPhonetic)
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
      expect(walked.at(-1)).toBe('T');
      expect(walked).not.toContain('EH1'); // no full vowel for 'e'
    });

    it('should handle -ed suffix after voiced consonants as D', () => {
      const turned = wordToArpabet('turned');
      expect(turned.at(-1)).toBe('D');
      expect(turned).not.toContain('EH1');
    });

    it('should handle -ed suffix after t/d as IH D', () => {
      const wanted = wordToArpabet('wanted');
      // NRL: #:[TED] =/T IH D/ — IH in unstressed syllable marked as IH0
      expect(wanted.at(-2)).toBe('IH0');
      expect(wanted.at(-1)).toBe('D');
    });

    it('should not strip -ed from short words (bed, shed)', () => {
      // "bed" should keep its 'e' vowel
      expect(wordToArpabet('bed')).toEqual(['B', 'EH1', 'D']);
    });

    it('should voice final S to Z after voiced sounds', () => {
      const dogs = wordToArpabet('dogs');
      expect(dogs.at(-1)).toBe('Z');

      const runs = wordToArpabet('runs');
      expect(runs.at(-1)).toBe('Z');
    });

    it('should keep final S after voiceless sounds', () => {
      const cats = wordToArpabet('cats');
      expect(cats.at(-1)).toBe('S');
    });

    it('should handle every letter a-z', () => {
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCodePoint(97 + i);
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
      expect(message.at(-1)).toBe('JH');
      const village = wordToArpabet('village');
      expect(village.at(-1)).toBe('JH');
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
      expect(mechanism.at(-1)).toBe('M');
      expect(mechanism.at(-2)).toBe('AH0');
      expect(mechanism.at(-3)).toBe('Z');
    });

    it('should handle TIAL/CIAL as SH', () => {
      expect(wordToArpabet('partial')).toContain('SH');
      expect(wordToArpabet('special')).toContain('SH');
      expect(wordToArpabet('initial')).toContain('SH');
    });

    it('should handle EIGN with silent G (reign, feign)', () => {
      expect(wordToArpabet('reign')).toEqual(['R', 'EY1', 'N']);
      expect(wordToArpabet('feign')).toEqual(['F', 'EY1', 'N']);
      expect(wordToArpabet('deign')).toEqual(['D', 'EY1', 'N']);
    });

    it('should handle silent H in honor/honest/heir', () => {
      expect(wordToArpabet('honor')[0]).toBe('AA1'); // no HH
      expect(wordToArpabet('honest')[0]).toBe('AA1');
      expect(wordToArpabet('heir')).toEqual(['EH1', 'R']);
    });

    it('should handle silent W in sword', () => {
      expect(wordToArpabet('sword')).toEqual(['S', 'AO1', 'R', 'D']);
    });

    it('should handle OOD exceptions (mood, brood → UW)', () => {
      expect(wordToArpabet('mood')).toContain('UW1');
      expect(wordToArpabet('brood')).toContain('UW1');
      // good/wood still UH
      expect(wordToArpabet('good')).toContain('UH1');
      expect(wordToArpabet('wood')).toContain('UH1');
    });

    it('should handle word-initial X as Z before vowels', () => {
      expect(wordToArpabet('xylophone')[0]).toBe('Z');
    });
  });

  describe('wordToPhonetic', () => {
    it('should produce some output for any word', () => {
      const result = translateSync('xyzzy');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should translate basic CVC words', () => {
      expect(translateSync('bat')).toBe('bat');
      expect(translateSync('kit')).toBe('kit');
      // dog: CMU has D AO1 G → "dawg" in ingglish
      expect(translateSync('dog')).toBe('dawg');
      expect(translateSync('map')).toBe('map');
    });

    it('should translate words with consonant digraphs', () => {
      expect(translateSync('ship')).toBe('ship');
      expect(translateSync('chip')).toBe('chip');
      expect(translateSync('thin')).toBe('thin');
    });

    it('should translate words with vowel digraphs', () => {
      expect(translateSync('boat')).toBe('boht');
      expect(translateSync('rain')).toBe('rayn');
      expect(translateSync('coin')).toBe('koin');
      expect(translateSync('tree')).toBe('tree');
    });

    it('should translate words with new vowel digraphs (oa, ue, ei)', () => {
      expect(translateSync('soap')).toBe('sohp');
      expect(translateSync('coal')).toBe('kohl');
      expect(translateSync('blue')).toBe('bloo');
      expect(translateSync('clue')).toBe('kloo');
      expect(translateSync('vein')).toBe('vayn');
    });

    it('should translate words with R-controlled vowels', () => {
      expect(translateSync('bird')).toBe('berd');
      expect(translateSync('burn')).toBe('bern');
      expect(translateSync('fern')).toBe('fern');
      expect(translateSync('her')).toBe('her');
      expect(translateSync('car')).toBe('kar');
      expect(translateSync('star')).toBe('star');
      expect(translateSync('fork')).toBe('fork');
      expect(translateSync('born')).toBe('born');
    });

    it('should translate words with trigraphs', () => {
      expect(translateSync('knight')).toBe('nait');
      expect(translateSync('flight')).toBe('flait');
      expect(translateSync('match')).toBe('mach');
      expect(translateSync('badge')).toBe('baj');
    });

    it('should translate words with tion/sion', () => {
      // NRL: A before TIO gets long A treatment → nayshan
      expect(translateSync('nation')).toBe('nayshan');
      expect(translateSync('vision')).toBe('vizhan');
    });

    it('should translate words with silent consonant pairs', () => {
      expect(translateSync('wrong')).toBe('rawng');
      expect(translateSync('knot')).toBe('not');
      expect(translateSync('gnat')).toBe('nat');
    });

    it('should translate words with doubled consonants', () => {
      expect(translateSync('buzz')).toBe('buhz');
      expect(translateSync('bell')).toBe('bel');
      expect(translateSync('apple')).toBe('apal');
    });

    it('should translate words with y as vowel', () => {
      expect(translateSync('gym')).toBe('jim');
      expect(translateSync('myth')).toBe('mith');
      expect(translateSync('crypt')).toBe('kript');
      expect(translateSync('glyph')).toBe('glif');
    });

    it('should translate word-final o as long O', () => {
      expect(translateSync('go')).toBe('goh');
      expect(translateSync('no')).toBe('noh');
    });

    it('should translate -ed suffix words', () => {
      expect(translateSync('walked')).toBe('wawkt');
      expect(translateSync('turned')).toBe('ternd');
    });

    it('should voice final s after voiced sounds', () => {
      expect(translateSync('dogs')).toBe('dogz');
      expect(translateSync('runs')).toBe('ruhnz');
      // Voiceless: keep S
      expect(translateSync('cats')).toBe('kats');
    });

    it('should translate -ous suffix as schwa', () => {
      // -ous → AH S (not AA AH S)
      const famous = wordToArpabet('famous');
      expect(famous.at(-2)).toBe('AH0');
      expect(famous.at(-1)).toBe('S'); // not voiced to Z
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
      expect(translateSync('walk')).toBe('wawk');
      expect(translateSync('talk')).toBe('tawk');
      expect(translateSync('chalk')).toBe('chok');
    });

    it('should use IY for word-final y in multi-syllable words', () => {
      const happy = wordToArpabet('happy');
      // NRL: #^:[Y] =/IY/ — y in unstressed final syllable → IY0
      expect(happy.at(-1)).toBe('IY0');
      const baby = wordToArpabet('baby');
      expect(baby.at(-1)).toBe('IY0');
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
      expect(translateSync('table')).toBe('taybal');
      expect(translateSync('noble')).toBe('nohbal');
      expect(translateSync('title')).toBe('taital');
      // Short vowel (doubled consonant): little, apple, bottle stay short
      expect(translateSync('little')).toBe('lital');
      expect(translateSync('apple')).toBe('apal');
      expect(translateSync('bottle')).toBe('botal');
    });

    it('should translate compound-style words', () => {
      // Unstressed AE reduces to schwa, but EH and AA keep their vowel quality
      expect(translateSync('hashtag')).toBe('hashtag');
      // NRL: ^E[CH]=/K/ — ch after consonant+E gives K, EH stays as EH0
      expect(translateSync('fintech')).toBe('fintek');
      expect(translateSync('chatbot')).toBe('\uFFFDchatbot');
    });

    it('should translate magic-e words with long vowels', () => {
      expect(translateSync('bake')).toBe('bayk');
      expect(translateSync('bike')).toBe('baik');
      expect(translateSync('bone')).toBe('bohn');
      expect(translateSync('write')).toBe('rait');
      expect(translateSync('gnome')).toBe('nohm');
      expect(translateSync('phone')).toBe('fohn');
      expect(translateSync('stripe')).toBe('straip');
      // NRL: A before consonant + suffix-like ending → long A
      expect(translateSync('place')).toBe('plays');
    });

    it('should translate words with initial silent p', () => {
      // NRL silences L in ALM context → "som" (L is silent in American English)
      expect(translateSync('psalm')).toBe('som');
      expect(translateSync('psychology')).not.toMatch(/^p/);
    });

    it('should translate words with final silent consonants', () => {
      expect(translateSync('lamb')).toBe('lam');
      expect(translateSync('thumb')).toBe('thuhm');
      expect(translateSync('debt')).toBe('det');
      expect(translateSync('hymn')).toBe('him');
    });

    it('should translate nk as ngk', () => {
      expect(translateSync('think')).toBe('thingk');
      expect(translateSync('bank')).toBe('bangk');
    });

    it('should translate sc before e/i without double s', () => {
      expect(translateSync('scene')).toBe('seen');
    });

    it('should translate ew words', () => {
      expect(translateSync('new')).toBe('noo');
      expect(translateSync('grew')).toBe('groo');
    });

    it('should translate -ture suffix', () => {
      expect(translateSync('picture')).toBe('pikcher');
    });

    it('should translate consonant+le endings', () => {
      expect(translateSync('apple')).toBe('apal');
      expect(translateSync('little')).toBe('lital');
      expect(translateSync('bottle')).toBe('botal');
      expect(translateSync('candle')).toBe('kandal');
      expect(translateSync('table')).toBe('taybal');
    });

    it('should translate eigh words', () => {
      expect(translateSync('inveigh')).toBe('invay');
      expect(translateSync('weigh')).toBe('way');
      expect(translateSync('sleigh')).toBe('slay');
    });

    it('should translate augh words', () => {
      expect(translateSync('faugh')).toBe('faw');
    });

    it('should translate ssion words', () => {
      expect(translateSync('mission')).toBe('mishan');
    });

    it('should not silence g before n in mid-word', () => {
      // oppugnant should have G sound, not just N
      const result = translateSync('oppugnant');
      expect(result).toContain('g');
    });

    it('should translate OUGH variations correctly', () => {
      expect(translateSync('through')).toBe('throo');
      expect(translateSync('tough')).toBe('tuhf');
      expect(translateSync('rough')).toBe('ruhf');
      expect(translateSync('cough')).toBe('kof');
      expect(translateSync('bough')).toBe('bou');
      expect(translateSync('dough')).toBe('doh');
      expect(translateSync('thought')).toBe('thawt');
    });

    it('should translate OW split (town vs show)', () => {
      // OW → AW in town/down/gown/cow contexts
      expect(translateSync('town')).toBe('toun');
      expect(translateSync('down')).toBe('doun');
      expect(translateSync('gown')).toBe('goun');
      expect(translateSync('cow')).toBe('kou');
      // OW → OW in other contexts
      expect(translateSync('show')).toBe('shoh');
      expect(translateSync('flow')).toBe('floh');
      expect(translateSync('snow')).toBe('snoh');
    });

    it('should translate OO variations (book vs food vs blood)', () => {
      expect(translateSync('book')).toBe('buk');
      expect(translateSync('look')).toBe('luk');
      expect(translateSync('food')).toBe('food');
      expect(translateSync('moon')).toBe('moon');
      expect(translateSync('blood')).toBe('bluhd');
      expect(translateSync('flood')).toBe('fluhd');
    });

    it('should translate WH digraph', () => {
      expect(translateSync('who')).toBe('hoo');
      expect(translateSync('whole')).toBe('hohl');
    });

    it('should translate AU/AW words', () => {
      expect(translateSync('sauce')).toBe('saws');
      expect(translateSync('dawn')).toBe('dawn');
      expect(translateSync('draw')).toBe('draw');
    });

    it('should translate would/could/should', () => {
      expect(translateSync('would')).toBe('wud');
      expect(translateSync('could')).toBe('kud');
      expect(translateSync('should')).toBe('shud');
    });

    it('should translate soft C before front vowels', () => {
      expect(translateSync('cell')).toBe('sel');
      expect(translateSync('cent')).toBe('sent');
    });

    it('should translate soft G before front vowels', () => {
      expect(translateSync('gem')).toBe('jem');
      expect(translateSync('gentle')).toBe('jental');
    });

    it('should translate EA variations', () => {
      expect(translateSync('beat')).toBe('beet');
      expect(translateSync('bread')).toBe('bred');
      expect(translateSync('break')).toBe('brayk');
      expect(translateSync('health')).toBe('helth');
      expect(translateSync('death')).toBe('deth');
    });

    it('should translate WAR/WOR patterns', () => {
      expect(translateSync('war')).toBe('wor');
      expect(translateSync('worm')).toBe('werm');
      expect(translateSync('work')).toBe('werk');
      expect(translateSync('word')).toBe('werd');
    });

    it('should translate ALM with silent L', () => {
      expect(translateSync('calm')).toBe('kom');
      expect(translateSync('palm')).toBe('pom');
    });

    it('should translate -AGE suffix', () => {
      expect(translateSync('message')).toBe('mesaj');
    });

    it('should translate -ENCE/-ANCE suffixes', () => {
      expect(translateSync('evidence')).toBe('evadans');
      expect(translateSync('distance')).toBe('distans');
      expect(translateSync('balance')).toBe('balans');
    });

    it('should translate TIAL/CIAL as SH', () => {
      expect(translateSync('partial')).toBe('parshal');
      expect(translateSync('special')).toBe('speshal');
    });

    it('should translate soft C and G at word end (-CE, -GE)', () => {
      expect(translateSync('face')).toBe('fays');
      expect(translateSync('race')).toBe('rays');
      expect(translateSync('age')).toBe('ayj');
      expect(translateSync('page')).toBe('payj');
      expect(translateSync('stage')).toBe('stayj');
    });

    it('should translate EIGN with silent G', () => {
      expect(translateSync('reign')).toBe('rayn');
      expect(translateSync('feign')).toBe('fayn');
    });

    it('should translate words with silent H (honor, honest, heir)', () => {
      expect(translateSync('honor')).toBe('oner');
      expect(translateSync('honest')).toBe('onast');
      expect(translateSync('heir')).toBe('air');
    });

    it('should translate sword with silent W', () => {
      expect(translateSync('sword')).toBe('sord');
    });

    it('should translate mood/brood with long OO', () => {
      expect(translateSync('mood')).toBe('mood');
      expect(translateSync('brood')).toBe('brood');
      // good/wood still short
      expect(translateSync('good')).toBe('gud');
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
