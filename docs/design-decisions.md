# Design Decisions

This document explains the core design decisions behind Ingglish: why we made specific choices, what alternatives we considered, and what we learned along the way.

## Core Principles

1. **One sound, one spelling**: Each [phoneme](https://en.wikipedia.org/wiki/Phoneme) maps to exactly one spelling sequence
2. **No new characters**: Only 24 ASCII letters—no 'q' (use 'kw'), no 'x' (use 'ks'), 'c' only in 'ch'
3. **Intuitive for English readers**: Spellings feel natural based on existing English conventions
4. **Consistent and reversible**: The mapping is deterministic in both directions
5. **Voluntary adoption**: Not trying to replace English—supplements it

## Why English Is Hard

English spelling is notoriously difficult because:

1. **Too many vowels**: English has 14-15 vowel sounds but only 5 vowel letters (a, e, i, o, u). Spanish has 5 of each—no problem. We solve this with doubling (ee, uu, oo) and digraphs (ai, ay, ou).

2. **Rare consonants**: Only 4% of languages have /θ/ (think) and 7% have /ð/ (the). There's no "standard" way to write these because most languages never needed one.

3. **R-colored vowels**: Sounds like "bird" and "car" are unique to American English. We follow intuitive spellings (er, ar) that English readers already expect.

## What Makes Ingglish Different

Previous spelling reforms failed because they:
- Required learning entirely new alphabets ([Shavian](https://en.wikipedia.org/wiki/Shavian_alphabet), [Deseret](https://en.wikipedia.org/wiki/Deseret_alphabet))
- Created systems that later had to be "un-taught" ([Initial Teaching Alphabet](https://en.wikipedia.org/wiki/Initial_Teaching_Alphabet))
- Tried to mandate change through political authority ([Roosevelt](https://en.wikipedia.org/wiki/Simplified_Spelling_Board), [Carnegie](https://en.wikipedia.org/wiki/Simplified_Spelling_Board))

Ingglish avoids these traps:

| Design Choice | Why It Matters |
|--------------|----------------|
| Standard ASCII letters | No new characters to learn |
| Familiar digraphs (sh, ch, th, ng) | You already know these |
| Logical extensions (zh parallels sh) | Easy to infer new patterns |
| Bidirectional conversion | Convert any text instantly |
| Not replacing English | No political mandate needed |

## Specific Spelling Decisions

### Consonant [Digraphs](https://en.wikipedia.org/wiki/Digraph_(orthography))

**TH vs DH Distinction**

Traditional English uses "th" for both sounds:
- Voiceless [/θ/](https://en.wikipedia.org/wiki/Voiceless_dental_fricative): "**th**ink", "ba**th**"
- Voiced [/ð/](https://en.wikipedia.org/wiki/Voiced_dental_fricative): "**th**e", "**th**is"

We preserve this distinction with **"th"** and **"dh"** respectively. [Albanian](https://en.wikipedia.org/wiki/Albanian_alphabet) already uses 'dh' officially.

**ZH for [/ʒ/](https://en.wikipedia.org/wiki/Voiced_postalveolar_fricative)**

English hides this sound in "measure", "vision", "beige". We give it a proper spelling that parallels sh/zh like s/z.

### Vowel Spellings

**Doubled Vowels**

| Spelling | Sound | Rationale |
|----------|-------|-----------|
| ee | /iː/ (bee) | [Finnish](https://en.wikipedia.org/wiki/Finnish_orthography)/[Estonian](https://en.wikipedia.org/wiki/Estonian_orthography) pattern for long vowels |
| uu | /uː/ (too) | Longer sound gets longer spelling |
| oo | /ʊ/ (book) | Matches English "book", "good", "look" |

**Schwa Representation**

The [schwa](https://en.wikipedia.org/wiki/Schwa) (ə) is the most common vowel in unstressed syllables. We map it to **"u"**, which matches words like "but" and "cup".

### Diphthong Decisions

The [diphthong](https://en.wikipedia.org/wiki/Diphthong) spellings were among the hardest decisions. Unlike consonants (where 'sh', 'ch', 'ng' are nearly universal), diphthongs have **competing conventions** across languages.

| Sound | Spelling | Why This Choice |
|-------|----------|-----------------|
| /aɪ/ (my) | **ai** | IPA alignment; [Pinyin](https://en.wikipedia.org/wiki/Pinyin), Italian, Vietnamese precedent |
| /aʊ/ (cow) | **ou** | "out", "loud", "sound" stay identical; [Dutch](https://en.wikipedia.org/wiki/Dutch_orthography) uses 'ou' |
| /eɪ/ (say) | **ay** | Matches English "say", "day", "play" |
| /oʊ/ (go) | **oh** | Unambiguous; 'ow' was rejected (see below) |
| /ɔɪ/ (boy) | **oi** | Universal across languages |

**Examples:**
| English | Ingglish |
|---------|----------|
| my time | mai taim |
| say day | say day |
| out loud | out loud |
| go show | goh shoh |

**Why not 'ow' for /oʊ/?** It would make snow, throw, bowl, window identical to English. But `ow` is ambiguous in English — it represents both /oʊ/ (snow) and /aʊ/ (cow). New combinations like `bownz` (bones) read as "bowns" and `howm` (home) sounds like it rhymes with "cow". The `oh` spelling has no competing English interpretation, keeping it unambiguous.

**Why not 'eu' for /uː/?** It would gain words like feud, deuce, neutral. But `eu` in English implies a /j/ onset — "feud" is /fjuːd/, "neural" is /njʊɹəl/. So `meun` (moon) reads as "mew-n" (two syllables) and `teu` (too) reads as "tyoo". The `uu` spelling has no English precedent to mislead readers.

### R-Colored Vowels

When certain vowels are followed by R, they combine into special [r-colored sounds](https://en.wikipedia.org/wiki/R-colored_vowel). Without special handling, we'd get collisions:

| Combination | Spelling | Why |
|-------------|----------|-----|
| /æ/ + R | arr | Matches English "carrot", "barrel" |
| /ɛ/ + R | air | Fixed 204 collisions (air vs her) |
| /ɪ/ + R | eer | "beer" → "beer", "beard" → "beerd" (avoids "bird") |
| /ɑ/ + R | ar | "star" → "star" (identical!) |
| /ɔ/ + R | or | "store" → "stor" |
| /ɝ/ | er | "bird", "her", "turn" → "berd", "her", "tern" |

## Dialect Choice

Ingglish uses **[General American English](https://en.wikipedia.org/wiki/General_American_English)** based on the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary). This accent dominates global media and the internet, making it the practical choice for standardization.

Non-American speakers will find some spellings don't match their pronunciation, but they'll recognize the sounds from movies, music, and online content.

## Our Choices Are Well-Supported

Every Ingglish spelling has precedent in at least one major language:

1. **Consonant digraphs** (sh, ch, zh, th, dh, ng): Standard approach worldwide
2. **Vowel doubling** (ee, uu): Finnish/Estonian pattern
3. **Diphthong spellings** (ai, ay, ou, oi, oh): Follow existing patterns

For detailed language-by-language comparisons, see [Orthography Comparison](orthography-comparison.md).

## See Also

- [Spelling Evolution](spelling-evolution.md) - Complete history of spelling changes
- [Orthography Comparison](orthography-comparison.md) - How spellings compare to other languages
- [Phoneme Mapping](phoneme-mapping.md) - Technical mapping tables
- [Spelling Reform History](spelling-reform-comparison.md) - Why previous reforms failed
- [Identical Words Analysis](identical-words-analysis.md) - Analysis of words that stay unchanged
