# Orthographic Transparency

Orthographic transparency is how predictably a writing system's spelling matches its pronunciation. Linguists measure it two ways: **feedforward consistency** (can you tell how a word sounds from its spelling?) and **feedback consistency** (can you tell how a word is spelled from its sound?). English scores poorly on both. Ingglish is fully consistent in the feedback direction by construction, and nearly consistent in the feedforward direction.

Below, a *grapheme* is a letter or letter group that spells one sound (like "sh"), and a *phoneme* is one distinct speech sound. Capitalised codes like AH, ER and SH are the CMU Pronouncing Dictionary's ARPAbet names for phonemes: a trailing digit marks stress (AH0 is an unstressed AH), and "+" means one sound followed by another.

## The Standard Metrics

These metrics follow the method set out by [Ziegler, Stone & Jacobs (1997)](https://doi.org/10.3758/BF03214423) and refined by [Siegelman & Kearns (2019)](https://doi.org/10.3758/s13428-019-01317-y).

### Feedforward Consistency (Reading: Spelling -> Sound)

How many ways can a given grapheme be pronounced?

- **Consistency ratio** = how often the grapheme has its most common pronunciation ÷ how often it appears at all
- A ratio of 1.0 means the grapheme always makes the same sound

| System | Feedforward Consistency | Notes |
|--------|------------------------|-------|
| Finnish | ~1.00 | Nearly perfect 1:1 grapheme-phoneme mapping |
| Italian | ~0.98 | Few exceptions (e.g., "c" before e/i) |
| German | ~0.90 | Mostly regular with some context rules |
| French | ~0.85 | Complex but rule-governed (nasal vowels, silent endings) |
| **Ingglish** | **just under 1.00** | A handful of reading ambiguities (see below); not yet measured |
| English | ~0.70 | Highly inconsistent ("ough" has 6+ pronunciations) |

Ingglish comes close in this direction but is not perfect. It has no silent letters, and almost every grapheme stands for one phoneme, but a few spellings can be read two ways (see [Reading Ambiguities](#reading-ambiguities) below).

### Feedback Consistency (Spelling: Sound -> Spelling)

How many ways can a given phoneme be spelled?

| System | Feedback Consistency | Notes |
|--------|---------------------|-------|
| Finnish | ~0.99 | Nearly perfect in both directions |
| Italian | ~0.90 | Some phonemes have multiple spellings |
| German | ~0.75 | Several phonemes can be spelled multiple ways |
| **Ingglish** | **1.00** | One spelling per sound, by construction |
| French | ~0.55 | Many phonemes have multiple spellings (/o/ = o, au, eau, ...) |
| English | ~0.50 | Extremely inconsistent (/iː/ = ee, ea, e, ie, ei, ey, ...) |

## Ingglish Grapheme Inventory

Ingglish has 39 graphemes (15 vowels and 24 consonants), plus spellings for the R-colored vowels such as "ar" and "air". They use 24 of the 26 standard Latin letters, with no accent marks and no new symbols: Q and X never appear, and C appears only in "ch". See [Phoneme Mapping](phoneme-mapping.md) for the full table.

In the sound-to-spelling direction this is complete: the translator turns each sequence of phonemes into exactly one spelling. The CMU dictionary's AH counts as two sounds here, because Ingglish spells stressed AH (the vowel in "but") "uh" and unstressed AH0 (schwa) "a".

## Reading Ambiguities

A few Ingglish spellings can stand for more than one sound, so reading them back from spelling to sound can go two ways. The translator's reverse parser lists each one and tries both readings.

### 1. "a": the vowel in "cat" or schwa

The letter "a" stands for both the vowel in "cat" (/æ/, AE in the CMU dictionary's notation) and schwa, the weak unstressed vowel in "about" (/ə/, AH0). This is the only ambiguity that comes up often.

It is also the easiest compromise to defend. Schwa is the most common English vowel and appears in almost every unstressed syllable, and which sound "a" makes is largely predictable: in an unstressed syllable it is schwa; in a stressed syllable it is the "cat" vowel.

### 2. Consonant + "h" across a word part

"sh", "th", "dh" and "zh" each spell one sound, but the same letters also appear where a word part ending in s, t, d or z meets one starting with h: "mishap" → **mishap** (S+HH), "hothouse" → **hothous** (T+HH), "adhere" → **adheer** (D+HH), "clotheshorse" → **klohzhors** (Z+HH). These are rare.

### 3. "air" and "eer" before R

"air" is both the vowel of "chair" (EH+R) and of "admire" → **admair** (AY+R). "eer" covers both IH+R ("beer") and IY+R ("here"); the CMU dictionary is inconsistent between these two, and most American speakers say them the same.

### 4. "aw" at a vowel junction

"aw" is the vowel in "law", but it also appears where schwa meets a W: "usual" → **yoozhawal**.

## How English Compares

For comparison, English has over **1,100 grapheme-phoneme correspondences** (ways a letter group can spell a sound) for its ~40 phonemes. Some sounds with many spellings:

| Phoneme | English spellings | Count |
|---------|-------------------|-------|
| /iː/ | ee, ea, e, ie, ei, ey, e_e, i, eo, ae, oe, ... | 11+ |
| /ʃ/ | sh, ti, ci, si, ssi, ch, s, ce, sci, xi | 10+ |
| /k/ | c, k, ck, ch, cc, que, q, x (in "fox") | 8+ |
| /uː/ | oo, u, ue, ew, ou, o, ui, u_e, ough, wo | 10+ |

Ingglish reduces each of these to exactly one spelling.

## Entropy Analysis

[Shannon entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)) measures uncertainty in bits. An entropy of 0 means no uncertainty: the answer is fully predictable. Higher values mean more ambiguity.

| Direction | Ingglish Entropy | English Entropy |
|-----------|-----------------|-----------------|
| Feedforward (reading) | **near 0** (a few reading ambiguities; not yet measured) | ~1.5-2.5 bits per grapheme |
| Feedback (spelling) | **0 bits** (one spelling per sound) | ~2.0-3.0 bits per phoneme |

Knowing how a word sounds fixes its Ingglish spelling completely. Reading is nearly as certain: only the "a" ambiguity (AE vs AH0) comes up often enough to add real uncertainty.

## Comparison with Other Spelling Reforms

| System | Feedforward | Feedback | Script | Notes |
|--------|------------|----------|--------|-------|
| Ingglish | just under 1.00 | 1.00 | Latin (24 of 26 letters) | Digraphs for extra sounds |
| Shavian | 1.00 | 1.00 | New (48 letters) | Perfect but requires learning new alphabet |
| Deseret | 1.00 | 1.00 | New (38 letters) | Perfect but requires learning new alphabet |
| IPA | 1.00 | 1.00 | Extended Latin + new symbols | Perfect but not designed for everyday use |
| SoundSpel | ~0.95 | ~0.85 | Latin | Some remaining ambiguities |
| Cut Spelling | ~0.80 | ~0.75 | Latin | Removes letters but keeps irregularities |
| Traditional English | ~0.70 | ~0.50 | Latin | The baseline |

Among these, only the new-alphabet systems and IPA are fully consistent in both directions. Ingglish's few reading ambiguities are the price of spelling every English sound with ordinary keyboard letters.

## Methodology

Ingglish's feedback consistency follows from how the translator works: it builds each spelling from the word's [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary) phonemes, so the same sequence of phonemes always gives the same spelling. The reading ambiguities above are the ones the translator's reverse parser has to try both ways. Ingglish's feedforward consistency ratio has not yet been computed; a proper figure would count these ambiguities across the CMU dictionary, weighted by how common each word is in the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) of American film and TV subtitles.
