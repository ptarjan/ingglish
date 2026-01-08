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

- **@ingglish/core** - Core translation library (Node.js & Browser)
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
import {
  translate,
  reverseTranslate,
  reverseTranslateIPA
} from '@ingglish/core';

// Translate English → Ingglish (async, auto-loads dictionary)
const ingglish = await translate('Hello, world!');
console.log(ingglish); // "hulo, werld!"

// Translate English → IPA
const ipa = await translate('Hello, world!', 'ipa');
console.log(ipa); // "/həˈloʊ, wɝld!/"

// Translate Ingglish → English
const english = await reverseTranslate('hulo, werld!');
console.log(english); // "hello, world!"

// Translate IPA → English
const fromIPA = await reverseTranslateIPA('həˈloʊ wɝld');
console.log(fromIPA); // "hello world"

// Translate DOM elements (browser only)
import { translateDOM } from '@ingglish/core';
await translateDOM(document.body, { outputFormat: 'ingglish' });
```

### Website

```bash
npm run dev -w @ingglish/website
```

Then open http://localhost:3000

### Chrome Extension

```bash
# Build the extension
npm run build -w @ingglish/extension

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select packages/extension/dist
```

## Phoneme Mapping

Each sound maps to exactly one spelling:

| Sound | Ingglish | Examples |
|-------|---------|----------|
| Long "e" | ee | bee, see |
| Long "i" | ai | my, time |
| Long "o" | o | go, show |
| Voiced "th" | dh | the, this |
| Unvoiced "th" | th | think, bath |
| Short "u" | u | but, cup |
| "aw" sound | aw | caught, law |
| "er" sound | er | bird, her |

See [docs/phoneme-mapping.md](docs/phoneme-mapping.md) for the complete mapping.

## Examples

| English | Ingglish | IPA |
|---------|---------|-----|
| hello | hulo | /həˈloʊ/ |
| world | werld | /wɝld/ |
| beautiful | byootuful | /ˈbjutəfəl/ |
| through | throo | /θɹu/ |
| though | dho | /ðoʊ/ |
| thought | thawt | /θɔt/ |
| the | dhu | /ðə/ |
| English | Ingglish | /ˈɪŋɡlɪʃ/ |

## Development

```bash
# Run tests
npm test

# Build all packages
npm run build

# Run website dev server
npm run dev -w @ingglish/website
```

### CLI Scripts

The core package includes useful CLI scripts for translation and debugging:

```bash
cd packages/core

# Translate text to Ingglish (shows word-by-word breakdown)
npm run translate "I'm going to the store"
# Output:
# ✓ "I'm" -> "aim" -> "i'm"
# ✓ "going" -> "going" -> "going"
# Full translation: aim going too dhu stawr

# Reverse translate Ingglish back to English
npm run translate -- -r "aim going too dhu stawr"
# Output: i'm going to the store

# Debug round-trip issues with detailed phoneme analysis
npm run debug:roundtrip "beautiful"
# Shows: CMU phonemes, translation steps, comparison
```

## How Unknown Words Are Handled

For words not in the CMU dictionary, Ingglish uses:

1. **Stemming** - Tries to find a known base word (e.g., "running" → "run" + "ing")
2. **Grapheme-to-phoneme rules** - Falls back to letter-to-sound conversion rules

## Deployment

### Website
Deploy to Vercel or Netlify with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ptarjan/ingglish&root-directory=packages/website)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ptarjan/ingglish)

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

### Chrome Extension
Build and load locally, or publish to Chrome Web Store.

## CI/CD

GitHub Actions workflow included for:
- Running tests on every PR
- Building all packages
- Auto-deploying to Vercel on merge to main

## Documentation

- [API Reference](docs/api-reference.md) - Complete API documentation
- [Phoneme Mapping](docs/phoneme-mapping.md) - How sounds map to spellings
- [Architecture](docs/architecture.md) - System design overview
- [Deployment](docs/deployment.md) - Deployment instructions
- [Extension Setup](docs/extension-setup.md) - Chrome extension guide
- [Contributing](docs/contributing.md) - How to contribute

## License

MIT
