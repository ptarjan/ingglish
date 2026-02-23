# r/SideProject

**Title:** I built a Chrome extension that rewrites any webpage into phonetic English

**Body:**

Side project that got out of hand. My kid asked why "knife" has a K and I ended up building a full translation engine.

It's a Chrome extension that walks the DOM of any page and swaps every word for its phonetic spelling. Preserves all formatting, links, images — just changes the text. You can toggle back and forth or use hover mode.

The fun engineering problems:

- Casing across digraphs is tricky. "THE" → "DHA" — is that "Dha" or "DHa"? It needs to know "DH" is a single sound
- Contractions: "don't" has to split into "do" + "n't" before translation, then rejoin
- For words not in the dictionary (134k from CMU), there's a fallback engine with 975 pattern-matching rules that guesses pronunciation from spelling. The letter O alone needs 171 rules. English is wild
- SPAs need a MutationObserver to catch dynamically loaded content

Whole thing translates a full page in about 3ms. TypeScript monorepo, 13 packages.

[ingglish.com](https://ingglish.com) | [source](https://github.com/ptarjan/ingglish)
