# Ingglish Translation Collision Analysis

This document analyzes cases where translating an English word to Ingglish produces a spelling that matches a **different** existing English word.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total words analyzed | 117,493 |
| Collisions (Ingglish matches different English word) | 1,089 |
| Collisions involving common words (freq >= 1000) | 172 |

### Is This a Problem?

**Rarely.** Looking at the data:

- Most collisions translate common words to **obscure** words (rait, wont, heer, fain, hou, uv). You'll never encounter these in normal text.
- Only ~5 collisions involve two common words: white→wait, ass→as, place→plays, side→said, mine→main
- Context resolves these just like English homophones (their/there/they're)

---

## Collisions (Common Words)

Frequency shows SUBTLEX corpus counts. The Ingglish column is also an English word.

| English | Ingglish | Frequency |
|---------|----------|-----------|
| a, uh | u | 1,041,179 → 2,506 |
| of | uv | 590,439 → rare |
| right, write, rite | rait | 204,428 → rare |
| how | hou | 155,867 → rare |
| yeah | ya | 152,262 → 7,664 |
| want | wont | 140,718 → 81 |
| ass | as | 11,545 → 113,068 |
| here, hear | heer | 230,788 → 2 |
| side, sighed | said | 10,247 → 56,531 |
| white | wait | 8,744 → 42,343 |
| place | plays | 30,736 → 1,521 |
| fine | fain | 30,502 → 15 |
| while, wile | wail | 17,821 → 44 |
| wife | waif | 17,795 → 17 |
| since | sins | 16,064 → 455 |
| turn | tern | 15,630 → 1 |
| case | kays | 14,403 → rare |
| mine | main | 12,800 → 2,179 |
| matter | mater | 18,900 → 83 |
| else | els | 22,907 → 4 |

### Notable Collisions

**white → wait**: Both common words. "The wait house" = "the white house". Note: "wait" translates to "wayt", so they don't merge.

**ass → as**: Reversed direction - uncommon word translates to common word. Context handles "as" vs "as" fine.

**place → plays**: Both common. "In the first plays" = "in the first place".

---

## Homophone Groups

Ingglish merges homophones (words that sound identical). This isn't a collision problem - it's just how phonetic spelling works.

| English | Ingglish |
|---------|----------|
| laurey, lauri, laurie, laury, lawrie, lawry, loree, lorey, lori, lorie, lorrie, lorry, lory, lowrie (14) | loree |
| carey, carie, carrey, carrie, cary, kairey, kari, karry, kary, kerrey, kerri, kerry (12) | kairee |
| hsu, schoo, schou, schue, schuh, shew, shiu, shoe, shoo, shu, shue (11) | shuu |
| aer, air, ayre, eir, ere, err, eyre, heir, ire | air |
| au, aux, eau, eaux, o, oh, ohh, ow, owe | oh |
| c, cie, sci, sea, see, si, sie, sieh | see |
| ewe, u, uwe, yew, yoo, you, yu, yue | yuu |

---

## Running the Analysis

```bash
cd packages/core
npx vitest run -t "collision analysis"
```

The analysis script is at `packages/core/src/collision-analysis.test.ts`.
