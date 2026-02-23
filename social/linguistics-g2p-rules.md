# r/linguistics or r/dataisbeautiful

**Title:** It takes 975 rules to predict English pronunciation from spelling. The letter O alone needs 171.

**Post type:** Image (screenshot of linguistics-g2p-rules.html)

**Body text:**

I built a grapheme-to-phoneme engine for a side project and the rule distribution surprised me. It's based on the Elovitz/NRL letter-to-sound rules from 1976, extended for modern English. Each rule matches a letter in context — what's to the left, what's to the right — and outputs a phoneme.

The thing that jumped out: 61% of the rules are just for vowels. Consonants are mostly well-behaved — B, D, F, J, K, V, Z barely need anything. But O participates in so many digraphs (OO, OU, OW, OI, OA) that it alone needs more rules than all 20 consonants combined.

A lot of the rules also just handle one word or word family. Not a pattern, just "this specific string of letters makes this specific sound and nothing else works like it."

Rule set is open source if anyone wants to poke at it: [g2p-rules.ts](https://github.com/ptarjan/ingglish/blob/main/packages/g2p/src/g2p-rules.ts)
