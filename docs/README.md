# Ingglish Documentation

Ingglish is a phonemic spelling system for English: each spelling always stands for the same sound.

## How the Spelling Was Designed

Read these in order; each page builds on the ones before it.

1. [How It Was Designed](design-decisions.md) - The goals, the constraints, how spellings were judged, and the result
2. [Which Accent](dialect-assumptions.md) - Why Ingglish follows General American pronunciation, and what that means for other accents
3. [How a Spelling Is Scored](metrics.md) - The yardsticks used to judge a sound-to-spelling mapping
4. [Testing Every Alternative](identical-words-analysis.md) - The search that tried every sound with every plausible spelling
5. [Vowels, Sound by Sound](vowel-spellings.md) - The spelling chosen for each vowel, and the alternatives rejected
6. [Consonants, Sound by Sound](consonant-spellings.md) - The spelling chosen for each consonant, and the alternatives rejected
7. [Homophones & False Friends](false-friends.md) - Homophones, the collisions the design refused, and spellings that look like other English words
8. [Word Families](morphological-analysis.md) - Which related words (sign, signal) still look related
9. [How Transparent Is It?](orthographic-transparency.md) - How predictably spelling gives sound, and sound gives spelling
10. [Spelling History](spelling-iteration.md) - Every change to the spelling, in order, and why

## Reference

- [Phoneme Chart](phoneme-mapping.md) - Every sound, with its ARPAbet code, IPA symbol and Ingglish spelling
- [How Other Languages Spell It](orthography-comparison.md) - How each Ingglish spelling compares with 37 languages

## Other Spelling Reforms

- [Spelling Reform History](spelling-reform-comparison.md) - Past reforms, why most failed, and what Ingglish does differently
- [Reforms Proposed Today](community-landscape.md) - A survey of reform proposals posted to r/conorthography

## English Spelling

- [Reading: Letters to Sounds](english-spelling-rules.md) - The rules for reading English aloud
- [Writing: Sounds to Letters](english-spelling-choices.md) - How English chooses a spelling for each sound

## Development

- [Architecture](architecture.md) - How the system is built: packages, modules and data flow
- [Generated API Reference](generated/README.md) - Generated from the TypeScript source
- [Performance](performance.md) - Profiling, benchmarks and optimization
- [Deployment](deployment.md) - Deploying the website, Chrome extension and CORS proxy
- [Contributing](contributing.md) - Local setup, commands and pull requests
- [Troubleshooting](troubleshooting.md) - Common problems and how to fix them
