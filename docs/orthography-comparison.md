# Orthography Comparison

This document shows how Ingglish spellings compare to other languages. Every choice has precedent in at least one major language.

For the design philosophy and rationale, see [Design Decisions](design-decisions.md).

## Diphthongs

### 'IE' Diphthong (/aɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ai** | mai |
| English | ie, i, y | tie, pie, my |
| [German](https://en.wikipedia.org/wiki/Ei_(digraph)) | ei | mein (my) |
| [Dutch](https://en.wikipedia.org/wiki/Dutch_orthography) | ij, ei | mij (me), klein (small) |
| Italian | ai | mai (never) |
| Pinyin | ai | bái (white) |
| Vietnamese | ai | hai (two) |

**Notes:**
- Pinyin (1.4B speakers), Italian, Vietnamese all use 'ai' for this sound
- German 'ei' is /aɪ/, but their 'ie' is /iː/—confusing for learners
- English 'ai' words (rain, paint) use /eɪ/, so 'ai' is available for /aɪ/

### 'AY' Diphthong (/eɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ay** | sey |
| English | ay, ai, a-e | say, rain, make |
| Spanish | ey | rey (king) |
| [Portuguese](https://en.wikipedia.org/wiki/Portuguese_orthography) | ei | lei (law) |
| Pinyin | ei | bēi (cup) |
| Indonesian | e | sate (satay) |

**Notes:**
- Matches English: "say", "day", "play", "way"
- Many languages don't have this exact diphthong
- Clear and unambiguous

### 'OH' Diphthong (/oʊ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **oh** | goh |
| English | o, oa, ow | go, boat, show |
| Dutch | oo | boot (boat) |
| German | o | boot (boat) |
| Pinyin | ou | dōu (all) |
| Japanese (Romaji) | o, ō | ohayō (good morning) |

**Notes:**
- 'o' alone is used for /ɑ/ (hot), so we need a digraph for /oʊ/
- 'oh' matches English interjection "oh!" which has this exact sound
- Many languages (Spanish, Swahili, Turkish) have pure /o/ without the glide

### 'OU' Diphthong (/aʊ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ou** | kou |
| English | ow, ou | cow, out |
| German | au | haus (house) |
| Dutch | au, ou | blauw (blue), oud (old) |
| Pinyin | ao | hǎo (good) |
| Portuguese | au | mau (bad) |

**Notes:**
- Some words become identical: "out" → "out", "loud" → "loud", "sound" → "sound"
- Dutch also uses 'ou' for this sound (oud = old), giving us international precedent
- German/Portuguese use 'au'; Pinyin uses 'ao'
- Trade-off: "cow" → "kou" looks less familiar, but identical spellings for common words like "out" and "loud" outweigh this
- See [Identical Words Analysis](identical-words-analysis.md) for detailed statistics on unchanged words

### 'OI' Diphthong (/ɔɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **oi** | boi |
| English | oi, oy | oil, boy |
| French | oi | roi (king) |
| Dutch | ooi | mooi (beautiful) |
| German | eu, äu | neu (new), häuser (houses) |
| Indonesian | oi | — rare, mostly in loanwords |
| Vietnamese | oi | nói (speak) |

**Notes:**
- Very common diphthong spelling worldwide: 'oi' or 'oy'
- German is the outlier using 'eu'
- No innovation needed

## Vowels

### Short 'A' Sound (/æ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **a** | kat |
| [English](https://en.wikipedia.org/wiki/English_orthography) | a | cat, hat |
| [Spanish](https://en.wikipedia.org/wiki/Spanish_orthography) | a | gato — closer to /a/ |
| [Italian](https://en.wikipedia.org/wiki/Italian_orthography) | a | gatto (cat) |
| [German](https://en.wikipedia.org/wiki/German_orthography) | ä | männer (men) |
| [Swahili](https://en.wikipedia.org/wiki/Swahili_language#Orthography) | a | baba (father) |
| [Turkish](https://en.wikipedia.org/wiki/Turkish_alphabet) | a | at (horse) |
| [Indonesian](https://en.wikipedia.org/wiki/Indonesian_language#Writing_system) | a | sama (same) |

**Notes:**
- Nearly universal to use 'a' for open vowels across all language families
- English /æ/ is more front than most languages' /a/, but 'a' is still the intuitive choice

### Short 'E' Sound (/ɛ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **e** | bed |
| English | e | bed, pet |
| Spanish | e | este (this) |
| Italian | e | bello (beautiful) |
| Swahili | e | embe (mango) |
| Turkish | e | ev (house) |
| [Vietnamese](https://en.wikipedia.org/wiki/Vietnamese_alphabet) | e | xe (vehicle) |
| [Pinyin](https://en.wikipedia.org/wiki/Pinyin) | e | hē (drink) |

**Notes:**
- Virtually universal across Latin-script languages worldwide
- No innovation needed here

### Short 'I' Sound (/ɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **i** | bit |
| English | i | bit, sit |
| Spanish | i | si (yes) |
| Italian | i | sì (yes) |
| Swahili | i | nini (what) |
| Turkish | i | bir (one) |
| Indonesian | i | ini (this) |
| [Polish](https://en.wikipedia.org/wiki/Polish_orthography) | i | mi (me) |

**Notes:**
- Standard across virtually all Latin-script languages globally
- English /ɪ/ is slightly different from Continental /i/, but 'i' works for both

### Short 'O' Sound (/ɑ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **o** | hot |
| English | o | hot, cot |
| Spanish | o | poco (little) |
| Italian | o | otto (eight) |
| Swahili | o | moto (fire) |
| Turkish | o | on (ten) |
| Indonesian | o | bodoh (stupid) |
| Pinyin | o | bō (wave) |

**Notes:**
- Nearly universal use of 'o' for back vowels worldwide
- American English "hot" uses /ɑ/, similar to many languages' open 'o'

### Short 'U' Sound (/ʌ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **u** | but |
| English | u | but, cup |
| Swahili | u | juu (up) |
| Turkish | u | uzun (long) |
| Indonesian | u | untuk (for) |
| Vietnamese | ư | mưa (rain) — different sound |

**Notes:**
- The English /ʌ/ sound is relatively rare across languages
- Most languages use 'u' for /u/ (as in "too"), not /ʌ/
- We follow English convention ("but", "cup") for familiarity
- Turkish has a distinct /ɯ/ sound written as 'ı' (dotless i)

### 'AW' Sound (/ɔ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **aw** | law, thawt |
| English | aw, au, ough, a | law, caught, thought, all |
| [Swedish/Norwegian/Danish](https://en.wikipedia.org/wiki/%C3%85) | å | båt (boat), på (on) |
| [French](https://en.wikipedia.org/wiki/French_orthography) | o | porte (door), bonne (good) |
| [Catalan](https://en.wikipedia.org/wiki/Catalan_orthography) | ò | sòc (clog), pòsit (deposit) |
| [Polish](https://en.wikipedia.org/wiki/Polish_orthography) | o | kot (cat), dom (house) |
| German | o | Sonne (sun), offen (open) |
| [Yoruba](https://en.wikipedia.org/wiki/Yoruba_alphabet) | ọ | ọjọ (day) |

**Notes:**
- English has wildly inconsistent spellings for this sound: "law", "caught", "thought", "all"
- Ingglish uses 'aw' consistently—matches English "law", "saw", "raw"
- Scandinavian languages use the dedicated letter **å** for this sound
- Catalan distinguishes open ò /ɔ/ from close ó /o/ with accent marks
- Many African languages use **Ɔ** or **ọ** (open O or O with dot below)
- We reserve plain 'o' for /ɑ/ (father, hot) to avoid collision

### Long 'EE' Sound (/iː/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ee** | bee |
| English | ee, ea, ie | bee, sea, piece |
| [Finnish](https://en.wikipedia.org/wiki/Finnish_orthography#Vowel_length) | ii | siitä (from it) |
| [Estonian](https://en.wikipedia.org/wiki/Estonian_orthography#Length) | ii | liiga (too much) |
| Indonesian | i | bisa (can) — no length distinction |
| Swahili | i | sisi (we) — no length distinction |
| Japanese ([Romaji](https://en.wikipedia.org/wiki/Romanization_of_Japanese)) | ii, ī | ojiisan (grandfather) |

**Notes:**
- Finnish/Estonian use doubled vowels for length—we follow this principle
- Many languages (Swahili, Indonesian, Turkish) don't distinguish vowel length
- 'ee' already exists in English ("bee", "see", "tree")
- Consistent pattern: double the letter to lengthen the sound

### Short 'OO' Sound (/ʊ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **oo** | book |
| English | oo, u | book, put |
| German | u | futter (fodder) |
| Most languages (Spanish, Italian, Swahili, Turkish) | u, uu | — same as /uː/ |

**Notes:**
- 'oo' matches English words like "book", "good", "look"
- English distinguishes "too" /uː/ from "book" /ʊ/—we preserve this with uu vs. oo
- Most languages worldwide (Swahili, Turkish, Indonesian, Spanish, etc.) don't have this distinction
- German distinguishes long/short u but uses the same letter

### Long 'OO' Sound (/uː/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **uu** | tuu |
| English | oo, ou, ew | too, you, new |
| Finnish | uu | suuri (big) |
| Estonian | uu | kuul (ball) |
| Indonesian | u | buku (book) |
| Swahili | u | kuku (chicken) |
| Japanese (Romaji) | uu, ū | sūpu (soup) |
| Pinyin | u | wū (house) |

**Notes:**
- Follows Finnish/Estonian convention: 'uu' for /uː/
- Most non-European languages don't distinguish vowel length
- The longer sound gets the longer spelling (uu vs oo)

## Consonants

### "SH" Sound (/ʃ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **sh** | ship |
| English | sh | ship |
| [German](https://en.wikipedia.org/wiki/Sch_(trigraph)) | sch | schiff (ship) |
| [Polish](https://en.wikipedia.org/wiki/Sz_(digraph)) | sz | szkoła (school) |
| [Hungarian](https://en.wikipedia.org/wiki/Hungarian_orthography) | s | só (salt) |
| [Czech](https://en.wikipedia.org/wiki/Czech_orthography)/[Slovak](https://en.wikipedia.org/wiki/Slovak_orthography) | š | škola (school) |
| Italian | sc (before e/i) | pesce (fish) |
| [French](https://en.wikipedia.org/wiki/French_orthography) | ch | chat (cat) |
| Turkish | ş | şeker (sugar) |

**Notes:**
- We follow English convention with 'sh' - the most intuitive for English speakers
- German's 'sch' is longer; Polish 'sz' might confuse English readers
- Languages with diacritics (š, ş) achieve single-letter representation

### "ZH" Sound (/ʒ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **zh** | mezher |
| English | s, si, g | measure, vision, beige |
| French | j, g | je (I), rouge (red) |
| Portuguese | j, g | hoje (today), gente (people) |
| Polish | ż, rz | żaba (frog), rzeka (river) |
| Turkish | j | jeton (token) |

**Notes:**
- English has no consistent spelling for /ʒ/ - we create one with 'zh'
- 'zh' parallels 'sh' (voiceless) vs 'zh' (voiced) - a logical pair
- Russian Romanization uses 'zh' for Ж, so this has precedent

### "TH" Sound (/θ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **th** | think |
| English | th | think, bath |
| [Icelandic](https://en.wikipedia.org/wiki/Icelandic_orthography) | þ (thorn) | þakka (thank) |
| [Welsh](https://en.wikipedia.org/wiki/Welsh_orthography) | th | athro (teacher) |
| Spanish (Castilian) | c/z | cero (zero), zapato (shoe) |

**Notes:**
- [Only ~4% of languages have dental fricatives](https://wals.info/chapter/19) — they're genuinely rare
- English uses 'th' ambiguously for both voiceless /θ/ and voiced /ð/
- We keep 'th' for voiceless /θ/ — the intuitive choice

### "DH" Sound (/ð/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **dh** | dhu (the) |
| English | th (ambiguous!) | the, this, father |
| [Icelandic](https://en.wikipedia.org/wiki/Icelandic_orthography) | ð (eth) | faðir (father) |
| [Welsh](https://en.wikipedia.org/wiki/Welsh_orthography) | dd | tad (father) |

**Notes:**
- We use 'dh' to distinguish voiced /ð/ from voiceless /θ/
- [Welsh uses 'dd'](https://en.wikipedia.org/wiki/Th_(digraph)) for /ð/ — we considered this but 'dh' is more intuitive
- Icelandic preserves the original Old English letter ð (eth)

### "NG" Sound (/ŋ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ng** | sing |
| English | ng, n (before k) | sing, think |
| German | ng | ring (ring) |
| Spanish | n (before g/k) | tengo (I have) |
| Vietnamese | ng, ngh | ngày (day) |

**Notes:**
- Nearly universal use of 'ng' for this sound
- We keep 'ng' - no innovation needed here

### "CH" Sound (/tʃ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ch** | chat |
| English | ch | chat, church |
| Spanish | ch | chico (boy) |
| Italian | c (before e/i) | ciao (hello) |
| German | tsch | deutsch (German) |
| Portuguese | ch | chave (key) |

**Notes:**
- 'ch' for /tʃ/ is nearly universal in Latin scripts
- One of the most consistent spellings across languages

### "J" Sound (/dʒ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **j** | just |
| English | j, g (before e/i) | just, gem |
| Italian | g (before e/i) | giorno (day) |
| Turkish | c | cam (glass) |
| Indonesian | j | jalan (road) |

**Notes:**
- 'j' for /dʒ/ matches English convention
- Italian uses 'g' before front vowels; Turkish uses 'c'

## R-Colored Vowels

[R-colored vowels](https://en.wikipedia.org/wiki/R-colored_vowel) (also called rhotic vowels) occur in less than 1% of world languages—but two of those are English and Mandarin Chinese, making them important despite their rarity. They're one of the trickiest parts of English phonology because the vowel and /r/ merge into a single sound.

### 'AR' Sound (/ɑɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ar** | star, kar, far |
| English | ar | star, car, far |

**Notes:**
- Perfectly intuitive—matches English spelling exactly
- "star" → "star" is identical in Ingglish

### 'OR' Sound (/ɔɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **or** | stor, mor, for |
| English | ore, or, our, oar | store, more, four, oar |

**Notes:**
- English has multiple spellings: "store", "more", "four", "oar"
- Ingglish uses 'or' consistently
- Clearly distinct from 'ar' (star vs stor)

### 'AIR' Sound (/ɛɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **air** | air, kair, dhair |
| English | air, are, ear, ere | air, care, bear, there |

**Notes:**
- English has wildly inconsistent spellings: "air", "care", "bear", "there", "their"
- Ingglish uses 'air' consistently—matches the word "air" itself
- This spelling fixed 204 collisions (air vs her would both be "er" otherwise)

### 'ARR' Sound (/æɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **arr** | arroh, karrut, barrul |
| English | arr, ar | arrow, carrot, barrel |

**Notes:**
- The doubled 'rr' distinguishes this from 'ar' (star)
- Matches English spelling pattern in "arrow", "carrot", "barrel"
- Without this distinction: "arrow" and "are" would collide

### 'ER' Sound (/ɝ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **er** | berd, her, tern |
| English | ir, er, ur, ear, or | bird, her, turn, earth, work |
| [Mandarin Chinese](https://en.wikipedia.org/wiki/Erhua) | er | 二 èr (two), 儿 ér (son) |

**Notes:**
- English uses five different spellings for the same sound
- Ingglish uses 'er' consistently—the most common English spelling
- Mandarin is one of few languages with r-colored vowels (called [erhua](https://en.wikipedia.org/wiki/Erhua) 儿化)
- R-colored vowels occur in less than 1% of world languages

## Summary: Where Ingglish Aligns and Diverges

### Following Convention
- **sh** for /ʃ/ (English)
- **ch** for /tʃ/ (universal)
- **ng** for /ŋ/ (universal)
- **ee/uu** for long vowels (Finnish-style doubling)
- **ai** for /aɪ/ (Pinyin, Italian, Vietnamese, IPA)
- **oi** for /ɔɪ/ (universal)
- **ou** for /aʊ/ (English, Dutch)

### Solving Problems English Never Did
- **dh** for /ð/ - English uses "th" for two different sounds (think vs. the). We fix this. [Albanian](https://en.wikipedia.org/wiki/Albanian_alphabet) already uses 'dh' officially.
- **zh** for /ʒ/ - English hides this sound in "measure", "vision", "beige". We give it a proper spelling that parallels sh/zh like s/z.
- **oo/uu** for /ʊ/ vs /uː/ - "book" and "too" sound different. Now they look different: book vs tuu.
- **oh** for /oʊ/ - Since 'o' alone is used for /ɑ/, we need a digraph: go (goh).

### Trade-offs
- We prioritize **English reader familiarity** over cross-linguistic patterns
- We use **digraphs** rather than diacritics for ASCII compatibility
- For detailed discussion of diphthong alternatives considered, see [Design Decisions: Diphthongs](design-decisions.md#diphthong-decisions)

## Commonality Ratings Summary

Each spelling is rated by how widely it's used across world languages:

- **Universal**: Used by most languages with this sound
- **Common**: Used by multiple language families
- **Regional**: Used by a specific language family or region
- **Rare**: Used by few languages
- **Novel**: Invented for Ingglish or very uncommon

### Single Consonants

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| b | /b/ | **Universal** | Standard across virtually all Latin-script languages |
| d | /d/ | **Universal** | Standard across virtually all Latin-script languages |
| f | /f/ | **Universal** | Standard across virtually all Latin-script languages |
| g | /g/ | **Universal** | Always hard /g/, never /dʒ/ as in English "gem" |
| h | /h/ | **Universal** | Standard; silent in some languages but letter is universal |
| k | /k/ | **Universal** | Standard across virtually all Latin-script languages |
| l | /l/ | **Universal** | Standard across virtually all Latin-script languages |
| m | /m/ | **Universal** | Standard across virtually all Latin-script languages |
| n | /n/ | **Universal** | Standard across virtually all Latin-script languages |
| p | /p/ | **Universal** | Standard across virtually all Latin-script languages |
| r | /ɹ/ | **Universal** | Letter universal; exact sound varies by language |
| s | /s/ | **Universal** | Always /s/, never /z/ as in English "rose" |
| t | /t/ | **Universal** | Standard across virtually all Latin-script languages |
| v | /v/ | **Universal** | Standard across virtually all Latin-script languages |
| w | /w/ | **Common** | Less common in some European languages |
| y | /j/ | **Common** | Used for /j/ in English, German, Scandinavian |
| z | /z/ | **Universal** | Standard across virtually all Latin-script languages |

Note: Ingglish uses consistent single-letter consonants with no ambiguity. Unlike English, 'g' is always hard, 's' is always /s/, and 'c' is not used (replaced by 'k' or 's').

### Consonant Digraphs

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| sh | /ʃ/ | **Common** | English, Albanian, Somali, Pinyin, Cyrillic romanization |
| zh | /ʒ/ | **Common** | Cyrillic romanization (Ж→zh), Albanian; 350+ years in English dictionaries |
| th | /θ/ | **Regional** | Only ~4% of languages have this sound; English, Albanian, Welsh use 'th' |
| dh | /ð/ | **Rare** | Albanian (official letter), Cornish, Swahili; ~7% of languages have /ð/ |
| ch | /tʃ/ | **Universal** | Spanish, English, Czech, Portuguese, and most Latin-script languages |
| j | /dʒ/ | **Common** | English-influenced: Indonesian, Malay, Somali, Indian romanization |
| ng | /ŋ/ | **Universal** | Nearly all languages; Austronesian languages treat it as single letter |

### Diphthongs

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ai | /aɪ/ | **Common** | Pinyin, Italian, Vietnamese, IPA; direct representation of /aɪ/ |
| ay | /eɪ/ | **Common** | English "say, day, play"; standard English spelling |
| ou | /aʊ/ | **Common** | English "out, loud, sound" + Dutch "oud"; some words become identical |
| oh | /oʊ/ | **Rare** | Few precedents; needed to distinguish from 'ou' |
| oi | /ɔɪ/ | **Universal** | English, French, Dutch; standard across languages |

### Short Vowels

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| a | /æ/ | **Common** | Most languages use 'a' for an open front vowel |
| e | /ɛ/ | **Universal** | Nearly all Latin-script languages |
| i | /ɪ/ | **Universal** | Standard across Romance, Germanic languages |
| o | /ɑ/ | **Common** | Spanish 'o'; matches "father" vowel in many languages |
| u | /ʌ/ | **Regional** | English convention ("but", "cup"); Spanish/Italian use 'a' for similar sound |

### Long Vowels

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ee | /iː/ | **Common** | Finnish/Estonian doubling principle; Dutch 'ee' in open syllables |
| uu | /uː/ | **Common** | Finnish 'uu'; longer sound gets longer spelling |
| oo | /ʊ/ | **Common** | Matches English "book", "good", "look" |
| aw | /ɔ/ | **Common** | English "law, saw"; represents open-o sound |

### R-Colored Vowels

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ar | /ɑɹ/ | **Regional** | English convention; rhotic dialects only |
| or | /ɔɹ/ | **Regional** | English convention; rhotic dialects only |
| air | /ɛɹ/ | **Regional** | English convention; rhotic dialects only |
| er | /ɝ/ | **Regional** | English convention; rhotic dialects only |
| arr | /æɹ/ | **Common** | Doubled 'r' after short vowel; matches English "carrot", "barrel" |

Note: R-colored vowels are specific to rhotic English dialects. Most languages don't merge vowel + /r/ into single phonemic units.

### Key Findings

1. **Zero Novel spellings**: Every Ingglish spelling has precedent in at least one major language
2. **Most consonant choices are well-attested**: sh, ch, ng, j are Common or Universal
3. **'dh' for /ð/ has real precedent**: Albanian uses it as an official alphabet letter
4. **Doubled vowels follow Finnish/Estonian patterns**: ee, uu are principled choices
5. **'oo' for /ʊ/ matches English**: words like "book", "good", "look" already use this
6. **'arr' for /æɹ/ matches English**: words like "carrot", "barrel", "arrow" already use this
7. **'oh' for /oʊ/ is unusual** but necessary to distinguish from 'ou' (/aʊ/)

## Phonemic Orthography Success Stories

For a detailed analysis of why previous English spelling reforms failed (and succeeded), see [Spelling Reform History](spelling-reform-comparison.md).

Below are examples of phonemic orthographies that use spellings similar to Ingglish.

### Finnish

Finnish is often cited as having the most transparent orthography in Europe:

- **99% phoneme-to-grapheme consistency**
- Double letters indicate length (aa, ee, uu) — Ingglish follows this exactly
- 'uu' for /uː/ in Finnish matches Ingglish 'uu' for the same sound
- Children achieve reading fluency by end of first grade
- Dyslexia rates are significantly lower than in English-speaking countries

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
| ð (dh) | /ð/ | 7% | Rare |
| θ (th) | /θ/ | 4% | Rare |

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

For how Ingglish addresses these challenges, see [Design Decisions](design-decisions.md).

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
