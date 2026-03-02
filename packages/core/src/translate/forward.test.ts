import { describe, it, expect, vi } from 'vitest';
import { loadDictionary, isDictionaryLoaded, lookupPronunciation } from '@ingglish/dictionary';
import * as dictModule from '@ingglish/dictionary';
import type { IpaDict } from '@ingglish/ipa';
import { reverseTranslate, setDictLoader, translate } from '../index';
import type { DictLoader } from '../ipa-dict';
import { getLangDict } from '../ipa-dict';
import { translateSync, translateSyncWithMapping, translateWord } from './forward';

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
    const mockDict: IpaDict = {
      entries: { bonjour: '/bɔ̃.ʒuʁ/' },
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

    it('should handle contractions not in dictionary via fallback', () => {
      // Made-up contraction that won't be in CMU dictionary
      const result = translateWord("foo't");
      expect(result).toBeDefined();
      expect(result).toContain("'");
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
    it('should handle contraction with leading apostrophe via fallback', () => {
      const result = translateWord("'xyz");
      expect(result).toBeDefined();
      expect(result).toContain("'");
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
      expect(tokens[0]!.translated).toBe('haloh');
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
});
