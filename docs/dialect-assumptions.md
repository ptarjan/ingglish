# Dialect Assumptions

Ingglish spells words as they sound in **General American English (GenAm)**, using the pronunciations in the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary). English accents differ, so any phonetic spelling has to pick one. This page lists every major place where that choice matters and who it affects.

The CMU dictionary writes pronunciations in ARPAbet, a plain-text notation with 39 phonemes (distinct sounds): 15 vowels and 24 consonants. That set of sounds is itself American. It has no /ɒ/ (the British vowel in "lot"), no /ʍ/ (a breathy "hw" sound), and no separate symbol for schwa, the weak vowel in "about"; schwa is written as the "but" vowel, AH, marked unstressed: AH0, where the digit gives the stress level and 0 means none.

Capitalised names like LOT, TRAP and BATH are standard linguists' labels for groups of words that share a vowel, each named after one of its words: "the BATH words" means bath, grass, dance and so on. A *merger* is when an accent pronounces two such groups the same way; a *split* is the reverse.

## Why General American?

1. The CMU Pronouncing Dictionary is the largest free English pronunciation dictionary (126,000+ words).
2. Thanks to American media, GenAm is the most widely recognized English accent worldwide.
3. It is a practical single accent to start from (see [Design Decisions](design-decisions.md)).

Other accents could be supported later with alternative sound-to-spelling mappings.

## Major Dialect Features

### Rhoticity (Post-Vocalic R)

**Ingglish assumes every R is pronounced, including after a vowel.** Accents that do this are called rhotic.

| Word | Ingglish | GenAm (rhotic) | British RP (non-rhotic) |
|------|----------|---------------|------------------------|
| car | kar | /kɑɹ/ | /kɑː/ |
| park | park | /pɑɹk/ | /pɑːk/ |
| bird | berd | /bɝd/ | /bɜːd/ |
| near | neer | /nɪɹ/ | /nɪə/ |
| nurse | ners | /nɝs/ | /nɜːs/ |

**Who this affects:** Speakers of non-rhotic accents (RP, the standard British accent; Australian; New Zealand; some Southern US; some New England) see an R where they don't say one. This is the assumption with the widest reach: it touches almost every word with a vowel followed by R.

**Who this matches:** General American, Canadian, and most other rhotic accents. Scottish and Irish accents are rhotic too, but their vowels before R differ (many Scottish speakers keep the vowels of "fern", "bird" and "hurt" apart, where General American merges all three into /ɝ/, spelled "er": fern, berd, hert), so the R is right but the vowel spelling may not match.

### The TRAP-BATH Split

**Ingglish uses /æ/, the vowel in "trap", for all BATH words** (bath, grass, dance and similar).

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| bath | bath | /bæθ/ | /bɑːθ/ |
| grass | gras | /æ/ | /ɑː/ |
| dance | dans | /æ/ | /ɑː/ |
| castle | kasal | /æ/ | /ɑː/ |
| class | klas | /æ/ | /ɑː/ |
| ask | ask | /æ/ | /ɑː/ |

**Who this affects:** RP and South African speakers use /ɑː/ in these words and would expect "bahth", "grahs", "dahns". Australian English uses /ɑː/ in some BATH words (bath, grass) but /æ/ in others (dance, castle), so it is partly affected.

**Who this matches:** General American, Canadian, Northern English, Scottish, Irish.

### The Cot-Caught Distinction

**Ingglish keeps the LOT vowel (/ɑ/, "cot") separate from the THOUGHT vowel (/ɔ/, "caught").**

| Word | Ingglish | Vowel | GenAm |
|------|----------|-------|-------|
| cot | kot | /ɑ/ | /kɑt/ |
| caught | kawt | /ɔ/ | /kɔt/ |
| lot | lot | /ɑ/ | /lɑt/ |
| thought | thawt | /ɔ/ | /θɔt/ |
| cloth | klawth | /ɔ/ | /klɔθ/ |

**Who this affects:** Speakers with the [cot-caught merger](https://en.wikipedia.org/wiki/Cot%E2%80%93caught_merger) (Western US, Canada, much of the US Midland) say both with the same vowel, so the choice between "o" and "aw" will seem arbitrary to them.

**Who this matches:** Speakers who keep the two apart (Eastern US, some Southern US). RP keeps them apart too, but with different vowel sounds.

### The Father-Bother Merger

**Ingglish gives LOT ("bother") and PALM ("father") the same vowel, /ɑ/, spelled "o".**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| father | fodher | /fɑðɚ/ | /fɑːðə/ (PALM /ɑː/) |
| bother | bodher | /bɑðɚ/ | /bɒðə/ (LOT /ɒ/) |

**Who this affects:** RP and Australian speakers say these differently: "father" has /ɑː/ (PALM) and "bother" has /ɒ/ (LOT). ARPAbet has no symbol for the rounded /ɒ/, so the dictionary cannot record the difference.

### The Mary-Marry-Merry Merger

**Ingglish spells all three the same way.**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| Mary | Mairee | /mɛɹi/ | /meəɹi/ (SQUARE) |
| marry | mairee | /mɛɹi/ | /mæɹi/ (TRAP) |
| merry | mairee | /mɛɹi/ | /mɛɹi/ (DRESS) |

**Who this affects:** RP pronounces all three differently, and New York City and Philadelphia speakers may keep two or all three apart. To them, one spelling for all three looks wrong.

**Who this matches:** Most of General American, where the merger is complete.

### Yod-Dropping After Coronals

**Ingglish drops the "y" sound (/j/) between /t/, /d/, /n/ or /s/ and /uː/**, so "new" is "noo", not "nyoo". Linguists call /j/ "yod" and these four consonants "coronals", hence yod-dropping after coronals.

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| dew | doo | /duː/ | /djuː/ |
| due | doo | /duː/ | /djuː/ |
| new | noo | /nuː/ | /njuː/ |
| tune | toon | /tuːn/ | /tjuːn/ |
| suit | soot | /suːt/ | /sjuːt/ |
| student | stoodant | /stuːdənt/ | /stjuːdənt/ |

**Who this affects:** RP, Australian, and most non-American accents keep the /j/ here and would expect "dyoo", "nyoo", "tyoon".

**Who this matches:** General American, where dropping it is standard.

### The Wine-Whine Merger

**Ingglish spells both /w/ and the breathy /ʍ/ ("hw") as "w".**

| Word | Ingglish | GenAm | Scottish/Irish |
|------|----------|-------|---------------|
| which | wich | /wɪtʃ/ | /ʍɪtʃ/ |
| witch | wich | /wɪtʃ/ | /wɪtʃ/ |
| where | wair | /wɛɹ/ | /ʍɛɹ/ |
| wear | wair | /wɛɹ/ | /wɛɹ/ |

**Who this affects:** Scottish, Irish, and some Southern US speakers, who start "which" with /ʍ/ ("hw"). For them, a real difference disappears.

**Who this matches:** Most GenAm and RP speakers, who say "which" and "witch" the same.

### The Horse-Hoarse Merger

**Ingglish spells these the same way.**

| Word | Ingglish | GenAm |
|------|----------|-------|
| horse | hors | /hɔɹs/ |
| hoarse | hors | /hɔɹs/ |
| for | for | /fɔɹ/ |
| four | for | /fɔɹ/ |

**Who this affects:** Some Scottish and Irish speakers, who say them differently. Nearly every other major accent says them the same.

### Flapping (Allophonic Detail)

**Ingglish writes the /t/ a word has in principle, not the quick tapped [ɾ] Americans actually say.** Linguists call this tap a flap.

| Word | Ingglish | GenAm pronunciation | What you hear |
|------|----------|-------------------|---------------|
| butter | buhter | /bʌtɚ/ | [bʌɾɚ] (flapped) |
| water | wawter | /wɔtɚ/ | [wɔɾɚ] (flapped) |
| letter | leter | /lɛtɚ/ | [lɛɾɚ] (flapped) |
| ladder | lader | /lædɚ/ | [læɾɚ] (flapped) |

Ingglish records **phonemes** (the sounds a speaker thinks of a word as having), not **phonetic** detail (exactly how it comes out). So a /t/ between vowels is written "t" even though most Americans say it as a flap [ɾ], much like a quick "d". This happens to match RP more closely, since RP doesn't flap /t/. (Slashes, as in /t/, mark phonemes; square brackets, as in [ɾ], mark sounds as actually spoken.)

### The -ile Suffix

**Ingglish uses the American pronunciation, with a weak "-al" ending.**

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| hostile | hostal | /hɑstəl/ | /hɒstaɪl/ |
| missile | misal | /mɪsəl/ | /mɪsaɪl/ |
| fertile | fertal | /fɝtəl/ | /fɜːtaɪl/ |
| fragile | frajal | /fɹædʒəl/ | /fɹædʒaɪl/ |

**Who this affects:** RP speakers say -ile as /aɪl/ (like "aisle") and would expect "hostail", "misail", and so on.

## Specific Word Differences

Some individual words are well known for sounding different in America and Britain:

| Word | Ingglish | GenAm | British RP |
|------|----------|-------|------------|
| schedule | skejul | /skɛdʒuːl/ | /ʃɛdjuːl/ |
| lieutenant | lootenant | /luːtɛnənt/ | /lɛftɛnənt/ |
| herb | erb | /ɝb/ (silent H) | /hɜːb/ |
| tomato | tamaytoh | /təmeɪtoʊ/ | /təmɑːtəʊ/ |
| vitamin | vaitaman | /vaɪtəmɪn/ | /vɪtəmɪn/ |
| privacy | praivasee | /pɹaɪvəsi/ | /pɹɪvəsi/ |
| vase | vays | /veɪs/ | /vɑːz/ |
| garage | gerozh | /ɡəɹɑːʒ/ | /ɡæɹɪdʒ/ |
| been | bin | /bɪn/ | /biːn/ |
| leisure | leezher | /liːʒɚ/ | /lɛʒə/ |

## Summary: Mergers and Distinctions

| Feature | Ingglish status | Affects |
|---------|----------------|---------|
| Rhoticity | Rhotic (all R's pronounced) | RP, Australian, NZ speakers |
| TRAP-BATH | No split (all /æ/) | RP, Australian, SA speakers |
| Cot-caught | Distinct (/ɑ/ vs /ɔ/) | Western US, Canadian speakers |
| Father-bother | Merged (both /ɑ/) | RP, Australian speakers |
| Mary-marry-merry | Fully merged | RP, NYC, Philadelphia speakers |
| Wine-whine | Merged (both W) | Scottish, Irish speakers |
| Yod after coronals | Dropped | RP, Australian speakers |
| Horse-hoarse | Merged | Some Scottish, Irish speakers |
| Flapping | Written as underlying /t/ | Matches all dialects phonemically |

## British Spelling Normalization

Pronunciation aside, the CMU dictionary lists American *spellings*. If a word like "colour" or "realise" isn't in it, Ingglish converts it to the American spelling ("color", "realize") and looks that up instead. The conversions are:

- -ise -> -ize (realise -> realize)
- -our -> -or (colour -> color)
- -re -> -er (centre -> center)
- -lled -> -led (travelled -> traveled)
- -ence -> -ense (defence -> defense)
- -ogue -> -og (catalogue -> catalog)
- grey -> gray

This only changes which dictionary entry is found. It does not change any pronunciation choice.
