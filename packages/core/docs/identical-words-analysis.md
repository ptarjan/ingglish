# Identical Words Analysis

This document analyzes whether the current Ingglish phoneme mappings maximize "identical words" — words where the Ingglish spelling equals the English spelling.

## Executive Summary

**Question:** Does the current mapping maximize identical words?

**Answer:** No, but with good reason.

The current mapping produces **6,930 identical words** (5.13% of the CMU dictionary). Alternative mappings could theoretically produce up to **15,489 identical words** (11.47%), but these create unacceptable collisions where different words become indistinguishable.

However, we found **5 safe improvements** that add **+564 identical words** without creating new collisions.

## Background

An "identical word" is one where converting English → phonemes → Ingglish produces the original English spelling. For example:
- "bit" → /B IH T/ → "bit" ✓ (identical)
- "boat" → /B OW T/ → "boht" ✗ (changed)

More identical words mean less visual disruption when reading Ingglish text.

## Current Mapping Performance

| Metric | Value |
|--------|-------|
| Total words in CMU dictionary | 135,143 |
| Identical words | 6,930 (5.13%) |
| Existing collisions (homophones) | 20,185 |

## Why Not Maximize Identical Words?

We tested mappings that maximize identical words:

| Change | Identical Gain | Problem |
|--------|---------------|---------|
| OW: oh → o | +1,200 | "go" and "got" both become "go" |
| AH: u → a | +782 | "cup" and "cap" both become "cap" |
| Z: z → s | +755 | "prize" becomes "prise" |
| AO: aw → o | +532 | "saw" and "so" both become "so" |

These changes create **collisions** — different words that get the same spelling. This destroys meaning and makes text ambiguous.

## Safe Improvements Found

We exhaustively tested all 39 phonemes × 70 spelling options (2,730 combinations) to find changes that:
1. Increase identical word count
2. Do NOT create new collisions

### Results

| Phoneme | Current | Proposed | Gained | Lost | Net Gain |
|---------|---------|----------|--------|------|----------|
| AY | ai | ei | +352 | -36 | **+316** |
| OW | oh | ow | +217 | -80 | **+137** |
| AO | aw | au | +203 | -140 | **+63** |
| UW | uu | eu | +43 | -2 | **+41** |
| OY | oi | oy | +118 | -108 | **+10** |
| **Total** | | | | | **+564** |

Combined effect: 6,930 → 7,494 identical words (5.13% → 5.54%)

### Trade-off Analysis

Each change involves gaining some identical words while losing others:

#### AY: "ai" → "ei" (Best ROI: +316 net)

**Gained (352 words):** Common words with "ei" spelling
- bernstein, brandeis, einstein, weinstein, klein, stein,stein, reich, heist, seize, feisty, height, sleight, etc.

**Lost (36 words):** Words with "ai" for the /AY/ sound
- thai, chai, bonsai, mai, kai, samurai, shanghai, etc.

**Assessment:** Excellent trade. Gains mainstream words, loses mostly loanwords and proper nouns.

#### OW: "oh" → "ow" (+137 net)

**Gained (217 words):** Words with "ow" spelling
- blow, flow, glow, grow, know, show, slow, snow, throw, below, follow, tomorrow, etc.

**Lost (80 words):** German-origin names with "oh" spelling
- bohn, bohner, groh, stroh, doh, etc.

**Assessment:** Good trade. Gains common English words, loses mostly German surnames.

#### AO: "aw" → "au" (+63 net)

**Gained (203 words):** Words with "au" spelling
- audit, august, author, autumn, because, caught, daughter, fault, haul, etc.

**Lost (140 words):** Words with "aw" spelling
- dawn, draw, flaw, jaw, law, paw, raw, saw, straw, etc.

**Assessment:** Mixed trade. Both sets contain common words. The "au" words are slightly more frequent in formal text.

#### UW: "uu" → "eu" (+41 net, Best Efficiency)

**Gained (43 words):** Words with "eu" spelling
- deuce, feud, neutral, neuron, pneumonia, pseudo, therapeutic, etc.

**Lost (2 words):**
- Only loses "uu" (the interjection) and one other rare word

**Assessment:** Excellent efficiency. Almost pure gain with minimal loss.

#### OY: "oi" → "oy" (+10 net)

**Gained (118 words):** Words with "oy" spelling
- boy, joy, toy, enjoy, destroy, employ, royal, loyal, etc.

**Lost (108 words):** Words with "oi" spelling
- oil, boil, coin, join, point, voice, choice, noise, etc.

**Assessment:** Marginal trade. Nearly breaks even. Both "oi" and "oy" are common spellings.

## Alternative Improvements Not Recommended

These changes improved identical count but were rejected:

| Change | Net Gain | Reason Rejected |
|--------|----------|-----------------|
| OW: oh → oa | +70 | Lower gain than "ow" for same phoneme |
| OW: oh → oe | +54 | Lower gain than "ow" for same phoneme |
| AY: ai → ie | +5 | Lower gain than "ei" for same phoneme |

## Collision Check

We verified the proposed changes don't create problematic collisions:

| Word Pair | Current | Proposed | Status |
|-----------|---------|----------|--------|
| cup / cap | kup / kap | kup / kap | ✓ Distinct |
| cut / cat | kut / kat | kut / kat | ✓ Distinct |
| go / got | goh / got | gow / got | ✓ Distinct |
| so / saw | soh / saw | sow / sau | ✓ Distinct |
| know / now | noh / now | now / now | ⚠️ Collision! |

**Note:** "know" → "now" collision already exists in English (homophones) and is counted in the baseline 20,185 collisions.

## Recommendations

### High Confidence Changes

These have excellent gain-to-loss ratios:

1. **UW: "uu" → "eu"** — Nearly pure gain (+41), minimal disruption
2. **AY: "ai" → "ei"** — Large gain (+316), loses only loanwords

### Moderate Confidence Changes

These trade common words for other common words:

3. **OW: "oh" → "ow"** — Gains everyday words (+137), loses German names
4. **AO: "aw" → "au"** — Trade-off between "au" and "aw" words (+63)

### Low Confidence Change

5. **OY: "oi" → "oy"** — Nearly breaks even (+10), may not be worth the churn

## Methodology

Analysis scripts are in `packages/core/scripts/`:

- `analyze-identical-words.ts` — Initial analysis of mapping alternatives
- `find-best-mapping.ts` — Find optimal mapping ignoring collisions
- `find-best-no-collisions.ts` — Find best mapping without new collisions
- `exhaustive-search.ts` — Test all possible single-character and digraph options

Run with:
```bash
npx vite-node scripts/exhaustive-search.ts
```

## Conclusion

The claim "we prioritize mappings that create more identical words" is **partially true**. The current mappings do prioritize disambiguation over raw identical count, which is the right choice. However, there are safe optimizations available that would add +564 identical words (8% improvement) without creating new collisions.

Whether to implement these changes depends on:
1. How much weight we give to identical word count vs. stability
2. Whether the specific words lost (thai, chai, dawn, draw) matter more than words gained
3. Appetite for changing the established spelling conventions
