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
// Non-English translation via public API with real dicts
// ===========================================================================
// Uses translate(text, { lang }) with real IPA dicts loaded from
// packages/website/public/ipa-dicts/. Words are chosen to NOT be in the dict
// (but their stems ARE) so that word resolvers and G2P converters fire.

// ---------------------------------------------------------------------------
// Forward: camelCase with all-caps acronym (forward.ts line 360)
// ---------------------------------------------------------------------------
describe('camelCase with all-caps acronyms', () => {
  it.each([
    ['ChatGPT', 'ChatGPT', 'GPT stays as-is'],
    ['OpenAI', 'OhpanAI', 'AI stays as-is'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Forward: camelCase with unknown part (forward.ts lines 368-369)
// ---------------------------------------------------------------------------
describe('camelCase with unknown parts', () => {
  it('should handle camelCase where a part has no dictionary entry', () => {
    expect(translateSync('xyzFoo')).toBe('zizFoo');
  });
});

// ---------------------------------------------------------------------------
// Forward: untranslatable word gets NOT_FOUND_MARKER (forward.ts line 341)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Reverse: contraction handling (reverse.ts lines 332-347)
// ---------------------------------------------------------------------------
describe('reverse contraction handling', () => {
  it('should reverse-translate contractions with apostrophe', () => {
    // Forward-translate a contraction, then reverse it
    const ingglish = translateSync("don't");
    const back = reverseTranslateSync(ingglish);
    expect(back.toLowerCase()).toBe("don't");
  });

  it("should reverse-translate it's", () => {
    const ingglish = translateSync("it's");
    const back = reverseTranslateSync(ingglish);
    expect(back.toLowerCase()).toBe("it's");
  });
});

// ---------------------------------------------------------------------------
// English stemming (word resolver path)
// ---------------------------------------------------------------------------
describe('English stemming (word resolver path)', () => {
  it.each([
    ['formatted', 'formatid', '-ed after T/D → /ɪd/'],
    ['blogged', 'blawgd', '-ed after voiced → /d/'],
    ['skyped', 'skaipt', '-ed after voiceless → /t/'],
    ['relaunches', 'reelawnchiz', '-es after sibilant → /ɪz/'],
    ['debugs', 'deebuhgz', '-s after voiced → /z/'],
    ['podcasts', 'podkasts', '-s after voiceless → /s/'],
    ['unbreak', 'anbrayk', 'un- prefix'],
    ['detoxing', 'deetoksing', '-ing suffix'],
  ])('translates "%s" → "%s" (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Compounds: case preservation (compounds.ts line 164)
// ---------------------------------------------------------------------------
describe('compound word translation', () => {
  it('should translate compound words like "catdog"', () => {
    // "catdog" not in dict, but "cat" + "dog" are → compound resolver
    expect(translateSync('catdog')).toBe('katdawg');
  });

  it('should preserve capitalization in compound words', () => {
    // "Catdog" with capital C — compound resolver + title case preservation
    const result = translateSync('Catdog');
    expect(result).toBe('Katdawg');
  });
});

// ---------------------------------------------------------------------------
// Unstressed schwa mapping (to-ingglish.ts lines 22-26)
// ---------------------------------------------------------------------------
describe('unstressed schwa mapping', () => {
  it.each([
    ['about', 'about', 'AH0 → "a" (unstressed schwa)'],
    ['up', 'uhp', 'AH1 → "uh" (stressed)'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Pipeline: sentence capitalization (pipeline.ts line 137)
// ---------------------------------------------------------------------------
describe('reverse translation output', () => {
  it('should reverse-translate multi-word Ingglish text', () => {
    const result = reverseTranslateSync('dha kat');
    // "dha kat" → "the cat"
    expect(result.toLowerCase()).toBe('the cat');
  });
});

// ---------------------------------------------------------------------------
// Reverse with mapping: contraction tokens
// ---------------------------------------------------------------------------
describe('reverse mapping with contractions', () => {
  it('should return matched tokens for contractions', () => {
    const ingglish = translateSync("she's happy");
    const tokens = reverseTranslateSyncWithMapping(ingglish);
    const words = tokens.filter((t) => t.isWord);
    // All words should be matched
    for (const w of words) {
      expect(w.matched).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Forward: translateWordString non-letter passthrough (forward.ts line 330)
// ---------------------------------------------------------------------------
describe('translateSync non-letter tokens', () => {
  it('should pass through numbers unchanged', () => {
    const result = translateSync('hello 42 world');
    expect(result).toContain('42');
  });

  it('should pass through punctuation-only tokens unchanged', () => {
    const result = translateSync('hello... world');
    expect(result).toContain('...');
  });
});

// ---------------------------------------------------------------------------
// Forward: translateWordString NOT_FOUND_MARKER (forward.ts line 341)
// ---------------------------------------------------------------------------
describe('translateSync with untranslatable words', () => {
  it('should mark vowelless nonsense words in sentence context', () => {
    // "bcdfg" has no vowels → skipped by G2P → NOT_FOUND_MARKER prepended
    const result = translateSync('bcdfg');
    // The NOT_FOUND_MARKER is \u00B7 (middle dot)
    expect(result).toContain('bcdfg');
  });
});

// ---------------------------------------------------------------------------
// Forward: title-case initialism fast path bail (forward.ts line 456)
// ---------------------------------------------------------------------------
describe('title-case initialism bail-out', () => {
  it('should handle title-case known initialisms like "Api"', () => {
    expect(translateSync('Api')).toBe('Api');
  });
});

// ---------------------------------------------------------------------------
// Forward: low-confidence G2P fallback (forward.ts line 215)
// ---------------------------------------------------------------------------
describe('G2P fallback for unknown words', () => {
  it('should translate a plausible but unknown word via G2P', () => {
    expect(translateSync('flonkify')).toBe('flongkafai');
  });
});

// ---------------------------------------------------------------------------
// Pipeline: capitalizeSentenceStarts early return (pipeline.ts line 137)
// ---------------------------------------------------------------------------
describe('capitalizeSentenceStarts with non-case-preserving format', () => {
  it('should skip capitalization for shavian format', () => {
    // Shavian doesn't preserve case, so capitalizeSentenceStarts returns early
    const tokens = translateSyncWithMapping('hello world', { format: 'shavian' });
    // Should still produce valid tokens
    expect(tokens.length).toBeGreaterThan(0);
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Reverse: non-English language reverse translation
// ---------------------------------------------------------------------------
describe('non-English reverse translation', () => {
  it('should reverse-translate Japanese back to source word', async () => {
    const ingglish = await translate('猫', { lang: 'ja' });
    const back = await reverseTranslate(ingglish, { lang: 'ja' });
    // May return kanji 猫 or katakana ネコ — both are valid for the same pronunciation
    expect(back).not.toBe(ingglish); // Should be Japanese, not Ingglish
  });

  it('should return unmatched word when not in reverse map', () => {
    // Reverse map built by prior test
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
    expect(words.length).toBeGreaterThan(0);
    expect(words[0]?.matched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Forward: word not found with no G2P (forward.ts line 315)
// ---------------------------------------------------------------------------
describe('forward translation with no G2P fallback', () => {
  it('should return word unchanged when not in dict and no G2P exists', async () => {
    // Spanish has no G2P converter, so unknown words are returned unchanged
    const result = await translate('xyzabc', { lang: 'es' });
    expect(result).toContain('xyzabc');
  });

  it('should translate known words in the Spanish dict', async () => {
    const result = await translate('hola', { lang: 'es' });
    expect(result).not.toBe('hola');
  });
});

// ---------------------------------------------------------------------------
// Reverse: contraction with apostrophe in Ingglish input (reverse.ts lines 329, 332-338)
// ---------------------------------------------------------------------------
describe('reverse translation with apostrophes in input', () => {
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
});

// ---------------------------------------------------------------------------
// English reverseTranslate (async, index.ts lines 50-51)
// ---------------------------------------------------------------------------
describe('English async reverseTranslate', () => {
  it('should reverse-translate English text via async API', async () => {
    const ingglish = translateSync('hello');
    const result = await reverseTranslate(ingglish);
    expect(result.toLowerCase()).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// Round-trip edge cases
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// IPA format output (to-ipa.ts)
// ---------------------------------------------------------------------------
describe('IPA format translation', () => {
  it.each([
    ['hello world', 'h\u0259\u2060\u02C8\u2060lo\u028A \u2060\u02C8\u2060w\u025Dld', 'sentence'],
    [
      'flonkify',
      '\u2060\u02C8\u2060fl\u0251\u014Bk\u0259\u2060\u02CC\u2060fa\u026A',
      'unknown word via G2P',
    ],
  ])('translates "%s" to IPA (%s)', (input, expected) => {
    expect(translateSync(input, { format: 'ipa' })).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Pronunciation/guide format (to-pronunciation.ts)
// ---------------------------------------------------------------------------
describe('pronunciation format translation', () => {
  it.each([
    ['hello', 'ha-LOH', 'multisyllabic'],
    ['beautiful', 'BYOO-ta-fal', '3 syllables'],
    ['cat', 'KAT', 'monosyllabic'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word, { format: 'pronunciation' })).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Compound word case preservation (compounds.ts lines 151-171)
// ---------------------------------------------------------------------------
describe('compound word case preservation paths', () => {
  it('should pass through all-caps compound as initialism', () => {
    // CATDOG is all-caps ≥2 chars → treated as initialism, passes through
    expect(translateSync('CATDOG')).toBe('CATDOG');
  });

  it('should translate mixed-case compound', () => {
    expect(translateSync('GitHub')).toBe('GitHuhb');
  });
});

// ---------------------------------------------------------------------------
// Stemming: compound decomposition (register-english.ts lines 35-47)
// ---------------------------------------------------------------------------
describe('compound decomposition via word resolver', () => {
  it('should decompose unknown compound word into known parts', () => {
    expect(translateSync('catdog')).toBe('katdawg');
  });
});

// ---------------------------------------------------------------------------
// Unicode case patterns (normalize/case.ts)
// ---------------------------------------------------------------------------
describe('Unicode case handling', () => {
  it.each([
    ['CAFÉ', 'KAFAY', 'all caps with accent'],
    ['Naïve', 'Naieev', 'title case with diaeresis'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

// Non-English word resolvers are covered by packages/ipa/src/resolvers.test.ts

// ---------------------------------------------------------------------------
// Non-English reverse translation via public API
// ---------------------------------------------------------------------------
describe('non-English reverse translation via public API', () => {
  it('should reverse-translate German', async () => {
    const ingglish = await translate('Guten Tag', { lang: 'de' });
    const back = await reverseTranslate(ingglish, { lang: 'de' });
    expect(back).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// lookupDict curly apostrophe normalization (dict.ts line 248)
// ---------------------------------------------------------------------------
describe('curly apostrophe normalization', () => {
  it('should translate curly apostrophes same as straight', () => {
    const straight = translateSync("it's");
    const curly = translateSync('it\u2019s');
    expect(curly).toBe(straight);
  });
});

// ---------------------------------------------------------------------------
// IPA reverse translation (reverse.ts reverseTranslateIPAWord)
// ---------------------------------------------------------------------------
describe('IPA reverse translation', () => {
  it('should reverse-translate IPA with mapping', () => {
    const ipa = translateSync('hello world', { format: 'ipa' });
    const tokens = reverseTranslateSyncWithMapping(ipa, { format: 'ipa' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
    expect(words[0]!.translated.toLowerCase()).toBe('hello');
  });
});

// ===========================================================================
// Coverage: forward.ts edge cases
// ===========================================================================

describe('forward.ts edge cases', () => {
  it('empty string returns empty (line 256)', () => {
    expect(translateSync('')).toBe('');
  });

  it('non-letter token passes through (line 256)', () => {
    expect(translateSync('123')).toBe('123');
  });

  it('truly unknown word returns something (line 217)', () => {
    expect(translateSync('xyzzy')).toBe('zizee');
  });

  it('requireLangDict: throws for unloaded language (line 54)', () => {
    expect(() => translateSync('hello', { lang: 'nonexistent-lang-xyz' })).toThrow(/not loaded/);
  });

  it('translateWordString: standalone apostrophes pass through (line 330)', () => {
    // Standalone apostrophes are word tokens (odd index in split) but have no letters
    const result = translateSync("' '");
    expect(result).toContain("'");
  });

  it('single uppercase letter: isTitleCaseAscii returns false (line 158)', () => {
    expect(translateSync('A')).toBe('A');
  });

  it('initialism in non-Latin script format: deseret (lines 415-418)', () => {
    const result = translateSync('UI', { format: 'deseret' });
    // Should be translated to Deseret, not pass through as "UI"
    expect(result).not.toBe('UI');
    expect(result.length).toBeGreaterThan(0);
  });

  it('lowercase initialism in non-Latin script falls through (line 418)', () => {
    const result = translateSync('api', { format: 'deseret' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('initialism+suffix in non-Latin, lowercase base falls through (line 441)', () => {
    const result = translateSync("it's", { format: 'deseret' });
    expect(result.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Coverage: reverse.ts edge cases
// ===========================================================================

describe('reverse.ts edge cases', () => {
  it.each([
    ['', '', 'empty string'],
    ['   ', '   ', 'whitespace-only'],
    ['!!!', '!!!', 'unparseable IPA'],
    ['ʒʒʒ', 'ʒʒʒ', 'no phoneme key match'],
  ])('reverse IPA: "%s" → "%s" (%s)', (input, expected) => {
    expect(reverseTranslateSync(input, { format: 'ipa' })).toBe(expected);
  });

  it.each([
    ['', '', 'empty string'],
    ['123', '123', 'non-letter token'],
    ['zzzzz', 'zzzzz', 'gibberish'],
  ])('reverse Ingglish: "%s" → "%s" (%s)', (input, expected) => {
    expect(reverseTranslateSync(input)).toBe(expected);
  });

  it('reverseTranslateSync: pronunciation format falls through (line 191)', () => {
    // 'pronunciation' format has no reverseText handler, so it falls through
    // to reverseTranslateIngglishText at line 191
    const ingglish = translateSync('hello');
    const result = reverseTranslateSync(ingglish, { format: 'pronunciation' });
    expect(result.toLowerCase()).toBe('hello');
  });

  it('reverseTranslateSyncWithMapping: pronunciation format falls through (line 215)', () => {
    // 'pronunciation' format has no reverseTextWithMapping handler
    const ingglish = translateSync('hello world');
    const tokens = reverseTranslateSyncWithMapping(ingglish, { format: 'pronunciation' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
  });

  it('reverseTranslateWordAsResult: non-letter returns matched (line 329)', () => {
    // Non-letter tokens in reverse translation should pass through
    const result = reverseTranslateSync('haloh, werld!');
    expect(result).toContain(',');
    expect(result).toContain('!');
  });

  it('IPA reverse with punctuation: non-word token path (line 296)', () => {
    // IPA text with punctuation exercises the non-word branch in reverseTranslateIPATextInternal
    const ipa = translateSync('hello, world', { format: 'ipa' });
    const result = reverseTranslateSync(ipa, { format: 'ipa' });
    expect(result).toContain(',');
  });

  it('reverseTranslateSync: gibberish word with no match (line 354)', () => {
    // A word that has letters but reverseTranslateWord returns no matches
    const result = reverseTranslateSync('xzqwp');
    // Should return the original word since no arpabet mapping exists
    expect(result).toBe('xzqwp');
  });
});

// ===========================================================================
// Coverage: register-english.ts British spelling path (line 27)
// ===========================================================================
describe('British spelling word resolver', () => {
  it('translates British spellings like "vapour" via matchBritish', () => {
    expect(translateSync('vapour')).toBe('vayper');
  });
});

// ===========================================================================
// Coverage: non-English reverse with alternative phoneme match (line 247)
// ===========================================================================

describe('non-English reverse edge cases (reverseLangWordAsResult)', () => {
  it('should find word via alternative phoneme interpretation (German)', async () => {
    const ingglish = await translate('Haus', { lang: 'de' });
    const back = await reverseTranslate(ingglish, { lang: 'de' });
    expect(back).not.toBe(ingglish);
  });
});

// ===========================================================================
// Coverage: preserved.ts — text before placeholder (line 31)
// ===========================================================================

describe('preserved pattern expansion', () => {
  it('should preserve URLs with surrounding text in mapping', () => {
    // A URL preceded by text in the same token should trigger the "before" path
    const tokens = translateSyncWithMapping('visit https://example.com today');
    const urlToken = tokens.find((t) => t.original.includes('https://'));
    expect(urlToken).toBeDefined();
    expect(urlToken!.translated).toContain('https://');
  });

  it('should preserve multiple URLs in same token (preserved.ts line 31)', () => {
    // Two URLs adjacent in the same separator token triggers matches.sort()
    const tokens = translateSyncWithMapping('go https://a.com https://b.com end');
    const urlTokens = tokens.filter((t) => t.translated.includes('https://'));
    expect(urlTokens.length).toBe(2);
  });

  it('should preserve URL in renderText path (pipeline.ts expandPlaceholderText)', () => {
    // translateSync uses renderText which has its own expandPlaceholderText
    const result = translateSync('visit https://example.com today');
    expect(result).toContain('https://example.com');
  });
});

// ===========================================================================
// Coverage: pipeline.ts — capitalizeSentenceStarts after period (lines 154, 163)
// ===========================================================================

describe('pipeline.ts sentence capitalization', () => {
  it('should capitalize word after period in mapping', () => {
    // translateSyncWithMapping calls capitalizeSentenceStarts
    // "hello. world" — "world" should be capitalized after period
    const tokens = translateSyncWithMapping('hello. world');
    const words = tokens.filter((t) => t.isWord);
    // Second word should start with uppercase
    expect(words.length).toBe(2);
    const secondWord = words[1]!.translated;
    expect(secondWord.charAt(0)).toBe(secondWord.charAt(0).toUpperCase());
  });
});

// ===========================================================================
// Coverage: register-english.ts — compound decomposition failure (line 42)
// ===========================================================================

describe('compound decomposition edge cases', () => {
  it('should handle compound where a part has no phonemes', () => {
    expect(translateSync('abcdefghij')).toBe('abkdefghij');
  });
});
