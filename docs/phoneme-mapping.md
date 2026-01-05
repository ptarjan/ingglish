# Phoneme to Inglish Spelling Mapping

## Overview

This document describes how we map ARPAbet phonemes from the CMU Pronouncing Dictionary to consistent English spellings.

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

| Phoneme | Inglish | Example Words | Notes |
|---------|---------|---------------|-------|
| AA | ah | f**a**ther, h**o**t | Open back vowel |
| AE | a | c**a**t, b**a**t | Near-open front vowel |
| AH | u | b**u**t, c**u**p | Mid central vowel (schwa-like) |
| AO | aw | th**ou**ght, l**aw** | Open-mid back rounded |
| AW | ow | c**ow**, h**ow** | Diphthong /aʊ/ |
| AY | ai | m**y**, t**i**me | Diphthong /aɪ/ |
| EH | e | b**e**d, r**e**d | Open-mid front vowel |
| ER | er | b**ir**d, h**er** | Rhotacized mid central |
| EY | ay | s**ay**, d**ay** | Diphthong /eɪ/ |
| IH | i | b**i**t, s**i**t | Near-close front vowel |
| IY | ee | b**ee**, s**ee** | Close front vowel |
| OW | oh | g**o**, sh**ow** | Diphthong /oʊ/ |
| OY | oi | b**oy**, t**oy** | Diphthong /ɔɪ/ |
| UH | uu | b**oo**k, p**u**t | Near-close back vowel |
| UW | oo | t**oo**, bl**ue** | Close back vowel |

## Consonant Mappings

### Stops (Plosives)
| Phoneme | Inglish | Example Words |
|---------|---------|---------------|
| B | b | **b**at, ca**b** |
| D | d | **d**og, be**d** |
| G | g | **g**o, bi**g** |
| K | k | **c**at, ba**ck** |
| P | p | **p**at, cu**p** |
| T | t | **t**op, ca**t** |

### Fricatives
| Phoneme | Inglish | Example Words | Notes |
|---------|---------|---------------|-------|
| DH | dh | **th**e, fa**th**er | Voiced dental fricative |
| F | f | **f**at, lau**gh** | |
| S | s | **s**at, mi**ss** | |
| SH | sh | **sh**e, pu**sh** | |
| TH | th | **th**ink, ba**th** | Voiceless dental fricative |
| V | v | **v**an, lo**ve** | |
| Z | z | **z**oo, i**s** | |
| ZH | zh | mea**s**ure, bei**ge** | |

### Affricates
| Phoneme | Inglish | Example Words |
|---------|---------|---------------|
| CH | ch | **ch**at, ba**tch** |
| JH | j | **j**ust, e**dge** |

### Nasals
| Phoneme | Inglish | Example Words |
|---------|---------|---------------|
| M | m | **m**an, co**m**e |
| N | n | **n**o, pe**n** |
| NG | ng | si**ng**, thi**ng** |

### Liquids & Glides
| Phoneme | Inglish | Example Words |
|---------|---------|---------------|
| L | l | **l**et, we**ll** |
| R | r | **r**un, ca**r** |
| W | w | **w**et, a**w**ay |
| Y | y | **y**es, **y**ou |
| HH | h | **h**at, a**h**ead |

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
Each diphthong gets a two-letter combination:
- **ai** = AY (m**y**) - /aɪ/
- **ay** = EY (s**ay**) - /eɪ/
- **ow** = AW (c**ow**) - /aʊ/
- **oh** = OW (g**o**) - /oʊ/
- **oi** = OY (b**oy**) - /ɔɪ/

## Example Translations

| English | Phonemes | Inglish |
|---------|----------|---------|
| hello | HH AH0 L OW1 | huloh |
| world | W ER1 L D | werld |
| beautiful | B Y UW1 T AH0 F AH0 L | byootufuhl |
| think | TH IH1 NG K | thingk |
| the | DH AH0 | dhu |
| English | IH1 NG G L IH0 SH | ingglihs |

## Stress Handling

ARPAbet includes stress markers on vowels:
- **0** = no stress
- **1** = primary stress
- **2** = secondary stress

We strip these markers before mapping. This simplifies the output while still producing phonetically accurate spellings. Future versions might optionally indicate stress.

## Limitations

1. **Homophones**: Words that sound the same will have the same Inglish spelling
   - "their", "there", "they're" → all become the same
2. **Accent neutrality**: CMU dictionary represents General American English
3. **Missing words**: Proper nouns, neologisms, and slang may not be in the dictionary
