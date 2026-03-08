import { describe, it, expect, vi } from 'vitest';
import { loadDictionary, isDictionaryLoaded, lookupPronunciation } from '@ingglish/dictionary';
import * as dictModule from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import type { DictLoader } from '../dict-loader';
import { getLangDict, setLangDict } from '../dict-loader';
import {
  reverseTranslate,
  setDictLoader,
  translate,
  translateSync,
  translateSyncWithMapping,
} from '../index';
import { translateWord } from './forward';

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

    // Dict should now be cached
    expect(getLangDict('test-fr')).toBe(mockDict);

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
    setDictLoader(undefined as unknown as DictLoader);
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

  describe('translateWord', () => {
    it('should translate common words', () => {
      // hello = HH AH0 L OW1 -> haloh (American pronunciation)
      expect(translateWord('hello')).toBe('haloh');
      expect(translateWord('world')).toBe('werld');
    });

    it('should preserve capitalization', () => {
      const hello = translateWord('hello');
      expect(translateWord('Hello')).toBe(hello.charAt(0).toUpperCase() + hello.slice(1));
    });

    it('should pass through all-caps words unchanged', () => {
      // All-caps words (≥2 chars) pass through as acronyms/emphasis
      expect(translateWord('HELLO')).toBe('HELLO');
    });

    it('should handle unknown words with fallback', () => {
      // Unknown words use G2P rules to produce a phonetic translation
      // Exact G2P results are covered by 134+ tests in unknown-words.test.ts
      const result = translateWord('splonk');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('splonk'); // Should be transformed by G2P
    });

    it('should translate url from dictionary', () => {
      // "url" is in CMU dictionary
      expect(translateWord('url')).toBe('url');
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

    it('should handle only punctuation', () => {
      expect(translateSync('!!!')).toBe('!!!');
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
      const result = translateWord("DON'T");
      expect(result).toBe(result.toUpperCase());
    });

    it('should handle contractions not in dictionary via apostrophe splitting', () => {
      // Made-up contraction — apostrophe splitting finds foo + t individually
      const result = translateWord("foo't");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('case preservation for unknown words', () => {
    it('should preserve all caps on unknown words', () => {
      // KUBERNETES is not in CMU dictionary
      const result = translateWord('KUBERNETES');
      expect(result).toBe(result.toUpperCase());
    });

    it('should preserve title case on unknown words', () => {
      // Kubernetes is not in CMU dictionary
      const result = translateWord('Kubernetes');
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
      expect(result.slice(1)).toBe(result.slice(1).toLowerCase());
    });

    it('should preserve mixed case on unknown words like GitHub', () => {
      // GitHub has internal capital - AH1 in "hub" produces "huhb"
      const result = translateWord('GitHub');
      expect(result).toBe('GitHuhb');
    });

    it('should translate GitHub with correct phonetics (t+h not θ)', () => {
      // GitHub = git + hub, the "th" should NOT become theta sound
      const ipa = translateWord('GitHub', { format: 'ipa' });
      expect(ipa).toContain('t'); // separate t
      expect(ipa).toContain('h'); // separate h
      expect(ipa).not.toContain('θ'); // NOT theta digraph
    });
  });

  describe('edge cases for coverage', () => {
    it('should handle word with leading apostrophe', () => {
      const result = translateWord("'xyz");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle words with only non-letter characters', () => {
      expect(translateWord('123')).toBe('123');
      expect(translateWord('!!!')).toBe('!!!');
    });

    it('should translate unknown words to IPA format', () => {
      // Unknown word in IPA format should return IPA characters
      const result = translateWord('xyzzy', { format: 'ipa' });
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // IPA result should contain non-ASCII characters
      expect(result).not.toMatch(/^[a-z]+$/i);
    });

    it('should use translateSyncWithMapping for token mapping', async () => {
      // Test the mapping function used by DOM translator
      const { translateSyncWithMapping } = await import('./forward');
      const tokens = translateSyncWithMapping('Hello world', { format: 'ingglish' });
      expect(tokens).toHaveLength(3);
      expect(tokens[0]!.isWord).toBe(true);
      expect(tokens[1]!.isWord).toBe(false);
      expect(tokens[2]!.isWord).toBe(true);
    });
  });

  describe('non-word passthrough', () => {
    it('should pass through words with 3+ repeated characters', () => {
      expect(translateWord('ssssss')).toBe('ssssss');
      expect(translateWord('dddddddddd')).toBe('dddddddddd');
      expect(translateWord('hellooo')).toBe('hellooo');
      expect(translateWord('nooo')).toBe('nooo');
    });

    it('should still translate dictionary words with 3+ repeated chars', () => {
      // oooh and hmmm are in CMU dictionary
      expect(translateWord('oooh')).not.toBe('oooh');
      expect(translateWord('hmmm')).not.toBe('hmmm');
    });

    it('should pass through vowelless strings not in dictionary', () => {
      expect(translateWord('bcdfghjk')).toBe('bcdfghjk');
      expect(translateWord('xkcd')).toBe('xkcd');
    });

    it('should still translate dictionary words without vowels', () => {
      // hmm, shh, nth are in CMU dictionary
      expect(translateWord('hmm')).not.toBe('hmm');
      expect(translateWord('shh')).not.toBe('shh');
      expect(translateWord('nth')).not.toBe('nth');
    });

    it('should not affect normal words with doubled letters', () => {
      expect(translateWord('hello')).toBe('haloh');
      expect(translateWord('running')).toBe('ruhning');
      expect(translateWord('butter')).toBe('buhter');
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

    it('should preserve URLs in translateSyncWithMapping', async () => {
      const { translateSyncWithMapping } = await import('./forward');
      const tokens = translateSyncWithMapping('Visit https://example.com', { format: 'ingglish' });
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
      expect(translateWord('beer')).toBe('beer');
      expect(translateWord('beard')).toBe('beerd');
      expect(translateWord('fear')).toBe('feer');
      expect(translateWord('near')).toBe('neer');
      expect(translateWord('deer')).toBe('deer');
      expect(translateWord('clear')).toBe('kleer');
    });

    it('should translate START vowel words (AA+R → ar)', () => {
      expect(translateWord('star')).toBe('star');
      expect(translateWord('car')).toBe('kar');
      expect(translateWord('far')).toBe('far');
    });

    it('should translate NORTH vowel words (AO+R → or)', () => {
      expect(translateWord('store')).toBe('stor');
      expect(translateWord('more')).toBe('mor');
      expect(translateWord('bore')).toBe('bor');
    });

    it('should translate SQUARE vowel words (EH+R → air)', () => {
      expect(translateWord('care')).toBe('kair');
      expect(translateWord('there')).toBe('dhair');
    });

    it('should translate words with TRAP before R (AE+R → arr)', () => {
      expect(translateWord('arrow')).toBe('arroh');
      expect(translateWord('barrow')).toBe('barroh');
      expect(translateWord('carrot')).toBe('karrat');
    });
  });

  describe('common word translations', () => {
    it('should translate NG cluster words', () => {
      expect(translateWord('think')).toBe('thingk');
    });

    it('should translate multi-syllable words', () => {
      expect(translateWord('beautiful')).toBe('byootafal');
    });

    it('should translate all vowel sounds', () => {
      expect(translateWord('hot')).toBe('hot'); // AA
      expect(translateWord('dog')).toBe('dawg'); // AO
      expect(translateWord('law')).toBe('law'); // AO
      expect(translateWord('cow')).toBe('kou'); // AW
      expect(translateWord('out')).toBe('out'); // AW
      expect(translateWord('bed')).toBe('bed'); // EH
      expect(translateWord('red')).toBe('red'); // EH
      expect(translateWord('day')).toBe('day'); // EY
      expect(translateWord('say')).toBe('say'); // EY
      expect(translateWord('see')).toBe('see'); // IY
      expect(translateWord('me')).toBe('mee'); // IY
      expect(translateWord('book')).toBe('buk'); // UH
      expect(translateWord('put')).toBe('put'); // UH
      expect(translateWord('boy')).toBe('boi'); // OY
      expect(translateWord('my')).toBe('mai'); // AY
      expect(translateWord('go')).toBe('goh'); // OW
      expect(translateWord('zoo')).toBe('zoo'); // UW
      expect(translateWord('cup')).toBe('kuhp'); // AH (stressed)
      expect(translateWord('love')).toBe('luhv'); // AH (stressed)
      expect(translateWord('buzz')).toBe('buhz'); // AH (stressed)
    });

    it('should translate all consonant sounds', () => {
      expect(translateWord('go')).toBe('goh'); // G
      expect(translateWord('pen')).toBe('pen'); // P
      expect(translateWord('she')).toBe('shee'); // SH
      expect(translateWord('fish')).toBe('fish'); // SH
      expect(translateWord('very')).toBe('vairee'); // V
      expect(translateWord('zoo')).toBe('zoo'); // Z
      expect(translateWord('measure')).toBe('mezher'); // ZH
      expect(translateWord('jump')).toBe('juhmp'); // JH, M, P
      expect(translateWord('yes')).toBe('yes'); // Y (before non-UW vowel)
      expect(translateWord('not')).toBe('not'); // N
      expect(translateWord('bat')).toBe('bat'); // B
    });
  });

  describe('British spelling handling', () => {
    it('should convert -our → -or (colour)', () => {
      expect(translateWord('colour')).toBe('kuhler');
    });

    it('should convert -ise → -ize (realise)', () => {
      expect(translateWord('realise')).toBe('reealaiz');
    });

    it('should convert -re → -er (centre)', () => {
      expect(translateWord('centre')).toBe('senter');
    });

    it('should convert -isation → -ization', () => {
      expect(translateWord('organisation')).toBe('organizayshan');
    });

    it('should convert -ence → -ense (defence)', () => {
      expect(translateWord('defence')).toBe('difens');
    });

    it('should convert -ogue → -og (catalogue)', () => {
      expect(translateWord('catalogue')).toBe('katalawg');
    });

    it('should handle -oured suffix (favoured)', () => {
      expect(translateWord('favoured')).toBe('fayverd');
    });

    it('should convert -ey → -y (curtsey)', () => {
      expect(translateWord('curtsey')).toBe('kertsee');
    });

    it('should handle grey → gray', () => {
      expect(translateWord('grey')).toBe('gray');
    });
  });

  describe('stemming and morphology', () => {
    it('should handle -ly suffix', () => {
      expect(translateWord('quickly')).toBe('kwiklee');
    });

    it('should handle un- prefix', () => {
      expect(translateWord('unhappy')).toBe('anhapee');
    });

    it('should handle re- prefix', () => {
      expect(translateWord('rebuild')).toBe('reebild');
    });

    it('should handle i→y stem change', () => {
      expect(translateWord('loveliest')).toBe('luhvleeast');
      expect(translateWord('happily')).toBe('hapalee');
      expect(translateWord('easier')).toBe('eezee-er');
    });

    it('should handle -ify suffix', () => {
      expect(translateWord('uglify')).toBe('uhgleeifai');
    });

    it('should handle -ification suffix', () => {
      expect(translateWord('uglification')).toBe('uhgleeifikayshan');
    });

    it('should handle -ifying suffix', () => {
      expect(translateWord('uglifying')).toBe('uhgleeifaiing');
    });
  });

  describe('compound word splitting', () => {
    it('should split and translate compound words', () => {
      const result = translateWord('bedpost');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('IPA format for common words', () => {
    const WJ = '\u2060';

    it('should translate hello to IPA', () => {
      expect(translateWord('hello', { format: 'ipa' })).toBe(`hə${WJ}ˈ${WJ}loʊ`);
    });

    it('should translate world to IPA', () => {
      expect(translateWord('world', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}wɝld`);
    });

    it('should translate the to IPA', () => {
      expect(translateWord('the', { format: 'ipa' })).toBe('ðə');
    });

    it('should translate think to IPA', () => {
      expect(translateWord('think', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}θɪŋk`);
    });

    it('should translate beautiful to IPA', () => {
      expect(translateWord('beautiful', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bjutəfəl`);
    });

    it('should translate affricates (church, judge)', () => {
      expect(translateWord('church', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}tʃɝtʃ`);
      expect(translateWord('judge', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}dʒʌdʒ`);
    });

    it('should translate diphthongs (time, coin)', () => {
      expect(translateWord('time', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}taɪm`);
      expect(translateWord('coin', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}kɔɪn`);
    });

    it('should place secondary stress correctly (examination)', () => {
      expect(translateWord('examination', { format: 'ipa' })).toBe(
        `ɪɡ${WJ}ˌ${WJ}zæmə${WJ}ˈ${WJ}neɪʃən`
      );
    });

    it('should translate all vowel sounds to IPA', () => {
      expect(translateWord('hot', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}hɑt`); // AA → ɑ
      expect(translateWord('dog', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}dɔɡ`); // AO → ɔ
      expect(translateWord('out', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}aʊt`); // AW → aʊ
      expect(translateWord('bed', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bɛd`); // EH → ɛ
      expect(translateWord('see', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}si`); // IY → i
      expect(translateWord('book', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}bʊk`); // UH → ʊ
    });

    it('should translate all consonant sounds to IPA', () => {
      expect(translateWord('pen', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}pɛn`); // P → p
      expect(translateWord('red', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}ɹɛd`); // R → ɹ
      expect(translateWord('say', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}seɪ`); // S → s
      expect(translateWord('very', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}vɛɹi`); // V → v
      expect(translateWord('measure', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}mɛʒɝ`); // ZH → ʒ
      expect(translateWord('go', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}ɡoʊ`); // G → ɡ
      expect(translateWord('yes', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}jɛs`); // Y → j
      expect(translateWord('she', { format: 'ipa' })).toBe(`${WJ}ˈ${WJ}ʃi`); // SH → ʃ
    });
  });

  describe('TranslateOptions API', () => {
    it('translateSync accepts options object with format', () => {
      const withOptions = translateSync('hello', { format: 'ipa' });
      expect(withOptions).toContain('h');
      expect(typeof withOptions).toBe('string');
    });

    it('translateSync defaults to ingglish format', () => {
      expect(translateSync('hello')).toBe('haloh');
      expect(translateSync('hello', {})).toBe('haloh');
    });

    it('translateSyncWithMapping accepts options object', () => {
      const tokens = translateSyncWithMapping('hello world', { format: 'ingglish' });
      expect(tokens).toHaveLength(3);
      // First word of multi-word text is capitalized (sentence start)
      expect(tokens[0]!.translated).toBe('Haloh');
    });

    it('translateWord accepts options object with format', () => {
      const withOptions = translateWord('hello', { format: 'ingglish' });
      expect(withOptions).toBe('haloh');
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

    it('translateWord throws for unknown foreign lang without loaded dict', () => {
      expect(() => translateWord('bonjour', { lang: 'fr' })).toThrow(
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

    // Pre-register the mock dict (preprocessor not needed — test uses pre-segmented text)
    setLangDict(MOCK_JA_LANG, mockJaDict);

    it('translateSyncWithMapping capitalizes first word of each sentence', () => {
      // Simulates pre-segmented Japanese text: "neko desu. inu desu."
      const tokens = translateSyncWithMapping('neko desu. inu desu.', {
        format: 'ingglish',
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
      const result = translateSync('neko desu. inu desu.', {
        format: 'ingglish',
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
        format: 'ingglish',
        lang: MOCK_JA_LANG,
      });
      const word = tokens.find((t) => t.isWord);
      // Single word: no capitalization
      expect(word!.translated.charAt(0)).toBe(word!.translated.charAt(0).toLowerCase());
    });
  });
});
