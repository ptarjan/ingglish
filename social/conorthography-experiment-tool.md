# r/conorthography

**Title:** I added language presets to the Ingglish experiment tool — you can now see English respelled with Finnish, Spanish, Italian, or Turkish orthographic conventions

**Body:**

Some of you gave great feedback on my last post, so I wanted to share an update.

The [experiment page](https://ingglish.com/experiment) now has presets for several orthographic traditions. Pick one and it remaps all English phonemes to follow that language's spelling conventions, then flags where the system breaks down (ambiguous spellings, merged phonemes, etc.).

For example, the Finnish preset:
- Maps /j/ to J (not Y)
- Uses double vowels for long sounds (II, UU, OO)
- Maps schwa to O
- Merges voiced/unvoiced fricatives (since Finnish doesn't distinguish them)

It immediately shows you which English phoneme distinctions that language's orthography can't represent.

You can also build your own mapping from scratch — change any phoneme-to-grapheme assignment and see the entire English dictionary update in real time. The collision counter shows how many word pairs become identical under your mapping.

A few things people asked about last time that I've documented:
- [Why "dh" for voiced th](https://ingglish.com/docs/design-decisions) — still the most controversial choice, I know
- [Vowel chain shift tradeoffs](https://ingglish.com/docs/spelling-iteration) — log of every spelling change and why
- [Dialect assumptions](https://ingglish.com/docs/dialect-assumptions) — what GenAm mergers are baked in

Would love to hear if anyone tries building a mapping from their own language's conventions. The Finnish experiment from last time was fascinating — several phoneme distinctions just don't exist in Finnish and the tool surfaces that immediately.
