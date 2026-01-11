# Ingglish

[![CI](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml/badge.svg)](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml)

Phonetic English spelling translator. Words are spelled exactly as they sound - no exceptions!

**[Try it live →](https://paultarjan.com/ingglish/)** · **[Spelling Guide](https://paultarjan.com/ingglish/#guide)**

## Overview

Ingglish translates English text into a consistent, phonetic spelling system where each sound has exactly one representation. Using the CMU Pronouncing Dictionary (134,000+ words), it eliminates the irregularities and exceptions that make English spelling notoriously difficult.

### Features

- **Bidirectional translation** - Translate English → Ingglish and back
- **IPA support** - Output in International Phonetic Alphabet with proper stress markers
- **URL translator** - Translate entire web pages with fullscreen viewing
- **Word correspondence** - Interactive hover to see original/translated word pairs
- **Contraction support** - Handles "wouldn't", "can't", "you're", etc.
- **Case preservation** - Maintains capitalization patterns
- **DOM translation** - Translate web pages in-place with hover tooltips

## Packages

This is a monorepo containing:

- **@ingglish/core** - Core text translation library (Node.js & Browser)
- **@ingglish/dom** - DOM translation utilities (Browser only)
- **@ingglish/website** - React website for text and URL translation
- **@ingglish/extension** - Chrome extension for translating any webpage
- **@ingglish/cors-proxy** - Cloudflare Worker CORS proxy for URL translation

## Installation

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
import { translate, reverseTranslateSync } from '@ingglish/core';

// Translate English → Ingglish (async, auto-loads dictionary)
const ingglish = await translate('Hello, world!');
console.log(ingglish); // "Huloh, werld!"

// Translate English → IPA
const ipa = await translate('Hello, world!', 'ipa');
console.log(ipa); // "/həˈloʊ, wɝld!/"

// Translate Ingglish → English (sync, after dictionary loaded)
const english = reverseTranslateSync('huloh, werld!');
console.log(english); // "hello, world!"
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

See [Extension Setup Guide](docs/extension-setup.md) for build and installation instructions.

## Phoneme Mapping

Each sound maps to exactly one spelling:

| Sound | Ingglish | Examples |
|-------|---------|----------|
| Long "e" | ee | bee, see |
| Long "i" | ii | my, time |
| Long "o" | oh | go, show |
| Voiced "th" | dh | the, this |
| Unvoiced "th" | th | think, bath |
| Short "u" | u | but, cup |
| "aw/o" sound | o | caught, law |
| "er" sound | er | bird, her |

See [docs/phoneme-mapping.md](docs/phoneme-mapping.md) for the complete mapping.

## Examples

| English | Ingglish | IPA |
|---------|---------|-----|
| hello | huloh | /həˈloʊ/ |
| world | werld | /wɝld/ |
| beautiful | byootuful | /ˈbjutəfəl/ |
| through | throo | /θɹu/ |
| though | dhoh | /ðoʊ/ |
| thought | thot | /θɔt/ |
| the | dhu | /ðə/ |
| English | Ingglish | /ˈɪŋɡlɪʃ/ |

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
npm run translate "Hello world"

# Reverse translate
npm run translate -- -r "huloh werld"

# Debug round-trip issues
npm run debug:roundtrip "beautiful"
```

See [Performance Guide](docs/performance.md) for profiling and benchmarking scripts.

## How Unknown Words Are Handled

For words not in the CMU dictionary, Ingglish uses a multi-step fallback strategy:

1. **Custom pronunciations** - Known tech terms and brand names (e.g., "GitHub" → "git-hub")
2. **Initialisms** - Spell out as letters (e.g., "URL" → "you-are-ell", "API" → "ay-pee-ii")
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

- [Architecture](docs/architecture.md) - System design, data flow, module structure
- [Contributing](docs/contributing.md) - Development setup and workflow
- [Deployment](docs/deployment.md) - Deploy website, extension, CORS proxy
- [Performance](docs/performance.md) - Profiling and optimization
- [Phoneme Mapping](docs/phoneme-mapping.md) - ARPAbet to Ingglish/IPA tables
- [Troubleshooting](docs/troubleshooting.md) - Common issues and fixes

## License

MIT
