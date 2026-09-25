# Testing Every Alternative Spelling

One of Ingglish's goals is to look familiar to English readers (see [How It Was Designed](design-decisions.md)). The simplest measure of that is how many words Ingglish spells exactly as English already does. This page asks whether a different spelling for any one sound would keep more words unchanged. To answer, a script tried every sound with every plausible spelling. This page reports what that search found and why Ingglish still uses the spellings it has.

The yardsticks used here are defined on [How a Spelling Is Scored](metrics.md). The reasoning for each sound's final spelling is on [Vowels, Sound by Sound](vowel-spellings.md) and [Consonants, Sound by Sound](consonant-spellings.md).

## Summary

- The current spellings leave **9,385 words identical** to English: 7.45% of the 126,051 words in the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary), the pronunciation dictionary Ingglish is built on.
- Some changes would keep many more words identical, but only by giving two different words the same spelling. For example, spelling /oʊ/ as "o" would make "own" and "on" both "on". Those changes were ruled out.
- A search tried each of Ingglish's 39 sounds with each of 70 candidate spellings. Only **six** single-sound changes keep more dictionary words identical without adding to the collision count (all six are listed below). Weighted by how often words occur, just two of the six have a positive effect: /aɪ/ → "y" (+10.1K /M) and /ɔɪ/ → "oy" (+234 /M). Ingglish rejects both. "y" already spells the consonant in "yes", and the "oy" gain is tiny: about one word in 4,000. The other four make less real text identical.
- The search has two blind spots, described below. It drops a change before weighing it by frequency if it breaks more dictionary words than it fixes, and it checks only the total number of collisions. A second script, `analyze-identical-words.ts`, measures some of the changes the first one drops.
- The most promising direction is a separate spelling for some vowels when they are unstressed, such as "y" for the unstressed "ee" at the end of "every". Ingglish already does this for schwa. These candidates are still open questions.

## Terms Used on This Page

- **Identical word:** a word whose Ingglish spelling is the same as its English spelling, like "bit" → "bit". "Boat" → "boht" is not identical.
- **/M (per million):** how often words occur in real text, counted per million words of the [SUBTLEX-US](https://doi.org/10.3758/BRM.41.4.977) corpus of film and TV subtitles (49.7 million words). "My" occurs about 6,900 times per million words, written 6.9K /M. A change's **net /M** is the frequency of the words it makes identical minus the frequency of the words it breaks (words that are identical today and would stop being so).
- **Collision:** two different English words that end up with the same Ingglish spelling. Some are unavoidable: homophones like "right" and "write" sound the same, so a spelling built from sound must merge them. The search's rule is that a change must not add collisions: the total must not go up. Today's total is 18,870. If three words share one spelling, that counts as two collisions.
- **Sound notation:** sounds are written in IPA between slashes, each with an example word: /aɪ/ is the vowel in "my". The dictionary writes sounds in ARPAbet, a plain-letter phonetic alphabet. For example, AY is the vowel in "my", OW the vowel in "go", IY the vowel in "see". A digit after a vowel marks stress. 0 means unstressed, and 1 or 2 means stressed. So IY0 is the unstressed "ee" at the end of "happy". The [Phoneme Chart](phoneme-mapping.md) lists every code.

These are the current spellings of the words discussed below:

| Word | Ingglish |
|------|----------|
| bit | bit |
| boat | boht |
| my | mai |
| boy | boi |
| point | point |
| saw | saw |
| show | shoh |
| own | ohn |
| on | on |
| know | noh |
| now | nou |

## Why Weight by Frequency

Most of the dictionary's 126,051 entries are rare: surnames, place names, borrowed words. A raw count treats "einstein" the same as "my", so a change that gains 200 rare surnames and loses "say", "day" and "way" would look like a win. Weighting each word by how often it occurs in real text measures what a reader actually sees. Every result on this page is ranked by net /M.

## Changes That Win Only by Colliding

Several changes would keep many more common words identical. Every one of them gives some pair of words that Ingglish now keeps apart the same spelling. The script `analyze-identical-words.ts` (see [Methodology](#methodology)) measures each change on its own and reports the most frequent pair of words it would merge:

| Change | Net /M | Words that would share a spelling |
|--------|--------|-----------------------------------|
| /iː/: ee → e | +28.4K | "here" and "her" would both become "her" |
| /oʊ/: oh → o | +21.0K | "own" and "on" would both become "on" |
| /ʌ/: uh → u | +20.2K | "luck" and "look" would both become "luk" |
| /z/: z → s | +19.3K | "as" and "ass" would both become "as" |
| /ʊ/: u → oo | +5.3K | "full" and "fool" would both become "fool" |
| /ʌ/: uh → o | +3.7K | "done" and "don" would both become "don" |
| /ɔ/: aw → o | +834 | "law" would become "lo", which is already Ingglish for "la" |

Two more changes add few or no collisions but fail a different test: would an English reader say the spelling correctly? English "c" reads as /s/ before e, i and y, so /k/ → "c" (+5.7K /M) would turn "kid" and "keep" into "cid" and "ceep". /k/ → "ck" (+990 /M) would put "ck" at the start of words, where English never uses it.

The script also tests five changes applied at once: three from the table (/oʊ/ → o, /z/ → s, /ɔ/ → o) plus /ʌ/ → a and /ɑ/ → a (the vowel in "hot"), which lose text on their own (−1.2K and −23.7K /M). Together they would raise identical words to 12,198 (9.68%). The price is merging many pairs of common words, so all five were rejected.

## The Exhaustive Search

`exhaustive-search.ts` tries every sound with every spelling in a fixed list of 70 options: 26 single letters and 44 two-letter combinations. That makes 39 × 70 = 2,730 pairs. Skipping each sound's current spelling leaves 2,693 to test. (Two current spellings, "uh" and "oh", are not in the list of 70, so there is nothing to skip for them.) A candidate survives only if:

1. it makes more dictionary words identical than it breaks (a raw count), and
2. it does not raise the total number of collisions.

2,672 candidates failed the first test, 15 failed the second, and six passed both. Both tests have blind spots:

- **The first test counts dictionary words, not text.** A change that helps real text but breaks more (mostly rare) dictionary words than it fixes is dropped before frequency is considered. /k/ → "c" (+5.7K /M) and /aɪ/ → "ie" (+890 /M) are two examples. `analyze-identical-words.ts` measures such changes directly. The reasons they were rejected are on [Consonants, Sound by Sound](consonant-spellings.md) and [Vowels, Sound by Sound](vowel-spellings.md).
- **The second test compares totals.** A change passes if the collisions it adds are offset by collisions it removes. /aɪ/ → "y" is one: "ironing" and "yearning" would both become "yerning", and "iron" and "yearn" would both become "yern".

The six survivors, ranked by net /M:

| Sound | Current | Candidate | Words gained | Words lost | Net /M | Top gains | Top losses | Verdict |
|-------|---------|-----------|--------------|------------|--------|-----------|------------|---------|
| /aɪ/ (AY) | ai | y | 233 | 58 | **+10.1K** | my (6.9K), by (1.4K), try (489) | shanghai (5), saigon (4), ai (4) | Rejected: "y" already spells the "y" in "yes" |
| /ɔɪ/ (OY) | oi | oy | 155 | 130 | **+234** | boy (543), enjoy (85), joy (29) | point (243), join (86), oil (42) | Rejected: too small to matter |
| /aɪ/ (AY) | ai | ei | 429 | 58 | **−4** | einstein (5), heist (3), heil (3) | shanghai (5), saigon (4), ai (4) | Rejected: surnames only |
| /ɔ/ (AO) | aw | au | 210 | 146 | **−555** | fault (107), paul (97), launch (20) | saw (413), law (119), lawyer (82) | Rejected: net loss |
| /oʊ/ (OW) | oh | ow | 253 | 102 | **−1.3K** | show (501), own (471), throw (132) | oh (3.4K) | Rejected: net loss; "know" would read as "now" |
| /oʊ/ (OW) | oh | oe | 138 | 102 | **−3.2K** | (rare words) | oh (3.4K) | Rejected: net loss |

Numbers in parentheses are /M. Four of the six lose in running text even though they gain in raw count. That is the frequency weighting doing its job. Each verdict is argued in full on [Vowels, Sound by Sound](vowel-spellings.md).

### /aɪ/ → "y" (+10.1K /M)

This is the biggest collision-free gain the search finds. "My", "by", "try", "fly" and "sky" would all stay identical. Ingglish rejects it because "y" already spells the consonant /j/ in "yes" and "you". One letter would then spell two sounds, which breaks Ingglish's first goal: one sound, one spelling (see [How It Was Designed](design-decisions.md)). The collision check compares only whole words, so it cannot catch this, and the change also merges some words outright ("iron" and "yearn", above). The trouble shows up when a word starts with this vowel followed by another vowel. "Iota" (now aiohta) would become "yohta", and "ion" (now aian) would become "yan". Both would be read as starting with the "y" of "yes". The unstressed-vowel candidate in the next section would also want "y" for the unstressed "ee" at the end of "every", so "y" could end up spelling three sounds. See [why /aɪ/ is spelled "ai"](vowel-spellings.md#price-my-time-ai).

### /ɔɪ/ → "oy" (+234 /M)

"Boy", "enjoy" and "joy" would stay identical, but "point", "join" and "oil" would change. English uses "oi" and "oy" about equally, so the change comes out close to even. It isn't worth changing a settled spelling for +234 /M. See [why /ɔɪ/ is spelled "oi"](vowel-spellings.md#choice-boy-coin-oi).

### /aɪ/ → "ei" (−4 /M)

This gains 371 words by raw count, the most of the six. Nearly all of them are German surnames like Einstein and Stein, and the change affects almost no real text.

### /ɔ/ → "au" (−555 /M)

It gains "fault", "Paul" and "launch" but loses "saw", "law" and "lawyer", which are more common. See [why /ɔ/ is spelled "aw"](vowel-spellings.md#thought-law-taught-aw).

### /oʊ/ → "ow" and "oe" (−1.3K and −3.2K /M)

"Ow" gains "show", "own" and "throw", but "oh" alone outweighs them all. It also invites misreading. English uses "ow" for both the vowel in "snow" and the one in "cow", and Ingglish uses "ou" for the "cow" sound. So under this change "know" would be spelled "now", which an English reader would read as the word "now". "Oe" loses "oh" and gains only rare words. See [why /oʊ/ is spelled "oh"](vowel-spellings.md#goat-go-show-oh).

### /uː/ → "eu" (−3.7K /M)

This candidate is not in the search output, because it breaks more words than it makes identical. It is listed here because an earlier version of this page recommended against it on different grounds. `analyze-identical-words.ts` measures it at −3.7K /M, with no new collisions. It would keep rare words like "zeus" and "neutral" identical but break common words that "oo" already keeps identical, such as "room", "soon" and "food". See [why /uː/ is spelled "oo"](vowel-spellings.md#goose-too-food-oo).

## Stress-Conditioned Alternatives

The dictionary uses one code, AH, for two different sounds: the unstressed schwa in "sofa" and the stressed vowel in "cup". Ingglish spells them differently, "a" and "uh" (see [how schwa is spelled](vowel-spellings.md#schwa-and-strut)). Other vowels also change when unstressed. The "ee" at the end of "happy" is shorter and lighter than the "ee" in "bee". So the search's second phase tries a new spelling for the unstressed (stress-0) form of each vowel alone, leaving the stressed forms as they are.

It tested the 15 unstressed vowels against the same 70 options: 1,036 combinations after skipping each vowel's current spelling. 20 candidates passed both filters. These are the top five:

| Unstressed sound | Current | Candidate | Net /M | Top gains | Top losses |
|------------------|---------|-----------|--------|-----------|------------|
| IY0 (the "ee" in "happy") | ee | y | **+2.5K** | every (563), party (239), story (226), body (201) | frisbee (2), godspeed (1), chimpanzee (1) |
| IY0 | ee | e | **+1.2K** | maybe (950), report (111), pretend (41) | frisbee (2), godspeed (1) |
| OW0 (the "o" in "hotel") | oh | o | **+238** | hotel (106), noel (19), motel (19), november (9) | none |
| IY0 | ee | ie | **+199** | charlie (114), sweetie (55) | frisbee (2), godspeed (1) |
| IY0 | ee | ey | **+130** | barney (20), stanley (19), harvey (17) | frisbee (2), godspeed (1) |

The other 15 are worth +113 /M or less each. An earlier run also listed UW0 (unstressed "oo") → "o", which made "into" identical. It no longer passes the search's filters.

Two candidates stand out, and both match how English already spells the sound. English writes the unstressed "ee" as "y" in "every", "party" and "body", and the unstressed /oʊ/ as "o" in "hotel", "also" and "tomato". Many phoneticians treat the "happy" vowel as a sound of its own ([happy tensing](https://en.wikipedia.org/wiki/Happy-tensing)).

Neither has been adopted. Three questions have to be answered first:

1. **Does another split by stress make Ingglish harder to learn?** The schwa split rests on a clear difference in sound. Is unstressed "ee" as distinct from stressed "ee", or just a quieter version of it?
2. **Do readers hear the unstressed forms as different sounds?** The "y" in "happy" does sound different from the "ee" in "bee", but is the difference as clear as schwa versus "uh"?
3. **What happens to "y"?** Unstressed "ee" → "y" would give "y" a second sound next to /j/. That is the same objection that rules out /aɪ/ → "y", though weaker, because English readers already read a final "y" this way.

When the search applies every change from both phases that doesn't clash with one already applied, identical words rise from 9,385 (7.45%) to 11,069 (8.78%), and collisions fall from 18,870 to 18,530. That combined set includes the rejected /aɪ/ → "y", so it is an upper bound, not a proposal.

## Why Raw Identical Word Count Misleads

A raw count of identical words has two blind spots:

1. **It weights every word the same.** Four of the six survivors of the exhaustive search gain in raw count but lose in real text. /aɪ/ → "ei" gains 371 words and still comes out at −4 /M.
2. **It says nothing about reading.** A change can keep words identical and add no collisions, yet still lead readers to say the wrong sound. That is why /aɪ/ → "y", /oʊ/ → "ow" and /k/ → "c" fail. [Pronounceability](metrics.md#pronounceability) measures this automatically.

The exhaustive search itself still uses a raw count as its first filter (see [its blind spots](#the-exhaustive-search)). Every metric used here is defined on [How a Spelling Is Scored](metrics.md).

## Methodology

The numbers on this page come from two scripts in `packages/core/scripts/analysis/`, run at commit 0601e97b of the Ingglish source code:

- `exhaustive-search.ts` runs in three phases. It tries every sound with all 70 options (2,730 pairs), then the unstressed form of every vowel (1,036 combinations), and finally applies every compatible survivor together, in order of net /M. It gives the baseline counts and both candidate tables.
- `analyze-identical-words.ts` measures a hand-picked list of alternatives one at a time, whether or not they pass the search's filters. For each one it reports the net /M and the most frequent pair of words it would merge. It gives the "Changes That Win Only by Colliding" table and the /uː/ → "eu" figure.

Both scripts rebuild each spelling from the dictionary with the real translation rules, including the [special spellings for vowels before R](vowel-spellings.md#r-colored-vowels) and the schwa split, so they match what the translator produces. Run them from `packages/core`:

```bash
npx vite-node --script scripts/analysis/exhaustive-search.ts
npx vite-node --script scripts/analysis/analyze-identical-words.ts
```
