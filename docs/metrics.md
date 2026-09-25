# How a Spelling Is Scored

Ingglish's spellings were chosen by testing alternatives against a set of yardsticks (see [How It Was Designed](design-decisions.md)). This page defines each one: what it measures, how it is calculated, and where it goes wrong. [Testing Every Alternative](identical-words-analysis.md) shows them at work.

A **mapping** is the set of rules that says how each sound (phoneme) is spelled. The letters that spell a sound are its **grapheme**: "sh" is the grapheme for the first sound in "ship". The [experiment page](https://ingglish.com/experiment) lets you build your own mapping and scores it with every metric below. The three primary metrics appear as the large numbers at the top of its results. Three more appear under "More metrics".

Every metric counts each word by how often it occurs in real text, using the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) of film and TV subtitles. So common words like "the" and "is" count for far more than rare ones like "synecdoche". Frequencies are given per million words of text, written /M.

Sounds are written in IPA between slashes, with an example word where it helps: /ʌ/ is the vowel in "cup".

## Primary Metrics

These three decide whether a mapping is any good.

### Text Preserved

**What it measures:** the share of real-world text that translation leaves unchanged, weighted by word frequency. A word is preserved if its Ingglish spelling matches its English spelling exactly, ignoring case.

**Why it matters:** the more text is preserved, the more Ingglish looks like the English a reader already knows. If 50% of text is preserved, half the words a reader sees look exactly as they do in English.

**Range:** 0–100%. Higher is better.

**Implementation:** [`mapping-metrics.ts: computeWeightedMetrics`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/lib/mapping-metrics.ts)

### Unambiguous Text

**What it measures:** the share of real-world text, weighted by frequency, whose spelling belongs to only one word. A word fails if any other word gets the same Ingglish spelling.

**Why it matters:** when two words share a spelling, only context tells the reader which one is meant. Homophones like "write" and "right" sound the same, so a spelling built from sound has to merge them (both become "rait"). A mapping that merges words that *sound different* is simply worse. This is the check behind the [search's rule](identical-words-analysis.md#the-exhaustive-search) that a new spelling must not add collisions.

**Range:** 0–100%. Higher is better.

**Implementation:** computed in [`MappingStats.tsx`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/components/MappingStats.tsx)

### Pronounceability

**What it measures:** whether an English reader would say the spelling correctly. Each Ingglish spelling goes through a [G2P (grapheme-to-phoneme) model](https://github.com/ptarjan/ingglish/tree/main/packages/g2p). The model guesses a pronunciation from the spelling the way an English reader would. It uses about 960 letter-to-sound rules that look at the surrounding letters, based on rules published by the US Naval Research Laboratory (Elovitz et al., 1976, NRL Report 7948). The guess is compared with the word's real pronunciation from the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary), a free list of American English pronunciations. The score is the frequency-weighted share of sounds the model gets right.

**Formula:** Levenshtein distance counts how many sounds must be added, removed or swapped to turn one sequence into the other. Per word, the score is `1 - levenshtein(predicted_phonemes, original_phonemes) / max(len(predicted), len(original))`. Stress (which syllable is emphasized) is ignored, because guessing stress is a separate problem. The total is the frequency-weighted average over all dictionary words.

**Why it works:** it checks which letters a reader will match to which sounds. This is called **grapheme-phoneme alignment**. The metric tests whether a spelling will be *read correctly*, not just whether it looks like English. The surface-level metrics below cannot do this, so they reward spellings that look common but read wrong. For example:

| Mapping | Ingglish | G2P predicts | Original | Score |
|---------|----------|-------------|----------|-------|
| /s/→"s" | "sit" | /sɪt/ | /sɪt/ | 1.0 (perfect) |
| /j/→"c" | "coo" (for "you") | /ku/ | /ju/ | low (bad) |
| /z/→"ck" | "ick" (for "is") | /ɪk/ | /ɪz/ | low (bad) |

**Range:** 0–100%. Higher is better.

**Implementation:** [`mapping-metrics.ts: g2pRoundtripScore`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/lib/mapping-metrics.ts)

## Additional Metrics

These three were tried during development. Each captures something real, but each has a basic flaw: a search that tries to maximize it ends up with unreadable spellings. The experiment page still shows them for comparison. [Why surface-level metrics can't optimize mappings](#why-surface-level-metrics-cant-optimize-mappings) explains the shared flaw.

### Edit Similarity

**What it measures:** how much the spelling changes. It is the Levenshtein similarity between the English word and its Ingglish spelling: one minus the number of single-letter edits needed, divided by the longer word's length.

**Formula:** per word, `1 - charEditDistance(english, ingglish) / max(len(english), len(ingglish))`, where `charEditDistance` is the Levenshtein distance counted in letters. The total is the frequency-weighted average.

**Limitation:** it rewards shared letters, not readability. A hill-climbing search (a separate script from the exhaustive search) repeatedly tries small changes and keeps whichever scores better. When edit similarity drove one, its top suggestion was /ʌ/→"uo", giving "buot" for "but" and "uop" for "up". Those share many letters with English and are unreadable. It also suggested /k/→"ck", giving "ckat" for "cat".

**Range:** 0–100%. Higher means spellings are closer to English.

**Implementation:** [`mapping-metrics.ts: editSimilarity`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/lib/mapping-metrics.ts)

### Spelling Familiarity

**What it measures:** whether a sound's Ingglish grapheme already appears in the English spellings of words with that sound. For each sound in a word, it checks whether the grapheme appears anywhere in the English spelling.

**Formula:** per word, `(number of graphemes found in english word) / (total graphemes)`. The total is the frequency-weighted average. The analysis script `familiarity-search.ts` measures 64.17% for current Ingglish.

**Limitation:** finding the letters somewhere in the word says nothing about *why* they are there. A search that maximized familiarity made /ʌ/→"wh" its top suggestion. "Wh" appears in words with that vowel, such as "what", but there it spells /w/, not /ʌ/. Its next suggestion was /aɪ/→"gh", because of the "igh" in "right" and "high". That spelling would give "mgh" for "my".

**Range:** 0–100%. Higher means the graphemes appear more often in English words with those sounds.

**Implementation:** [`mapping-metrics.ts: computeWeightedMetrics`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/lib/mapping-metrics.ts)

### Naturalness

**What it measures:** how English-looking the respelled words are, known as orthotactic probability. It is judged by how often each pair of adjacent letters (a bigram) occurs in English.

**Formula:** per word, the average log bigram probability, with markers for the start and end of the word (^word$), so the model also learns which letters tend to begin and end words. The bigram model is trained on all CMU dictionary words, each weighted by `log(frequency + 1)`. A small count (k=0.01) is added to every letter pair so that pairs never seen in English score low rather than impossible (add-k smoothing). The total is the frequency-weighted average across all words.

**Limitation:** it rewards common letter sequences whether or not they spell the right sounds. Its top suggestions were /j/→"c", giving "coo" for "you", which scores well because "co" and "oo" are common bigrams. Others were /z/→"ck", giving "ick" for "is", and /ð/→"ph", giving "pha" for "the". These really are common English sequences. The model just can't tell which *sound* they should stand for.

On paper this was the most promising surface-level metric, because reading research shows that orthotactic probability predicts how hard unfamiliar words are to read. That research assumes words spelled the usual English way. When sounds can be mapped to any letters, the metric rewards letter sequences that are common in English for reasons that have nothing to do with the sounds they now stand for.

**Range:** negative numbers (log probabilities). Closer to zero is more English-looking.

**Implementation:** [`mapping-metrics.ts: scoreWordOrthotactic`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/lib/mapping-metrics.ts)

## Why Surface-Level Metrics Can't Optimize Mappings

All three additional metrics fail for the same reason. They measure the surface of the text: shared letters, letters found somewhere in a word, pairs of letters. None of them models **grapheme-phoneme alignment**, which letters in a word spell which sounds.

Without alignment, a metric is fooled by letters that merely tend to turn up near a sound. "Wh" appears in many words containing /ʌ/ (what, where), but only because those words also contain /w/.

Pronounceability works because it models alignment directly. It asks, "If an English reader sees this spelling, what will they say?" The surface-level metrics only approximate that question. The G2P model answers it with its context-sensitive letter-to-sound rules.

### Summary table

| Metric | What it measures | Why it fails at optimization |
|--------|-----------------|------------------------------|
| Edit similarity | Letters shared with the English word | "buot" for "but" scores well |
| Spelling familiarity | Grapheme found anywhere in the word | "wh" for /ʌ/ because of "what" |
| Naturalness | English-looking letter pairs | "coo" for "you" scores well |
| **Pronounceability** | **Sounds the G2P model recovers** | **Works: it models alignment** |

## How the Metrics Were Used

Each metric did a different job in choosing the spellings:

- **Text preserved** ranks the candidates. The [exhaustive search](identical-words-analysis.md#the-exhaustive-search) and its companion scripts score every alternative spelling by its net effect on frequency-weighted identical words.
- **Unambiguous text** is a filter, not a score. A candidate that makes different-sounding words share a spelling is rejected, however much text it preserves. That is what rules out /oʊ/ → "o", which would make "own" and "on" the same word.
- **Pronounceability** is the reading test. A candidate can pass both checks above and still fail here: /k/ → "c" would make "kid" read as "sid". [Testing Every Alternative](identical-words-analysis.md#why-raw-identical-word-count-misleads) lists the changes that fail it.
- **Edit similarity, spelling familiarity and naturalness** were each tried as search targets and dropped for the reasons above. Familiarity is still useful as a description: the table below shows which Ingglish spellings will look new to an English reader.

Ingglish's reading ambiguities, such as the "a" that can be the vowel of "cat" or a schwa (the weak vowel at the start of "about"), are measured on a different scale: [How Transparent Is It?](orthographic-transparency.md)

## Per-Phoneme Familiarity Breakdown

`familiarity-search.ts` scores each current spelling on its own. The score is the share of words containing the sound, weighted by frequency, whose English spelling contains the Ingglish grapheme. Here are the lowest and highest scores, with a few in between:

| Sound | Ingglish | Familiarity | Notes |
|-------|----------|-------------|-------|
| /ð/ (the, this) | dh | 0.0% | "dh" never appears in English words |
| /ʒ/ (measure) | zh | 0.0% | Nor does "zh" |
| /aɪ/ (my, time) | ai | 0.1% | English spells it "i", "y", "igh"; "ai" almost never |
| /ʌ/ (but, cup) | uh | 0.5% | English almost never spells /ʌ/ as "uh" |
| /ɔ/ (law, thought) | aw | 2.3% | Most words use "o", "au" or "ough" |
| /z/ (zoo, is) | z | 3.0% | Most /z/ words use "s": is, was, his |
| /uː/ (too, food) | oo | 5.3% | "u", "o", "ew" and "ue" are more common |
| /oʊ/ (go, show) | oh | 6.4% | English uses "o", "ow" and "oa" |
| /iː/ (see) | ee | 9.6% | Most /iː/ words use "e", "ea" or "y" |
| /k/ (cat, back) | k | 47.3% | Many /k/ words use "c": cat, come |
| /ʃ/ (she) | sh | 63.5% | Others use "ti" or "ci": nation, special |
| /ɪ/ (bit) | i | 88.3% | Most /ɪ/ words have "i" |
| /s/ (sit) | s | 91.2% | Most /s/ words have "s" |
| /t/ (top) | t | 98.3% | Nearly every /t/ word has "t" |
| /æ/ (cat) | a | 100.0% | Every /æ/ word has "a" |
| /θ/ (think) | th | 100.0% | Every /θ/ word has "th" |

The low scores are the price of the goal of one sound, one spelling. English spreads most vowel sounds over several spellings, so whichever single spelling Ingglish picks, most words with that sound were spelled some other way. [Vowels, Sound by Sound](vowel-spellings.md) and [Consonants, Sound by Sound](consonant-spellings.md) explain each choice.

## Methodology

All metrics are computed over the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary), about 126,000 words, weighted by frequency from the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977). The experiment page's metrics are implemented in [`packages/website/src/lib/mapping-metrics.ts`](https://github.com/ptarjan/ingglish/blob/main/packages/website/src/lib/mapping-metrics.ts).

The search scripts are in `packages/core/scripts/analysis/`:

- `exhaustive-search.ts`: tries every spelling option for every sound, ranked by frequency-weighted identical words.
- `analyze-identical-words.ts`: measures a hand-picked list of alternatives and reports the words each would merge.
- `g2p-roundtrip-search.ts`: a hill-climbing search on pronounceability.
- `orthotactic-search.ts`: a hill-climbing search on naturalness (orthotactic probability), replaced by the pronounceability search.
- `familiarity-search.ts`: the per-sound familiarity scores above, plus a search that maximizes familiarity.

The familiarity figures on this page come from `familiarity-search.ts`, run at commit 0601e97b of the Ingglish source code. From `packages/core`:

```bash
npx vite-node --script scripts/analysis/familiarity-search.ts
```
