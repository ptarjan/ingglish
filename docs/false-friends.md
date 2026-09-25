# Ingglish False Friends Analysis

Sometimes an English word's Ingglish spelling is also a **different** English word: "white" becomes "wait". These are [false friends](https://en.wikipedia.org/wiki/False_friend): they look like familiar English words, but in Ingglish they are pronounced differently. They are **not** collisions (two different words sharing one Ingglish spelling). Each Ingglish spelling stands for exactly one pronunciation, so Ingglish itself is never ambiguous; the only risk is a reader mistaking the word for the English one it resembles.

## Summary

| Metric | Count |
|--------|-------|
| Total words analyzed | 117,493 (lowercase alphabetic words from the ~126,000 entries of cmudict, the CMU pronouncing dictionary) |
| False friends (Ingglish spelling is a different English word) | 1,360 |
| False friends involving common words (freq >= 20 /M) | 175 |

### Is This a Problem?

**Rarely.** Looking at the data:

- Most false friends turn a common word into an **obscure** one (rait, wont, heer, fain, hou, uv), which you'll rarely meet in normal text.
- Only 7 involve two common words: uh→u, yeah→ya, white→wait, ass→as, place→plays, side→said, mine→main
- **Grammar** settles most cases: white is an adjective and wait is a verb, so they appear in different places in a sentence
- Context settles the rest, just as it does for English homophones (their/there/they're)

## False Friends (Common Words)

Each Ingglish spelling below is also an English word, with its English meaning in brackets. Freq /M gives how often each word appears per million words of text, first for the original English word and then for the English word its Ingglish spelling matches. The figures come from the SUBTLEX-US corpus ([Brysbaert & New 2009](https://doi.org/10.3758/BRM.41.4.977), "Moving beyond Kučera and Francis," *Behavior Research Methods*).

| English | Ingglish | Freq /M |
|---------|----------|---------|
| uh | uh (interjection) | 736 → 736 |
| of | uhv (not a word) | 11,882 → rare |
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

**white → wait**: adjective → verb. Because they are different parts of speech, there's no ambiguity: "the wait house" is ungrammatical as English. And since "wait" itself becomes "wayt", translating Ingglish back to English still works.

**ass → as**: noun → preposition. Grammar settles this easily: "as" never appears where a noun would.

**place → plays**: noun → verb/noun. Both can be nouns, but the noun "plays" means theater works, so "In the first plays" sounds wrong.

**side → said**: noun → verb (past tense). Different parts of speech in most contexts, though "said" can be an adjective in legal English ("the said document"). "said" itself becomes "sed".

**mine → main**: pronoun/noun → adjective. As a pronoun, grammar settles it: "main" is almost never used on its own after a verb, so "dhat wuhn iz main" can only mean "that one is mine". As a noun before another noun, only meaning helps: "dha main entrans" is grammatical either way and could be "the mine entrance" or "the main entrance", so the reader relies on context. "main" itself becomes "mayn".

## Homophone Groups

Ingglish gives homophones (words that sound identical) the same spelling. These aren't the kind of collision Ingglish tries to avoid: any system that spells by sound must spell words that sound the same the same way. Some examples:

| English | Ingglish |
|---------|----------|
| laurey, lauri, laurie, laury, lawrie, lawry, loree, lorey, lori, lorie, lorrie, lorry, lory, lowrie (14) | loree |
| carey, carie, carrey, carrie, cary, kairey, kari, karry, kary, kerrey, kerri, kerry (12) | kairee |
| hsu, schoo, schou, schue, schuh, shew, shiu, shoe, shoo, shu, shue (11) | shoo |
| aer, air, ayre, eir, ere, err, eyre, heir, ire (9) | air |
| au, aux, eau, eaux, o, oh, ohh, owe (8) | oh |
| c, cie, sci, sea, see, si, sie, sieh (8) | see |
| ewe, u, uwe, yew, yoo, you, yu, yue (8) | yoo |

## Running the Analysis

```bash
npm run analyze-collisions -w ingglish
```
