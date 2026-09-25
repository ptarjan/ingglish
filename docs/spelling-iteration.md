# Spelling Iteration Log

Every change we made to how Ingglish spells a sound: what we tried, what worked, what didn't, and why.

A few terms come up throughout:

- **Identical word**: a word Ingglish spells exactly as English does (out → out).
- **/M**: occurrences per million words of real English text, which measures how often a reader actually meets a word.
- **Collision**: two different English words ending up with the same Ingglish spelling (so a reader can't tell which is meant). A **collision group** is one such set of words that share a spelling.
- **IPA**: the International Phonetic Alphabet, the standard notation for sounds. Slashes mark a sound: /aɪ/ is the vowel in "my".
- **Diphthong**: a vowel that glides from one sound to another, like the vowel in "my" or "cow".
- **ARPAbet**: the notation used by the CMU pronouncing dictionary that Ingglish is built on. A digit after a vowel marks stress (how strongly a syllable is said): AH0 is unstressed, AH1 and AH2 are stressed.
- **Ratings** (from Universal down through Common, Regional and Rare): how widely the world's languages use a spelling for that sound. See [Commonality Ratings](orthography-comparison.md#commonality-ratings-summary).

## Summary of Changes

| Sound | IPA | Spelling | Changes |
|-------|-----|----------|---------|
| my, time | /aɪ/ | **ai** | ii → ie → ai |
| cow, out | /aʊ/ | **ou** | ow → ou |
| go, show | /oʊ/ | **oh** | o → oh |
| father, hot | /ɑ/ | **o** | ah → o |
| thought, law | /ɔ/ | **aw** | aw → o → aw |
| book, put | /ʊ/ | **u** | uu → oo → u |
| too, blue | /uː/ | **oo** | oo → uu → oo |
| arrow, carrot | /æɹ/ | **arr** | aar → arr |
| but, cup | /ʌ/ | **uh** | u → uh |
| schwa (about, sofa) | /ə/ | **a** | u → a (AH0 only) |

## Diphthong Evolution

### /aɪ/ (my, time): ii → ie → ai

**Attempt 1: 'ii'**
- Rationale: a doubled letter for a long sound
- Problem: "fiit" looked like "feet"
- Verdict: ❌ Rejected: readers confused it with a different word

**Attempt 2: 'ie'**
- Rationale: matches English "tie", "pie", "die"
- Problem: still felt arbitrary, and no other language uses it this way
- Verdict: ⚠️ Better, but not ideal

**Attempt 3: 'ai' (current)**
- Rationale:
  - It spells out the sound directly: /aɪ/ is an "a" gliding into an "i", and you can see that glide in the letters
  - Pinyin (the standard romanization of Mandarin Chinese), Italian and Vietnamese all use 'ai'
  - English 'ai' words (rain, paint) use /eɪ/, so 'ai' is available
- Impact: more identical words than 'ii' or 'ie'. 'ei' wins on a raw dictionary count, but weighted by frequency it comes out at -1 /M: its gains are mostly rare German surnames like Bernstein and Alzheimer, which almost never appear in real text.
- Verdict: ✅ **Adopted**: used by other languages, and the spelling shows the sound

**Examples:**
- my → mai
- time → taim
- night → nait
- I → ai

### /aʊ/ (cow, out): ow → ou

**Attempt 1: 'ow'**
- Rationale: matches English "cow", "now", "how", "wow"
- Problem:
  - Words like "out", "loud", "sound" became "owt", "lowd", "sownd"
  - These looked unfamiliar, even though 'ow' matches some English words
  - Rated only "Regional", since English is the only language that uses 'ow' for this sound
- Verdict: ⚠️ Workable but not the best choice

**Attempt 2: 'ou' (current)**
- Rationale:
  - "out", "loud", "sound" come out IDENTICAL to English
  - Dutch also uses 'ou' for this sound (oud = old)
  - Upgraded from a "Regional" to a "Common" rating
- Impact: a large gain over 'ow', because out (3,965 /M), about (3,725 /M), our (1,308 /M), sound (141 /M) and found (121 /M) are among the most common words in English
- Trade-off: "cow" → "kou" looks less familiar
- Verdict: ✅ **Adopted**: keeping common words identical is worth making rarer words look unfamiliar

**Examples:**
- out → out (identical!)
- our → ouer
- loud → loud (identical!)
- sound → sound (identical!)
- cow → kou
- house → hous

### /oʊ/ (go, show): o → oh

**Attempt 1: 'o'**
- Rationale: simple, and 'o' is the usual letter for this kind of vowel in languages written in the Latin alphabet (though English /oʊ/ glides between two vowel sounds, unlike the single steady /o/ of Spanish or Italian)
- Problem: we first spelled /ɑ/ as 'ah' (hot → "haht", rock → "rahk"), but readers said 'ah' looked too foreign. Switching /ɑ/ to 'o' made those words look natural (hot → "hot", rock → "rok"), but it took 'o', so /oʊ/ could no longer use it.
- Verdict: ❌ Rejected: 'o' was already taken by /ɑ/

**Attempt 2: 'oh' (current)**
- Rationale:
  - English already spells the exclamation "oh!" this way
  - "go" (goh) and "cow" (kou) can't be confused
  - It was the only option left once 'o' went to /ɑ/
- Trade-off: 'ow' would make show (501 /M), own (471 /M) and throw (132 /M) identical, but would lose "oh" (3,374 /M), for a net -1,330 /M. 'oa' does even worse. Both also make words easy to misread (see attempt 3 below).
- Verdict: ✅ **Adopted**: needed to keep /oʊ/ apart from /ɑ/

**Attempt 3: 'ow' (rejected)**
- Rationale: would make snow, throw, bowl and window identical to English. It gains show (501 /M), own (471 /M) and throw (132 /M), but nets -1,330 /M because "oh" alone is 3,374 /M.
- Problem: English uses `ow` for two sounds: /oʊ/ (snow, throw) and /aʊ/ (cow, town). New spellings like `bownz` (bones) read as "bowns", and `howm` (home) looks like it rhymes with "cow". That brings back exactly the ambiguity Ingglish exists to remove.
- Verdict: ❌ Rejected: readers would mispronounce words, even though no two words would share a spelling

**Examples:**
- go → goh
- show → shoh
- hello → haloh

## Vowel Evolution

### /ɑ/ (father, hot): ah → o

**Attempt 1: 'ah'**
- Rationale: an accurate spelling of the "ah" sound in "father"
- Problem:
  - "rock" → "rahk" looked strange
  - "hot" → "haht" was unrecognizable
- Verdict: ❌ Rejected: words looked too foreign

**Attempt 2: 'o' (current)**
- Rationale:
  - "rock" → "rok" looks natural
  - "hot" → "hot" (identical!)
  - 'o' is the usual letter for this kind of vowel across languages written in the Latin alphabet
- Impact: a large gain over 'ah': hot (195 /M), got (222 /M), job (153 /M) and lot (141 /M) are all common words that become identical
- Verdict: ✅ **Adopted**: words look familiar

**Examples:**
- hot → hot (identical!)
- rock → rok
- father → fodher

### /ɔ/ (thought, law): aw → o → aw

No vowel changed more times than this one.

**Attempt 1: 'aw'**
- Rationale: matches English "law", "saw", "raw"
- Worked reasonably well
- Verdict: ⚠️ Acceptable

**Attempt 2: 'o' (caught-cot merger)**
- Rationale: simplify by spelling /ɔ/ the same as /ɑ/, since many Americans pronounce them alike (so "caught" and "cot" sound the same)
- Problem:
  - Speakers who still pronounce the two vowels differently lost that distinction
  - It forced /oʊ/ over to 'oh' to avoid a clash
- Verdict: ❌ Rejected: lost too much information

**Attempt 3: back to 'aw' (current)**
- Rationale:
  - "thought" → "thawt" is readable
  - "law" → "law" (identical!)
  - Keeps the distinction for speakers who make it
  - Rated "Common": matches English "law", "saw"
- Impact: merging into 'o' would add 176 collision groups. The other alternative, 'au', avoids collisions but loses 555 /M: saw (413 /M), law (119 /M) and lawyer (82 /M) outweigh what it gains in fault (107 /M), paul (97 /M) and launch (20 /M).
- Verdict: ✅ **Adopted**: keeps the distinction, and words look familiar

**Examples:**
- law → law (identical!)
- thought → thawt
- call → kawl

### /ʊ/ and /uː/ Swap: oo ↔ uu (superseded)

**Original:**
- /ʊ/ (book) → 'uu'
- /uː/ (too) → 'oo'

**Problem:**
- "book" → "buuk" looked strange when English already spells it "book"
- "too" → "too" was identical, but the long vowel had the shorter spelling

**After Swap:**
- /ʊ/ (book) → 'oo' - matches English "book", "good", "look"
- /uː/ (too) → 'uu' - the longer sound gets the longer spelling, as in Finnish, which doubles a vowel to make it long

**Impact:** the original assignment gives more identical words if every dictionary word counts equally, but frequency tells a different story. The swap keeps "would" (1,813 /M), "good" (2,677 /M), "could" (1,475 /M), "should" (803 /M), "look" (1,038 /M), "book" (182 /M) and "looking" (476 /M) identical. These common words far outweigh the rare words it loses.

**Verdict:** ⚠️ **Adopted then superseded**: changing /ʌ/ to 'uh' later freed 'u' for /ʊ/ and 'oo' for /uː/; see [the /ʌ/, /ʊ/, /uː/ change below](#and-u-chain-uoouu-uhuoo)

**Later considered: 'eu' for /uː/ (rejected)**
- Rationale: would gain 19 /M (zeus 6 /M, neutral 4 /M, maneuver 3 /M) and lose very little
- Problem: in English, `eu` starts with a "y" sound: "feud" is /fjuːd/ and "neural" is /njʊɹəl/. So `meun` (moon) reads as two syllables, "mew-n"; `seun` (soon) reads as "syoon"; `teu` (too) reads as "tyoo". English readers would be actively misled.
- Lesson: counting identical words isn't enough. A spelling that matches English but reads as the wrong sound is worse than an unfamiliar spelling that reads correctly.
- Verdict: ❌ Rejected: readers would mispronounce words, and 19 /M is negligible anyway

### /ʌ/, /ʊ/, and /uː/ Chain: u/oo/uu → uh/u/oo

Three vowels moved at once. This got rid of 'uu' and gave all three vowels more intuitive spellings.

**Before (the oo/uu swap era):**
- /ʌ/ (but) → 'u'
- /ʊ/ (book) → 'oo'
- /uː/ (too) → 'uu'

**Problem:**
- English never uses 'uu': "tuu", "thruu", "byuutafal" looked alien
- Most of the world's languages write /ʊ/ as 'u', not 'oo'
- 'oo' is the natural English spelling for /uː/ (too, food, moon, cool)

**After (current):**
- /ʌ/ (but) → 'uh', since the English word "uh" is exactly this sound
- /ʊ/ (book) → 'u', the letter most languages use for this vowel
- /uː/ (too) → 'oo', matching English "too", "food", "moon", "cool"

**Rationale:**
- Everyone knows how "uh" sounds, so it is an intuitive spelling for /ʌ/
- 'u' for /ʊ/ matches most of the world's languages (rated "Universal")
- 'oo' for /uː/ matches English (too, food, moon, cool, school)
- 'uu' is gone entirely

**Impact:**
- "too" → "too" (identical!), "food" → "food" (identical!), "moon" → "moon" (identical!), "school" → "skool", "blue" → "bloo", "you" → "yoo"
- "book" → "buk", "good" → "gud", "could" → "kud", "would" → "wud", "should" → "shud", "put" → "put" (identical!), "look" → "luk"
- "but" → "buht", "cup" → "kuhp", "love" → "luhv", "of" → "uhv"
- Some /ʊ/ words stop being identical (book, good, could, would, should, look), but some /uː/ words become identical (too, food, moon), and the unfamiliar 'uu' is gone

**Verdict:** ✅ **Adopted**: removes 'uu', matches most languages, and 'oo' matches English

**Examples:**
- but → buht
- cup → kuhp
- love → luhv
- book → buk
- good → gud
- could → kud
- too → too (identical!)
- food → food (identical!)
- school → skool
- beautiful → byootafal
- through → throo

### /ə/ (about, sofa): u → a

Schwa (/ə/) is the most common vowel in English: the weak, unstressed "uh" found in nearly every word of more than one syllable (about, the, beautiful, difficult, nation). This change affects **unstressed schwa** only. The stressed /ʌ/ in "but", "cup", "run" is spelled 'uh'; linguists call it the STRUT vowel.

**Attempt 1: 'u'**
- Rationale: ARPAbet writes both /ə/ and /ʌ/ as 'AH', so spelling every AH as 'u' was the simplest approach
- Problem:
  - "the" → "dhu" (unrecognizable, and "the" is the most common English word)
  - "about" → "ubout" (no longer identical to English)
  - "hello" → "huloh" (the 'u' in the first syllable looked odd)
  - "nation" → "nayshun" (the '-un' ending felt wrong for a word ending in /-ən/)
  - "beautiful" → "byootufool" (confusing)
- Verdict: ❌ Rejected: words with schwa looked too unfamiliar

**Attempt 2: 'a' (current)**
- Rationale:
  - "about" → "about" (identical!), "and" → "and" (identical!), "the" → "dha" (natural)
  - 'a' sounds close to schwa, and many languages use 'a' for their neutral vowel
  - English already spells schwa 'a' in some of its most common words: **a**, **about**, **again**, **along**, **away**, **around**, all identical in Ingglish
  - Stressed /ʌ/ keeps its own spelling ('uh'), so schwa words don't collide with STRUT words
- Impact:
  - **67.6× frequency-weighted improvement**, the largest gain from any single change
  - Top gains: "a" (20,941 /M), "and" (13,733 /M), "about" (3,725 /M), "around" (1,428 /M)
  - Only 93 more collision groups, most of them rare words
  - The losses follow predictable patterns: the un- prefix (until→antil), the up- prefix (upset→apset), the -ful suffix (handful→handfal) and the -um suffix (museum→myoozeeam)
- Trade-off: schwa before R (AH0+R) must stay 'ur', not 'ar', or it would collide with the /ɑ/+R sound (AA+R), which is spelled 'ar'. A special rule for vowels before R handles this and takes priority over the schwa rule.
- Verdict: ✅ **Adopted**: a big gain in familiar-looking words at little cost

**Examples:**
- about → about (identical!)
- and → and (identical!)
- the → dha
- again → agen (identical!)
- hello → haloh
- beautiful → byootafal
- difficult → difakalt
- nation → nayshan

## R-Colored Vowel Evolution

An R-colored vowel is a vowel followed by R, as in "air", "beer", "star" and "store". We added special spellings for these one at a time to fix collisions and make words easier to read. Together, these rules (air, eer, ar, or, arr) make many common words identical and prevent 25 collision groups.

### /æ/+R: aar → arr

**Attempt 1: 'aar'**
- Rationale: double the vowel before R
- Problem: "arrow" → "aaroh" looked strange

**Attempt 2: 'arr' (current)**
- Rationale:
  - English already doubles the consonant after a short vowel (carrot, barrel, arrow)
  - "arrow" → "arroh" is easier to recognize
  - Upgraded from a "Rare" to a "Regional" rating
- Verdict: ✅ **Adopted**: follows English convention

**Examples:**
- arrow → arroh
- carrot → karrat
- barrel → barral

### /ɛ/+R → 'air' (added)

**Before:** No special handling
- "air" → "er" (collision with "her")
- "there" → "dher" (collision with "the" + "her")

**After:** a rule that spells /ɛ/ as 'ai' when R follows
- "air" → "air" (identical!)
- "there" → "dhair"
- "care" → "kair"

**Verdict:** ✅ Essential: stops /ɛ/+R words from colliding with /ɝ/ words like "her"

### /ɪ/+R → 'eer' (added)

**Before:** No special handling
- "beard" → "bird" (looks like the animal)
- "beer" → "bir" (unrecognizable)
- "fear" → "fir" (looks like the tree)

**After:** a rule that spells /ɪ/ as 'ee' when R follows
- "beard" → "beerd"
- "beer" → "beer" (identical!)
- "fear" → "feer"
- "near" → "neer"

**Verdict:** ✅ Essential: removed spellings that looked like other English words

### /ɑ/+R → 'ar' (added)

**Before:** No special handling
- "star" → "stor" (collision with "store")

**After:** a rule that spells /ɑ/ as 'a' when R follows
- "star" → "star" (identical!)
- "car" → "kar"

**Verdict:** ✅ Essential: removed major collisions

### /ɔ/+R → 'or' (added)

**Before:** No special handling
- "store" → "stawr" (confusing)

**After:** a rule that spells /ɔ/ as 'o' when R follows
- "store" → "stor"
- "more" → "mor"

**Verdict:** ✅ Essential: natural spellings

## Lessons

### 1. Identical Words Are a Big Win (But Not Everything)
A word spelled the same in English and Ingglish (out→out, loud→loud, too→too, law→law) is as familiar as a word can be. We favor spellings that create more identical words, but **never at the cost of collisions** (different words sharing a spelling).

Current status: **10,150 identical words** (8.05% of 126,051 dictionary words). The schwa change (AH0 → 'a') produced the largest frequency-weighted gain of any single change (67.6×). See [Identical Words Analysis](identical-words-analysis.md) for a frequency-weighted look at possible further improvements.

### 2. Other Languages Matter
A spelling used by several languages (like 'ai' in Pinyin, Italian and Vietnamese) is easier to defend than one only English uses.

### 3. Collisions Must Be Fixed
Without the R-colored vowel rules, "air" and "her" would both be spelled "er". Fixing collisions matters more than keeping the rules simple.

### 4. Rating Upgrades
Several changes were made specifically to raise that rating:
- 'arr' (was 'aar'): Rare → Regional
- 'ou' (was 'ow'): Regional → Common
- 'u' for /ʊ/: Regional → Universal
- 'oo' for /uː/: Common

### 5. Reverting Is Fine
The /ɔ/ vowel went aw → o → aw. When a change didn't work, we undid it. The goal is the best final system, not loyalty to early decisions.

### 6. Identical Word Count Can Mislead
A spelling that matches more English words does harm if English readers then mispronounce new words spelled the same way. The real test isn't "does this string match an English word?" but "will an English reader say it correctly?" See [Design Decisions](design-decisions.md#diphthong-decisions) for examples.

### 7. Splitting a Sound by Stress Can Pay Off
The schwa change split ARPAbet's AH into two spellings by stress: unstressed AH0 → 'a', stressed AH1/AH2 → 'uh'. That needed logic in the translator's code, not just a row in the mapping table. When one dictionary symbol covers two sounds English speakers hear as different (like /ə/ and /ʌ/), a split by stress is worth considering. See [Identical Words Analysis](identical-words-analysis.md#stress-conditioned-alternatives) for other candidates.

## Changes Not Made (Considered and Rejected)

### Using 'au' for /aʊ/ instead of 'ou'
- Would match German, Dutch and Portuguese
- Rejected because 'ou' keeps common words identical (out 3,965 /M, about 3,725 /M, our 1,308 /M, sound 141 /M), and 'au' would lose them

### Using pure IPA-style spellings throughout
- Would be more consistent with other languages
- Rejected because Ingglish is mainly for English speakers

### Removing the R-colored vowel rules
- Would simplify the system
- Rejected because common words would stop being identical (star, air, beer, store, etc.) and 25 collision groups would appear

## Version History

For the complete git history, see:
```bash
git log --oneline --all --grep="spelling\|phoneme\|vowel\|diphthong"
```
