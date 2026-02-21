# Ingglish False Friends Analysis

When an English word is translated to Ingglish, it sometimes produces a spelling that matches a **different** existing English word. These are [false friends](https://en.wikipedia.org/wiki/False_friend) — they look like familiar English words but have different pronunciations in Ingglish. They are **not** collisions: each Ingglish spelling maps to exactly one pronunciation, so there is no ambiguity in the system.

## Summary

| Metric | Count |
|--------|-------|
| Total words analyzed | 117,493 (lowercase alphabetic words from cmudict's 135,166 entries) |
| False friends (Ingglish matches different English word) | 1,360 |
| False friends involving common words (freq >= 20 /M) | 175 |

### Is This a Problem?

**Rarely.** Looking at the data:

- Most false friends translate common words to **obscure** words (rait, wont, heer, fain, hou, uv). You'll rarely encounter these in normal text.
- Only 7 involve two common words: uh→u, yeah→ya, white→wait, ass→as, place→plays, side→said, mine→main
- **Part of speech differences** resolve most cases: white (adj) → wait (verb) are grammatically distinct
- Context resolves these just like English homophones (their/there/they're)

## False Friends (Common Words)

Frequency shows per-million rates from the SUBTLEX-US corpus ([Brysbaert & New 2009](https://doi.org/10.3758/BRM.41.4.977), "Moving beyond Kučera and Francis," *Behavior Research Methods*). The Ingglish column is also an English word.

| English | Ingglish | Freq /M |
|---------|----------|---------|
| uh | u (you informal) | 736 → 50 |
| of | uv (ultraviolet) | 11,882 → rare |
| right, write, rite | rait (soak flax) | 4,114 → rare |
| how | hou (place suffix) | 3,136 → rare |
| yeah | ya (you informal) | 3,063 → 154 |
| want | wont (habit) | 2,831 → 2 |
| here, hear | heer (yarn measure) | 4,644 → <1 |
| ass | as (preposition) | 232 → 2,274 |
| side, sighed | said (past of say) | 206 → 1,138 |
| white | wait (verb) | 176 → 852 |
| place | plays (verb/noun) | 619 → 31 |
| fine | fain (gladly/archaic) | 614 → <1 |
| while, wile | wail (cry) | 359 → 1 |
| wife | waif (homeless person) | 358 → <1 |
| since | sins (wrongdoings) | 323 → 9 |
| turn | tern (seabird) | 315 → <1 |
| case | kays (kilometers/slang) | 290 → rare |
| mine | main (primary) | 258 → 44 |
| matter | mater (mother/Latin) | 380 → 2 |
| else | els (elevated trains) | 461 → <1 |

### Notable False Friends

**white → wait**: adjective → verb. Different parts of speech make this unambiguous: "the wait house" is grammatically odd. Note: "wait" translates to "wayt", so reverse translation works.

**ass → as**: noun → preposition. Grammar resolves this easily - "as" never appears where a noun would.

**place → plays**: noun → verb/noun. Same part of speech possible, but "plays" as noun means theater works. "In the first plays" sounds wrong.

**side → said**: noun → verb (past tense). Different parts of speech in most contexts, though "said" can be an adjective in legal English ("the said document"). Note: "said" translates to "sed".

**mine → main**: noun/pronoun → adjective. Different parts of speech. "The main entrance" vs "the mine entrance" - grammar disambiguates. Note: "main" translates to "mayn".

## Homophone Groups

Ingglish merges homophones (words that sound identical). This isn't a collision problem - it's just how phonemic spelling works.

| English | Ingglish |
|---------|----------|
| laurey, lauri, laurie, laury, lawrie, lawry, loree, lorey, lori, lorie, lorrie, lorry, lory, lowrie (14) | loree |
| carey, carie, carrey, carrie, cary, kairey, kari, karry, kary, kerrey, kerri, kerry (12) | kairee |
| hsu, schoo, schou, schue, schuh, shew, shiu, shoe, shoo, shu, shue (11) | shuu |
| aer, air, ayre, eir, ere, err, eyre, heir, ire (9) | air |
| au, aux, eau, eaux, o, oh, ohh, owe (8) | oh |
| c, cie, sci, sea, see, si, sie, sieh (8) | see |
| ewe, u, uwe, yew, yoo, you, yu, yue (8) | yuu |

## Running the Analysis

```bash
npm run analyze-collisions -w ingglish
```

The analysis script is at `packages/core/scripts/cli/collision-analysis.ts`.
