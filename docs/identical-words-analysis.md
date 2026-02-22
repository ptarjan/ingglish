# Identical Words Analysis

Do the current Ingglish phoneme mappings maximize "identical words," words where the Ingglish spelling matches the English spelling?

## Summary

No, and that's intentional.

The current mapping produces **10,150 identical words** (8.05% of the CMU dictionary). Alternative mappings could theoretically produce more, but most changes either create unacceptable collisions or reintroduce pronunciation ambiguity for English readers.

We exhaustively tested 2,730 collision-free spelling alternatives, weighted by word frequency (per million words of text). Only two candidates have positive frequency impact, and both fail on perceptual ambiguity. The rest are net negative:

- /ɔɪ/→oy: **+235 /M** — marginal; "oi" and "oy" are both common English spellings
- /uː/→eu: **+19 /M** — negligible, and `eu` misleads English readers (`meun` reads as "mew-n") [note: tested when /uː/ was 'uu']
- /oʊ/→ow: **-1,330 /M** — "oh" alone (3,374 /M) outweighs all gains
- /ɔ/→au: **-555 /M** — loses saw (413 /M), law (119 /M)
- /aɪ/→ei: **-1 /M** — shuffles rare German surnames, essentially zero real-text impact

All five candidates were rejected — see [Recommendations](#recommendations). Stress-conditioned changes are a promising area for further exploration, following the precedent set by the schwa split (AH0→'a').

## Background

An "identical word" is one where converting English → phonemes → Ingglish produces the original English spelling. For example:
- "bit" → /bɪt/ → "bit" ✓ (identical)
- "boat" → /boʊt/ → "boht" ✗ (changed)

More identical words means more natural readability for native English readers: familiar words stay familiar.

Not all identical words are equal, though. Many words in the CMU dictionary are loanwords (German surnames like "Einstein", French words like "chateau"). **Frequency weighting** reveals the true impact of a change on real text: gaining 200 rare words but losing "say", "day", "way" is terrible. We use word frequency data (SUBTLEX-US corpus, per million words of text) alongside the [orthography comparison](orthography-comparison.md) to guide decisions, prioritizing impact on actual text over raw dictionary counts.

## Current Mapping Performance

| Metric | Value |
|--------|-------|
| Total unique words in CMU dictionary | 126,051 |
| Identical words | 10,150 (8.05%) |
| Existing collisions (homophones) | 18,847 |

Note: The baseline includes the stress-conditioned AH0→'a' override (unstressed schwa → 'a'), which is already implemented in the converter. This produced a 67.6× frequency-weighted improvement — the largest gain from any single change. See [phoneme mapping](phoneme-mapping.md#schwa-and-strut) for details.

## Why Not Maximize Identical Words?

We tested mappings that maximize identical words:

| Change | Freq Impact /M | Problem |
|--------|----------------|---------|
| /oʊ/: oh → o | +20,998 | "go" and "got" both become "go" |
| /z/: z → s | +19,772 | "prize" becomes "prise" |
| /ɔ/: aw → o | +845 | "saw" and "so" both become "so" |

These changes create **collisions**: different words that get the same spelling, making text ambiguous. Even though their frequency impact is large, the ambiguity cost is unacceptable.

## Collision-Free Base Phoneme Alternatives

We exhaustively tested all 39 phonemes × 70 spelling options (2,730 combinations) to find collision-free changes. Only two have positive frequency impact (+235 /M and +19 /M), and both fail the perceptual ambiguity test. The other three are frequency-negative. All five were rejected (see [Recommendations](#recommendations)).

### Candidates (sorted by frequency impact)

| Phoneme | Current | Proposed | Net /M | Top Gains (/M) | Top Losses (/M) |
|---------|---------|----------|--------|-----------------|-----------------|
| /ɔɪ/ | oi | oy | **+235** | boy (543), enjoy (85), joy (29) | point (243), join (86), oil (42) |
| /uː/ | oo | eu | **+19** | zeus (6), neutral (4), maneuver (3) | bruun (0), ruud (0) |
| /aɪ/ | ai | ei | **-1** | einstein (5), heist (3), stein (3) | shanghai (5), saigon (4), ai (4) |
| /ɔ/ | aw | au | **-555** | fault (107), paul (97), launch (20) | saw (413), law (119), lawyer (82) |
| /oʊ/ | oh | ow | **-1,330** | show (501), own (471), throw (132) | oh (3,374) |

The two positive-frequency candidates (/ɔɪ/→oy and /uː/→eu) still fail the perceptual ambiguity test — see below.

### Trade-off Analysis

#### /ɔɪ/: "oi" → "oy" (+235 /M)

Best frequency trade: gains boy (543 /M), enjoy (85 /M), joy (29 /M), royal (24 /M) while losing point (243 /M), join (86 /M), oil (42 /M). But both "oi" and "oy" are common English spellings with similar total frequency — it's nearly a wash. Not compelling enough to change.

#### /uː/: "oo" → "eu" (+19 /M)

Negligible gain: zeus (6 /M), neutral (4 /M), maneuver (3 /M) with negligible losses. At only +19 /M, this change would affect 0.002% of real text — barely measurable. And `eu` in English implies a /j/ onset: "feud" is /fjuːd/, "neural" is /njʊɹəl/. So `meun` (moon) reads as "mew-n", `seun` (soon) reads as "syoon", `teu` (too) reads as "tyoo". The mapping actively misleads English readers for a negligible frequency gain.

#### /aɪ/: "ai" → "ei" (-1 /M)

The clearest example of frequency revealing what raw count hides. The top gain is "einstein" at 5 /M. Most gains are German surnames (bernstein, weinstein, klein, reich). Losses are also rare (shanghai 5 /M, saigon 4 /M). This change would affect almost no real text.

#### /ɔ/: "aw" → "au" (-555 /M)

Gains fault (107 /M), paul (97 /M), launch (20 /M), trauma (17 /M), vault (12 /M) but loses saw (413 /M), law (119 /M), lawyer (82 /M), aw (42 /M), draw (41 /M). The losses are more common everyday words — a bad trade for real text.

#### /oʊ/: "oh" → "ow" (-1,330 /M)

Gains show (501 /M), own (471 /M), throw (132 /M), blow (100 /M), window (88 /M) — good words. But the single word "oh" at 3,374 /M outweighs them all. Plus `ow` is **ambiguous in English**: it represents both /oʊ/ (snow, throw) and /aʊ/ (cow, town). New combinations like `bownz` (bones) read as "bowns", `howm` (home) reads like it rhymes with "cow". Both frequency (-1,330 /M) and perceptual ambiguity argue against this change.

## Alternative Improvements Not Recommended

| Change | Net /M | Reason Rejected |
|--------|--------|-----------------|
| /oʊ/: oh → oe | -3,210 | Worse than "ow" in every dimension |
| /oʊ/: oh → oa | — | Lower gain than "ow" for same phoneme |

## Stress-Conditioned Alternatives

Following the precedent of splitting AH by stress (AH0→'a' for schwa vs AH1/2→'u' for strut), we tested whether other vowels benefit from stress-specific spellings. This tests changing only the **unstressed (stress-0) variant** of each vowel while keeping stressed variants at their current mapping.

The linguistic justification: English unstressed vowels often sound different from their stressed counterparts. Just as schwa (/ə/) and strut (/ʌ/) are technically the same CMU phoneme but sound different, unstressed /iː/ in "happy" sounds different from stressed /iː/ in "bee", and unstressed /oʊ/ in "avocado" sounds different from stressed /oʊ/ in "go". English speakers generally perceive these as different sounds.

We tested all 15 stress-0 vowel phonemes × 70 options (1,036 combinations). Twenty-five collision-free improvements were found, but frequency weighting reveals that only three have significant real-text impact.

### Top Candidates (sorted by frequency impact)

| Unstressed Phoneme | Current | Proposed | Net /M | Top Gains (/M) | Top Losses (/M) |
|---------------------|---------|----------|--------|-----------------|-----------------|
| IY0 (unstressed /iː/) | ee | y | **+2,700** | every (563), party (239), story (226), body (201) | frisbee (2), godspeed (1), chimpanzee (1) |
| UW0 (unstressed /uː/) | oo | o | **+912** | into (866), onto (38), unto (8) | — |
| OW0 (unstressed /oʊ/) | oh | o | **+246** | hotel (106), noel (19), motel (19), november (9) | — |
| UW0 (unstressed /uː/) | oo | u | **+9** | flu (<1), tofu (<1), tutu (<1) | — |
| AO0 (unstressed /ɔː/) | aw | o | **+0.5** | menthol (<1), oblong (<1) | — |

Frequency weighting dramatically reshuffles the raw count rankings. UW0→'u' gains 97 words but only +9 /M (all rare). UW0→'o' gains just 3 words but +912 /M — because "into" alone is 866 /M. AO0→'o' gains 28 words but only +0.5 /M — essentially zero real-text impact.

### Analysis

#### IY0: "ee" → "y" (+2,700 /M)

The largest stress-conditioned improvement by far. Unstressed /iː/ at the end of words like "happy", "body", "city", "baby" is already spelled 'y' in English. English speakers perceive this as a different sound from stressed /iː/ in "bee" — it's shorter and lighter. Many phonologists treat it as a distinct phoneme ([happy tensing](https://en.wikipedia.org/wiki/Happy-tensing)).

Top gains: every (563 /M), party (239 /M), story (226 /M), body (201 /M), army (88 /M), henry (79 /M), plenty (64 /M), hardly (53 /M), study (50 /M).

Top losses: frisbee (2 /M), godspeed (1 /M), chimpanzee (1 /M) — all rare.

The gains are extremely common English words; the losses are mostly proper nouns and rare words. This is the strongest stress-conditioned candidate.

#### UW0: "oo" → "o" (+912 /M)

A surprising find: just three words — into (866 /M), onto (38 /M), unto (8 /M) — but "into" is so common that it dominates. No losses.

This is a better candidate than UW0→'u' (+9 /M), which gains 97 words that are all rare (flu, tofu, tutu, bayou, caribou). Frequency reveals that 3 common words vastly outweigh 97 rare ones.

#### OW0: "oh" → "o" (+246 /M)

Unstressed /oʊ/ is already spelled 'o' in most English words: "also", "avocado", "tomato", "potato". English speakers hear unstressed /oʊ/ as a simple 'o' sound.

Top gains: hotel (106 /M), noel (19 /M), motel (19 /M), november (9 /M), limo (9 /M), nemo (5 /M), porno (5 /M), info (4 /M). No losses.

Almost pure gain of common words.

Note: Both OW0 and AO0 would map to 'o' in unstressed position. The script confirmed this doesn't create collisions — unstressed /oʊ/ and /ɔː/ rarely form minimal pairs, and many English dialects merge them in unstressed position anyway.

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

### Base phoneme changes: No changes recommended.

All five proposed changes were investigated and rejected. Every candidate fails at least one of two tests:

1. **Frequency impact** — Does the change help or hurt in real text?
   - /ɔ/→au: -555 /M, /oʊ/→ow: -1,330 /M (net negative)
   - /aɪ/→ei: -1 /M (negligible)
   - /ɔɪ/→oy: +235 /M (marginal — nearly a wash)

2. **Perceptual ambiguity** — Would an English reader pronounce the new spellings correctly?
   - /oʊ/→ow: `bownz` reads as "bowns", `howm` reads like "cow"
   - /uː/→eu: `meun` reads as "mew-n", `teu` reads as "tyoo"

### Stress-conditioned changes: Promising, needs further investigation.

The stress-conditioned findings follow the same pattern that made AH0→'a' successful: unstressed vowels in English often sound different enough from their stressed counterparts to justify distinct spellings. The top candidates — IY0→'y' (+2,700 /M), UW0→'o' (+912 /M), OW0→'o' (+246 /M) — have strong linguistic justification and massive gains with minimal losses.

Key questions before implementing:

1. **Does splitting more phonemes by stress make the system harder to learn?** The AH split is justified by a clear phonemic distinction (/ə/ vs /ʌ/). Are IY0/IY1 and OW0/OW1 similarly distinct, or just "quieter versions"?
2. **Are the unstressed variants truly distinct to English speakers?** Unstressed 'y' in "happy" does sound different from 'ee' in "bee". Unstressed 'o' in "avocado" does sound different from 'oh' in "go". But is the difference as clear-cut as schwa vs strut?
3. **Do the new spellings avoid perceptual ambiguity?** Unlike the rejected base changes, 'y' for unstressed /iː/ and 'o' for unstressed /oʊ/ are how English *already spells these sounds*. English readers would likely pronounce them correctly naturally.

## Pronounceability Metric (G2P Round-Trip)

The experiment page shows a "Pronounceability" score alongside text preservation and unambiguous text. This metric feeds each Ingglish spelling back through the G2P (grapheme-to-phoneme) model and compares predicted phonemes against the original CMU phonemes. It directly measures "would an English reader pronounce this correctly?" as a frequency-weighted phoneme recovery rate (0–100%).

This replaced the earlier "Naturalness" metric (orthotactic probability, ~-3.08 baseline) which measured how "English-looking" respelled words are using character bigram statistics. The G2P round-trip metric is superior because it models grapheme-phoneme alignment rather than surface-level letter patterns — it correctly rejects changes like /j/→"c" (coo for "you": G2P predicts /ku/) and /z/→"ck" (ick for "is": G2P predicts /ɪk/) that orthotactic probability incorrectly scored as improvements.

The per-phoneme familiarity breakdown (from `familiarity-search.ts`) remains useful for diagnostics — revealing which mappings are most and least familiar to English readers:

| Phoneme | Grapheme | Familiarity | Notes |
|---------|----------|-------------|-------|
| AE→"a" | a | 100% | Every /æ/ word has "a": cat, bat, had |
| TH→"th" | th | 100% | Every /θ/ word has "th": think, bath |
| T→"t" | t | 98% | Nearly every /t/ word has "t" |
| S→"s" | s | 91% | Most /s/ words have "s" |
| IH→"i" | i | 88% | Most /ɪ/ words have "i": bit, sit |
| SH→"sh" | sh | 64% | Many /ʃ/ words use "sh" but others use "ti", "ci" |
| K→"k" | k | 47% | Many /k/ words use "c" instead: cat, come |
| IY→"ee" | ee | 10% | Most /iː/ words use "e", "ea", "ie" not "ee" |
| Z→"z" | z | 3% | Most /z/ words use "s": is, was, his |
| AH→"uh" | uh | 0.5% | English almost never spells /ʌ/ as "uh" |
| DH→"dh" | dh | 0% | "dh" never appears in English words |

The per-phoneme familiarity is useful for **diagnostics** (identifying which mappings are least familiar).

## Why Surface-Level Metrics Can't Optimize Mappings

The identical-word metric is binary: a word either matches or it doesn't. We investigated four continuous alternatives to capture partial improvements. The first four measure surface-level properties and fail when used to optimize. The fifth — G2P round-trip — models grapheme-phoneme alignment and succeeds.

### 1. Edit distance (Levenshtein similarity)

`similarity = 1 - (edit_distance / max_length)`.

**Problem:** Optimizes for character overlap, not perceptual readability. Top suggestion: /ʌ/→"uo" producing "buot" for "but", "uop" for "up". Also suggested /k/→"ck" producing "ckat" for "cat".

### 2. Bigram familiarity (character n-gram frequency)

Score each Ingglish word by how common its letter pairs are in English text.

**Problem:** Common bigrams don't make readable words. Top suggestion: /ʌ/→"ea" producing "eav" for "of"; /z/→"ey" producing "woey" for "was"; /ð/→"wh" producing "wha" for "the".

### 3. Spelling familiarity (grapheme-in-word substring check)

For each phoneme, check if its Ingglish grapheme appears as a substring of the English word.

**Problem:** Substring matching can't distinguish *why* a grapheme appears. Top suggestion: /ʌ/→"wh" because "wh" appears in AH-containing words like "what" and "where" — but "wh" represents /w/ there, not /ʌ/. Also suggested /aɪ/→"gh" (because of "igh" in "right", "high") producing "mgh" for "my"; /ð/→"ey" producing "eya" for "the".

### 4. Orthotactic probability (character bigram model)

Score each respelled word by how "English-looking" its letter sequences are, using a character bigram model trained on English words (token-weighted by log frequency, add-k smoothed). This is a well-validated psycholinguistic measure of word-form naturalness. Aggregate metric: frequency-weighted average log bigram probability across all respelled words.

**Problem:** Rewards common letter sequences regardless of phoneme-grapheme alignment. Top suggestions: /j/→"c" producing "coo" for "you", "cor" for "your"; /v/→"ie" producing "uhie" for "of", "haie" for "have"; /z/→"ck" producing "ick" for "is", "wock" for "was"; /ð/→"ph" producing "pha" for "the", "phat" for "that".

The bigram model correctly identifies that sequences like "co", "ck", "ph" are common in English, so words containing them score higher. But it can't distinguish *which sound* those sequences should represent. Replacing /j/ (the "y" sound) with "c" makes "you" → "coo", which contains the very common English bigrams "co" and "oo" — a high orthotactic score that produces an unreadable word.

This was the most theoretically promising surface-level metric. The psycholinguistic literature validates orthotactic probability for measuring reading difficulty of novel words. But it assumes the novel words are *spelled phonetically* — i.e., that the reader will try to sound them out. In our case, the words are spelled using arbitrary phoneme→grapheme mappings, so the metric rewards letter sequences that are common in English for reasons unrelated to the phonemes being represented.

### The fundamental limitation of surface-level metrics

All four metrics above share the same root cause: they measure surface-level properties of text (character overlap, letter patterns, substring co-occurrence, bigram statistics) without modeling **grapheme-phoneme alignment** — which specific letters correspond to which specific sounds in a word. Without alignment, any metric is gameable by graphemes that happen to co-occur with a phoneme for unrelated reasons.

### 5. G2P round-trip (grapheme-to-phoneme model)

Spell a word using the proposed mapping, feed the spelling through the NRL letter-to-sound rules (329 context-sensitive rules that predict how an English reader would pronounce arbitrary text), compare predicted phonemes against the original CMU phonemes. Score = `1 - levenshtein(predicted, original) / max(len(predicted), len(original))`. Aggregate: frequency-weighted average across all words.

**This metric works.** It directly models grapheme-phoneme alignment — whether the proposed spelling would actually be *read correctly* by an English reader. Examples:
- /j/→"c" producing "coo" for "you": G2P predicts /ku/ not /ju/ → bad score ✓
- /z/→"ck" producing "ick" for "is": G2P predicts /ɪk/ not /ɪz/ → bad score ✓
- /s/→"s" in "sit": G2P predicts /sɪt/ → perfect score ✓

These were all incorrectly scored as "improvements" by orthotactic probability but correctly penalized by G2P round-trip. The G2P model already exists in the codebase (`@ingglish/g2p`) and is used for the experiment page's "Pronounceability" metric.

The G2P round-trip metric is now used on the experiment page (replacing the orthotactic probability "Naturalness" metric) and in the `g2p-roundtrip-search.ts` hill-climbing script.

## Methodology

Analysis scripts are in `packages/core/scripts/analysis/`:

- `analyze-identical-words.ts` - Tests alternative mappings with frequency weighting
- `exhaustive-search.ts` - Exhaustively tests all possible spelling options, including stress-conditioned overrides, sorted by frequency impact
- `familiarity-search.ts` - Per-phoneme spelling familiarity analysis
- `g2p-roundtrip-search.ts` - G2P round-trip pronounceability hill climb (pronounceability metric used on the experiment page)
- `orthotactic-search.ts` - Orthotactic probability hill climb using character bigram model (replaced by G2P round-trip)

All scripts use the actual translation logic (R-colored vowels, stress-conditioned schwa) to match the real `arpabetToIngglish()` output. Results are sorted and evaluated by frequency-weighted impact (per million words of text, SUBTLEX-US corpus), not raw word count.

The exhaustive search runs in three phases:

1. **Base phoneme search**: Tests changing each of 39 phonemes to 70 spelling options (2,730 combinations)
2. **Stress-conditioned search**: Tests changing only stress-0 variants of 15 vowel phonemes (1,036 combinations)
3. **Combination test**: Greedily applies non-conflicting improvements from both phases

Run with:
```bash
npx vite-node scripts/analysis/exhaustive-search.ts
```

## Why Raw Identical Word Count Misleads

Raw identical word count has two blind spots:

1. **All words count equally.** Gaining 200 rare surnames and losing "say", "day", "way" looks like +197 on paper but is terrible for real text. Frequency weighting fixes this: it measures impact per million words of actual language usage.

2. **It doesn't measure readability.** A proposed change must not create perceptual ambiguity — the spelling must read correctly to English speakers. The `ow` and `eu` changes both pass the collision check but fail the readability test: English readers' existing intuitions produce wrong pronunciations (`bownz` → "bowns", `meun` → "mew-n").

The current mappings (`oh` for /oʊ/, `oo` for /uː/) work because they have **no competing English interpretation** to mislead readers. `oh` is unusual but unambiguous. `oo` for /uː/ matches existing English conventions (too, food, moon).

Stress-conditioned changes may be an exception to this caution: 'y' for unstressed /iː/ and 'o' for unstressed /oʊ/ are how English already spells these sounds, so the "perceptual ambiguity" test is more likely to pass.

## Conclusion

The current base phoneme mappings are well-optimized. Frequency-weighted analysis shows that every proposed collision-free change either has negligible real-text impact (/aɪ/→ei: -1 /M), loses more common words than it gains (/ɔ/→au: -555 /M, /oʊ/→ow: -1,330 /M), or introduces perceptual ambiguity for English readers (/uː/→eu, /oʊ/→ow).

Stress-conditioned splits are the most promising avenue for improvement. The AH0→'a' split produced a 67.6× frequency-weighted improvement — the single largest gain of any change. The exhaustive search found three candidates with significant real-text impact: IY0→'y' (+2,700 /M), UW0→'o' (+912 /M), and OW0→'o' (+246 /M). These follow the same linguistic principle: when CMU dictionary uses one phoneme label for sounds that English speakers perceive as different in stressed vs. unstressed positions, splitting by stress can unlock large gains without creating ambiguity.

10,150 identical words (8.05%) is the current baseline. With the top three stress-conditioned improvements (+3,858 /M combined), the identical word count would increase while maintaining Ingglish's design constraints (unambiguous readability, ASCII-only, no new characters).
