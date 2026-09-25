# Design Decisions: Why Ingglish Spells Things This Way

Why each spelling was chosen, and what we tried that didn't work.

## Motivation

My 5-year-old is learning to read, and I keep having to say "sorry, that letter is silent" or "no, those letters make a different sound in this word." The letters "ough" alone have at least six pronunciations: though (/oʊ/), through (/uː/), rough (/ʌf/), cough (/ɔf/), thought (/ɔː/), bough (/aʊ/). Every learner of English, child or adult, pays this cost.

I wanted spelling where you can look at any word and know how to say it. Not a new alphabet and not a political campaign: just consistent spelling that you can type on any keyboard and convert back to standard English whenever you need to.

## Sample Text: The North Wind and the Sun

The standard passage for comparing writing systems, in English and in Ingglish.

**English:**

> The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take off his cloak should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler wrap his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.

**Ingglish:**

> Dha North Wind and dha Suhn wer dispyooting wich woz dha strawnger, wen a travaler kaym alawng rapt in a worm klohk. Dhay agreed dhat dha wuhn hoo ferst sakseedid in mayking dha travaler tayk awf hiz klohk shud bee kansiderd strawnger dhan dha uhdher. Dhen dha North Wind bloo az hard az hee kud, buht dha mor hee bloo dha mor klohslee did dha travaler rap hiz klohk eround him; and at last dha North Wind gayv uhp dha atempt. Dhen dha Suhn shohn out wormlee, and imeedeeatlee dha travaler tuk awf hiz klohk. And soh dha North Wind woz ablaijd too kanfes dhat dha Suhn woz dha strawnger uhv dha too.

Many words stay identical: "North", "Wind", "and", "in", "a", "agreed", "hard", "him", "at", "last", "out". The biggest visual changes are "the" → "dha" (voiced "th" is spelled "dh") and vowels spelled by sound, as in "klohk" (cloak) and "strawnger" (stronger).

## Core Principles

1. **One sound, one spelling**: Each [phoneme](https://en.wikipedia.org/wiki/Phoneme) (a distinct speech sound) has exactly one spelling, and almost every spelling stands for exactly one sound. The main exception is "a", which spells both the vowel in "cat" and unstressed schwa; see [Orthographic Transparency](orthographic-transparency.md#reading-ambiguities) for the full list. The other exception is [R-colored vowels](phoneme-mapping.md#r-colored-vowels): some vowels blend with a following R into a single sound, and these combinations get their own spellings, such as "air" and "ar". See the phoneme mapping for details.
2. **No new characters**: Only standard Latin letters. There is no 'q' (write 'kw') and no 'x' (write 'ks'), and 'c' appears only in 'ch'. Other "c" sounds are written 'k' or 's'.
3. **Familiar to English readers**: Spellings follow conventions English readers already know.
4. **Consistent and reversible**: English to Ingglish always gives the same result. Ingglish back to English uses word frequency to pick the most likely word when several sound alike.
5. **Voluntary**: Ingglish sits alongside English. It is not trying to replace it.

## Why English Is Hard

1. **Too many vowel sounds**: English has 14–15 vowel phonemes but only 5 vowel letters (a, e, i, o, u). Spanish has 5 of each, so it has no such problem. We cover the gap with doubled letters (ee, oo) and letter pairs (ai, ay, ou, uh). (The vowel count is from [Ladefoged & Johnson 2014](https://books.google.com/books?id=FjIVAgAAQBAJ), *A Course in Phonetics*, for General American English. The exact count varies by analysis and dialect.)

2. **Rare consonants**: Only ~4% of languages have /θ/ (the "th" in "think") and ~7% have /ð/ (the "th" in "this") ([PHOIBLE 2.0](https://phoible.org/); [Maddieson 2013, WALS Chapter 19](https://wals.info/chapter/19) reports ~8% for dental fricatives broadly). Because most languages never needed to write these sounds, there is no standard way to spell them.

3. **R-colored vowels**: Vowels blended with R, as in "bird" and "car", are rare among the world's languages. We use the spellings English readers already expect (er, ar).

## What Makes Ingglish Different

Earlier spelling reforms failed because they:
- Required learning an entirely new alphabet ([Shavian](https://en.wikipedia.org/wiki/Shavian_alphabet), [Deseret](https://en.wikipedia.org/wiki/Deseret_alphabet))
- Had to be "un-taught" later ([Initial Teaching Alphabet](https://en.wikipedia.org/wiki/Initial_Teaching_Alphabet))
- Tried to impose change through political authority ([Roosevelt](https://en.wikipedia.org/wiki/Simplified_Spelling_Board), [Carnegie](https://en.wikipedia.org/wiki/Simplified_Spelling_Board))

Ingglish avoids each of these:

| Design Choice | Why It Matters |
|--------------|----------------|
| Standard ASCII letters | No new characters to learn |
| Familiar letter pairs (sh, ch, th, ng) | You already know them |
| Logical extensions (zh is to sh as z is to s) | New patterns are easy to guess |
| Two-way conversion | Convert any text instantly, in either direction |
| Not replacing English | No political mandate needed |

## Specific Spelling Decisions

### Consonant [Digraphs](https://en.wikipedia.org/wiki/Digraph_(orthography))

A digraph is two letters that spell one sound, like "sh".

**TH vs DH**

English uses "th" for two different sounds:
- Voiceless [/θ/](https://en.wikipedia.org/wiki/Voiceless_dental_fricative): "**th**ink", "ba**th**"
- Voiced [/ð/](https://en.wikipedia.org/wiki/Voiced_dental_fricative): "**th**e", "**th**is"

Ingglish spells the voiceless sound **"th"** and the voiced one **"dh"**. [Albanian](https://en.wikipedia.org/wiki/Albanian_alphabet) already uses 'dh' officially.

**ZH for [/ʒ/](https://en.wikipedia.org/wiki/Voiced_postalveolar_fricative)**

English hides this sound in "measure", "vision" and "beige". Ingglish gives it its own spelling, "zh": zh is to sh as z is to s.

### Vowel Spellings

**Doubled Vowels**

| Spelling | Sound | Rationale |
|----------|-------|-----------|
| ee | /iː/ (bee) | [Finnish](https://en.wikipedia.org/wiki/Finnish_orthography)/[Estonian](https://en.wikipedia.org/wiki/Estonian_orthography) pattern for long vowels |
| oo | /uː/ (too) | Matches English "too", "food", "moon", "cool" |
| uh | /ʌ/ (but) | English interjection "uh"; leaves 'u' free for /ʊ/ (the vowel in "book") |

**Schwa**

Schwa (ə) is the weak, unstressed vowel at the start of "about". Ingglish spells unstressed schwa **"a"** and the stressed /ʌ/ of "but" **"uh"**. This keeps "a", "about", "again", "along", "away" and "around" spelled as in English. See [Phoneme Mapping](phoneme-mapping.md#schwa-and-strut) for details and the [Spelling Iteration Log](spelling-iteration.md#about-sofa-u-a) for the full reasoning.

### Diphthong Decisions

A [diphthong](https://en.wikipedia.org/wiki/Diphthong) is a vowel that glides from one sound to another, like the "i" in "my". Consonant spellings like 'sh', 'ch' and 'ng' are nearly universal, but languages disagree on how to spell diphthongs.

| Sound | Spelling | Why This Choice |
|-------|----------|-----------------|
| /aɪ/ (my) | **ai** | Matches the IPA symbol; used in [Pinyin](https://en.wikipedia.org/wiki/Pinyin), Italian, Vietnamese |
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

**Why not 'ow' for /oʊ/?** It would keep snow, throw, bowl and window identical to English. But English `ow` has two sounds: /oʊ/ (snow) and /aʊ/ (cow). New spellings like `bownz` (bones) would read as "bowns", and `howm` (home) would seem to rhyme with "cow". Nothing in English reads `oh` any other way.

**Why not 'eu' for /uː/?** It would keep feud, deuce and neutral identical to English. But English `eu` implies a "y" sound before the vowel: "feud" is /fjuːd/, "neural" is /njʊɹəl/. So `meun` (moon) would read as "mew-n" (two syllables) and `teu` (too) as "tyoo". English already uses `oo` for this sound (too, food, moon), and `oo` has no such problem.

### R-Colored Vowels

When some vowels come before R, the two blend into one [r-colored sound](https://en.wikipedia.org/wiki/R-colored_vowel). Spelled vowel by vowel, "star" (the "father" vowel plus R; AA+R in CMU dictionary notation) would become "stor" (the same as "store") and "beer" would become "bir" (the same as "bird"). So each combination gets its own spelling: ar, or, air, arr, eer, er. See [Phoneme Mapping](phoneme-mapping.md#r-colored-vowels) for the full table and the clashes each spelling avoids.

## Dialect and Precedent

Ingglish follows [General American English](https://en.wikipedia.org/wiki/General_American_English) pronunciation, taken from the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary). See [Dialect Assumptions](dialect-assumptions.md) for what this means for speakers of other accents.

Every spelling is already used in at least one major language. See [Orthography Comparison](orthography-comparison.md) for the language-by-language detail.
