# Mapping Quality Metrics

A mapping is the set of rules that decides how each sound (phoneme) is spelled; the letters that spell a sound are its grapheme. The [experiment page](https://ingglish.com/experiment) lets you try different mappings and scores each one. Three primary metrics (text preserved, unambiguous text, pronounceability) appear as stat cards. Three additional metrics (edit similarity, spelling familiarity, naturalness) appear in a collapsible "More metrics" section.

Every metric is weighted by how often words occur, using the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) of word counts, so common words like "the" and "is" count for more than rare ones like "synecdoche."

## Primary Metrics

These are the most useful metrics for judging a mapping.

### Text Preserved

**What it measures:** The share of real-world text (weighted by word frequency) that is unchanged by translation. A word is "preserved" if its Ingglish spelling exactly matches its English spelling, ignoring case.

**Why it matters:** The more text is preserved, the more familiar Ingglish looks to English readers. If 50% of text is preserved, half the words a reader sees look exactly like English.

**Range:** 0–100%. Higher is better.

### Unambiguous Text

**What it measures:** The share of real-world text (weighted by word frequency) whose spelling is unambiguous: no other word gets the same Ingglish spelling.

**Why it matters:** When two words share a spelling (homophones such as "write" and "right", which both become "rait"), only context tells the reader which is meant. That makes text harder to understand.

**Range:** 0–100%. Higher is better.

### Pronounceability

**What it measures:** Would an English reader pronounce the spelling correctly? Each Ingglish spelling is fed through a [G2P (grapheme-to-phoneme) model](../packages/g2p), which guesses pronunciation from spelling the way an English reader would, using 329 letter-to-sound rules from the US Naval Research Laboratory (NRL) that take surrounding letters into account. Its guess is compared with the word's real pronunciation from the CMU dictionary. The score is the frequency-weighted share of sounds recovered correctly.

**Formula:** Per word: `1 - levenshtein(predicted_phonemes, original_phonemes) / max(len(predicted), len(original))`. Stress is removed before comparing, since predicting stress is a separate problem. Aggregate: frequency-weighted average across all dictionary words.

**Why it works:** It checks directly which letters an English reader would link to which sounds (grapheme-phoneme alignment), and so whether a spelling would actually be *read correctly*. Unlike the surface-level metrics below, it rightly rejects mappings that produce words that look common but read wrong:

| Mapping | Ingglish | G2P predicts | Original | Score |
|---------|----------|-------------|----------|-------|
| /s/→"s" | "sit" | /sɪt/ | /sɪt/ | 1.0 (perfect) |
| /j/→"c" | "coo" (for "you") | /ku/ | /ju/ | low (bad) |
| /z/→"ck" | "ick" (for "is") | /ɪk/ | /ɪz/ | low (bad) |

**Range:** 0–100%. Higher is better.

**Implementation:** [`mapping-metrics.ts: g2pRoundtripScore`](../packages/website/src/lib/mapping-metrics.ts)

## Orthographic Transparency

These are properties of the Ingglish spelling system as a whole, not scores on the experiment page. They measure how predictable the link between spelling and sound is, using the framework of [Ziegler, Stone & Jacobs (1997)](https://doi.org/10.3758/BF03214423). See [Orthographic Transparency](orthographic-transparency.md) for the full analysis, including comparisons with other languages and spelling reforms.

### Feedforward Consistency (Spelling → Sound)

**What it measures:** Given a spelling, how many ways can it be pronounced? A ratio of 1.0 means every grapheme always makes the same sound.

**Ingglish score: just under 1.00** (not yet measured). There are no silent letters and almost every grapheme spells one phoneme, but a few spellings can be read two ways, such as "a" (the vowel in "cat" or a schwa). See [Reading Ambiguities](orthographic-transparency.md#reading-ambiguities). English scores ~0.70 ("ough" alone has 6+ pronunciations).

### Feedback Consistency (Sound → Spelling)

**What it measures:** Given a sound, how many ways can it be spelled? A ratio of 1.0 means every phoneme has exactly one spelling.

**Ingglish score: 1.00**, by construction. The translator builds every spelling from the word's phonemes, so the same sounds always get the same spelling. English scores ~0.50 (/iː/ alone has 11+ spellings).

## Additional Metrics

These metrics were tried during development. Each captures something real, but each has a basic flaw that makes it useless as a target for automatically searching for better mappings. The experiment page shows them for comparison. See [why surface-level metrics can't optimize mappings](#why-surface-level-metrics-cant-optimize-mappings) for the full analysis.

### Edit Similarity

**What it measures:** How much the spelling changes: the Levenshtein similarity (based on the number of single-letter edits) between the English word and its Ingglish spelling.

**Formula:** Per word: `1 - charEditDistance(english, ingglish) / max(len(english), len(ingglish))`. Aggregate: frequency-weighted average.

**Limitation:** It rewards shared letters, not readability. When used to drive a hill-climbing search (repeatedly trying small changes and keeping whichever scores better), its top suggestion was /ʌ/→"uo", giving "buot" for "but" and "uop" for "up": many letters in common with English, yet unreadable. It also suggested /k/→"ck", giving "ckat" for "cat."

**Range:** 0–100%. Higher means spellings are closer to English.

**Implementation:** [`mapping-metrics.ts: editSimilarity`](../packages/website/src/lib/mapping-metrics.ts)

### Spelling Familiarity

**What it measures:** How often the chosen spellings already appear in English words that contain those sounds. For each phoneme in a word, it checks whether its grapheme appears anywhere in the English spelling.

**Formula:** Per word: `(number of graphemes found in english word) / (total graphemes)`. Aggregate: frequency-weighted average.

**Limitation:** Finding the letters somewhere in the word says nothing about *why* they are there. The top suggestion was /ʌ/→"wh", because "wh" appears in words with that vowel such as "what" and "where", but there "wh" spells /w/, not /ʌ/. It also suggested /aɪ/→"gh" (because of "igh" in "right", "high"), giving "mgh" for "my."

**Range:** 0–100%. Higher means graphemes appear more often in English words with that sound.

**Implementation:** Computed inline in [`MappingStats.tsx`](../packages/website/src/components/MappingStats.tsx)

### Naturalness

**What it measures:** Orthotactic probability: how "English-looking" the respelled words are, judged by how often each pair of adjacent letters (bigram) occurs in English. The bigram model is trained on English words (each weighted by log frequency, add-k smoothed with k=0.01).

**Formula:** Per word: average log bigram probability with word boundary markers (^word$). The bigram model is trained on all CMU dictionary words weighted by `log(frequency + 1)`. Aggregate: frequency-weighted average across all words.

**Limitation:** It rewards common letter sequences whether or not they spell the right sounds. The top suggestions were /j/→"c", giving "coo" for "you" (a high score because "co" and "oo" are common bigrams); /z/→"ck", giving "ick" for "is"; and /ð/→"ph", giving "pha" for "the." These really are common English sequences; the model just can't tell which *sound* they should represent.

In theory this was the most promising surface-level metric. Reading research has shown that orthotactic probability predicts how hard unfamiliar words are to read. But that research assumes the words are spelled by sound in the usual English way. Here the phoneme→grapheme mappings can be arbitrary, so the metric rewards letter sequences that are common in English for reasons unrelated to the sounds they now stand for.

**Range:** Negative numbers (log probabilities). Less negative is more "English-looking."

**Implementation:** [`mapping-metrics.ts: scoreWordOrthotactic`](../packages/website/src/lib/mapping-metrics.ts)

## Why Surface-Level Metrics Can't Optimize Mappings

All three additional metrics above fail for the same reason. They measure surface features of text (shared letters, letters found somewhere in a word, bigram counts) without modeling **grapheme-phoneme alignment**: which letters in a word spell which sounds.

Without alignment, a metric can be fooled by letters that merely tend to appear alongside a sound. For example, "wh" appears in many words containing /ʌ/ (what, where), but only because those words also contain /w/, not because "wh" spells /ʌ/.

The G2P round-trip metric (Pronounceability) works because it models alignment directly. It asks: "If an English reader sees this spelling, what sounds will they say?" That is the question the surface-level metrics only approximate, and the G2P model answers it directly with its 329 context-sensitive letter-to-sound rules.

### Summary table

| Metric | What it measures | Why it fails at optimization |
|--------|-----------------|------------------------------|
| Edit similarity | Character overlap with English | "buot" for "but" scores well |
| Spelling familiarity | Grapheme-in-word co-occurrence | "wh" for /ʌ/ because of "what" |
| Naturalness | English-looking letter sequences | "coo" for "you" scores well |
| **Pronounceability** | **G2P phoneme recovery** | **Works: models alignment** |

## Per-Phoneme Familiarity Breakdown

This breakdown (from the `familiarity-search.ts` analysis) shows which of the current spellings are most and least familiar to English readers:

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

All metrics are computed over the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary) (~126,000 unique words), weighted by frequency from the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977). The metrics are implemented in [`packages/website/src/lib/mapping-metrics.ts`](../packages/website/src/lib/mapping-metrics.ts).

The analysis scripts that use these metrics to search for better mappings are in `packages/core/scripts/analysis/`:

- `g2p-roundtrip-search.ts`: G2P round-trip pronounceability hill climb (primary metric)
- `orthotactic-search.ts`: Orthotactic probability hill climb (replaced by G2P round-trip)
- `familiarity-search.ts`: Per-phoneme spelling familiarity analysis
- `exhaustive-search.ts`: Tests every possible spelling option, weighted by frequency
