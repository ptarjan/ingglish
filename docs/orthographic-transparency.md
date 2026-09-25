# How Transparent Is Ingglish?

Orthographic transparency is how predictably a writing system's spelling matches its pronunciation. It is the linguists' yardstick for the first goal in [How Ingglish Was Designed](design-decisions.md), "one sound, one spelling", and this page measures the finished design against it.

Linguists look at transparency in two directions:

- **Feedforward consistency** (reading): can you tell how a word sounds from its spelling?
- **Feedback consistency** (spelling): can you tell how a word is spelled from its sound?

English does poorly in both directions. Ingglish is fully predictable in the spelling direction, because Ingglish's translator (the tool on this site that converts English text) is built to give each sequence of sounds exactly one spelling, and nearly so in the reading direction.

Below, a *grapheme* is a letter or letter group that spells one sound (like "sh"), and a *phoneme* is one distinct speech sound. Symbols between slashes, like /o/, are phonemes written in IPA, the International Phonetic Alphabet. Capitalised codes like AH, ER and SH are the CMU Pronouncing Dictionary's ARPAbet names for phonemes (see the [Phoneme Chart](phoneme-mapping.md)). A trailing digit marks stress (AH0 is an unstressed AH), and "+" means one sound followed by another.

## The Standard Metrics

These metrics follow the method set out by [Ziegler, Stone & Jacobs (1997)](https://doi.org/10.3758/BF03214423) and refined by [Siegelman & Kearns (2019)](https://doi.org/10.3758/s13428-019-01317-y).

### Feedforward Consistency (Reading: Spelling -> Sound)

How many ways can a given grapheme be pronounced? The measure is a ratio: how often the grapheme has its most common pronunciation, divided by how often it appears at all. A ratio of 1.0 means the grapheme always makes the same sound.

### Feedback Consistency (Spelling: Sound -> Spelling)

How many ways can a given phoneme be spelled? The measure is the same ratio turned around: how often the phoneme gets its most common spelling, divided by how often it appears.

### Where Languages Fall

Linguists rank European spelling systems from *shallow* (spelling tracks sound closely) to *deep* (it doesn't). In the ranking used by [Seymour, Aro & Erskine (2003)](https://doi.org/10.1348/000712603321661859), Finnish is the shallowest, Italian is close behind, German sits in the middle, French is deeper, and English is the deepest of all. The same study found that English-speaking children take far longer to learn to read than children learning shallow spellings.

The two directions need not match. French is fairly predictable to read but hard to spell, because one sound often has many spellings: /o/ can be o, au or eau. English is inconsistent both ways, and worse for spelling than for reading.

| System | Reading (feedforward) | Spelling (feedback) |
|--------|----------------------|---------------------|
| Finnish | Almost fully consistent | Almost fully consistent |
| Italian | Very consistent | Consistent, with some sounds spelled more than one way |
| German | Mostly consistent | Less consistent |
| French | Fairly consistent (rule-governed) | Inconsistent |
| **Ingglish** | **Almost fully consistent** (see [Reading Ambiguities](#reading-ambiguities)) | **Fully consistent**, by design |
| English | Inconsistent ("ough" has six pronunciations) | Very inconsistent (/iː/ can be ee, ea, e, ie, ei, ey, ...) |

Ingglish's reading figure has not been measured yet; see [Methodology](#methodology).

## Ingglish Grapheme Inventory

Ingglish spells the 39 phonemes of the CMU dictionary (15 vowels and 24 consonants). Some vowels also get their own spelling before R, such as "ar" in "star" and "air" in "fair". They use 24 of the 26 standard letters, with no accent marks and no new symbols: Q and X never appear, and C appears only in "ch". The [Phoneme Chart](phoneme-mapping.md) has the full table.

In the spelling direction this is complete: the translator turns each sequence of phonemes into exactly one spelling. A few sounds do have two spellings, but a fixed rule always picks one:

- The CMU dictionary's AH is spelled by stress: "uh" when stressed (the vowel in "but") and "a" when unstressed (schwa, as in "about").
- Some vowels get a different spelling before R: the vowel of "hot" is "o", but before R it is "ar", as in "star".

So knowing how a word sounds (including its stress) always gives exactly one Ingglish spelling.

## Reading Ambiguities

A few Ingglish spellings can stand for more than one sequence of sounds, so reading them back can go two ways. The translator's reverse parser (which turns Ingglish back into English) keeps a list of these, and when a spelling has one, it tries both readings.

### 1. "a": the vowel in "cat" or schwa

The letter "a" stands for both the vowel in "cat" (/æ/, AE) and schwa, the weak unstressed vowel in "about" (/ə/, AH0). This is the only ambiguity that comes up often.

It is also the easiest compromise to defend. Schwa is the most common English vowel and appears in almost every unstressed syllable. And which sound "a" makes is largely predictable: in an unstressed syllable it is schwa; in a stressed syllable it is the "cat" vowel. [Schwa and STRUT](vowel-spellings.md#schwa-and-strut) explains why schwa is spelled "a".

### 2. Letter + "h" across a word part

"sh", "th", "dh", "zh" and "oh" each spell one sound. But the same two letters also turn up where one word part ends in s, t, d, z or the vowel of "hot", and the next begins with h:

- "mishap" → **mishap** (S+HH, not "sh")
- "courthouse" → **korthous** (T+HH, not "th")
- "adhere" → **adheer** (D+HH, not "dh")
- "clotheshorse" → **klohzhors** (Z+HH, not "zh")
- "aha" → **oho** (AA+HH, not "oh")

These are rare, and mostly in compounds and names.

### 3. "air" and "eer" before R

"air" is the vowel of "chair" (EH+R), and also of "admire" → **admair** (AY+R). "eer" covers both IH+R ("beer") and IY+R ("here"). The CMU dictionary gives some words of this kind IH+R and others IY+R, though most American speakers say them the same.

### 4. "aw" before a vowel

"aw" is the vowel in "law", but it also appears where schwa meets a W sound: "usual" → **yoozhawal**, "actual" → **akchawal**.

The other spellings for vowels before R, "ur" (tour → **tur**) and "uhr" (curry → **kuhree**), add no ambiguity: "u" and "uh" each spell only one sound.

## How English Compares

English spells its sounds in hundreds of ways. A few sounds alone show the problem. In the table, "e_e" means an e, one consonant, then a silent e, as in "these".

| Sound | English spellings | Count |
|-------|-------------------|-------|
| /iː/ (see) | ee, ea, e, ie, ei, ey, e_e, i, eo, ae, oe | 11 |
| /ʃ/ (she) | sh, ti, ci, si, ssi, ch, s, ce, sci | 9 |
| /k/ (kit) | c, k, ck, ch, cc, que, qu, kh, cq | 9 |
| /uː/ (too) | oo, u, ue, ew, ou, o, ui, u_e, ough, wo | 10 |

(Examples, in order: see, sea, me, field, receive, key, these, machine, people, Caesar, phoenix; she, nation, special, tension, mission, chef, sure, ocean, conscience; cat, kit, back, school, occur, unique, bouquet, khaki, acquire; too, flu, blue, new, soup, do, fruit, rule, through, two.)

Ingglish spells each of these sounds one way: ee, sh, k and oo.

## Uncertainty in Bits

[Shannon entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)) measures uncertainty in bits. An entropy of 0 means no uncertainty: the answer is fully predictable. Higher values mean more ambiguity.

In the spelling direction, Ingglish's entropy is **0 bits**, because knowing a word's sounds fixes its spelling completely. In the reading direction it should be **near 0**, since only the "a" ambiguity comes up often enough to add real uncertainty, but it has not been measured. English is well above zero in both directions.

## Comparison with Other Spelling Reforms

| System | Reading | Spelling | Script | Notes |
|--------|---------|----------|--------|-------|
| Ingglish | Almost fully consistent | Fully consistent | Latin (24 of 26 letters) | Letter pairs for sounds with no letter of their own |
| Shavian | Fully consistent | Fully consistent | New (48 letters) | Requires learning a new alphabet |
| Deseret | Fully consistent | Fully consistent | New (38 letters) | Requires learning a new alphabet |
| IPA | Fully consistent | Fully consistent | Latin plus new symbols | Not designed for everyday writing |
| SoundSpel | Mostly consistent | Less consistent | Latin | Keeps some alternative spellings |
| Cut Spelling | Somewhat better than English | Somewhat better than English | Latin | Drops silent and doubled letters but keeps many irregular spellings |
| Traditional English | Inconsistent | Very inconsistent | Latin | The baseline |

Among these, only the new alphabets and IPA are fully consistent in both directions. Ingglish's few reading ambiguities are the price of spelling every English sound with ordinary keyboard letters. [Spelling Reform History](spelling-reform-comparison.md) compares these reforms in more detail.

## Methodology

Ingglish's spelling-direction consistency follows from how the translator works. It builds each spelling from the word's [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary) phonemes, so the same sequence of phonemes always gives the same spelling ([to-ingglish.ts](https://github.com/ptarjan/ingglish/blob/main/packages/phonemes/src/to-ingglish.ts)). The reading ambiguities above are the ones the reverse parser tries both ways ([from-ingglish.ts](https://github.com/ptarjan/ingglish/blob/main/packages/phonemes/src/from-ingglish.ts)).

The ratings for other languages and reforms are a ranking, not measurements. The reading-direction consistency ratio for Ingglish has not been computed yet. A proper figure would count these ambiguities across the CMU dictionary, weighted by how common each word is in the [SUBTLEX-US corpus](https://doi.org/10.3758/BRM.41.4.977) of American film and TV subtitles.

Next in the design story: [Spelling History](spelling-iteration.md), every change and why.
