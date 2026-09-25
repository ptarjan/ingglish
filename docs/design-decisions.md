# How Ingglish Was Designed

This page gives an overview of the whole design. It covers what Ingglish is for, the goals it set, the limits it had to work within, how each candidate spelling was tested, and the spelling that resulted. Each part links to the page that makes the full argument, and the list at the end of this page ([Read On](#read-on)) gives those pages in reading order.

## Why Ingglish Exists

My 5-year-old is learning to read. I keep having to say "sorry, that letter is silent" or "no, those letters make a different sound in this word." The letters "ough" alone have at least six pronunciations: though, through, rough, cough, thought, bough. Every learner of English, child or adult, pays this cost.

I wanted a spelling that lets you look at any word and know how to say it. I didn't want a new alphabet or a political campaign. I wanted consistent spelling that you can type on any keyboard and convert back to standard English whenever you need to. In Ingglish those six "ough" words are spelled dhoh, throo, ruhf, kof, thawt and bou. Each of those spellings stands for one sound wherever it appears ("dh" is always the "th" of "this", "oh" always the vowel of "go"), and the table [below](#the-result-at-a-glance) lists them all.

## The Goals

1. **One sound, one spelling.** Each [phoneme](https://en.wikipedia.org/wiki/Phoneme) (a distinct speech sound) has exactly one spelling, and each spelling stands for one sound. There are a few exceptions, listed [below](#the-result-at-a-glance).
2. **Plain keyboard letters.** No accents and no new symbols. Only 24 of the 26 letters appear: q and x are never used, and c appears only in "ch".
3. **Familiar to English readers.** Where English already has a regular spelling for a sound, Ingglish uses it.
4. **Reversible.** English converts to Ingglish the same way every time, and Ingglish converts back to English.
5. **Voluntary.** Ingglish sits alongside English. It is not trying to replace it.

These goals conflict. Goal 3 says to reuse English spellings, but most English spellings stand for more than one sound, which breaks goal 1. Most of the design work went into settling that conflict one sound at a time.

## The Constraints

Four limits shaped every choice:

- **One accent has to be chosen.** A spelling based on sound must follow a particular accent. Ingglish uses [General American](https://en.wikipedia.org/wiki/General_American_English) as recorded in the [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary) from Carnegie Mellon University, the free dictionary of 126,051 words that Ingglish is built on. Where the dictionary lists two pronunciations, the Ingglish translator (the converter on this site) uses the first. It lists "caught" first with the vowel of "hot", as many Americans say it, so the translator writes kot. It lists "taught" with the vowel of "law", so that becomes tawt. [Which Accent](dialect-assumptions.md) explains what this means for speakers of other accents.
- **Words that sound alike must be spelled alike, and other words must not be.** "Write" and "right" sound the same, so both are spelled rait. Converting back picks the more common word, "right". But a spelling rule must not merge words that sound *different*: "star" and "store" must stay apart. [Homophones & False Friends](false-friends.md) covers both cases.
- **Readers must say it right.** A spelling that looks like English but leads an English reader to the wrong sound fails, even if it matches more English words. [Pronounceability](metrics.md#pronounceability) measures this.
- **Word families lose some of their visual link.** English often spells related words alike even when they sound different: "sign" and "signal". Spelling by sound gives that up (sain, signal). [Word Families](morphological-analysis.md) shows where family links survive and where they break.

## How Candidate Spellings Were Judged

Three terms come up throughout these pages:

- An **identical word** is one that Ingglish spells exactly as English does ("out" stays out).
- **/M** means occurrences per million words of real English text, from SUBTLEX-US, a count of the words in about 50 million words of American film and TV subtitles. It measures how often a reader actually meets a word, so gaining "my" counts far more than gaining a rare surname.
- A **collision** is two English words with different sounds ending up with the same Ingglish spelling.

Each candidate spelling was tested five ways:

1. **Text kept as it is.** How much everyday text would look identical to English, counting each word by how often it is used. See [Text Preserved](metrics.md#text-preserved).
2. **No new collisions.** A spelling that merges words is rejected, however many words it gains. See [Unambiguous Text](metrics.md#unambiguous-text).
3. **Pronounceability.** A computer program applies the rules English readers use to sound out spelling. It guesses how each Ingglish word would be said, and the guess is compared with the real pronunciation. See [Pronounceability](metrics.md#pronounceability).
4. **The mispronunciation check.** Some failures are clearer by reading than by scoring. "ow" keeps "snow" and "show" identical, but an English reader would say "howm" (home) to rhyme with "cow". Other failures come from a letter that already has a job: "y" for the vowel in "my" is rejected because "y" already spells the first sound of "yes".
5. **Precedent.** Whether other languages already use the spelling for that sound. Each spelling is rated by how many of 37 compared languages use it for that sound; see the [commonality ratings](orthography-comparison.md#commonality-ratings-summary).

A computer search then tried every alternative spelling. It tried each of the 39 sounds (phonemes) the dictionary distinguishes with each of 70 candidate spellings, 2,730 combinations in all. It then tried 1,036 more that change a vowel only where it is unstressed (said weakly). With the current spellings, 9,385 of the 126,051 dictionary words (7.45%) come out identical. The search found:

- **The spellings that would keep the most words identical all cause collisions.** Spelling the vowel of "go" as "o" would gain 21.0K /M, but "note" and "not" would become the same word. Using "s" for the "z" sound would gain 19.3K /M, but "zip" and "sip" would become the same word.
- **Only two collision-free changes gain text, and both were rejected.** "y" for the vowel in "my" would gain 10.1K /M (my, by, try), but "y" already spells another sound. "oy" for the vowel in "boy" would gain 234 /M, but it would lose "point", "join" and "oil", a gain too small to be worth the change.
- **Spelling some unstressed vowels differently looks promising.** This is still being studied.

[Testing Every Alternative](identical-words-analysis.md) gives every candidate and its numbers. For anyone rerunning them, these figures come from the scripts `exhaustive-search.ts` and `analyze-identical-words.ts` in packages/core, run at ingglish commit 0601e97b. The spellings did not arrive in one step: some were changed and later changed back (the vowel of "law" was spelled aw, then o, then aw again). [Spelling History](spelling-iteration.md) records every change.

## The Result at a Glance

Each row links to the section that argues for that spelling. The "English" column gives an example word, and the "Ingglish" column shows how Ingglish spells it.

| Sound as in | English | Ingglish | Spelling | Why, in one line |
|-------------|---------|----------|----------|------------------|
| [sit](vowel-spellings.md#kit-sit-i) | sit | sit | i | Same as English and nearly every other language |
| [bed](vowel-spellings.md#dress-bed-e) | bed | bed | e | Same as English and nearly every other language |
| [cat](vowel-spellings.md#trap-cat-a) | cat | kat | a | Same as English and nearly every other language |
| [hot, father](vowel-spellings.md#lot-and-palm-hot-father-o) | hot | hot | o | Keeps hot, got and not unchanged |
| [but, cup](vowel-spellings.md#strut-but-cup-uh) | cup | kuhp | uh | The English interjection "uh"; leaves "u" free for "book" |
| [book, put](vowel-spellings.md#foot-book-put-u) | put | put | u | What most languages use "u" for |
| [see](vowel-spellings.md#fleece-see-ee) | see | see | ee | English see, bee, tree |
| [too, food](vowel-spellings.md#goose-too-food-oo) | food | food | oo | English too, food, moon |
| [say](vowel-spellings.md#face-say-ay) | say | say | ay | English say, day, play |
| [go, show](vowel-spellings.md#goat-go-show-oh) | go | goh | oh | "o" already spells "hot"; "ow" would read as in "cow" |
| [law](vowel-spellings.md#thought-law-taught-aw) | law | law | aw | English law, saw; plain "o" would merge "taught" and "tot" |
| [my, time](vowel-spellings.md#price-my-time-ai) | time | taim | ai | Used in Pinyin, Italian and Vietnamese; "y" already spells the first sound of "yes" |
| [cow, out](vowel-spellings.md#mouth-cow-out-ou) | out | out | ou | Keeps out, loud and sound unchanged |
| [boy, coin](vowel-spellings.md#choice-boy-coin-oi) | coin | koin | oi | English coin, oil; "oy" would gain "boy" but lose "point" |
| [about (schwa, the weak unstressed vowel)](vowel-spellings.md#schwa-and-strut) | about | about | a | Keeps about, away and a unchanged |
| [vowel + R: star, store, air, beer](vowel-spellings.md#r-colored-vowels) | star store | star stor | ar, or, air, arr, eer, er, ur, uhr | Each vowel said together with R gets its own spelling, so "star" and "store" stay apart |
| [think](consonant-spellings.md#th-and-dh) | think | thingk | th | The English spelling, used only for the "th" of "think" |
| [this](consonant-spellings.md#th-and-dh) | this | dhis | dh | The second "th" sound needs its own spelling; Albanian uses "dh" |
| [measure](consonant-spellings.md#sh-and-zh) | measure | mezher | zh | sh said with the voice on, just as z is s with the voice on |
| [cat, kit](consonant-spellings.md#letters-kept-as-they-are) | cat | kat | k | "c" reads as "s" before e and i (city) |
| [box, quick](consonant-spellings.md#letters-ingglish-never-uses) | box quick | boks kwik | ks, kw | No x or q |
| [sing](consonant-spellings.md#ng) | sing | sing | ng | Same as English |
| [yes](consonant-spellings.md#y-and-w) | yes | yes | y | "y" is always a consonant |

The other consonants (b, ch, d, f, g, h, j, l, m, n, p, r, s, t, v, w, z) keep their usual English sound.

In a few places a spelling can be read two ways. The main one is "a", which spells both the vowel in "cat" and the weak vowel in "about". The eight vowel-plus-R spellings are also exceptions: each spells a vowel and an R said together as one sound. For example, star, store, air, arrow, beer, bird, tour and curry become star, stor, air, arroh, beer, berd, tur and kuhree. [R-Colored Vowels](vowel-spellings.md#r-colored-vowels) covers all eight, and the [Reading Ambiguities](orthographic-transparency.md#reading-ambiguities) section of How Transparent Is It? lists every spelling that can be read two ways.

## Sample Text: The North Wind and the Sun

This is the standard passage for comparing writing systems, shown in English and in Ingglish.

**English:**

> The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take off his cloak should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler wrap his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.

**Ingglish:**

> Dha North Wind and dha Suhn wer dispyooting wich woz dha strawnger, wen a travaler kaym alawng rapt in a worm klohk. Dhay agreed dhat dha wuhn hoo ferst sakseedid in mayking dha travaler tayk awf hiz klohk shud bee kansiderd strawnger dhan dha uhdher. Dhen dha North Wind bloo az hard az hee kud, buht dha mor hee bloo dha mor klohslee did dha travaler rap hiz klohk eround him; and at last dha North Wind gayv uhp dha atempt. Dhen dha Suhn shohn out wormlee, and imeedeeatlee dha travaler tuk awf hiz klohk. And soh dha North Wind woz ablaijd too kanfes dhat dha Suhn woz dha strawnger uhv dha too.

Many words stay identical: "North", "Wind", "and", "in", "a", "agreed", "hard", "him", "at", "last", "out". The biggest visual changes are "the" → "dha" (the "th" of "this" is spelled "dh") and vowels spelled by sound, as in "klohk" (cloak) and "strawnger" (stronger).

## How This Differs from Past Reforms

Earlier reforms asked readers to learn a new alphabet ([Shavian](https://en.wikipedia.org/wiki/Shavian_alphabet), [Deseret](https://en.wikipedia.org/wiki/Deseret_alphabet)), taught children a spelling they later had to unlearn (the [Initial Teaching Alphabet](https://en.wikipedia.org/wiki/Initial_Teaching_Alphabet)), or tried to impose change from above ([the Simplified Spelling Board](https://en.wikipedia.org/wiki/Simplified_Spelling_Board)). Ingglish uses ordinary letters, and the translator on this site converts text to and from standard spelling at any time. It asks nobody to switch. [Spelling Reform History](spelling-reform-comparison.md) covers what went wrong for past reforms and what worked.

## Read On

The design pages, in reading order:

1. [Which Accent](dialect-assumptions.md): the accent Ingglish follows, and what that means for other accents.
2. [How a Spelling Is Scored](metrics.md): the measures used to compare spellings.
3. [Testing Every Alternative](identical-words-analysis.md): the search over every candidate spelling, and what it found.
4. [Vowels, Sound by Sound](vowel-spellings.md): each vowel's spelling, the alternatives tried, and why this one won.
5. [Consonants, Sound by Sound](consonant-spellings.md): the same for consonants.
6. [Homophones & False Friends](false-friends.md): words Ingglish spells alike, and Ingglish spellings that look like other English words.
7. [Word Families](morphological-analysis.md): what spelling by sound does to related words.
8. [How Transparent Is It?](orthographic-transparency.md): how Ingglish compares to other languages on reading and spelling consistency.
9. [Spelling History](spelling-iteration.md): every change to Ingglish's own spellings, in order.

For look-up, [Phoneme Chart](phoneme-mapping.md) lists every sound and its spelling, and [How Other Languages Spell It](orthography-comparison.md) compares each spelling with 37 other languages. For other reforms, see [Spelling Reform History](spelling-reform-comparison.md) and [Reforms Proposed Today](community-landscape.md).
