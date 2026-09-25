# ARPAbet to Ingglish/IPA Mapping

## Overview

This page shows how each sound in the CMU Pronouncing Dictionary is spelled in Ingglish, alongside its IPA symbol.

The dictionary writes pronunciations in **ARPAbet**, a notation that spells each English phoneme (a sound that can tell two words apart) with plain ASCII letters. Every word in the dictionary has an ARPAbet transcription. **IPA** is the International Phonetic Alphabet, the standard symbols linguists use for speech sounds.

For why we chose these spellings, see [Design Decisions](design-decisions.md).

## Pronunciation Dictionary

We use the **CMU Pronouncing Dictionary** (cmudict):
- About 126,000 entries (where a word has several pronunciations, one is chosen at build time)
- Written in ARPAbet
- Marks stress on each vowel (0=none, 1=primary, 2=secondary)
- Maintained by Carnegie Mellon University
- Available as the npm package `cmu-pronouncing-dictionary`

## Vowel Mappings

| ARPAbet | Ingglish | IPA | Example Words | Notes |
|---------|----------|-----|---------------|-------|
| AA | o | ɑ | f**a**ther, h**o**t, r**o**ck | Open back vowel |
| AE | a | æ | c**a**t, b**a**t | Near-open front vowel |
| AH | uh/a | ʌ/ə | b**u**t, c**u**p / **a**bout, sof**a** | Stressed /ʌ/ → 'uh'; unstressed /ə/ (AH0) → 'a'; see [note](#schwa-and-strut) below |
| AO | aw | ɔ | th**ou**ght, l**aw** | Open-mid back rounded |
| AW | ou | aʊ | c**ow**, h**ow** | Diphthong |
| AY | ai | aɪ | m**y**, t**i**me | Diphthong |
| EH | e | ɛ | b**e**d, r**e**d | Open-mid front vowel |
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

Some vowels change sound when followed by R; these are called r-colored vowels. Ingglish gives these combinations their own spellings:

| Phoneme Sequence | Ingglish | IPA | Example Words | Notes |
|------------------|----------|-----|---------------|-------|
| AE + R | arr | æɹ | **arr**ow, b**arr**ow, c**arr**ot | Cat vowel + R |
| EH + R | air | ɛɹ | **air**, c**are**, th**ere** | Bed vowel + R |
| IH + R | eer | ɪɹ | b**eer**, b**ear**d, f**ear** | [NEAR vowel](https://en.wikipedia.org/wiki/English_phonology#NEAR) (bit vowel + R) |
| AA + R | ar | ɑɹ | st**ar**, c**ar**, f**ar** | Father vowel + R |
| AO + R | or | ɔɹ | st**ore**, m**ore**, f**or** | Thought vowel + R |
| ER | er | ɝ | b**ir**d, h**er**, t**ur**n | Standalone r-colored vowel |

### Why This Matters

Without these spellings, the plain vowel mappings would give confusing results:
- "star" (AA + R) would become "stor" (o + r), which looks like "store"
- "store" (AO + R) would become "stawr" (aw + r)
- "fair" (EH + R) would become "fer", the same spelling as "fur"
- "carry" (AE + R) would become "karee", which reads as "car" + "ee" once AA + R is spelled 'ar'
- "beard" (IH + R) would become "bird" (looks like the animal)

With the R rule:
- "star" → **star** (intuitive)
- "store" → **stor** (clearly different from "star")
- "fair" → **fair** (distinct from "fur" → "fer")
- "carry" → **karree** (distinct from "car" → "kar")
- "beer" → **beer** (identical! without the rule it would be "bir")

The rule applies only when R comes right after the vowel in the pronunciation. Otherwise AA, AO, EH, AE, and IH keep their regular spellings (o, aw, e, a, i).

### Why Not Use R-Colored Spellings for All Vowels?

Why not use the vowel from each R spelling everywhere? If AA were always 'a', AO always 'o', EH always 'ai', and AE always 'ar', the R spellings would fall out naturally with no special rule.

The problem is readability. Those spellings would turn words into different English words:
- "hot" → "hat" (looks like the head covering)
- "law" → "lo" (looks incomplete)
- "bed" → "baid" (looks like "bade" or "bayed")

The R spellings (ar, or, air, arr) were chosen because they match normal English spelling *before an R*: "star", "store", "air", "arrow" all look natural. Using their vowels everywhere would produce misleading look-alikes.

With these R rules, no two vowel+R combinations in the dictionary share a spelling.

If Ingglish ever becomes popular enough that this exception is the main complaint, we'd gladly revisit it. The rule helps English readers today, but a future version could drop it for full consistency.

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

The split is safe because the two sounds never compete: /ʌ/ occurs only in stressed syllables and /ə/ only in unstressed ones (linguists call this [complementary distribution](https://en.wikipedia.org/wiki/Complementary_distribution)). Many analyses treat them as two forms of a single phoneme (e.g., [Giegerich 1992](https://books.google.com/books/about/English_Phonology.html?id=ALJKvQWP8FAC), *English Phonology: An Introduction*).

Using 'a' for schwa keeps the normal spelling of very common words: "a", "and", "about", "away", "important", "hospital", "normal", "signal". See the [Spelling Iteration Log](spelling-iteration.md#about-sofa-u-a) for the full reasoning.

## Stress Handling

ARPAbet marks stress on each vowel:
- **0** = no stress (unstressed)
- **1** = primary stress
- **2** = secondary stress

### Ingglish Output
Ingglish spellings carry no stress marks, and stress changes the spelling of only one vowel: unstressed AH0 becomes 'a', while stressed AH1/AH2 become 'uh'. Before R, AH is 'uh' at any stress ("curry" → "kuhree"), so it never collides with the 'ar' of AA+R (see [Schwa and STRUT](#schwa-and-strut)). Every other phoneme is spelled the same at any stress level.

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
   - "their", "there", "they're" → all become the same
   - See [False Friends Analysis](false-friends.md) for a full breakdown of how this affects real words
2. **Letter pairs across word parts**: A letter pair such as 'th' normally spells one sound. When its two letters meet across the boundary between two parts of a word, the spelling can be misread. For example, "hothouse" → "hothous" where 'th' represents /t/+/h/ (not /θ/), "mishap" → "mishap" where 'sh' is /s/+/h/ (not /ʃ/), and "engage" → "engayj" where 'ng' is /n/+/g/ (not /ŋ/). Any spelling system that uses letter pairs has this problem; standard English has it too (compare "hothouse" and "nothing"). It rarely matters in practice.
3. **One accent**: The CMU dictionary follows General American English. That includes keeping "cot" and "caught" distinct (/ɑ/ vs /ɔ/; see the [cot-caught merger](https://en.wikipedia.org/wiki/Cot%E2%80%93caught_merger)), even though many Americans pronounce them the same. We keep the distinction because the CMU dictionary does, and because it serves speakers who make it.
4. **Fine sound detail not captured**: Ingglish spells phonemes, not every shade of how they are pronounced. It ignores variations such as the puff of air after /p/ in "pin" (/pʰ/) but not in "spin" (/p/), the quick tap that /t/ turns into in "butter" ([ɾ]), or vowels picking up a nasal sound. These are predictable from context and never change a word's meaning.
5. **Missing words**: Names, new words, and slang may not be in the dictionary