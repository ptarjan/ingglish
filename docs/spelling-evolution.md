# Spelling Evolution History

Every phoneme spelling change made during Ingglish development: what we tried, what worked, what didn't, and why.

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
- Rationale: Double letter for long sound
- Problem: "fiit" looked like "feet", confusing for readers
- Verdict: ❌ Rejected - visual confusion

**Attempt 2: 'ie'**
- Rationale: Matches English words like "tie", "pie", "die"
- Problem: Still felt arbitrary, no international precedent
- Verdict: ⚠️ Better, but not ideal

**Attempt 3: 'ai' (current)**
- Rationale:
  - Directly represents IPA /aɪ/ - phonemically transparent
  - Pinyin uses 'ai' (standard romanization for Mandarin Chinese)
  - Italian and Vietnamese use 'ai'
  - You can "see" the a→i glide
  - English 'ai' words (rain, paint) use /eɪ/, so 'ai' is available
- Impact: More identical words than 'ii' or 'ie'. ('ei' looks better by raw dictionary count, but frequency analysis shows net -1 /M — gains are mostly rare German surnames like Bernstein and Alzheimer, essentially zero real-text impact.)
- Verdict: ✅ **Adopted** - international precedent + phonemic clarity

**Examples:**
- my → mai
- time → taim
- night → nait
- I → ai

### /aʊ/ (cow, out): ow → ou

**Attempt 1: 'ow'**
- Rationale: Matches English "cow", "now", "how", "wow"
- Problem:
  - Words like "out", "loud", "sound" became "owt", "lowd", "sownd"
  - Looked unfamiliar despite matching some English patterns
  - Only "Regional" rating - just English uses 'ow' for this
- Verdict: ⚠️ Workable but not optimal

**Attempt 2: 'ou' (current)**
- Rationale:
  - Words like "out", "loud", "sound" become IDENTICAL to English
  - Dutch also uses 'ou' for this sound (oud = old)
  - Upgraded from "Regional" to "Common" rating
- Impact: Large frequency gain vs 'ow': out (3,965 /M), about (3,725 /M), our (1,308 /M), sound (141 /M), found (121 /M) are among the most common English words
- Trade-off: "cow" → "kou" looks less familiar
- Verdict: ✅ **Adopted** - identical common words outweigh unfamiliar rare words

**Examples:**
- out → out (identical!)
- our → ouer
- loud → loud (identical!)
- sound → sound (identical!)
- cow → kou
- house → hous

### /oʊ/ (go, show): o → oh

**Attempt 1: 'o'**
- Rationale: Simple; 'o' is the conventional Latin-script letter for back vowels (though English /oʊ/ is a diphthong, unlike the pure /o/ of Spanish or Italian)
- Problem: We originally used 'ah' for /ɑ/ (hot → "haht", rock → "rahk"), but feedback was that 'ah' looked too foreign. Changing /ɑ/ to 'o' made those words natural (hot → "hot", rock → "rok") but meant 'o' was taken, creating a collision here.
- Verdict: ❌ Rejected - collision with /ɑ/ vowel

**Attempt 2: 'oh' (current)**
- Rationale:
  - English "oh!" already uses this for the exclamation
  - Distinguishes "go" (goh) from "cow" (kou) without ambiguity
  - Only option left after reserving 'o' for /ɑ/
- Trade-off: 'ow' gains show (501 /M), own (471 /M), throw (132 /M) but loses "oh" (3,374 /M) — net -1,330 /M. 'oa' is even worse. Both introduce perceptual ambiguity (see attempt 3 below)
- Verdict: ✅ **Adopted** - necessary to avoid collision

**Attempt 3: 'ow' (rejected)**
- Rationale: Would make snow, throw, bowl, window identical to English. Gains show (501 /M), own (471 /M), throw (132 /M) but net -1,330 /M because "oh" alone is 3,374 /M
- Problem: `ow` is ambiguous in English: it represents both /oʊ/ (snow, throw) and /aʊ/ (cow, town). New combinations like `bownz` (bones) read as "bowns" and `howm` (home) sounds like it rhymes with "cow". Reintroduces the exact ambiguity ingglish is designed to eliminate.
- Verdict: ❌ Rejected - perceptual ambiguity despite no formal collisions

**Examples:**
- go → goh
- show → shoh
- hello → haloh

## Vowel Evolution

### /ɑ/ (father, hot): ah → o

**Attempt 1: 'ah'**
- Rationale: Phonetically accurate for open back vowel
- Problem:
  - "rock" → "rahk" looked strange
  - "hot" → "haht" unrecognizable
- Verdict: ❌ Rejected - words looked too foreign

**Attempt 2: 'o' (current)**
- Rationale:
  - "rock" → "rok" looks natural
  - "hot" → "hot" (identical!)
  - 'o' is the conventional Latin-script letter for back vowels across languages
- Impact: Massive frequency gain vs 'ah': hot (195 /M), got (222 /M), job (153 /M), lot (141 /M) are all high-frequency words that become identical
- Verdict: ✅ **Adopted** - familiar results

**Examples:**
- hot → hot (identical!)
- rock → rok
- father → fodher

### /ɔ/ (thought, law): aw → o → aw

This vowel went through the most iteration.

**Attempt 1: 'aw'**
- Rationale: Matches English "law", "saw", "raw"
- Worked reasonably well
- Verdict: ⚠️ Acceptable

**Attempt 2: 'o' (caught-cot merger)**
- Rationale: Simplify by merging with /ɑ/, reflecting American pronunciation
- Problem:
  - Lost distinction for speakers who maintain the difference
  - Required changing /oʊ/ to 'oh' to avoid collision
- Verdict: ❌ Rejected - lost too much information

**Attempt 3: 'aw' (current, reverted)**
- Rationale:
  - "thought" → "thawt" is readable
  - "law" → "law" (identical!)
  - Preserves distinction for non-merged speakers
  - Common rating - matches English "law", "saw"
- Impact: Merging to 'o' would add +176 collision groups. 'au' avoids collisions but loses -555 /M — saw (413 /M), law (119 /M), lawyer (82 /M) outweigh the gains fault (107 /M), paul (97 /M), launch (20 /M).
- Verdict: ✅ **Adopted** - maintains distinction, familiar results

**Examples:**
- law → law (identical!)
- thought → thawt
- call → kawl

### /ʊ/ and /uː/ Swap: oo ↔ uu (superseded)

**Original:**
- /ʊ/ (book) → 'uu'
- /uː/ (too) → 'oo'

**Problem:**
- "book" → "buuk" looked strange when English already has "book"
- "too" → "too" was identical, but the long sound had the shorter spelling

**After Swap:**
- /ʊ/ (book) → 'oo' - matches English "book", "good", "look"
- /uː/ (too) → 'uu' - longer sound gets longer spelling (Finnish pattern)

**Impact:** The original uu/oo assignment produces more identical spellings by raw count. But frequency tells the real story: the swap keeps "would" (1,813 /M), "good" (2,677 /M), "could" (1,475 /M), "should" (803 /M), "look" (1,038 /M), "book" (182 /M), "looking" (476 /M) as identical — these high-frequency words far outweigh the low-frequency words lost.

**Verdict:** ⚠️ **Adopted then superseded** - the /ʌ/→'uh' change later freed 'u' for /ʊ/ and 'oo' for /uː/; see [chain change below](#--and-u-chain-uoouu--uhuoo)

**Later considered: 'eu' for /uː/ (rejected)**
- Rationale: Would gain +19 /M (zeus 6 /M, neutral 4 /M, maneuver 3 /M) with minimal losses
- Problem: `eu` in English implies a /j/ onset: "feud" is /fjuːd/, "neural" is /njʊɹəl/. So `meun` (moon) reads as "mew-n" (two syllables), `seun` (soon) reads as "syoon", `teu` (too) reads as "tyoo". The mapping actively misleads English readers.
- Lesson: Identical word count isn't enough on its own. A shared spelling that reads as the wrong sound is worse than an unfamiliar spelling that reads correctly.
- Verdict: ❌ Rejected - perceptual ambiguity, and the +19 /M gain is negligible anyway

### /ʌ/, /ʊ/, and /uː/ Chain: u/oo/uu → uh/u/oo

A three-way chain shift that resolved the 'uu' digraph and aligned all three vowels with more intuitive spellings.

**Before (the oo/uu swap era):**
- /ʌ/ (but) → 'u'
- /ʊ/ (book) → 'oo'
- /uː/ (too) → 'uu'

**Problem:**
- 'uu' has no precedent in English — "tuu", "thruu", "byuutafal" looked alien
- Most world languages use 'u' for /ʊ/, not 'oo'
- 'oo' is the natural English spelling for /uː/ (too, food, moon, cool)

**After (current):**
- /ʌ/ (but) → 'uh' — the English interjection "uh" is exactly this sound
- /ʊ/ (book) → 'u' — what most world languages use for this vowel
- /uː/ (too) → 'oo' — matches English "too", "food", "moon", "cool"

**Rationale:**
- 'uh' is the intuitive English interjection for /ʌ/ — everyone knows how "uh" sounds
- Freeing 'u' for /ʊ/ aligns with most world languages (Universal rating)
- 'oo' for /uː/ matches English conventions (too, food, moon, cool, school)
- Eliminates 'uu' entirely — no more unfamiliar digraphs

**Impact:**
- "too" → "too" (identical!), "food" → "food" (identical!), "moon" → "moon" (identical!), "school" → "skool", "blue" → "bloo", "you" → "yoo"
- "book" → "buk", "good" → "gud", "could" → "kud", "would" → "wud", "should" → "shud", "put" → "put" (identical!), "look" → "luk"
- "but" → "buht", "cup" → "kuhp", "love" → "luhv", "of" → "uhv"
- Loses some /ʊ/ identical words (book, good, could, would, should, look) but gains /uː/ identical words (too, food, moon) and eliminates the unfamiliar 'uu'

**Verdict:** ✅ **Adopted** — eliminates 'uu', aligns with world languages, 'oo' matches English conventions

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

The schwa (/ə/) is the most common vowel in English — it appears in nearly every multi-syllable word (about, the, beautiful, difficult, nation). This change only affects **unstressed schwa** (ARPAbet AH0), not the stressed /ʌ/ STRUT vowel (AH1/AH2) used in "but", "cup", "run" — those use 'uh'.

**Attempt 1: 'u'**
- Rationale: Both /ə/ and /ʌ/ are represented as 'AH' in ARPAbet, so mapping all AH → 'u' was the simplest approach
- Problem:
  - "the" → "dhu" (unrecognizable — "the" is the most common English word)
  - "about" → "ubout" (lost the identical English spelling)
  - "hello" → "huloh" (the 'u' in the first syllable looked odd)
  - "nation" → "nayshun" (the '-un' ending felt wrong for a word ending in /-ən/)
  - "beautiful" → "byootufool" (confusing)
- Verdict: ❌ Rejected — schwa words looked too unfamiliar

**Attempt 2: 'a' (current)**
- Rationale:
  - "about" → "about" (identical!), "and" → "and" (identical!), "the" → "dha" (natural)
  - 'a' is phonetically close to schwa — many languages use 'a' for their neutral vowel
  - English already spells schwa as 'a' in the most common words: **a**, **about**, **again**, **along**, **away**, **around** — all identical in Ingglish
  - Stressed /ʌ/ stays separate ('uh'), so no collisions with STRUT words
- Impact:
  - **67.6× frequency-weighted improvement** — the largest gain from any single change
  - Top gains: "a" (20,941 /M), "and" (13,733 /M), "about" (3,725 /M), "around" (1,428 /M)
  - Only +93 net collision groups (acceptable; most are low-frequency)
  - Losses cluster in predictable patterns: un- prefix (until→antil), up- prefix (upset→apset), -ful suffix (handful→handfal), -um suffix (museum→myoozeeam)
- Trade-off: AH0+R must remain 'ur' (not 'ar') to avoid collision with AA+R→'ar'. This is handled by a special R-colored vowel rule that overrides the schwa mapping before R.
- Verdict: ✅ **Adopted** — massive familiarity gain with minimal downside

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

R-colored vowels were added iteratively to fix collisions and improve readability. Collectively, the R-colored vowel rules (air, eer, ar, or, arr) produce a large frequency-weighted identical word gain and prevent 25 collision groups.

### /æ/+R: aar → arr

**Attempt 1: 'aar'**
- Rationale: Double the vowel before R
- Problem: "arrow" → "aaroh" looked strange

**Attempt 2: 'arr' (current)**
- Rationale:
  - English already doubles consonants after short vowels (carrot, barrel, arrow)
  - "arrow" → "arroh" is more recognizable
  - Upgraded from "Novel" to "Common" rating
- Verdict: ✅ **Adopted** - matches English convention

**Examples:**
- arrow → arroh
- carrot → karrat
- barrel → barral

### /ɛ/+R → 'air' (added)

**Before:** No special handling
- "air" → "er" (collision with "her")
- "there" → "dher" (collision with "the" + "her")

**After:** Look-ahead rule for /ɛ/ followed by R
- "air" → "air" (identical!)
- "there" → "dhair"
- "care" → "kair"

**Verdict:** ✅ Essential - eliminates collisions between /ɛ/+R and /ɝ/ words

### /ɪ/+R → 'eer' (added)

**Before:** No special handling
- "beard" → "bird" (looks like the animal)
- "beer" → "bir" (unrecognizable)
- "fear" → "fir" (looks like the tree)

**After:** Look-ahead rule for /ɪ/ followed by R
- "beard" → "beerd"
- "beer" → "beer" (identical!)
- "fear" → "feer"
- "near" → "neer"

**Verdict:** ✅ Essential - eliminated confusing false cognates

### /ɑ/+R → 'ar' (added)

**Before:** No special handling
- "star" → "stor" (collision with "store")

**After:** Look-ahead rule for /ɑ/ followed by R
- "star" → "star" (identical!)
- "car" → "kar"

**Verdict:** ✅ Essential - eliminated major collisions

### /ɔ/+R → 'or' (added)

**Before:** No special handling
- "store" → "stawr" (confusing)

**After:** Look-ahead rule for /ɔ/ followed by R
- "store" → "stor"
- "more" → "mor"

**Verdict:** ✅ Essential - natural spellings

## Lessons

### 1. Identical Words Are a Big Win (But Not Everything)
When a word is spelled identically in English and Ingglish (out→out, loud→loud, too→too, law→law), it provides maximum familiarity. We prioritize mappings that create more identical words, but **not at the cost of creating collisions** (different words with the same spelling).

Current status: **10,150 identical words** (8.05% of 126,051 dictionary words). The schwa change (AH0 → 'a') alone produced the largest frequency-weighted gain of any change (67.6×). See [Identical Words Analysis](identical-words-analysis.md) for frequency-weighted analysis of potential improvements.

### 2. International Precedent Matters
Spellings with support from multiple languages (like 'ai' from Pinyin/Italian/Vietnamese) are more defensible than purely English-based choices.

### 3. Collisions Must Be Fixed
R-colored vowel rules were essential to prevent words like "air" and "her" from both mapping to "er". Fixing collisions is more important than simplicity.

### 4. The "Novel" to "Common" Upgrade
Several changes were specifically made to upgrade ratings:
- 'arr' (was 'aar'): Novel → Common
- 'ou' (was 'ow'): Regional → Common
- 'u' for /ʊ/: Regional → Universal
- 'oo' for /uː/: Common

### 5. Reversion Is Okay
The /ɔ/ vowel went aw → o → aw. We weren't afraid to revert when a change didn't work out. The goal is the best final system, not sticking with early decisions.

### 6. Identical Word Count Can Mislead
A spelling that matches more English words is harmful if English readers pronounce those new combinations wrong. The `ow` and `eu` proposals both look good by raw count but failed in practice because English readers' existing intuitions produced wrong pronunciations for unfamiliar combinations (`bownz` reads as "bowns", `meun` reads as "mew-n"). The correct test isn't "does this string match?" but "does an English reader naturally say this correctly?"

### 7. Stress-Conditioned Splits Can Unlock Big Wins
The schwa change split AH into two spellings based on stress: AH0 (unstressed) → 'a', AH1/AH2 (stressed) → 'uh'. This wasn't possible with a simple mapping table — it required logic in the conversion function. The payoff was a 67.6× frequency-weighted improvement — the single largest gain of any change, driven by "a" (20,941 /M), "and" (13,733 /M), "about" (3,725 /M). When a single phoneme symbol covers two distinct sounds (like ARPAbet AH covering both /ə/ and /ʌ/), splitting by stress is worth considering.

## Changes Not Made (Considered and Rejected)

### Using 'au' for /aʊ/ instead of 'ou'
- Would match German/Dutch/Portuguese
- Rejected because 'ou' preserves high-frequency identical words (out 3,965 /M, about 3,725 /M, our 1,308 /M, sound 141 /M) that 'au' would lose

### Using pure IPA-style spellings throughout
- Would be more internationally consistent
- Rejected because target audience is primarily English speakers

### Removing R-colored vowel special handling
- Would simplify the system
- Rejected because it would lose high-frequency identical words (star, air, beer, store, etc.) and add 25 collision groups

## Version History

For the complete git history, see:
```bash
git log --oneline --all --grep="spelling\|phoneme\|vowel\|diphthong"
```
