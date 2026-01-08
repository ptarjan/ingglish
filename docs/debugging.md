# Debugging Round-Trip Translation Issues

When a word fails to round-trip (English → Ingglish → English or English → IPA → English doesn't return the original), use this guide to diagnose and fix the issue.

## Quick Start

```bash
# From the repo root
npm run debug:roundtrip -w @ingglish/core exhumed
```

This shows a detailed breakdown of the translation pipeline.

> **Note:** The debug script runs via vitest because the CMU dictionary uses JSON imports that require proper ESM handling. The script generates a temporary test file, runs it, then cleans up.

## Understanding the Output

```
═══════════════════════════════════════════
  Round-trip Debug: "exhumed"
═══════════════════════════════════════════

1. CMU Dictionary Lookup
   Raw: EH0 K S HH Y UW1 M D
   Phonemes: [EH, K, S, HH, Y, UW, M, D]

2. English → Ingglish
   "exhumed" → "ekshyoomd"

3. Ingglish → Phonemes (what reverse translator sees)
   "ekshyoomd" → [EH, K, SH, Y, UW, M, D]

4. Phoneme Comparison
   Expected vs Parsed:
   ✓ EH        vs EH
   ✓ K         vs K
   ✗ S         vs SH       ← Mismatch!
   ✗ HH        vs Y
   ...

5. Reverse Translation Results
   Input: "ekshyoomd"
   Results: [exhumed]

6. Round-trip Result
   ✓ SUCCESS - "exhumed" found in results
```

## Common Issues

### 1. Phoneme Parsing Ambiguity

The most common issue is when an Ingglish spelling can be parsed multiple ways:

| Ingglish | Could be | Example |
|----------|----------|---------|
| `sh` | SH (ship) or S+HH (exhume) | "ekshyoomd" |
| `er` | ER (bird) or EH+R (welfare) | "welfer" |
| `th` | TH (think) or T+HH (Thailand) | "tailand" |

**Solution:** Add an entry to `PHONEME_ALTERNATIVES` in `reverse-translator.ts`:

```typescript
const PHONEME_ALTERNATIVES: Record<string, string[][]> = {
  ER: [['EH', 'R']],
  SH: [['S', 'HH']],  // ← Add alternative interpretation
};
```

### 2. Word Not in CMU Dictionary

If step 1 shows "Word not found", the word isn't in the CMU Pronouncing Dictionary. It will be passed through unchanged or use fallback heuristics.

### 3. Phoneme Sequence Not Found

If the parsed phonemes don't match any dictionary entry, check:
1. Are the expected phonemes correct? (CMU may have errors)
2. Is there a more common word with the same phonemes? (homophones)

## Adding a Regression Test

After fixing an issue, add a test to prevent regression:

```typescript
// In reverse-translator.test.ts
it('should round-trip "exhumed"', () => {
  // Regression test: "sh" can be SH (ship) or S+HH (exhume)
  const word = 'exhumed';
  const ingglish = translateWord(word);
  const results = reverseTranslateWord(ingglish);
  expect(results).toContain(word);
});
```

## Architecture Overview

```
English → Ingglish → English
         │         │
         ▼         ▼
   ARPAbet → spelling → ARPAbet
         │                    │
    CMU Dict              REVERSE_ARPABET_MAP
                              │
                         ARPABET_ALTERNATIVES
                         (handles ambiguity)

English → IPA → English
         │         │
         ▼         ▼
   ARPAbet → IPA symbols → ARPAbet
         │                    │
    CMU Dict              ipaToArpabet()
         │
   arpabetToIPA()
```

The forward path (English → Ingglish) uses the CMU dictionary to get ARPAbet phonemes, then maps them to Ingglish spellings.

The forward path (English → IPA) uses the CMU dictionary to get ARPAbet phonemes, then converts to IPA with proper stress markers at syllable boundaries.

The reverse path (Ingglish → English) parses the spelling back to ARPAbet using `REVERSE_ARPABET_MAP`, then looks up words with matching ARPAbet sequences. `ARPABET_ALTERNATIVES` handles cases where the same spelling could represent different ARPAbet sequences.

The reverse path (IPA → English) converts IPA symbols back to ARPAbet using `ipaToArpabet()`, then looks up matching words.
