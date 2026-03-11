import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import * as dictModule from '@ingglish/dictionary';
import { convertIpaEntries, getLanguage } from '@ingglish/ipa';
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
    const result = await translate('bonjour', { lang: 'fr' });
    expect(result).toBeTruthy();

    // Sync should work after async load
    const syncResult = translateSync('bonjour', { lang: 'fr' });
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

    // Restore the file-based dict loader for subsequent tests
    const dictDir = path.resolve(
      import.meta.dirname,
      '..',
      '..',
      '..',
      'website',
      'public',
      'ipa-dicts'
    );
    setDictLoader(async (lang) => {
      const json = await readFile(path.resolve(dictDir, `${lang}.json`), 'utf8');
      const raw = JSON.parse(json) as Record<string, string | string[]>;
      const langMeta = getLanguage(lang);
      return {
        conventionalCapitals: langMeta?.conventionalCapitals,
        disableRColoring: langMeta?.disableRColoring,
        entries: convertIpaEntries(raw, lang),
        lang,
        nonLatinScript: langMeta?.nonLatinScript,
        preprocess: langMeta?.preprocess,
      };
    });
  });
});

describe('translator', () => {
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

    it.each([
      ['naïve', 'naive'],
      ['café', 'cafe'],
      ['cliché', 'cliche'],
    ])('strips diacritics: %s → same as %s', (accented, plain) => {
      expect(translateSync(accented)).toBe(translateSync(plain));
    });

    it.each([
      ['I', 'ai'],
      ["I'm", 'aim'],
      ["I'll", 'ail'],
      ["I've", 'aiv'],
      ["I'd", 'aid'],
      ['i', 'ai'],
    ])('treats "%s" as lowercase → %s', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
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

    it.each(['123', '!!!'])('should pass through non-letter "%s" unchanged', (input) => {
      expect(translateSync(input)).toBe(input);
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

    it.each(['oooh', 'hmmm'])(
      'should still translate dict word "%s" with 3+ repeated chars',
      (word) => {
        expect(translateSync(word)).not.toBe(word);
      }
    );

    it.each(['bcdfghjk', 'xkcd'])(
      'should pass through vowelless "%s" not in dictionary',
      (word) => {
        const tokens = translateSyncWithMapping(word);
        const wordToken = tokens.find((t) => t.isWord);
        expect(wordToken?.translated).toBe(word);
        expect(wordToken?.matched).toBe(false);
      }
    );

    it.each(['hmm', 'shh', 'nth'])('should still translate vowelless dict word "%s"', (word) => {
      expect(translateSync(word)).not.toBe(word);
    });

    it.each([
      ['running', 'ruhning'],
      ['butter', 'buhter'],
    ])('should not affect normal word "%s" with doubled letters', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('URL and email preservation', () => {
    it.each([
      ['Visit http://example.com today', 'http://example.com', 'HTTP URL'],
      ['Visit https://example.com/path?q=1 today', 'https://example.com/path?q=1', 'HTTPS URL'],
      [
        'See https://github.com/user/repo#readme for info',
        'https://github.com/user/repo#readme',
        'URL with fragment',
      ],
      ['Contact foo@bar.com for help', 'foo@bar.com', 'email address'],
      ['Email user.name+tag@example.org now', 'user.name+tag@example.org', 'complex email'],
      ['Visit google.com today', 'google.com', 'bare domain'],
      ['See example.org/path?q=1 for info', 'example.org/path?q=1', 'bare domain with path'],
    ])('preserves %s unchanged (%s)', (input, preserved) => {
      const result = translateSync(input);
      expect(result).toContain(preserved);
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

    it('translateSync defaults to ingglish format with empty options', () => {
      expect(translateSync('hello', {})).toBe('haloh');
    });

    it('translateSync throws for unknown foreign lang without loaded dict', () => {
      expect(() => translateSync('bonjour', { lang: 'zz-unloaded' })).toThrow(
        /Dictionary for "zz-unloaded" not loaded/
      );
    });

    it('translateSyncWithMapping throws for unknown foreign lang without loaded dict', () => {
      expect(() => translateSyncWithMapping('bonjour', { lang: 'zz-unloaded' })).toThrow(
        /Dictionary for "zz-unloaded" not loaded/
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
    it('translateSyncWithMapping capitalizes first word of each sentence', async () => {
      // Load the real Japanese dict
      await translate('猫', { lang: 'ja' });

      // Real Japanese words: 猫 (neko/cat), 花 (hana/flower), 犬 (inu/dog)
      const tokens = translateSyncWithMapping('猫 花. 犬 花.', {
        lang: 'ja',
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
      const result = translateSync('猫 花. 犬 花.', {
        lang: 'ja',
      });

      // First word capitalized
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
      // Word after period capitalized
      const afterPeriod = result.split('. ')[1]!;
      expect(afterPeriod.charAt(0)).toBe(afterPeriod.charAt(0).toUpperCase());
    });

    it('single word stays lowercase in translateSyncWithMapping', () => {
      const tokens = translateSyncWithMapping('猫', {
        lang: 'ja',
      });
      const word = tokens.find((t) => t.isWord);
      // Single word: no capitalization
      expect(word!.translated.charAt(0)).toBe(word!.translated.charAt(0).toLowerCase());
    });
  });
});
