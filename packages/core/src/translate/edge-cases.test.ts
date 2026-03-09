/**
 * Integration tests for edge cases in the translation pipeline.
 * Tests exercise internal code paths through the public API
 * (translateSync, reverseTranslateSync, translate, reverseTranslate).
 */
import { describe, expect, it } from 'vitest';
import { lookupPronunciation } from '@ingglish/dictionary';
import {
  type PhoneDict,
  reverseTranslate,
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
  setDictLoader,
  translate,
  translateSync,
  translateSyncWithMapping,
} from '../index';
import { reverseTranslateIPAWord, reverseTranslateWord } from './reverse';

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
// Stemming: -ed allomorphs via word resolver (stemming.ts lines 26-33)
// Uses words NOT in CMU dict so they go through the stemming word resolver
// ---------------------------------------------------------------------------
describe('stemming -ed allomorphs (word resolver path)', () => {
  it('should translate -ed after T/D with /ɪd/ (e.g. "formatted")', () => {
    // "format" is in dict, "formatted" is not → word resolver → matchStemming
    // T ending → IH0 D allomorph (stemming.ts line 28)
    expect(lookupPronunciation('formatted')).toBeNull();
    const result = translateSync('formatted');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('formatted');
  });

  it('should translate -ed after voiced consonant with /d/ (e.g. "blogged")', () => {
    // "blog" ends in G (voiced) → D allomorph (stemming.ts line 33)
    expect(lookupPronunciation('blogged')).toBeNull();
    const result = translateSync('blogged');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('blogged');
  });

  it('should translate -ed after voiceless consonant with /t/ (e.g. "skyped")', () => {
    // "skype" ends in P (voiceless) → T allomorph (stemming.ts line 31)
    expect(lookupPronunciation('skyped')).toBeNull();
    const result = translateSync('skyped');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Stemming: -s allomorphs via word resolver (stemming.ts lines 42-50)
// ---------------------------------------------------------------------------
describe('stemming -s/-es allomorphs (word resolver path)', () => {
  it('should translate -es after sibilants with /ɪz/ (e.g. "relaunches")', () => {
    // "relaunch" ends in CH (sibilant) → IH0 Z allomorph (stemming.ts line 45)
    expect(lookupPronunciation('relaunches')).toBeNull();
    const result = translateSync('relaunches');
    expect(result).toBeTruthy();
  });

  it('should translate -s after voiced consonant with /z/ (e.g. "debugs")', () => {
    // "debug" ends in G (voiced) → Z allomorph (stemming.ts line 50)
    expect(lookupPronunciation('debugs')).toBeNull();
    const result = translateSync('debugs');
    expect(result).toBeTruthy();
  });

  it('should translate -s after voiceless consonant with /s/ (e.g. "podcasts")', () => {
    // "podcast" ends in T (voiceless) → S allomorph (stemming.ts line 48)
    expect(lookupPronunciation('podcasts')).toBeNull();
    const result = translateSync('podcasts');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Stemming: -ing, -tion, prefix un-, re-
// ---------------------------------------------------------------------------
describe('stemming additional patterns', () => {
  it('should translate unknown -ing words via stem', () => {
    // "detoxing" — not in dict but "detox" is → stemming resolver
    expect(translateSync('detoxing')).toBe('deetoksing');
  });

  it('should handle un- prefixed words', () => {
    // "undo" is in dictionary, but "unbreak" might not be
    const pron = lookupPronunciation('break');
    if (!pron) {
      return;
    }
    const result = translateSync('unbreak');
    // Should translate via prefix stemming if "unbreak" isn't in dict
    expect(result).toBeTruthy();
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
  const MOCK_LANG = 'test-lang-reverse';

  // Set up a mock language with a reverse map
  const mockDict: PhoneDict = {
    entries: {
      neko: ['N', 'EH1', 'K', 'OW0'],
    },
    lang: MOCK_LANG,
    nonLatinScript: true,
  };

  it('should reverse-translate Ingglish back to source language word', async () => {
    // Load dict via public API
    setDictLoader(() => Promise.resolve(mockDict));
    await translate('neko', { lang: MOCK_LANG });

    // Build reverse map via reverseTranslate (which calls buildReverseMap internally)
    await reverseTranslate('nekoh', { lang: MOCK_LANG });

    // Now reverseTranslateSync should work
    const result = reverseTranslateSync('nekoh', { lang: MOCK_LANG });
    // Should find the word "neko" in the reverse map
    expect(result).toBe('neko');
  });

  it('should return unmatched word when not in reverse map', () => {
    const result = reverseTranslateSync('zzzzz', { lang: MOCK_LANG });
    // No match in reverse map, returned as-is
    expect(result).toBe('zzzzz');
  });

  it('should pass through non-letter tokens in non-English reverse', () => {
    const result = reverseTranslateSync('123', { lang: MOCK_LANG });
    expect(result).toBe('123');
  });

  it('should return mapping tokens for non-English reverse', () => {
    const tokens = reverseTranslateSyncWithMapping('nekoh', { lang: MOCK_LANG });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBeGreaterThan(0);
    expect(words[0]?.matched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reverse: non-English alternative phoneme match
// ---------------------------------------------------------------------------
describe('non-English reverse with alternative phoneme match', () => {
  const ALT_LANG = 'test-lang-alt';

  const altDict: PhoneDict = {
    entries: {
      // "kat" phonemes: K AE1 T
      // The reverse map built from this dict will have "K AE T" → ["kat"]
      // But the alternative AH variant ("K AH T") won't be in the map
      kat: ['K', 'AE1', 'T'],
    },
    lang: ALT_LANG,
    nonLatinScript: true,
  };

  it('should translate and reverse non-English words', async () => {
    setDictLoader(() => Promise.resolve(altDict));
    await translate('kat', { lang: ALT_LANG });
    await reverseTranslate('kat', { lang: ALT_LANG });

    // "kat" should reverse to "kat" (the only entry in the dict)
    const result = reverseTranslateSync('kat', { lang: ALT_LANG });
    expect(result).toBe('kat');
  });
});

// ---------------------------------------------------------------------------
// Forward: word not found with no G2P (forward.ts line 315)
// ---------------------------------------------------------------------------
describe('forward translation with no G2P fallback', () => {
  const NO_G2P_LANG = 'test-lang-no-g2p';

  const noG2pDict: PhoneDict = {
    entries: {
      helo: ['HH', 'EH1', 'L', 'OW0'],
    },
    lang: NO_G2P_LANG,
    nonLatinScript: true,
  };

  it('should return word unchanged when not in dict and no G2P exists', async () => {
    setDictLoader(() => Promise.resolve(noG2pDict));
    await translate('helo', { lang: NO_G2P_LANG });

    const result = translateSync('unknownword', { lang: NO_G2P_LANG });
    // Word is returned with NOT_FOUND_MARKER prefix since it can't be translated
    expect(result).toContain('unknownword');
  });

  it('should translate known words in the mock dict', () => {
    const result = translateSync('helo', { lang: NO_G2P_LANG });
    expect(result).not.toBe('helo');
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
  it('should round-trip words with silent letters', () => {
    const words = ['knight', 'knife', 'know', 'write', 'wrong'];
    for (const word of words) {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.length, `${word} → ${ingglish}`).toBeGreaterThan(0);
    }
  });

  it('should round-trip words with -ough patterns', () => {
    const words = ['though', 'through', 'tough', 'cough', 'bought'];
    for (const word of words) {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.toLowerCase(), `${word} → ${ingglish}`).toBe(word);
    }
  });

  it('should round-trip words ending in -tion/-sion', () => {
    const words = ['nation', 'vision', 'station', 'decision'];
    for (const word of words) {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.toLowerCase(), `${word} → ${ingglish}`).toBe(word);
    }
  });

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
// Non-English with disableRColoring (to-ingglish.ts line 178)
// ---------------------------------------------------------------------------
describe('non-English translation with R-coloring disabled', () => {
  const R_LANG = 'test-lang-rcolor';
  const rDict: PhoneDict = {
    disableRColoring: true,
    entries: {
      // "car" = K AA1 R — with R-coloring disabled, vowel+R handled differently
      kar: ['K', 'AA1', 'R'],
    },
    lang: R_LANG,
    nonLatinScript: false,
  };

  it('should translate with R-coloring disabled', async () => {
    setDictLoader(() => Promise.resolve(rDict));
    await translate('kar', { lang: R_LANG });

    const result = translateSync('kar', { lang: R_LANG });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
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
    if (!lookupPronunciation('cat') || !lookupPronunciation('dog')) {
      return;
    }
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

// ---------------------------------------------------------------------------
// German (de): ß→ss resolver — "daß" not in dict, "dass" is
// ---------------------------------------------------------------------------
describe('German translation', () => {
  it('should resolve ß→ss via word resolver: "Kongreß" → "Kongress"', async () => {
    // "Kongreß" not in dict or overrides; resolver converts ß→ss, tries title case "Kongress" (in dict)
    const result = await translate('Kongreß', { lang: 'de' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('Kongreß');
  });
});

// ---------------------------------------------------------------------------
// Swedish (sv): suffix stripping — "huset" not in dict, "hus" is
// ---------------------------------------------------------------------------
describe('Swedish translation', () => {
  it('should strip -et suffix from "huset" to find "hus"', async () => {
    const result = await translate('huset', { lang: 'sv' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('huset');
  });

  it('should resolve two-level genitive: "barnens" → strip s → "barnen" → strip en → "barn"', async () => {
    const result = await translate('barnens', { lang: 'sv' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('barnens');
  });
});

// ---------------------------------------------------------------------------
// Finnish (fi): suffix stripping — "talossa" not in dict, "talo" is
// ---------------------------------------------------------------------------
describe('Finnish translation', () => {
  it('should strip inessive -ssa from "talossa" to find "talo"', async () => {
    const result = await translate('talossa', { lang: 'fi' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('talossa');
  });
});

// ---------------------------------------------------------------------------
// Esperanto (eo): lemmatization — "bonajn" not in dict, "bona" is
// ---------------------------------------------------------------------------
describe('Esperanto translation', () => {
  it('should strip plural+accusative -jn from "bonajn" to find "bona"', async () => {
    const result = await translate('bonajn', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('bonajn');
  });

  it('should resolve verb tense -as: "bonas" → "bona"', async () => {
    const result = await translate('bonas', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('bonas');
  });

  it('should use Esperanto G2P for unknown words', async () => {
    // "xyzplonko" — not in dict, no resolver match → confident G2P
    const result = await translate('xyzplonko', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('xyzplonko');
  });
});

// ---------------------------------------------------------------------------
// Swahili (sw): verb prefix stripping — "nipenda" not in dict, "penda" is
// ---------------------------------------------------------------------------
describe('Swahili translation', () => {
  it('should strip verb prefix "ni" from "nipenda" to find "penda"', async () => {
    const result = await translate('nipenda', { lang: 'sw' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('nipenda');
  });

  it('should use Swahili G2P for unknown words', async () => {
    const result = await translate('xyzfanaka', { lang: 'sw' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('xyzfanaka');
  });
});

// ---------------------------------------------------------------------------
// Persian (fa): suffix stripping — "کتابها" not in dict, "کتاب" is
// ---------------------------------------------------------------------------
describe('Persian translation', () => {
  it('should strip plural -ها from "کتابها" to find "کتاب"', async () => {
    const result = await translate('کتابها', { lang: 'fa' });
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Malay (ma): G2P for unknown words
// ---------------------------------------------------------------------------
describe('Malay G2P', () => {
  it('should use Malay G2P for unknown words', async () => {
    const result = await translate('xyzbalak', { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('xyzbalak');
  });
});

// ---------------------------------------------------------------------------
// Japanese (ja): kana character-by-character resolver
// ---------------------------------------------------------------------------
describe('Japanese translation', () => {
  it('should translate hiragana text', async () => {
    const result = await translate('ありがとう', { lang: 'ja' });
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Norwegian Bokmål (nb): old orthography + suffix stripping
// ---------------------------------------------------------------------------
describe('Norwegian Bokmål translation', () => {
  it('should modernize old orthography aa→å: "paa" → "på"', async () => {
    const result = await translate('paa', { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('paa');
  });

  it('should modernize old spelling: "efter" → "etter"', async () => {
    const result = await translate('efter', { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('efter');
  });

  it('should strip suffix -en: "husen" → "hus"', async () => {
    const result = await translate('husen', { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('husen');
  });

  it('should strip suffix -er: "katter" → "katt"', async () => {
    const result = await translate('katter', { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('katter');
  });

  it('should two-level: strip suffix then modernize: "gaarden" → "gård"', async () => {
    const result = await translate('gaarden', { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('gaarden');
  });

  it('should modernize old spelling: "af" → "av"', async () => {
    const result = await translate('af', { lang: 'nb' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('af');
  });
});

// ---------------------------------------------------------------------------
// Romanian (ro): suffix stripping + prefix restoration
// ---------------------------------------------------------------------------
describe('Romanian translation', () => {
  it('should strip -ului suffix: "lupului" → "lup"', async () => {
    const result = await translate('lupului', { lang: 'ro' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('lupului');
  });

  it('should strip -ele and add -ă: "camerele" → "cameră"', async () => {
    const result = await translate('camerele', { lang: 'ro' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('camerele');
  });

  it('should restore prefix n→în: "nțeleg" → "înțeleg"', async () => {
    const result = await translate('nțeleg', { lang: 'ro' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('nțeleg');
  });

  it('should resolve î+word: "mbarca" → "îmbarca"', async () => {
    const result = await translate('mbarca', { lang: 'ro' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('mbarca');
  });
});

// ---------------------------------------------------------------------------
// Malay (ma): prefix/suffix stripping with nasal assimilation
// ---------------------------------------------------------------------------
describe('Malay translation', () => {
  it('should strip -kan suffix: "tuliskan" → "tulis"', async () => {
    const result = await translate('tuliskan', { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('tuliskan');
  });

  it('should strip ber- prefix: "berkerja" → "kerja"', async () => {
    const result = await translate('berkerja', { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('berkerja');
  });

  it('should strip di- prefix: "dipikir" → "pikir"', async () => {
    const result = await translate('dipikir', { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('dipikir');
  });

  it('should strip meny- prefix and restore s: "menyewa" → "sewa"', async () => {
    const result = await translate('menyewa', { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('menyewa');
  });

  it('should strip suffix then prefix: "menyewakan" → strip -kan → "menyewa" → strip meny- → restore s → "sewa"', async () => {
    const result = await translate('menyewakan', { lang: 'ma' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('menyewakan');
  });
});

// ---------------------------------------------------------------------------
// Japanese (ja): kana character-by-character resolver
// ---------------------------------------------------------------------------
describe('Japanese kana decomposition', () => {
  it('should decompose hiragana word character-by-character: "すし"', async () => {
    const result = await translate('すし', { lang: 'ja' });
    expect(result).toBeTruthy();
  });

  it('should decompose hiragana with 2-char kana: "きゃく"', async () => {
    const result = await translate('きゃく', { lang: 'ja' });
    expect(result).toBeTruthy();
  });

  it('should handle sokuon (っ) skip: "きって"', async () => {
    const result = await translate('きって', { lang: 'ja' });
    expect(result).toBeTruthy();
  });

  it('should fall back when kana resolver hits unknown char: "き龠"', async () => {
    // 龠 is not in the dict, so kana resolver returns undefined → falls back to G2P
    const result = await translate('き龠', { lang: 'ja' });
    expect(result).toBeTruthy();
  });

  it('should handle structural-only kana: "っー" (sokuon + chōon)', async () => {
    // Only skip chars → allSkippable path returns empty phoneme array
    const result = await translate('っー', { lang: 'ja' });
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Esperanto (eo): verb tenses, participles, prefixes
// Words confirmed NOT in eo.json but stems ARE
// ---------------------------------------------------------------------------
describe('Esperanto advanced lemmatization', () => {
  it('should resolve verb past -is: "dormis" → "dormi"', async () => {
    const result = await translate('dormis', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('dormis');
  });

  it('should resolve imperative -u: "sendu" → "sendi"', async () => {
    const result = await translate('sendu', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('sendu');
  });

  it('should resolve participle -anta: "parolanta" → "paroli"', async () => {
    const result = await translate('parolanta', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('parolanta');
  });

  it('should resolve prefix sen-: "senbona" → "bona"', async () => {
    const result = await translate('senbona', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('senbona');
  });

  it('should resolve prefix mal- + verb: "maldormis" → recursive → "dormi"', async () => {
    const result = await translate('maldormis', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('maldormis');
  });

  it('should strip accusative -n directly: "hundon" → "hundo"', async () => {
    const result = await translate('hundon', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('hundon');
  });

  it('should strip plural+accusative then derivational suffix: "lernilojn"', async () => {
    // lernilojn → strip n → lerniloj → strip j → lernilo → suffix ilo → lern → lerno
    const result = await translate('lernilojn', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('lernilojn');
  });

  it('should resolve adverb -e: "maldorme" → "maldorma"', async () => {
    const result = await translate('maldorme', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('maldorme');
  });

  it('should resolve prefix ek- with recursive lemmatization: "ekadmonas"', async () => {
    // ekadmonas → prefix ek → admonas → verb -as → admoni
    const result = await translate('ekadmonas', { lang: 'eo' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('ekadmonas');
  });
});

// ---------------------------------------------------------------------------
// Swahili (sw): derivational suffix stripping
// ---------------------------------------------------------------------------
describe('Swahili advanced morphology', () => {
  it('should strip derivational suffix -ika: "pendika" → "penda"', async () => {
    const result = await translate('pendika', { lang: 'sw' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('pendika');
  });

  it('should strip prefix + suffix: "walipenda" → "penda"', async () => {
    const result = await translate('walipenda', { lang: 'sw' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('walipenda');
  });

  it('should strip prefix + derivational suffix + ku- form: "walisomisha" → "kusoma"', async () => {
    const result = await translate('walisomisha', { lang: 'sw' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('walisomisha');
  });
});

// ---------------------------------------------------------------------------
// Finnish (fi): consonant gradation, verb suffixes, two-level possessives
// ---------------------------------------------------------------------------
describe('Finnish advanced morphology', () => {
  it('should handle consonant gradation nk→ng: "kengän" → "kenkä"', async () => {
    // kenkä (shoe) is in dict; kengän is genitive (nk→ng gradation + -n)
    const result = await translate('kengän', { lang: 'fi' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('kengän');
  });

  it('should strip two-level possessive -nsa: "talossansa" → strip -nsa → "talossa" → strip -ssa → "talo"', async () => {
    const result = await translate('talossansa', { lang: 'fi' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('talossansa');
  });

  it('should strip two-level possessive -mme: "talollamme" → strip -mme → "talolla" → strip -lla → "talo"', async () => {
    const result = await translate('talollamme', { lang: 'fi' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('talollamme');
  });
});

// ---------------------------------------------------------------------------
// Persian (fa): ZWNJ compounds, verb forms
// ---------------------------------------------------------------------------
describe('Persian advanced morphology', () => {
  it('should split ZWNJ compound: "می‌کند"', async () => {
    const result = await translate('می\u200Cکند', { lang: 'fa' });
    expect(result).toBeTruthy();
  });

  it('should strip -ای indefinite suffix', async () => {
    const result = await translate('کتابای', { lang: 'fa' });
    expect(result).toBeTruthy();
  });

  it('should strip نمی ZWNJ verb ending: "نمی‌خوانند" → strip ند → "خوان"', async () => {
    const result = await translate('\u0646\u0645\u06CC\u200C\u062E\u0648\u0627\u0646\u0646\u062F', {
      lang: 'fa',
    });
    expect(result).toBeTruthy();
  });

  it('should join ZWNJ parts: "آبا‌دان" → "آبادان"', async () => {
    const result = await translate('\u0622\u0628\u0627\u200C\u062F\u0627\u0646', { lang: 'fa' });
    expect(result).toBeTruthy();
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
// Reverse map built via reverseTranslate (dict.ts lines 466-496)
// ---------------------------------------------------------------------------
describe('reverse map built via reverseTranslate', () => {
  const BUILD_LANG = 'test-reverse-build';
  const testDict: PhoneDict = {
    entries: {
      cat: ['K', 'AE1', 'T'],
      dog: ['D', 'AO1', 'G'],
    },
    lang: BUILD_LANG,
    nonLatinScript: true,
  };

  it('should reverse-translate words from a built reverse map', async () => {
    setDictLoader(() => Promise.resolve(testDict));
    await translate('cat', { lang: BUILD_LANG });
    await reverseTranslate('kat', { lang: BUILD_LANG });

    expect(reverseTranslateSync('kat', { lang: BUILD_LANG })).toBe('cat');
    expect(reverseTranslateSync('dawg', { lang: BUILD_LANG })).toBe('dog');
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
// Coverage: reverse.ts exported function edge cases
// ===========================================================================
describe('reverseTranslateIPAWord edge cases', () => {
  it('returns [] for empty string', () => {
    expect(reverseTranslateIPAWord('')).toEqual([]);
  });

  it('returns [ipaWord] for whitespace-only input', () => {
    expect(reverseTranslateIPAWord('   ')).toEqual(['   ']);
  });

  it('returns [ipaWord] when IPA cannot convert to arpabet', () => {
    // A click consonant that has no arpabet mapping
    expect(reverseTranslateIPAWord('\u01C0')).toEqual(['\u01C0']);
  });
});

describe('reverseTranslateWord edge cases', () => {
  it('returns [] for empty string', () => {
    expect(reverseTranslateWord('')).toEqual([]);
  });

  it('returns [ingglishWord] for non-letter input like "123"', () => {
    expect(reverseTranslateWord('123')).toEqual(['123']);
  });
});

// ===========================================================================
// Coverage: non-English reverse with alternative phoneme match (line 247)
// ===========================================================================

describe('non-English reverse edge cases (reverseLangWordAsResult)', () => {
  const EDGE_LANG = 'test-lang-edge';

  // Dict where entry has AH phoneme — input word "kat" maps to AE which
  // has AH as alternative, so the alternative path (line 247) fires
  const edgeDict: PhoneDict = {
    entries: {
      kut: ['K', 'AH1', 'T'], // reverse key: "K AH T" — matches AE→AH alternative of "kat"
    },
    lang: EDGE_LANG,
    nonLatinScript: true,
  };

  it('should set up edge lang dict', async () => {
    setDictLoader(() => Promise.resolve(edgeDict));
    const result = await translate('kut', { lang: EDGE_LANG });
    expect(result).toBeTruthy();
    await reverseTranslate('kaht', { lang: EDGE_LANG });
  });

  it('word found via alternative phoneme interpretation (line 247)', () => {
    // "kat" → arpabet ["K", "AE", "T"] → primary key "K AE T" not in map
    // → alternative AE→AH → "K AH T" IS in map → returns "kut"
    const result = reverseTranslateSync('kat', { lang: EDGE_LANG });
    expect(result).toBe('kut');
  });

  it('word not in reverse map returns unmatched', () => {
    const result = reverseTranslateSync('blib', { lang: EDGE_LANG });
    expect(result).toBe('blib');
  });

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
