# Ingglish Translation Collision Analysis

This document analyzes cases where translating an English word to Ingglish produces a spelling that matches a **different** existing English word.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total words analyzed | 117,493 |
| Collisions (Ingglish matches different English word) | 1,075 |
| Collisions involving common words (freq >= 1000) | 168 |

### Is This a Problem?

**Rarely.** Looking at the data:

- Most collisions translate common words to **obscure** words (rait, wont, heer, fain, hou, uv). You'll never encounter these in normal text.
- Only 5 collisions involve two common words: white→wait, ass→as, place→plays, side→said, mine→main
- **Part of speech differences** resolve most collisions: white (adj) → wait (verb) are grammatically distinct
- Context resolves these just like English homophones (their/there/they're)

## Collisions (Common Words)

Frequency shows SUBTLEX corpus counts. The Ingglish column is also an English word.

| English | Ingglish | Frequency |
|---------|----------|-----------|
| a, uh | u (you informal) | 1,041,179 → 2,506 |
| of | uv (ultraviolet) | 590,439 → rare |
| right, write, rite | rait (soak flax) | 204,428 → rare |
| how | hou (place suffix) | 155,867 → rare |
| yeah | ya (you informal) | 152,262 → 7,664 |
| want | wont (habit) | 140,718 → 81 |
| ass | as (preposition) | 11,545 → 113,068 |
| here, hear | heer (yarn measure) | 230,788 → 2 |
| side, sighed | said (past of say) | 10,247 → 56,531 |
| white | wait (verb) | 8,744 → 42,343 |
| place | plays (verb/noun) | 30,736 → 1,521 |
| fine | fain (gladly/archaic) | 30,502 → 15 |
| while, wile | wail (cry) | 17,821 → 44 |
| wife | waif (homeless person) | 17,795 → 17 |
| since | sins (wrongdoings) | 16,064 → 455 |
| turn | tern (seabird) | 15,630 → 1 |
| case | kays (kilometers/slang) | 14,403 → rare |
| mine | main (primary) | 12,800 → 2,179 |
| matter | mater (mother/Latin) | 18,900 → 83 |
| else | els (elevated trains) | 22,907 → 4 |

### Notable Collisions

**white → wait**: adjective → verb. Different parts of speech make this unambiguous: "the wait house" is grammatically odd. Note: "wait" translates to "wayt", so reverse translation works.

**ass → as**: noun → preposition. Grammar resolves this easily - "as" never appears where a noun would.

**place → plays**: noun → verb/noun. Same part of speech possible, but "plays" as noun means theater works. "In the first plays" sounds wrong.

**side → said**: noun → verb (past tense). Different parts of speech. "On the said" is grammatically incorrect. Note: "said" translates to "sed".

**mine → main**: noun/pronoun → adjective. Different parts of speech. "The main entrance" vs "the mine entrance" - grammar disambiguates. Note: "main" translates to "mayn".

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

## Running the Analysis

```bash
npm run analyze-collisions -w @ingglish/core
```

The analysis script is at `packages/core/scripts/collision-analysis.ts`.
