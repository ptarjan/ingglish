# Spelling History: Every Change and Why

This page lists every change to how Ingglish spells a sound, in the order it happened, with the date and the commit. Each entry says what changed, what it replaced and why, in a line or two. The full reasoning and measurements for each sound are on [Vowels, Sound by Sound](vowel-spellings.md), and the goals every change served are on [How It Was Designed](design-decisions.md).

Every change so far has been to a vowel. The consonant spellings have not changed since the first version; [Consonants, Sound by Sound](consonant-spellings.md) explains why.

A few terms used below:

- **Sound names**: capitalized names such as PRICE, GOAT and THOUGHT are the standard names linguists use for English vowels, each named after a word containing the vowel. IPA symbols between slashes give the same sounds: /aɪ/ is the vowel of "my".
- **Identical word**: a word whose Ingglish spelling is the same as its English spelling ("out" → "out").
- **/M**: "per million words of running text". A change worth +5K /M makes 5,000 more words in every million words of ordinary English text come out spelled as in English.
- **Collision**: two different English words that end up with the same Ingglish spelling.
- **The search**: a script that tries 70 candidate spellings for every sound and scores each one; see [Testing Every Alternative](identical-words-analysis.md).
- **R-colored vowel**: a vowel blended with a following R, as in "star", "air" and "beer".

## Summary of Changes

| Sound | IPA | Spelling now | Changes |
|-------|-----|--------------|---------|
| my, time (PRICE) | /aɪ/ | **ai** | ai → ii → ie → ai |
| cow, out (MOUTH) | /aʊ/ | **ou** | ow → ou |
| go, show (GOAT) | /oʊ/ | **oh** | oh → o → oh |
| father, hot (LOT) | /ɑ/ | **o** | ah → o |
| thought, law (THOUGHT) | /ɔ/ | **aw** | aw → o → aw |
| book, put (FOOT) | /ʊ/ | **u** | uu → oo → u |
| too, blue (GOOSE) | /uː/ | **oo** | oo → uu → oo |
| but, cup (STRUT) | /ʌ/ | **uh** | u → uh |
| about, sofa (schwa) | /ə/ | **a** | u → a (unstressed only) |
| vowel + R | | **ar, or, air, arr, eer, ur, uhr** | added one at a time; the spelling for the vowel of "arrow" went aar → arr |

The other vowels (sit, bed, cat, see, say, boy, and the er of "her") have kept their first spelling.

## The Log

### 5 January 2026: the first spellings

Commit ea62835b. The first version spelled the vowels ah (father), a (cat), u (but and about), aw (law), ow (cow), ai (my), e (bed), er (her), ay (say), i (sit), ee (see), oh (go), oi (boy), uu (book) and oo (too), with no special spellings before R.

### /oʊ/ (go): oh → o

5 January 2026, commit 57efb393. Shortened so that "go" stayed "go". Reversed five days later; see below.

### /aɪ/ (my): ai → ii

10 January 2026, commit 32482523. A doubled letter for a long sound. Replaced the next day:

**Problem:** "fiit" (fight) looked like "feet".

### /ɔ/ (law): aw → o, and /oʊ/ (go): o → oh

10 January 2026, commit 0f883440. Many Americans say "caught" and "cot" alike (the cot–caught merger), so this change tried spelling them alike too: the THOUGHT vowel took o, and GOAT moved back to oh to make room.

**Problem:** "dawn" and "don", "taught" and "tot" merged, losing a distinction many speakers make. See [THOUGHT](vowel-spellings.md#thought-law-taught-aw).

### /ɑ/ (hot): ah → o, and /ɔ/ (law): o → aw

11 January 2026, commit a16f7a4c, less than a day after the change above. "Haht" (hot) and "rahk" (rock) looked foreign, so LOT took o and THOUGHT went back to aw. GOAT stayed oh, since o was taken again. See [LOT and PALM](vowel-spellings.md#lot-and-palm-hot-father-o).

**Examples:**
- hot → hot
- rock → rok
- law → law
- thought → thawt

### Vowel + R: ar, or, air and aar added

11 January 2026, commits 976c7824, 72ba3227 and da12c032. Without them, "star" was spelled like "store", "air" like "her", and "barrow" like "borrow". Each vowel before R got its own spelling. See [R-Colored Vowels](vowel-spellings.md#r-colored-vowels).

**Examples:**
- star → star
- store → stor
- air → air
- care → kair

### /aɪ/ (my): ii → ie

11 January 2026, commit ddae380f. ie matches English "tie", "pie" and "die", and fixed the "fiit" problem.

### /ʊ/ (book) and /uː/ (too): uu/oo swapped to oo/uu

11 January 2026, commit b7804b92. FOOT took oo so that book, good and look matched English, and GOOSE took uu, a longer spelling for the longer sound, as Finnish writes it. Replaced six weeks later by the chain shift.

### /æ/ + R (arrow): aar → arr

11 January 2026, commit 0cd69063. "Aaroh" (arrow) looked strange. English already doubles the consonant after a short vowel (carrot, barrel).

**Examples:**
- arrow → arroh
- carrot → karrat
- barrel → barral

### /aɪ/ (my): ie → ai

11 January 2026, commit 72cea61c. ai shows the glide from a to i, matches the IPA symbol /aɪ/, and is how Pinyin, Italian and Vietnamese spell the sound. English ai spells the vowel of "rain", but Ingglish spells that vowel ay, so ai was free. See [PRICE](vowel-spellings.md#price-my-time-ai).

**Examples:**
- my → mai
- time → taim
- night → nait

### /aʊ/ (cow, out): ow → ou

12 January 2026, commit c08cb52e. ou keeps out, about, loud, sound and found spelled as in English, and Dutch uses it too. The trade-off: "cow" becomes "kou". See [MOUTH](vowel-spellings.md#mouth-cow-out-ou).

**Examples:**
- out → out
- loud → loud
- cow → kou

### /ɪ/ + R (beer): eer added

9 February 2026, commit 6d27d497.

**Before:** "beard" was spelled "bird", and "beer" was "bir".

**After:**
- beard → beerd
- beer → beer
- fear → feer

### /ə/ (about, sofa): u → a

16 February 2026, commit eac63596. The CMU Pronouncing Dictionary, the free dictionary of American pronunciations that Ingglish is built on, writes the weak vowel of "about" (schwa) and the stressed vowel of "but" with one symbol, AH, followed by a digit for stress: AH0 is unstressed, AH1 and AH2 are stressed. Ingglish split them: unstressed AH0 became a, and stressed AH stayed u. When it was adopted, the words it made identical (a, and, about) appeared 67.6 times as often in real text as the words that stopped matching English (until, upset). Measured against today's spellings, it is still worth more identical text than any other single change. The same commit spelled AH before R as ur. See [Schwa and STRUT](vowel-spellings.md#schwa-and-strut).

**Before:** "the" was "dhu", "about" was "ubout", and "nation" was "nayshun".

**After:**
- the → dha
- about → about
- nation → nayshan

### /ʌ/, /ʊ/, /uː/: the chain shift, u/oo/uu → uh/u/oo

20 February 2026, commit 7602382b. STRUT (but) took uh, the English interjection for that sound. That freed u for FOOT (book), the letter most languages use, which freed oo for GOOSE (too), its usual English spelling. uu, which English never uses, was retired. Measured today, this change cost more identical text than any other: the old three spellings would make 21.9K /M more text identical, because just, but, up, good and look matched English. It was made for readability and precedent. See [the chain shift](vowel-spellings.md#the-chain-shift-of-february-2026).

**Examples:**
- but → buht
- book → buk
- too → too
- food → food

### Vowel + R: ur and uhr

21 February 2026, commit 599e20a1. After the chain shift, STRUT + R moved from ur to uhr (curry → kuhree), and the vowel of "tour" and "cure" (FOOT + R) took ur. The y in kyur is the y sound English says in "cure".

**Examples:**
- curry → kuhree
- tour → tur
- cure → kyur

## Lessons

1. **Identical words are a big win, but not the only one.** A word that looks the same in Ingglish and English costs a reader nothing. Today 9,385 of 126,051 dictionary words (7.45%) are identical. But the chain shift gave up identical words on purpose, for spellings that read better.
2. **Weight by frequency.** Counting dictionary words rewards spellings that match rare names. /aɪ/ as ei makes 371 more words identical, but scores −4 /M in real text, because the words it gains are rare surnames and the few it loses are more common.
3. **A spelling that misleads is worse than one that looks new.** ow for GOAT and eu for GOOSE both match English words, but "bownz" (bones) and "meun" (moon) lead readers to the wrong sound. The real test is whether an English reader says the word correctly.
4. **Collisions must be fixed, even at the cost of simple rules.** Without the R rules, "air" and "her" would share a spelling.
5. **A collision-free total can hide collisions.** The search accepts a change if the total collision count doesn't rise. Spelling /aɪ/ as y passes that test, because it removes more collisions elsewhere than it adds. But it still spells "iron" and "yearn" the same (yern), since in Ingglish y also spells the consonant at the start of "yearn".
6. **Other languages matter.** A spelling several languages already use, like ai in Pinyin, Italian and Vietnamese, is easier to defend than one only English uses.
7. **Reverting is fine.** THOUGHT went aw → o → aw, and GOAT oh → o → oh. The goal is the best final system, not loyalty to earlier decisions.
8. **Splitting a sound by stress can pay off.** The schwa split (spelling the weak vowel of "about" differently from the vowel of "but") needed a rule in the translator (the software that converts English to Ingglish), not just a new row in the table of spellings, and it was the biggest single gain. Other vowels may benefit too; see [Still Open: Unstressed Vowels](vowel-spellings.md#still-open-unstressed-vowels).

## Changes Not Made

Each of these was measured or argued and rejected. The reasoning is in the linked section.

- **y for /aɪ/** (my → "my"): y already spells the consonant of "yes". See [PRICE](vowel-spellings.md#price-my-time-ai)
- **ei for /aɪ/**: gains only rare German surnames. See [PRICE](vowel-spellings.md#price-my-time-ai)
- **oy for /ɔɪ/**: gains "boy", loses "point"; nearly a wash. See [CHOICE](vowel-spellings.md#choice-boy-coin-oi)
- **o or ow for /oʊ/**: o merges "note" with "not"; ow reads as in "cow". See [GOAT](vowel-spellings.md#goat-go-show-oh)
- **au for /ɔ/**: loses "saw" and "law". See [THOUGHT](vowel-spellings.md#thought-law-taught-aw)
- **au for /aʊ/**: loses every English ou word. See [MOUTH](vowel-spellings.md#mouth-cow-out-ou)
- **eu for /uː/**: "meun" (moon) reads as two syllables. See [GOOSE](vowel-spellings.md#goose-too-food-oo)
- **e for /iː/**: merges "here" with "her". See [FLEECE](vowel-spellings.md#fleece-see-ee)
- **Dropping the R rules**: "star" and "store" would share a spelling. See [R-Colored Vowels](vowel-spellings.md#r-colored-vowels)
- **Vowel letters with their European values** (a as in "father" and i as in "machine", the values they have in Spanish and in the IPA): more consistent with other languages, but Ingglish is written for English readers.
- **Separate spellings for unstressed vowels**: still open. See [Still Open: Unstressed Vowels](vowel-spellings.md#still-open-unstressed-vowels)

## Version History

The spelling of each sound lives in `packages/phonemes/src/ingglish-maps.ts`. Before 16 February 2026 it lived in `packages/core/src/`. To see every change:

```bash
git log --oneline --all --grep="spelling\|phoneme\|vowel\|diphthong"
```
