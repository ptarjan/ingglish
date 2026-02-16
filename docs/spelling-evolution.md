# Spelling Evolution History

This document records all phoneme spelling changes made during Ingglish development, explaining what we tried, what worked, what didn't, and why we ended up with the current system.

## Summary of Changes

| Sound | IPA | Spelling | Changes |
|-------|-----|----------|---------|
| my, time | /aɪ/ | **ai** | ii → ie → ai |
| cow, out | /aʊ/ | **ou** | ow → ou |
| go, show | /oʊ/ | **oh** | o → oh |
| father, hot | /ɑ/ | **o** | ah → o |
| thought, law | /ɔ/ | **aw** | aw → o → aw |
| book, put | /ʊ/ | **oo** | uu → oo (swapped) |
| too, blue | /uː/ | **uu** | oo → uu (swapped) |
| arrow, carrot | /æɹ/ | **arr** | aar → arr |

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
  - Directly represents IPA /aɪ/ - phonetically transparent
  - Pinyin uses 'ai' (1.4B speakers)
  - Italian and Vietnamese use 'ai'
  - You can "see" the a→i glide
  - English 'ai' words (rain, paint) use /eɪ/, so 'ai' is available
- Verdict: ✅ **Adopted** - international precedent + phonetic clarity

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
- Rationale: Simple, matches Spanish/Italian
- Problem: When we changed /ɑ/ to 'o', this created a collision
- Verdict: ❌ Rejected - collision with /ɑ/ vowel

**Attempt 2: 'oh' (current)**
- Rationale:
  - English "oh!" already uses this for the exclamation
  - Distinguishes "go" (goh) from "cow" (kou) without ambiguity
  - Only option left after reserving 'o' for /ɑ/
- Verdict: ✅ **Adopted** - necessary to avoid collision

**Attempt 3: 'ow' (rejected)**
- Rationale: Would make snow, throw, bowl, window identical to English (+137 net identical words)
- Problem: `ow` is ambiguous in English — represents both /oʊ/ (snow, throw) and /aʊ/ (cow, town). New combinations like `bownz` (bones) read as "bowns" and `howm` (home) sounds like it rhymes with "cow". Reintroduces the exact ambiguity ingglish is designed to eliminate.
- Verdict: ❌ Rejected - perceptual ambiguity despite no formal collisions

**Examples:**
- go → goh
- show → shoh
- hello → huloh

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
  - Matches Spanish/Italian use of 'o'
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
- Verdict: ✅ **Adopted** - maintains distinction, familiar results

**Examples:**
- law → law (identical!)
- thought → thawt
- call → kawl

### /ʊ/ and /uː/ Swap: oo ↔ uu

**Original:**
- /ʊ/ (book) → 'uu'
- /uː/ (too) → 'oo'

**Problem:**
- "book" → "buuk" looked strange when English already has "book"
- "too" → "too" was identical, but the long sound had the shorter spelling

**After Swap (current):**
- /ʊ/ (book) → 'oo' - matches English "book", "good", "look"
- /uː/ (too) → 'uu' - longer sound gets longer spelling (Finnish pattern)

**Rationale:**
- "book" → "book" (identical!)
- "too" → "tuu" follows the length principle
- Both spellings now have "Common" ratings

**Verdict:** ✅ **Adopted** - identical short vowel words + logical length pattern

**Later considered: 'eu' for /uː/ (rejected)**
- Rationale: Would gain +41 identical words (feud, deuce, neutral) with only 2 losses — best efficiency of any proposed change
- Problem: `eu` in English implies a /j/ onset — "feud" is /fjuːd/, "neural" is /njʊɹəl/. So `meun` (moon) reads as "mew-n" (two syllables), `seun` (soon) reads as "syoon", `teu` (too) reads as "tyoo". The mapping actively misleads English readers.
- Lesson: **Identical word count is necessary but not sufficient** — a shared spelling that reads as the wrong sound is worse than an unfamiliar spelling that reads correctly. `uu` works precisely because English has no `uu` convention to conflict with.
- Verdict: ❌ Rejected - perceptual ambiguity despite excellent numerical efficiency

## R-Colored Vowel Evolution

R-colored vowels were added iteratively to fix collisions and improve readability.

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
- carrot → karrut
- barrel → barrul

### /ɛ/+R → 'air' (added)

**Before:** No special handling
- "air" → "er" (collision with "her")
- "there" → "dher" (collision with "the" + "her")

**After:** Look-ahead rule for /ɛ/ followed by R
- "air" → "air" (identical!)
- "there" → "dhair"
- "care" → "kair"

**Impact:** Fixed 204 word collisions between /ɛ/+R and /ɝ/ words

**Verdict:** ✅ Essential - massive collision reduction

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

## Key Lessons Learned

### 1. Identical Words Are a Big Win (But Not Everything)
When a word is spelled identically in English and Ingglish (out→out, loud→loud, book→book, law→law), it provides maximum familiarity. We prioritize mappings that create more identical words, but **not at the cost of creating collisions** (different words with the same spelling).

Current status: **6,930 identical words** (5.13% of dictionary). See [Identical Words Analysis](identical-words-analysis.md) for details on potential improvements.

### 2. International Precedent Matters
Spellings with support from multiple languages (like 'ai' from Pinyin/Italian/Vietnamese) are more defensible than purely English-based choices.

### 3. Collisions Must Be Fixed
R-colored vowel rules were essential to prevent words like "air" and "her" from both mapping to "er". Fixing collisions is more important than simplicity.

### 4. The "Novel" to "Common" Upgrade
Several changes were specifically made to upgrade ratings:
- 'arr' (was 'aar'): Novel → Common
- 'ou' (was 'ow'): Regional → Common
- 'oo'/'uu' swap: Both now Common

### 5. Reversion Is Okay
The /ɔ/ vowel went aw → o → aw. We weren't afraid to revert when a change didn't work out. The goal is the best final system, not sticking with early decisions.

### 6. Identical Word Count Can Mislead
A spelling that matches more English words is harmful if English readers pronounce those new combinations wrong. The `ow` and `eu` proposals both increased identical word counts (+137 and +41) but failed in practice because English readers' existing intuitions produced wrong pronunciations for unfamiliar combinations (`bownz` reads as "bowns", `meun` reads as "mew-n"). The correct test isn't "does this string match?" but "does an English reader naturally say this correctly?"

## Changes Not Made (Considered and Rejected)

### Using 'au' for /aʊ/ instead of 'ou'
- Would match German/Dutch/Portuguese
- Rejected because 'ou' creates more identical English words

### Using pure IPA-style spellings throughout
- Would be more internationally consistent
- Rejected because target audience is primarily English speakers

### Removing R-colored vowel special handling
- Would simplify the system
- Rejected because collisions are unacceptable (204 /ɛ/+R vs /ɝ/ collisions alone)

## Version History

For the complete git history, see:
```bash
git log --oneline --all --grep="spelling\|phoneme\|vowel\|diphthong"
```
