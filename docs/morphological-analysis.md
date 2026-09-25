# Word Families

Ingglish's first goal is one sound, one spelling (see [How Ingglish Was Designed](design-decisions.md)). This page covers what that goal costs: some related words stop looking related.

English spelling tries to show two things at once: how a word sounds, and which words it belongs with. Silent letters and loose vowel spellings often keep a family looking alike. "sign" and "signal" share the visible root "sign-", even though the "g" is silent in "sign". Ingglish spells by sound alone, so it gives up some of these visual links. In return, the spelling tells you how to say the word.

The page shows where family links survive in Ingglish, where they break, and where they get clearer. Sounds are written in IPA between slashes (/eɪ/ is the vowel in "say"); the [Phoneme Chart](phoneme-mapping.md) gives an example word for each. Two vowel spellings appear in almost every table. Ingglish usually writes schwa, the weak vowel at the start of "about", as a, so "sanity" is sanatee (its second a is the schwa) and the ending "-tion" is -shan. It writes the stressed vowel of "cup" as uh, so "production" is praduhkshan.

## The Fundamental Tradeoff

Every spelling system sits somewhere between two ideals:

- **Phonemic transparency**: the spelling shows the pronunciation (Finnish, Turkish).
- **Morphological transparency**: the spelling shows which words are related (Chinese, and English to some extent).

English often leans toward the second, keeping related words alike even when they sound different. Ingglish chooses the first, so related words that *sound* different also *look* different.

## Preserved Relationships

In these word families, the shared root sounds alike enough in every form that the Ingglish spellings still look related:

| Family | English | Ingglish | Shared root |
|--------|---------|----------|-------------|
| electric | electric / electricity / electrical | ilektrik / ilektrisatee / ilektrikal | ilektri- |
| magic | magic / magician / magical | majik / majishan / majikal | maji- |
| medicine | medicine / medical / medication | medasan / medakal / medakayshan | med- |
| produce | produce / production / productive | pradoos / praduhkshan / praduhktiv | prad- |
| reduce | reduce / reduction | radoos / raduhkshan | rad- |
| deep | deep / depth | deep / depth | same as English, where the vowel already changes |
| bomb\* | bombard / bombardment | bombard / bombardmant | bombard- |

\* "bombard" and "bombardment" still match, but "bomb" itself does not (see below).

## Broken Relationships

In these families, the pronunciation changes from one form to another, so the Ingglish spellings drift apart. Each pattern below comes from a regular sound change in English.

### Vowel Shift Alternations

Because of the [Great Vowel Shift](https://en.wikipedia.org/wiki/Great_Vowel_Shift) and related changes, many English root vowels switch between a "long" and a "short" sound when a suffix is added (sane → sanity). English spelling hides the switch behind a shared spelling; Ingglish shows it:

| Family | English | Ingglish | What changed |
|--------|---------|----------|-------------|
| sane / sanity | sane / sanity | sayn / sanatee | /eɪ/ -> /æ/ |
| serene / serenity | serene / serenity | sereen / serenatee | /iː/ -> /ɛ/ |
| divine / divinity | divine / divinity | divain / divinatee | /aɪ/ -> /ɪ/ |
| type / typical | type / typical / typify | taip / tipakal / tipafai | /aɪ/ -> /ɪ/ |
| cone / conic | cone / conic | kohn / konik | /oʊ/ -> /ɑ/ |
| please / pleasant | please / pleasant / pleasure | pleez / plezant / plezher | /iː/ -> /ɛ/ |
| heal / health | heal / health / healthy | heel / helth / helthee | /iː/ -> /ɛ/ |
| child / children | child / children | chaild / childran | /aɪ/ -> /ɪ/ |
| nation / national | nation / national | nayshan / nashanal | /eɪ/ -> /æ/ |

This is the most regular way word families drift apart. In English, rules like "a_e" (sane) vs "a" (sanity) keep the root "san-" visible across the change. Ingglish has to spell what it hears: "sayn" vs "san-".

### Silent Letter Reactivation

English keeps some consonants in the spelling even when they're silent, because they are pronounced in related words. Ingglish drops a silent consonant and writes it only where it is pronounced:

| Family | English | Ingglish | What changed |
|--------|---------|----------|-------------|
| sign / signal | sign / signal / signature | sain / signal / signacher | silent "g" returns |
| bomb / bombard | bomb / bombard | bom / bombard | silent "b" returns |
| condemn / condemnation | condemn / condemnation | kandem / kondamnayshan | silent "n" returns |
| malign / malignant | malign / malignant | malain / malignant | silent "g" returns |
| paradigm / paradigmatic | paradigm / paradigmatic | pairadaim / pairadigmatik | silent "g" returns |
| debt / debit | debt / debit | det / debit | silent "b" returns |
| resign / resignation | resign / resignation | rizain / rezagnayshan | silent "g" returns |
| autumn / autumnal | autumn / autumnal | awtam / awtuhmnal | silent "n" returns |

### Stress-Induced Vowel Reduction

When the stress moves to a different syllable, the vowels that lose it weaken to schwa, which Ingglish writes as a (see [Schwa and STRUT](vowel-spellings.md#schwa-and-strut)). So the spelling of the root changes:

| Family | English | Ingglish | What changed |
|--------|---------|----------|-------------|
| photograph / photography | photograph / photography | fohtagraf / fatografee | stress shift changes /oʊ/ -> /ə/ |
| condemn / condemnation | condemn / condemnation | kandem / kondamnayshan | multiple vowels shift |
| receipt / receive | receipt / receive | riseet / raseev | /ɪ/ -> /ə/ |

### Multiple Effects Combined

Some word families show several of these changes at once:

| Family | English | Ingglish | Effects |
|--------|---------|----------|---------|
| receipt / receive / reception | receipt / receive / reception | riseet / raseev / risepshan | vowel shift + stress + silent "p" returns |
| muscle / muscular | muscle / muscular | muhsal / muhskyaler | vowel change + a "y" sound added |
| know / knowledge | know / knowledge | noh / nolaj | silent "k" + vowel shift (/oʊ/ -> /ɑ/) |

## Improved Relationships

In a few cases, Ingglish's consistent consonant spelling makes the family link *clearer* than in English:

| Family | English problem | Ingglish improvement |
|--------|----------------|---------------------|
| magic / magician / magical | "c" is /k/ in "magic" and "magical" but /ʃ/ in "magician" | "k" consistently represents /k/, "sh" represents /ʃ/ |
| electric / electricity | "c" represents /k/ and /s/ | "k" and "s" are explicit |

These gains are small. Ingglish fixes a few consonant confusions, but it breaks more vowel links than it fixes.

## Summary

| What happens to the family | Families on this page | Why |
|----------|-------|---------|
| Still looks related | 7 | The root sounds about the same in every form |
| Split by a long/short vowel switch | 9 | sane/sanity: the root vowel changes sound |
| Split by a silent letter | 8 | sign/signal: a consonant is pronounced in only some forms |
| Split by a stress shift | 3 | Vowels that lose stress weaken to schwa |
| Clearer than in English | 2 | Each consonant sound has one spelling |

The rows overlap: condemn is split both by a silent letter and by a stress shift, and electric and magic both still look related and are clearer than in English.

The long/short vowel switch is the main loss. English marks sane and sanity as relatives by spelling the root vowel the same way (a_e and a, ee and e, i_e and i). Ingglish spells each vowel sound one way, so when the sound changes, the spelling changes with it.

Every spelling system that follows sound makes this trade. A reader can say any word from its spelling, but has to recognize some word families by meaning rather than by sight.
