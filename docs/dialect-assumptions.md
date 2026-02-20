# Dialect Assumptions

Ingglish is based on **General American English (GenAm)** pronunciation as encoded in the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary). This page documents every major dialect-sensitive assumption and how it affects speakers of other English varieties.

The CMU dictionary uses 39 phonemes (15 vowels + 24 consonants) in the ARPAbet notation. This phoneme inventory itself encodes GenAm assumptions: there is no /ɒ/ (British LOT), no /ʍ/ (voiceless W), and schwa is identified by stress level rather than by a separate phoneme symbol.

## Why General American?

GenAm was chosen because:

1. The CMU Pronouncing Dictionary is the largest freely available pronunciation dictionary for English (126,000+ words)
2. GenAm is internationally the most widely recognized English accent via American media
3. It provides a practical single-dialect starting point (see [Design Decisions](design-decisions.md))

Future work could support dialect variants by providing alternative phoneme mappings.

## Major Dialect Features

### Rhoticity (Post-Vocalic R)

**Ingglish assumes all R's are pronounced.**

| Word | Ingglish | GenAm (rhotic) | British RP (non-rhotic) |
|------|----------|---------------|------------------------|
| car | kar | /kɑɹ/ | /kɑː/ |
| park | park | /pɑɹk/ | /pɑːk/ |
| bird | berd | /bɝd/ | /bɜːd/ |
| near | neer | /nɪɹ/ | /nɪə/ |
| nurse | ners | /nɝs/ | /nɜːs/ |

**Who this affects:** Speakers of non-rhotic dialects (RP, Australian, New Zealand, some Southern US, some New England) would see R's in positions where they don't pronounce them. This is the single most impactful dialect assumption, affecting virtually every word containing a vowel followed by R.

**Who this matches:** General American, Canadian, Scottish, Irish, and most other rhotic varieties.

### The TRAP-BATH Split

**Ingglish uses /&aelig;/ (the TRAP vowel) for all BATH words.**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| bath | bath | /b&aelig;&theta;/ | /bɑː&theta;/ |
| grass | gras | /&aelig;/ | /ɑː/ |
| dance | dans | /&aelig;/ | /ɑː/ |
| castle | kasal | /&aelig;/ | /ɑː/ |
| class | klas | /&aelig;/ | /ɑː/ |
| ask | ask | /&aelig;/ | /ɑː/ |

**Who this affects:** RP, Australian, and South African speakers use /ɑː/ in these words. They would expect "bahth", "grahs", "dahns".

**Who this matches:** General American, Canadian, Northern English, Scottish, Irish.

### The Cot-Caught Distinction

**Ingglish maintains a distinction between LOT (/ɑ/) and THOUGHT (/ɔ/).**

| Word | Ingglish | Vowel | GenAm |
|------|----------|-------|-------|
| cot | kot | AA (/ɑ/) | /kɑt/ |
| caught | kawt | AO (/ɔ/) | /kɔt/ |
| lot | lot | AA | /lɑt/ |
| thought | thawt | AO | /&theta;ɔt/ |
| cloth | klawth | AO | /klɔ&theta;/ |

**Who this affects:** Speakers with the [cot-caught merger](https://en.wikipedia.org/wiki/Cot%E2%80%93caught_merger) (Western US, Canada, much of the Midland) use the same vowel for both sets. They would find the "o" vs "aw" distinction arbitrary.

**Who this matches:** Speakers who maintain the distinction (Eastern US, some Southern US). Note that RP also distinguishes these, but with different vowel qualities.

### The Father-Bother Merger

**Ingglish merges LOT and PALM (both use AA).**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| father | fodher | /fɑðɚ/ (AA) | /fɑːðə/ (PALM /ɑː/) |
| bother | bodher | /bɑðɚ/ (AA) | /bɒðə/ (LOT /ɒ/) |

**Who this affects:** RP and Australian speakers distinguish these: "father" has /ɑː/ (PALM) while "bother" has /ɒ/ (LOT). The rounded /ɒ/ vowel has no ARPAbet equivalent.

### The Mary-Marry-Merry Merger

**Ingglish merges all three to the same spelling.**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| Mary | Mairee | /mɛɹi/ | /meəɹi/ (SQUARE) |
| marry | mairee | /mɛɹi/ | /m&aelig;ɹi/ (TRAP) |
| merry | mairee | /mɛɹi/ | /mɛɹi/ (DRESS) |

**Who this affects:** RP has a three-way distinction; New York City and Philadelphia may maintain a two-way or three-way distinction. These speakers would find it wrong that all three get the same spelling.

**Who this matches:** Most of General American, where the merger is complete.

### Yod-Dropping After Coronals

**Ingglish drops /j/ after /t, d, n, s/ before /uː/.**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| dew | duu | /duː/ | /djuː/ |
| due | duu | /duː/ | /djuː/ |
| new | nuu | /nuː/ | /njuː/ |
| tune | tuun | /tuːn/ | /tjuːn/ |
| suit | suut | /suːt/ | /sjuːt/ |
| student | stuudant | /stuːdənt/ | /stjuːdənt/ |

**Who this affects:** RP, Australian, and most non-American varieties preserve /j/ in these positions. They would expect "dyuu", "nyuu", "tyuun".

**Who this matches:** General American, where yod-dropping after coronals is standard.

### The Wine-Whine Merger

**Ingglish merges /w/ and /ʍ/ (both spelled "w").**

| Word | Ingglish | GenAm | Scottish/Irish |
|------|----------|-------|---------------|
| which | wich | /wɪtʃ/ | /ʍɪtʃ/ |
| witch | wich | /wɪtʃ/ | /wɪtʃ/ |
| where | wair | /wɛɹ/ | /ʍɛɹ/ |
| wear | wair | /wɛɹ/ | /wɛɹ/ |

**Who this affects:** Scottish, Irish, and some Southern US speakers who pronounce "which" with a voiceless /ʍ/ ("hw"). They lose a meaningful distinction.

**Who this matches:** Most GenAm and RP speakers, where the merger is complete.

### The Horse-Hoarse Merger

**Ingglish merges these to the same spelling.**

| Word | Ingglish | GenAm |
|------|----------|-------|
| horse | hors | /hɔɹs/ |
| hoarse | hors | /hɔɹs/ |
| for | for | /fɔɹ/ |
| four | for | /fɔɹ/ |

**Who this affects:** Some Scottish and Irish speakers maintain a distinction. The merger is nearly complete in all other major dialects.

### Flapping (Allophonic Detail)

**Ingglish writes underlying /t/, not surface [ɾ].**

| Word | Ingglish | GenAm pronunciation | What you hear |
|------|----------|-------------------|---------------|
| butter | buter | /bʌtɚ/ | [bʌɾɚ] (flapped) |
| water | wawter | /wɔtɚ/ | [wɔɾɚ] (flapped) |
| letter | leter | /lɛtɚ/ | [lɛɾɚ] (flapped) |
| ladder | lader | /l&aelig;dɚ/ | [l&aelig;ɾɚ] (flapped) |

Ingglish is a **phonemic** transcription (underlying sounds) not a **phonetic** one (surface sounds). Intervocalic /t/ is written "t" even though most American speakers pronounce it as a flap [ɾ]. This actually matches RP pronunciation more closely, where /t/ is not flapped.

### The -ile Suffix

**Ingglish uses the American reduced pronunciation.**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| hostile | hostal | /hɑstəl/ | /hɒstaɪl/ |
| missile | misal | /mɪsəl/ | /mɪsaɪl/ |
| fertile | fertal | /fɝtəl/ | /fɜːtaɪl/ |
| fragile | frajal | /fɹ&aelig;dʒəl/ | /fɹ&aelig;dʒaɪl/ |

**Who this affects:** RP speakers pronounce -ile as /aɪl/ and would expect "hostail", "misail", etc.

## Specific Word Differences

Some individual words have well-known transatlantic pronunciation differences:

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| schedule | skejool | /skɛdʒuːl/ | /ʃɛdjuːl/ |
| lieutenant | luutenant | /luːtɛnənt/ | /lɛftɛnənt/ |
| herb | erb | /ɝb/ (silent H) | /hɜːb/ |
| tomato | tamaytoh | /təmeɪtoʊ/ | /təmɑːtəʊ/ |
| vitamin | vaitaman | /vaɪtəmɪn/ | /vɪtəmɪn/ |
| privacy | praivasee | /pɹaɪvəsi/ | /pɹɪvəsi/ |
| vase | vays | /veɪs/ | /vɑːz/ |
| garage | gerozh | /ɡəɹɑːʒ/ | /ɡ&aelig;ɹɪdʒ/ |
| been | bin | /bɪn/ | /biːn/ |
| leisure | leezher | /liːʒɚ/ | /lɛʒə/ |

## Summary: Mergers and Distinctions

| Feature | Ingglish status | Affects |
|---------|----------------|---------|
| Rhoticity | Rhotic (all R's pronounced) | RP, Australian, NZ speakers |
| TRAP-BATH | No split (all /&aelig;/) | RP, Australian, SA speakers |
| Cot-caught | Distinct (AA vs AO) | Western US, Canadian speakers |
| Father-bother | Merged (both AA) | RP, Australian speakers |
| Mary-marry-merry | Fully merged | RP, NYC, Philadelphia speakers |
| Wine-whine | Merged (both W) | Scottish, Irish speakers |
| Yod after coronals | Dropped | RP, Australian speakers |
| Horse-hoarse | Merged | Some Scottish, Irish speakers |
| Flapping | Written as underlying /t/ | Matches all dialects phonemically |

## British Spelling Normalization

Separately from pronunciation, Ingglish includes a British-to-American *spelling* normalizer for dictionary lookup. If a word like "colour" or "realise" isn't found in the CMU dictionary, it's automatically converted to the American spelling ("color", "realize") before lookup. This handles:

- -ise -> -ize (realise -> realize)
- -our -> -or (colour -> color)
- -re -> -er (centre -> center)
- -lled -> -led (travelled -> traveled)
- -ence -> -ense (defence -> defense)
- -ogue -> -og (catalogue -> catalog)
- grey -> gray

This is purely a spelling-to-spelling mapping to improve dictionary coverage; it doesn't affect pronunciation choices.
