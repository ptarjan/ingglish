# r/webdev or r/programming or r/SideProject

**Title:** I built a Chrome extension that translates any webpage into phonetic English in real time

**Body:**

English spelling is famously inconsistent — "ough" makes 6 different sounds, "colonel" is pronounced "kernel," and there's no way to know how "read" sounds without context.

I built a Chrome extension that rewrites any webpage so every word is spelled the way it sounds. It walks the DOM, preserves all formatting and links, and swaps the text in place. You can toggle between the original and the phonetic version, or use hover mode to see pronunciation only on mouseover.

**Tech stack:**

- Core translator: TypeScript, ~3ms for a full page. Handles punctuation, capitalization, contractions, URLs, code blocks
- Dictionary: 134k words from the CMU Pronouncing Dictionary, loaded on demand via dynamic imports (~200KB compressed)
- Fallback: For words not in the dictionary, a grapheme-to-phoneme engine with 975 context-sensitive rules predicts pronunciation from spelling
- DOM integration: TreeWalker-based text node replacement, MutationObserver for SPAs that load content dynamically
- Website: Vite + React, the same translator runs client-side
- Monorepo: 13 packages, npm workspaces, turbo for builds/tests

**Some fun engineering challenges:**

- Preserving casing across digraphs: "THE" → "DHA" needs to know that "DH" is one sound, not two letters to capitalize independently
- Handling contractions: "don't" needs to split into "do" + "n't" before translation, then rejoin as "dohnt"
- Bidirectional translation: translating back from phonetic to English is lossy because homophones collapse ("their/there/they're" all become "dhair")
- The G2P fallback: 975 rules based on the 1976 NRL/Elovitz letter-to-sound paper, extended for modern English. The letter O alone needs 171 rules

Try it: [ingglish.com](https://ingglish.com) | [Chrome extension](https://ingglish.com) | [Source](https://github.com/ptarjan/ingglish)
