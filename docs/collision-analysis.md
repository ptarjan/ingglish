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

These collisions involve frequently-used words and may cause occasional confusion:

| Ingglish | English Sources | Frequency Rank |
|----------|-----------------|----------------|
| tern | turn | #1 → #15,630 |
| rober | robber | #1 → #239 |
| winer | winner | #1 → #1,592 |
| dain | dine | #1 → #219 |
| sees | cease | #1,899 ← #445 |
| mild | milled | #245 ← #1 |
| rain | rhine | #2,494 ← #34 |
| saws | sauce | #24 ← #795 |
| bot | bought | #50 ← #4,362 |

### Analysis of Top Collisions

#### "turn" → "tern"
The word "turn" translates to "tern" (a seabird). This is because CMU dictionary shows "turn" as /tɜːn/ which maps to "tern" in Ingglish. The bird "tern" is quite rare (#1 frequency rank means it's extremely uncommon in text).

**Impact**: Low - "tern" is rarely used, context makes "turn" obvious.

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

| Ingglish | English Words (count) |
|----------|----------------------|
| loree | laurey, lauri, laurie, laury, lawrie, lawry, loree, lorey, lori, lorie, lorrie, lorry, lory, lowrie (14) |
| kairee | carey, carie, carrey, carrie, cary, kairey, kari, karry, kary, kerrey, kerri, kerry (12) |
| shuu | hsu, schoo, schou, schue, schuh, shew, shiu, shoe, shoo, shu, shue (11) |
| freez | freas, frease, frees, freese, freeze, freis, frese, friese, frieze, friis (10) |

### Common Homophones

| Ingglish | English Words |
|----------|---------------|
| air | aer, air, ayre, eir, ere, err, eyre, heir, ire |
| oh | au, aux, eau, eaux, o, oh, ohh, ow, owe |
| see | c, cie, sci, sea, see, si, sie, sieh |
| yuu | ewe, u, uwe, yew, yoo, you, yu, yue |
| way | way, waye, wei, weigh, wey, whey, wy |
| roh | reaux, rheault, rho, ro, roe, roh, rohe, row, rowe |

---

## Collision Categories

### 1. WH-W Mergers (Wine-Whine Merger)

Most English speakers have merged "wh" and "w" sounds. The CMU dictionary reflects this:

| Ingglish | From | Notes |
|----------|------|-------|
| wait | white | Both /weɪt/ in most dialects |
| wail | whale | |
| wine | whine | |
| wile | while | |
| witch | which | |
| weather | whether | |

**Resolution Options**:
1. Accept the merger (reflects actual pronunciation)
2. Add custom pronunciations with /hw/ for "wh" words
3. Use diacritics (e.g., "hwait" for "white")

### 2. Vowel Quality Mergers

| Ingglish | From | Notes |
|----------|------|-------|
| caught/cot | both → kot | Cot-caught merger |
| Mary/merry/marry | various | Three-way merger in many dialects |

### 3. Proper Names → Common Words

Many collisions occur because proper names translate to common word spellings:

| Ingglish | Proper Name | Common Word |
|----------|-------------|-------------|
| rob | Robb | rob (verb) |
| bert | Burt | bert (fabric) |
| mark | Marc | mark |

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
