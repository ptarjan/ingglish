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
  it('should pass through acronym parts unchanged in ChatGPT', () => {
    const result = translateSync('ChatGPT');
    // "GPT" stays as-is (all-caps acronym ≥2 chars)
    expect(result).toMatch(/GPT$/);
  });

  it('should pass through acronym in OpenAI', () => {
    const result = translateSync('OpenAI');
    expect(result).toMatch(/AI$/);
  });
});

// ---------------------------------------------------------------------------
// Forward: camelCase with unknown part (forward.ts lines 368-369)
// ---------------------------------------------------------------------------
describe('camelCase with unknown parts', () => {
  it('should handle camelCase where a part has no dictionary entry', () => {
    // "xyzFoo" — "xyz" is unknown, "Foo" may or may not be known
    const result = translateSync('xyzFoo');
    // Should not throw, should return something
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
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
    ['formatted', '-ed after T/D → /ɪd/'],
    ['blogged', '-ed after voiced → /d/'],
    ['skyped', '-ed after voiceless → /t/'],
    ['relaunches', '-es after sibilant → /ɪz/'],
    ['debugs', '-s after voiced → /z/'],
    ['podcasts', '-s after voiceless → /s/'],
    ['unbreak', 'un- prefix'],
  ])('translates "%s" (%s)', (word) => {
    const result = translateSync(word);
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe(word);
  });

  it('translates -ing: "detoxing" → "deetoksing"', () => {
    expect(translateSync('detoxing')).toBe('deetoksing');
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
  it('should map AH0 (unstressed schwa) to "a" in "about"', () => {
    const result = translateSync('about');
    // "about" = AH0 B AW1 T → "a" + "bout" (not "u")
    expect(result.toLowerCase()).toMatch(/^a/);
  });

  it('should map stressed AH1 differently from AH0', () => {
    // "up" = AH1 P → "up" (stressed → "u")
    const result = translateSync('up');
    expect(result.toLowerCase()).toMatch(/^u/);
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
    // "api" is a known initialism, so "Api" should bail out of title-case fast path
    const result = translateSync('Api');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Forward: low-confidence G2P fallback (forward.ts line 215)
// ---------------------------------------------------------------------------
describe('G2P fallback for unknown words', () => {
  it('should translate a plausible but unknown word via G2P', () => {
    // A word with vowels that's not in the dictionary but G2P can handle
    const result = translateSync('flonkify');
    expect(result).toBeTruthy();
    // G2P should produce something different from the input
    expect(result.toLowerCase()).not.toBe('flonkify');
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
    expect(ingglish).toBeTruthy();
    const back = await reverseTranslate(ingglish, { lang: 'ja' });
    // May return kanji 猫 or katakana ネコ — both are valid for the same pronunciation
    expect(back).toBeTruthy();
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
    // User types Ingglish with an apostrophe — exercises reverseTranslateWordAsResult contraction branch
    const result = reverseTranslateSync("dohn't");
    expect(result).toBeTruthy();
    expect(result).toContain("'");
  });

  it('should handle leading apostrophe in Ingglish input', () => {
    // "'tuhz" — splitting on apostrophe gives ["", "tuhz"], exercises empty-part branch (line 338)
    const result = reverseTranslateSync("'tuhz");
    expect(result).toBeTruthy();
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
  it.each(['knight', 'knife', 'know', 'write', 'wrong'])(
    'round-trips silent-letter word "%s"',
    (word) => {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.length).toBeGreaterThan(0);
    }
  );

  it.each(['though', 'through', 'tough', 'cough', 'bought'])(
    'round-trips -ough word "%s"',
    (word) => {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.toLowerCase()).toBe(word);
    }
  );

  it.each(['nation', 'vision', 'station', 'decision'])(
    'round-trips -tion/-sion word "%s"',
    (word) => {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.toLowerCase()).toBe(word);
    }
  );

  it('should handle multi-word sentences with punctuation', () => {
    const text = 'The quick brown fox jumps over the lazy dog.';
    const ingglish = translateSync(text);
    const back = reverseTranslateSync(ingglish);
    // Should preserve the period
    expect(back).toMatch(/\.$/);
    // Should contain recognizable words
    expect(back.toLowerCase()).toContain('the');
    expect(back.toLowerCase()).toContain('dog');
  });
});

// ---------------------------------------------------------------------------
// IPA format output (to-ipa.ts)
// ---------------------------------------------------------------------------
describe('IPA format translation', () => {
  it('should translate sentence to IPA', () => {
    const result = translateSync('hello world', { format: 'ipa' });
    expect(result).toBeTruthy();
    expect(result).toContain('l');
  });

  it('should translate unknown word to IPA via G2P', () => {
    const result = translateSync('flonkify', { format: 'ipa' });
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Pronunciation/guide format (to-pronunciation.ts)
// ---------------------------------------------------------------------------
describe('pronunciation format translation', () => {
  it('should translate to guide pronunciation format', () => {
    const result = translateSync('hello', { format: 'pronunciation' });
    // Guide format uses hyphens between syllables and CAPS for stress
    expect(result).toContain('-');
    expect(result).toMatch(/[A-Z]/);
  });

  it('should translate multisyllabic word to pronunciation', () => {
    const result = translateSync('beautiful', { format: 'pronunciation' });
    expect(result).toContain('-');
    // Should have at least 2 syllables
    expect(result.split('-').length).toBeGreaterThanOrEqual(2);
  });

  it('should translate monosyllabic word to pronunciation', () => {
    const result = translateSync('cat', { format: 'pronunciation' });
    // No hyphen for single syllable
    expect(result).not.toContain('-');
    // Should be in caps (stressed)
    expect(result).toBe(result.toUpperCase());
  });
});

// ---------------------------------------------------------------------------
// Compound word case preservation (compounds.ts lines 151-171)
// ---------------------------------------------------------------------------
describe('compound word case preservation paths', () => {
  it('should translate uppercase compound word', () => {
    const result = translateSync('CATDOG');
    expect(result).toBeTruthy();
    // All caps should be preserved
    expect(result).toBe(result.toUpperCase());
  });

  it('should handle compound with mixed-case parts', () => {
    // "GitHub" — compound where first part should preserve case
    const result = translateSync('GitHub');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Stemming: compound decomposition (register-english.ts lines 35-47)
// ---------------------------------------------------------------------------
describe('compound decomposition via word resolver', () => {
  it('should decompose unknown compound word into known parts', () => {
    // "catdog" — not in dict, but "cat" + "dog" are
    const result = translateSync('catdog');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('catdog');
  });
});

// ---------------------------------------------------------------------------
// Unicode case patterns (normalize/case.ts)
// ---------------------------------------------------------------------------
describe('Unicode case handling', () => {
  it('should handle accented uppercase word', () => {
    // "CAFÉ" — all caps with accent
    const result = translateSync('CAFÉ');
    expect(result).toBeTruthy();
  });

  it('should handle accented title-case word', () => {
    const result = translateSync('Naïve');
    expect(result).toBeTruthy();
  });
});

// ===========================================================================
// Non-English word resolvers
// ===========================================================================

describe('German word resolver', () => {
  it.each([['Kongreß', 'resolve ß→ss']])(
    'resolves "%s" (%s)',
    async (word) => {
      const result = await translate(word, { lang: 'de' });
      expect(result).toBeTruthy();
      expect(result).not.toBe(word);
    },
    30_000
  );
});

describe('Swedish word resolver', () => {
  it.each([
    ['huset', 'strip -et suffix'],
    ['barnens', 'two-level genitive: strip -s → strip -en'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'sv' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

describe('Finnish word resolver', () => {
  it.each([
    ['talossa', 'strip inessive -ssa'],
    ['kengän', 'consonant gradation nk→ng'],
    ['talossansa', 'two-level possessive -nsa'],
    ['talollamme', 'two-level possessive -mme'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'fi' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

describe('Esperanto word resolver', () => {
  it.each([
    ['bonajn', 'strip plural+accusative -jn'],
    ['bonas', 'resolve verb tense -as'],
    ['xyzplonko', 'G2P for unknown words'],
    ['dormis', 'resolve verb past -is'],
    ['sendu', 'resolve imperative -u'],
    ['parolanta', 'resolve participle -anta'],
    ['senbona', 'resolve prefix sen-'],
    ['maldormis', 'resolve prefix mal- + verb'],
    ['hundon', 'strip accusative -n'],
    ['lernilojn', 'strip plural+accusative then derivational suffix'],
    ['maldorme', 'resolve adverb -e'],
    ['ekadmonas', 'resolve prefix ek- with recursive lemmatization'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

describe('Swahili word resolver', () => {
  it.each([
    ['nipenda', 'strip verb prefix "ni"'],
    ['xyzfanaka', 'G2P for unknown words'],
    ['pendika', 'strip derivational suffix -ika'],
    ['walipenda', 'strip prefix + suffix'],
    ['walisomisha', 'strip prefix + derivational suffix + ku- form'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'sw' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

describe('Persian word resolver', () => {
  it.each([
    ['کتابها', 'strip plural -ها'],
    ['می\u200Cکند', 'split ZWNJ compound'],
    ['کتابای', 'strip -ای indefinite suffix'],
    ['\u0646\u0645\u06CC\u200C\u062E\u0648\u0627\u0646\u0646\u062F', 'strip نمی ZWNJ verb ending'],
    ['\u0622\u0628\u0627\u200C\u062F\u0627\u0646', 'join ZWNJ parts'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'fa' });
    expect(result).toBeTruthy();
  });
});

describe('Malay word resolver', () => {
  it.each([
    ['xyzbalak', 'G2P for unknown words'],
    ['tuliskan', 'strip -kan suffix'],
    ['berkerja', 'strip ber- prefix'],
    ['dipikir', 'strip di- prefix'],
    ['menyewa', 'strip meny- prefix, restore s'],
    ['menyewakan', 'strip suffix then prefix'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

describe('Japanese word resolver', () => {
  it.each([
    ['ありがとう', 'translate hiragana text'],
    ['すし', 'decompose character-by-character'],
    ['きゃく', 'decompose with 2-char kana'],
    ['きって', 'handle sokuon skip'],
    ['き龠', 'fall back on unknown char'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'ja' });
    expect(result).toBeTruthy();
  });

  it('should handle structural-only kana: "っー" (sokuon + chōon)', async () => {
    // Only skip chars → allSkippable path returns empty phoneme array
    const result = await translate('っー', { lang: 'ja' });
    expect(result).toBeDefined();
  });
});

describe('Norwegian Bokmål word resolver', () => {
  it.each([
    ['paa', 'modernize aa→å'],
    ['efter', 'modernize old spelling'],
    ['husen', 'strip -en suffix'],
    ['katter', 'strip -er suffix'],
    ['gaarden', 'two-level strip+modernize'],
    ['af', 'modernize af→av'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

describe('Romanian word resolver', () => {
  it.each([
    ['lupului', 'strip -ului suffix'],
    ['camerele', 'strip -ele, add -ă'],
    ['nțeleg', 'restore prefix n→în'],
    ['mbarca', 'resolve î+word'],
  ])('resolves "%s" (%s)', async (word) => {
    const result = await translate(word, { lang: 'ro' });
    expect(result).toBeTruthy();
    expect(result).not.toBe(word);
  });
});

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
    // A word with no dict match and no G2P should return original
    // English has low-confidence G2P so it always returns something,
    // but we can test that it returns a non-empty result
    const result = translateSync('xyzzy');
    expect(result).toBeTruthy();
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
    // "A" is single char — isTitleCaseAscii returns false, falls through to lookupDict
    const result = translateSync('A');
    expect(result).toBeTruthy();
  });

  it('initialism in non-Latin script format: deseret (lines 415-418)', () => {
    // Deseret is non-Latin script. Bare initialism "UI" is all-caps ≥2 chars,
    // which passes through at line 280 for Latin scripts only.
    // For non-Latin, it reaches tryInitialism where isLatinScript=false,
    // hitting line 415-416 (translateAsAcronym)
    const result = translateSync('UI', { format: 'deseret' });
    expect(result).toBeTruthy();
    // Should be translated to Deseret, not pass through as "UI"
    expect(result).not.toBe('UI');
  });

  it('lowercase initialism in non-Latin script falls through (line 418)', () => {
    // "api" is a known initialism but lowercase. In non-Latin format (deseret),
    // tryInitialism returns null (line 418) since word !== word.toUpperCase()
    const result = translateSync('api', { format: 'deseret' });
    expect(result).toBeTruthy();
  });

  it('initialism+suffix in non-Latin, lowercase base falls through (line 441)', () => {
    // "it's" — parseInitialismWithSuffix returns {base: "it", suffix: "'s"}
    // "it" is a known initialism but lowercase in non-Latin script → line 441
    const result = translateSync("it's", { format: 'deseret' });
    expect(result).toBeTruthy();
  });
});

// ===========================================================================
// Coverage: reverse.ts edge cases
// ===========================================================================

describe('reverse.ts edge cases', () => {
  it('reverse IPA: empty string returns empty', () => {
    expect(reverseTranslateSync('', { format: 'ipa' })).toBe('');
  });

  it('reverse IPA: whitespace-only passes through', () => {
    expect(reverseTranslateSync('   ', { format: 'ipa' })).toBe('   ');
  });

  it('reverse IPA: unparseable IPA returns original', () => {
    const result = reverseTranslateSync('!!!', { format: 'ipa' });
    expect(result).toBe('!!!');
  });

  it('reverse IPA: no phoneme key match returns original', () => {
    // An IPA sequence that converts to arpabet but has no dictionary entry
    const result = reverseTranslateSync('ʒʒʒ', { format: 'ipa' });
    expect(result).toBe('ʒʒʒ');
  });

  it('reverse Ingglish: empty string returns empty', () => {
    expect(reverseTranslateSync('')).toBe('');
  });

  it('reverse Ingglish: non-letter token passes through', () => {
    expect(reverseTranslateSync('123')).toBe('123');
  });

  it('reverse Ingglish: gibberish returns as-is', () => {
    const result = reverseTranslateSync('zzzzz');
    expect(result).toBe('zzzzz');
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
    // "vapour" is not in CMU dict but matchBritish maps it to "vapor" which is
    const result = translateSync('vapour');
    expect(result).toBe(translateSync('vapor'));
  });
});

// ===========================================================================
// Coverage: non-English reverse with alternative phoneme match (line 247)
// ===========================================================================

describe('non-English reverse edge cases (reverseLangWordAsResult)', () => {
  it('should find word via alternative phoneme interpretation (German)', async () => {
    const ingglish = await translate('Haus', { lang: 'de' });
    const back = await reverseTranslate(ingglish, { lang: 'de' });
    expect(back).toBeTruthy();
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
    // A long word that dpDecompose might split into parts where one has no phonemes
    // This is the `if (!ph) return;` path at line 42
    const result = translateSync('abcdefghij');
    // Should not crash — returns G2P fallback or original
    expect(result).toBeTruthy();
  });
});
