# How Ingglish Spells Each Consonant

This page covers the first goal in [How It Was Designed](design-decisions.md), one sound, one spelling, as it applies to consonants. It also shows the goal of staying familiar to English readers at work. For each consonant sound it gives the spelling Ingglish chose, the alternatives that were measured or considered, and the precedent in other languages.

Consonants needed far fewer decisions than vowels. English has 24 consonant sounds, and for most of them one letter already does the job: "b" is /b/ in almost every English word. So most of this page explains why a letter stays as it is. The real choices are few: dropping the letters that spell two sounds (c, q, x, and "s" when it sounds like "z"), and giving new spellings, dh and zh, to the two sounds English has no letters for: the "th" of "this" and the middle sound of "measure".

A few terms used below:

- An **identical word** is one whose Ingglish spelling is the same as its English spelling ("sit" → "sit").
- **/M** means "per million words of running text". A change worth +5.7K /M makes 5,700 more words in every million words of ordinary English text come out spelled the same as English. Word frequencies come from the SUBTLEX-US corpus. See [Text Preserved](metrics.md#text-preserved).
- A **collision** is two different English words that end up with the same Ingglish spelling.
- **Familiarity** is how often English already uses a spelling for its sound: the share of text where the English spelling of a word containing the sound includes the Ingglish letters for it. See [How Familiar the Consonants Look](#how-familiar-the-consonants-look).
- Sounds are written between slashes in IPA, the International Phonetic Alphabet: /ʃ/ is the "sh" in "she".

Every Ingglish spelling on this page comes from the translator, and the numbers come from the analysis scripts listed under [Methodology](#methodology).

## Letters Kept As They Are

**Chosen:** b, d, f, g, h, k, l, m, n, p, r, s, t, v, w, y and z each spell one consonant sound, the one they usually spell in English. For b, d, f, g, h, l, m, n, p, r, s, t, w and y, familiarity is at least 90% (see [How Familiar the Consonants Look](#how-familiar-the-consonants-look)). Changing these letters would cost familiarity and gain nothing.

What does change is everything around them. Each sound gets exactly one letter, so English's extra spellings go:

| English | Ingglish | What changed |
|---------|----------|--------------|
| knee | nee | silent k dropped |
| lamb | lam | silent b dropped |
| sign | sain | silent g dropped |
| ghost | gohst | silent h dropped |
| kiss | kis | double s becomes single |
| stuff | stuhf | double f becomes single |
| phone | fohn | ph becomes f |
| laugh | laf | gh becomes f |

**Considered:** keeping English's other spellings for these sounds. The analysis script tested each one against the current letter. Every one makes less text identical to English, because the single letter is already the most common English spelling:

| Sound | Current | Alternative | Effect on identical text |
|-------|---------|-------------|--------------------------|
| /s/ | s | c | −20.5K /M |
| /s/ | s | ss | −18.8K /M |
| /f/ | f | ph | −16.6K /M |
| /f/ | f | ff | −16.4K /M |

Two of these letters were real decisions, because English has a second letter that competes with them: k against c, and z against s.

### Why k, not c

**Chosen:** k for /k/: cat → kat, come → kuhm, back → bak.

**Considered:** c. It would have kept far more text identical: the script measures **+5.7K /M** for c and **+990 /M** for ck (as in "back"). It lost because English reads c two ways. Before e, i and y it is /s/ (cent, city, cycle), and anywhere else it is /k/. If /k/ were spelled c, "keep" would become "ceep" and "kid" would become "cid", which an English reader says as "seep" and "sid". One of Ingglish's yardsticks is that readers say a word right on first sight; the [Pronounceability](metrics.md#pronounceability) score measures it. The letter k has only one reading in English, so it cannot mislead. Neither c nor ck shows up in the exhaustive search either. That search tried 70 spellings for every sound and kept only the changes that make more text identical without causing a collision. It found six, and all six are vowels (see [Testing Every Alternative](identical-words-analysis.md)).

**Precedent:** [How Other Languages Spell It](orthography-comparison.md#commonality-ratings-summary) rates each spelling by how many of 37 languages use it for the same sound: Universal (most of them), Common (five or more, from several language families), Regional (two to four) or Rare (one language, or only Ingglish). k for /k/ is Universal.

### Why s and z are kept apart

**Chosen:** s is always /s/ and z is always /z/: rose → rohz, is → iz, was → woz.

**Considered:** s for both sounds, as English often does. This is the largest consonant gain Ingglish gives up: the script measures **+19.3K /M**, because "is", "was" and "his" would stay identical. It lost because /s/ and /z/ tell apart many pairs of English words. With one letter for both, these would collide:

| English | Ingglish |
|---------|----------|
| rice, rise | rais, raiz |
| loose, lose | loos, looz |
| face, phase | fays, fayz |
| bus, buzz | buhs, buhz |

Only z keeps each pair apart. The cost is familiarity: most English words with /z/ spell it with s, so its familiarity score is only 3%.

**Precedent:** s and z for /s/ and /z/ are both Universal among the compared languages.

### Sounds Ingglish doesn't write down

Ingglish spells each word's sounds as a speaker thinks of them, not every detail of how they come out. Americans say the t in "butter" and "water" as a quick tap, close to a d, but Ingglish still writes t (butter → buhter, water → wawter). The puff of air after the p in "pin" but not in "spin" is not written either. These details are predictable from the surrounding sounds and never tell two words apart. See [Flapping](dialect-assumptions.md#flapping-allophonic-detail).

## Letters Ingglish Never Uses

Three letters never appear on their own in Ingglish: c, q and x. Each stands for sounds that already have a letter:

| Letter | Ingglish replaces it with | English | Ingglish |
|--------|---------------------------|---------|----------|
| c | k, s or ch | cat, city, cello | kat, sitee, cheloh |
| q | k (usually kw) | queen, quick, liquor | kween, kwik, liker |
| x | ks, gz or z | box, exam, xylophone | boks, igzam, zailafohn |

The letter c survives only inside the pair "ch" (see [CH and J](#ch-and-j)). A q is always a /k/, usually followed by /w/, so it adds nothing that "kw" doesn't already say. An x is worse: it hides a pair of sounds, and which pair depends on how the word is said ("box" has /ks/, "exam" has /gz/, and at the start of a word it is usually just /z/).

## TH and DH

English uses "th" for two different sounds. Ingglish gives each its own spelling.

| Sound | Spelling | English | Ingglish |
|-------|----------|---------|----------|
| /θ/ (voiceless, as in "think") | th | think, bath, thin | thingk, bath, thin |
| /ð/ (voiced, as in "this") | dh | the, this, then | dha, dhis, dhen |

The two sounds differ the way s and z do: the tongue is in the same place, but for /ð/ the voice is on.

**Chosen:** th for /θ/, dh for /ð/. Pairs of English words that differ only in this sound look different in Ingglish:

| English | Ingglish |
|---------|----------|
| thigh, thy | thai, dhai |
| ether, either | eether, eedher |
| teeth, teethe | teeth, teedh |

**Considered:**

- **th for both sounds.** This keeps "the", one of the most common words in English, identical, and it is the choice of conservative reform proposals, the ones that change as little of English spelling as they can. The survey of today's reform proposals on [Reforms Proposed Today](community-landscape.md#consonants) records the split as the most debated consonant question. One designer argues that "the distinction between /θ/ and /ð/ is too rarely important in English to justify using two letters." Ingglish splits them anyway, because one letter for two sounds is exactly the ambiguity its first goal rules out, and because pairs like thigh and thy do exist. The price is the most visible change in Ingglish, "the" → "dha". English never spells this sound "dh", so its familiarity score is 0%.
- **dd**, as Welsh writes /ð/. Rejected because English readers see "dd" as a doubled d (ladder, add), while "dh" follows the pattern of "th" and "sh".
- **ð (eth)**, as Icelandic writes it. Rejected because it cannot be typed on a standard keyboard (see [ASCII vs. Diacritics](community-landscape.md#ascii-vs-diacritics-vs-new-characters)).

**History:** unchanged since the first version of Ingglish (January 2026).

**Precedent:** dh is an official letter of the Albanian alphabet, and Arabic romanization uses it too. Few languages need a spelling at all: according to the [PHOIBLE](https://phoible.org/) database, only about 4% of the world's languages have /θ/ and about 7% have /ð/, so no standard Latin spelling ever emerged. See [the phoneme frequency table](orthography-comparison.md#phoneme-frequency-how-common-are-these-sounds).

## SH and ZH

| Sound | Spelling | English | Ingglish |
|-------|----------|---------|----------|
| /ʃ/ (as in "she") | sh | she, nation, sure, ocean | shee, nayshan, shur, ohshan |
| /ʒ/ (as in "measure") | zh | measure, vision, beige, genre | mezher, vizhan, bayzh, zhonra |

**Chosen:** sh for /ʃ/ and zh for /ʒ/. The pair works like s and z: sh is to zh as s is to z, so a reader who knows sh can guess zh.

"sh" is already the usual English spelling of /ʃ/ (63.5% familiarity), but English also writes the sound as ti, ci, s or ch (nation, social, sure, chef → shef). Ingglish makes "sh" the only spelling.

The sound /ʒ/ is rare in English and has no spelling of its own. It hides in s (measure), si (vision), g (beige, genre) and z (azure → azher). So "zh" is new to every English reader (0% familiarity). A new spelling was unavoidable, and zh is the one that follows from sh.

**History:** both unchanged since the first version.

**Precedent:** sh is used by Albanian, Swahili, Hausa and Somali, and by several romanizations. It is rated Common. zh is the standard romanization of Russian and Ukrainian Ж and is also used by Albanian and Hindi romanization, so it is rated Common too. See [How Other Languages Spell It](orthography-comparison.md#consonants). Among today's reform proposals, sh is near-universal and zh is the most common choice.

## CH and J

| Sound | Spelling | English | Ingglish |
|-------|----------|---------|----------|
| /tʃ/ (as in "chat") | ch | chat, church, batch, nature | chat, cherch, bach, naycher |
| /dʒ/ (as in "just") | j | just, edge, gem, giant | juhst, ej, jem, jaiant |

**Chosen:** ch for /tʃ/ and j for /dʒ/, the spellings English readers already know best. In Ingglish, ch never means /k/ or /ʃ/ as it can in English (character → kairikter, chef → shef), and g is never soft: gem and giant take j, while give → giv and gift → gift keep a hard g.

**Considered:** English's other spellings of /dʒ/. The script measures both as losses: **−490 /M** for g and **−740 /M** for dge. Some reform proposals write /dʒ/ as two letters (dj, dž) to show that it is a d followed by a zh sound. Ingglish keeps the single j that English readers already say correctly.

**History:** both unchanged since the first version.

**Precedent:** ch is used by English, Spanish, Portuguese and Pinyin (Common); j by English, Indonesian, Swahili, Hausa and Somali (Common).

## NG

| English | Ingglish | Sounds |
|---------|----------|--------|
| sing, thing, singer | sing, thing, singer | /ŋ/ |
| think, bank, uncle | thingk, bangk, uhngkal | /ŋ/ + /k/ |
| finger, longer, English | fingger, lawngger, Ingglish | /ŋ/ + /g/ |

**Chosen:** ng for /ŋ/, the sound at the end of "sing". It is already the English spelling in most words that have the sound (82.8% familiarity).

Two consequences look unusual at first:

- **ngk.** English writes /ŋk/ as "nk" (think, bank). In Ingglish, n is always /n/, so the /ŋ/ has to be written: think → thingk.
- **ngg.** English spells "singer" and "finger" with the same "ng", but only "finger" has a /g/ after the /ŋ/. Ingglish writes what is said: singer → singer, finger → fingger. That is where the double g in "Ingglish" comes from.

The dictionary never has an /n/ followed directly by /g/. Words such as "engage" and "congress" are transcribed with /ŋ/ + /g/ (engage → enggayj, congress → konggras). So in Ingglish, "ng" always means /ŋ/.

**History:** unchanged since the first version.

**Precedent:** ng is rated Universal: at least 15 of the compared languages write /ŋ/ this way.

## Y and W

| English | Ingglish |
|---------|----------|
| yes, you, yellow | yes, yoo, yeloh |
| million, onion | milyan, uhnyan |
| cute, music, few | kyoot, myoozik, fyoo |
| wet, away | wet, away |
| which, where | wich, wair |
| what, who, whole | wuht, hoo, hohl |

**Chosen:** y for /j/, the sound at the start of "yes", and w for /w/. English readers already read both letters this way (familiarity 90.7% and 91.1%).

Outside the vowel spelling "ay" (say, day), y is always this consonant, never a vowel. That is also why Ingglish does not spell the vowel of "my" as y, even though the exhaustive search rates that change the biggest gain for any sound (+10.1K /M); the reasoning is on [Vowels, Sound by Sound](vowel-spellings.md#price-my-time-ai).

Two accent choices affect these letters:

- **wh.** Ingglish writes "which" and "witch" the same (wich), as most American and British speakers say them. Speakers who begin "which" with a breathy "hw" lose that difference. When English "wh" is said /h/, Ingglish writes h: who → hoo. See [the wine–whine merger](dialect-assumptions.md#the-wine-whine-merger).
- **The y sound before "oo".** Ingglish keeps it where General American says it (cute → kyoot, music → myoozik) and drops it after t, d, n and s, where Americans drop it (new → noo, tune → toon). See [Which Accent](dialect-assumptions.md#yod-dropping-after-coronals).

**Precedent:** y for /j/ follows English, Indonesian, Swahili, Turkish and Pinyin (Common); German, Dutch and most Slavic languages write it j instead. w is rated Common.

## When Two Letters Meet Across a Word Part

Ingglish's letter pairs (sh, th, dh, zh) all end in h. When one part of a word ends in s, t, d or z and the next part begins with h, the same two letters appear, but they spell two separate sounds:

| English | Ingglish | Letters | Could be misread as |
|---------|----------|---------|---------------------|
| household | houshohld | s + h | the "sh" of "she" |
| mishap | mishap | s + h | the "sh" of "she" |
| sweetheart | sweethart | t + h | the "th" of "think" |
| childhood | chaildhud | d + h | the "dh" of "this" |
| adhere | adheer | d + h | the "dh" of "this" |
| clotheshorse | klohzhors | z + h | the "zh" of "measure" |

**Chosen:** Ingglish accepts this. Standard English has the same problem (compare "hothouse" with "nothing"), and a reader who knows the word parts sees the break. The translator's reverse direction, from Ingglish back to English, tries both readings, so these words still convert back correctly. See [Reading Ambiguities](orthographic-transparency.md#reading-ambiguities).

The same rule explains Ingglish's double consonants. English doubles a consonant to show that the vowel before it is short (hopping, hoping). Ingglish spells the vowel itself, so it never needs that signal. A doubled letter in Ingglish means the sound really occurs twice, where two word parts meet:

| English | Ingglish |
|---------|----------|
| bookkeeper | bukkeeper |
| unknown | annohn |
| nighttime | naittaim |
| hopping | hoping |
| hoping | hohping |

One side effect: "hopping" in Ingglish is spelled like the English word "hoping". Words like this are covered in [Homophones & False Friends](false-friends.md). The one exception to "a double consonant is two sounds" is the vowel+R spelling "arr" (carrot → karrat), covered in [R-Colored Vowels](vowel-spellings.md#r-colored-vowels).

## How Familiar the Consonants Look

[Spelling Familiarity](metrics.md#spelling-familiarity) asks, for every word containing a sound: does the English spelling of that word contain the Ingglish spelling of the sound anywhere? The answers are weighted by how often each word appears in ordinary text. The metric is rough, since it doesn't check that the letters actually spell that sound in the word, but it shows which spellings will look new.

| Sound | Ingglish spelling | Familiarity |
|-------|-------------------|-------------|
| /b/, /d/, /h/, /l/, /m/, /n/, /p/, /r/ | b, d, h, l, m, n, p, r | 100% |
| /θ/ ("think") | th | 100% |
| /g/ | g | 98.7% |
| /t/ | t | 98.3% |
| /f/ | f | 95.8% |
| /s/ | s | 91.2% |
| /w/ | w | 91.1% |
| /j/ ("yes") | y | 90.7% |
| /ŋ/ ("sing") | ng | 82.8% |
| /tʃ/ ("chat") | ch | 80.8% |
| /v/ | v | 72.5% |
| /ʃ/ ("she") | sh | 63.5% |
| /dʒ/ ("just") | j | 61.5% |
| /k/ | k | 47.3% |
| /z/ | z | 3.0% |
| /ð/ ("this") | dh | 0.0% |
| /ʒ/ ("measure") | zh | 0.0% |

The low scores are the decisions argued above. Choosing k over c, z over s and dh over th each keeps a sound on a single spelling, and each costs familiarity. The /v/ score is lower than the letter's reputation suggests because one very common word, "of" → "uhv", spells its /v/ with an f. Across all 39 sounds, vowels included, the current spellings score 64.17%.

## Methodology

All numbers on this page come from scripts in `packages/core/scripts/analysis/`, run at commit 0601e97b:

- `analyze-identical-words.ts`: the /M effect of each alternative spelling (c, ck, ss, ph, ff, s for /z/, g and dge for /dʒ/).
- `exhaustive-search.ts`: tests every one of 70 candidate spellings for each of the 39 sounds and reports the changes that make more words identical without adding collisions. It found six, all of them vowels.
- `familiarity-search.ts`: the per-sound familiarity scores.

Word frequencies are from SUBTLEX-US, a count of the words in 49.7 million words of film and TV subtitles. Pronunciations are from the CMU Pronouncing Dictionary (126,051 words). Every Ingglish spelling on this page was checked with the translator, and the docs test suite checks the tables again on every change. The spelling of each sound is defined in `packages/phonemes/src/ingglish-maps.ts`.
