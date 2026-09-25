# English Phoneme Chart

## Overview

This chart lists every sound in the CMU Pronouncing Dictionary with its ARPAbet code, its IPA symbol, its Ingglish spelling and example words. It is a reference page. The reasons behind each spelling are in [Vowels, Sound by Sound](vowel-spellings.md) and [Consonants, Sound by Sound](consonant-spellings.md), and the design as a whole is in [How Ingglish Was Designed](design-decisions.md).

The dictionary writes pronunciations in **ARPAbet**, a notation that spells each English phoneme (a sound that can tell two words apart) with plain ASCII letters. **IPA** is the International Phonetic Alphabet, the standard symbols linguists use for speech sounds; an IPA symbol between slashes, like /ʌ/, names a phoneme.

## Pronunciation Dictionary

Ingglish uses the **CMU Pronouncing Dictionary** (cmudict), maintained by Carnegie Mellon University:

- 126,051 entries, downloaded from [cmusphinx/cmudict](https://github.com/cmusphinx/cmudict) when the dictionary is built
- Where a word has several pronunciations, the build keeps the first one listed, which is not always the one the design intends (see [Limitations](#limitations), item 3)
- Written in ARPAbet, with 39 phonemes: 15 vowels and 24 consonants
- Marks stress with a digit after each vowel: AH0 is unstressed, AH1 has primary stress, AH2 secondary
- Follows General American pronunciation (see [Which Accent](dialect-assumptions.md))

## Vowel Mappings

| ARPAbet | Ingglish | IPA | Example Words | Notes |
|---------|----------|-----|---------------|-------|
| AA | o | ɑ | f**a**ther, h**o**t, r**o**ck | Open back vowel |
| AE | a | æ | c**a**t, b**a**t | Near-open front vowel |
| AH | uh/a | ʌ/ə | b**u**t, c**u**p / **a**bout, sof**a** | Stressed /ʌ/ → 'uh'; unstressed /ə/ (AH0) → 'a'; see [Schwa and STRUT](#schwa-and-strut) |
| AO | aw | ɔ | th**ou**ght, l**aw** | Open-mid back rounded |
| AW | ou | aʊ | c**ow**, h**ow** | Diphthong |
| AY | ai | aɪ | m**y**, t**i**me | Diphthong |
| EH | e | ɛ | b**e**d, r**e**d | Open-mid front vowel |
| ER | er | ɝ | b**ir**d, h**er**, t**ur**n | R-colored vowel; see [R-Colored Vowels](#r-colored-vowels) |
| EY | ay | eɪ | s**ay**, d**ay** | Diphthong |
| IH | i | ɪ | b**i**t, s**i**t | Near-close front vowel |
| IY | ee | i | b**ee**, s**ee** | Close front vowel (also written /iː/) |
| OW | oh | oʊ | g**o**, sh**ow** | Diphthong |
| OY | oi | ɔɪ | b**oy**, t**oy** | Diphthong |
| UH | u | ʊ | b**oo**k, p**u**t | Near-close back vowel |
| UW | oo | u | t**oo**, bl**ue** | Close back vowel (also written /uː/) |

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

### Glottal
| ARPAbet | Ingglish | IPA | Example Words |
|---------|----------|-----|---------------|
| HH | h | h | **h**at, a**h**ead |

### Liquids & Glides
| ARPAbet | Ingglish | IPA | Example Words |
|---------|----------|-----|---------------|
| L | l | l | **l**et, we**ll** |
| R | r | ɹ | **r**un, ca**r** |
| W | w | w | **w**et, a**w**ay |
| Y | y | j | **y**es, **y**ou |

## R-Colored Vowels

A vowel followed by R takes a special spelling. ER, the vowel in "bird", is a single ARPAbet phoneme; each of the other seven rows is a vowel followed by a separate R.

| Phoneme Sequence | Ingglish | IPA | Example Words | Notes |
|------------------|----------|-----|---------------|-------|
| AA + R | ar | ɑɹ | st**ar**, c**ar**, f**ar** | Father vowel + R |
| AO + R | or | ɔɹ | st**ore**, m**ore**, f**or** | Thought vowel + R |
| EH + R | air | ɛɹ | **air**, c**are**, th**ere** | Bed vowel + R |
| AE + R | arr | æɹ | **arr**ow, b**arr**ow, c**arr**ot | Cat vowel + R |
| IH + R | eer | ɪɹ | b**eer**, b**ear**d, f**ear** | [NEAR vowel](https://en.wikipedia.org/wiki/English_phonology#NEAR) (bit vowel + R) |
| UH + R | ur | ʊɹ | t**our**, c**ure**, p**ure** | Book vowel + R (tour → tur) |
| AH + R | uhr | ʌɹ | c**urr**y, h**urr**ay, **Ar**abia | But vowel + R, stressed or not (curry → kuhree) |
| ER | er | ɝ | b**ir**d, h**er**, t**ur**n | Standalone r-colored vowel |

The rule applies only when R comes right after the vowel in the pronunciation. Anywhere else, AA, AO, EH, AE, IH, UH and AH keep their regular spellings (o, aw, e, a, i, u, and uh or a). Why each R spelling exists, and the collisions it prevents, is in [R-Colored Vowels](vowel-spellings.md#r-colored-vowels).

## Example Translations

| English | Phonemes | Ingglish |
|---------|----------|---------|
| hello | HH AH0 L OW1 | haloh |
| world | W ER1 L D | werld |
| beautiful | B Y UW1 T AH0 F AH0 L | byootafal |
| think | TH IH1 NG K | thingk |
| the | DH AH0 | dha |
| English | IH1 NG G L IH0 SH | Ingglish |

## Schwa and STRUT

The CMU dictionary uses one phoneme, AH, for both stressed /ʌ/ (the STRUT vowel, as in "but" and "cup") and unstressed /ə/ (schwa, as in "about" and "sofa"). Ingglish splits them by stress:

- **AH1/AH2** (stressed /ʌ/) → **'uh'**: but, cup, run, son
- **AH0** (unstressed /ə/) → **'a'**: about, sofa, the, and

Before R, AH is 'uh' at any stress (see the table above). Why the split is safe and why schwa gets 'a' is in [Schwa and STRUT](vowel-spellings.md#schwa-and-strut).

## Stress Handling

ARPAbet marks stress on each vowel:
- **0** = no stress (unstressed)
- **1** = primary stress
- **2** = secondary stress

### Ingglish Output
Ingglish spellings carry no stress marks, and stress changes the spelling of only one vowel: unstressed AH0 becomes 'a', while stressed AH1/AH2 become 'uh'. Before R, AH is 'uh' at any stress ("curry" → "kuhree"), so it never collides with the 'ar' of AA+R. Every other phoneme is spelled the same at any stress level.

### IPA Output
IPA output keeps stress, using the standard IPA stress marks:
- **ˈ** (U+02C8) = primary stress
- **ˌ** (U+02CC) = secondary stress

Stress marks go at **syllable boundaries**, following the Maximal Onset Principle, which assigns consonants between two vowels to the later syllable wherever English allows it. So the mark comes before the consonants that start the stressed syllable (its onset), not directly before the vowel.

**Example:** "hello" /həˈloʊ/
- The stress marker goes before "l" (the syllable onset), not before "oʊ"

**Example:** "examination" /ɪɡˌzæməˈneɪʃən/
- Secondary stress before "z" (onset of second syllable)
- Primary stress before "n" (onset of fourth syllable)

To find those boundaries, the system uses the consonant clusters English allows at the start of a syllable (such as /bl/, /str/, /skw/).

## Limitations

1. **Homophones**: Words that sound the same are spelled the same in Ingglish
   - "their", "there", "they're" all become "dhair"
   - See [Homophones & False Friends](false-friends.md) for how this affects real words
2. **Letter pairs across word parts**: A letter pair such as 'th' normally spells one sound. Where its two letters meet across the boundary between two parts of a word, it can be misread: "courthouse" → "korthous", where 'th' is /t/+/h/ (not /θ/), and "mishap" → "mishap", where the spelling doesn't change but 'sh' is /s/+/h/ (not the /ʃ/ of "ship"). Standard English has the same problem (compare "hothouse" and "nothing"). It rarely matters in practice; [Reading Ambiguities](orthographic-transparency.md#reading-ambiguities) lists every case. The pair 'ng' never has this problem. No word in the dictionary has the /n/ of "no" right before a /g/: where an n comes before a g, as in "finger", it is the /ŋ/ of "sing". See [NG](consonant-spellings.md#ng).
3. **One accent**: The CMU dictionary follows General American English. It mostly keeps the vowels of "cot" and "caught" distinct (/ɑ/ vs /ɔ/), even though many Americans pronounce them the same. But for a few words, "caught" and "bought" among them, the first pronunciation listed uses /ɑ/, so those come out as "kot" and "bot". See [Which Accent](dialect-assumptions.md) for this and the other accent choices.
4. **Fine sound detail not captured**: Ingglish spells phonemes, not every shade of how they are pronounced. It ignores variations such as the puff of air after /p/ in "pin" (/pʰ/) but not in "spin" (/p/), the quick tap that /t/ turns into in "butter" ([ɾ]), or vowels picking up a nasal sound. These are predictable from context and never change a word's meaning.
5. **Missing words**: Names, new words, and slang may not be in the dictionary. The translator then guesses the pronunciation from the English spelling, and the guess can be wrong.
