# Design Decisions: Why Ingglish Spells Things This Way

Why we made these spelling choices, and what we tried that didn't work.

## Motivation

My 5-year-old is learning to read and I keep having to say "yeah sorry, that letter is silent" and "no, those letters make a different sound in this word." The sequence "ough" alone has at least six pronunciations: though (/oʊ/), through (/uː/), rough (/ʌf/), cough (/ɔf/), thought (/ɔː/), bough (/aʊ/). Every English learner, whether a child or a non-native speaker, pays this cost.

I wanted a system where you could look at any word and know exactly how to say it. Not a new alphabet, not a political campaign, just a consistent spelling you can read on any keyboard and convert back to standard English whenever you need to.

## Sample Text: The North Wind and the Sun

The standard passage used to compare writing systems, shown in English and Ingglish side by side.

**English:**

> The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take off his cloak should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler wrap his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.

**Ingglish:**

> Dha North Waind and dha Suhn wer dispyooting wich woz dha strawnger, wen a travaler kaym alawng rapt in a worm klohk. Dhay agreed dhat dha wuhn hoo ferst sakseedid in mayking dha travaler tayk awf hiz klohk shud bee kansiderd strawnger dhan dha uhdher. Dhen dha North Waind bloo az hard az hee kud, buht dha mor hee bloo dha mor klohslee did dha travaler rap hiz klohk eround him; and at last dha North Waind gayv uhp dha atempt. Dhen dha Suhn shohn out wormlee, and imeedeeatlee dha travaler tuk awf hiz klohk. And soh dha North Waind woz ablaijd too kanfes dhat dha Suhn woz dha strawnger uhv dha too.

Notice how many words stay identical or nearly identical: "North", "and", "in", "a", "agreed", "hard", "him", "at", "last", "up", "out", "took". The biggest visual changes are "the" → "dha" (the th/dh split) and phonemically spelled vowels like "klohk" (cloak) and "strawnger" (stronger).

## Core Principles

1. **One sound, one spelling (and vice versa)**: Each [phoneme](https://en.wikipedia.org/wiki/Phoneme) maps to exactly one spelling, and each spelling maps to exactly one sound. (For [R-colored vowels](phoneme-mapping.md#r-colored-vowels), certain vowel+R sequences get their own spellings like "air" and "ar"; see the phoneme mapping for details.)
2. **No new characters**: Standard Latin letters minus 'q' (use 'kw') and 'x' (use 'ks'), with 'c' appearing only in the digraph 'ch'
3. **Intuitive for English readers**: Spellings feel natural based on existing English conventions
4. **Consistent and reversible**: Forward translation is deterministic; reverse uses word frequency to pick the most likely homophone
5. **Voluntary adoption**: Not trying to replace English, supplements it

## Why English Is Hard

English spelling is notoriously difficult because:

1. **Too many vowels**: English has 14–15 vowel phonemes but only 5 vowel letters (a, e, i, o, u). Spanish has 5 of each, no problem. We solve this with doubling (ee, oo) and digraphs (ai, ay, ou, uh). (Vowel count based on [Ladefoged & Johnson 2014](https://books.google.com/books?id=FjIVAgAAQBAJ), *A Course in Phonetics*, for General American English. Exact count varies by analysis and dialect.)

2. **Rare consonants**: Only ~4% of languages have /θ/ and ~7% have /ð/ ([PHOIBLE 2.0](https://phoible.org/); [Maddieson 2013, WALS Chapter 19](https://wals.info/chapter/19) reports ~8% for dental fricatives broadly). There's no "standard" way to write these because most languages never needed one.

3. **R-colored vowels**: Sounds like "bird" and "car" are rare across world languages. We follow intuitive spellings (er, ar) that English readers already expect.

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

We use **"th"** for the voiceless sound and **"dh"** for the voiced one. [Albanian](https://en.wikipedia.org/wiki/Albanian_alphabet) already uses 'dh' officially.

**ZH for [/ʒ/](https://en.wikipedia.org/wiki/Voiced_postalveolar_fricative)**

English hides this sound in "measure", "vision", "beige". We give it a proper spelling that parallels sh/zh like s/z.

### Vowel Spellings

**Doubled Vowels**

| Spelling | Sound | Rationale |
|----------|-------|-----------|
| ee | /iː/ (bee) | [Finnish](https://en.wikipedia.org/wiki/Finnish_orthography)/[Estonian](https://en.wikipedia.org/wiki/Estonian_orthography) pattern for long vowels |
| oo | /uː/ (too) | Matches English "too", "food", "moon", "cool" |
| uh | /ʌ/ (but) | English interjection "uh" — frees 'u' for /ʊ/ |

**Schwa Representation**

We map unstressed schwa (ə) to **"a"** and stressed /ʌ/ to **"uh"**, which preserves the spelling of "a", "about", "again", "along", "away", "around". See [Phoneme Mapping](phoneme-mapping.md#schwa-and-strut) for details and [Spelling Iteration Log](spelling-iteration.md#about-sofa-u-a) for the full rationale.

### Diphthong Decisions

Unlike consonants (where 'sh', 'ch', 'ng' are nearly universal), [diphthong](https://en.wikipedia.org/wiki/Diphthong) spellings have competing conventions across languages.

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

**Why not 'ow' for /oʊ/?** It would make snow, throw, bowl, window identical to English. But `ow` is ambiguous in English: it represents both /oʊ/ (snow) and /aʊ/ (cow). New combinations like `bownz` (bones) read as "bowns" and `howm` (home) sounds like it rhymes with "cow". Nothing else in English reads as `oh`, so it's unambiguous.

**Why not 'eu' for /uː/?** It would gain words like feud, deuce, neutral. But `eu` in English implies a /j/ onset: "feud" is /fjuːd/, "neural" is /njʊɹəl/. So `meun` (moon) reads as "mew-n" (two syllables) and `teu` (too) reads as "tyoo". English `oo` already represents this sound (too, food, moon), so it's unambiguous.

### R-Colored Vowels

When certain vowels are followed by R, they combine into [r-colored sounds](https://en.wikipedia.org/wiki/R-colored_vowel). Without special handling, "star" (AA+R) would become "stor" (colliding with "store") and "beer" would become "bir" (colliding with "bird"). The R-rule gives each combination a dedicated spelling: ar, or, air, arr, eer, er. See [Phoneme Mapping](phoneme-mapping.md#r-colored-vowels) for the full table and collision analysis.

## Dialect and Precedent

Ingglish uses [General American English](https://en.wikipedia.org/wiki/General_American_English) via the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary). See [Dialect Assumptions](dialect-assumptions.md) for how this affects non-American speakers.

Every spelling has precedent in at least one major language — see [Orthography Comparison](orthography-comparison.md) for language-by-language detail.

## See Also

- [Spelling Iteration Log](spelling-iteration.md) - Complete history of spelling changes
- [Orthography Comparison](orthography-comparison.md) - How spellings compare to other languages
- [Phoneme Mapping](phoneme-mapping.md) - Technical mapping tables
- [Spelling Reform History](spelling-reform-comparison.md) - Why previous reforms failed
- [Identical Words Analysis](identical-words-analysis.md) - Analysis of words that stay unchanged
