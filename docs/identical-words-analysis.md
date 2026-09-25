# Identical Words Analysis

An "identical word" is one that Ingglish spells exactly as English does. Do the current Ingglish spellings produce as many identical words as they could?

## Summary

No, and that's intentional.

The current mapping from sounds to spellings produces **10,150 identical words** (8.05% of the CMU dictionary, the pronunciation dictionary Ingglish is built on). Other mappings could in theory produce more, but most of them either create unacceptable collisions (different words sharing a spelling) or bring back spellings that English readers would mispronounce.

We tested every one of 2,730 alternative spellings that avoid collisions, weighting each word by how often it appears (occurrences per million words of text, written /M). Only one candidate comes out ahead, and it's too marginal to be worth the disruption. The rest come out behind, most sharply /uː/→eu:

- /ɔɪ/→oy: **+235 /M**, marginal; "oi" and "oy" are both common English spellings
- /aɪ/→ei: **-1 /M**, shuffles rare German surnames, essentially zero effect on real text
- /ɔ/→au: **-555 /M**, loses saw (413 /M), law (119 /M)
- /oʊ/→ow: **-1,330 /M**: "oh" alone (3,374 /M) outweighs all gains
- /uː/→eu: **-3,657 /M**: loses too (1,407 /M), room (451 /M), soon (264 /M) — ordinary words currently spelled 'oo' — for the sake of rare gains like zeus (6 /M) and neutral (4 /M); `eu` also misleads English readers (`meun` reads as "mew-n")

All five candidates were rejected (see [Recommendations](#recommendations)). The most promising area for further work is spelling a vowel differently when it is unstressed, as Ingglish already does for schwa (unstressed /ə/ → 'a').

## Background

A word is identical when converting English → sounds → Ingglish gives back the original English spelling. For example:
- "bit" → /bɪt/ → "bit" ✓ (identical)
- "boat" → /boʊt/ → "boht" ✗ (changed)

The more identical words, the easier Ingglish is for native English readers: familiar words stay familiar.

Not all identical words matter equally, though. Many words in the CMU dictionary are borrowed or foreign names (German surnames like "Einstein", French words like "chateau"). **Frequency weighting** shows a change's real effect on everyday text: gaining 200 rare words but losing "say", "day" and "way" is a terrible trade. We weight by word frequency (from the SUBTLEX-US corpus, per million words of text) and use the [orthography comparison](orthography-comparison.md) alongside it, so decisions rest on real text rather than raw dictionary counts.

## Current Mapping Performance

| Metric | Value |
|--------|-------|
| Total unique words in CMU dictionary | 126,051 |
| Identical words | 10,150 (8.05%) |
| Existing collisions (homophones) | 18,847 |

Note: these figures already include the rule that spells unstressed schwa (ARPAbet AH0) as 'a', which the converter implements. That rule produced a 67.6× frequency-weighted improvement, the largest gain from any single change. See [phoneme mapping](phoneme-mapping.md#schwa-and-strut) for details.

## Why Not Maximize Identical Words?

We tested mappings that would produce the most identical words:

| Change | Freq Impact /M | Problem |
|--------|----------------|---------|
| /oʊ/: oh → o | +20,998 | "go" and "got" both become "go" |
| /z/: z → s | +19,772 | "prize" becomes "prise" |
| /ɔ/: aw → o | +845 | "saw" and "so" both become "so" |

These changes create **collisions**: different words with the same spelling, which makes text ambiguous. However large the frequency gain, that ambiguity is too high a price.

## Collision-Free Base Phoneme Alternatives

We tested every combination of 39 sounds × 70 spelling options (2,730 in all) to find changes that create no collisions. Only one comes out ahead (+235 /M), and it's too marginal to be worth the disruption. The other four come out behind, one of them (/uː/→eu) by a wide margin. All five were rejected (see [Recommendations](#recommendations)).

### Candidates (sorted by frequency impact)

| Phoneme | Current | Proposed | Net /M | Top Gains (/M) | Top Losses (/M) |
|---------|---------|----------|--------|-----------------|-----------------|
| /ɔɪ/ | oi | oy | **+235** | boy (543), enjoy (85), joy (29) | point (243), join (86), oil (42) |
| /aɪ/ | ai | ei | **-1** | einstein (5), heist (3), stein (3) | shanghai (5), saigon (4), ai (4) |
| /ɔ/ | aw | au | **-555** | fault (107), paul (97), launch (20) | saw (413), law (119), lawyer (82) |
| /oʊ/ | oh | ow | **-1,330** | show (501), own (471), throw (132) | oh (3,374) |
| /uː/ | oo | eu | **-3,657** | zeus (6), neutral (4), maneuver (3) | too (1,407), room (451), soon (264) |

/ɔɪ/→oy is the only candidate that comes out ahead, and only marginally: "oi" and "oy" are close enough in frequency that it's nearly a wash (see below). /uː/→eu also fails the mispronunciation test, on top of now being the worst of the five by frequency.

### Trade-off Analysis

#### /ɔɪ/: "oi" → "oy" (+235 /M)

The best trade by frequency: it gains boy (543 /M), enjoy (85 /M), joy (29 /M) and royal (24 /M) but loses point (243 /M), join (86 /M) and oil (42 /M). Both "oi" and "oy" are common English spellings with similar total frequency, so it's nearly a wash. Not compelling enough to change.

#### /aɪ/: "ai" → "ei" (-1 /M)

The clearest case of frequency revealing what a raw count hides. The top gain is "einstein" at 5 /M. Most gains are German surnames (bernstein, weinstein, klein, reich). The losses are rare too (shanghai 5 /M, saigon 4 /M). This change would affect almost no real text.

#### /ɔ/: "aw" → "au" (-555 /M)

It gains fault (107 /M), paul (97 /M), launch (20 /M), trauma (17 /M) and vault (12 /M) but loses saw (413 /M), law (119 /M), lawyer (82 /M), aw (42 /M) and draw (41 /M). The losses are more common everyday words, so it's a bad trade for real text.

#### /oʊ/: "oh" → "ow" (-1,330 /M)

It gains show (501 /M), own (471 /M), throw (132 /M), blow (100 /M) and window (88 /M), all useful words. But "oh" alone, at 3,374 /M, outweighs them all. It also leads readers to mispronounce words: English uses `ow` for both /oʊ/ (snow) and /aʊ/ (cow); see [Design Decisions](design-decisions.md#diphthong-decisions).

#### /uː/: "oo" → "eu" (-3,657 /M)

The worst trade of the five, and it looks better than it is if you only count words. It keeps zeus (6 /M), neutral (4 /M) and maneuver (3 /M) identical, mostly rare surnames, but breaks too (1,407 /M), room (451 /M), soon (264 /M), shoot (169 /M) and food (158 /M) — ordinary English words that are currently identical under 'oo'. It also leads readers to mispronounce words: `meun` (moon) reads as "mew-n" and `teu` (too) as "tyoo"; see [Design Decisions](design-decisions.md#diphthong-decisions).

## Alternative Improvements Not Recommended

| Change | Net /M | Reason Rejected |
|--------|--------|-----------------|
| /oʊ/: oh → oe | -3,210 | Worse than "ow" in every dimension |
| /oʊ/: oh → oa | — | Lower gain than "ow" for same phoneme |

## Stress-Conditioned Alternatives

The CMU dictionary writes both schwa and the stressed "uh" vowel as AH, and Ingglish spells them differently depending on stress (AH0→'a' for schwa vs AH1/2→'uh' for strut). The dictionary marks stress with a digit after the vowel: 0 means unstressed (so IY0 is unstressed /iː/), 1 and 2 mean stressed. We tested whether other vowels would also benefit from a separate spelling when unstressed. Each test changes only the **unstressed (stress-0) version** of one vowel and leaves the stressed versions as they are.

The linguistic case: English vowels often sound different when unstressed. Schwa (/ə/) and the "uh" in "strut" (/ʌ/) are the same CMU phoneme but sound different; in the same way, the unstressed /iː/ at the end of "happy" sounds different from the stressed /iː/ in "bee", and the unstressed /oʊ/ in "avocado" sounds different from the stressed /oʊ/ in "go". English speakers generally hear these as different sounds.

We tested all 15 unstressed vowels against the 70 spelling options, skipping any option that is already the vowel's current spelling (1,036 combinations). Twenty-five changes avoid collisions, but frequency weighting shows that only three make a significant difference in real text.

### Top Candidates (sorted by frequency impact)

| Unstressed Phoneme | Current | Proposed | Net /M | Top Gains (/M) | Top Losses (/M) |
|---------------------|---------|----------|--------|-----------------|-----------------|
| IY0 (unstressed /iː/) | ee | y | **+2,700** | every (563), party (239), story (226), body (201) | frisbee (2), godspeed (1), chimpanzee (1) |
| UW0 (unstressed /uː/) | oo | o | **+912** | into (866), onto (38), unto (8) | — |
| OW0 (unstressed /oʊ/) | oh | o | **+246** | hotel (106), noel (19), motel (19), november (9) | — |
| UW0 (unstressed /uː/) | oo | u | **+9** | flu (<1), tofu (<1), tutu (<1) | — |
| AO0 (unstressed /ɔː/) | aw | o | **+0.5** | menthol (<1), oblong (<1) | — |

Weighting by frequency reorders the rankings sharply. UW0→'u' makes 97 more words identical but gains only +9 /M, because all of them are rare. UW0→'o' makes just 3 more words identical but gains +912 /M, because "into" alone is 866 /M. AO0→'o' makes 28 more words identical but gains only +0.5 /M, essentially nothing in real text.

### Analysis

#### IY0: "ee" → "y" (+2,700 /M)

By far the largest gain from a stress-based split. English already spells the unstressed /iː/ at the end of "happy", "body", "city", "baby" with 'y'. English speakers hear it as a different sound from the stressed /iː/ in "bee": shorter and lighter. Many phonologists treat it as a separate phoneme ([happy tensing](https://en.wikipedia.org/wiki/Happy-tensing)).

Top gains: every (563 /M), party (239 /M), story (226 /M), body (201 /M), army (88 /M), henry (79 /M), plenty (64 /M), hardly (53 /M), study (50 /M).

Top losses: frisbee (2 /M), godspeed (1 /M), chimpanzee (1 /M), all rare.

The gains are very common English words; the losses are mostly names and rare words. This is the strongest stress-based candidate.

#### UW0: "oo" → "o" (+912 /M)

A surprise: it affects just three words, into (866 /M), onto (38 /M) and unto (8 /M), but "into" is so common that it dominates. There are no losses.

It beats UW0→'u' (+9 /M), which makes 97 words identical, all of them rare (flu, tofu, tutu, bayou, caribou). Three common words far outweigh 97 rare ones.

#### OW0: "oh" → "o" (+246 /M)

English already spells unstressed /oʊ/ as 'o' in most words: "also", "avocado", "tomato", "potato". English speakers hear unstressed /oʊ/ as a plain 'o' sound.

Top gains: hotel (106 /M), noel (19 /M), motel (19 /M), november (9 /M), limo (9 /M), nemo (5 /M), porno (5 /M), info (4 /M). No losses.

Almost entirely a gain in common words.

Note: OW0 and AO0 would both be spelled 'o' when unstressed. The script confirmed this creates no collisions: unstressed /oʊ/ and /ɔː/ rarely distinguish two words, and many English dialects pronounce them the same when unstressed anyway.

## Collision Check

We checked that the proposed changes don't create problem collisions:

| Word Pair | Current | Proposed | Status |
|-----------|---------|----------|--------|
| cup / cap | kuhp / kap | kuhp / kap | ✓ Distinct |
| cut / cat | kuht / kat | kuht / kat | ✓ Distinct |
| go / got | goh / got | gow / got | ✓ Distinct |
| so / saw | soh / saw | sow / sau | ✓ Distinct |
| know / now | noh / nou | now / nou | ⚠️ Misleading |

**Note:** because /aʊ/ is spelled 'ou', "know" and "now" stay distinct. But under /oʊ/→ow, "know" would be spelled "now", so English readers would read it as the word "now". This is the mispronunciation problem described below, and one of the reasons the "ow" spelling was rejected.

## Recommendations

### Base phoneme changes: No changes recommended.

All five proposed changes were investigated and rejected. Each one fails at least one of two tests:

1. **Frequency impact**: does the change help or hurt in real text?
   - /uː/→eu: -3,657 /M (worst of the five; breaks too, room, soon and other common 'oo' words)
   - /ɔ/→au: -555 /M, /oʊ/→ow: -1,330 /M (net negative)
   - /aɪ/→ei: -1 /M (negligible)
   - /ɔɪ/→oy: +235 /M (marginal, nearly a wash)

2. **Mispronunciation**: would an English reader say the new spellings correctly?
   - /oʊ/→ow: `bownz` reads as "bowns", `howm` reads like "cow"
   - /uː/→eu: `meun` reads as "mew-n", `teu` reads as "tyoo"

### Stress-conditioned changes: Promising, needs further investigation.

These findings follow the same pattern that made AH0→'a' work: English vowels often sound different enough when unstressed to deserve their own spelling. The top candidates (IY0→'y' (+2,700 /M), UW0→'o' (+912 /M), OW0→'o' (+246 /M)) have strong linguistic support and large gains with minimal losses.

Questions to answer before implementing them:

1. **Does splitting more sounds by stress make the system harder to learn?** The AH split rests on a clear difference in sound (/ə/ vs /ʌ/). Are IY0 vs IY1 and OW0 vs OW1 just as distinct, or only "quieter versions" of the same vowel?
2. **Do English speakers really hear the unstressed versions as different?** The 'y' in "happy" does sound different from the 'ee' in "bee", and the 'o' in "avocado" does sound different from the 'oh' in "go". But is the difference as clear-cut as schwa vs strut?
3. **Will readers pronounce the new spellings correctly?** Unlike the rejected base changes, 'y' for unstressed /iː/ and 'o' for unstressed /oʊ/ are how English *already spells these sounds*, so English readers would most likely say them correctly without help.

## Mapping Quality Metrics

The experiment page shows several metrics for judging a mapping from sounds to spellings: text preservation, unambiguous text, pronounceability (G2P, or grapheme-to-phoneme, round-trip), edit similarity, spelling familiarity, and naturalness (orthotactic probability). See [metrics.md](metrics.md) for what each metric measures, its formula and limitations, and why metrics that only look at the letters can't find the best mapping.

## Methodology

The analysis scripts are in `packages/core/scripts/analysis/`:

- `analyze-identical-words.ts` - Tests alternative mappings with frequency weighting
- `exhaustive-search.ts` - Tests every spelling option, including stress-based overrides, sorted by frequency impact
- `familiarity-search.ts` - Measures how familiar each sound's spelling looks
- `g2p-roundtrip-search.ts` - Hill-climbing search on G2P round-trip pronounceability (the pronounceability metric on the experiment page)
- `orthotactic-search.ts` - Hill-climbing search on orthotactic probability, using a character-pair model (replaced by G2P round-trip)

All scripts use the real translation logic (special spellings for vowels before R, stress-based schwa), so they match the actual `arpabetToIngglish()` output. Results are sorted and judged by frequency-weighted impact (per million words of text, SUBTLEX-US corpus), not raw word count.

The exhaustive search runs in three phases:

1. **Base phoneme search**: tries each of 39 phonemes with 70 spelling options (2,730 combinations)
2. **Stress-conditioned search**: tries changing only the unstressed versions of 15 vowel phonemes (1,036 combinations)
3. **Combination test**: applies non-conflicting improvements from both phases, best first

Run with:
```bash
npx vite-node --script scripts/analysis/exhaustive-search.ts
```

## Why Raw Identical Word Count Misleads

A raw count of identical words has two blind spots:

1. **Every word counts the same.** Gaining 200 rare surnames and losing "say", "day" and "way" looks like +197 on paper but is terrible for real text. Frequency weighting measures the effect per million words of actual use.

2. **It doesn't measure readability.** A new spelling must read correctly to English speakers. Several changes above create no collisions but fail this test (see [Design Decisions](design-decisions.md#diphthong-decisions) for the readability analysis).

## Conclusion

The current base mappings are close to the best available. Every collision-free alternative either barely affects real text, loses more common words than it gains, or leads readers to mispronounce words.

Splitting vowels by stress is the most promising direction. The top three candidates (IY0→'y' (+2,700 /M), UW0→'o' (+912 /M), OW0→'o' (+246 /M)) follow the same principle that made the AH0→'a' schwa split work: when a vowel sounds different to English speakers stressed and unstressed, giving each its own spelling can make more words identical without creating ambiguity.
