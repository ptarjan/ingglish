# Identical Words Analysis

Do the current Ingglish phoneme mappings maximize "identical words," words where the Ingglish spelling matches the English spelling?

## Summary

No, and that's intentional.

The current mapping produces **6,930 identical words** (5.13% of the CMU dictionary). Alternative mappings could theoretically produce up to **15,489 identical words** (11.47%), but these create unacceptable collisions where different words become indistinguishable.

We exhaustively investigated 5 collision-free alternatives that could add **+564 identical words**, but all were rejected because they reintroduce pronunciation ambiguity for English readers -- see [Recommendations](#recommendations).

## Background

An "identical word" is one where converting English → phonemes → Ingglish produces the original English spelling. For example:
- "bit" → /bɪt/ → "bit" ✓ (identical)
- "boat" → /boʊt/ → "boht" ✗ (changed)

More identical words means more natural readability for native English readers: familiar words stay familiar.

Not all identical words are equal, though. Many words in the CMU dictionary are loanwords (German surnames like "Einstein", French words like "chateau"). Biasing spellings toward these source languages might increase the identical count, but these words won't feel familiar to English readers anyway. We use the [orthography comparison](orthography-comparison.md) to guide decisions, prioritizing spellings with broad international support rather than chasing loanword matches.

## Current Mapping Performance

| Metric | Value |
|--------|-------|
| Total words in CMU dictionary | 135,166 |
| Identical words | 6,930 (5.13%) |
| Existing collisions (homophones) | 20,180 |

## Why Not Maximize Identical Words?

We tested mappings that maximize identical words:

| Change | Identical Gain | Problem |
|--------|---------------|---------|
| /oʊ/: oh → o | +1,200 | "go" and "got" both become "go" |
| /ʌ/: u → a | +782 | "cup" and "cap" both become "cap" |
| /z/: z → s | +755 | "prize" becomes "prise" |
| /ɔ/: aw → o | +532 | "saw" and "so" both become "so" |

These changes create **collisions**: different words that get the same spelling. This destroys meaning and makes text ambiguous.

## Collision-Free Alternatives Investigated

We exhaustively tested all 39 phonemes × 70 spelling options (2,730 combinations) to find changes that increase identical word count without creating new collisions. Five candidates emerged -- all were ultimately rejected (see [Recommendations](#recommendations)).

### Candidates

| Phoneme | Current | Proposed | Gained | Lost | Net Gain |
|---------|---------|----------|--------|------|----------|
| /aɪ/ | ai | ei | +352 | -36 | **+316** |
| /oʊ/ | oh | ow | +217 | -80 | **+137** |
| /ɔ/ | aw | au | +203 | -140 | **+63** |
| /uː/ | uu | eu | +43 | -2 | **+41** |
| /ɔɪ/ | oi | oy | +118 | -108 | **+10** |
| **Total** | | | | | **+564** |

Combined effect: 6,930 → 7,494 identical words (5.13% → 5.54%)

### Trade-off Analysis

#### /aɪ/: "ai" → "ei" (+316 net)

**Gained (352 words):** Words with "ei" spelling
- German surnames: bernstein, einstein, weinstein, klein, reich (loanwords)
- Native English: heist, seize, feisty, height, sleight, vein, rein

**Lost (36 words):** Words with "ai" for the /aɪ/ sound
- Asian loanwords: thai, chai, bonsai, mai, kai, samurai, shanghai

Mixed. Both gains and losses are largely loanwords. The native English gains (heist, height, seize) are valuable, but many German surname matches won't feel familiar to readers anyway.

#### /oʊ/: "oh" → "ow" (+137 net)

**Note:** In previous analysis, /eɪ/→ai was listed as a chain improvement enabled by /aɪ/→ei freeing the 'ai' spelling. After the R-colored vowel changes, this chain is no longer found as a valid safe improvement by the exhaustive search.

**Gained (217 words):** Words with "ow" spelling
- blow, flow, glow, grow, know, show, slow, snow, throw, below, follow, tomorrow, etc.

**Lost (80 words):** German-origin names with "oh" spelling
- bohn, bohner, groh, stroh, doh, etc.

Good trade. Gains common English words, loses mostly German surnames.

#### /ɔ/: "aw" → "au" (+63 net)

**Gained (203 words):** Words with "au" spelling
- audit, august, author, autumn, because, caught, daughter, fault, haul, etc.

**Lost (140 words):** Words with "aw" spelling
- dawn, draw, flaw, jaw, law, paw, raw, saw, straw, etc.

Mixed. Both sets contain common words.

#### /uː/: "uu" → "eu" (+41 net, Best Efficiency)

**Gained (43 words):** Words with "eu" spelling
- deuce, feud, neutral, neuron, pneumonia, pseudo, therapeutic, etc.

**Lost (2 words):**
- Only loses "uu" (the interjection) and one other rare word

Almost pure gain. Best ratio of any candidate.

#### /ɔɪ/: "oi" → "oy" (+10 net)

**Gained (118 words):** Words with "oy" spelling
- boy, joy, toy, enjoy, destroy, employ, royal, loyal, etc.

**Lost (108 words):** Words with "oi" spelling
- oil, boil, coin, join, point, voice, choice, noise, etc.

Nearly breaks even. Both "oi" and "oy" are common spellings.

## Alternative Improvements Not Recommended

These changes improved identical count but were rejected:

| Change | Net Gain | Reason Rejected |
|--------|----------|-----------------|
| /oʊ/: oh → oa | +70 | Lower gain than "ow" for same phoneme |
| /oʊ/: oh → oe | +54 | Lower gain than "ow" for same phoneme |
| /aɪ/: ai → ie | +5 | Lower gain than "ei" for same phoneme |
| /eɪ/: ay → ai | +48 | Only works if /aɪ/→ei frees 'ai'; loses "day", "say", "way" |

## Collision Check

We verified the proposed changes don't create problematic collisions:

| Word Pair | Current | Proposed | Status |
|-----------|---------|----------|--------|
| cup / cap | kup / kap | kup / kap | ✓ Distinct |
| cut / cat | kut / kat | kut / kat | ✓ Distinct |
| go / got | goh / got | gow / got | ✓ Distinct |
| so / saw | soh / saw | sow / sau | ✓ Distinct |
| know / now | noh / now | now / now | ⚠️ Collision! |

**Note:** "know" (/noʊ/) and "now" (/naʊ/) are not homophones. This is a genuine new collision introduced by the "ow" spelling, and one of the reasons it was rejected.

## Recommendations

### No changes recommended.

All five proposed changes were investigated and rejected. The identical word count is useful but has a blind spot: it counts string matches without checking whether an English reader would *pronounce* the shared spelling correctly. A spelling that matches more English words is harmful if those new combinations mislead readers.

### Rejected: /oʊ/: "oh" → "ow" (+137 net)

The gains look good on paper: snow, throw, bowl, window all become identical. But `ow` is **ambiguous in English**: it represents both /oʊ/ (snow, throw) and /aʊ/ (cow, town, brown). New combinations like `bownz` (bones) read as "bowns", `howm` (home) reads like it rhymes with "cow", and `stown` (stone) reads like "stoun". This reintroduces exactly the kind of ambiguity ingglish is designed to eliminate.

### Rejected: /uː/: "uu" → "eu" (+41 net)

Numerically the best efficiency: +41 words for only 2 losses. But `eu` in English implies a /j/ onset: "feud", "deuce", "neural" are all /juː/. So `meun` (moon) reads as "mew-n" (two syllables), `seun` (soon) reads as "syoon", and `teu` (too) reads as "tyoo". The mapping actively misleads rather than helps.

### Rejected: /aɪ/: "ai" → "ei" (+316 net)

Most gains are German loanwords (einstein, bernstein, weinstein, klein, reich) that don't feel familiar to English readers anyway.

### Rejected: /ɔ/: "aw" → "au" (+63 net)

Trades common "aw" words (dawn, draw, flaw, jaw, law, saw) for common "au" words (audit, august, author, autumn). Nearly a wash, no compelling reason to change.

### Rejected: /ɔɪ/: "oi" → "oy" (+10 net)

Nearly breaks even. Not worth the disruption.

## Methodology

Analysis scripts are in `packages/core/scripts/`:

- `analyze-identical-words.ts` - Explains why maximizing identical words creates problems
- `exhaustive-search.ts` - Exhaustively tests all possible spelling options

Run with:
```bash
npx vite-node scripts/exhaustive-search.ts
```

## Why Identical Word Count Can Mislead

The identical word count measures string equality, but **it doesn't measure whether the shared spelling reads correctly**. A proposed change must pass two tests:

1. **No new collisions** (different words getting the same spelling). The exhaustive search checks this.
2. **No new ambiguity** (the spelling reads as the wrong sound to English readers). This requires human judgment.

The `ow` and `eu` changes both pass test 1 but fail test 2. They don't create collisions in the formal sense, but they create *perceptual* collisions where English readers' existing intuitions produce the wrong pronunciation.

The current mappings (`oh` for /oʊ/, `uu` for /uː/) work precisely because they have **no competing English interpretation** to mislead readers. `oh` is unusual but unambiguous. `uu` has no English precedent to conflict with. The Finnish "double for long" logic succeeds here because English never uses `uu`.

## Conclusion

The current mappings are well-optimized. Alternative spellings could add up to +564 identical words, but every proposed change either loses common words, gains mostly loanwords, or reintroduces the pronunciation ambiguity that Ingglish exists to fix.

6,930 identical words (5.13%) is roughly the limit for a system that prioritizes unambiguous readability over matching more English spellings.
