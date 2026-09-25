# How Ingglish Spells Each Vowel

This page covers the hardest part of the first goal in [How It Was Designed](design-decisions.md): one sound, one spelling, applied to vowels. General American English (the broadly standard American accent Ingglish follows; see [Which Accent](dialect-assumptions.md)) has 14 or 15 vowel sounds (the count depends on the analysis), plus the vowels blended with R in "star" and "air" (r-colored vowels), but only five vowel letters. So most vowels need a letter pair, and every pair Ingglish picked had rivals. Each vowel's section has up to four parts: **Chosen** (the spelling and why), **Considered** (the alternatives measured and why they lost), **History** (earlier spellings) and **Precedent** (which other languages use the spelling).

For the order in which these changes happened, see [Spelling History](spelling-iteration.md). [Testing Every Alternative](identical-words-analysis.md) describes the search behind most of the numbers here.

## Terms Used on This Page

- **Identical word**: a word whose Ingglish spelling is the same as its English spelling ("sit" → "sit"). Today 9,385 of the 126,051 words in the CMU Pronouncing Dictionary are identical (7.45%). That free dictionary of American pronunciations is the word list Ingglish is built on.
- **/M**: "per million words of running text". A change worth +5.7K /M (K means thousand) makes 5,700 more words in every million words of ordinary English text come out spelled as in English. Word frequencies come from SUBTLEX-US, a count of the words in 49.7 million words of film and TV subtitles. A change can make hundreds of rare dictionary words identical and still score below zero, because the few common words it breaks appear far more often in real text. See [Text Preserved](metrics.md#text-preserved).
- **Collision**: two different English words that end up with the same Ingglish spelling. The **collision count** adds up every word that has to share its spelling with another. It is 18,870 today, almost all of it true homophones such as "right" and "write", which sound alike and so must share a spelling. The test for a new spelling is whether it raises that count, which means merging words that sound different.
- **Sound names**: capitalized words such as KIT, FLEECE and PRICE are the standard names linguists use for English vowels. Each is a word that contains the vowel: KIT is the vowel of "sit", PRICE the vowel of "my". Sounds are also written in IPA (the International Phonetic Alphabet) between slashes: /aɪ/ is the vowel of "my".
- **Stress digit**: the CMU dictionary writes each vowel in a notation called ARPAbet and adds a digit for stress. AH0 is an unstressed AH; AH1 (main stress) and AH2 (secondary stress) are stressed.
- **The search**: a script that tried 70 candidate spellings for every sound, scoring each one on identical words and collisions.
- **Rating**: how widely the world's languages use a spelling for that sound, from Universal down through Common, Regional and Rare. See [Commonality Ratings](orthography-comparison.md#commonality-ratings-summary).

Every Ingglish spelling on this page comes from the Ingglish translator (the software on this site), and every number comes from the scripts listed under [Methodology](#methodology).

## Short Vowels

Five of the six short vowels needed no decision: English already spells them with one letter, as nearly every other language does. The sixth, STRUT, is where the design had to choose.

### KIT (sit): i

**Chosen:** i. It is the English spelling (sit, big, him) and the letter every compared language uses for this sound (rated Universal).

**Considered:** e and y. Both make far less text identical: e scores −50.9K /M and y −52.3K /M.

**Examples:**
- sit → sit
- big → big
- gym → jim

### DRESS (bed): e

**Chosen:** e, as in English "bed" and "red". Rated Universal.

**Considered:** a (−20.4K /M) and ai (−18.3K /M). Both make far less text identical.

**Examples:**
- bed → bed
- said → sed

### TRAP (cat): a

**Chosen:** a, as in "cat" and "hat". Rated Universal. The same letter also spells schwa, the weak vowel in "about"; see [Schwa and STRUT](#schwa-and-strut).

**Considered:** e and ai, each −19.0K /M.

**Examples:**
- hat → hat
- cat → kat

### LOT and PALM (hot, father): o

**Chosen:** o. American English says "hot" and "father" with the same vowel, and o keeps hot, got, not, on and job exactly as English spells them. Rated Universal: the English vowel of "hot" is said with the mouth more open than most languages' o, but o is the usual letter for it.

**Considered:**
- **ah**, the first spelling Ingglish used. It is an accurate spelling of the vowel in "father", but "hot" became "haht" and "rock" became "rahk". Measured today it scores −27.7K /M against o: on, don, not, got and god all stop matching English.
- **a**, as in "father": −23.7K /M. It would also clash with the a of "cat".

**History:** ah → o (January 2026). Taking o for this vowel meant o could not also spell the vowel of "go"; see [GOAT](#goat-go-show-oh).

**Examples:**
- hot → hot
- rock → rok
- father → fodher

### STRUT (but, cup): uh

**Chosen:** uh, the English interjection that is exactly this sound. Everyone already knows how to say it, and it leaves plain u free for the vowel of "book". Only the stressed vowel is spelled uh. The unstressed weak vowel of "about" is spelled a; see [Schwa and STRUT](#schwa-and-strut).

**Considered:**
- **u**, the English spelling in "but", "cup" and "just", and what STRUT used until February 2026. On identical words alone it wins by +20.2K /M, because just, but, up, us and much would match English again. But u now spells the vowel of "book", so the two vowels would merge: "look" and "luck" would both be luk, "book" and "buck" both buk. That adds 104 collisions.
- **o**, as English writes "son" and "love": +3.7K /M, but o already spells the vowel of "hot". "Nut" would join "not", "but" would join "bought" (bot), and the collision count would rise by 742.
- **a**: −1.2K /M, and "cup" would read as "cap".

**Precedent:** Rated Rare: no other language writes this sound uh, and the STRUT vowel itself is rare among the world's languages. Most of the other spelling reforms surveyed in [Reforms Proposed Today](community-landscape.md) keep u, so uh is one of Ingglish's less common choices.

**Examples:**
- but → buht
- cup → kuhp
- love → luhv
- young → yuhng

### FOOT (book, put): u

**Chosen:** u. Almost every language written in the Latin alphabet uses u for this vowel (rated Universal), and "put" stays identical.

**Considered:** oo, the English spelling in "book", "good" and "look". It scores +5.3K /M, but oo now spells the long vowel of "too", so pairs such as "look" and "Luke" (both look) and "would" and "wood" (both wood) would merge, adding 81 collisions. English itself uses oo for both vowels, which is the ambiguity Ingglish exists to remove.

**History:** uu → oo → u. The first spelling, uu, looked strange ("buuk") when English already writes "book". In January 2026 the spellings of FOOT and GOOSE (the vowel of "too") swapped, so FOOT became oo and GOOSE became uu. In February 2026, spelling STRUT as uh freed plain u, and FOOT moved to it. That three-vowel change is described under [The chain shift of February 2026](#the-chain-shift-of-february-2026).

**Examples:**
- book → buk
- good → gud
- could → kud
- put → put

## Long Vowels

### FLEECE (see): ee

**Chosen:** ee, as in English "see", "bee" and "tree". Finnish and Estonian also double a letter to show a long vowel. Rated Common.

**Considered:**
- **e** scores +28.4K /M, because me, we, he, be and she would match English. But e already spells the vowel of "bed", so "here" would join "her" and "wheel" would join "well": 1,001 more collisions.
- **i** (−9.7K /M), **ie** (−9.5K /M) and **y** (−7.2K /M) all make less text identical.

The unstressed version of this vowel, at the end of "happy", is still an open question; see [Still Open: Unstressed Vowels](#still-open-unstressed-vowels).

**Examples:**
- see → see
- tree → tree
- machine → masheen

### GOOSE (too, food): oo

**Chosen:** oo, as in English "too", "food", "moon" and "room". Rated Common.

**Considered:**
- **uu**, the Finnish and Estonian way of writing a long u. Ingglish used it for six weeks, but English never writes uu, and "tuu" and "thruu" looked foreign. Measured today it scores −3.7K /M: too, room, soon and food would stop matching English.
- **eu** scores −3.7K /M too, and it fails a second test. In English, eu begins with a "y" sound: "feud" is /fjuːd/, and "Europe" starts like "you". So "meun" (moon) reads as two syllables, "mew-n", and "teu" (too) as "tyoo". A spelling that matches a few English words but leads readers to the wrong sound is worse than an unfamiliar one that reads correctly.
- **u** scores −3.3K /M and would clash with the u of "book".

**History:** oo → uu → oo. The first swap gave the longer spelling to the longer sound. The [February 2026 chain shift](#the-chain-shift-of-february-2026) gave oo back to GOOSE.

**Examples:**
- too → too
- food → food
- school → skool
- blue → bloo
- you → yoo

### FACE (say): ay

**Chosen:** ay, as in English "say", "day", "play" and "way". Rated Regional: most languages have a plain steady /e/ here, not the English sound, which glides from e toward ee.

**Considered:**
- **ai**, the other English spelling (rain, wait). It scores −5.0K /M, because say, way, day and away are far more common than wait and train. It would also leave /aɪ/ without its spelling: keeping ai for both would merge "may" and "my" (mai), and "lake" and "like" (laik), adding 773 collisions.
- **ey** (−5.8K /M) and plain **a** (−6.0K /M).

**Examples:**
- say → say
- make → mayk
- rain → rayn

### GOAT (go, show): oh

**Chosen:** oh, spelled like the English exclamation "oh!", which is exactly this sound. Nothing in English reads oh any other way.

**Considered:**
- **o**, the obvious choice and the spelling Ingglish briefly used. It scores +21.0K /M, because no, so, go, going and over would match English. But o already spells the vowel of "hot", so "note" would join "not", "own" would join "on" and "coat" would join "cot". That adds 922 collisions.
- **ow**, as in "snow", "show" and "own": −1.3K /M. It gains show (501 /M), own (471 /M) and throw (132 /M), but loses "oh" (3,374 /M). Worse, English spells two sounds with ow, the vowel of "snow" and the vowel of "cow". New spellings such as "bownz" (bones) would read as rhyming with "gowns", and "howm" (home) with "cow". The collision count can't catch this, because "bownz" is not an English word; the only problem is that readers say it wrong.
- **oe** scores −3.2K /M.

**History:** oh → o → oh. The first mapping was oh. On the first day it was shortened to o, to keep "go" as "go". Five days later o was needed elsewhere (first for the vowel of "law", then for the vowel of "hot"), and GOAT went back to oh.

**Precedent:** Rated Rare. Most languages have a plain, steady o sound and simply write o. Ingglish can't, because o already spells the vowel of "hot". The survey of other spelling reforms in [Reforms Proposed Today](community-landscape.md) found none using oh, and no agreement among reforms on this vowel at all.

**Examples:**
- go → goh
- show → shoh
- home → hohm
- oh → oh
- hello → haloh

### THOUGHT (law, taught): aw

**Chosen:** aw, as in English "law", "saw" and "draw". Rated Regional: English is almost alone in writing this sound aw.

**Considered:**
- **o**, which would spell THOUGHT the same as the vowel of "hot". Many Americans already say the two alike (the cot–caught merger). Ingglish tried this in January 2026. It scores +834 /M, but it merges every pair that speakers who keep the vowels apart can hear: "dawn" and "don", "taught" and "tot", "naught" and "not", "talk" and "tock". That adds 496 collisions. And since GOAT was spelled o at the time, it had to move to oh.
- **au**, as in "fault", "Paul" and "launch": −555 /M. It loses saw (413 /M), law (119 /M), lawyer (82 /M) and draw (41 /M).
- **a**: −501 /M.

**History:** aw → o → aw. This vowel changed more times than any other. The merge with o lasted less than a day before the next change reversed it.

**The caught–cot caveat:** the CMU dictionary lists two pronunciations for some words, and the translator takes the first one listed. For "caught" and "bought" the first uses the vowel of "hot", so Ingglish currently writes kot and bot, merging "caught" with "cot". Words whose entry has the THOUGHT vowel keep it, including "taught", "daughter" and "thought". Whether Ingglish should prefer the THOUGHT pronunciation for such words when it builds its dictionary is an open question; see [Which Accent](dialect-assumptions.md).

**Examples:**
- law → law
- thought → thawt
- taught → tawt
- daughter → dawter
- talk → tawk

## Diphthongs

A diphthong is a vowel that glides from one sound to another, as in "my" (from "ah" to "ee") or "cow". Languages written in the Latin alphabet mostly agree on how to spell consonants, but they spell diphthongs in many different ways. Ingglish follows one pattern for all three: two vowel letters that show where the glide starts and where it ends (a + i, o + u, o + i).

### PRICE (my, time): ai

**Chosen:** ai. It spells the glide itself: the sound starts near a and ends near i, which is also how IPA writes it (/aɪ/). Pinyin (the standard way of writing Mandarin in Latin letters), Italian, Vietnamese, Indonesian, Hindi, Arabic and Japanese romanization all use ai (rated Common). In English, ai spells the vowel of "rain", but Ingglish spells that vowel ay, so ai is free.

**Considered:**
- **y**, as in English "my", "by", "try" and "fly". Of all the changes the search found that don't raise the collision count, this one gains the most: +10.1K /M, from my (6,937 /M), by (1,375 /M), try (489 /M) and trying (460 /M). The collision count even falls by 56, because some words that share a spelling today would no longer do so. It was rejected because y already spells a consonant, the first sound of "yes" and "you". Outside the vowel spelling "ay", every y in Ingglish is that consonant, and a reader always knows how to say it. If y also spelled the vowel of "my", a y before a vowel could be either sound. "Iron" would be spelled yern, the same as "yearn", and "ironing" the same as "yearning". Those are real collisions, 15 of them, but the search only checks the total collision count, and the change removes more collisions elsewhere than it adds, so it reports y as collision-free. The larger cost is not in any count: every y before a vowel would become a guess. That breaks the first goal, one sound, one spelling: y would no longer stand for a single sound.
- **ie**, as in English "tie", "pie" and "die", which Ingglish used for one day. It scores +890 /M (die, tried, lie). But inside a word English reads ie as the vowel of "see" (field, piece, chief), and so do German and Dutch, so "tiem" (time) and "niet" (night) invite the wrong sound.
- **ii**, the first replacement for ai: "fiit" (fight) looked like "feet". It scores −25 /M: it makes no English word identical, and it breaks a few, such as Shanghai.
- **ei**, as German writes it (Stein, Einstein). It makes 371 more dictionary words identical, more than any other spelling tested for this vowel. Weighted by frequency it scores −4 /M: the gains are almost all rare German surnames such as Einstein, it breaks slightly more common words such as Shanghai and Saigon, and English usually reads ei as the vowel of "vein" or "receive".

**History:** ai → ii → ie → ai. The first spelling was ai. In January 2026 it changed to ii, then to ie the next day because "fiit" read as "feet", then back to ai the same day, because other languages use ai and it shows the glide.

**Examples:**
- my → mai
- time → taim
- night → nait
- like → laik

### MOUTH (cow, out): ou

**Chosen:** ou, as in English "out", "loud", "sound" and "found", which all stay identical. Dutch uses ou for the same sound (oud, "old"). Rated Common.

**Considered:**
- **ow**, as in English "cow", "now" and "how", which Ingglish used first. Measured today it scores −527 /M: now (3,285 /M) and how (3,135 /M) match English, but out (3,965 /M), about (3,725 /M) and found (406 /M) stop matching. And English also reads ow as the vowel of "snow", the same problem that ruled ow out for GOAT. English is the only language that writes this sound ow.
- **au**, as German and Portuguese write it (Haus): −9.4K /M, because out, about and found would no longer match English, while it gains only rare words such as "frau" and "kraut".

**History:** ow → ou (January 2026). The trade-off is that "cow" becomes "kou" and "now" becomes "nou", but the words that stay identical, such as out and about, are more common.

**Examples:**
- out → out
- loud → loud
- sound → sound
- cow → kou
- house → hous

### CHOICE (boy, coin): oi

**Chosen:** oi, as in English "coin", "point", "oil" and "join". Italian, Dutch, Indonesian, Vietnamese, Romanian and Albanian use it too (rated Common). It follows the same pattern as ai and ou.

**Considered:** **oy**, as in English "boy", "joy" and "enjoy". It is one of the six changes the search found that don't add collisions, and it scores +234 /M: its biggest gains are boy (543 /M) and enjoy (85 /M), and its biggest losses are point (243 /M), join (86 /M) and oil (42 /M). English uses both, oi inside a word and oy at the end, so neither is more familiar overall, and the difference is too small to justify a change. oy is also used by fewer other languages (English, Turkish, Somali).

**Examples:**
- coin → koin
- point → point
- boy → boi
- joy → joi

## Schwa and STRUT

Schwa (/ə/) is the weak, unstressed vowel in "about", "sofa" and "the". It is the most common vowel in English, and English spells it with any vowel letter: the a of "about", the e of "problem", the o of "computer". The CMU dictionary writes schwa and the stressed STRUT vowel of "but" with the same symbol, AH, and tells them apart only by the stress digit.

**Chosen:** Ingglish splits AH by stress.

- Unstressed AH0 (schwa) → **a**: about, sofa, the, and
- Stressed AH1 and AH2 (STRUT) → **uh**: but, cup, run, son

The split is safe because the two sounds never compete for the same place: STRUT appears only in stressed syllables and schwa only in unstressed ones. Linguists call this [complementary distribution](https://en.wikipedia.org/wiki/Complementary_distribution), and many analyses treat the two as forms of a single phoneme (one distinctive sound) (for example [Giegerich 1992](https://books.google.com/books/about/English_Phonology.html?id=ALJKvQWP8FAC), *English Phonology: An Introduction*).

Schwa is spelled a because English already spells it that way in its most common words: "a", "and", "about" and "away" are all identical in Ingglish.

**Considered:** one spelling for every AH. Until February 2026 Ingglish wrote both sounds u, which gave "dhu" for "the", "ubout" for "about" and "nayshun" for "nation". When the change to a was adopted, the words it made identical appeared 67.6 times as often in real text as the words it broke. That ratio used the spellings of February 2026, not today's. Measured today, going back to one spelling for every AH (uh) would cost 41.1K /M, more than any other single change on this page: a (20,941 /M), and (13,733 /M) and about (3,725 /M) would all stop matching English. The split does add some collisions, because schwa now shares the letter a with the vowel of "cat": spelling every AH as uh again would remove 168.

**The cost:** a now spells two sounds, the vowel of "cat" and schwa. A reader meeting "a" in an unfamiliar word can't tell which one is meant. Words where English spells schwa with another letter change: until → antil and upset → apset (the un- and up- prefixes), problem → problam. [Reading Ambiguities](orthographic-transparency.md#reading-ambiguities) lists every Ingglish spelling that can be read two ways.

**Precedent:** languages disagree. Romanian and Albanian have special letters (ă, ë), and French, German, Dutch and Portuguese use an unstressed e. No other language uses a, so here Ingglish follows English's own most common words. Most of the other spelling reforms surveyed in [Reforms Proposed Today](community-landscape.md) don't address schwa at all.

**Examples:**
- about → about
- and → and
- the → dha
- sofa → sohfa
- again → agen
- nation → nayshan
- beautiful → byootafal
- difficult → difakalt

### The chain shift of February 2026

Spelling STRUT as uh was one move in a three-step chain. Each vowel took the spelling the one before it gave up:

- STRUT (but): u → uh, so u was no longer in use
- FOOT (book): oo → u, so oo was no longer in use
- GOOSE (too): uu → oo, and uu was dropped

**Before:** but → "but", book → "book", too → "tuu".

**After:**
- but → buht
- book → buk
- too → too
- food → food

The chain removed uu, which English never uses; gave FOOT the letter most languages use; and gave GOOSE its usual English spelling. It was also the most expensive change in identical words. Measured today, the old three spellings would make 21.9K /M more text identical than the current ones do, because just, but, up, good and look matched English and now don't, while too, room, soon and food, which match now, count for less. The dictionary had 10,151 identical words before the chain and has 9,385 now. The change was made for readability and precedent, not for identical words.

## R-Colored Vowels

When a vowel comes before R, the two often blend into one sound, an [r-colored vowel](https://en.wikipedia.org/wiki/R-colored_vowel), as in "star", "air" and "beer". Ingglish gives each vowel-plus-R combination its own spelling. The rule applies whenever R follows the vowel in the dictionary's pronunciation; otherwise the vowel keeps its usual spelling.

There are eight vowel+R spellings in all. The table names each vowel by its sound name: LOT is the vowel of "hot", THOUGHT of "law", DRESS of "bed", TRAP of "cat", KIT of "sit", FOOT of "book" and STRUT of "but", and NURSE is the vowel of "her". More examples: car → kar, there → dhair, carrot → karrat, fear → feer, turn → tern, cure → kyur.

| Vowel + R | Spelling | English | Ingglish | What the plain vowel + r would give |
|-----------|----------|---------|----------|-------------------------------------|
| LOT + R | ar | star | star | "or", the same as store |
| THOUGHT + R | or | store | stor | "awr" (stawr), awkward |
| DRESS + R | air | care | kair | "er", the same as her |
| TRAP + R | arr | arrow | arroh | "ar", the same as star |
| KIT + R | eer | beard | beerd | "ir": beard → "bird" |
| NURSE | er | bird | berd | no clash; it is one sound |
| FOOT + R | ur | tour | tur | "ur", the same spelling |
| STRUT + R | uhr | curry | kuhree | without the rule, an unstressed AH before R would be "ar" |

The NURSE vowel of "her" and "bird" is its own sound, not a vowel followed by R, so it takes the plain er. The last two rows are just the vowel's usual spelling followed by r. The STRUT rule still matters for an unstressed AH before R, which would otherwise be spelled ar like schwa: "mozzarella" is motsuhrela.

**Why each exists.** Without these spellings, the plain vowel mappings would give confusing or colliding results. With them:

- "star" → **star** (distinct from "store")
- "store" → **stor** (distinct from "star")
- "fair" → **fair** (distinct from "fur")
- "carry" → **karree** (distinct from "car" + "ee")
- "beer" → **beer** (distinct from "bir")

Measured one rule at a time against the current system, removing the rule for:

- **ar** would add 390 collisions: "star" and "store", "farmer" and "former", "far" and "for".
- **air** would add 160: "hair" and "her", "where" and "were", "fair" and "fur".
- **arr** would add 40, such as "barrow" and "borrow".
- **uhr** would add 4, all rare words and names.
- **or** and **eer** would add none. They exist for reading, not collisions: without eer, "beard" would be spelled "bird", a real English word with a different sound, and "beer" would be "bir". Without or, "store" would be "stawr".
- **ur** changes nothing today, because u + r is already ur. It is listed so that the rule stays in place if the FOOT spelling ever changes.

Removing every rule at once raises the collision count from 18,870 to 19,001.

**History:** ar, or, air and aar (for TRAP + R) were added in January 2026, and aar became arr the same day: "aaroh" (arrow) looked strange, and English already doubles the consonant after a short vowel (carrot, barrel). eer came in February 2026, when "beard" was still being spelled "bird". The STRUT + R rule came with the schwa change in February 2026, spelled ur at first. After the [chain shift](#the-chain-shift-of-february-2026) it became uhr, and FOOT + R took ur.

**Precedent:** r-colored vowels are rare in the world's languages. Of the 37 languages [compared across spelling systems](orthography-comparison.md#r-colored-vowels), only English and Mandarin have them. So these spellings follow English: ar, or, air, eer, ur and uhr are rated Rare (English-only), arr and er Regional.

### Why not use the R vowels everywhere?

Suppose each vowel were spelled everywhere the way it is spelled before R: a for the vowel of "hot" (as in ar), o for the vowel of "law" (as in or), ai for the vowel of "bed" (as in air). Then the R spellings would follow without a special rule. But those vowels would turn common words into other words: "hot" would become "hat", "law" would become "lo", and "bed" would become "baid". The R spellings were chosen because they match normal English spelling before an R. Used everywhere, they mislead.

## Still Open: Unstressed Vowels

The schwa split worked because English speakers hear unstressed schwa and stressed STRUT as different sounds. Other vowels also sound different when unstressed. The unstressed vowel at the end of "happy" is shorter than the vowel of "see", and the unstressed first vowel of "hotel" is lighter than the vowel of "go". The search tested a separate unstressed spelling for all 15 vowels. The strongest candidates:

| Unstressed vowel | Now | Candidate | Effect on identical text | Top gains |
|------------------|-----|-----------|--------------------------|-----------|
| FLEECE (happy) | ee | `y` | +2.5K /M | every, party, story, body |
| FLEECE (happy) | ee | `e` | +1.2K /M | maybe, report, pretend |
| GOAT (hotel) | oh | `o` | +238 /M | hotel, motel, November |

Unstressed FLEECE as y follows how English already spells the end of "happy", "body" and "city", but it brings back the problem that ruled out y for PRICE: a y before a vowel reads as the consonant of "yes". "Area" would become "airya". The change lowers the collision count by 200 overall, but it also creates 25 new collisions of this kind: the rare name "Milian" would be spelled milyan, the same as "million".

Three questions remain before any of these changes:

1. Do English speakers hear the unstressed vowel as a different sound, as clearly as schwa differs from STRUT? Or is it just a quieter version of the same vowel?
2. Does each extra stress rule make Ingglish harder to learn? Every one is a rule a reader can't see, because Ingglish marks no stress.
3. Will readers say the new spellings correctly? y at the end of a word and o in an unstressed syllable are how English already spells these sounds, which is promising.

The full candidate table is in [Stress-Conditioned Alternatives](identical-words-analysis.md#stress-conditioned-alternatives).

## Methodology

The numbers on this page come from scripts in `packages/core/scripts/analysis/`, run at commit 0601e97b:

- `exhaustive-search.ts`: tests 70 candidate spellings for each of the 39 sounds (2,730 combinations), then 1,036 unstressed-only variants, and reports the changes that make more words identical without raising the collision count. It is the source of the y and ei results for PRICE, oy for CHOICE, au for THOUGHT, ow and oe for GOAT, and the unstressed-vowel table.
- `analyze-identical-words.ts`: the /M effect of the single-letter alternatives (e and y for KIT, a and ah for LOT, u and o for STRUT, oo for FOOT, eu and u for GOOSE, and others). It does not check collisions.
- The collision counts for each alternative, the /M figures for uu (GOOSE), ie and ii (PRICE) and ow and au (MOUTH), the counts for the vowel + R rules and the chain-shift comparison come from a rerun that makes one change at a time, using the same spelling rules and collision count as `exhaustive-search.ts`. Where the scripts test the same change, it gives the same figures.
- The 67.6-fold schwa ratio (how much more often the words the change made identical appear in text than the words it broke) was measured by `compare-schwa.ts` when the change was adopted in February 2026. The script now compares against today's spellings, so a rerun gives a different figure.

Word frequencies are from SUBTLEX-US, a count of 49.7 million words of film and TV subtitles. Pronunciations are from the CMU Pronouncing Dictionary (126,051 words). The spelling of every vowel is defined in `packages/phonemes/src/ingglish-maps.ts`.
