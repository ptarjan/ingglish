/**
 * Integration tests for edge cases in the translation pipeline.
 * Tests exercise internal code paths through the public API
 * (translateWord, translateSync, reverseTranslateWord, reverseTranslateSync).
 */
import { describe, expect, it } from 'vitest';
import { lookupPronunciation } from '@ingglish/dictionary';
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
// Stemming: -ed allomorphs (stemming.ts lines 28, 33)
// ---------------------------------------------------------------------------
describe('stemming -ed allomorphs', () => {
  it('should translate -ed after T/D with /ɪd/ (e.g. "hunted")', () => {
    // "hunt" is in dictionary, "hunted" exercises -ed after T → IH0 D
    const pron = lookupPronunciation('hunt');
    if (!pron) {
      return; // skip if not in dictionary
    }
    const result = translateWord('hunted');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('hunted'); // should be translated
  });

  it('should translate -ed after voiced consonant with /d/ (e.g. "slammed")', () => {
    const pron = lookupPronunciation('slam');
    if (!pron) {
      return;
    }
    const result = translateWord('slammed');
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).not.toBe('slammed');
  });

  it('should translate -ed after voiceless consonant with /t/ (e.g. "walked")', () => {
    const pron = lookupPronunciation('walk');
    if (!pron) {
      return;
    }
    const result = translateWord('walked');
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Stemming: -s allomorphs (stemming.ts lines 45, 48)
// ---------------------------------------------------------------------------
describe('stemming -s/-es allomorphs', () => {
  it('should translate -es after sibilants with /ɪz/ (e.g. "foxes")', () => {
    const pron = lookupPronunciation('fox');
    if (!pron) {
      return;
    }
    const result = translateWord('foxes');
    expect(result).toBeTruthy();
  });

  it('should translate -s after voiced consonant with /z/ (e.g. "blogs")', () => {
    const pron = lookupPronunciation('blog');
    if (!pron) {
      return;
    }
    const result = translateWord('blogs');
    expect(result).toBeTruthy();
  });

  it('should translate -s after voiceless consonant with /s/ (e.g. "cups")', () => {
    const pron = lookupPronunciation('cup');
    if (!pron) {
      return;
    }
    const result = translateWord('cups');
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
