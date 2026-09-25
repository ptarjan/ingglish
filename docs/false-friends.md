# Homophones, Collisions and False Friends

Ingglish's first goal is one sound, one spelling (see [How Ingglish Was Designed](design-decisions.md)). That goal has a consequence people often worry about: if words are spelled by how they sound, won't different words start to look the same? This page answers that worry. It separates three things that are easy to confuse, and it measures each one.

## Three Different Things

- **Homophones** are words that already sound the same in English, such as "there" and "their". Ingglish spells them the same (dhair), because it spells sounds. No system that spells by sound can avoid this.
- **Collisions** are words that sound *different* but would end up with the same spelling. Ingglish does not allow them: a spelling rule that creates one is rejected, however many words it would make look the same as in English.
- **False friends** are Ingglish spellings that happen to be a *different* English word: "white" is spelled wait. Inside Ingglish nothing is ambiguous, because wait is always read as the sound of "white". The risk is only that a reader used to English sees the English word "wait".

## Homophones: The Cost of Spelling by Sound

Of the 117,492 dictionary words checked (every entry made only of letters, with no apostrophes, digits or other symbols), 25,314 share their spelling with at least one other word. They fall into 10,301 groups. Many of these words are rare: names, letters of the alphabet and abbreviations ("c", "sea" and "see" are all see). The groups that matter in everyday text look like this:

| English | Ingglish |
|---------|----------|
| there, their | dhair |
| to, too, two | too |
| no, know | noh |
| right, write | rait |
| one, won | wuhn |
| here, hear | heer |
| new, knew | noo |
| for, four | for |
| by, buy, bye | bai |
| our, hour | ouer |
| whole, hole | hohl |
| would, wood | wud |
| night, knight | nait |
| which, witch | wich |
| piece, peace | pees |
| whether, weather | wedher |

Readers already handle these words in speech, where they sound identical and context tells them apart. Converting Ingglish back to English is the one place the merge costs something: each spelling gives back one word, the most common one. So dhair comes back as "there" even where the original said "their", and a person has to read the context to restore it.

## Collisions the Design Refused

Every candidate spelling was tested against the whole dictionary before it was adopted (see [Testing Every Alternative](identical-words-analysis.md)). The test counts the words that share their spelling with another word. Because homophones share spellings on purpose, the count is never zero: with the current spellings, 18,870 entries reuse a spelling that another entry already has. That count covers all 126,051 entries of the CMU Pronouncing Dictionary; the 117,492 words counted elsewhere on this page are the entries made only of letters (no apostrophes, digits or other symbols). A candidate can only push that number higher by merging words that sound different, so any candidate that raised it was rejected. The latest run rejected 15 of the 2,693 spelling changes it tested for this reason. A second test tried 1,036 changes that apply only to unstressed vowels (vowels in weak syllables, like the first vowel of "about"), and rejected 2 of them.

Several of the most visible choices in Ingglish exist to prevent a collision:

- **oh, not o, for the vowel of "go".** With o, note would become not, and coat would become cot. Spelling it o would make more words look exactly as they do in English: 21.0K more in every million words of text. It was still rejected, because of the collisions. See [GOAT](vowel-spellings.md#goat-go-show-oh).
- **aw, not o, for the vowel of "law".** With o, dawn would become don. See [THOUGHT](vowel-spellings.md#thought-law-taught-aw).
- **z, not s, for the sound in "zip".** With s, zip would become sip. Using s would make 19.3K more words per million look as they do in English. See [Letters Kept As They Are](consonant-spellings.md#letters-kept-as-they-are).
- **Special spellings for vowels before R.** If each vowel kept its usual spelling before R, hair would become her, and star would become stor, which reads as "store". Ingglish gives these vowels their own spellings (ar, or, air, arr, eer, er, ur and uhr). See [R-Colored Vowels](vowel-spellings.md#r-colored-vowels).

The per-million figures come from `analyze-identical-words.ts`. [Testing Every Alternative](identical-words-analysis.md) explains how they are measured.

## False Friends

### Summary

| Metric | Count |
|--------|-------|
| Words checked (the entries of the CMU Pronouncing Dictionary made only of letters) | 117,492 |
| Ingglish spellings that are also a different English word | 1,374 |
| ...where at least one of the words is common (20 or more per million words of text) | 179 |
| ...where both words are common | 17 |

Most false friends turn a common word into a rare one. "want" becomes wont (an old word for a habit), and "fine" becomes fain (archaic for "gladly"). Rare words like these seldom appear in text a reader would confuse them with.

### When Both Words Are Common

Frequencies are per million words of text, first for the English word and then for the English word its Ingglish spelling matches. They come from the SUBTLEX-US corpus ([Brysbaert & New 2009](https://doi.org/10.3758/BRM.41.4.977), "Moving beyond Kučera and Francis," *Behavior Research Methods*).

| English | Ingglish | Freq /M |
|---------|----------|---------|
| white | wait | 176 → 852 |
| side | said | 206 → 1.1K |
| mine | main | 257 → 44 |
| place | plays | 618 → 31 |
| ass | as | 232 → 2.3K |
| yeah | ya | 3.1K → 154 |
| file | fail | 45 → 25 |
| mile | mail | 22 → 38 |
| lied | laid | 45 → 31 |
| luke | look | 62 → 2.0K |

The other seven pairs involve interjections and letters: "nah" is spelled no, "ha" is ho, "ah" is o, "da" is do, "eh" is e, "mm" is m, and "yah" is yo.

### When the Look-Alike Is Rare

| English | Ingglish | What the look-alike means | Freq /M |
|---------|----------|--------------------------------|---------|
| want | wont | a habit | 2.8K → 2 |
| else | els | elevated railways | 461 → <1 |
| matter | mater | mother (old slang) | 380 → 2 |
| while | wail | a cry | 358 → 0.9 |
| wife | waif | a neglected child | 358 → 0.3 |
| since | sins | wrongdoings | 323 → 9 |
| turn | tern | a seabird | 314 → <1 |
| fine | fain | gladly (archaic) | 613 → 0.3 |

### Notable False Friends

Grammar settles most of these, because the two words are usually different parts of speech.

**white → wait**: an adjective against a verb. "Dha wait hous" (the white house) cannot be read as the verb. And "wait" itself is spelled wayt, so the two never meet inside Ingglish.

**ass → as**: a noun against a preposition. "as" never stands where a noun would.

**place → plays**: both can be nouns, but the noun "plays" means works of theater, so "In dha ferst plays" (in the first place) reads wrongly as English.

**side → said**: a noun against a verb in the past tense. "said" itself is spelled sed.

**mine → main**: the hardest case. The pronoun is easy. "main" almost never stands alone after a verb, so "Dhat wuhn iz main" can only mean "that one is mine". The noun is harder. In Ingglish, "Dha main entrans" can only be "the mine entrance". But a reader who takes main as the English word also gets a correct phrase, "the main entrance", so nothing warns them. Only the context does. "main" itself is spelled mayn.

## Running the Analysis

```bash
npm run analyze-collisions -w ingglish
```

The script is `packages/core/scripts/cli/collision-analysis.ts`. It translates every dictionary word and groups the words by their Ingglish spelling. A group of two or more words is a homophone group. A spelling that is also a different English word is a false friend. The figures on this page come from a run on 25 September 2026 at commit 0601e97b. The collision count of 18,870 comes from `scripts/analysis/exhaustive-search.ts` at the same commit.
