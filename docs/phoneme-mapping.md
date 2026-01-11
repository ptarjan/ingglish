# ARPAbet to Ingglish/IPA Mapping

## Overview

This document describes how we map ARPAbet notation from the CMU Pronouncing Dictionary to Ingglish spellings and IPA (International Phonetic Alphabet).

**ARPAbet** is a phonetic notation system that uses ASCII characters to represent English phonemes (speech sounds). Each English word in the CMU dictionary has an ARPAbet transcription that we use as our canonical representation.

## Design Principles

1. **One sound, one spelling**: Each phoneme maps to exactly one spelling sequence
2. **No diacritics**: Only use the 26 standard English letters
3. **Intuitive for English readers**: Spellings should feel natural based on existing English conventions
4. **Consistent and reversible**: The mapping is deterministic

## Pronunciation Dictionary

We use the **CMU Pronouncing Dictionary** (cmudict):
- Contains ~134,000 English words
- Uses ARPAbet phoneme notation
- Includes stress markers (0=none, 1=primary, 2=secondary)
- Maintained by Carnegie Mellon University
- Available as npm package: `cmu-pronouncing-dictionary`

## Vowel Mappings

| ARPAbet | Ingglish | IPA | Example Words | Notes |
|---------|----------|-----|---------------|-------|
| AA | o | ɑ | f**a**ther, h**o**t, r**o**ck | Open back vowel |
| AE | a | æ | c**a**t, b**a**t | Near-open front vowel |
| AH | u | ʌ/ə | b**u**t, c**u**p | Mid central vowel (schwa when unstressed) |
| AO | aw | ɔ | th**ou**ght, l**aw** | Open-mid back rounded |
| AW | ow | aʊ | c**ow**, h**ow** | Diphthong |
| AY | ii | aɪ | m**y**, t**i**me | Diphthong |
| EH | e | ɛ | b**e**d, r**e**d | Open-mid front vowel |
| ER | er | ɝ/ɚ | b**ir**d, h**er** | Rhotacized mid central |
| EY | ay | eɪ | s**ay**, d**ay** | Diphthong |
| IH | i | ɪ | b**i**t, s**i**t | Near-close front vowel |
| IY | ee | i | b**ee**, s**ee** | Close front vowel |
| OW | oh | oʊ | g**o**, sh**ow** | Diphthong |
| OY | oi | ɔɪ | b**oy**, t**oy** | Diphthong |
| UH | uu | ʊ | b**oo**k, p**u**t | Near-close back vowel |
| UW | oo | u | t**oo**, bl**ue** | Close back vowel |

## Consonant Mappings

### Stops (Plosives)
| ARPAbet | Ingglish | IPA | Example Words |
|---------|----------|-----|---------------|
| B | b | b | **b**at, ca**b** |
| D | d | d | **d**og, be**d** |
| G | g | ɡ | **g**o, bi**g** |
| K | k | k | **c**at, ba**ck** |
| P | p | p | **p**at, cu**p** |
| T | t | t | **t**op, ca**t** |

### Fricatives
| ARPAbet | Ingglish | IPA | Example Words | Notes |
|---------|----------|-----|---------------|-------|
| DH | dh | ð | **th**e, fa**th**er | Voiced dental fricative |
| F | f | f | **f**at, lau**gh** | |
| S | s | s | **s**at, mi**ss** | |
| SH | sh | ʃ | **sh**e, pu**sh** | |
| TH | th | θ | **th**ink, ba**th** | Voiceless dental fricative |
| V | v | v | **v**an, lo**ve** | |
| Z | z | z | **z**oo, i**s** | |
| ZH | zh | ʒ | mea**s**ure, bei**ge** | |

### Affricates
| ARPAbet | Ingglish | IPA | Example Words |
|---------|----------|-----|---------------|
| CH | ch | tʃ | **ch**at, ba**tch** |
| JH | j | dʒ | **j**ust, e**dge** |

### Nasals
| ARPAbet | Ingglish | IPA | Example Words |
|---------|----------|-----|---------------|
| M | m | m | **m**an, co**m**e |
| N | n | n | **n**o, pe**n** |
| NG | ng | ŋ | si**ng**, thi**ng** |

### Liquids & Glides
| ARPAbet | Ingglish | IPA | Example Words |
|---------|----------|-----|---------------|
| L | l | l | **l**et, we**ll** |
| R | r | ɹ | **r**un, ca**r** |
| W | w | w | **w**et, a**w**ay |
| Y | y | j | **y**es, **y**ou |
| HH | h | h | **h**at, a**h**ead |

## R-Colored Vowels

When certain vowels are followed by R, they combine into special r-colored sounds. Ingglish uses intuitive spellings for these combinations:

| Phoneme Sequence | Ingglish | IPA | Example Words | Notes |
|------------------|----------|-----|---------------|-------|
| AA + R | ar | ɑɹ | st**ar**, c**ar**, f**ar** | Father vowel + R |
| AO + R | or | ɔɹ | st**ore**, m**ore**, f**or** | Thought vowel + R |
| EH + R | air | ɛɹ | **air**, c**are**, th**ere** | Bed vowel + R |
| AE + R | aar | æɹ | **arr**ow, b**arr**ow, c**arr**ot | Cat vowel + R |
| ER | er | ɝ | b**ir**d, h**er**, t**ur**n | Standalone r-colored vowel |

### Why This Matters

Without special handling, the vowel mappings would produce confusing results:
- "star" (AA + R) would become "stor" (o + r)
- "store" (AO + R) would become "stawr" (aw + r)
- "air" (EH + R) would become "er" (same as "her")
- "barrow" (AE + R) would become "baroh" (same as "borrow")

This is problematic because spellings would collide. The R-rule ensures:
- "star" → **star** (intuitive)
- "store" → **stor** (clearly different from "star")
- "air" → **air** (distinct from "her" → "her")
- "barrow" → **baaroh** (distinct from "borrow" → "baroh")

The rule applies only when the vowel is immediately followed by R in the phoneme sequence. Standalone AA, AO, EH, and AE vowels use their regular spellings (o, aw, e, a).

### Why Not Just Ignore R-Coloring?

We could simplify by always using the base vowel spelling (AA → 'o', AO → 'aw', etc.) regardless of whether R follows. But this creates confusing collisions:

| Without R-rules | Problem |
|-----------------|---------|
| star → stor | Looks like "store" |
| air → er | Same as "her" |
| barrow → baroh | Same as "borrow" |

English readers would misread "stor" as "store". The R-colored spellings (ar, or, air, aar) match how these sounds are conventionally written in English, making them immediately recognizable.

With these R-colored vowel rules in place, there are **zero collisions** between any vowel+R combinations in the dictionary.

## Key Design Decisions

### TH vs DH Distinction
Traditional English uses "th" for both sounds:
- Voiceless /θ/: "**th**ink", "ba**th**"
- Voiced /ð/: "**th**e", "**th**is"

We preserve this distinction with **"th"** and **"dh"** respectively. This creates clarity while remaining readable.

### Schwa Representation
The schwa (ə) is the most common vowel in unstressed syllables. In ARPAbet, it's typically AH0 (unstressed AH). We map this to **"u"**, which matches words like "but" and "cup" where the schwa sound appears.

### Double Letters for Long Vowels
- **ee** for IY (b**ee**) - distinguishes from short "i"
- **oo** for UW (t**oo**) - distinguishes from short "u"
- **uu** for UH (b**oo**k) - the "u" in "put"

### Diphthongs
Each diphthong gets a consistent spelling:
- **ii** = AY (m**y**) - /aɪ/
- **ay** = EY (s**ay**) - /eɪ/
- **ow** = AW (c**ow**) - /aʊ/
- **oh** = OW (g**o**) - /oʊ/
- **oi** = OY (b**oy**) - /ɔɪ/

## Example Translations

| English | Phonemes | Ingglish |
|---------|----------|---------|
| hello | HH AH0 L OW1 | huloh |
| world | W ER1 L D | werld |
| beautiful | B Y UW1 T AH0 F AH0 L | byootuful |
| think | TH IH1 NG K | thingk |
| the | DH AH0 | dhu |
| English | IH1 NG G L IH0 SH | Ingglish |

## Stress Handling

ARPAbet includes stress markers on vowels:
- **0** = no stress (unstressed)
- **1** = primary stress
- **2** = secondary stress

### Ingglish Output
We strip stress markers before mapping to Ingglish spellings. This simplifies the output while still producing phonetically accurate spellings.

### IPA Output
IPA output preserves stress information using standard IPA stress markers:
- **ˈ** (U+02C8) = primary stress
- **ˌ** (U+02CC) = secondary stress

Stress markers are placed at **syllable boundaries** following the Maximal Onset Principle. This means the marker appears before the onset consonants of the stressed syllable, not directly before the vowel.

**Example:** "hello" /həˈloʊ/
- The stress marker goes before "l" (the syllable onset), not before "oʊ"

**Example:** "examination" /ɪɡˌzæməˈneɪʃən/
- Secondary stress before "z" (onset of second syllable)
- Primary stress before "n" (onset of fourth syllable)

The system uses English phonotactics (valid onset clusters like /bl/, /str/, /skw/) to correctly place stress markers at syllable boundaries.

## Limitations

1. **Homophones**: Words that sound the same will have the same Ingglish spelling
   - "their", "there", "they're" → all become the same
2. **Accent neutrality**: CMU dictionary represents General American English
3. **Missing words**: Proper nouns, neologisms, and slang may not be in the dictionary

## See Also

- [Architecture](architecture.md) - How translation works end-to-end
- [Contributing](contributing.md) - How to add new phoneme mappings
