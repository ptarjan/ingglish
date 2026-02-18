# Identical Words Analysis

Do the current Ingglish phoneme mappings maximize "identical words," words where the Ingglish spelling matches the English spelling?

## Summary

No, and that's intentional.

The current mapping produces **8,644 identical words** (6.86% of the CMU dictionary). Alternative mappings could theoretically produce more, but most changes either create unacceptable collisions or reintroduce pronunciation ambiguity for English readers.

We exhaustively investigated **base phoneme changes** (7 collision-free candidates, up to +667 combined) and **stress-conditioned changes** (24 collision-free candidates, including IY0→'y' at +647 and OW0→'o' at +467). All base changes were rejected because they reintroduce pronunciation ambiguity — see [Recommendations](#recommendations). Stress-conditioned changes are a promising area for further exploration, following the precedent set by the schwa split (AH0→'a').

## Background

An "identical word" is one where converting English → phonemes → Ingglish produces the original English spelling. For example:
- "bit" → /bɪt/ → "bit" ✓ (identical)
- "boat" → /boʊt/ → "boht" ✗ (changed)

More identical words means more natural readability for native English readers: familiar words stay familiar.

Not all identical words are equal, though. Many words in the CMU dictionary are loanwords (German surnames like "Einstein", French words like "chateau"). Biasing spellings toward these source languages might increase the identical count, but these words won't feel familiar to English readers anyway. We use the [orthography comparison](orthography-comparison.md) to guide decisions, prioritizing spellings with broad international support rather than chasing loanword matches.

## Current Mapping Performance

| Metric | Value |
|--------|-------|
| Total entries in CMU dictionary | 135,166 (126,051 unique words) |
| Identical words | 8,644 (6.86%) |
| Existing collisions (homophones) | 18,974 |

Note: The baseline includes the stress-conditioned AH0→'a' override (unstressed schwa → 'a'), which is already implemented in the converter. This accounts for +2,016 identical words compared to a naive AH→'u' mapping. See [phoneme mapping](phoneme-mapping.md#schwa-and-strut) for details.

## Why Not Maximize Identical Words?

We tested mappings that maximize identical words:

| Change | Identical Gain | Problem |
|--------|---------------|---------|
| /oʊ/: oh → o | +1,200 | "go" and "got" both become "go" |
| /ʌ/: u → a | +782 | "cup" and "cap" both become "cap" |
| /z/: z → s | +755 | "prize" becomes "prise" |
| /ɔ/: aw → o | +532 | "saw" and "so" both become "so" |

These changes create **collisions**: different words that get the same spelling, making text ambiguous.

## Collision-Free Base Phoneme Alternatives

We exhaustively tested all 39 phonemes × 70 spelling options (2,730 combinations) to find base phoneme changes that increase identical word count without creating new collisions. Seven candidates emerged — all were rejected (see [Recommendations](#recommendations)).

### Candidates

| Phoneme | Current | Proposed | Gained | Lost | Net Gain |
|---------|---------|----------|--------|------|----------|
| /aɪ/ | ai | ei | +416 | -52 | **+364** |
| /oʊ/ | oh | ow | +237 | -103 | **+134** |
| /ɔ/ | aw | au | +229 | -144 | **+85** |
| /uː/ | uu | ue | +60 | -2 | **+58** |
| /uː/ | uu | eu | +53 | -2 | **+51** |
| /oʊ/ | oh | oe | +141 | -103 | **+38** |
| /ɔɪ/ | oi | oy | +154 | -128 | **+26** |

Best per phoneme, combined: up to +667 identical words (8,644 → ~9,311).

### Trade-off Analysis

#### /aɪ/: "ai" → "ei" (+364 net)

**Gained (416 words):** Words with "ei" spelling
- German surnames: bernstein, einstein, weinstein, klein, reich (loanwords)
- Native English: heist, seize, feisty, height, sleight, vein, rein

**Lost (52 words):** Words with "ai" for the /aɪ/ sound
- Asian loanwords: thai, chai, bonsai, mai, kai, samurai, shanghai

Mixed. Both gains and losses are largely loanwords. The native English gains (heist, height, seize) are valuable, but many German surname matches won't feel familiar to readers anyway.

#### /oʊ/: "oh" → "ow" (+134 net)

**Gained (237 words):** Words with "ow" spelling
- blow, flow, glow, grow, know, show, slow, snow, throw, below, follow, tomorrow, etc.

**Lost (103 words):** German-origin names with "oh" spelling
- bohn, bohner, groh, stroh, doh, etc.

Good trade on paper. But `ow` is **ambiguous in English** — see [rejection rationale](#rejected-o-oh--ow-134-net).

#### /ɔ/: "aw" → "au" (+85 net)

**Gained (229 words):** Words with "au" spelling
- audit, august, author, autumn, because, caught, daughter, fault, haul, etc.

**Lost (144 words):** Words with "aw" spelling
- dawn, draw, flaw, jaw, law, paw, raw, saw, straw, etc.

Mixed. Both sets contain common words.

#### /uː/: "uu" → "ue" (+58 net)

**Gained (60 words):** Words with "ue" spelling
- blue, clue, due, flue, glue, true, value, continue, argue, etc.

**Lost (2 words):** bruun, ruud

Almost pure gain. But `ue` in English has competing readings — "duet" and "fuel" suggest multi-syllable or /j/-onset interpretations.

#### /uː/: "uu" → "eu" (+51 net)

**Gained (53 words):** Words with "eu" spelling
- deuce, feud, neutral, neuron, pneumonia, pseudo, therapeutic, etc.

**Lost (2 words):** bruun, ruud

`eu` in English implies a /j/ onset: "feud", "deuce", "neural" are all /juː/. So `meun` (moon) reads as "mew-n".

#### /ɔɪ/: "oi" → "oy" (+26 net)

**Gained (154 words):** Words with "oy" spelling
- boy, joy, toy, enjoy, destroy, employ, royal, loyal, etc.

**Lost (128 words):** Words with "oi" spelling
- oil, boil, coin, join, point, voice, choice, noise, etc.

Nearly breaks even. Both "oi" and "oy" are common spellings.

## Stress-Conditioned Alternatives

Following the precedent of splitting AH by stress (AH0→'a' for schwa vs AH1/2→'u' for strut), we tested whether other vowels benefit from stress-specific spellings. This tests changing only the **unstressed (stress-0) variant** of each vowel while keeping stressed variants at their current mapping.

The linguistic justification: English unstressed vowels often sound different from their stressed counterparts. Just as schwa (/ə/) and strut (/ʌ/) are technically the same CMU phoneme but sound different, unstressed /iː/ in "happy" sounds different from stressed /iː/ in "bee", and unstressed /oʊ/ in "avocado" sounds different from stressed /oʊ/ in "go". English speakers generally perceive these as different sounds.

We tested all 15 stress-0 vowel phonemes × 70 options (1,036 combinations). Twenty-four collision-free improvements were found.

### Top Candidates

| Unstressed Phoneme | Current | Proposed | Gained | Lost | Net Gain |
|---------------------|---------|----------|--------|------|----------|
| IY0 (unstressed /iː/) | ee | y | +708 | -61 | **+647** |
| OW0 (unstressed /oʊ/) | oh | o | +469 | -2 | **+467** |
| UW0 (unstressed /uː/) | uu | u | +95 | -0 | **+95** |
| AO0 (unstressed /ɔː/) | aw | o | +102 | -10 | **+92** |

### Analysis

#### IY0: "ee" → "y" (+647 net)

The largest single improvement found. Unstressed /iː/ at the end of words like "happy", "body", "city", "baby" is already spelled 'y' in English. English speakers perceive this as a different sound from stressed /iː/ in "bee" — it's shorter and lighter. Many phonologists treat it as a distinct phoneme ([happy tensing](https://en.wikipedia.org/wiki/Happy-tensing)).

**Gained (708 words):** body, happy, city, baby, army, crazy, easy, every, family, heavy, party, sorry, study, etc.

**Lost (61 words):** adweek, banerjee, bisbee, chimpanzee, estee, marquee,essee, etc.

The gains are extremely common English words; the losses are mostly proper nouns and rare words. This is the strongest stress-conditioned candidate.

#### OW0: "oh" → "o" (+467 net)

Unstressed /oʊ/ is already spelled 'o' in most English words: "also", "avocado", "tomato", "potato". English speakers hear unstressed /oʊ/ as a simple 'o' sound.

**Gained (469 words):** also, avocado, buffalo, casino, colorado, dynamo, espresso, fiasco, gusto, lingo, macho, memo, motto, pinto, portfolio, pseudo, studio, tornado, volcano, etc.

**Lost (2 words):** eroh, marohl

Almost pure gain of common words for two obscure losses.

#### UW0: "uu" → "u" (+95 net)

Unstressed /uː/ spelled as 'u': "flu", "tofu", "tutu". Natural English spelling.

**Gained (95 words):** flu, tofu, tutu, bayou, caribou, impromptu, peru, etc.

**Lost (0 words):** Pure gain.

Note: 'u' is already used for stressed /ʌ/ (AH1/2→'u'). This works because they're in complementary distribution: stressed 'u' = /ʌ/, unstressed 'u' = /uː/. This parallels the AH split where unstressed 'a' = /ə/ and stressed 'a' = /æ/ (via AE).

#### AO0: "aw" → "o" (+92 net)

Unstressed /ɔː/ spelled as 'o': "almost", "already", "autopsy", "chocolate", "dinosaur".

**Gained (102 words):** almost, already, autopsy, chocolate, dinosaur, etc.

**Lost (10 words).**

Note: Both OW0 and AO0 would map to 'o' in unstressed position. The script confirmed this doesn't create collisions — unstressed /oʊ/ and /ɔː/ rarely form minimal pairs, and many English dialects merge them in unstressed position anyway.

## Recommendations

### Base phoneme changes: No changes recommended.

All seven proposed base changes were investigated and rejected. The identical word count has a blind spot: it counts string matches without checking whether an English reader would *pronounce* the shared spelling correctly.

#### Rejected: /oʊ/: "oh" → "ow" (+134 net)

The gains look good on paper: snow, throw, bowl, window all become identical. But `ow` is **ambiguous in English**: it represents both /oʊ/ (snow, throw) and /aʊ/ (cow, town, brown). New combinations like `bownz` (bones) read as "bowns", `howm` (home) reads like it rhymes with "cow", and `stown` (stone) reads like "stoun". This reintroduces exactly the kind of ambiguity Ingglish is designed to eliminate.

#### Rejected: /uː/: "uu" → "ue" (+58 net) / "eu" (+51 net)

`eu` in English implies a /j/ onset: "feud", "deuce", "neural" are all /juː/. So `meun` (moon) reads as "mew-n" (two syllables), `seun` (soon) reads as "syoon", and `teu` (too) reads as "tyoo". `ue` is somewhat better but "duet" and "fuel" show it can imply multi-syllable readings. The current `uu` has no competing English interpretation.

#### Rejected: /aɪ/: "ai" → "ei" (+364 net)

Most gains are German loanwords (einstein, bernstein, weinstein, klein, reich) that don't feel familiar to English readers anyway.

#### Rejected: /ɔ/: "aw" → "au" (+85 net)

Trades common "aw" words (dawn, draw, flaw, jaw, law, saw) for common "au" words (audit, august, author, autumn). Nearly a wash, no compelling reason to change.

#### Rejected: /ɔɪ/: "oi" → "oy" (+26 net)

Nearly breaks even. Not worth the disruption.

### Stress-conditioned changes: Promising, needs further investigation.

The stress-conditioned findings follow the same pattern that made AH0→'a' successful: unstressed vowels in English often sound different enough from their stressed counterparts to justify distinct spellings. The top candidates (IY0→'y' at +647, OW0→'o' at +467) have strong linguistic justification and massive gains with minimal losses.

Key questions before implementing:

1. **Does splitting more phonemes by stress make the system harder to learn?** The AH split is justified by a clear phonemic distinction (/ə/ vs /ʌ/). Are IY0/IY1 and OW0/OW1 similarly distinct, or just "quieter versions"?
2. **Are the unstressed variants truly distinct to English speakers?** Unstressed 'y' in "happy" does sound different from 'ee' in "bee". Unstressed 'o' in "avocado" does sound different from 'oh' in "go". But is the difference as clear-cut as schwa vs strut?
3. **Do the new spellings avoid perceptual ambiguity?** Unlike the rejected base changes, 'y' for unstressed /iː/ and 'o' for unstressed /oʊ/ are how English *already spells these sounds*. English readers would likely pronounce them correctly naturally.

## Methodology

Analysis scripts are in `packages/core/scripts/`:

- `analyze-identical-words.ts` - Explains why maximizing identical words creates problems
- `exhaustive-search.ts` - Exhaustively tests all possible spelling options, including stress-conditioned overrides

The exhaustive search runs in three phases:

1. **Base phoneme search**: Tests changing each of 39 phonemes to 70 spelling options (2,730 combinations)
2. **Stress-conditioned search**: Tests changing only stress-0 variants of 15 vowel phonemes (1,036 combinations)
3. **Combination test**: Greedily applies non-conflicting improvements from both phases

Run with:
```bash
npx vite-node scripts/exhaustive-search.ts
```

## Why Identical Word Count Can Mislead

The identical word count measures string equality, but **it doesn't measure whether the shared spelling reads correctly**. A proposed change must pass two tests:

1. **No new collisions** (different words getting the same spelling). The exhaustive search checks this.
2. **No new ambiguity** (the spelling reads as the wrong sound to English readers). This requires human judgment.

The `ow` and `eu` changes both pass test 1 but fail test 2. They don't create collisions in the formal sense, but they create *perceptual* collisions where English readers' existing intuitions produce the wrong pronunciation.

The current mappings (`oh` for /oʊ/, `uu` for /uː/) work because they have **no competing English interpretation** to mislead readers. `oh` is unusual but unambiguous. `uu` has no English precedent to conflict with. The Finnish "double for long" logic succeeds here because English never uses `uu`.

Stress-conditioned changes may be an exception to this caution: 'y' for unstressed /iː/ and 'o' for unstressed /oʊ/ are how English already spells these sounds, so the "perceptual ambiguity" test is more likely to pass.

## Conclusion

The current base phoneme mappings are well-optimized. Alternative base spellings could add up to +667 identical words, but every proposed change either loses common words, gains mostly loanwords, or reintroduces pronunciation ambiguity.

Stress-conditioned splits are the most promising avenue for improvement. The AH0→'a' split already added +2,016 words. The exhaustive search found that IY0→'y' (+647), OW0→'o' (+467), UW0→'u' (+95), and AO0→'o' (+92) could collectively add over 1,300 more identical words. These follow the same linguistic principle: when CMU dictionary uses one phoneme label for sounds that English speakers perceive as different in stressed vs. unstressed positions, splitting by stress can unlock large gains without creating ambiguity.

8,644 identical words (6.86%) is the current baseline. With stress-conditioned improvements, this could potentially reach ~10,000 while maintaining Ingglish's design constraints.
