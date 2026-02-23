# Contemporary Spelling Reform Landscape

A survey of English spelling reform proposals from [r/conorthography](https://www.reddit.com/r/conorthography/) (February 2026), where dozens of independent designers have published their own systems. This provides a useful comparison point: where Ingglish's choices are mainstream, where they're unusual, and what criticisms any reform should expect.

The subreddit has 133+ English spelling reform posts alongside hundreds of other orthography projects (Ukrainian Latin, Korean Cyrillic, etc.). The analysis below draws from ~54 Latin-script English spelling reform posts and their comment threads.

## Design Choices Across Reforms

### Vowels

Most reforms converge on the same consonant spellings but diverge wildly on vowels. English has 14-15 vowel phonemes mapped onto 5 vowel letters, so every system must make hard choices.

| Sound | Most common choice(s) | Ingglish | Consensus? |
|-------|-----------------------|----------|------------|
| FLEECE /iː/ | ee | ee | Strong |
| FACE /eɪ/ | ay, ei (tied) | ay | Split |
| PRICE /aɪ/ | ai | ai | Strong |
| MOUTH /aʊ/ | ou, au (tied) | ou | Split |
| GOAT /oʊ/ | no consensus | oh | None |
| TRAP /æ/ | a | a | Strong |
| KIT /ɪ/ | i | i | Universal |
| DRESS /ɛ/ | e | e | Universal |
| STRUT /ʌ/ | u | uh | Strong |
| GOOSE /uː/ | uu, oo (tied) | oo | Split |
| FOOT /ʊ/ | oo, u (tied) | u | Split |
| Schwa /ə/ | most dodge it | a | None |

GOAT is the hardest vowel. Every system needs a way to distinguish "go" from "got": some use diacritics (ō, ô), some use digraphs (oa, ow, oh), some repurpose letters. Ingglish's "oh" appears to be unique across the corpus. The schwa is the second hardest; most systems avoid addressing it at all.

### Consonants

| Sound | Most common | Ingglish | Consensus? |
|-------|-------------|----------|------------|
| /ʃ/ | sh | sh | Near-universal |
| /tʃ/ | ch | ch | Universal |
| /dʒ/ | j (retained from English) | j | Strong |
| /ŋ/ | ng | ng | Universal |
| /ʒ/ | zh | zh | Moderate |
| /θ/ vs /ð/ | th for both (conservative) or th/dh (phonemic) | th/dh | Split |

The th/dh question is the most debated consonant choice. Conservative reforms keep "th" for both sounds, arguing English speakers can tell which is which from context. niels_singh's well-iterated Ðietsċ Eanglisċ system deliberately uses one symbol, arguing "the distinction between /θ/ and /ð/ is too rarely important in English to justify using two letters." Phonemic reforms split them. Both sides have vocal advocates.

A few systems represent /dʒ/ as a digraph (dj, dž, or even jz) to expose the affricate structure, but most keep English `j`.

### ASCII vs. Diacritics vs. New Characters

Three camps:

**Diacritics** (majority): ā, ē, ō, š, ž, etc. The most common approach, but also draws the most keyboard/typing complaints.

**New characters** (minority): thorn (þ), eth (ð), eng (ŋ), schwa (ə). Draws "this isn't a reform, it's a new alphabet" criticism.

**Pure ASCII** (minority): digraphs only. Fewer systems take this approach, but it receives the least pushback. One designer articulated the case well: "New alphabets are hard to write in cursive... hard to be digitalized... many programs still only allow basic English alphabets, and many keyboards should be reprogrammed."

Ingglish is in the pure ASCII camp, which is unusual but pragmatically well-defended.

### Target Dialect

General American is the most common target, followed by Australian English (3-4 well-developed systems from u/Plupsnup and u/yeahthatguyashton). A few target RP or specific American dialects. Targeting any specific dialect draws criticism from speakers of other dialects, and this is unavoidable.

One novel approach: u/markjsno1 posted a [consonant-only reform](https://www.reddit.com/r/conorthography/comments/1jdzlkw/another_rework_of_the_english_alphabet_consonants/), deliberately ignoring vowels because "accents are mainly vowel shifts." This sidesteps the dialect problem entirely by reforming only the half of English spelling that everyone agrees on.

## Where Ingglish Sits

### Mainstream choices

Most of Ingglish's design decisions are well within the mainstream:

- **ai** for PRICE, **ay** for FACE, **ou** for MOUTH, **oi** for CHOICE: all common or the most popular option
- **sh**, **ch**, **ng**, **zh**: standard consonant digraphs
- **ee/oo** vowel doubling: length pattern, frequently cited and used
- Phonemic (not phonetic) approach: the clear majority position
- GenAm as target: the most common dialect choice

### Unusual choices

Three Ingglish choices stand out as unusual or unique:

**"oh" for GOAT.** Unique among the 133+ reforms surveyed. Ingglish's own docs rate it "Rare" in the orthography comparison. The most common alternatives are ō (macron), ou, ow, and oe; GOAT remains the vowel with zero consensus. The reasoning is sound (avoids collision with "ow" for MOUTH), but "goh" and "shoh" will look unfamiliar.

**Schwa mapped to "a".** Most systems either dodge the schwa question entirely or vary spelling by etymology. Ingglish's consistent mapping to "a" is the most common single-letter choice for schwa cross-linguistically (it's the default unstressed vowel in many languages), and it preserves many familiar spellings ("about", "banana" stay unchanged). Words where schwa was previously spelled with other letters do change: "problem" → "problam", "computer" → "kampyooter". The principled consistency is unusual regardless of which letter is chosen.

**"u" for FOOT.** Most world languages use plain 'u' for /ʊ/. Ingglish assigns 'u' to /ʊ/ (book → buk) and 'oo' to /uː/ (too → too). This aligns with the majority of Latin-script languages and matches the most common community choice. Several systems in the corpus independently assign plain `u` to FOOT and a digraph to GOOSE. The trade-off: English "book", "good", "look" are no longer identical (they become "buk", "gud", "luk") but English "too", "food", "moon" become identical.

### Strongest differentiators

Two things set Ingglish apart from every other system in the corpus:

1. **Working software.** No other reform has bidirectional translation tools, a browser extension, or a website that converts text in real time. Every other system is a static proposal, a table of sound-to-spelling mappings, maybe with sample text.

2. **Thorough documentation with cross-linguistic comparisons.** The community explicitly praises well-organized tables and systematic presentation. Low-effort posts with just a phoneme chart and no sample text get dismissed.

## Criticism Patterns

Eight criticisms appear repeatedly across posts, roughly in order of frequency:

### 1. "Whose English?"

By far the most common objection. Representative comments:

> "English has so many varieties, so a phonetically-ish spelling is a nightmare. A Canadian, New Zealander, Indian, and Scottish would probably not understand each other in writing." (u/Ngdawa, 5 upvotes)

> "English who's English? Different people speak English differently... you can't make a phonetic alphabet for a language spoken by billions who each speak it differently." (u/Common-Swimmer-5105)

> "Accent/dialect-specific spelling reforms eradicate the strongest selling point of English: Americans, Britons, Australians, Irish, New Zealanders, Hong Kongers can easily understand each others' writing." (u/Delusionn)

One GenAm-based reform got a 16-upvote meme: "English spelling reform > Look inside > GenAm phonemes" (u/trmetroidmaniac). This criticism is unavoidable for any phonemic system. Ingglish addresses it in [Spelling Reform Comparison: The Dialect Problem](spelling-reform-comparison.md#1-the-dialect-problem).

### 2. Keyboard and typing concerns

Any system using diacritics or special characters gets this immediately:

> "I think one issue is that it's kind of impossible to type on a computer. Most keyboards don't have þ or ð." (u/endymon20)

Ingglish avoids this criticism entirely by using pure ASCII.

### 3. "This isn't a reform, this is a new alphabet"

Systems that reassign letter values or use unfamiliar characters get dismissed:

> "This isn't a spelling reform, this is recreating the alphabet. And also this doesn't feel like the Latin Alphabet anymore." (u/RaccoonByz, 4 upvotes, on the Ashtonian Alphabet)

> "Kinda bugs me how people create an alphabet and call it an orthography." (u/curious-scribe-2828)

### 4. "Looks weird" (the uncanny valley)

Universal for phonemic systems. The ["(Not so) Basic English Spelling Reform"](https://www.reddit.com/r/conorthography/comments/1qsb2tk/not_so_basic_english_spelling_reform/) (77 upvotes, highest-scoring post) drew reactions like "Oh my pord what the hepp." The more phonemically consistent a system is, the stranger it looks to English readers.

Reforms that look "almost English" trigger stronger negative reactions than systems that look fully foreign. As one commenter noted about a Dutch-style reform: it's in "the linguistic equivalent of the uncanny valley, as is Scots" (u/Rutiniya). Shavian or Cyrillic adaptations don't trigger this; they're clearly a different script. But phonemic Latin-script reforms like Ingglish sit squarely in the uncanny valley: "problam" and "goh" look wrong precisely *because* the surrounding text looks almost normal.

Specific design choices that drew the harshest reactions:
- Using Q as a vowel: "Q should NOT be a vowel" (19 upvotes)
- Reversing conventional vowel values: "a for æ and ä for a is evil" (17 upvotes)
- Esperanto-style diacritics on consonants: "ĉ... ĝ... ẑ??? the hell?? never cook again" (9 upvotes)

### 5. Overcomplexity

Phonetic (surface-level) systems get criticized for making unnecessary distinctions:

> "An orthography doesn't need to be a fine-grained phonetic transcription (and for a pluricentric language like English, it really shouldn't be)." (u/Norwester77)

Ingglish's phonemic approach avoids this: it represents meaningful sound distinctions, not surface phonetic detail.

### 6. Internal inconsistency

Systems whose diacritics or letter assignments lack a coherent organizing principle get called out by technically rigorous commenters:

> "Silly. The acute accent marks ⟨u⟩ sound /U/ in 'gúd' (so it marks a short vowel), but it also marks diphthongs? This makes no sense." (u/martinribot on Lindgren's reform)

> "The use of diacritics doesn't seem to follow any logic when compared with unmarked vowels." (u/martinribot on Anooj4021's system)

Ingglish's consistent rules (digraphs for complex sounds, doubling for length) are well-defended against this criticism.

### 7. European alignment pressure

A vocal camp argues reforms should align English vowels with continental European / IPA conventions (a=/a/, e=/e/, i=/i/, o=/o/, u=/u/):

> "Whenever I see the proposals for spelling reforms of English, it always surprises me why nobody thinks it would be best to align vowels with other European languages?" (u/hendrixbridge)

> "Using ⟨é⟩ for a long i is criminal. It bothers me enough that it is called an 'e' in English. But shouldn't a reform make it better?" (u/thriceness, 7 upvotes)

Ingglish falls in the "English logic" camp, respecting how English speakers already think about vowel letters rather than adopting continental values.

### 8. Accessibility and dyslexia

A smaller but notable concern for systems using confusable letter shapes:

> "bþpdαqƿyð Kind of difficult for dyslexics. I'm *not* dyslexic, and seeing that line of letters strung together still makes my eyes go funny." (u/Kendota_Tanassian, 10 upvotes)

> "Using Ǝ/ǝ seems sensible on the surface, but the small case letter is not very dyslexia-friendly." (u/Anooj4021)

Ingglish's pure ASCII approach avoids confusable letter shapes entirely.

### What commenters want

Across all posts, the community responds well to:
- **Sample text.** Multiple commenters request it; systems without it get less constructive feedback. The North Wind & Sun passage is the subreddit standard.
- **Visual presentation.** The highest-scoring posts all have images: phoneme charts as graphics, posters, custom keyboard layouts. Text-only posts with raw phoneme tables rarely break 20 upvotes.
- **Organized tables.** One well-documented conservative reform got 8 upvotes for its presentation alone: "I'm tired of lazy posts here in the sub, so, thanks for that."
- **Internal consistency.** One designer's guarantee that "one letter or set of letters only corresponds to only one consonant or vowel, no exception" was noted approvingly.
- **Iteration.** Systems that show visible evolution across multiple posts get credit: Plupsnup (3 posts), niels_singh (3 posts), and CreepingTuna all earn respect for refinement.
- **Alignment with European languages.** Several commenters suggest looking at Dutch, Finnish, or Albanian conventions.

## Notable Systems

### [Ashtonian Alphabet](https://www.reddit.com/r/conorthography/comments/1hu0qx9/after_months_of_tweaking_i_recreated_my/) (69 upvotes, 38 comments)

Phonetic (not phonemic) transcription of Standard Australian English. Distinguishes light/dark L, onset/coda nasals, and glottal stops. Uses extensive IPA-derived characters with a custom keyboard layout. The most maximalist system in the corpus. Drew significant criticism for overcomplexity: "Your reform complicates a lot of things" (11 upvotes). Demonstrates why Ingglish's phonemic approach works better than a phonetic one.

### [CreepingTuna's reform](https://www.reddit.com/r/conorthography/comments/1aopvn3/highly_controversial_english_orthography_reform/) (24 upvotes, 5 comments)

The most similar system to Ingglish in the corpus. Pure ASCII, no diacritics, 1:1 sound-spelling mapping. Plans to adopt th/dh split. The author independently reached the same anti-diacritic conclusion: "many programs still only allow basic English alphabets." Key difference from Ingglish: retains more silent-e patterns from English.

### Plupsnup's Australian reforms ([v1](https://www.reddit.com/r/conorthography/comments/1p3n7ne/my_easy_spelling_reform_of_australian_english/), [v2](https://www.reddit.com/r/conorthography/comments/1p4fym8/i_designed_a_poster_for_my_easy_spelling_reform/), [v3](https://www.reddit.com/r/conorthography/comments/1qbc8q1/update_to_my_spelling_reform_of_australian/)) (59, 24, 13 upvotes)

Three iterations targeting Standard Australian English. Uses IPA-derived characters (ŋ, ə). Deliberately allows different regional spellings: "Yes, I've intended that different regional dialects have different spellings of the same words." Opposite of Ingglish's "pick a winner" approach. Later versions drew criticism for strange letter reassignments (v for /j/, p for /l/): "What's the point of the random letter switching?"

### [Inglisce](https://www.reddit.com/r/conorthography/comments/1ohpaw7/inglisce_spelling_reforme/) (6 upvotes, 8 comments)

Heavy use of diacritics (grave, acute, circumflex), drops W and K, brings back thorn. Based on Great Lakes Dialect. Prioritizes etymology and European convention over phonemic clarity, the opposite philosophy from Ingglish. Gets praised for its "ye olde Englisce" aesthetic but criticized for inconsistency: learners "would just have to learn when 's' is voiced vs unvoiced."

### [The asasnow "Conservative" reform](https://www.reddit.com/r/conorthography/comments/1l9an1t/my_very_amateur_attempt_at_a_more_conservative/) (30 upvotes, 12 comments)

Explicitly preserves as much existing English spelling as possible while fixing the worst inconsistencies. Uses "th" for both /θ/ and /ð/ (intentionally). Well-documented with rules and tables. Praised for thoroughness. Represents the "minimal change" end of the spectrum; Ingglish represents the "full phonemic consistency" end.

### [Iǹglic](https://www.reddit.com/r/conorthography/comments/1qrsy1d/idea_for_an_english_spelling_reform_iǹglic/) (14 upvotes, 17 comments)

Adds a single diacritic (dot below: ǹ for /ŋ/) but otherwise stays close to English spelling. The author describes it as "close to phonetic as possible without being too complicated." The ["(Not so) Basic English Spelling Reform"](https://www.reddit.com/r/conorthography/comments/1qsb2tk/not_so_basic_english_spelling_reform/) (77 upvotes) cites Iǹglic as inspiration.

### [Harry Lindgren's reform](https://www.reddit.com/r/conorthography/comments/1ayt4oj/harry_lindgrens_spellimg_reform/) (21 upvotes, 21 comments)

A published academic reform by an Australian linguist, using diacritics for vowel quality. Drew harsh criticism for internal inconsistency: the acute accent marks both short vowels and diphthongs, which is contradictory. Multiple commenters described it as "not functional at all" (5 upvotes). Demonstrates that academic credentials don't guarantee good design.

### [InEcclesiaSatan's Dutch-style reform](https://www.reddit.com/r/conorthography/comments/1ktfjia/as_revenge_for_anglophones_calling_dutch_goofy_i/) (41 upvotes, 14 comments)

"As revenge for anglophones calling Dutch 'goofy', I have revised English orthography." GenAm-based, uses Dutch/Frisian conventions: `sj` for /ʃ/, `tj` for /tʃ/, `dj` for /dʒ/, `dh` for /ð/. Merges /ʌ/ and /ə/. A commenter said: "It's more legible than most English spelling reforms and I don't totally hate it." Demonstrates that borrowing conventions from a closely related language can produce surprisingly readable results.

### niels_singh's Ðietsċ Eanglisċ ([v17](https://www.reddit.com/r/conorthography/comments/17h40ag/ðietsçeanglisç_spelling_reform_v17_faikipédia/), [v28](https://www.reddit.com/r/conorthography/comments/1py8y89/ðeetsċ_eanglisċ_spelling_reform_v28_demo_excerpt/), [v29](https://www.reddit.com/r/conorthography/comments/1qabu6e/ðietsċ_eanglisċ_spelling_reform_v29_sample_ðe/)) (18, 17, 12 upvotes)

The most iterated system in the corpus, having reached version 29 across multiple years. Naturalistic, etymology-preserving reform with heavy Dutch/Frisian influence. Uses ð but not þ, and diacritics selectively. Deliberately does NOT split th/dh. The author's philosophy: "I want to keep words recognisable to speakers that are not familiar with the reform while still regularising how phonology is represented." Represents the "recognizability-first" end of the spectrum; Ingglish represents the "consistency-first" end.

### Anooj4021's maximalist system ([v1](https://www.reddit.com/r/conorthography/comments/1mrsi30/my_revised_orthography_for_english/), [v2](https://www.reddit.com/r/conorthography/comments/1oz2dy3/my_revised_english_orthography_version_20/)) (5 upvotes, 15 comments across versions)

The most phonologically sophisticated system in the corpus. Splits FACE into PANE (historically /eː/) vs PAIN (historically /ej/), and GOAT into TOE vs TOW, to "cancel historical vowel mergers" and distinguish homophones in writing. Uses th/dh, sh/zh, and ø for schwa. The 13-comment debate with martinribot is the most technically dense exchange in the dataset. Sits at the opposite extreme from Ingglish, favoring maximum historical distinctions vs. maximum consistency.

### u/martinribot (power commenter)

Not a system author but the single most technically influential voice in the corpus. Appears in 10+ threads, always writing in their own reform, consistently providing the most substantive critiques. Pushes back on inconsistent diacritic logic, identifies where systems' own patterns break down, and argues that diacritics should encode "some systematic relationship." Their implicit standards (internal consistency, principled diacritics, dialect awareness) function as community norms.