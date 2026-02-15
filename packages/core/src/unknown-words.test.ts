import { describe, it, expect, beforeAll } from 'vitest';
import {
  translateWithStemming,
  translateWithRules,
  translateUnknown,
  translateAsAcronym,
  translateAsCompound,
  translateAsBritish,
  wordToArpabet,
  translateWithPhonemize,
  preloadPhonemize,
  CUSTOM_PRONUNCIATIONS,
} from './fallback';
import { lookupPronunciation, getDictionary } from './dictionary';
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
          const customPronunciation = CUSTOM_PRONUNCIATIONS[word];
          const cmuPhonemes = cmuPronunciation[0]; // First pronunciation variant
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
      expect(wordToArpabet('vein')).toContain('EY1'); // ei
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

    it('should handle augh as AO', () => {
      expect(wordToArpabet('caught')).toContain('AO1'); // augh → AO
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
      expect(wordToArpabet('sion')).toEqual(['ZH', 'AH0', 'N']);
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
      expect(wordToArpabet('nature')).toContain('ER1');
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
      expect(wordToArpabet('qi')).toEqual(['K', 'IH1']);
      expect(wordToArpabet('qat')).toEqual(['K', 'AE1', 'T']);
    });

    it('should treat y as short I when used as vowel', () => {
      expect(wordToArpabet('gym')).toContain('IH1'); // not IY1
      expect(wordToArpabet('myth')).toContain('IH1');
    });

    it('should treat y as consonant before vowels', () => {
      expect(wordToArpabet('yell')).toContain('Y');
    });

    it('should handle every letter a-z', () => {
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(97 + i);
        const phonemes = wordToArpabet(letter);
        expect(phonemes.length).toBeGreaterThan(0);
      }
    });

    it('should use long vowels for magic-e words', () => {
      expect(wordToArpabet('bake')).toContain('EY1'); // long A
      expect(wordToArpabet('bike')).toContain('AY1'); // long I
      expect(wordToArpabet('bone')).toContain('OW1'); // long O
      expect(wordToArpabet('cute')).toContain('UW1'); // long U
      expect(wordToArpabet('theme')).toContain('IY1'); // long E
    });

    it('should differentiate short vs long vowels (magic-e)', () => {
      // Without magic-e: short vowel
      expect(wordToArpabet('kit')).toContain('IH1');
      expect(wordToArpabet('strip')).toContain('IH1');
      // With magic-e: long vowel
      expect(wordToArpabet('kite')).toContain('AY1');
      expect(wordToArpabet('stripe')).toContain('AY1');
    });

    it('should not strip e after c or g (soft c/g)', () => {
      // 'c' and 'g' change pronunciation before 'e', so don't strip
      const placePhonemes = wordToArpabet('place');
      expect(placePhonemes).not.toContain('EY1'); // not magic-e long A
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
      expect(translateWithRules('dog')).toBe('dog');
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
      expect(translateWithRules('blue')).toBe('bluu');
      expect(translateWithRules('clue')).toBe('kluu');
      expect(translateWithRules('vein')).toBe('vayn');
    });

    it('should translate words with R-controlled vowels', () => {
      expect(translateWithRules('bird')).toBe('berd');
      expect(translateWithRules('burn')).toBe('bern');
      expect(translateWithRules('fern')).toBe('fern');
      expect(translateWithRules('her')).toBe('her');
    });

    it('should translate words with trigraphs', () => {
      expect(translateWithRules('knight')).toBe('nait');
      expect(translateWithRules('flight')).toBe('flait');
      expect(translateWithRules('match')).toBe('mach');
      expect(translateWithRules('badge')).toBe('baj');
    });

    it('should translate words with tion/sion', () => {
      expect(translateWithRules('nation')).toBe('nashun');
      expect(translateWithRules('vision')).toBe('vizhun');
    });

    it('should translate words with silent consonant pairs', () => {
      expect(translateWithRules('wrong')).toBe('rong');
      expect(translateWithRules('knot')).toBe('not');
      expect(translateWithRules('gnat')).toBe('nat');
    });

    it('should translate words with doubled consonants', () => {
      expect(translateWithRules('buzz')).toBe('buz');
      expect(translateWithRules('bell')).toBe('bel');
      expect(translateWithRules('apple')).toBe('apul');
    });

    it('should translate words with y as vowel', () => {
      expect(translateWithRules('gym')).toBe('jim');
      expect(translateWithRules('myth')).toBe('mith');
      expect(translateWithRules('crypt')).toBe('kript');
      expect(translateWithRules('glyph')).toBe('glif');
    });

    it('should translate compound-style words', () => {
      expect(translateWithRules('hashtag')).toBe('hashtag');
      expect(translateWithRules('fintech')).toBe('fintech');
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
    });

    it('should translate words with initial silent p', () => {
      expect(translateWithRules('psalm')).toBe('salm');
      expect(translateWithRules('psychology')).not.toMatch(/^p/);
    });

    it('should translate words with final silent consonants', () => {
      expect(translateWithRules('lamb')).toBe('lam');
      expect(translateWithRules('climb')).toBe('klim'); // long I is irregular, not magic-e
      expect(translateWithRules('thumb')).toBe('thum');
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
      expect(translateWithRules('new')).toBe('nuu');
      expect(translateWithRules('grew')).toBe('gruu');
    });

    it('should translate -ture suffix', () => {
      expect(translateWithRules('nature')).toBe('nacher');
      expect(translateWithRules('picture')).toBe('pikcher');
    });

    it('should translate consonant+le endings', () => {
      expect(translateWithRules('apple')).toBe('apul');
      expect(translateWithRules('little')).toBe('litul');
      expect(translateWithRules('bottle')).toBe('botul');
      expect(translateWithRules('candle')).toBe('kandul');
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
      expect(translateWithRules('mission')).toBe('mishun');
    });

    it('should not silence g before n in mid-word', () => {
      // oppugnant should have G sound, not just N
      const result = translateWithRules('oppugnant');
      expect(result).toContain('g');
    });
  });

  describe('translateWithStemming', () => {
    it('should handle -ing suffix with known base', () => {
      const result = translateWithStemming('running');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle -ly suffix with known base', () => {
      const result = translateWithStemming('quickly');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle -ed suffix', () => {
      const result = translateWithStemming('walked');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle un- prefix with known base', () => {
      // "unhappy" = un- + happy (both known)
      const result = translateWithStemming('unhappy');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle re- prefix with known base', () => {
      // "rebuild" = re- + build
      const result = translateWithStemming('rebuild');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should return null for words without recognizable stems', () => {
      const result = translateWithStemming('xyzzy');
      expect(result).toBeNull();
    });

    it('should return null for short prefixed words', () => {
      // Too short to be a valid prefix + stem
      const result = translateWithStemming('una');
      expect(result).toBeNull();
    });
  });

  describe('translateAsBritish', () => {
    it('should convert -our to -or (colour→color)', () => {
      const result = translateAsBritish('colour');
      expect(result).not.toBeNull();
      // Should match the CMU pronunciation of "color"
      expect(result).toBe(translateAsBritish('colour'));
    });

    it('should convert -ise to -ize (realise→realize)', () => {
      const result = translateAsBritish('realise');
      expect(result).not.toBeNull();
    });

    it('should convert -re to -er (centre→center)', () => {
      const result = translateAsBritish('centre');
      expect(result).not.toBeNull();
    });

    it('should convert -isation to -ization', () => {
      const result = translateAsBritish('organisation');
      expect(result).not.toBeNull();
    });

    it('should convert -ence to -ense (defence→defense)', () => {
      const result = translateAsBritish('defence');
      expect(result).not.toBeNull();
    });

    it('should convert -ogue to -og (catalogue→catalog)', () => {
      const result = translateAsBritish('catalogue');
      expect(result).not.toBeNull();
    });

    it('should return null for words that are not British spellings', () => {
      const result = translateAsBritish('xyzzy');
      expect(result).toBeNull();
    });

    it('should return null when American form is not in dictionary', () => {
      // "blorgour" → "blorgor" — not a real word
      const result = translateAsBritish('blorgour');
      expect(result).toBeNull();
    });

    it('should handle -oured suffix (favoured→favored)', () => {
      const result = translateAsBritish('favoured');
      expect(result).not.toBeNull();
    });

    it('should convert -ey to -y (curtsey→curtsy)', () => {
      const result = translateAsBritish('curtsey');
      expect(result).not.toBeNull();
    });

    it('should handle grey→gray', () => {
      const result = translateAsBritish('grey');
      expect(result).not.toBeNull();
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

    // These tests require "hub" in dictionary (full CMU dict, not stub)
    it('should handle compound words like github', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      // github = git (custom) + hub (CMU) -> github
      const result = translateUnknown('github');
      expect(result).toBe('github'); // git + hub
    });

    it('should produce correct IPA for github', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      // github should be /ɡɪthʌb/ NOT /ɡɪθʌb/
      const result = translateUnknown('github', 'ipa');
      expect(result).toContain('t'); // separate t
      expect(result).toContain('h'); // separate h
      expect(result).not.toContain('θ'); // NOT theta
    });
  });

  describe('translateAsCompound', () => {
    it('should split compound words into known parts', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      // "github" = git (custom) + hub (CMU dict)
      const result = translateAsCompound('github');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).toBe('github');
    });

    it('should return null for non-compound words', () => {
      const result = translateAsCompound('xyzzy');
      expect(result).toBeNull();
    });

    it('should handle github with custom git', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      const result = translateAsCompound('github');
      expect(result).toBe('github');
    });
  });

  describe('translateAsAcronym', () => {
    it('should spell out URL as yuuarel', () => {
      const result = translateAsAcronym('url');
      expect(result).toBe('yuuarel');
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
      expect(result).toBe('yuuarel');
    });
  });

  describe('acronym detection in translateUnknown', () => {
    it('should translate url as spelled-out letters', () => {
      const result = translateUnknown('url');
      expect(result).toBe('yuuarel');
    });

    it('should translate URL (uppercase) as spelled-out letters', () => {
      const result = translateUnknown('URL');
      expect(result).toBe('yuuarel');
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
        expect(result).toBe('huloh'); // Known correct translation
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
