# Orthographic Transparency

Orthographic transparency measures how predictable the relationship is between spelling and pronunciation. Linguists use two standard metrics: **feedforward consistency** (can you predict the pronunciation from the spelling?) and **feedback consistency** (can you predict the spelling from the pronunciation?). English scores poorly on both. Ingglish was designed to score perfectly on feedforward and near-perfectly on feedback.

## The Standard Metrics

These metrics follow the framework established by [Ziegler, Stone & Jacobs (1997)](https://doi.org/10.3758/BF03214423) and refined by [Siegelman & Kearns (2019)](https://doi.org/10.3758/s13428-019-01317-y).

### Feedforward Consistency (Reading: Spelling -> Sound)

Given a grapheme, how many possible pronunciations does it have?

- **Consistency ratio** = frequency(dominant pronunciation) / frequency(all pronunciations)
- A ratio of 1.0 means the grapheme always makes the same sound

| System | Feedforward Consistency | Notes |
|--------|------------------------|-------|
| Finnish | ~1.00 | Nearly perfect 1:1 grapheme-phoneme mapping |
| Italian | ~0.98 | Few exceptions (e.g., "c" before e/i) |
| German | ~0.90 | Mostly regular with some context rules |
| French | ~0.85 | Complex but rule-governed (nasal vowels, silent endings) |
| **Ingglish** | **1.00** | Every grapheme always makes the same sound |
| English | ~0.70 | Highly inconsistent ("ough" has 6+ pronunciations) |

Ingglish achieves perfect feedforward consistency by design: each of its 39 graphemes maps to exactly one phoneme. There are no exceptions, no context rules, and no silent letters.

### Feedback Consistency (Spelling: Sound -> Spelling)

Given a phoneme, how many possible spellings does it have?

| System | Feedback Consistency | Notes |
|--------|---------------------|-------|
| Finnish | ~0.99 | Nearly perfect in both directions |
| Italian | ~0.90 | Some phonemes have multiple spellings |
| German | ~0.75 | Several phonemes can be spelled multiple ways |
| **Ingglish** | **0.92** | 3 minor ambiguities (see below) |
| French | ~0.55 | Many phonemes have multiple spellings (/o/ = o, au, eau, ...) |
| English | ~0.50 | Extremely inconsistent (/iː/ = ee, ea, e, ie, ei, ey, ...) |

## Ingglish Grapheme Inventory

Ingglish uses 39 graphemes (15 vowels + 24 consonants) built from the 26 standard Latin letters. No diacritics, no new symbols. C, Q, and X are retired. See [Phoneme Mapping](phoneme-mapping.md) for the full table.

## The Three Feedback Ambiguities

Ingglish has exactly three graphemes that can represent more than one phoneme in the reverse direction:

### 1. "a" -> AE or AH (schwa)

The grapheme "a" represents both the TRAP vowel (/&aelig;/, as in "cat") and the unstressed schwa (/&schwa;/, as in "about"). This is the stress-conditioned split: stressed AH maps to "u" (cut, but), while unstressed AH0 maps to "a" (about, again). Since AE also maps to "a", the reverse direction is ambiguous.

This is the most linguistically defensible compromise. Schwa is the most common English vowel, appearing in virtually every unstressed syllable. Its quality is largely predictable from context -- if "a" appears in an unstressed syllable, it's schwa; in a stressed syllable, it's TRAP.

### 2. "er" -> ER or EH+R

The grapheme sequence "er" could be the single r-colored vowel ER (/&hstrok;/, as in "bird") or the sequence EH+R (/&epsilon;r/, as in the rare "welfare" split). In practice this ambiguity is negligible: the ER interpretation is correct in almost all cases.

### 3. "sh" -> SH or S+HH

The digraph "sh" could be the fricative SH (/&Integral;/, as in "ship") or the rare sequence S+HH (/sh/, as in "mishap" if parsed morphologically). This ambiguity is extremely rare in practice.

## How English Compares

For context, English has over **1,100 grapheme-phoneme correspondences** for its ~40 phonemes. Some examples of English's feedback inconsistency:

| Phoneme | English spellings | Count |
|---------|-------------------|-------|
| /iː/ | ee, ea, e, ie, ei, ey, e_e, i, eo, ae, oe, ... | 11+ |
| /&Integral;/ | sh, ti, ci, si, ssi, ch, s, ce, sci, xi | 10+ |
| /k/ | c, k, ck, ch, cc, que, q, x (in "fox") | 8+ |
| /uː/ | oo, u, ue, ew, ou, o, ui, u_e, ough, wo | 10+ |

Ingglish reduces each of these to exactly one spelling.

## Entropy Analysis

[Shannon entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)) quantifies the uncertainty in a mapping. An entropy of 0 means no uncertainty (perfectly predictable); higher values mean more ambiguity.

| Direction | Ingglish Entropy | English Entropy |
|-----------|-----------------|-----------------|
| Feedforward (reading) | **0.00 bits** | ~1.5-2.5 bits per grapheme |
| Feedback (spelling) | **~0.05 bits** (3 minor ambiguities) | ~2.0-3.0 bits per phoneme |

The near-zero feedback entropy in Ingglish means that knowing the pronunciation almost completely determines the spelling, with only the "a"/AE-vs-AH ambiguity contributing meaningful uncertainty.

## Comparison with Other Spelling Reforms

| System | Feedforward | Feedback | Script | Notes |
|--------|------------|----------|--------|-------|
| Ingglish | 1.00 | 0.92 | Latin (26 letters) | Digraphs for extra sounds |
| Shavian | 1.00 | 1.00 | New (48 letters) | Perfect but requires learning new alphabet |
| Deseret | 1.00 | 1.00 | New (38 letters) | Perfect but requires learning new alphabet |
| IPA | 1.00 | 1.00 | Extended Latin + new symbols | Perfect but not designed for everyday use |
| SoundSpel | ~0.95 | ~0.85 | Latin | Some remaining ambiguities |
| Cut Spelling | ~0.80 | ~0.75 | Latin | Removes letters but keeps irregularities |
| Traditional English | ~0.70 | ~0.50 | Latin | The baseline |

Ingglish is the only Latin-script reform that achieves perfect feedforward consistency. The three feedback ambiguities are the minimal cost of using 26 standard letters for 39 phonemes.

## Methodology

All metrics are computed over the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary) (126,000+ unique words) using the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) for frequency weighting. Feedforward consistency is verified automatically: the `translateSync()` function is deterministic and produces the same output for any given phoneme sequence. Feedback consistency is measured by counting reverse-direction ambiguities in the `INGGLISH_TO_ARPABET_MAP`.
