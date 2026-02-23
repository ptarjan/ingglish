# Mapping Quality Metrics

The [experiment page](https://ingglish.com/experiment) shows several metrics for evaluating phoneme-to-grapheme mappings. Three primary metrics (text preserved, unambiguous text, pronounceability) appear as stat cards; three additional metrics (edit similarity, spelling familiarity, naturalness) appear in a collapsible "More metrics" section.

All metrics are frequency-weighted using the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) so that common words like "the" and "is" contribute more than rare words like "synecdoche."

## Primary Metrics

These are the most useful metrics for evaluating a mapping.

### Text Preserved

**What it measures:** What percentage of real-world text (by word frequency) stays identical after translation. A word is "preserved" if its Ingglish spelling exactly matches the English spelling (case-insensitive).

**Why it matters:** More preserved text means more familiar readability for English speakers. If 50% of text is preserved, half of all words a reader encounters look exactly like English.

**Range:** 0–100%. Higher is better.

### Unambiguous Text

**What it measures:** What percentage of real-world text (by word frequency) has an unambiguous spelling — i.e., no other word maps to the same Ingglish spelling.

**Why it matters:** Collisions (homophones) make text harder to understand. If "write" and "right" both become "rait", context is the only disambiguator.

**Range:** 0–100%. Higher is better.

### Pronounceability

**What it measures:** Would an English reader pronounce this correctly? Feeds each Ingglish spelling back through the [G2P (grapheme-to-phoneme) model](../packages/g2p) — 329 context-sensitive NRL letter-to-sound rules — and compares the predicted phonemes against the original CMU dictionary phonemes. The score is the frequency-weighted phoneme recovery rate.

**Formula:** Per word: `1 - levenshtein(predicted_phonemes, original_phonemes) / max(len(predicted), len(original))`. Stress is stripped before comparison (stress prediction is a separate concern). Aggregate: frequency-weighted average across all dictionary words.

**Why it works:** This directly models grapheme-phoneme alignment — whether the proposed spelling would actually be *read correctly* by an English reader. Unlike the surface-level metrics below, it correctly rejects mappings that produce common-looking but unreadable words:

| Mapping | Ingglish | G2P predicts | Original | Score |
|---------|----------|-------------|----------|-------|
| /s/→"s" | "sit" | /sɪt/ | /sɪt/ | 1.0 (perfect) |
| /j/→"c" | "coo" (for "you") | /ku/ | /ju/ | low (bad) |
| /z/→"ck" | "ick" (for "is") | /ɪk/ | /ɪz/ | low (bad) |

**Range:** 0–100%. Higher is better.

**Implementation:** [`mapping-metrics.ts: g2pRoundtripScore`](../packages/website/src/lib/mapping-metrics.ts)

## Orthographic Transparency

These are system-level properties of the mapping, not per-experiment scores. They measure how predictable the spelling-sound relationship is, following the framework from [Ziegler, Stone & Jacobs (1997)](https://doi.org/10.3758/BF03214423). See [Orthographic Transparency](orthographic-transparency.md) for the full analysis including comparisons with other languages and spelling reforms.

### Feedforward Consistency (Spelling → Sound)

**What it measures:** Given a grapheme, how many possible pronunciations does it have? A ratio of 1.0 means every grapheme always makes the same sound.

**Ingglish score: 1.00** — perfect. Each of the 39 graphemes maps to exactly one phoneme. No exceptions, no context rules, no silent letters. For comparison, English scores ~0.70 ("ough" alone has 6+ pronunciations).

### Feedback Consistency (Sound → Spelling)

**What it measures:** Given a phoneme, how many possible spellings does it have? A ratio of 1.0 means every phoneme has exactly one spelling.

**Ingglish score: 0.92** — near-perfect, with exactly three minor ambiguities: "a" can represent /æ/ or schwa (stress-conditioned), "er" can be the r-colored vowel or EH+R, and "sh" can be the fricative or S+HH. For comparison, English scores ~0.50 (/iː/ alone has 11+ spellings).

## Additional Metrics

These metrics were investigated during development. Each captures something real but has a fundamental limitation that prevents it from being used for optimization. They are shown on the experiment page for comparison. See [why surface-level metrics can't optimize mappings](#why-surface-level-metrics-cant-optimize-mappings) for the full analysis.

### Edit Similarity

**What it measures:** Character-level Levenshtein similarity between the English word and its Ingglish spelling. Measures how much the spelling changes.

**Formula:** Per word: `1 - charEditDistance(english, ingglish) / max(len(english), len(ingglish))`. Aggregate: frequency-weighted average.

**Limitation:** Optimizes for character overlap, not perceptual readability. When used for hill-climbing optimization, the top suggestion was /ʌ/→"uo" producing "buot" for "but" and "uop" for "up" — high character overlap with English but completely unreadable. Also suggested /k/→"ck" producing "ckat" for "cat."

**Range:** 0–100%. Higher means spellings are closer to English.

**Implementation:** [`mapping-metrics.ts: editSimilarity`](../packages/website/src/lib/mapping-metrics.ts)

### Spelling Familiarity

**What it measures:** For each phoneme in a word, checks if its grapheme appears as a substring of the original English word. Measures how often the chosen graphemes already appear in English words that contain the corresponding sounds.

**Formula:** Per word: `(number of graphemes found in english word) / (total graphemes)`. Aggregate: frequency-weighted average.

**Limitation:** Substring matching can't distinguish *why* a grapheme appears. The top suggestion was /ʌ/→"wh" because "wh" appears in AH-containing words like "what" and "where" — but "wh" represents /w/ there, not /ʌ/. Also suggested /aɪ/→"gh" (because of "igh" in "right", "high") producing "mgh" for "my."

**Range:** 0–100%. Higher means graphemes appear more often in English words with that sound.

**Implementation:** Computed inline in [`MappingStats.tsx`](../packages/website/src/components/MappingStats.tsx)

### Naturalness

**What it measures:** Orthotactic probability — how "English-looking" the respelled words are, based on character bigram statistics. Uses a bigram model trained on English words (token-weighted by log frequency, add-k smoothed with k=0.01).

**Formula:** Per word: average log bigram probability with word boundary markers (^word$). The bigram model is trained on all CMU dictionary words weighted by `log(frequency + 1)`. Aggregate: frequency-weighted average across all words.

**Limitation:** Rewards common letter sequences regardless of phoneme-grapheme alignment. The top suggestions were /j/→"c" producing "coo" for "you" (high score because "co" and "oo" are common bigrams), /z/→"ck" producing "ick" for "is", and /ð/→"ph" producing "pha" for "the." The bigram model correctly identifies these as common English sequences — it just can't distinguish which *sound* those sequences should represent.

This was the most theoretically promising surface-level metric. The psycholinguistic literature validates orthotactic probability for measuring reading difficulty of novel words. But it assumes novel words are spelled phonetically. In our case, words are spelled using arbitrary phoneme→grapheme mappings, so the metric rewards letter sequences that are common in English for reasons unrelated to the phonemes being represented.

**Range:** Negative numbers (log probabilities). Less negative is more "English-looking."

**Implementation:** [`mapping-metrics.ts: scoreWordOrthotactic`](../packages/website/src/lib/mapping-metrics.ts)

## Why Surface-Level Metrics Can't Optimize Mappings

All four additional metrics above share the same root cause of failure: they measure surface-level properties of text (character overlap, letter patterns, substring co-occurrence, bigram statistics) without modeling **grapheme-phoneme alignment** — which specific letters correspond to which specific sounds in a word.

Without alignment, any metric is gameable by graphemes that happen to co-occur with a phoneme for unrelated reasons. For example, "wh" appears in many words containing /ʌ/ (what, where), but only because those words also contain /w/, not because "wh" represents /ʌ/.

The G2P round-trip metric (Pronounceability) succeeds because it directly models this alignment: it asks "if an English reader sees this spelling, what phonemes would they produce?" This is the question all surface-level metrics are trying to approximate, and the G2P model answers it directly using 329 context-sensitive letter-to-sound rules.

### Summary table

| Metric | What it measures | Why it fails at optimization |
|--------|-----------------|------------------------------|
| Edit similarity | Character overlap with English | "buot" for "but" scores well |
| Spelling familiarity | Grapheme-in-word co-occurrence | "wh" for /ʌ/ because of "what" |
| Naturalness | English-looking letter sequences | "coo" for "you" scores well |
| **Pronounceability** | **G2P phoneme recovery** | **Works — models alignment** |

## Per-Phoneme Familiarity Breakdown

The per-phoneme familiarity breakdown (from the `familiarity-search.ts` analysis) reveals which current mappings are most and least familiar to English readers:

| Phoneme | Grapheme | Familiarity | Notes |
|---------|----------|-------------|-------|
| /æ/ → "a" | a | 100% | Every /æ/ word has "a": cat, bat, had |
| /θ/ → "th" | th | 100% | Every /θ/ word has "th": think, bath |
| /t/ → "t" | t | 98% | Nearly every /t/ word has "t" |
| /s/ → "s" | s | 91% | Most /s/ words have "s" |
| /ɪ/ → "i" | i | 88% | Most /ɪ/ words have "i": bit, sit |
| /ʃ/ → "sh" | sh | 64% | Many /ʃ/ words use "sh" but others use "ti", "ci" |
| /k/ → "k" | k | 47% | Many /k/ words use "c" instead: cat, come |
| /iː/ → "ee" | ee | 10% | Most /iː/ words use "e", "ea", "ie" not "ee" |
| /z/ → "z" | z | 3% | Most /z/ words use "s": is, was, his |
| /ʌ/ → "uh" | uh | 0.5% | English almost never spells /ʌ/ as "uh" |
| /ð/ → "dh" | dh | 0% | "dh" never appears in English words |

## Methodology

All metrics are computed over the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary) (~126,000 unique words) using the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) for frequency weighting. Metric implementations are in [`packages/website/src/lib/mapping-metrics.ts`](../packages/website/src/lib/mapping-metrics.ts).

Analysis scripts that use these metrics for hill-climbing optimization are in `packages/core/scripts/analysis/`:

- `g2p-roundtrip-search.ts` — G2P round-trip pronounceability hill climb (primary metric)
- `orthotactic-search.ts` — Orthotactic probability hill climb (replaced by G2P round-trip)
- `familiarity-search.ts` — Per-phoneme spelling familiarity analysis
- `exhaustive-search.ts` — Exhaustively tests all possible spelling options with frequency weighting
