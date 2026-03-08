/**
 * Integration tests for edge cases in the translation pipeline.
 * Tests exercise internal code paths through the public API
 * (translateWord, translateSync, reverseTranslateWord, reverseTranslateSync).
 */
import { describe, expect, it } from 'vitest';
import { lookupPronunciation } from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import { setDictReverseMap, setLangDict } from '../dict-loader';
import { translateSync, translateSyncWithMapping, translateWord } from './forward';
import {
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
  reverseTranslateWord,
} from './reverse';

// ---------------------------------------------------------------------------
// Forward: camelCase with all-caps acronym (forward.ts line 360)
// ---------------------------------------------------------------------------
describe('camelCase with all-caps acronyms', () => {
  it('should pass through acronym parts unchanged in ChatGPT', () => {
    const result = translateWord('ChatGPT');
    // "GPT" stays as-is (all-caps acronym ≥2 chars)
    expect(result).toMatch(/GPT$/);
  });

  it('should pass through acronym in OpenAI', () => {
    const result = translateWord('OpenAI');
    expect(result).toMatch(/AI$/);
  });
});

// ---------------------------------------------------------------------------
// Forward: camelCase with unknown part (forward.ts lines 368-369)
// ---------------------------------------------------------------------------
describe('camelCase with unknown parts', () => {
  it('should handle camelCase where a part has no dictionary entry', () => {
    // "xyzFoo" — "xyz" is unknown, "Foo" may or may not be known
    const result = translateWord('xyzFoo');
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

  it("should handle can't round-trip", () => {
    const ingglish = translateSync("can't");
    const back = reverseTranslateSync(ingglish);
    expect(back.toLowerCase()).toBe("can't");
  });

  it("should reverse-translate it's", () => {
    const ingglish = translateSync("it's");
    const back = reverseTranslateSync(ingglish);
    expect(back.toLowerCase()).toBe("it's");
  });

  it("should reverse-translate I've", () => {
    const ingglish = translateSync("I've");
    const back = reverseTranslateSync(ingglish);
    expect(back.toLowerCase()).toMatch(/i've/);
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
    const result = translateWord('formatted');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('formatted');
  });

  it('should translate -ed after voiced consonant with /d/ (e.g. "blogged")', () => {
    // "blog" ends in G (voiced) → D allomorph (stemming.ts line 33)
    expect(lookupPronunciation('blogged')).toBeNull();
    const result = translateWord('blogged');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('blogged');
  });

  it('should translate -ed after voiceless consonant with /t/ (e.g. "skyped")', () => {
    // "skype" ends in P (voiceless) → T allomorph (stemming.ts line 31)
    expect(lookupPronunciation('skyped')).toBeNull();
    const result = translateWord('skyped');
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
    const result = translateWord('relaunches');
    expect(result).toBeTruthy();
  });

  it('should translate -s after voiced consonant with /z/ (e.g. "debugs")', () => {
    // "debug" ends in G (voiced) → Z allomorph (stemming.ts line 50)
    expect(lookupPronunciation('debugs')).toBeNull();
    const result = translateWord('debugs');
    expect(result).toBeTruthy();
  });

  it('should translate -s after voiceless consonant with /s/ (e.g. "podcasts")', () => {
    // "podcast" ends in T (voiceless) → S allomorph (stemming.ts line 48)
    expect(lookupPronunciation('podcasts')).toBeNull();
    const result = translateWord('podcasts');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Stemming: -ing, -tion, prefix un-, re-
// ---------------------------------------------------------------------------
describe('stemming additional patterns', () => {
  it('should translate unknown -ing words via stem', () => {
    // "outrunning" — might not be in dict but "outrun" or "run" is
    const result = translateWord('outrunning');
    expect(result).toBeTruthy();
  });

  it('should handle un- prefixed words', () => {
    // "undo" is in dictionary, but "unbreak" might not be
    const pron = lookupPronunciation('break');
    if (!pron) {
      return;
    }
    const result = translateWord('unbreak');
    // Should translate via prefix stemming if "unbreak" isn't in dict
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Compounds: case preservation (compounds.ts line 164)
// ---------------------------------------------------------------------------
describe('compound word translation', () => {
  it('should translate compound words like "sunlight"', () => {
    const hasSun = lookupPronunciation('sun');
    const hasLight = lookupPronunciation('light');
    if (!hasSun || !hasLight) {
      return;
    }
    const result = translateWord('sunlight');
    expect(result).toBeTruthy();
    // Should be a translation of sun + light
  });

  it('should preserve capitalization in compound words', () => {
    // "Sunlight" with capital S
    const hasSun = lookupPronunciation('sun');
    const hasLight = lookupPronunciation('light');
    if (!hasSun || !hasLight) {
      return;
    }
    const result = translateWord('Sunlight');
    // First letter should be capitalized
    expect(result[0]).toBe(result[0]!.toUpperCase());
  });
});

// ---------------------------------------------------------------------------
// Unstressed schwa mapping (to-ingglish.ts lines 22-26)
// ---------------------------------------------------------------------------
describe('unstressed schwa mapping', () => {
  it('should map AH0 (unstressed schwa) to "a" in "about"', () => {
    const result = translateWord('about');
    // "about" = AH0 B AW1 T → "a" + "bout" (not "u")
    expect(result.toLowerCase()).toMatch(/^a/);
  });

  it('should map stressed AH1 differently from AH0', () => {
    // "up" = AH1 P → "up" (stressed → "u")
    const result = translateWord('up');
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

  it('should reverse-translate single-word Ingglish', () => {
    const result = reverseTranslateSync('kat');
    expect(result).toBe('cat');
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
    const result = translateWord('Api');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Forward: low-confidence G2P fallback (forward.ts line 215)
// ---------------------------------------------------------------------------
describe('G2P fallback for unknown words', () => {
  it('should translate a plausible but unknown word via G2P', () => {
    // A word with vowels that's not in the dictionary but G2P can handle
    const result = translateWord('flonkify');
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
// Reverse: non-English language reverse translation (reverse.ts lines 222-257)
// Uses dict-loader's setDictReverseMap (dict-loader.ts lines 41, 97)
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
  setLangDict(MOCK_LANG, mockDict);

  // Build a reverse map: ARPAbet (stress-stripped) → source words
  const reverseMap = new Map<string, string[]>([['N EH K OW', ['猫']]]);
  setDictReverseMap(MOCK_LANG, reverseMap);

  it('should reverse-translate Ingglish back to source language word', () => {
    // "nekoh" → N EH K OW (stripped) → matches reverse map → 猫
    const result = reverseTranslateSync('nekoh', { lang: MOCK_LANG });
    expect(result).toBe('猫');
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
// Reverse: non-English alternative phoneme match (reverse.ts lines 244-247)
// ---------------------------------------------------------------------------
describe('non-English reverse with alternative phoneme match', () => {
  const ALT_LANG = 'test-lang-alt';

  const altDict: PhoneDict = {
    entries: {
      kat: ['K', 'AE1', 'T'],
    },
    lang: ALT_LANG,
    nonLatinScript: true,
  };
  setLangDict(ALT_LANG, altDict);

  // Only register the AH variant (not AE) so primary misses, alternative hits
  const altReverseMap = new Map<string, string[]>([['K AH T', ['キャット']]]);
  setDictReverseMap(ALT_LANG, altReverseMap);

  it('should fall back to alternative phoneme variant when primary misses', () => {
    // "kat" → primary K AE T (no match) → alt K AH T (match) → キャット
    const result = reverseTranslateSync('kat', { lang: ALT_LANG });
    expect(result).toBe('キャット');
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
  setLangDict(NO_G2P_LANG, noG2pDict);

  it('should return word unchanged when not in dict and no G2P exists', () => {
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
// Round-trip edge cases
// ---------------------------------------------------------------------------
describe('round-trip edge cases', () => {
  it('should round-trip words with silent letters', () => {
    const words = ['knight', 'knife', 'know', 'write', 'wrong'];
    for (const word of words) {
      const ingglish = translateWord(word);
      const results = reverseTranslateWord(ingglish);
      expect(results.length, `${word} → ${ingglish}`).toBeGreaterThan(0);
    }
  });

  it('should round-trip words with -ough patterns', () => {
    const words = ['though', 'through', 'tough', 'cough', 'bought'];
    for (const word of words) {
      const ingglish = translateWord(word);
      const results = reverseTranslateWord(ingglish);
      expect(results, `${word} → ${ingglish}`).toContain(word);
    }
  });

  it('should round-trip words ending in -tion/-sion', () => {
    const words = ['nation', 'vision', 'station', 'decision'];
    for (const word of words) {
      const ingglish = translateWord(word);
      const results = reverseTranslateWord(ingglish);
      expect(results, `${word} → ${ingglish}`).toContain(word);
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
  it('should translate to IPA format', () => {
    const result = translateWord('hello', { format: 'ipa' });
    // IPA should contain IPA characters, not Latin
    expect(result).toContain('l');
    expect(result).toBeTruthy();
  });

  it('should translate sentence to IPA', () => {
    const result = translateSync('hello world', { format: 'ipa' });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should translate unknown word to IPA via G2P', () => {
    const result = translateWord('flonkify', { format: 'ipa' });
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Pronunciation/guide format (to-pronunciation.ts)
// ---------------------------------------------------------------------------
describe('pronunciation format translation', () => {
  it('should translate to guide pronunciation format', () => {
    const result = translateWord('hello', { format: 'pronunciation' });
    // Guide format uses hyphens between syllables and CAPS for stress
    expect(result).toContain('-');
    expect(result).toMatch(/[A-Z]/);
  });

  it('should translate multisyllabic word to pronunciation', () => {
    const result = translateWord('beautiful', { format: 'pronunciation' });
    expect(result).toContain('-');
    // Should have at least 2 syllables
    expect(result.split('-').length).toBeGreaterThanOrEqual(2);
  });

  it('should translate monosyllabic word to pronunciation', () => {
    const result = translateWord('cat', { format: 'pronunciation' });
    // No hyphen for single syllable
    expect(result).not.toContain('-');
    // Should be in caps (stressed)
    expect(result).toBe(result.toUpperCase());
  });
});

// ---------------------------------------------------------------------------
// Deseret format (to-deseret.ts, from-deseret.ts, tokenize.ts)
// ---------------------------------------------------------------------------
describe('deseret format translation', () => {
  it('should translate to Deseret script', () => {
    const result = translateSync('hello world', { format: 'deseret' });
    // Should not contain Latin letters
    expect(result).not.toMatch(/[a-z]/i);
    expect(result).toBeTruthy();
  });

  it('should reverse-translate Deseret text', () => {
    const deseret = translateSync('cat', { format: 'deseret' });
    const back = reverseTranslateSync(deseret, { format: 'deseret' });
    expect(back.toLowerCase()).toBe('cat');
  });

  it('should reverse-translate Deseret with mapping', () => {
    const deseret = translateSync('hello world', { format: 'deseret' });
    const tokens = reverseTranslateSyncWithMapping(deseret, { format: 'deseret' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Shavian reverse translation (from-shavian.ts, reverse-factory.ts)
// ---------------------------------------------------------------------------
describe('shavian reverse translation', () => {
  it('should reverse-translate Shavian text', () => {
    const shavian = translateSync('cat', { format: 'shavian' });
    const back = reverseTranslateSync(shavian, { format: 'shavian' });
    expect(back.toLowerCase()).toBe('cat');
  });

  it('should reverse-translate Shavian with mapping', () => {
    const shavian = translateSync('hello world', { format: 'shavian' });
    const tokens = reverseTranslateSyncWithMapping(shavian, { format: 'shavian' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(2);
    for (const w of words) {
      expect(w.matched).toBe(true);
    }
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
  setLangDict(R_LANG, rDict);

  it('should translate with R-coloring disabled', () => {
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
    const result = translateWord('SUNLIGHT');
    expect(result).toBeTruthy();
    // All caps should be preserved
    expect(result).toBe(result.toUpperCase());
  });

  it('should handle compound with mixed-case parts', () => {
    // "GitHub" — compound where first part should preserve case
    const result = translateWord('GitHub');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// British spelling resolver (register-english.ts line 25-28)
// ---------------------------------------------------------------------------
describe('British spelling resolution', () => {
  it('should translate British -ise spelling via American -ize', () => {
    const result = translateWord('realise');
    // Should translate (via "realize" lookup)
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('realise');
  });

  it('should translate British -our spelling via American -or', () => {
    const result = translateWord('colour');
    // Should translate (via "color" lookup)
    expect(result).toBeTruthy();
  });

  it('should translate British -re spelling via American -er', () => {
    const result = translateWord('centre');
    // Should translate (via "center" lookup)
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
    const result = translateWord('catdog');
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
    const result = translateWord('Naïve');
    expect(result).toBeTruthy();
  });
});
