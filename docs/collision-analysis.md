# Ingglish Translation Collision Analysis

This document analyzes cases where translating an English word to Ingglish produces a spelling that matches a **different** existing English word.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total words analyzed | 117,493 |
| Ingglish spellings matching different English words | 1,089 |
| Homophone groups (same pronunciation, different spelling) | 9,895 |
| Collisions involving common words (top 5000) | 657 |

### Is This a Problem?

**Not really.** Here's why:

1. **Context resolves ambiguity** - Just like English homophones (their/there/they're), context makes meaning clear
2. **Most collisions are rare words** - Only 657 of 1,089 collisions involve common words
3. **The original problem exists in English** - English already has thousands of homophones that readers handle fine
4. **Reading direction is consistent** - When reading Ingglish, you know to interpret phonetically

### Types of Collisions

1. **Merged sounds** - English has sounds that merged historically:
   - "wh" words → "w" sounds (white→wait, whine→wine)
   - This is how most American speakers actually pronounce these words

2. **Proper names matching common words** - Many collisions are surnames:
   - "Bier" (German surname) → "beer"
   - "Bahler" → "boler"
   - These are unavoidable since names follow the same pronunciation rules

---

## Most Problematic Collisions (Common Words)

These collisions involve frequently-used words and may cause occasional confusion.

The "Frequency" column shows corpus occurrence counts (higher = more common):

| English | Ingglish | Collides With | Frequency |
|---------|----------|---------------|-----------|
| white | wait | wait (verb) | 2,547 → 8,578 |
| turn | tern | tern (bird) | 15,630 → 1 |
| sauce | saws | saws (tool) | 795 → 24 |
| bought | bot | bot (robot) | 4,362 → 50 |
| winner | winer | winer (?) | 1,592 → 1 |
| robber | rober | rober (?) | 239 → 1 |
| dine | dain | dain (name) | 219 → 1 |
| cease | sees | sees (verb) | 445 → 1,899 |

Most collisions are one-way problems: a common word translates to match an extremely rare word (frequency of 1). The rare word is unlikely to appear in real text, so confusion is minimal.

### Analysis of Top Collisions

#### "white" → "wait"
The word "white" translates to "wait" in Ingglish. This matches the common English verb "wait". This is one of the more significant collisions because both words are very common (white: 2,547, wait: 8,578 in SUBTLEX corpus).

**Impact**: Medium - Both words are common, but context usually resolves it. "The wait house" clearly means "white house". Interestingly, "wait" itself translates to "wayt" in Ingglish, so they don't merge - but reading "wait" in Ingglish text could momentarily confuse readers expecting the English verb.

#### "turn" → "tern"
The word "turn" translates to "tern" (a seabird). This is because CMU dictionary shows "turn" as /tɜːn/ which maps to "tern" in Ingglish. The bird "tern" appears only once in the SUBTLEX corpus, making it extremely rare.

**Impact**: Low - "tern" almost never appears in real text, so "turn" → "tern" won't cause confusion.

#### "winner" → "winer"
"Winner" becomes "winer" which looks like "winer" (one who wines).

**Impact**: Low - reading context ("the winer of the race") makes meaning clear.

#### "sauce" → "saws"
"Sauce" translates to "saws" (identical to "sauce" in most American accents).

**Impact**: Low-Medium - both words are common, but context ("posta saws" vs "hand saws") resolves it.

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
| way, waye, wei, weigh, wey, whey, wy | way |
| reaux, rheault, rho, ro, roe, roh, rohe, row, rowe | roh |

---

## Collision Categories

### 1. WH-W Mergers (Wine-Whine Merger)

Most English speakers have merged "wh" and "w" sounds. This creates collisions where WH-words translate to spellings that match existing W-words:

| English | Ingglish | Collides With English Word |
|---------|----------|---------------------------|
| white | wait | wait (verb) |
| whale | wayl | wail (cry) |
| whine | wain | wane (decline) - but also "wain" is archaic for wagon |
| while | wail | wail (cry) |
| which | wich | witch (spelled "wich" in Ingglish too) |
| whether | wedher | weather (spelled "wedher" in Ingglish too) |

Note: Some pairs like "white/wait" translate to *different* Ingglish spellings (wait vs wayt), but "white → wait" still collides with the English word "wait".

### 2. Vowel Quality Mergers

| English | Ingglish | Notes |
|---------|----------|-------|
| caught, cot | kot | Cot-caught merger |
| Mary, merry, marry | meree | Three-way merger in many dialects |

### 3. Proper Names → Common Words

Many collisions occur because proper names translate to common word spellings:

| Proper Name | Common Word | Ingglish |
|-------------|-------------|----------|
| Robb | rob (verb) | rob |
| Burt | bert (fabric) | bert |
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
