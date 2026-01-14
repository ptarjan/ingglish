# Ingglish Translation Collision Analysis

This document analyzes cases where translating an English word to Ingglish produces a spelling that matches a **different** existing English word.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total words analyzed | 117,493 |
| Ingglish spellings matching different English words | 1,089 |
| Homophone groups (same pronunciation, different spelling) | 9,895 |
| Collisions involving common words (freq >= 1000) | 172 |

### Is This a Problem?

**Not really.** Here's why:

1. **Context resolves ambiguity** - Just like English homophones (their/there/they're), context makes meaning clear
2. **Most collisions are rare words** - Only 172 of 1,089 collisions involve common words
3. **The original problem exists in English** - English already has thousands of homophones that readers handle fine
4. **Reading direction is consistent** - When reading Ingglish, you know to interpret phonetically

### Types of Collisions

1. **Merged sounds** - English has sounds that merged historically:
   - "wh" words -> "w" sounds (white->wait, while->wail)
   - This is how most American speakers actually pronounce these words

2. **Proper names matching common words** - Many collisions are surnames:
   - "Bier" (German surname) -> "beer"
   - "Baht" (Thai currency) -> "bot" (same as "bought")
   - These are unavoidable since names follow the same pronunciation rules

---

## Most Problematic Collisions (Common Words)

These collisions involve frequently-used words and may cause occasional confusion.

The "Frequency" column shows SUBTLEX corpus occurrence counts (higher = more common):

| English | Ingglish | Collides With | Frequency |
|---------|----------|---------------|-----------|
| a, uh | u | u (letter) | 1,041,179 -> 2,506 |
| of | uv | uv (?) | 590,439 -> ? |
| right, write, rite | rait | rait (Scottish) | 204,428 -> rare |
| how | hou | hou (?) | 155,867 -> ? |
| yeah | ya | ya (informal) | 152,262 -> 7,664 |
| want | wont | wont (habit) | 140,718 -> 81 |
| ass | as | as (conjunction) | 11,545 -> 113,068 |
| here, hear | heer | heer (?) | 230,788 -> 2 |
| side, sighed | said | said (verb) | 10,247 -> 56,531 |
| white | wait | wait (verb) | 8,744 -> 42,343 |
| place | plays | plays (verb) | 30,736 -> 1,521 |
| fine | fain | fain (archaic) | 30,502 -> 15 |
| while, wile | wail | wail (cry) | 17,821 -> 44 |
| wife | waif | waif (orphan) | 17,795 -> 17 |
| since | sins | sins (noun) | 16,064 -> 455 |
| turn | tern | tern (bird) | 15,630 -> 1 |
| case | kays | kays (letter K's) | 14,403 -> ? |
| mine | main | main (primary) | 12,800 -> 2,179 |
| matter | mater | mater (mother) | 18,900 -> 83 |
| else | els | els (?) | 22,907 -> 4 |

Most collisions are one-way problems: a common word translates to match an extremely rare word (frequency of 1 or unknown). The rare word is unlikely to appear in real text, so confusion is minimal.

### Analysis of Top Collisions

#### "a" -> "u"
The word "a" (1,041,179 occurrences) along with "uh" translate to "u", which collides with the letter "u" (2,506 occurrences).

**Impact**: Low - Context makes "u dog" clearly mean "a dog", not "u dog".

#### "right/write/rite" -> "rait"
The extremely common words "right" (204,428), "write" (6,467), and "rite" (74) all translate to "rait". This collides with "rait" which is a Scottish/archaic English word.

**Impact**: Very Low - "rait" is essentially never used in modern English.

#### "want" -> "wont"
The word "want" (140,718 occurrences) translates to "wont", which is an archaic English word meaning "habit" or "accustomed to" (only 81 occurrences).

**Impact**: Low - "wont" is rarely used in modern English. Context makes "I wont that" clearly mean "I want that".

#### "white" -> "wait"
The word "white" (8,744 occurrences) translates to "wait", which is the common verb (42,343 occurrences). This is significant because both words are frequently used.

**Impact**: Medium - Both words are common, but context resolves it. "The wait house" clearly means "white house". Note: "wait" itself translates to "wayt" in Ingglish, so the two words don't merge.

#### "while" -> "wail"
"While" (17,821 occurrences) translates to "wail" (44 occurrences), the crying sound.

**Impact**: Low - "wail" is uncommon. "Wail you were gone" clearly means "while you were gone".

#### "since" -> "sins"
"Since" (16,064 occurrences) translates to "sins" (455 occurrences), the noun for transgressions.

**Impact**: Low-Medium - Both are moderately common, but context ("sins yesterday" = "since yesterday") clarifies.

---

## Homophone Groups

English has extensive homophones - words that sound the same but are spelled differently. Ingglish naturally merges these since it spells by sound:

### Largest Homophone Groups

| English Words (count) | Ingglish |
|-----------------------|----------|
| laurey, lauri, laurie, laury, lawrie, lawry, loree, lorey, lori, lorie, lorrie, lorry, lory, lowrie (14) | loree |
| carey, carie, carrey, carrie, cary, kairey, kari, karry, kary, kerrey, kerri, kerry (12) | kairee |
| hsu, schoo, schou, schue, schuh, shew, shiu, shoe, shoo, shu, shue (11) | shuu |
| freas, frease, frees, freese, freeze, freis, frese, friese, frieze, friis (10) | freez |

### Common Homophones

| English Words | Ingglish |
|---------------|----------|
| aer, air, ayre, eir, ere, err, eyre, heir, ire | air |
| au, aux, eau, eaux, o, oh, ohh, ow, owe | oh |
| c, cie, sci, sea, see, si, sie, sieh | see |
| ewe, u, uwe, yew, yoo, you, yu, yue | yuu |
| rae, ray, raye, re, rea, reay, rey, wray | ray |
| reaux, rheault, rho, ro, roe, roh, rohe, row, rowe | roh |

---

## Collision Categories

### 1. WH-W Mergers (Wine-Whine Merger)

Most English speakers have merged "wh" and "w" sounds. This creates collisions where WH-words translate to spellings that match existing English words:

| English | Ingglish | Collides With English Word |
|---------|----------|---------------------------|
| white | wait | wait (verb) |
| whine | wain | wain (archaic: wagon) |
| while | wail | wail (cry) |
| which, witch | wich | wich (as in "sandwich") |

Note: Some WH-words like "whale -> wayl" and "whether -> wedher" do NOT create collisions because "wayl" and "wedher" aren't English words.

### 2. Vowel Quality Mergers

| English | Ingglish | Notes |
|---------|----------|-------|
| caught, cot | kot | Cot-caught merger |
| Mary, merry, marry | meree | Three-way merger in many dialects |

### 3. Proper Names -> Common Words

Many collisions occur because proper names translate to common word spellings:

| Proper Name | Ingglish | Collides With |
|-------------|----------|---------------|
| Baht (currency) | bot | bought |
| Bier (surname) | beer | beer |
| Juan | won | won |
| Marc | mark | mark |

---

## Recommendations

### For Users

1. **Trust context** - Just as with English homophones, meaning is clear from context
2. **Don't worry about perfect round-trips** - Ingglish prioritizes readability over reversibility

### For the Project

1. **Document known collisions** - This analysis helps set expectations
2. **Consider disambiguation for critical cases** - Could add optional diacritics
3. **Accept linguistic reality** - Many "collisions" reflect how people actually speak

---

## Running the Analysis

To regenerate this analysis:

```bash
cd packages/core
npx vitest run -t "collision analysis"
```

The analysis script is at `packages/core/src/collision-analysis.test.ts`.
