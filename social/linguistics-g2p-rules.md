# r/linguistics or r/dataisbeautiful

**Title:** I wrote 975 rules to predict English pronunciation from spelling — here's where the complexity lives

**Post type:** Image (screenshot of linguistics-g2p-rules.html)

**Body text:**

I built a grapheme-to-phoneme engine based on the Elovitz/NRL letter-to-sound rules (1976), extended with modern patterns. It takes any English word it's never seen and predicts the pronunciation using context-sensitive pattern matching.

The rule format is: `leftContext[TARGET]rightContext → phonemes`. For example, the letter O alone needs 171 rules — more than all 20 consonants combined. 61% of all rules exist just for the 6 vowel letters (A, E, I, O, U, Y).

Some things I learned building this:

- English consonants are mostly well-behaved. B, D, F, J, K, V, and Z barely need any rules. The chaos is concentrated in vowels and a few consonants that do double duty (C, S, G).
- The letter O is the worst offender because it participates in so many digraphs (OO, OU, OW, OI, OA) and each one changes meaning depending on what follows.
- Many rules exist only to handle a single word or word family. English has hundreds of pronunciations that follow no pattern — they're just memorized exceptions.

The full rule set is open source: [github.com/ptarjan/ingglish/blob/main/packages/g2p/src/g2p-rules.ts](https://github.com/ptarjan/ingglish/blob/main/packages/g2p/src/g2p-rules.ts)

You can see the engine in action at [ingglish.com](https://ingglish.com) — it powers the fallback pronunciation for words not in the CMU dictionary.
