# Ingglish

[![CI](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml/badge.svg)](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml)

Phonemic English spelling translator. Every spelling always makes the same sound.

**[Try it live →](https://ingglish.com/)** · **[Spelling Guide](https://ingglish.com/guide)**

## Why?

My 5-year-old is learning to read and I keep having to say "yeah sorry, that letter is silent" and "no, those letters make a different sound in this word." English spelling is broken — "ough" alone has at least six pronunciations (though, through, rough, cough, thought, bough). Ingglish fixes that.

## Overview

Ingglish translates English text into a consistent, phonemic spelling system where each sound has exactly one representation. Using the CMU Pronouncing Dictionary (134,000+ words), it strips away the inconsistencies that make English spelling so hard to learn.

### Features

- **Bidirectional translation** - Translate English → Ingglish and back (see [limitations](#limitations) for homophones)
- **IPA support** - Output in International Phonetic Alphabet with proper stress markers
- **URL translator** - Translate entire web pages with fullscreen viewing
- **Word correspondence** - Interactive hover to see original/translated word pairs
- **Contraction support** - Handles "wouldn't", "can't", "you're", etc.
- **Case preservation** - Maintains capitalization patterns
- **DOM translation** - Translate web pages in-place with hover tooltips

## Packages

This is a monorepo containing:

| Package | Description |
|---------|-------------|
| **ingglish** | Translation API — translate and reverse-translate text |
| **@ingglish/normalize** | Text cleanup, case handling |
| **@ingglish/phonemes** | Phoneme data + ARPAbet/IPA/Ingglish conversion |
| **@ingglish/tokenize** | Tokenization, word patterns |
| **@ingglish/dictionary** | CMU dictionary, lookup, word frequency |
| **@ingglish/fallback** | Unknown word strategies (G2P, stemming, compounds) |
| **@ingglish/dom** | DOM translation utilities (Browser only) |
| **@ingglish/website** | React website for text and URL translation |
| **@ingglish/extension** | Chrome extension for translating any webpage |
| **@ingglish/cors-proxy** | Cloudflare Worker CORS proxy for URL translation |

## Installation

### npm (recommended)

```bash
# Core library (text translation)
npm install ingglish

# DOM utilities (browser translation with tooltips)
npm install @ingglish/dom
```

### From source

```bash
# Clone and install
git clone https://github.com/ptarjan/ingglish.git
cd ingglish
npm install

# Build all packages
npm run build
```

## Usage

### Core Library

```typescript
import { translate, reverseTranslate } from 'ingglish';

// Translate English → Ingglish (async, auto-loads dictionary)
const ingglish = await translate('Hello, world!');
console.log(ingglish); // "Haloh, werld!"

// Translate English → IPA
const ipa = await translate('Hello, world!', 'ipa');
console.log(ipa); // "/həˈloʊ, wɝld!/"

// Translate Ingglish → English (async, loads dictionary + word frequencies)
const english = await reverseTranslate('haloh, werld!');
console.log(english); // "hello, world!"

// Translate IPA → English
const fromIpa = await reverseTranslate('/həˈloʊ, wɝld!/', 'ipa');
console.log(fromIpa); // "hello, world!"
```

### DOM Translation (Browser)

```typescript
import { translateDOM, observeAndTranslate } from '@ingglish/dom';

// Translate DOM elements with tooltips
await translateDOM(document.body, {
  showTooltips: true,
  chunked: true, // Smooth rendering for large pages
});

// Auto-translate dynamic content (SPAs)
const stop = observeAndTranslate(document.body);
// Later: stop() to disconnect observer
```

### Website

```bash
npm run dev -w @ingglish/website
```

Then open http://localhost:3000

### Chrome Extension

```bash
npm run build -w @ingglish/extension
```

Then load `packages/extension/dist` as an unpacked extension in Chrome (`chrome://extensions` > Developer mode > Load unpacked).

## Phoneme Mapping

Each sound maps to exactly one spelling:

| Sound | Ingglish | Examples |
|-------|---------|----------|
| Long "e" | ee | bee, see |
| Long "i" | ai | my, time |
| Long "o" | oh | go, show |
| Voiced "th" | dh | the, this |
| Unvoiced "th" | th | think, bath |
| Short "u" | uh | but, cup |
| "o" sound | o | hot, rock |
| "aw" sound | aw | thought, law |
| "er" sound | er | bird, her |

See [docs/phoneme-mapping.md](docs/phoneme-mapping.md) for the complete mapping.

## Examples

| English | Ingglish | IPA |
|---------|---------|-----|
| hello | haloh | /həˈloʊ/ |
| world | werld | /wɝld/ |
| beautiful | byootafal | /ˈbjutəfəl/ |
| through | throo | /θɹu/ |
| though | dhoh | /ðoʊ/ |
| thought | thawt | /θɔt/ |
| the | dha | /ðə/ |
| English | Ingglish | /ˈɪŋɡlɪʃ/ |

> **About the name:** "Ingglish" is simply how you spell "English" in Ingglish! When speaking, you can distinguish them by stressing the first syllable and pausing briefly between the two g's: **ING·glish** vs. English.

## Limitations

### Homophones

English has many words that sound identical but are spelled differently (homophones). Since Ingglish is purely phonemic, these words merge into a single spelling:

| English | Ingglish |
|---------|----------|
| to, too, two | too |
| their, there, they're | dhair |
| sea, see | see |
| eye, I | ai |

**Forward translation** (English → Ingglish) is deterministic — each word always produces the same Ingglish spelling based on its CMU dictionary pronunciation.

**Reverse translation** (Ingglish → English) uses word frequency to pick the most common word, which may not be what you intended. For example:
- `kyoo` reverses to "q" (not "queue" or "cue")
- `ail` could be "aisle", "I'll", or "isle" (ambiguous)

This is an inherent trade-off of phonemic spelling — we gain consistency but lose the ability to distinguish homophones in writing.

### Numbers

Numbers remain as digits (e.g., "123" stays "123"). If you want phonetic numbers, spell them out first: "one hundred twenty three" → "wuhn hundred twentee three".

## Development

```bash
npm test                           # Run all tests
npm run build                      # Build all packages
npm run dev -w @ingglish/website   # Run website dev server
```

See [Contributing Guide](docs/contributing.md) for detailed development workflow, testing guidelines, and code style.

### CLI Scripts

```bash
cd packages/core

# Translate text (shows word-by-word breakdown)
npm run translate -- "Hello world"

# Reverse translate
npm run translate -- -r "haloh werld"

# Debug round-trip issues
npm run debug:roundtrip -- "beautiful"
```

See [Performance Guide](docs/performance.md) for profiling and benchmarking scripts.

## How Unknown Words Are Handled

For words not in the CMU dictionary, Ingglish uses a multi-step fallback strategy:

1. **Custom pronunciations** - Known tech terms and brand names (e.g., "GitHub" → "git-hub")
2. **Initialisms** - Spell out as letters (e.g., "URL" → "you-are-ell", "API" → "ay-pee-ai")
3. **Compound splitting** - Split on common boundaries (e.g., "github" → "git" + "hub")
4. **Stemming** - Find known base word + suffix (e.g., "running" → "run" + "ing")
5. **Neural G2P** - Use grapheme-to-phoneme neural network for complex words
6. **Rule-based G2P** - Fall back to letter-to-sound conversion rules

## Deployment

Deploy the website with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ptarjan/ingglish&root-directory=packages/website)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ptarjan/ingglish)

See [Deployment Guide](docs/deployment.md) for detailed instructions on deploying the website, Chrome extension, and CORS proxy.

## Documentation

### Design
- [Design Decisions](docs/design-decisions.md) - Why Ingglish works the way it does
- [Spelling Reform Comparison](docs/spelling-reform-comparison.md) - How Ingglish avoids the mistakes of 250 years of failed reforms
- [Orthography Comparison](docs/orthography-comparison.md) - How every spelling compares to other languages

### Reference
- [Phoneme Mapping](docs/phoneme-mapping.md) - ARPAbet to Ingglish/IPA tables
- [Architecture](docs/architecture.md) - System design, data flow, module structure
- [Contributing](docs/contributing.md) - Development setup and workflow
- [Deployment](docs/deployment.md) - Deploy website, extension, CORS proxy
- [Performance](docs/performance.md) - Profiling and optimization
- [Troubleshooting](docs/troubleshooting.md) - Common issues and fixes

## License

MIT
