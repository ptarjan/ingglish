# How to Read English: Spelling-to-Sound Rules

You see a word on the page. How do you know what it sounds like? This guide goes from letters to sounds: it covers every major letter pattern in English, what sound each one makes, and how many words it affects.

For the other direction (you know the word and want to spell it), see [How to Spell English Sounds](english-spelling-choices.md).

The rules here draw on [Ingglish's grapheme-to-phoneme (G2P) engine](/docs/architecture), the part of Ingglish that turns spellings into sounds. It uses ~960 letter-to-sound rules that each depend on the surrounding letters, based on the [NRL/Elovitz system](https://apps.dtic.mil/sti/citations/ADA021929) (1976). Word counts come from an analysis of 126,000 words in the [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict).

Sounds are written between slashes in the International Phonetic Alphabet, so /ʃ/ is the "sh" sound. Each section gives example words, so you can hear the sound without knowing the symbol.

## How English Spelling Works

English spelling is built in layers. The base layer is Old English (Germanic), which was spelled fairly regularly. Over the centuries, borrowings from French, Latin, and Greek added layers of their own, each with its own spelling conventions. Then the Great Vowel Shift (1400-1700) changed how vowels were pronounced, but the spelling stayed the same. The result: most words follow rules, but which rules apply depends on where the word came from.

The good news is that the rules themselves are quite reliable. English is hard because several rule systems exist side by side, not because the rules are broken.

## Consonant Digraphs

A digraph is two letters that spell one sound. The consonant digraphs are among the most reliable patterns in English.

### SH as in "ship"

**sh** always says /ʃ/. It is one of the most reliable patterns in English, with essentially no exceptions.

**Examples:** *she, ship, fish, push, fashion, mushroom, shout, shower*

### CH as in "church"

**ch** usually says /tʃ/. This is the default, and it covers the vast majority of words.

**Examples:** *child, much, teacher, church, chance, change, chapter, chicken*

**Greek-origin exception:** In words from Greek, **ch** = /k/: *school, chrome, character, stomach, ache, chaos, anchor, orchestra, mechanic*. These words often show other signs of Greek origin, such as *ph*, *ps*, or *-ic*.

**French-origin exception:** In words from French, **ch** = /ʃ/: *machine, chef, champagne, charade, brochure, chauffeur, parachute*. These are relatively uncommon.

### TH as in "think" and "the"

**th** spells two different sounds:

- **Voiceless /θ/** (tongue between the teeth, no vibration in the throat): *think, three, bath, math, breath, growth, health, month, path, truth, cloth, beneath*
- **Voiced /ð/** (tongue between the teeth, with vibration): *the, this, that, them, those, other, another, brother, weather, together, whether, father, smooth, bathe*

**How to tell them apart:**
- Function words, the small grammatical words (the, this, that, than, them, they, there, though), are almost always voiced /ð/.
- Content words, the words that carry meaning (think, thick, thin, third, throw, through), are usually voiceless /θ/.
- Between vowels, **th** is usually voiced: *brother, mother, father, weather, leather, feather, gather, rather*
- At the start of a content word, it is usually voiceless: *thank, theory, thermal, therapy, theme*

### PH as in "phone"

**ph** says /f/. The spelling comes from Greek and is completely reliable.

**Examples:** *phone, photo, physical, philosophy, pharmacy, phrase, phenomenon, alphabet, geography, biography, photograph, elephant, triumph*

### NG as in "sing"

**ng** says /ŋ/, the sound at the end of "sing". It is the second most common digraph pattern.

**Examples:** *sing, long, thing, ring, young, strong, among, running, morning, nothing, something, everything*

**When you also hear a /g/:** When a vowel follows **ng** inside the same root, a /g/ is pronounced after the /ŋ/: *finger* /fɪŋgər/, *anger* /æŋgər/, *hungry* /hʌŋgri/, *linger* /lɪŋgər/, *single* /sɪŋgəl/. When **-ing** is added as a suffix, there is no /g/: *singing* = /sɪŋɪŋ/, not /sɪŋgɪŋ/.

### CK as in "back"

**ck** says /k/, just like plain **k**. Which one you see depends on what comes before: **ck** after short vowels, **k** after long vowels or consonants.

**Examples:** *back, black, kick, clock, neck, rock, duck, truck, stick, pocket, chicken, ticket*

**Compare:** *back* (short a, ck) vs *bake* (long a, k); *sick* (short i, ck) vs *like* (long i, k)

### WH as in "what"

**wh** says /w/ in modern standard English. It used to be /hw/ (a breathy w), and some dialects still say it that way.

**Examples:** *what, where, when, which, white, while, why, whether, wheel, whisper, whale*

**Exception:** In *who, whom, whose, whole*, **wh** = /h/: the h is pronounced and the w is silent.

### WR as in "write"

**wr** at the start of a word says /r/. The **w** is always silent.

**Examples:** *write, wrong, wrap, wrist, wreck, wrestle, wrinkle, wrath*

### KN as in "know"

**kn** at the start of a word says /n/. The **k** is always silent.

**Examples:** *know, knee, knife, knock, knight, knot, knit, kneel, knowledge, knuckle*

### GN as in "gnat"

**gn** at the start of a word says /n/. The **g** is always silent. Few words use this pattern.

**Examples:** *gnat, gnaw, gnome, gnarl, gnu*

### TCH as in "match"

**tch** says /tʃ/, the same sound as **ch**. It comes after short vowels, just as **ck** does for **k** and **dge** does for **ge**.

**Examples:** *match, catch, watch, kitchen, stretch, witch, sketch, patch, hatch, ditch, stitch*

### DGE as in "bridge"

**dge** says /dʒ/, the same sound as **j** or soft **g**. It comes after short vowels.

**Examples:** *bridge, edge, judge, badge, ledger, ridge, fridge, wedge, hedge, lodge, budge*

**Compare:** *badge* (short a, dge) vs *page* (long a, ge); *ridge* (short i, dge) vs *huge* (long u, ge)

## Vowel Teams and Digraphs

A vowel team is two vowel letters that spell one vowel sound. The classroom rhyme "when two vowels go walking, the first one does the talking" (say the first vowel's name, skip the second) is an oversimplification, but it does hold for several of the most common teams.

### EE as in "see"

**ee** always says /iː/, the "long e" sound. It is arguably the most reliable vowel spelling in English, with essentially no exceptions.

**Examples:** *see, free, tree, green, sleep, deep, keep, feet, meet, need, speed, street, week, feel, seed*

### EA as in "eat"

**ea** most often says /iː/: *eat, read, speak, clean, team, sea, lead, meat, dream, heat, leave, please, reason, teach, reach, stream*

**It also often says /ɛ/** (short e): *head, bread, dead, health, weather, heavy, ready, spread, thread, breath, sweat, death, measure, treasure, pleasant*

No reliable rule tells you which one to use. /iː/ is more common overall, but many everyday words take /ɛ/. Words ending in **-ead** and **-eath** are especially split.

### AI as in "rain"

**ai** says /eɪ/, the "long a" sound. It is very reliable, with very few exceptions.

**Examples:** *rain, wait, paint, main, train, brain, chain, plain, claim, explain, remain, contain, maintain, obtain, entertain*

**Notable exception:** *said* = /sɛd/

### AY as in "day"

**ay** also says /eɪ/. It appears at the end of a word or syllable, where **ai** is not used.

**Examples:** *day, play, say, away, way, stay, may, pay, today, okay, always, birthday, essay, display, delay, survey*

Between them, **ai** (mid-word) and **ay** (word-final) reliably cover the /eɪ/ sound.

### OA as in "boat"

**oa** says /oʊ/, the "long o" sound. Very reliable.

**Examples:** *boat, coat, road, goal, toast, load, foam, soap, roast, approach, coach, moat, groan, oak*

**Rare exception:** *broad* = /brɔːd/

### OO as in "moon"

**oo** has two sounds:

- **/uː/** (the "long oo"): *moon, food, school, room, cool, pool, tool, choose, smooth, proof, tooth, roof, goose, loose, boot*
- **/ʊ/** (the "short oo"): *book, look, cook, took, good, wood, stood, foot, hook, brook, wool*

**Pattern:** Before **k**, **oo** is almost always /ʊ/. Overall, /uː/ is more common.

**Exceptions:** In *blood* and *flood*, **oo** says /ʌ/ (as in "cup"). These are the only two common words with this sound.

### OU as in "out"

**ou** most often says /aʊ/: *out, house, about, around, found, sound, ground, count, amount, mouth, cloud, announce, mountain, thousand*

**Less common sounds:**
- /ʌ/: *touch, young, country, trouble, enough, double, cousin, southern, rough, tough*
- /uː/: *soup, group, you, through, wound* (the injury), *route, routine*
- /ɔː/: *bought, thought, brought, fought*
- /ɔːr/ (before r): *four, course, pour, court, source*
- /ʊ/: *could, would, should*

/aʊ/ is the default. The other sounds tend to cluster around particular neighboring letters.

### OW as in "show"

**ow** has two common sounds:

- **/oʊ/** (the "long o"): *low, show, know, grow, own, snow, slow, blow, follow, window, borrow, tomorrow, shadow, narrow, yellow*
- **/aʊ/** (as in "out"): *now, how, cow, town, down, brown, crowd, power, flower, tower, allow, however, eyebrow*

**Pattern:** Before **n**, **ow** is usually /aʊ/ (*town, down, brown, gown, crown, drown, frown*). At the end of a word, /oʊ/ is more common (*show, know, grow, flow*). The /aʊ/ words tend to have earthier, more concrete meanings, perhaps because they come from Germanic roots.

### OI and OY as in "oil" and "boy"

**oi** (before a consonant) and **oy** (at the end of a word, or before a vowel as in *royal*) say /ɔɪ/. This is one of the most reliable vowel patterns in English. The exceptions are rare: *choir*, and words where the o and i belong to separate syllables, such as *going* and *doing*.

**Examples:** *oil, join, point, voice, choice, noise, coin, avoid, moisture / boy, joy, toy, enjoy, destroy, royal, loyal, employ*

### AU and AW as in "cause" and "law"

**au** (mid-word) and **aw** (end of a word or syllable) both say /ɔː/. Very reliable.

**Examples:** *cause, August, author, fault, launch, sauce, audience / draw, law, saw, awful, raw, crawl, dawn, lawn, jaw, yawn, straw*

### EI as in "vein"

**ei** has two main sounds, depending on what comes before it:

- **After c**, **ei** = /iː/: *receive, ceiling, deceive, conceive, perceive* (the "i before e except after c" rule)
- **Otherwise**, **ei** is often /eɪ/: *vein, rein, eight, weight, neighbor, freight, beige, reign, surveillance*

### EY as in "key"

**ey** at the end of a word says /iː/: *money, honey, key, journey, valley, turkey, monkey, hockey, kidney, attorney, donkey*

**Exception:** In *they, hey, grey/gray, prey, survey, obey*, **ey** = /eɪ/. These tend to be one-syllable words.

### EW as in "new"

**ew** says /uː/ or /juː/ ("yoo"), depending on the consonant before it:

- **/uː/** after r, l, ch, j, s: *blew, drew, chew, brew, flew, grew, crew, jewel, stew*
- **/juː/** after n, d, f, h, m: *new, few, dew, hew, mew, nephew, curfew*

### IE as in "field"

**ie** usually says /iː/: *field, piece, believe, achieve, grief, chief, relief, shield, yield, brief, thief, priest, fierce, pier*

At the end of one-syllable words, **ie** = /aɪ/: *die, tie, pie, lie, vie*

### EU as in "feud"

**eu** says /juː/: *Europe, neutral, feud, therapeutic, deuce, pneumonia*

Consistent, but uncommon in English.

## The Silent E Rule

### "Magic E": Vowel-Consonant-E

A silent **e** at the end of a word tells you the vowel before it is "long", meaning it says its own letter name. This is one of the most important rules in English phonics, and one of the most widely taught.

| Pattern | Sound | Examples |
|---------|-------|----------|
| **a_e** | /eɪ/ | make, cake, late, name, place, safe, wave, state, face, grade |
| **i_e** | /aɪ/ | time, like, five, life, line, write, drive, while, side, wide |
| **o_e** | /oʊ/ | home, note, hope, close, those, alone, phone, stone, whole, bone |
| **u_e** | /juː/ or /uː/ | use, cute, huge, pure, tube, rule, June, abuse, excuse, refuse |
| **e_e** | /iː/ | these, complete, extreme, concrete, Japanese, athlete |

The silent e drops before suffixes that start with a vowel (*bake → baking*, *hope → hoping*, *use → using*) and stays before suffixes that start with a consonant (*hope → hopeful*, *use → useful*).

**Common exceptions:** *have, give, live* (the verb), *love, move, prove, come, some, done, gone, none*. These have a final e but not a long vowel. Many are among the most common words in English, so the exceptions stand out more than their numbers suggest.

## R-Colored Vowels

An r-colored vowel (also called "r-controlled" or "bossy r") is a vowel whose sound changes because an **r** follows it. These are among the most common patterns in English.

### ER as in "her"

**er** is the most common spelling pattern in the dictionary. It says /ɜːr/.

**Examples:** *her, water, teacher, under, never, after, over, other, number, better, mother, father, together, remember, different*

In unstressed syllables, it sounds the same as schwa + r (/ər/). Schwa is the weak "uh" sound; see [Schwa](#schwa-the-unstressed-vowel-most-common-sound-in-english) below.

### AR as in "car"

**ar** says /ɑːr/: *car, star, garden, market, part, start, hard, large, charge, guard, park, farm, dark, march, smart*

In unstressed syllables it weakens to /ər/: *dollar, sugar, regular, familiar, popular, particular, similar, grammar, calendar*

### OR as in "for"

**or** says /ɔːr/: *for, born, sport, morning, short, north, form, force, sort, horse, order, report, important, support*

In unstressed syllables it weakens to /ər/: *doctor, color, favor, factor, author, mirror, error, labor, motor, editor, major*

### IR as in "bird"

**ir** sounds the same as **er**: *bird, first, girl, third, sir, firm, birth, dirt, stir, shirt, circle, thirty, spirit, confirm*

### UR as in "burn"

**ur** also sounds the same as **er** and **ir**: *burn, turn, nurse, church, hurt, occur, return, purpose, further, surface, during, Saturday*

**er**, **ir**, and **ur** all spell the same sound, /ɜːr/. Together they appear in over 27,000 words (21.5% of the dictionary). When reading, you pronounce all three the same way; the hard part is knowing which one to write.

## Soft C and Soft G

### Soft C: C before E, I, or Y

Before **e**, **i**, or **y**, **c** says /s/ instead of its usual /k/.

**Examples with /s/:** *city, center, cycle, face, ice, place, peace, science, circle, certain, century, ceiling, celebrate, since, civil, recent, office, price, force, once*

**Examples with /k/ (before a, o, u, or a consonant):** *cat, come, cut, class, cold, cup, car, call, case, clear, close, claim, cloud, create*

This rule comes from Latin and French and is extremely reliable. The main exceptions are a handful of words where **c** before **e** still says /k/: *soccer*, and *sceptic* (the British spelling of *skeptic*). *Celtic* is often /k/ as well.

### Soft G: G before E, I, or Y

Before **e**, **i**, or **y**, **g** *often* says /dʒ/ instead of its usual /g/.

**Examples with /dʒ/:** *gem, giant, gym, page, large, age, change, general, generation, energy, imagine, magic, engine, region, village, stage, message, arrange, average, manage*

**This rule is less reliable than soft C.** Many common words keep the hard /g/ before these vowels: *get, give, girl, gift, begin, finger, gear, together, forget, tiger, anger, eager, target, bigger*

**Pattern:** Soft G is most reliable in words from Latin or French. Words from Germanic roots tend to keep the hard /g/. For an unfamiliar word with **g** before **e** or **i**, soft /dʒ/ is the better guess, but expect exceptions.

## Doubled Consonants

### The Short Vowel Signal

A doubled consonant is pronounced as one consonant. The doubling tells you the vowel before it is *short*.

| Doubled | Count | Examples |
|---------|------:|----------|
| **ll** | 6,886 | *all, well, ball, small, still, bell, fill, pull, full, call, tell, kill* |
| **ss** | 3,526 | *class, less, miss, cross, dress, loss, press, mass, stress, pass, assess* |
| **tt** | 3,117 | *better, little, matter, letter, button, attention, pattern, bottom, kitten* |
| **rr** | 2,043 | *current, correct, error, mirror, sorry, arrive, arrange, borrow, carry, worry* |
| **nn** | 2,024 | *dinner, connect, announce, innocent, beginning, running, funny, channel, manner* |
| **pp** | 1,570 | *happen, support, opportunity, appear, apple, happy, supply, suppose, upper* |
| **ff** | 1,225 | *offer, effect, different, office, effort, coffee, difficult, staff, afford* |
| **mm** | 1,226 | *common, community, comment, commercial, committee, command, recommend, summer* |
| **cc** | 1,082 | *accept, according, account, accident, success, access, occasion, occur* |
| **dd** | 634 | *add, address, middle, sudden, hidden, addition, odd, wedding, ladder, buddy* |
| **gg** | 723 | *suggest, biggest, egg, struggle, aggressive, trigger, exaggerate, stagger* |
| **bb** | 517 | *rabbit, rubber, cabbage, ribbon, hobby, abbey, bubble, robber, stubborn* |
| **zz** | 330 | *jazz, buzz, puzzle, pizza, fizz, fuzzy, drizzle, blizzard, muzzle, nozzle* |

**The key contrast:** Doubling separates short vowels from long ones:
- *hopping* (short o) vs *hoping* (long o)
- *dinner* (short i) vs *diner* (long i)
- *latter* (short a) vs *later* (long a)
- *tapping* (short a) vs *taping* (long a)

## The Silent E and Doubled Consonants Together

These two rules work as one system. English has three ways to show whether a vowel is short or long:

1. **Short vowel + doubled consonant:** *hopping, dinner, latter, tapping*
2. **Long vowel + single consonant + silent e:** *hoping, diner, later, taping*
3. **Long vowel + vowel team:** *reading, training, boating, feeling*

The system is remarkably consistent. A single consonant between two vowels usually means the first vowel is long. A doubled consonant usually means it is short.

## Suffix Pronunciation Rules

English suffixes are pronounced very predictably. Once you know a suffix, you can say it correctly in any word.

### The -ED Past Tense

**-ed** has three pronunciations. The last sound of the base word tells you which one to use:

| After... | Pronounced | Examples |
|----------|-----------|----------|
| A voiceless consonant (/p, k, f, s, ʃ, tʃ/) | /t/ | *walked, jumped, kissed, washed, watched, stopped, hoped, asked* |
| A voiced sound (a vowel or /b, g, v, z, ʒ, dʒ, m, n, ŋ, l, r/) | /d/ | *called, played, opened, moved, changed, pulled, turned, seemed* |
| /t/ or /d/ | /ɪd/ | *wanted, needed, started, waited, added, decided, expected, created* |

A voiceless sound is made without vibrating the throat; a voiced one vibrates it. Put a hand on your throat and say "sss" then "zzz" to feel the difference.

### The -ING Suffix

Always /ɪŋ/, with no exceptions: *running, walking, singing, reading, working, thinking, looking, making, going, coming*

### -TION

Always /ʃən/ ("shun"): *nation, action, education, information, situation, attention, collection, direction, question, position, condition, protection, production, connection*

### -SION (two pronunciations)

- After a vowel: /ʒən/ ("zhun"), as in *vision, television, decision, occasion, explosion, conclusion, confusion*
- After a consonant: /ʃən/ ("shun"), as in *tension, mansion, extension, dimension, expansion, pension, suspension*

### -LY

Always /liː/: *quickly, really, finally, actually, probably, certainly, usually, simply, easily, clearly, directly, completely, immediately, recently*

### -NESS

Always /nəs/: *happiness, darkness, kindness, business, illness, weakness, awareness, sadness, madness, fitness, goodness, readiness, willingness*

### -MENT

Always /mənt/: *government, moment, movement, environment, development, management, statement, agreement, department, treatment, equipment, achievement*

### -AL

Always /əl/: *final, national, personal, natural, central, general, special, social, physical, political, traditional, additional, professional, original*

### -ABLE / -IBLE

Always /əbəl/: *available, comfortable, possible, responsible, reasonable, considerable, terrible, acceptable, capable, valuable, suitable, favorable*

Whether a word takes **-able** (more common, added to whole English words) or **-ible** (added to Latin stems) changes the spelling, not the sound.

### -FUL

Always /fəl/: *beautiful, careful, wonderful, powerful, successful, helpful, useful, grateful, hopeful, painful, peaceful, meaningful, cheerful, thankful*

### -LESS

Always /ləs/: *homeless, careless, endless, useless, breathless, countless, fearless, helpless, harmless, meaningless, nevertheless, regardless*

### -OUS

Always /əs/: *famous, dangerous, various, serious, previous, obvious, enormous, curious, nervous, precious, religious, generous, mysterious, conscious*

### -ENCE / -ANCE (combined ~1,200 words)

Both say /əns/: *experience, difference, confidence, audience, evidence, importance, distance, performance, appearance, insurance, balance, substance*

### -EN

Says /ən/: *open, often, children, listen, written, broken, golden, garden, kitchen, sudden, frozen, hidden, driven, chosen, forgotten, mistaken*

### -EST (superlative)

Says /əst/ or /ɪst/: *best, largest, biggest, highest, greatest, latest, oldest, fastest, strongest, closest, deepest, longest, widest*

## Silent GH

### GH after Vowels = Silent

After a vowel, **gh** is almost always silent. The vowel letters before it decide the sound:

| Pattern | Sound | Examples |
|---------|-------|----------|
| **igh** | /aɪ/ | *light, night, right, high, sight, fight, might, bright, flight, tight, knight, delight, height* |
| **eigh** | /eɪ/ | *eight, weight, neighbor, freight, sleigh, weigh* |
| **ough** | varies | see below |
| **augh** | /ɔː/ | *daughter, caught, taught, naughty, slaughter* |

### The OUGH Problem

**ough** is famously the least predictable pattern in English. It has at least six pronunciations:

| Sound | Examples |
|-------|----------|
| /ʌf/ | *enough, rough, tough* |
| /ɔː/ | *bought, thought, ought, brought, fought, sought* |
| /oʊ/ | *though, although, dough* |
| /uː/ | *through* |
| /aʊ/ | *bough, plough, drought* |
| /ɒf/ or /ɔːf/ | *cough, trough* |

Few words use **ough**: 220 in the dictionary, and fewer than 30 in common use. But some of them are very common words, so this small set accounts for much of English spelling's bad reputation.

## Other Consonant Rules

### QU as in "queen"

In English, **q** is always followed by **u**, and **qu** always says /kw/: *queen, question, quick, quiet, quite, quality, quarter, require, equal, frequent, unique, adequate*

At the end of a word (from French), **-que** = /k/: *unique, technique, antique, boutique, critique, physique*

### X as in "box"

**x** has predictable pronunciations:

- **/ks/** (the default): *box, mix, next, text, six, tax, fix, complex, index, context, relax, maximum*
- **/gz/** (between an unstressed vowel and a stressed one): *exam, exact, exist, example, executive, exotic, exaggerate, exhaust*
- **/z/** (at the start of a word; rare): *xylophone, xenon, xerox*

### Silent Letters

Besides the digraphs covered above, English has several other silent-letter patterns:

| Pattern | Silent letter | Examples |
|---------|--------------|----------|
| **mb** (end of a word) | b | *climb, lamb, bomb, thumb, comb, dumb, limb, numb, tomb, plumb* |
| **mn** (end of a word) | n | *autumn, column, condemn, hymn, solemn* |
| **bt** | b | *doubt, debt, subtle* |
| **ps** (start of a word) | p | *psychology, psalm, pseudo, psyche, psychiatry* |
| **pn** (start of a word) | p | *pneumonia, pneumatic* |

### S between Vowels = /z/ (thousands of words)

Between two vowels, **s** often says /z/: *music, reason, present, visit, prison, poison, season, pleasant, cousin, thousand, result, design, resign, resist*

This is not fully reliable (*basic, basin, bison* keep /s/), but /z/ is the usual sound.

### TI, CI, SI before Vowels = /ʃ/ or /ʒ/

In suffixes from Latin, these letter pairs say /ʃ/ ("sh") or /ʒ/ (the "zh" in "vision"):

- **ti** + vowel = /ʃ/: *nation, patient, partial, ambitious, initial, essential, martial, spatial*
- **ci** + vowel = /ʃ/: *special, social, official, ancient, sufficient, delicious, musician, artificial*
- **si** + vowel = /ʒ/ after a vowel (*vision, occasion, television, conclusion, decision, confusion*) or /ʃ/ after a consonant (*tension, mansion, dimension, pension, expansion*)

## Single Vowel Rules

A vowel on its own (not in a team, not before a silent e) is pronounced according to the shape of its syllable.

### Short Vowels (in closed syllables)

A closed syllable ends in a consonant. A single vowel in a closed syllable is short:

| Letter | Sound | Examples |
|--------|-------|----------|
| **a** | /æ/ | *cat, hand, map, black, fast, class, happy, plan, back, matter* |
| **e** | /ɛ/ | *bed, red, get, set, left, best, rest, help, next, step, well, check* |
| **i** | /ɪ/ | *sit, big, hit, fish, did, win, gift, miss, still, fill, list, trip* |
| **o** | /ɒ/ | *hot, dog, not, stop, top, lot, drop, box, rock, clock, job, common* |
| **u** | /ʌ/ | *but, cut, run, bus, cup, sun, fun, jump, just, luck, much, must, such* |

### Long Vowels (in open syllables)

An open syllable ends in the vowel itself. A single vowel in an open syllable tends to be long:

| Letter | Sound | Examples |
|--------|-------|----------|
| **a** | /eɪ/ | *baby, table, able, paper, later, nation, major, label, basic, station* |
| **e** | /iː/ | *be, me, he, she, we, equal, legal, recent, evil, even, meter, secret* |
| **i** | /aɪ/ | *idea, item, iron, island, ivory, ideal, identity, final, pilot, tiny* |
| **o** | /oʊ/ | *go, no, so, open, over, only, total, local, moment, notice, focus, ocean* |
| **u** | /juː/ | *unit, union, universe, unique, usual, music, human, student, future, humor* |

### Schwa: The Unstressed Vowel (most common sound in English)

In an unstressed syllable, any vowel letter can weaken to /ə/, called schwa: a short, relaxed "uh". Schwa is the most frequent sound in English:

- **a** = /ə/: *about, again, around, away, ahead, ago, alone, along, against*
- **e** = /ə/: *the, problem, open, system, happen, often, garden, taken, eleven*
- **i** = /ə/: *animal, president, possible, medicine, family, similar, opposite*
- **o** = /ə/: *second, common, person, today, together, police, complete, propose*
- **u** = /ə/: *support, suggest, supply, suppose, success, surprise, survive*

## Summary Table: English Spelling Rules Ranked by Impact

A word can match several rules, so the percentages overlap and add up to more than 100%.

| Rank | Rule | Words affected | % of dictionary |
|------|------|---------------:|----------------:|
| 1 | [ER/IR/UR as in "her"](#er-as-in-her) | 27,108 | 21.5% |
| 2 | [Doubled consonants](#the-short-vowel-signal) | ~20,000 | ~16% |
| 3 | [AR as in "car"](#ar-as-in-car) | 10,342 | 8.2% |
| 4 | [NG as in "sing"](#ng-as-in-sing) | 8,268 | 6.6% |
| 5 | [OR as in "for"](#or-as-in-for) | 7,587 | 6.0% |
| 6 | [Silent E makes vowel long](#magic-e-vowel-consonant-e) | 7,411 | 5.9% |
| 7 | [CH as in "church"](#ch-as-in-church) | 6,578 | 5.2% |
| 8 | [Soft G before E/I/Y](#soft-g-g-before-e-i-or-y) | 6,195 | 4.9% |
| 9 | [Soft C before E/I/Y](#soft-c-c-before-e-i-or-y) | 5,401 | 4.3% |
| 10 | [-ED suffix](#the-ed-past-tense) | 5,178 | 4.1% |
| 11 | [-ING suffix](#the-ing-suffix) | 5,068 | 4.0% |
| 12 | [IE as in "field"](#ie-as-in-field) | 4,579 | 3.6% |
| 13 | [EA as in "eat"](#ea-as-in-eat) | 3,953 | 3.1% |
| 14 | [CK as in "back"](#ck-as-in-back) | 3,679 | 2.9% |
| 15 | [SH as in "ship"](#sh-as-in-ship) | 3,531 | 2.8% |
| 16 | [OU as in "out"](#ou-as-in-out) | 3,511 | 2.8% |
| 17 | [TH as in "think"](#th-as-in-think-and-the) | 3,457 | 2.7% |
| 18 | [AU/AW as in "cause"](#au-and-aw-as-in-cause-and-law) | 3,060 | 2.4% |
| 19 | [EE as in "see"](#ee-as-in-see) | 2,523 | 2.0% |
| 20 | [AI as in "rain"](#ai-as-in-rain) | 2,324+ | 1.8%+ |

These 20 rules cover the pronunciation of the great majority of English words. The remaining patterns (OO, OW, OI/OY, PH, QU, EI/EY, and others) cover fewer words, but are just as reliable within their range.

## Why English Spelling Seems Harder Than It Is

English spelling's reputation for chaos has four main causes:

1. **The exceptions are common words.** The most frequent words in English (*the, have, said, come, some, done, one, two, once, been, does*) are unusually irregular. They appear in almost every sentence, so irregularity *feels* everywhere even though it is statistically rare.

2. **Several systems coexist.** English borrows from Germanic, French, Latin, and Greek, and each brings its own spelling conventions. *school* follows Greek rules (ch = /k/), *machine* follows French rules (ch = /ʃ/), and *church* follows native English rules (ch = /tʃ/). Each system is reliable on its own terms; the hard part is knowing which one a word belongs to.

3. **A few famous troublemakers.** A handful of truly unpredictable patterns (*ough*, *ow*, some *ea* words) are cited again and again as proof that the whole system is broken. In fact they cover a few hundred words out of 126,000.

4. **Spellings frozen in time.** Words like *knight*, *write*, *know*, and *lamb* keep letters that were once pronounced. The pronunciation changed; the spelling didn't. At least these silent letters are consistent: *kn* is always /n/, *wr* is always /r/, and *mb* at the end of a word always drops the b.

The data tells a different story from the folklore: English spelling is roughly 85% predictable from rules. The other 15% includes true irregularities, but also patterns you can predict from a word's origin. A French word with **ch** almost always says /ʃ/; a Greek word with **ch** almost always says /k/.

For a system with none of these complications, see [Ingglish](/), a respelling of English where every letter always makes the same sound.
