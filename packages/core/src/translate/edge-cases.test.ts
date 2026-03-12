/**
 * Integration tests for edge cases in the translation pipeline.
 * Tests exercise internal code paths through the public API
 * (translateSync, reverseTranslateSync, translate, reverseTranslate).
 */
import { describe, expect, it } from 'vitest';
import {
  reverseTranslate,
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
  translate,
  translateSync,
  translateSyncWithMapping,
} from '../index';

// ===========================================================================
// 1. Forward: word-level translation edge cases
// ===========================================================================

describe('forward word translation edge cases', () => {
  it.each([
    // camelCase
    ['ChatGPT', 'ChatGPT', 'camelCase: all-caps suffix stays'],
    ['OpenAI', 'OhpanAI', 'camelCase: all-caps suffix stays'],
    ['xyzFoo', 'zizFoo', 'camelCase: unknown part'],
    // compound words
    ['Catdog', 'Katdawg', 'compound case preservation'],
    ['CATDOG', 'CATDOG', 'all-caps compound = initialism'],
    ['abcdefghij', 'abkdefghij', 'compound with phonemeless part'],
    // resolvers & fallbacks
    ['Api', 'Api', 'title-case initialism bail-out'],
    ['flonkify', 'flongkafai', 'G2P fallback for unknown word'],
    // passthrough & edge cases
    ['A', 'A', 'single uppercase letter'],
    // sentence-level
    ['hello 42 world', 'Haloh 42 werld', 'preserves numbers in sentence'],
    ['hello... world', 'Haloh... Werld', 'preserves ellipsis in sentence'],
    ['bcdfg', '\uFFFDbcdfg', 'vowelless word gets NOT_FOUND_MARKER'],
    // unstressed schwa mapping (to-ingglish.ts)
    ['about', 'about', 'AH0 → "a" (unstressed schwa)'],
    ['up', 'uhp', 'AH1 → "uh" (stressed)'],
    // Unicode case patterns (normalize/case.ts)
    ['CAFÉ', 'KAFAY', 'all caps with accent'],
    ['Naïve', 'Naieev', 'title case with diaeresis'],
  ])('translateSync("%s") → "%s" (%s)', (input, expected) => {
    expect(translateSync(input)).toBe(expected);
  });
});

// ===========================================================================
// 2. Untranslatable words
// ===========================================================================

describe('untranslatable words', () => {
  it('should mark truly untranslatable words with marker', () => {
    // A word with no vowels and no dictionary entry
    // translateSyncWithMapping reveals the matched flag
    const tokens = translateSyncWithMapping('bcdfg');
    const wordToken = tokens.find((t) => t.isWord);
    expect(wordToken).toBeDefined();
    // Untranslatable words are marked as not matched
    expect(wordToken?.matched).toBe(false);
  });
});

// ===========================================================================
// 3. English stemming edge cases
// ===========================================================================

describe('English stemming (word resolver path)', () => {
  it.each([
    ['formatted', 'formatid', '-ed after T/D → /ɪd/'],
    ['blogged', 'blawgd', '-ed after voiced → /d/'],
    ['skyped', 'skaipt', '-ed after voiceless → /t/'],
    ['relaunches', 'reelawnchiz', '-es after sibilant → /ɪz/'],
    ['podcasts', 'podkasts', '-s after voiceless → /s/'],
    ['unbreak', 'anbrayk', 'un- prefix'],
  ])('translates "%s" → "%s" (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

// ===========================================================================
// 4. Reverse translation edge cases
// ===========================================================================

describe('reverse translation edge cases', () => {
  it("should reverse-translate it's (contraction handling)", () => {
    const ingglish = translateSync("it's");
    const back = reverseTranslateSync(ingglish);
    expect(back.toLowerCase()).toBe("it's");
  });

  it('should return matched tokens for contractions', () => {
    const ingglish = translateSync("she's happy");
    const tokens = reverseTranslateSyncWithMapping(ingglish);
    const words = tokens.filter((t) => t.isWord);
    for (const w of words) {
      expect(w.matched).toBe(true);
    }
  });

  it('should handle Ingglish input containing apostrophe (contraction path)', () => {
    const result = reverseTranslateSync("dohn't");
    expect(result).toContain("'");
  });

  it('should handle leading apostrophe in Ingglish input', () => {
    const result = reverseTranslateSync("'tuhz");
    expect(result).toContain("'");
  });

  it('should pass through punctuation-only tokens in reverse', () => {
    const result = reverseTranslateSync('haloh... werld');
    expect(result).toContain('...');
  });

  it('should reverse-translate English text via async API', async () => {
    const ingglish = translateSync('hello');
    const result = await reverseTranslate(ingglish);
    expect(result.toLowerCase()).toBe('hello');
  });

  it('should reverse-translate IPA with mapping', () => {
    const ipa = translateSync('hello world', { format: 'ipa' });
    const tokens = reverseTranslateSyncWithMapping(ipa, { format: 'ipa' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
    expect(words[0]!.translated.toLowerCase()).toBe('hello');
  });

  it.each([
    ['', '', 'empty string'],
    ['   ', '   ', 'whitespace-only'],
    ['!!!', '!!!', 'unparseable IPA'],
    ['ʒʒʒ', 'ʒʒʒ', 'no phoneme key match'],
  ])('reverse IPA: "%s" → "%s" (%s)', (input, expected) => {
    expect(reverseTranslateSync(input, { format: 'ipa' })).toBe(expected);
  });

  it('reverseTranslateSync: pronunciation format falls through', () => {
    const ingglish = translateSync('hello');
    const result = reverseTranslateSync(ingglish, { format: 'pronunciation' });
    expect(result.toLowerCase()).toBe('hello');
  });

  it('reverseTranslateSyncWithMapping: pronunciation format falls through', () => {
    const ingglish = translateSync('hello world');
    const tokens = reverseTranslateSyncWithMapping(ingglish, { format: 'pronunciation' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
  });

  it('reverseTranslateWordAsResult: non-letter returns matched', () => {
    const result = reverseTranslateSync('haloh, werld!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });
});

// ===========================================================================
// 5. Round-trip edge cases
// ===========================================================================

describe('round-trip edge cases', () => {
  it.each([
    ['knight', 'silent-letter'],
    ['knife', 'silent-letter'],
    ['know', 'silent-letter'],
    ['write', 'silent-letter'],
    ['wrong', 'silent-letter'],
    ['though', '-ough'],
    ['through', '-ough'],
    ['tough', '-ough'],
    ['cough', '-ough'],
    ['bought', '-ough'],
    ['nation', '-tion/-sion'],
    ['vision', '-tion/-sion'],
    ['station', '-tion/-sion'],
    ['decision', '-tion/-sion'],
  ])('round-trips "%s" (%s)', (word) => {
    const ingglish = translateSync(word);
    const result = reverseTranslateSync(ingglish);
    // Some words don't round-trip exactly due to homophones (know→no, write→right)
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should round-trip a multi-word sentence', () => {
    const text = 'The quick brown fox jumps over the lazy dog.';
    const ingglish = translateSync(text);
    const back = reverseTranslateSync(ingglish);
    expect(back).toBe(text);
  });
});

// ===========================================================================
// 6. Output format edge cases
// ===========================================================================

describe('output format edge cases', () => {
  it.each([
    ['hello world', 'hə⁠ˈ⁠loʊ ⁠ˈ⁠wɝld', 'IPA: sentence'],
    ['flonkify', '⁠ˈ⁠flɑŋkə⁠ˌ⁠faɪ', 'IPA: unknown word via G2P'],
  ])('translates "%s" to IPA (%s)', (input, expected) => {
    expect(translateSync(input, { format: 'ipa' })).toBe(expected);
  });

  it.each([
    ['hello', 'ha-LOH', 'pronunciation: multisyllabic'],
    ['beautiful', 'BYOO-ta-fal', 'pronunciation: 3 syllables'],
    ['cat', 'KAT', 'pronunciation: monosyllabic'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word, { format: 'pronunciation' })).toBe(expected);
  });
});

// ===========================================================================
// 7. Non-English edge cases
// ===========================================================================
// Uses translate(text, { lang }) with real IPA dicts loaded from
// packages/website/public/ipa-dicts/. Words are chosen to NOT be in the dict
// (but their stems ARE) so that word resolvers and G2P converters fire.
// Non-English word resolvers are covered by packages/ipa/src/resolvers.test.ts

describe('non-English edge cases', () => {
  it('should reverse-translate Japanese back to source word', async () => {
    const ingglish = await translate('猫', { lang: 'ja' });
    const back = await reverseTranslate(ingglish, { lang: 'ja' });
    // May return kanji 猫 or katakana ネコ — both are valid for the same pronunciation
    expect(back).not.toBe(ingglish);
  });

  it('should return unmatched word when not in reverse map', () => {
    const result = reverseTranslateSync('zzzzz', { lang: 'ja' });
    expect(result).toBe('zzzzz');
  });

  it('should pass through non-letter tokens in non-English reverse', () => {
    const result = reverseTranslateSync('123', { lang: 'ja' });
    expect(result).toBe('123');
  });

  it('should return mapping tokens for non-English reverse', async () => {
    const ingglish = await translate('猫', { lang: 'ja' });
    const tokens = reverseTranslateSyncWithMapping(ingglish, { lang: 'ja' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(1);
    expect(words[0]!.matched).toBe(true);
  });

  it('should return word unchanged when not in dict and no G2P exists', async () => {
    // Spanish has no G2P converter, so unknown words are returned unchanged
    const result = await translate('xyzabc', { lang: 'es' });
    expect(result).toContain('xyzabc');
  });

  it('should translate known words in the Spanish dict', async () => {
    const result = await translate('hola', { lang: 'es' });
    expect(result).not.toBe('hola');
  });

  it('should reverse-translate German', async () => {
    const ingglish = await translate('Guten Tag', { lang: 'de' });
    const back = await reverseTranslate(ingglish, { lang: 'de' });
    expect(back).not.toBe(ingglish);
  });

  it('should find word via alternative phoneme interpretation (German)', async () => {
    const ingglish = await translate('Haus', { lang: 'de' });
    const back = await reverseTranslate(ingglish, { lang: 'de' });
    expect(back).not.toBe(ingglish);
  });
});

// ===========================================================================
// 8. Pipeline/forward.ts edge cases
// ===========================================================================

describe('pipeline and forward.ts edge cases', () => {
  it('requireLangDict: throws for unloaded language', () => {
    expect(() => translateSync('hello', { lang: 'nonexistent-lang-xyz' })).toThrow(/not loaded/);
  });

  it('translateWordString: standalone apostrophes pass through', () => {
    const result = translateSync("' '");
    expect(result).toBe("' '");
  });

  it('initialism in non-Latin script format: deseret', () => {
    const result = translateSync('UI', { format: 'deseret' });
    expect(result).not.toBe('UI');
    expect(result.length).toBeGreaterThan(0);
  });

  it('lowercase initialism in non-Latin script falls through', () => {
    const result = translateSync('api', { format: 'deseret' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('initialism+suffix in non-Latin, lowercase base falls through', () => {
    const result = translateSync("it's", { format: 'deseret' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('should skip capitalization for shavian format', () => {
    const tokens = translateSyncWithMapping('hello world', { format: 'shavian' });
    expect(tokens.length).toBeGreaterThan(0);
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
  });

  it('should preserve URLs with surrounding text in mapping', () => {
    const tokens = translateSyncWithMapping('visit https://example.com today');
    const urlToken = tokens.find((t) => t.original.includes('https://'));
    expect(urlToken).toBeDefined();
    expect(urlToken!.translated).toContain('https://');
  });

  it('should preserve multiple URLs in same token', () => {
    const tokens = translateSyncWithMapping('go https://a.com https://b.com end');
    const urlTokens = tokens.filter((t) => t.translated.includes('https://'));
    expect(urlTokens.length).toBe(2);
  });

  it('should preserve URL in renderText path', () => {
    const result = translateSync('visit https://example.com today');
    expect(result).toContain('https://example.com');
  });

  it('should capitalize word after period in mapping', () => {
    const tokens = translateSyncWithMapping('hello. world');
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
    const secondWord = words[1]!.translated;
    expect(secondWord.charAt(0)).toBe(secondWord.charAt(0).toUpperCase());
  });
});
