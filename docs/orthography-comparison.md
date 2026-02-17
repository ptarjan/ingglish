# Orthography Comparison

How Ingglish spellings compare to other languages. Nearly every choice has precedent in at least one major language.

For why we chose these spellings, see [Design Decisions](design-decisions.md).

## Vowels

### Short Vowels

#### Short 'A' Sound (/æ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **a** | kat |
| [English](https://en.wikipedia.org/wiki/English_orthography) | a | cat, hat |
| [Old English](https://en.wikipedia.org/wiki/Old_English_Latin_alphabet) | æ (ash) | æsc (ash tree) |
| [German](https://en.wikipedia.org/wiki/German_orthography) | ä | männer (men) |
| [Swedish](https://en.wikipedia.org/wiki/Swedish_orthography) | ä | väg (way) |
| [Turkish](https://en.wikipedia.org/wiki/Turkish_alphabet) | a | at (horse); Turkish /a/ is more central than English /æ/ |
| [Azerbaijani](https://en.wikipedia.org/wiki/Azerbaijani_alphabet) | ə | səs (sound) |
| Spanish/Italian | a | gato/gatto (cat); closer to /a/ |

**Notes:**
- English /æ/ is more front than most languages' /a/, but 'a' is still the intuitive choice
- Old English had a dedicated letter 'æ' (ash) for this sound; we simplify to 'a'
- Germanic languages often use ä for similar sounds (German, Swedish)

#### Short 'E' Sound (/ɛ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **e** | bed |
| English | e | bed, pet |
| [Portuguese](https://en.wikipedia.org/wiki/Portuguese_orthography) | é (acute) | café (coffee) |
| Italian | è (grave) | è (is), bello (beautiful) |
| [Catalan](https://en.wikipedia.org/wiki/Catalan_orthography) | è | què (what) |
| Turkish | e | ev (house) |
| [Vietnamese](https://en.wikipedia.org/wiki/Vietnamese_alphabet) | e | xe (vehicle) |

**Notes:**
- Universal across Latin-script languages
- Portuguese/Italian/Catalan use accent marks to distinguish open /ɛ/ from close /e/
- No innovation needed here

#### Short 'I' Sound (/ɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **i** | bit |
| English | i | bit, sit |
| [Dutch](https://en.wikipedia.org/wiki/Dutch_orthography) | i | bit (bit) |
| German | i | biss (bite) |
| Turkish | i | bir (one) |
| Indonesian | i | ini (this) |
| Spanish/Italian | i | si/sì (yes); closer to /i/ |

**Notes:**
- Standard across Latin-script languages
- English /ɪ/ is slightly different from Continental /i/, but 'i' works for both
- Turkish has a distinctive dotless ı for /ɯ/, keeping dotted i for /i/

#### Short 'O' Sound (/ɑ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **o** | hot |
| English | o, a | hot, cot, father |
| Spanish | o | poco (little) |
| Italian | o | otto (eight) |
| Dutch | o | bot (bone) |
| Turkish | o | on (ten) |
| Pinyin | o | bō (wave) |

**Notes:**
- Nearly all Latin-script languages use 'o' for back vowels
- American English "hot" uses /ɑ/ (open back unrounded), which is more open than the /o/ (close-mid back rounded) of Spanish or Italian, but 'o' is the nearest conventional match
- English "father" also has this sound, spelled 'a' in English, 'o' in Ingglish

#### Short 'U' Sound (/ʌ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **u** | but |
| English | u, o | but, cup, son, love |
| Dutch | u | bus (bus) |
| [Korean romanization](https://en.wikipedia.org/wiki/Romanization_of_Korean) | eo | 버스 beoseu (bus) |

**Notes:**
- The English /ʌ/ sound is relatively rare across languages
- Most languages use 'u' for /u/ (as in "too"), not /ʌ/
- We follow English convention ("but", "cup") for familiarity
- English inconsistently spells this as 'o' in "son", "love", "come". Ingglish uses 'u' consistently
- The unstressed schwa (/ə/) also maps to 'u'; see Schwa section below

### Long Vowels

#### 'AY' Sound (/eɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ay** | mayk (make) |
| English | ay, ai, a-e | say, rain, make |
| Spanish | ey | rey (king) |
| [Portuguese](https://en.wikipedia.org/wiki/Portuguese_orthography) | ei | lei (law) |
| Pinyin | ei | bēi (cup) |
| Indonesian | e | sate (satay) |

**Notes:**
- Matches English: "say", "day", "play", "way"
- Many languages don't have this exact diphthong
- Clear and unambiguous

#### 'EE' Sound (/iː/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ee** | bee |
| English | ee, ea, ie | bee, sea, piece |
| [Finnish](https://en.wikipedia.org/wiki/Finnish_orthography#Vowel_length) | ii | siitä (from it), viini (wine) |
| [Estonian](https://en.wikipedia.org/wiki/Estonian_orthography#Length) | ii | liiga (too much) |
| Dutch | ie | zien (see), bier (beer) |
| Japanese ([Romaji](https://en.wikipedia.org/wiki/Romanization_of_Japanese)) | ii, ī | ojiisan (grandfather) |

**Notes:**
- Finnish/Estonian use doubled vowels for length; we follow this principle
- Finnish tuuli (wind) vs. tuli (fire) shows minimal pairs distinguished only by length
- 'ee' already exists in English ("bee", "see", "tree")
- Consistent pattern: double the letter to lengthen the sound

#### 'AI' Sound (/aɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ai** | mai (my) |
| English | ie, i, y | tie, pie, my |
| [German](https://en.wikipedia.org/wiki/Ei_(digraph)) | ei | mein (my) |
| [Dutch](https://en.wikipedia.org/wiki/Dutch_orthography) | ij, ei | mij (me), klein (small) |
| Italian | ai | mai (never) |
| Pinyin | ai | bái (white) |
| Vietnamese | ai | hai (two) |

**Notes:**
- Pinyin (the standard romanization for Mandarin Chinese), Italian, Vietnamese all use 'ai' for this sound
- German 'ei' is /aɪ/, but their 'ie' is /iː/, confusing for learners
- English 'ai' words (rain, paint) use /eɪ/, so 'ai' is available for /aɪ/

#### 'OH' Sound (/oʊ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **oh** | goh (go) |
| English | o, oa, ow | go, boat, show |
| Dutch | oo | boot (boat) |
| German | o | boot (boat) |
| Pinyin | ou | dōu (all) |
| Japanese (Romaji) | o, ō | ohayō (good morning) |

**Notes:**
- 'o' alone is used for /ɑ/ (hot), so we need a digraph for /oʊ/
- 'oh' matches English interjection "oh!" which has this exact sound
- Many languages (Spanish, Swahili, Turkish) have pure /o/ without the glide

#### 'UU' Sound (/uː/)

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
- Many languages don't distinguish vowel length, though some do (Japanese, Arabic, Hindi, Hawaiian)
- The longer sound gets the longer spelling (uu vs oo)

### Diphthongs

#### 'OU' Sound (/aʊ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ou** | kou (cow) |
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

#### 'OI' Sound (/ɔɪ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **oi** | boi (boy) |
| English | oi, oy | oil, boy |
| French | oi | roi (king) |
| Dutch | ooi | mooi (beautiful) |
| German | eu, äu | neu (new), häuser (houses) |
| Indonesian | oi | (rare, mostly in loanwords) |
| Vietnamese | oi | nói (speak) |

**Notes:**
- Very common diphthong spelling worldwide: 'oi' or 'oy'
- German is the outlier using 'eu'
- No innovation needed

#### 'AW' Sound (/ɔ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **aw** | law, thawt |
| English | aw, au, ough, a | law, caught, thought, all |
| [Swedish/Norwegian/Danish](https://en.wikipedia.org/wiki/%C3%85) | å | båt (boat), på (on) |
| [French](https://en.wikipedia.org/wiki/French_orthography) | o | porte (door), bonne (good) |
| Catalan | ò | sòc (clog), pòsit (deposit) |
| [Polish](https://en.wikipedia.org/wiki/Polish_orthography) | o | kot (cat), dom (house) |
| German | o | Sonne (sun), offen (open) |
| [Yoruba](https://en.wikipedia.org/wiki/Yoruba_alphabet) | ọ | ọjọ (day) |

**Notes:**
- English has wildly inconsistent spellings for this sound: "law", "caught", "thought", "all"
- Ingglish uses 'aw' consistently, matching English "law", "saw", "raw"
- Scandinavian languages use the dedicated letter **å** for this sound
- Catalan distinguishes open ò /ɔ/ from close ó /o/ with accent marks
- Many African languages use **Ɔ** or **ọ** (open O or O with dot below)
- We reserve plain 'o' for /ɑ/ (father, hot) to avoid collision

#### 'OO' Sound (/ʊ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **oo** | book |
| English | oo, u | book, put |
| Dutch | oe | boek (book) |
| German | u | futter (fodder) |
| Most languages | u | (same as /uː/) |

**Notes:**
- 'oo' matches English words like "book", "good", "look"
- English distinguishes "too" /uː/ from "book" /ʊ/; we preserve this with uu vs. oo
- Dutch uses 'oe' for this sound: boek (book), goed (good)
- Most languages worldwide don't distinguish /ʊ/ from /uː/

#### Schwa (/ə/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **u** | ubout (about), sohfu (sofa), bunanu (banana) |
| English | a, e, i, o, u | **a**bout, sof**a**, penc**i**l, mem**o**ry, circ**u**s |

**Notes:**
- The schwa is the most common vowel sound in English, the unstressed "uh" in many syllables
- English spells it with any vowel letter depending on etymology
- Ingglish uses 'u' consistently, same as the stressed /ʌ/ in "but"
- This creates some visual repetition (banana → bunanu) but maintains phonemic accuracy

### R-Colored Vowels

[R-colored vowels](https://en.wikipedia.org/wiki/R-colored_vowel) (also called rhotic vowels) are rare across world languages ([Ladefoged & Maddieson 1996](https://books.google.com/books?id=ni1PnwEACAAJ), *The Sounds of the World's Languages*), but English and Mandarin Chinese both have them. They're hard to spell because the vowel and /r/ merge into a single sound.

#### 'ARR' Sound (/æɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **arr** | arroh, karrut, barrul |
| English | arr, ar | arrow, carrot, barrel |

**Notes:**
- The doubled 'rr' distinguishes this from 'ar' (star)
- Matches English spelling pattern in "arrow", "carrot", "barrel"
- Without this distinction: "arrow" and "are" would collide

#### 'AIR' Sound (/ɛɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **air** | air, kair, dhair |
| English | air, are, ear, ere | air, care, bear, there |

**Notes:**
- English has wildly inconsistent spellings: "air", "care", "bear", "there", "their"
- Ingglish uses 'air' consistently, matching the word "air" itself
- This spelling fixed 204 collisions (air vs her would both be "er" otherwise)

#### 'EER' Sound (/ɪɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **eer** | beer, beerd, feer |
| English | eer, ear, ere, ier | beer, beard, fear, here, pier |

**Notes:**
- English uses several spellings: "beer", "beard", "fear", "here", "pier"
- Ingglish uses 'eer' consistently, matching the word "beer" itself
- Without this rule, "beard" would become "bird" (confusing with the animal)
- The [NEAR vowel](https://en.wikipedia.org/wiki/English_phonology#NEAR) (/ɪɹ/) is distinct from the KIT vowel (IH /ɪ/): "beer" vs "bit"

#### 'AR' Sound (/ɑɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ar** | star, kar, far |
| English | ar | star, car, far |

**Notes:**
- Perfectly intuitive, matches English spelling exactly
- "star" → "star" is identical in Ingglish

#### 'OR' Sound (/ɔɹ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **or** | stor, mor, for |
| English | ore, or, our, oar | store, more, four, oar |

**Notes:**
- English has multiple spellings: "store", "more", "four", "oar"
- Ingglish uses 'or' consistently
- Clearly distinct from 'ar' (star vs stor)

#### 'ER' Sound (/ɝ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **er** | berd, her, tern |
| English | ir, er, ur, ear, or | bird, her, turn, earth, work |
| [Mandarin Chinese](https://en.wikipedia.org/wiki/Erhua) | er | 二 èr (two), 儿 ér (son) |

**Notes:**
- English uses five different spellings for the same sound
- Ingglish uses 'er' consistently, the most common English spelling
- Mandarin is one of few languages with r-colored vowels (called erhua 儿化)
- R-colored vowels are rare across world languages (Ladefoged & Maddieson 1996)

## Consonants

### Stops

The stop consonants (p, b, t, d, k, g) use standard single-letter spellings that are virtually universal across Latin-script languages.

| Ingglish | IPA | Example |
|----------|-----|---------|
| p | /p/ | pat, happy, cup |
| b | /b/ | bat, about, cab |
| t | /t/ | top, better, cat |
| d | /d/ | dog, ladder, bed |
| k | /k/ | cat, backer, back |
| g | /g/ | go, bigger, big |

**Notes:**
- Ingglish uses 'k' instead of 'c' for the /k/ sound (no "soft c")
- 'g' is always hard /g/, never /dʒ/ as in English "gem"

### Fricatives

The simple fricatives (f, v, s, z, h) use standard single-letter spellings, universal across Latin-script languages.

| Ingglish | IPA | Example |
|----------|-----|---------|
| f | /f/ | fat, after, laugh |
| v | /v/ | van, over, love |
| s | /s/ | sat, missing, miss |
| z | /z/ | zoo, buzzing, is |
| h | /h/ | hat, ahead, behind |

**Notes:**
- 's' is always /s/, never /z/ as in English "rose" (Ingglish: rohz)
- These five consonants need no special treatment

The following fricatives require digraphs and have cross-linguistic variation:

#### "SH" Sound (/ʃ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **sh** | ship |
| English | sh | ship |
| [Albanian](https://en.wikipedia.org/wiki/Albanian_alphabet) | sh | shqip (Albanian) |
| German | sch | schiff (ship) |
| [Polish](https://en.wikipedia.org/wiki/Sz_(digraph)) | sz | szkoła (school) |
| [Hungarian](https://en.wikipedia.org/wiki/Hungarian_orthography) | s | só (salt) |
| [Czech](https://en.wikipedia.org/wiki/Czech_orthography)/[Slovak](https://en.wikipedia.org/wiki/Slovak_orthography) | š | škola (school) |
| Italian | sc (before e/i) | pesce (fish) |
| French | ch | chat (cat) |
| Turkish | ş | şeker (sugar) |
| [Judaeo-Spanish](https://en.wikipedia.org/wiki/Judaeo-Spanish) | sh | debasho (under) |

**Notes:**
- We follow English convention with 'sh', also used by Albanian (official letter) and Judaeo-Spanish
- German's 'sch' is longer; Polish 'sz' might confuse English readers
- Hungarian reverses convention: 's' for /ʃ/, 'sz' for /s/
- Languages with diacritics (š, ş) achieve single-letter representation

#### "ZH" Sound (/ʒ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **zh** | mezher |
| English | s, si, g | measure, vision, beige |
| French | j, g | je (I), rouge (red) |
| Portuguese | j, g | hoje (today), gente (people) |
| Polish | ż, rz | żaba (frog), rzeka (river) |
| [Czech](https://en.wikipedia.org/wiki/%C5%BD)/[Slovak](https://en.wikipedia.org/wiki/%C5%BD) | ž | žena (woman) |
| Hungarian | zs | zseb (pocket) |
| Turkish | j | jeton (token) |
| Finnish/Estonian | ž or zh | žurnal (journal) |

**Notes:**
- English has no consistent spelling for /ʒ/; we create one with 'zh'
- 'zh' parallels 'sh' (voiceless) vs 'zh' (voiced), a logical pair
- [Cyrillic romanization](https://en.wikipedia.org/wiki/Romanization_of_Russian) uses 'zh' for Ж
- Finnish/Estonian officially allow 'zh' as a substitute when 'ž' is unavailable

#### "TH" Sound (/θ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **th** | think |
| English | th | think, bath |
| [Icelandic](https://en.wikipedia.org/wiki/Icelandic_orthography) | þ (thorn) | þakka (thank) |
| [Welsh](https://en.wikipedia.org/wiki/Welsh_orthography) | th | athro (teacher) |
| [Greek](https://en.wikipedia.org/wiki/Greek_orthography) | θ (theta) | θάλασσα (sea) |
| Spanish (Castilian) | c/z | cero (zero), zapato (shoe) |
| [Bashkir](https://en.wikipedia.org/wiki/Bashkir_language)/[Turkmen](https://en.wikipedia.org/wiki/Turkmen_language) | θ/s | (Turkic languages with /θ/) |

**Notes:**
- Only ~8% of languages have dental fricatives ([Maddieson 2013, WALS Chapter 19](https://wals.info/chapter/19)). They're genuinely rare. [PHOIBLE 2.0](https://phoible.org/) ([Moran & McCloy 2019](https://doi.org/10.5281/zenodo.2677911)) shows ~4% of language inventories contain /θ/ and ~7% contain /ð/.
- English uses 'th' ambiguously for both voiceless /θ/ and voiced /ð/
- We keep 'th' for voiceless /θ/, the intuitive choice
- Ancient Greek /tʰ/ shifted to /θ/ in Modern Greek, giving us the IPA symbol

#### "DH" Sound (/ð/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **dh** | dhu (the) |
| English | th (ambiguous!) | the, this, father |
| Icelandic | ð (eth) | faðir (father) |
| Welsh | dd | dydd (day) |

**Notes:**
- We use 'dh' to distinguish voiced /ð/ from voiceless /θ/
- [Welsh uses 'dd'](https://en.wikipedia.org/wiki/Th_(digraph)) for /ð/. We considered this but 'dh' is more intuitive
- Icelandic preserves the original Old English letter ð (eth)

### Affricates

#### "CH" Sound (/tʃ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ch** | chat |
| English | ch | chat, church |
| Spanish | ch | chico (boy) |
| Italian | c (before e/i) | ciao (hello) |
| German | tsch | deutsch (German) |
| Portuguese | ch | chave (key) |

**Notes:**
- 'ch' for /tʃ/ is used in many major Latin-script languages (Spanish, English, Portuguese), though its value varies (French 'ch' = /ʃ/, Czech 'ch' = /x/)

#### "J" Sound (/dʒ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **j** | just |
| English | j, g (before e/i) | just, gem |
| Italian | g (before e/i) | giorno (day) |
| Turkish | c | cam (glass) |
| Indonesian | j | jalan (road) |
| [Malay](https://en.wikipedia.org/wiki/Malay_language) | j | jadi (become) |
| [Somali](https://en.wikipedia.org/wiki/Somali_language) | j | jaar (year) |
| [Hindi romanization](https://en.wikipedia.org/wiki/Hindi_romanization) | j | jī (yes) |

**Notes:**
- 'j' for /dʒ/ matches English convention
- Widely adopted in Southeast Asia (Indonesian, Malay), East Africa (Somali), and Indian romanization
- Italian uses 'g' before front vowels; Turkish reverses: 'c' for /dʒ/, 'j' for /ʒ/

### Nasals

The simple nasals (m, n) use standard single-letter spellings, universal across Latin-script languages.

| Ingglish | IPA | Example |
|----------|-----|---------|
| m | /m/ | man, hammer, come |
| n | /n/ | no, running, pen |

The velar nasal requires a digraph:

#### "NG" Sound (/ŋ/)

| Language | Spelling | Example |
|----------|----------|---------|
| **Ingglish** | **ng** | sing |
| English | ng, n (before k) | sing, think |
| German | ng | ring (ring) |
| Spanish | n (before g/k) | tengo (I have) |
| Vietnamese | ng, ngh | ngày (day) |
| [Samoan](https://en.wikipedia.org/wiki/Samoan_language)/[Tongan](https://en.wikipedia.org/wiki/Tongan_language) | g | (Polynesian languages) |
| [Bemba](https://en.wikipedia.org/wiki/Bemba_language) | ng' | ng'anda (house) |
| Pinyin | ng | héng (constant) |

**Notes:**
- Nearly universal use of 'ng' for this sound
- Polynesian languages treat /ŋ/ as a single letter, often written 'g' or 'ng'
- African languages often use 'ng'' (with apostrophe) to distinguish from /ng/ clusters
- We keep 'ng'. No innovation needed here

### Liquids & Glides

The liquids (l, r) and glides (w, y) use standard single-letter spellings, universal across Latin-script languages.

| Ingglish | IPA | Example |
|----------|-----|---------|
| l | /l/ | let, bellow, well |
| r | /ɹ/ | run, carry, car |
| w | /w/ | wet, away, always |
| y | /j/ | yes, beyond, canyon |

**Notes:**
- 'l' and 'r' are standard liquids in virtually all languages
- 'w' is less common in some European languages but widely understood
- 'y' for /j/ follows English/German/Scandinavian convention (Spanish uses 'y' for a different sound)

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
- **dh** for /ð/ - English uses "th" for two different sounds (think vs. the). We fix this. Albanian already uses 'dh' officially.
- **zh** for /ʒ/ - English hides this sound in "measure", "vision", "beige". We give it a proper spelling that parallels sh/zh like s/z.
- **oo/uu** for /ʊ/ vs /uː/ - "book" and "too" sound different. Now they look different: book vs tuu.
- **oh** for /oʊ/ - Since 'o' alone is used for /ɑ/, we need a digraph: go (goh).

### Trade-offs
- We prioritize **English reader familiarity** over cross-linguistic patterns
- We use **digraphs** rather than diacritics for ASCII compatibility
- For more on the diphthong choices, see [Design Decisions: Diphthongs](design-decisions.md#diphthong-decisions)

## Commonality Ratings Summary

Each spelling is rated by how widely it's used across world languages:

- **Universal**: Used by most languages with this sound
- **Common**: Used by multiple language families
- **Regional**: Used by a specific language family or region
- **Rare**: Used by few languages

### Vowels

#### Short Vowels

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| a | /æ/ | **Common** | Most languages use 'a' for an open front vowel |
| e | /ɛ/ | **Universal** | Nearly all Latin-script languages |
| i | /ɪ/ | **Universal** | Standard across Romance, Germanic languages |
| o | /ɑ/ | **Common** | Conventional Latin-script letter for back vowels; English /ɑ/ is more open than Spanish/Italian /o/ |
| u | /ʌ/ | **Regional** | English convention ("but", "cup"); few other languages have this vowel |

#### Long Vowels

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ay | /eɪ/ | **Common** | English "say, day, play"; standard English spelling |
| ee | /iː/ | **Common** | Finnish/Estonian doubling principle; English "bee, see" |
| ai | /aɪ/ | **Common** | Pinyin, Italian, Vietnamese, IPA; direct representation of /aɪ/ |
| oh | /oʊ/ | **Rare** | Few precedents; needed because 'o' is used for /ɑ/ |
| uu | /uː/ | **Common** | Finnish 'uu'; longer sound gets longer spelling |

#### Diphthongs

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ou | /aʊ/ | **Common** | English "out, loud, sound" + Dutch "oud"; some words become identical |
| oi | /ɔɪ/ | **Universal** | English, French, Dutch; standard across languages |
| aw | /ɔ/ | **Common** | English "law, saw"; represents open-o sound |
| oo | /ʊ/ | **Common** | Matches English "book", "good", "look" |

#### R-Colored Vowels

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ar | /ɑɹ/ | **Regional** | English convention; rhotic dialects only |
| or | /ɔɹ/ | **Regional** | English convention; rhotic dialects only |
| air | /ɛɹ/ | **Regional** | English convention; rhotic dialects only |
| arr | /æɹ/ | **Common** | Doubled 'r' after short vowel; matches English "carrot", "barrel" |
| er | /ɝ/ | **Regional** | English convention; rhotic dialects only |

Note: R-colored vowels are specific to rhotic English dialects. Most languages don't merge vowel + /r/ into single phonemic units.

### Consonants

#### Stops

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| p | /p/ | **Universal** | |
| b | /b/ | **Universal** | |
| t | /t/ | **Universal** | |
| d | /d/ | **Universal** | |
| k | /k/ | **Universal** | Ingglish uses 'k' instead of 'c' |
| g | /g/ | **Universal** | Always hard /g/, never /dʒ/ as in English "gem" |

#### Fricatives

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| f | /f/ | **Universal** | |
| v | /v/ | **Universal** | |
| th | /θ/ | **Regional** | Only ~4% of languages have this sound; English, Albanian, Welsh use 'th' |
| dh | /ð/ | **Rare** | Albanian (official letter), Cornish; ~7% of languages have /ð/ |
| s | /s/ | **Universal** | Always /s/, never /z/ as in English "rose" |
| z | /z/ | **Universal** | |
| sh | /ʃ/ | **Common** | English, Albanian, Somali, Pinyin, Cyrillic romanization |
| zh | /ʒ/ | **Common** | Cyrillic romanization (Ж→zh), Albanian, Finnish/Estonian |
| h | /h/ | **Universal** | Standard; silent in some languages but letter is universal |

#### Affricates

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| ch | /tʃ/ | **Universal** | Spanish, English, Czech, Portuguese, and most Latin-script languages |
| j | /dʒ/ | **Common** | English-influenced: Indonesian, Malay, Somali, Indian romanization |

#### Nasals

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| m | /m/ | **Universal** | |
| n | /n/ | **Universal** | |
| ng | /ŋ/ | **Universal** | Nearly all languages; Austronesian languages treat it as single letter |

#### Liquids & Glides

| Ingglish | Sound | Rating | Notes |
|----------|-------|--------|-------|
| l | /l/ | **Universal** | |
| r | /ɹ/ | **Universal** | Letter universal; exact sound varies by language |
| w | /w/ | **Common** | Less common in some European languages |
| y | /j/ | **Common** | Used for /j/ in English, German, Scandinavian |

### Takeaways

- Nearly every Ingglish spelling has precedent in at least one major language
- sh, ch, ng, j are Common or Universal
- 'dh' for /ð/ has real precedent: Albanian uses it as an official alphabet letter
- Doubled vowels (ee, uu) follow Finnish/Estonian patterns
- 'oo' for /ʊ/ matches English "book", "good", "look"
- 'arr' for /æɹ/ matches English "carrot", "barrel", "arrow"
- 'oh' for /oʊ/ is the most unusual choice, but necessary because 'o' is used for /ɑ/

## Phonemic Orthographies That Work

For why previous reforms failed and succeeded, see [Spelling Reform History](spelling-reform-comparison.md).

Some phonemic orthographies that use spellings similar to Ingglish:

### Finnish

Finnish is often cited as having the most transparent orthography in Europe:

- **Near-perfect phoneme-to-grapheme consistency** ([Seymour, Aro & Erskine 2003](https://doi.org/10.1348/000712603321661859))
- Double letters indicate length (aa, ee, uu). Ingglish follows this exactly
- 'uu' for /uː/ in Finnish matches Ingglish 'uu' for the same sound
- Finnish-speaking children achieve reading fluency significantly faster than English-speaking children (Seymour et al. 2003; [Ziegler et al. 2010](https://doi.org/10.1037/a0019978))
- Dyslexia prevalence is lower in transparent orthographies ([Paulesu et al. 2001](https://doi.org/10.1126/science.1057179), "Dyslexia: Cultural Diversity and Biological Unity," *Science*)

### Swahili

A successful African example using Latin script:

- Nearly 1:1 sound-to-letter correspondence
- 'ng'' represents /ŋ/ (similar to our 'ng')
- 'dh' represents a dental sound (used variously for /ð/ or /d̪/ in loanwords)
- 'sh' represents /ʃ/, same as Ingglish

## Phoneme Frequency: How Common Are These Sounds?

Not all phonemes are equally common across world languages. Approximate frequencies from [PHOIBLE 2.0](https://phoible.org/) (a database of 3,000+ language phoneme inventories). Exact percentages vary depending on which inventories are included and how allophones are counted; these figures are indicative rather than precise:

### Consonants in Ingglish

| Sound | IPA | % of languages |
|-------|-----|----------------|
| m | /m/ | 96% |
| k | /k/ | 90% |
| n | /n/ | 88% |
| p | /p/ | 86% |
| t | /t/ | 85% |
| j (as in "yes") | /j/ | 84% |
| w | /w/ | 76% |
| s | /s/ | 75% |
| l | /l/ | 68% |
| h | /h/ | 62% |
| r | /r/ or /ɹ/ | 60% |
| ŋ (ng) | /ŋ/ | 51% |
| ʃ (sh) | /ʃ/ | 45% |
| tʃ (ch) | /tʃ/ | 44% |
| dʒ (j) | /dʒ/ | 30% |
| ʒ (zh) | /ʒ/ | 20% |
| ð (dh) | /ð/ | 7% |
| θ (th) | /θ/ | 4% |

English's dental fricatives (/θ/ and /ð/) are among the world's rarest consonants. Most spelling systems never need to represent them. This is why there's no "standard" Latin spelling: few languages have these sounds.

### Vowel Systems

Most languages have 5–7 vowel phonemes. English has 14–15 depending on dialect and analysis ([Ladefoged & Johnson 2014](https://books.google.com/books?id=FjIVAgAAQBAJ)), making it unusually complex:

| Vowels | % of languages | Examples |
|--------|----------------|----------|
| 5 vowels | ~32% | Spanish, Japanese, Swahili (most common category) |
| 6 vowels | ~14% | Arabic, many Bantu languages |
| 7+ vowels | ~29% | German, French |
| 10+ vowels | <5% | English, Danish |

(Data from [Maddieson 2013, WALS Chapter 2](https://wals.info/chapter/2).)

This explains why English spelling is so difficult: we're mapping ~15 vowel sounds onto 5 vowel letters (a, e, i, o, u).

See [Design Decisions](design-decisions.md) for how Ingglish handles this.
