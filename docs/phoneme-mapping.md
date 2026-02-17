# ARPAbet to Ingglish/IPA Mapping

## Overview

How Ingglish maps ARPAbet notation from the CMU Pronouncing Dictionary to Ingglish spellings and IPA.

**ARPAbet** is a phonemic notation system that uses ASCII characters to represent English phonemes (contrastive speech sounds). Each English word in the CMU dictionary has an ARPAbet transcription.

For why we chose these spellings, see [Design Decisions](design-decisions.md).

## Pronunciation Dictionary

We use the **CMU Pronouncing Dictionary** (cmudict):
- Contains 135,166 entries (~126,000 unique words after excluding variant pronunciations)
- Uses ARPAbet phoneme notation
- Includes stress markers (0=none, 1=primary, 2=secondary)
- Maintained by Carnegie Mellon University
- Available as npm package: `cmu-pronouncing-dictionary`

## Vowel Mappings

| ARPAbet | Ingglish | IPA | Example Words | Notes |
|---------|----------|-----|---------------|-------|
| AA | o | ɑ | f**a**ther, h**o**t, r**o**ck | Open back vowel |
| AE | a | æ | c**a**t, b**a**t | Near-open front vowel |
| AH | u | ʌ/ə | b**u**t, c**u**p | Stressed /ʌ/ and unstressed /ə/; see [note](#schwa-and-strut) below |
| AO | aw | ɔ | th**ou**ght, l**aw** | Open-mid back rounded |
| AW | ou | aʊ | c**ow**, h**ow** | Diphthong |
| AY | ai | aɪ | m**y**, t**i**me | Diphthong |
| EH | e | ɛ | b**e**d, r**e**d | Open-mid front vowel |
| EY | ay | eɪ | s**ay**, d**ay** | Diphthong |
| IH | i | ɪ | b**i**t, s**i**t | Near-close front vowel |
| IY | ee | i | b**ee**, s**ee** | Close front vowel (also written /iː/) |
| OW | oh | oʊ | g**o**, sh**ow** | Diphthong |
| OY | oi | ɔɪ | b**oy**, t**oy** | Diphthong |
| UH | oo | ʊ | b**oo**k, p**u**t | Near-close back vowel |
| UW | uu | u | t**oo**, bl**ue** | Close back vowel (also written /uː/) |

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

When certain vowels are followed by R, they combine into special r-colored sounds. Ingglish uses dedicated spellings for these combinations:

| Phoneme Sequence | Ingglish | IPA | Example Words | Notes |
|------------------|----------|-----|---------------|-------|
| AE + R | arr | æɹ | **arr**ow, b**arr**ow, c**arr**ot | Cat vowel + R |
| EH + R | air | ɛɹ | **air**, c**are**, th**ere** | Bed vowel + R |
| IH + R | eer | ɪɹ | b**eer**, b**ear**d, f**ear** | [NEAR vowel](https://en.wikipedia.org/wiki/English_phonology#NEAR) (bit vowel + R) |
| AA + R | ar | ɑɹ | st**ar**, c**ar**, f**ar** | Father vowel + R |
| AO + R | or | ɔɹ | st**ore**, m**ore**, f**or** | Thought vowel + R |
| ER | er | ɝ | b**ir**d, h**er**, t**ur**n | Standalone r-colored vowel |

### Why This Matters

Without special handling, the vowel mappings would produce confusing results:
- "star" (AA + R) would become "stor" (o + r), which looks like "store"
- "store" (AO + R) would become "stawr" (aw + r)
- "fair" (EH + R) would become "fer" (collides with "fur" → "fer")
- "carry" (AE + R) would become "karee" (indistinct from 'ar' words once AA+R → ar is added)
- "beard" (IH + R) would become "bird" (looks like the animal)

The R-rule fixes this:
- "star" → **star** (intuitive)
- "store" → **stor** (clearly different from "star")
- "fair" → **fair** (distinct from "fur" → "fer")
- "carry" → **karree** (distinct from "car" → "kar")
- "beer" → **beer** (identical! without the rule it would be "bir")

The rule applies only when the vowel is immediately followed by R in the phoneme sequence. Standalone AA, AO, EH, AE, and IH vowels use their regular spellings (o, aw, e, a, i).

### Why Not Use R-Colored Spellings for All Vowels?

Why not use the R-colored vowel bases everywhere? If AA was always 'a', AO always 'o', EH always 'ai', and AE always 'ar', then R-coloring would happen automatically, no special rules needed.

The problem is readability. These spellings would make words look like different English words:
- "hot" → "hat" (looks like the head covering)
- "law" → "lo" (looks incomplete)
- "bed" → "baid" (looks like "bade" or "bayed")

The R-colored spellings (ar, or, air, arr) were chosen because they match English conventions *in the R context* - "star", "store", "air", "arrow" all look natural. But using their base vowels everywhere would create confusing false cognates.

With these R-colored vowel rules in place, there are zero collisions between any vowel+R combinations in the dictionary.

If Ingglish ever gets popular enough that this exception is the biggest complaint, we'd happily revisit it. The rule helps English readers today, but a future version could drop it for full consistency.

## Example Translations

| English | Phonemes | Ingglish |
|---------|----------|---------|
| hello | HH AH0 L OW1 | huloh |
| world | W ER1 L D | werld |
| beautiful | B Y UW1 T AH0 F AH0 L | byuutuful |
| think | TH IH1 NG K | thingk |
| the | DH AH0 | dhu |
| English | IH1 NG G L IH0 SH | Ingglish |

## Schwa and STRUT

The CMU dictionary uses a single phoneme AH for both stressed /ʌ/ (the STRUT vowel, as in "but" and "cup") and unstressed /ə/ (schwa, as in "about" and "sofa"). Ingglish follows this convention, mapping both to **'u'**.

This works because /ʌ/ and /ə/ are in [complementary distribution](https://en.wikipedia.org/wiki/Complementary_distribution) in English (/ʌ/ appears only in stressed syllables, /ə/ only in unstressed syllables), so they can be analyzed as allophones of a single phoneme. Many phonological analyses of English take this position (e.g., [Giegerich 1992](https://books.google.com/books/about/English_Phonology.html?id=ALJKvQWP8FAC), *English Phonology: An Introduction*). Some analyses do treat them as separate phonemes based on vowel quality differences; the CMU dictionary and Ingglish follow the single-phoneme analysis.

## Stress Handling

ARPAbet includes stress markers on vowels:
- **0** = no stress (unstressed)
- **1** = primary stress
- **2** = secondary stress

### Ingglish Output
We strip stress markers before mapping to Ingglish spellings. The output is simpler and still phonemically accurate.

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

The system uses English phonotactics (valid onset clusters like /bl/, /str/, /skw/) to place stress markers at the right syllable boundaries.

## Limitations

1. **Homophones**: Words that sound the same will have the same Ingglish spelling
   - "their", "there", "they're" → all become the same
   - See [Collision Analysis](collision-analysis.md) for a full breakdown of how this affects real words
2. **Digraph boundary ambiguity**: When two letters that form a digraph appear adjacent across a morpheme boundary, the spelling can be misread. For example, "hothouse" → "hothous" where 'th' represents /t/+/h/ (not /θ/), "mishap" → "mishap" where 'sh' is /s/+/h/ (not /ʃ/), and "engage" → "engayj" where 'ng' is /n/+/g/ (not /ŋ/). This is an inherent limitation of digraph-based orthographies; the same ambiguity exists in standard English (compare "hothouse" vs "nothing"). Cases where this matters are rare.
3. **Accent neutrality**: CMU dictionary represents General American English. This includes maintaining the [cot-caught distinction](https://en.wikipedia.org/wiki/Cot%E2%80%93caught_merger) (/ɑ/ vs /ɔ/) even though many American speakers merge these vowels. We preserve the distinction because the CMU dictionary does and because it serves speakers who maintain it.
4. **Allophonic detail not captured**: As a phonemic (not phonetic) system, Ingglish does not represent allophonic variation such as aspiration of stops (/pʰ/ in "pin" vs /p/ in "spin"), flapping of /t/ ([ɾ] in "butter"), or vowel nasalization. These are predictable from context and don't change word meanings.
5. **Missing words**: Proper nouns, neologisms, and slang may not be in the dictionary

## See Also

- [Design Decisions](design-decisions.md) - Why Ingglish works the way it does
- [Spelling Evolution](spelling-evolution.md) - History of spelling changes
- [Orthography Comparison](orthography-comparison.md) - How spellings compare to other languages
- [Architecture](architecture.md) - How translation works end-to-end
