# Orthography Comparison: Ingglish vs Other Languages

How do other languages represent the sounds we use in Ingglish? This document compares our spelling choices to common patterns across world languages.

## Design Philosophy

Ingglish follows the **phonemic principle**: one sound = one spelling. This aligns with languages like Finnish, Spanish, and Turkish, which have highly consistent orthographies. English, by contrast, has only [72% letter-to-sound consistency](https://en.wikipedia.org/wiki/English_orthography).

Our constraint of using only the 26 ASCII letters (no diacritics) limits some options but keeps the system accessible on any keyboard.

## Vowels

### Short Vowels

| Sound | IPA | Ingglish | Other Languages |
|-------|-----|----------|-----------------|
| cat | æ | **a** | Matches most languages using 'a' for open front vowel |
| bed | ɛ | **e** | Universal - nearly all Latin-script languages |
| bit | ɪ | **i** | Standard across Romance, Germanic languages |
| hot | ɑ | **o** | Spanish 'o', matches "father" vowel representation |
| but | ʌ | **u** | English convention; some languages use 'a' for this |

**Notes:**
- Our 'u' for /ʌ/ follows English spelling conventions ("but", "cup")
- Spanish and Italian would use 'a' for a similar sound
- We chose familiarity over cross-linguistic consistency here

### Long Vowels (Doubled Letters)

| Sound | IPA | Ingglish | Other Languages |
|-------|-----|----------|-----------------|
| bee | i | **ee** | Finnish: 'ii', Dutch: 'ie', German: 'ie' |
| too | u | **oo** | Finnish: 'uu', Dutch: 'oe', German: 'u' |
| book | ʊ | **uu** | Unusual - most languages don't distinguish /u/ from /ʊ/ |

**Notes:**
- [Finnish and Estonian](https://en.wikipedia.org/wiki/Finnish_orthography) use doubled vowels for length - our 'ee' and 'oo' follow this pattern
- German uses 'ie' for /iː/ (historically a diphthong that merged)
- Our 'uu' for /ʊ/ is unconventional but distinguishes "too" from "book"

### Diphthongs

| Sound | IPA | Ingglish | Other Languages |
|-------|-----|----------|-----------------|
| my, time | aɪ | **ie** | German: 'ei', Dutch: 'ij/ei', English: 'ie' (tie, pie) |
| say, day | eɪ | **ay** | Spanish: 'ey', German: 'ei' (different sound!) |
| go, show | oʊ | **oh** | Dutch: 'oo', German: 'o' |
| cow, out | aʊ | **ow** | German: 'au', Dutch: 'au/ou' |
| boy, toy | ɔɪ | **oi** | Universal - German 'eu/äu', Dutch 'ooi' |

**Notes:**
- [German 'ei'](https://en.wikipedia.org/wiki/German_orthography) represents /aɪ/, while 'ie' is /iː/
- [Dutch has spelling ambiguity](https://en.wikipedia.org/wiki/Dutch_orthography): 'ij' and 'ei' both represent /ɛi/
- Our 'ie' for /aɪ/ matches English words like "tie", "pie", "die", "lie"
- Our 'ow' matches English conventions ("cow", "now")

## Consonants

### The "SH" Sound (/ʃ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **sh** | ship → **ship** |
| English | sh | ship |
| [German](https://en.wikipedia.org/wiki/German_orthography) | sch | Schiff |
| [Polish](https://en.wikipedia.org/wiki/Sz_(digraph)) | sz | szkoła |
| Hungarian | s | só (salt) |
| Czech/Slovak | š | škola |
| Italian | sc (before e/i) | pesce |
| French | ch | chat |
| Turkish | ş | şeker |

**Notes:**
- We follow English convention with 'sh' - the most intuitive for English speakers
- German's 'sch' is longer; Polish 'sz' might confuse English readers
- Languages with diacritics (š, ş) achieve single-letter representation

### The "ZH" Sound (/ʒ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **zh** | measure → **mezher** |
| English | s, si, g | measure, vision, beige |
| French | j, g | je, rouge |
| Portuguese | j, g | hoje, gente |
| Polish | ż, rz | żaba, rzeka |
| Turkish | j | jeton |

**Notes:**
- English has no consistent spelling for /ʒ/ - we create one with 'zh'
- 'zh' parallels 'sh' (voiceless) vs 'zh' (voiced) - a logical pair
- Russian Romanization uses 'zh' for Ж, so this has precedent

### The "TH" Sounds (/θ/ and /ð/)

| Language | Voiceless /θ/ | Voiced /ð/ |
|----------|---------------|------------|
| **Ingglish** | **th** | **dh** |
| English | th | th (ambiguous!) |
| [Icelandic](https://en.wikipedia.org/wiki/Voiced_dental_fricative) | þ (thorn) | ð (eth) |
| [Greek](https://en.wikipedia.org/wiki/Voiceless_dental_fricative) | θ (theta) | δ (delta) |
| Welsh | th | dd |
| Spanish (Castilian) | c/z | — |
| Arabic | ث | ذ |

**Notes:**
- [Only ~4% of languages have dental fricatives](https://wals.info/chapter/19) - they're genuinely rare
- English's ambiguous 'th' for both sounds is unusual
- We use 'dh' to distinguish voiced /ð/ (the, this) from voiceless /θ/ (think, bath)
- [Welsh uses 'dd'](https://en.wikipedia.org/wiki/Th_(digraph)) for /ð/ - we considered this but 'dh' is more intuitive
- Icelandic preserves the original letters (þ, ð) from Old English

### The "NG" Sound (/ŋ/)

| Language | Spelling | Notes |
|----------|----------|-------|
| **Ingglish** | **ng** | sing → **sing** |
| English | ng, n (before k) | sing, think |
| German | ng | Ring |
| Spanish | n (before g/k) | tengo |
| Vietnamese | ng, ngh | ngày |

**Notes:**
- Nearly universal use of 'ng' for this sound
- We keep 'ng' - no innovation needed here

### Affricates

| Sound | IPA | Ingglish | Other Languages |
|-------|-----|----------|-----------------|
| chat | tʃ | **ch** | Universal: Spanish, Italian, English all use 'ch' |
| just | dʒ | **j** | Italian: 'g' (before e/i), Spanish: uses different sound |

**Notes:**
- 'ch' for /tʃ/ is nearly universal in Latin scripts
- 'j' for /dʒ/ matches English; Italian uses 'g' before front vowels

## R-Colored Vowels

This is distinctly American English - most languages don't have these:

| Sound | IPA | Ingglish | Notes |
|-------|-----|----------|-------|
| star | ɑɹ | **ar** | Intuitive English spelling |
| store | ɔɹ | **or** | Matches English conventions |
| air | ɛɹ | **air** | Matches English conventions |
| arrow | æɹ | **aar** | Distinguishes from 'ar' |
| bird | ɝ | **er** | Standard rhotic vowel |

**Notes:**
- These combinations are specific to rhotic English dialects
- Most other languages don't merge vowel + /r/ into single units
- Our spellings follow English intuitions ("star", "store", "air")

## Summary: Where Ingglish Aligns and Diverges

### Following Convention
- **sh** for /ʃ/ (English)
- **ch** for /tʃ/ (universal)
- **ng** for /ŋ/ (universal)
- **ee/oo** for long vowels (Finnish-style doubling)
- **ie** for /aɪ/ (English: tie, pie, die, lie)
- **oi** for /ɔɪ/ (universal)
- **ow** for /aʊ/ (English)

### Novel Choices
- **dh** for /ð/ - distinguishes from /θ/, inspired by linguistic notation
- **zh** for /ʒ/ - parallels sh/zh voicing pair, used in Romanization
- **uu** for /ʊ/ - distinguishes from /u/
- **oh** for /oʊ/ - avoids confusion with /aʊ/ ('ow')

### Trade-offs
- We prioritize **English reader familiarity** over cross-linguistic patterns
- We use **digraphs** rather than diacritics for ASCII compatibility

## References

- [Phonemic orthography - Wikipedia](https://en.wikipedia.org/wiki/Phonemic_orthography)
- [Finnish orthography - Wikipedia](https://en.wikipedia.org/wiki/Finnish_orthography)
- [German orthography - Wikipedia](https://en.wikipedia.org/wiki/German_orthography)
- [Dutch orthography - Wikipedia](https://en.wikipedia.org/wiki/Dutch_orthography)
- [Polish digraphs](https://en.wikipedia.org/wiki/Sz_(digraph))
- [Dental fricatives across languages](https://en.wikipedia.org/wiki/Voiceless_dental_fricative)
- [The TH digraph](https://en.wikipedia.org/wiki/Th_(digraph))
- [WALS: Uncommon Consonants](https://wals.info/chapter/19)
