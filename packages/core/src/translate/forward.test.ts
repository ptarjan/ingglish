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
    it.each([
      ['hello', 'haloh', 'common word'],
      ['world', 'werld', 'common word'],
      ['Hello', 'Haloh', 'preserves capitalization'],
      ['splonk', 'splongk', 'unknown word G2P fallback'],
      ['url', 'url', 'dictionary word'],
    ])('translates %s → %s (%s)', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('translateSync', () => {
    it.each([
      ['hello world', 'Haloh werld', 'multiple words with sentence-start cap'],
      ['hello   world', 'Haloh   werld', 'preserves whitespace'],
      ['hello 123 world', 'Haloh 123 werld', 'preserves numbers'],
      ['', '', 'empty string'],
      ['Hello, World! How are you?', 'Haloh, Werld! Hou ar yoo?', 'mixed content'],
      ['hello. world', 'Haloh. Werld', 'sentence capitalization after period'],
      ['stop! go now.', 'Stop! Goh nou.', 'sentence capitalization after !'],
      ['résumé', 'rezamay', 'diacritics as pronunciation signal'],
      ['resume', 'rizoom', 'unaccented homograph'],
      ['China\u2019s economy', 'Chainaz ikonamee', 'curly apostrophe possessive'],
      ['I went home.', 'Ai went hohm.', 'I at sentence start'],
      ['Then I left.', 'Dhen ai left.', 'I mid-sentence'],
      ['Hello. I am here.', 'Haloh. Ai am heer.', 'I after period'],
      ['Really? I think so.', 'Rilee? Ai thingk soh.', 'I after question mark'],
    ])('translates "%s" → "%s" (%s)', (input, expected) => {
      expect(translateSync(input)).toBe(expected);
    });

    it('should preserve punctuation in IPA output', () => {
      const result = translateSync('Hello, world!', { format: 'ipa' });
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should normalize curly apostrophes', () => {
      expect(translateSync('don\u2019t')).toBe(translateSync("don't"));
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
  });

  describe('contraction edge cases', () => {
    it.each([
      ["y'all", 'yawl', 'apostrophe fallback'],
      ["John's", 'Jonz', 'possessive'],
      ["'twas", "'twuhz", 'leading apostrophe preserved as separator'],
      ["DON'T", 'DOHNT', 'all caps preserved'],
      ["foo't", 'footee', 'not in dictionary, apostrophe splitting'],
    ])('translates %s → %s (%s)', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('case preservation for unknown words', () => {
    it.each([
      ['KUBERNETES', 'KUBERNETES', 'all caps passthrough'],
      ['Kubernetes', 'Kyoobernets', 'title case'],
      ['GitHub', 'GitHuhb', 'mixed case compound'],
    ])('translates %s → %s (%s)', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });

    it('should translate GitHub with correct phonetics (t+h not θ)', () => {
      const ipa = translateSync('GitHub', { format: 'ipa' });
      expect(ipa).not.toContain('θ'); // NOT theta digraph
    });
  });

  describe('edge cases for coverage', () => {
    it("preserves a leading quote apostrophe: 'xyz → 'ziz", () => {
      // The apostrophe stays a separator token; "xyz" alone goes through
      // G2P (word-initial x → /z/ as in xylophone).
      expect(translateSync("'xyz")).toBe("'ziz");
    });

    it('passes through a lowercase initialism the dictionary does not know', () => {
      expect(translateSync('gif')).toBe('gif');
    });

    it('lets a word reading win when it differs from the letter spelling at equal length', () => {
      // CMU pronounces "gps" with a hard G (G IY1 P IY0 EH1 S) — same
      // phoneme count as the letter spelling (JH IY1 ...) but not equal,
      // so the dictionary reading wins over the initialism passthrough.
      expect(translateSync('gps')).toBe('geepee-es');
    });

    it.each(['123', '!!!'])('should pass through non-letter "%s" unchanged', (input) => {
      expect(translateSync(input)).toBe(input);
    });

    it('should translate unknown words to IPA format', () => {
      expect(translateSync('xyzzy', { format: 'ipa' })).toBe('\u2060\u02C8\u2060z\u026Azi');
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
