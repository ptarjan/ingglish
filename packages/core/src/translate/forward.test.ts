import { describe, it, expect, vi } from 'vitest';
import { loadDictionary, isDictionaryLoaded, lookupPronunciation } from '@ingglish/dictionary';
import * as dictModule from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import {
  reverseTranslate,
  setDictLoader,
  translate,
  translateSync,
  translateSyncWithMapping,
} from '../index';

describe('async API loads only required dictionaries', () => {
  // Dictionaries pre-loaded by vitest.setup.ts

  it('translate() should not call loadReverseDictionary', async () => {
    const loadReverseSpy = vi.spyOn(dictModule, 'loadReverseDictionary');
    loadReverseSpy.mockClear();

    await translate('hello world');

    expect(loadReverseSpy).not.toHaveBeenCalled();
    loadReverseSpy.mockRestore();
  });

  it('reverseTranslate() should not call loadDictionary', async () => {
    const loadDictSpy = vi.spyOn(dictModule, 'loadDictionary');
    loadDictSpy.mockClear();

    await reverseTranslate('haloh werld');

    expect(loadDictSpy).not.toHaveBeenCalled();
    loadDictSpy.mockRestore();
  });

  it('translate() with lang loads foreign dict via registered loader', async () => {
    const mockDict: PhoneDict = {
      entries: { bonjour: ['B', 'AO1', 'ZH', 'UH1', 'R'] },
      lang: 'test-fr',
    };
    const loader = vi.fn().mockResolvedValue(mockDict);
    setDictLoader(loader);

    const result = await translate('bonjour', { lang: 'test-fr' });
    expect(loader).toHaveBeenCalledWith('test-fr');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // Sync should work after async load
    const syncResult = translateSync('bonjour', { lang: 'test-fr' });
    expect(syncResult).toBe(result);
  });

  it('translate() with lang="en" translates English', async () => {
    const result = await translate('hello', { lang: 'en' });
    expect(result).toBe('haloh');
  });

  it('translate() rejects when no loader registered for foreign lang', async () => {
    // Use a fresh lang code that won't be cached

    setDictLoader(undefined as unknown as Parameters<typeof setDictLoader>[0]);
    await expect(translate('test', { lang: 'xx' })).rejects.toThrow(
      /No dictionary loader registered/
    );
  });
});

describe('translator', () => {
  describe('loadDictionary', () => {
    it('should load the dictionary', async () => {
      const dict = await loadDictionary();
      expect(dict).toBeDefined();
      expect(typeof dict).toBe('object');
    });

    it('should report dictionary as loaded', () => {
      expect(isDictionaryLoaded()).toBe(true);
    });
  });

  describe('lookupPronunciation', () => {
    it('should find common words', () => {
      expect(lookupPronunciation('hello')).toBeDefined();
      expect(lookupPronunciation('world')).toBeDefined();
      expect(lookupPronunciation('the')).toBeDefined();
    });

    it('should be case insensitive', () => {
      expect(lookupPronunciation('Hello')).toEqual(lookupPronunciation('hello'));
      expect(lookupPronunciation('WORLD')).toEqual(lookupPronunciation('world'));
    });

    it('should return null for unknown words', () => {
      expect(lookupPronunciation('asdfghjkl')).toBeNull();
      expect(lookupPronunciation('xyz123')).toBeNull();
    });

    it('should return phoneme arrays', () => {
      const phonemes = lookupPronunciation('hello');
      expect(Array.isArray(phonemes)).toBe(true);
      expect(phonemes).not.toBeNull();
      if (phonemes !== null) {
        expect(phonemes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('translateSync (single words)', () => {
    it('should translate common words', () => {
      // hello = HH AH0 L OW1 -> haloh (American pronunciation)
      expect(translateSync('hello')).toBe('haloh');
      expect(translateSync('world')).toBe('werld');
    });

    it('should preserve capitalization', () => {
      const hello = translateSync('hello');
      expect(translateSync('Hello')).toBe(hello.charAt(0).toUpperCase() + hello.slice(1));
    });

    it('should pass through all-caps words unchanged', () => {
      // All-caps words (≥2 chars) pass through as acronyms/emphasis
      expect(translateSync('HELLO')).toBe('HELLO');
    });

    it('should handle unknown words with fallback', () => {
      // Unknown words use G2P rules to produce a phonetic translation
      const result = translateSync('splonk');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('splonk'); // Should be transformed by G2P
    });

    it('should translate url from dictionary', () => {
      // "url" is in CMU dictionary
      expect(translateSync('url')).toBe('url');
    });
  });

  describe('translateSync', () => {
    it('should translate multiple words', () => {
      const result = translateSync('hello world');
      // First word of multi-word text is capitalized (sentence start)
      expect(result).toContain('Haloh');
      expect(result).toContain('werld');
    });

    it('should preserve punctuation', () => {
      const result = translateSync('Hello, world!');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve punctuation in IPA output', () => {
      const result = translateSync('Hello, world!', { format: 'ipa' });
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve whitespace', () => {
      const result = translateSync('hello   world');
      expect(result).toContain('   ');
    });

    it('should preserve numbers', () => {
      const result = translateSync('hello 123 world');
      expect(result).toContain('123');
    });

    it('should handle contractions', () => {
      const result = translateSync("don't");
      // Contractions are translated as a unit - no apostrophe needed
      // The important thing is they round-trip correctly
      expect(result).toBe('dohnt');
    });

    it('should normalize curly apostrophes', () => {
      // Curly apostrophe (U+2019) should be treated the same as straight
      const curly = 'don\u2019t'; // don't with curly apostrophe
      const straight = "don't";
      expect(translateSync(curly)).toBe(translateSync(straight));
    });

    it('should handle possessives with curly apostrophes', () => {
      // Common in text copied from websites like NY Times
      const result = translateSync('China\u2019s economy');
      expect(result).toBe('Chainaz ikonamee');
    });

    it('should use diacritics as pronunciation signals for homographs', () => {
      // résumé (accented, French noun) ≠ resume (unaccented, English verb)
      expect(translateSync('résumé')).toBe('rezamay');
      expect(translateSync('resume')).toBe('rizoom');
    });

    it('should strip diacritics per-word for non-homograph loanwords', () => {
      // café→cafe, naïve→naive, cliché→cliche — same pronunciation
      expect(translateSync('naïve')).toBe(translateSync('naive'));
      expect(translateSync('café')).toBe(translateSync('cafe'));
      expect(translateSync('cliché')).toBe(translateSync('cliche'));
    });

    it('should treat I as lowercase (English capitalizes I by convention only)', () => {
      // "I" is always capitalized in English, but it's just a pronoun
      // In Ingglish, there's no special reason to capitalize it
      expect(translateSync('I')).toBe('ai');
      expect(translateSync("I'm")).toBe('aim');
      expect(translateSync("I'll")).toBe('ail');
      expect(translateSync("I've")).toBe('aiv');
      expect(translateSync("I'd")).toBe('aid');
      // Lowercase remains lowercase
      expect(translateSync('i')).toBe('ai');
    });

    it('should capitalize I at sentence start but not mid-sentence', () => {
      // "I" at sentence start gets capitalized to "Ai"
      expect(translateSync('I went home.')).toBe('Ai went hohm.');
      // "I" mid-sentence stays lowercase "ai"
      expect(translateSync('Then I left.')).toBe('Dhen ai left.');
      // "I" after sentence-ending punctuation gets capitalized
      expect(translateSync('Hello. I am here.')).toBe('Haloh. Ai am heer.');
      expect(translateSync('Really? I think so.')).toBe('Rilee? Ai thingk soh.');
    });

    it('should handle empty string', () => {
      expect(translateSync('')).toBe('');
    });

    it('should handle mixed content', () => {
      expect(translateSync('Hello, World! How are you?')).toBe('Haloh, Werld! Hou ar yoo?');
    });

    it('should capitalize first word of each sentence', () => {
      expect(translateSync('hello. world')).toBe('Haloh. Werld');
      expect(translateSync('stop! go now.')).toBe('Stop! Goh nou.');
    });
  });

  describe('contraction edge cases', () => {
    it('should handle contractions with apostrophe parts', () => {
      // Test contractions that go through the fallback path
      // where parts are translated separately
      const result = translateSync("y'all");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle possessives correctly', () => {
      // John's is in the dictionary as a complete word
      const result = translateSync("John's");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple apostrophes', () => {
      const result = translateSync("'twas");
      expect(result).toBeDefined();
    });

    it('should preserve all caps on contractions', () => {
      // DON'T should stay uppercase
      const result = translateSync("DON'T");
      expect(result).toBe(result.toUpperCase());
    });

    it('should handle contractions not in dictionary via apostrophe splitting', () => {
      // Made-up contraction — apostrophe splitting finds foo + t individually
      const result = translateSync("foo't");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('case preservation for unknown words', () => {
    it('should preserve all caps on unknown words', () => {
      // KUBERNETES is not in CMU dictionary
      const result = translateSync('KUBERNETES');
      expect(result).toBe(result.toUpperCase());
    });

    it('should preserve title case on unknown words', () => {
      // Kubernetes is not in CMU dictionary
      const result = translateSync('Kubernetes');
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
      expect(result.slice(1)).toBe(result.slice(1).toLowerCase());
    });

    it('should preserve mixed case on unknown words like GitHub', () => {
      // GitHub has internal capital - AH1 in "hub" produces "huhb"
      const result = translateSync('GitHub');
      expect(result).toBe('GitHuhb');
    });

    it('should translate GitHub with correct phonetics (t+h not θ)', () => {
      // GitHub = git + hub, the "th" should NOT become theta sound
      const ipa = translateSync('GitHub', { format: 'ipa' });
      expect(ipa).toContain('t'); // separate t
      expect(ipa).toContain('h'); // separate h
      expect(ipa).not.toContain('θ'); // NOT theta digraph
    });
  });

  describe('edge cases for coverage', () => {
    it('should handle word with leading apostrophe', () => {
      const result = translateSync("'xyz");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle words with only non-letter characters', () => {
      expect(translateSync('123')).toBe('123');
      expect(translateSync('!!!')).toBe('!!!');
    });

    it('should translate unknown words to IPA format', () => {
      // Unknown word in IPA format should return IPA characters
      const result = translateSync('xyzzy', { format: 'ipa' });
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // IPA result should contain non-ASCII characters
      expect(result).not.toMatch(/^[a-z]+$/i);
    });

    it('should use translateSyncWithMapping for token mapping', () => {
      const tokens = translateSyncWithMapping('Hello world');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]!.isWord).toBe(true);
      expect(tokens[1]!.isWord).toBe(false);
      expect(tokens[2]!.isWord).toBe(true);
    });
  });

  describe('non-word passthrough', () => {
    it.each(['ssssss', 'dddddddddd', 'hellooo', 'nooo'])(
      'should pass through "%s" with 3+ repeated characters',
      (word) => {
        // translateSyncWithMapping shows the raw word (without NOT_FOUND_MARKER)
        const tokens = translateSyncWithMapping(word);
        const wordToken = tokens.find((t) => t.isWord);
        expect(wordToken?.translated).toBe(word);
        expect(wordToken?.matched).toBe(false);
      }
    );

    it('should still translate dictionary words with 3+ repeated chars', () => {
      // oooh and hmmm are in CMU dictionary
      expect(translateSync('oooh')).not.toBe('oooh');
      expect(translateSync('hmmm')).not.toBe('hmmm');
    });

    it.each(['bcdfghjk', 'xkcd'])(
      'should pass through vowelless "%s" not in dictionary',
      (word) => {
        const tokens = translateSyncWithMapping(word);
        const wordToken = tokens.find((t) => t.isWord);
        expect(wordToken?.translated).toBe(word);
        expect(wordToken?.matched).toBe(false);
      }
    );

    it('should still translate dictionary words without vowels', () => {
      // hmm, shh, nth are in CMU dictionary
      expect(translateSync('hmm')).not.toBe('hmm');
      expect(translateSync('shh')).not.toBe('shh');
      expect(translateSync('nth')).not.toBe('nth');
    });

    it('should not affect normal words with doubled letters', () => {
      expect(translateSync('hello')).toBe('haloh');
      expect(translateSync('running')).toBe('ruhning');
      expect(translateSync('butter')).toBe('buhter');
    });
  });

  describe('URL and email preservation', () => {
    it('should preserve HTTP URLs unchanged', () => {
      const result = translateSync('Visit http://example.com today');
      expect(result).toContain('http://example.com');
    });

    it('should preserve HTTPS URLs unchanged', () => {
      const result = translateSync('Visit https://example.com/path?q=1 today');
      expect(result).toContain('https://example.com/path?q=1');
    });

    it('should preserve complex URLs with fragments and params', () => {
      const result = translateSync('See https://github.com/user/repo#readme for info');
      expect(result).toContain('https://github.com/user/repo#readme');
    });

    it('should preserve email addresses unchanged', () => {
      const result = translateSync('Contact foo@bar.com for help');
      expect(result).toContain('foo@bar.com');
    });

    it('should preserve complex email addresses', () => {
      const result = translateSync('Email user.name+tag@example.org now');
      expect(result).toContain('user.name+tag@example.org');
    });

    it('should translate surrounding text while preserving URLs', () => {
      const result = translateSync('Visit https://example.com today');
      expect(result).toBe('Vizit https://example.com taday');
    });

    it('should preserve multiple URLs and emails in same text', () => {
      const result = translateSync('See http://a.com and https://b.com or email x@y.com');
      expect(result).toContain('http://a.com');
      expect(result).toContain('https://b.com');
      expect(result).toContain('x@y.com');
    });

    it('should preserve URLs in translateSyncWithMapping', () => {
      const tokens = translateSyncWithMapping('Visit https://example.com');
      const urlToken = tokens.find((t) => t.original === 'https://example.com');
      expect(urlToken).toBeDefined();
      expect(urlToken?.translated).toBe('https://example.com');
      expect(urlToken?.isWord).toBe(false);
    });

    it('should preserve bare domains like google.com', () => {
      const result = translateSync('Visit google.com today');
      expect(result).toContain('google.com');
    });

    it('should preserve bare domains with paths', () => {
      const result = translateSync('See example.org/path?q=1 for info');
      expect(result).toContain('example.org/path?q=1');
    });

    it('should preserve various TLDs', () => {
      const result = translateSync('Check github.io and example.net and test.dev');
      expect(result).toContain('github.io');
      expect(result).toContain('example.net');
      expect(result).toContain('test.dev');
    });
  });

  describe('R-colored vowels', () => {
    it('should translate NEAR vowel words (IH+R → eer)', () => {
      expect(translateSync('beer')).toBe('beer');
      expect(translateSync('beard')).toBe('beerd');
      expect(translateSync('fear')).toBe('feer');
      expect(translateSync('near')).toBe('neer');
      expect(translateSync('deer')).toBe('deer');
      expect(translateSync('clear')).toBe('kleer');
    });

    it('should translate START vowel words (AA+R → ar)', () => {
      expect(translateSync('star')).toBe('star');
      expect(translateSync('car')).toBe('kar');
      expect(translateSync('far')).toBe('far');
    });

    it('should translate NORTH vowel words (AO+R → or)', () => {
      expect(translateSync('store')).toBe('stor');
      expect(translateSync('more')).toBe('mor');
      expect(translateSync('bore')).toBe('bor');
    });

    it('should translate SQUARE vowel words (EH+R → air)', () => {
      expect(translateSync('care')).toBe('kair');
      expect(translateSync('there')).toBe('dhair');
    });

    it('should translate words with TRAP before R (AE+R → arr)', () => {
      expect(translateSync('arrow')).toBe('arroh');
      expect(translateSync('barrow')).toBe('barroh');
      expect(translateSync('carrot')).toBe('karrat');
    });
  });

  describe('common word translations', () => {
    it('should translate NG cluster words', () => {
      expect(translateSync('think')).toBe('thingk');
    });

    it('should translate multi-syllable words', () => {
      expect(translateSync('beautiful')).toBe('byootafal');
    });

    it('should translate all vowel sounds', () => {
      expect(translateSync('hot')).toBe('hot'); // AA
      expect(translateSync('dog')).toBe('dawg'); // AO
      expect(translateSync('law')).toBe('law'); // AO
      expect(translateSync('cow')).toBe('kou'); // AW
      expect(translateSync('out')).toBe('out'); // AW
      expect(translateSync('bed')).toBe('bed'); // EH
      expect(translateSync('red')).toBe('red'); // EH
      expect(translateSync('day')).toBe('day'); // EY
      expect(translateSync('say')).toBe('say'); // EY
      expect(translateSync('see')).toBe('see'); // IY
      expect(translateSync('me')).toBe('mee'); // IY
      expect(translateSync('book')).toBe('buk'); // UH
      expect(translateSync('put')).toBe('put'); // UH
      expect(translateSync('boy')).toBe('boi'); // OY
      expect(translateSync('my')).toBe('mai'); // AY
      expect(translateSync('go')).toBe('goh'); // OW
      expect(translateSync('zoo')).toBe('zoo'); // UW
      expect(translateSync('cup')).toBe('kuhp'); // AH (stressed)
      expect(translateSync('love')).toBe('luhv'); // AH (stressed)
      expect(translateSync('buzz')).toBe('buhz'); // AH (stressed)
    });

    it('should translate all consonant sounds', () => {
      expect(translateSync('go')).toBe('goh'); // G
      expect(translateSync('pen')).toBe('pen'); // P
      expect(translateSync('she')).toBe('shee'); // SH
      expect(translateSync('fish')).toBe('fish'); // SH
      expect(translateSync('very')).toBe('vairee'); // V
      expect(translateSync('zoo')).toBe('zoo'); // Z
      expect(translateSync('measure')).toBe('mezher'); // ZH
      expect(translateSync('jump')).toBe('juhmp'); // JH, M, P
      expect(translateSync('yes')).toBe('yes'); // Y (before non-UW vowel)
      expect(translateSync('not')).toBe('not'); // N
      expect(translateSync('bat')).toBe('bat'); // B
    });
  });

  describe('British spelling handling', () => {
    it('should convert -our → -or (colour)', () => {
      expect(translateSync('colour')).toBe('kuhler');
    });

    it('should convert -ise → -ize (realise)', () => {
      expect(translateSync('realise')).toBe('reealaiz');
    });

    it('should convert -re → -er (centre)', () => {
      expect(translateSync('centre')).toBe('senter');
    });

    it('should convert -isation → -ization', () => {
      expect(translateSync('organisation')).toBe('organizayshan');
    });

    it('should convert -ence → -ense (defence)', () => {
      expect(translateSync('defence')).toBe('difens');
    });

    it('should convert -ogue → -og (catalogue)', () => {
      expect(translateSync('catalogue')).toBe('katalawg');
    });

    it('should handle -oured suffix (favoured)', () => {
      expect(translateSync('favoured')).toBe('fayverd');
    });

    it('should convert -ey → -y (curtsey)', () => {
      expect(translateSync('curtsey')).toBe('kertsee');
    });

    it('should handle grey → gray', () => {
      expect(translateSync('grey')).toBe('gray');
    });
  });

  describe('stemming and morphology', () => {
    it('should handle -ly suffix', () => {
      expect(translateSync('quickly')).toBe('kwiklee');
    });

    it('should handle un- prefix', () => {
      expect(translateSync('unhappy')).toBe('anhapee');
    });

    it('should handle re- prefix', () => {
      expect(translateSync('rebuild')).toBe('reebild');
    });

    it('should handle i→y stem change', () => {
      expect(translateSync('loveliest')).toBe('luhvleeast');
      expect(translateSync('happily')).toBe('hapalee');
      expect(translateSync('easier')).toBe('eezee-er');
    });

    it('should handle -ify suffix', () => {
      expect(translateSync('uglify')).toBe('uhgleeifai');
    });

    it('should handle -ification suffix', () => {
      expect(translateSync('uglification')).toBe('uhgleeifikayshan');
    });

    it('should handle -ifying suffix', () => {
      expect(translateSync('uglifying')).toBe('uhgleeifaiing');
    });
  });

  describe('compound word splitting', () => {
    it('should split and translate compound words', () => {
      const result = translateSync('bedpost');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('IPA format for common words', () => {
    const WJ = '\u2060';

    it('should translate hello to IPA', () => {
      expect(translateSync('hello', { format: 'ipa' })).toBe(`hə${WJ}ˈ${WJ}loʊ`);
    });

    it('should translate world to IPA', () => {
      expect(translateSync('world', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}wɝld`);
    });

    it('should translate the to IPA', () => {
      expect(translateSync('the', { format: 'ipa' })).toBe('ðə');
    });

    it('should translate think to IPA', () => {
      expect(translateSync('think', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}θɪŋk`);
    });

    it('should translate beautiful to IPA', () => {
      expect(translateSync('beautiful', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bjutəfəl`);
    });

    it('should translate affricates (church, judge)', () => {
      expect(translateSync('church', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}tʃɝtʃ`);
      expect(translateSync('judge', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}dʒʌdʒ`);
    });

    it('should translate diphthongs (time, coin)', () => {
      expect(translateSync('time', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}taɪm`);
      expect(translateSync('coin', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}kɔɪn`);
    });

    it('should place secondary stress correctly (examination)', () => {
      expect(translateSync('examination', { format: 'ipa' })).toBe(
        `ɪɡ${WJ}ˌ${WJ}zæmə${WJ}ˈ${WJ}neɪʃən`
      );
    });

    it('should translate all vowel sounds to IPA', () => {
      expect(translateSync('hot', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}hɑt`); // AA → ɑ
      expect(translateSync('dog', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}dɔɡ`); // AO → ɔ
      expect(translateSync('out', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}aʊt`); // AW → aʊ
      expect(translateSync('bed', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bɛd`); // EH → ɛ
      expect(translateSync('see', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}si`); // IY → i
      expect(translateSync('book', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bʊk`); // UH → ʊ
    });

    it('should translate all consonant sounds to IPA', () => {
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

  describe('TranslateOptions API', () => {
    it('translateSync accepts options object with format', () => {
      const withOptions = translateSync('hello', { format: 'ipa' });
      expect(withOptions).toContain('h');
      expect(typeof withOptions).toBe('string');
    });

    it('translateSync defaults to ingglish format with empty options', () => {
      expect(translateSync('hello', {})).toBe('haloh');
    });

    it('translateSync throws for unknown foreign lang without loaded dict', () => {
      expect(() => translateSync('bonjour', { lang: 'fr' })).toThrow(
        /Dictionary for "fr" not loaded/
      );
    });

    it('translateSyncWithMapping throws for unknown foreign lang without loaded dict', () => {
      expect(() => translateSyncWithMapping('bonjour', { lang: 'fr' })).toThrow(
        /Dictionary for "fr" not loaded/
      );
    });

    it('translateSync ignores lang="en" (treats as English)', () => {
      expect(translateSync('hello', { lang: 'en' })).toBe('haloh');
    });

    it('translateSync ignores empty lang', () => {
      expect(translateSync('hello', { lang: '' })).toBe('haloh');
    });
  });

  describe('sentence-start capitalization for caseless scripts', () => {
    const MOCK_JA_LANG = 'test-ja';
    const mockJaDict: PhoneDict = {
      entries: {
        desu: ['D', 'EH1', 'S', 'UW0'],
        inu: ['IH1', 'N', 'UW0'],
        neko: ['N', 'EH1', 'K', 'OW0'],
      },
      lang: MOCK_JA_LANG,
      nonLatinScript: true,
    };

    it('translateSyncWithMapping capitalizes first word of each sentence', async () => {
      // Load the mock dict via setDictLoader + translate()
      setDictLoader(() => Promise.resolve(mockJaDict));
      await translate('neko', { lang: MOCK_JA_LANG });

      // Simulates pre-segmented Japanese text: "neko desu. inu desu."
      const tokens = translateSyncWithMapping('neko desu. inu desu.', {
        lang: MOCK_JA_LANG,
      });

      const words = tokens.filter((t) => t.isWord);
      // First sentence start: capitalized
      expect(words[0]!.translated.charAt(0)).toBe(words[0]!.translated.charAt(0).toUpperCase());
      // Second sentence start (after "."): capitalized
      expect(words[2]!.translated.charAt(0)).toBe(words[2]!.translated.charAt(0).toUpperCase());
      // Non-sentence-start words: lowercase
      expect(words[1]!.translated.charAt(0)).toBe(words[1]!.translated.charAt(0).toLowerCase());
    });

    it('translateSync also capitalizes sentence starts for caseless scripts', () => {
      // Dict already loaded from previous test
      const result = translateSync('neko desu. inu desu.', {
        lang: MOCK_JA_LANG,
      });

      // First word capitalized
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
      // Word after period capitalized
      const afterPeriod = result.split('. ')[1]!;
      expect(afterPeriod.charAt(0)).toBe(afterPeriod.charAt(0).toUpperCase());
    });

    it('single word stays lowercase in translateSyncWithMapping', () => {
      const tokens = translateSyncWithMapping('neko', {
        lang: MOCK_JA_LANG,
      });
      const word = tokens.find((t) => t.isWord);
      // Single word: no capitalization
      expect(word!.translated.charAt(0)).toBe(word!.translated.charAt(0).toLowerCase());
    });
  });
});
