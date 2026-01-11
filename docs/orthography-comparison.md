# Orthography Comparison: How Common Are Ingglish's Spelling Choices?

This document analyzes each Ingglish spelling choice and rates how widely it's used across world languages:

- **Universal**: Used by most languages with this sound
- **Common**: Used by multiple language families
- **Regional**: Used by a specific language family or region
- **Rare**: Used by few languages
- **Novel**: Invented for Ingglish or very uncommon

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

## Commonality Ratings Summary

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| sh | /ʃ/ | **Common** | English, Albanian, Somali, Pinyin, Cyrillic romanization |
| zh | /ʒ/ | **Common** | Cyrillic romanization (Ж→zh), Albanian; 350+ years in English dictionaries |
| th | /θ/ | **Regional** | Only ~4% of languages have this sound; English, Albanian, Welsh use 'th' |
| dh | /ð/ | **Rare** | Albanian (official letter), Cornish, Swahili; ~7% of languages have /ð/ |
| ch | /tʃ/ | **Universal** | Spanish, English, Czech, Portuguese, and most Latin-script languages |
| j | /dʒ/ | **Common** | English-influenced: Indonesian, Malay, Somali, Indian romanization |
| ng | /ŋ/ | **Universal** | Nearly all languages; Austronesian languages treat it as single letter |
| ee | /iː/ | **Common** | Finnish/Estonian doubling principle; Dutch 'ee' in open syllables |
| oo | /uː/ | **Common** | Finnish 'uu', Dutch 'oo'; consistent doubling pattern |
| uu | /ʊ/ | **Novel** | Ingglish innovation—most languages don't distinguish /uː/ from /ʊ/ |
| ie | /aɪ/ | **Common** | English "tie, pie, die, lie"; matches existing English pattern |
| ay | /eɪ/ | **Common** | English "say, day, play"; standard English spelling |
| ow | /aʊ/ | **Regional** | English convention; German/Dutch use 'au' more commonly |
| oh | /oʊ/ | **Rare** | Few precedents; needed to distinguish from 'ow' |
| oi | /ɔɪ/ | **Universal** | English, French, Dutch; standard across languages |

### Key Findings

1. **Most consonant choices are well-attested**: sh, ch, ng, j are Common or Universal
2. **'dh' for /ð/ has real precedent**: Albanian uses it as an official alphabet letter
3. **Doubled vowels follow Finnish/Estonian patterns**: ee, oo are principled choices
4. **'ie' for /aɪ/ matches English**: words like "tie", "pie", "die", "lie" already use this
5. **One genuinely novel spelling**: 'uu' for /ʊ/ (most languages don't need this distinction)
6. **'oh' for /oʊ/ is unusual** but necessary to distinguish from 'ow' (/aʊ/)

## Historical Context: English Spelling Reform

Ingglish isn't the first attempt at phonemic English spelling. Understanding this history shows why certain choices work better than others.

### Notable Reform Systems

| System | Year | Approach | Status |
|--------|------|----------|--------|
| Benjamin Franklin's Phonetic Alphabet | 1768 | New letters for sounds | Never adopted |
| Pitman's Initial Teaching Alphabet (ITA) | 1961 | 44 characters, used in schools | Declined by 1970s |
| Shavian Alphabet | 1962 | Entirely new script (40+ letters) | Niche use |
| SoundSpel | 1970s | ASCII-compatible reform | Limited adoption |
| Cut Spelling | 1992 | Remove redundant letters | Academic proposal |

### Why Previous Reforms Failed

1. **New characters**: Shavian, ITA, and Franklin's system required learning entirely new alphabets
2. **Printing costs**: Pre-digital systems couldn't easily add new characters
3. **Compatibility**: Couldn't be typed on standard keyboards
4. **Institutional resistance**: Publishers, educators, and governments rejected changes

### Where Ingglish Differs

- **No new characters**: Uses only the 26 ASCII letters
- **Familiar digraphs**: 'sh', 'ch', 'th' are already known to English readers
- **Keyboard compatible**: Works on any device without special input methods
- **Incremental exposure**: Chrome extension allows gradual familiarity

## Phonemic Orthography Success Stories

Several languages have successfully implemented or reformed their orthographies to be highly phonemic.

### Turkish (1928 Reform)

| Before | After |
|--------|-------|
| Arabic script | Latin alphabet with 29 letters |
| ~10% literacy | ~90% literacy by 1950s |
| Complex vowel harmony unmarked | Systematic: ö, ü, ı, ş, ç, ğ |

**Key insight**: Turkey's script reform dramatically improved literacy because the new orthography matched spoken Turkish. Children learn to read Turkish in a few months, compared to years for English.

### Finnish

Finnish is often cited as having the most transparent orthography in Europe:

- **99% phoneme-to-grapheme consistency**
- Double letters indicate length (aa, ee, oo) — same principle Ingglish uses
- Children achieve reading fluency by end of first grade
- Dyslexia rates are significantly lower than in English-speaking countries

### Korean Hangul (1443)

While not Latin-based, Hangul demonstrates phonemic design principles:

- Each letter represents exactly one phoneme
- Letters are grouped into syllable blocks
- Called "the most scientific writing system" by linguists
- Literacy can be achieved in days, not years

### Swahili

A successful African example using Latin script:

- Nearly 1:1 sound-to-letter correspondence
- 'ng'' represents /ŋ/ (similar to our 'ng')
- 'dh' represents /ð/ — same as Ingglish!
- 'sh' represents /ʃ/ — same as Ingglish
- High literacy rates across East Africa

## Phoneme Frequency: How Common Are These Sounds?

Not all phonemes are equally common across world languages. Data from [PHOIBLE](https://phoible.org/) (a database of 3,000+ language phoneme inventories):

### Consonants in Ingglish

| Sound | IPA | % of languages | Notes |
|-------|-----|----------------|-------|
| m | /m/ | 96% | Nearly universal |
| k | /k/ | 90% | Very common |
| n | /n/ | 88% | Very common |
| p | /p/ | 86% | Very common |
| t | /t/ | 85% | Very common |
| j (as in "yes") | /j/ | 84% | Very common |
| w | /w/ | 76% | Common |
| s | /s/ | 75% | Common |
| l | /l/ | 68% | Common |
| h | /h/ | 62% | Common |
| r | /r/ or /ɹ/ | 60% | Common (varies by type) |
| ŋ (ng) | /ŋ/ | 51% | About half of languages |
| ʃ (sh) | /ʃ/ | 45% | Less than half |
| tʃ (ch) | /tʃ/ | 44% | Less than half |
| dʒ (j) | /dʒ/ | 30% | Less common |
| ʒ (zh) | /ʒ/ | 20% | Uncommon |
| θ (th) | /θ/ | 4% | Rare |
| ð (dh) | /ð/ | 7% | Rare |

**Key insight**: English's dental fricatives (/θ/ and /ð/) are among the world's rarest consonants. Most spelling systems never need to represent them. This is why there's no "standard" Latin spelling — few languages have these sounds.

### Vowel Systems

Most languages have 5-7 vowel phonemes. English has 14-15 (depending on dialect), making it unusually complex:

| Vowels | % of languages | Examples |
|--------|----------------|----------|
| 5 vowels | 32% | Spanish, Japanese, Swahili |
| 6 vowels | 14% | Most common system |
| 7+ vowels | 29% | German, French |
| 10+ vowels | <5% | English, Danish |

This explains why English spelling is so difficult: we're mapping ~15 vowel sounds onto 5 vowel letters (a, e, i, o, u).

## Implications for Ingglish

### Our Choices Are Well-Supported

1. **Consonant digraphs** (sh, ch, zh, th, dh, ng): Standard approach when single letters aren't available
2. **Vowel doubling** (ee, oo): Finnish/Estonian pattern, principled and consistent
3. **Diphthong spellings** (ie, ay, ow, oi, oh): Follow existing English patterns where possible

### Our Challenges Are Inherent to English

1. **Too many vowels**: English's 14-15 vowels require creative solutions with only 5 letters
2. **Rare consonants**: /θ/ and /ð/ have no standard Latin spelling because most languages don't have them
3. **R-colored vowels**: Unique to rhotic English dialects; no cross-linguistic precedent

### What Makes Ingglish Practical

Unlike historical reforms, Ingglish:
- Requires no new characters (unlike Shavian, ITA)
- Works on any keyboard (unlike diacritic-heavy systems)
- Uses familiar patterns (sh, ch from English; ee, oo from Finnish)
- Can be learned gradually through exposure (via browser extension)

## References

- [Phonemic orthography - Wikipedia](https://en.wikipedia.org/wiki/Phonemic_orthography)
- [Sh (digraph) - Wikipedia](https://en.wikipedia.org/wiki/Sh_(digraph))
- [Ch (digraph) - Wikipedia](https://en.wikipedia.org/wiki/Ch_(digraph))
- [Voiced dental fricative - Wikipedia](https://en.wikipedia.org/wiki/Voiced_dental_fricative)
- [Voiced velar nasal - Wikipedia](https://en.wikipedia.org/wiki/Voiced_velar_nasal)
- [Zhe (Cyrillic) - Wikipedia](https://en.wikipedia.org/wiki/Zhe_(Cyrillic))
- [J - Wikipedia](https://en.wikipedia.org/wiki/J)
- [Finnish orthography - Wikipedia](https://en.wikipedia.org/wiki/Finnish_orthography)
- [German orthography - Wikipedia](https://en.wikipedia.org/wiki/German_orthography)
- [Dutch orthography - Wikipedia](https://en.wikipedia.org/wiki/Dutch_orthography)
- [WALS: Uncommon Consonants](https://wals.info/chapter/19)
- [PHOIBLE - Phoneme Inventory Database](https://phoible.org/)
- [Turkish alphabet - Wikipedia](https://en.wikipedia.org/wiki/Turkish_alphabet)
- [Korean Hangul - Wikipedia](https://en.wikipedia.org/wiki/Hangul)
- [Swahili orthography - Wikipedia](https://en.wikipedia.org/wiki/Swahili_language#Orthography)
- [English spelling reform - Wikipedia](https://en.wikipedia.org/wiki/English-language_spelling_reform)
